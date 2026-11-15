import { NextResponse } from "next/server";
import { susunNarasi, UserFacingError } from "@/lib/rapor-ai";
import { cekKodeAkses, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 120;

const teks = (v, maks = 200) => String(v ?? "").slice(0, maks);

export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const anak = body.anak || {};
    if (!anak.nama) throw new UserFacingError("Data anak belum lengkap.");
    const catatan = (Array.isArray(body.catatan) ? body.catatan : [])
      .slice(0, 200)
      .map((c) => ({ tanggal: teks(c.tanggal, 20), isi: teks(c.isi, 3000) }))
      .filter((c) => c.isi.trim());
    if (catatan.length === 0) {
      throw new UserFacingError("Belum ada catatan harian untuk anak ini. Tambahkan catatan dulu.");
    }
    const k = body.kelas || {};
    const hasil = await susunNarasi({
      anak: { nama: teks(anak.nama), panggilan: teks(anak.panggilan), jk: teks(anak.jk, 2) },
      kelas: {
        sekolahNama: teks(k.sekolahNama),
        namaKelas: teks(k.namaKelas),
        kelompok: teks(k.kelompok),
        semester: teks(k.semester, 5),
        ta: teks(k.ta, 20),
      },
      catatan,
    });
    return NextResponse.json(hasil);
  } catch (err) {
    return balasGalat(err, "narasi");
  }
}
