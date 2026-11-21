import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { periksaPin } from "@/lib/rapor-pin";

export const maxDuration = 60;

const teks = (v, maks = 200) => String(v ?? "").slice(0, maks);
const tanggalValid = (t) => (/^\d{4}-\d{2}-\d{2}$/.test(t || "") ? t : null);

// Guru mengirim data rapor kelasnya (yang sudah direview di perangkat) ke server. Dilindungi PIN guru.
// Hanya menulis ke tabel rapor_* — tidak menyentuh tabel absensi.
export async function POST(request) {
  try {
    const body = await request.json();
    const d = body.data || {};
    const kelas = d.kelas || {};
    const pin = String(body.pin || "");
    const kelasId = teks(kelas.id, 40);
    const guruId = teks(kelas.guruId, 100);
    if (!kelasId || !guruId) {
      return NextResponse.json({ error: "Data kelas belum lengkap: pilih nama guru di tab Kelas." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: guru } = await supabase.from("teachers").select("id, name, school_id").eq("id", guruId).maybeSingle();
    if (!guru) return NextResponse.json({ error: "Nama guru tidak ditemukan di data yayasan." }, { status: 400 });

    const salahPin = await periksaPin(supabase, guru.id, pin);
    if (salahPin) return NextResponse.json({ error: salahPin }, { status: 401 });

    const { data: lama } = await supabase.from("rapor_kelas").select("teacher_id, uploaded_at").eq("id", kelasId).maybeSingle();
    if (lama && lama.teacher_id !== guru.id) {
      return NextResponse.json({ error: "Kelas ini sudah terdaftar atas nama guru lain." }, { status: 403 });
    }
    // Data di server lebih baru dari yang terakhir diketahui perangkat ini (dikirim dari perangkat lain):
    // minta konfirmasi dulu supaya tidak tertimpa tanpa sengaja.
    const diketahui = kelas.terakhirKirim ? new Date(kelas.terakhirKirim).getTime() : 0;
    if (lama && !body.paksa && new Date(lama.uploaded_at).getTime() > diketahui + 5000) {
      return NextResponse.json(
        {
          error: "Data kelas ini di server lebih baru — sudah dikirim dari perangkat lain.",
          konflik: true,
          serverWaktu: lama.uploaded_at,
        },
        { status: 409 },
      );
    }

    const murid = (Array.isArray(d.murid) ? d.murid : []).slice(0, 80);
    const sem = { 1: d.sem?.["1"] || {}, 2: d.sem?.["2"] || {} };
    const jurnalRows = [];
    for (const k of ["1", "2"]) {
      for (const j of (Array.isArray(sem[k].jurnal) ? sem[k].jurnal : []).slice(0, 5000)) {
        if (j.status !== "direview") continue;
        jurnalRows.push({
          kelas_id: kelasId,
          id: teks(j.id, 40),
          teacher_id: guru.id,
          school_id: guru.school_id,
          semester: k,
          tanggal: tanggalValid(j.tanggal),
          isi: teks(j.isi, 4000),
          anak_ids: Array.isArray(j.anakIds) ? j.anakIds.slice(0, 80).map((x) => teks(x, 40)) : [],
          label: Array.isArray(j.label) ? j.label.slice(0, 20) : [],
          sumber: teks(j.sumber, 20),
        });
      }
    }

    const waktuUpload = new Date().toISOString();
    const { error: e1 } = await supabase.from("rapor_kelas").upsert({
      id: kelasId,
      teacher_id: guru.id,
      school_id: guru.school_id,
      nama_kelas: teks(kelas.namaKelas, 100),
      kelompok: teks(kelas.kelompok, 20),
      ta: teks(kelas.ta, 20),
      semester: kelas.semester === "2" ? "2" : "1",
      jumlah_murid: murid.length,
      data: { kelas, murid, sem },
      uploaded_at: waktuUpload,
    });
    if (e1) throw e1;

    // Ganti jurnal kelas ini di server dengan versi terbaru dari perangkat guru.
    const { error: e2 } = await supabase.from("rapor_jurnal").delete().eq("kelas_id", kelasId);
    if (e2) throw e2;
    for (let i = 0; i < jurnalRows.length; i += 500) {
      const { error: e3 } = await supabase.from("rapor_jurnal").insert(jurnalRows.slice(i, i + 500));
      if (e3) throw e3;
    }
    // Rencana mingguan (PPM): catat waktu PERTAMA kali masuk server (untuk tepat/terlambat).
    const { data: rencanaLama } = await supabase.from("rapor_rencana").select("senin").eq("kelas_id", kelasId);
    const sudahAda = new Set((rencanaLama || []).map((r) => r.senin));
    const sekarang = new Date().toISOString();
    for (const k of ["1", "2"]) {
      for (const [senin, r] of Object.entries(sem[k].minggu || {})) {
        if (!tanggalValid(senin) || !(r?.tp?.length || r?.kegiatan?.length)) continue;
        const baris = { teacher_id: guru.id, school_id: guru.school_id, data: r, diperbarui: sekarang };
        const { error: e4 } = sudahAda.has(senin)
          ? await supabase.from("rapor_rencana").update(baris).eq("kelas_id", kelasId).eq("senin", senin)
          : await supabase.from("rapor_rencana").insert({ ...baris, kelas_id: kelasId, senin, dikirim_pertama: sekarang });
        if (e4) throw e4;
        sudahAda.add(senin);
      }
    }

    await supabase
      .from("rapor_kiriman")
      .insert({ kelas_id: kelasId, teacher_id: guru.id, school_id: guru.school_id, jumlah_jurnal: jurnalRows.length });

    return NextResponse.json({ ok: true, jurnal: jurnalRows.length, murid: murid.length, uploaded_at: waktuUpload });
  } catch (err) {
    console.error("[rapor] kirim:", err);
    const pesan = String(err?.message || "");
    const belumAdaTabel = /rapor_/.test(pesan) && /does not exist|schema cache/.test(pesan);
    return NextResponse.json(
      {
        error: belumAdaTabel
          ? "Database rapor belum disiapkan. Admin perlu menjalankan supabase/rapor.sql di Supabase."
          : "Gagal mengirim ke server. Coba lagi sebentar.",
      },
      { status: 500 },
    );
  }
}
