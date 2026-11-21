import { NextResponse } from "next/server";
import { evaluasiHarian, UserFacingError } from "@/lib/rapor-ai";
import { rapikanRencana } from "@/lib/rapor-rencana";
import { cekKodeAkses, parseFoto, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 120;

// Nilai kesesuaian laporan harian guru dengan rencana PPM minggu itu.
export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const rencana = rapikanRencana(body.rencana);
    if (!rencana.tp.length && !rencana.kegiatan.length) {
      throw new UserFacingError("Belum ada rencana (PPM) untuk minggu ini, jadi kesesuaian belum bisa dinilai.");
    }
    const jurnal = (Array.isArray(body.jurnal) ? body.jurnal : [])
      .slice(0, 60)
      .map((j) => ({
        isi: String(j.isi || "").slice(0, 3000),
        anakIds: Array.isArray(j.anakIds) ? j.anakIds.slice(0, 80).map(String) : [],
        label: Array.isArray(j.label) ? j.label.slice(0, 10) : [],
      }))
      .filter((j) => j.isi.trim());
    const foto = Array.isArray(body.foto) && body.foto.length ? parseFoto(body.foto.slice(0, 4)) : [];
    if (!jurnal.length && !foto.length) throw new UserFacingError("Belum ada laporan untuk hari ini.");
    const murid = (Array.isArray(body.murid) ? body.murid : [])
      .slice(0, 80)
      .map((m) => ({ id: String(m.id), nama: String(m.nama || ""), panggilan: String(m.panggilan || "") }));
    return NextResponse.json(
      await evaluasiHarian({ tanggal: String(body.tanggal || "").slice(0, 10), rencana, jurnal, murid, foto }),
    );
  } catch (err) {
    return balasGalat(err, "evaluasi-harian");
  }
}
