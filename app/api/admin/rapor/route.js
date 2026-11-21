import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { SEMUA_SUB, subTerisi } from "@/lib/rapor-cp";

const tanggalValid = (t) => /^\d{4}-\d{2}-\d{2}$/.test(t || "");

// Pantauan rapor untuk kepala sekolah (sekolahnya sendiri) dan admin yayasan (semua sekolah).
// Membaca tabel rapor_* yang diisi guru lewat tombol "Kirim ke Server".
export async function GET(req) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Belum terdaftar sebagai admin/kepsek." }, { status: 403 });
  }
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!tanggalValid(from) || !tanggalValid(to)) {
    return NextResponse.json({ error: "Parameter from dan to wajib diisi (YYYY-MM-DD)." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const batasi = (q) => (admin.role === "kepsek" ? q.eq("school_id", admin.schoolId) : q);

  const [teachersRes, schoolsRes, kelasRes, jurnalRes, pinRes, leaveRes] = await Promise.all([
    batasi(supabase.from("teachers").select("id, name, school_id").order("name")),
    supabase.from("schools").select("id, name").order("name"),
    batasi(supabase.from("rapor_kelas").select("id, teacher_id, school_id, nama_kelas, kelompok, semester, jumlah_murid, uploaded_at, data")),
    batasi(supabase.from("rapor_jurnal").select("teacher_id, kelas_id, tanggal, anak_ids").gte("tanggal", from).lte("tanggal", to)),
    supabase.from("rapor_pin").select("teacher_id"),
    batasi(
      supabase.from("leave_requests").select("teacher_id, date").eq("status", "approved").gte("date", from).lte("date", to),
    ),
  ]);
  for (const r of [teachersRes, schoolsRes, kelasRes, jurnalRes, pinRes, leaveRes]) {
    if (r.error) {
      const belumAdaTabel = /rapor_/.test(r.error.message) && /does not exist|schema cache/.test(r.error.message);
      return NextResponse.json(
        { error: belumAdaTabel ? "Database rapor belum disiapkan: jalankan supabase/rapor.sql di Supabase." : r.error.message },
        { status: 500 },
      );
    }
  }

  const sekolahById = Object.fromEntries((schoolsRes.data ?? []).map((s) => [s.id, s.name]));
  const pinAda = new Set((pinRes.data ?? []).map((p) => p.teacher_id));

  const guru = {};
  for (const t of teachersRes.data ?? []) {
    guru[t.id] = {
      id: t.id,
      nama: t.name,
      schoolId: t.school_id,
      sekolah: sekolahById[t.school_id] || "",
      pinAda: pinAda.has(t.id),
      kelas: [],
      harian: {}, // tanggal -> {catatan, ceklis}
      izin: [],
      terakhirKirim: null,
    };
  }

  for (const k of kelasRes.data ?? []) {
    const g = guru[k.teacher_id];
    if (!g) continue;
    const sem = k.data?.sem?.[k.semester] || {};
    const murid = k.data?.murid || [];
    const nilai = sem.nilai || {};
    const rataBukti = murid.length
      ? murid.reduce((n, m) => n + SEMUA_SUB.filter((s) => subTerisi(s, nilai[m.id])).length, 0) / murid.length
      : 0;
    const rencanaMinggu = Object.entries(sem.minggu || {})
      .filter(([senin, r]) => senin >= addDays(from, -6) && senin <= to && (r.tp?.length || r.tema))
      .map(([senin, r]) => ({ senin, tema: r.tema, subTema: r.subTema, jumlahTp: r.tp?.length || 0 }));
    // Ceklis harian juga dihitung sebagai aktivitas pada hari itu.
    for (const [tgl, perAnak] of Object.entries(sem.ceklis || {})) {
      if (tgl < from || tgl > to) continue;
      const n = Object.values(perAnak).filter((l) => l?.length).length;
      if (!n) continue;
      g.harian[tgl] = g.harian[tgl] || { catatan: 0, ceklis: 0 };
      g.harian[tgl].ceklis += n;
    }
    g.kelas.push({
      id: k.id,
      nama: k.nama_kelas,
      kelompok: k.kelompok,
      semester: k.semester,
      jumlahMurid: k.jumlah_murid,
      rataBukti: Math.round(rataBukti * 10) / 10,
      narasiSiap: murid.filter((m) => sem.rapor?.[m.id]?.agama).length,
      rencanaMinggu,
      ppm: (sem.ppm || []).length,
      terakhirKirim: k.uploaded_at,
    });
    if (!g.terakhirKirim || k.uploaded_at > g.terakhirKirim) g.terakhirKirim = k.uploaded_at;
  }

  for (const j of jurnalRes.data ?? []) {
    const g = guru[j.teacher_id];
    if (!g || !j.tanggal) continue;
    g.harian[j.tanggal] = g.harian[j.tanggal] || { catatan: 0, ceklis: 0 };
    g.harian[j.tanggal].catatan += 1;
  }
  for (const l of leaveRes.data ?? []) guru[l.teacher_id]?.izin.push(l.date);

  return NextResponse.json({
    from,
    to,
    role: admin.role,
    guru: Object.values(guru).sort((a, b) => a.sekolah.localeCompare(b.sekolah) || a.nama.localeCompare(b.nama)),
  });
}

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
