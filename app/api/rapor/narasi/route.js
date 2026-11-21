import { NextResponse } from "next/server";
import { susunNarasi, UserFacingError } from "@/lib/rapor-ai";
import { LINGKUP_BY_ID, SEMUA_SUB, DIMENSI } from "@/lib/rapor-cp";
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

    // Hanya terima id lingkup/sub-elemen yang dikenal, dengan level dalam rentang yang sah.
    const nilai = {};
    for (const [id, v] of Object.entries(body.nilai || {})) {
      const l = LINGKUP_BY_ID[id];
      const n = Number(v);
      if (l && Number.isInteger(n) && n >= 0 && n <= l.tp.length) nilai[id] = n;
    }
    const bukti = {};
    for (const s of SEMUA_SUB) {
      if (body.bukti?.[s.id]) bukti[s.id] = teks(body.bukti[s.id], 2000);
    }
    const catatan = (Array.isArray(body.catatan) ? body.catatan : [])
      .slice(0, 200)
      .map((c) => ({ tanggal: teks(c.tanggal, 20), isi: teks(c.isi, 3000) }))
      .filter((c) => c.isi.trim());

    const ppm = (Array.isArray(body.ppm) ? body.ppm : [])
      .slice(0, 300)
      .filter((x) => LINGKUP_BY_ID[x.lingkup_id] && typeof x.muncul === "boolean")
      .map((x) => ({
        minggu: teks(x.minggu, 10),
        tema: teks(x.tema, 200),
        teks: teks(x.teks, 300),
        lingkup_id: x.lingkup_id,
        muncul: x.muncul,
      }));

    if (!Object.keys(nilai).length && !Object.keys(bukti).length && !catatan.length && !ppm.length) {
      throw new UserFacingError("Belum ada penilaian, bukti, atau catatan harian untuk anak ini.");
    }

    const k = body.kelas || {};
    const kk = body.koku || {};
    const hasil = await susunNarasi({
      anak: { nama: teks(anak.nama), panggilan: teks(anak.panggilan), jk: teks(anak.jk, 2) },
      kelas: {
        sekolahNama: teks(k.sekolahNama),
        namaKelas: teks(k.namaKelas),
        kelompok: teks(k.kelompok),
        semester: teks(k.semester, 5),
        ta: teks(k.ta, 20),
      },
      nilai,
      bukti,
      catatan,
      ppm,
      koku: {
        tema: teks(kk.tema, 300),
        kegiatan: teks(kk.kegiatan, 1000),
        bukti: teks(kk.bukti, 2000),
        dimensi: (Array.isArray(kk.dimensi) ? kk.dimensi : []).filter(
          (i) => Number.isInteger(i) && i >= 0 && i < DIMENSI.length,
        ),
      },
    });
    return NextResponse.json(hasil);
  } catch (err) {
    return balasGalat(err, "narasi");
  }
}
