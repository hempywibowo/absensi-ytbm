import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { periksaPin } from "@/lib/rapor-pin";
import { buatSesiUnggah, driveSiap } from "@/lib/rapor-drive";

const teks = (v, n) => String(v ?? "").slice(0, n);
const MAKS_BYTE = 160 * 1024 * 1024;

// Guru meminta "tiket" unggah foto/video kegiatan ke Google Drive yayasan. Dilindungi PIN guru.
// File-nya sendiri diunggah browser langsung ke Google, bukan lewat server ini.
export async function POST(request) {
  try {
    if (!driveSiap()) {
      return NextResponse.json(
        { error: "Penyimpanan Google Drive yayasan belum disiapkan admin. Foto/video tetap aman di perangkat." },
        { status: 503 },
      );
    }
    const body = await request.json();
    const guruId = teks(body.guruId, 100);
    const kelasId = teks(body.kelasId, 40);
    const m = body.media || {};
    const ukuran = Number(m.ukuran);
    if (!guruId || !kelasId || !m.id || !/^(image|video)\//.test(m.mime || "") || !(ukuran > 0 && ukuran <= MAKS_BYTE)) {
      return NextResponse.json({ error: "Data media tidak valid." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: guru } = await supabase.from("teachers").select("id, name, school_id").eq("id", guruId).maybeSingle();
    if (!guru) return NextResponse.json({ error: "Guru tidak ditemukan." }, { status: 400 });
    const salahPin = await periksaPin(supabase, guru.id, String(body.pin || ""));
    if (salahPin) return NextResponse.json({ error: salahPin }, { status: 401 });

    const { data: kelas } = await supabase.from("rapor_kelas").select("teacher_id").eq("id", kelasId).maybeSingle();
    if (kelas && kelas.teacher_id !== guru.id) {
      return NextResponse.json({ error: "Kelas ini terdaftar atas nama guru lain." }, { status: 403 });
    }
    const { data: sekolah } = await supabase.from("schools").select("name").eq("id", guru.school_id).maybeSingle();

    const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(m.tanggal || "") ? m.tanggal : "tanpa-tanggal";
    const ext = (teks(m.nama, 200).match(/\.[a-z0-9]{2,5}$/i) || [m.mime.startsWith("video/") ? ".mp4" : ".jpg"])[0];
    const url = await buatSesiUnggah({
      folderNama: [sekolah?.name || guru.school_id, `${teks(body.namaKelas, 60) || "Kelas"} (${kelasId})`, tanggal.slice(0, 7)],
      namaFile: `${tanggal}_${guru.name.split(",")[0]}_${teks(m.id, 40)}${ext}`,
      mime: m.mime,
      ukuran,
      keterangan: teks(m.keterangan, 500),
      origin: request.headers.get("origin") || "",
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[rapor] media-sesi:", err);
    return NextResponse.json({ error: "Gagal menyiapkan unggah ke Google Drive. Coba lagi." }, { status: 500 });
  }
}
