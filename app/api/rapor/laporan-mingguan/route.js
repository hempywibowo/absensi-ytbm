import { NextResponse } from "next/server";
import { laporanMingguan, UserFacingError } from "@/lib/rapor-ai";
import { rapikanRencana } from "@/lib/rapor-rencana";
import { cekKodeAkses, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 180;

// Laporan aktivitas mingguan: rencana PPM vs pelaksanaan harian, saran, dan asesmen awal minggu depan.
export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const rencana = rapikanRencana(body.rencana);
    if (!rencana.tp.length && !rencana.kegiatan.length) {
      throw new UserFacingError("Belum ada rencana (PPM) untuk minggu ini.");
    }
    const murid = (Array.isArray(body.murid) ? body.murid : [])
      .slice(0, 80)
      .map((m) => ({ id: String(m.id), nama: String(m.nama || ""), panggilan: String(m.panggilan || "") }));
    const hari = (Array.isArray(body.hari) ? body.hari : []).slice(0, 7).map((h) => ({
      tanggal: String(h.tanggal || "").slice(0, 10),
      evaluasi: h.evaluasi && typeof h.evaluasi.skor === "number" ? { skor: h.evaluasi.skor } : null,
      jurnal: (Array.isArray(h.jurnal) ? h.jurnal : []).slice(0, 60).map((j) => ({
        isi: String(j.isi || "").slice(0, 2000),
        anakIds: Array.isArray(j.anakIds) ? j.anakIds.slice(0, 80).map(String) : [],
      })),
      ceklis: String(h.ceklis || "").slice(0, 2000),
      tpAnak: h.tpAnak && typeof h.tpAnak === "object" ? h.tpAnak : {},
    }));
    if (!hari.some((h) => h.jurnal.length || h.ceklis)) throw new UserFacingError("Belum ada laporan harian minggu ini.");
    return NextResponse.json(await laporanMingguan({ senin: String(body.senin || "").slice(0, 10), rencana, hari, murid }));
  } catch (err) {
    return balasGalat(err, "laporan-mingguan");
  }
}
