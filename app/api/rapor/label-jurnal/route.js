import { NextResponse } from "next/server";
import { labelJurnal, UserFacingError } from "@/lib/rapor-ai";
import { cekKodeAkses, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 120;

export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const entri = (Array.isArray(body.entri) ? body.entri : [])
      .slice(0, 30)
      .map((e) => ({ id: String(e.id || "").slice(0, 40), isi: String(e.isi || "").slice(0, 3000) }))
      .filter((e) => e.id && e.isi.trim());
    if (!entri.length) throw new UserFacingError("Tidak ada catatan untuk diberi label.");
    const murid = (Array.isArray(body.murid) ? body.murid : [])
      .slice(0, 80)
      .map((m) => ({ id: String(m.id), nama: String(m.nama || ""), panggilan: String(m.panggilan || "") }));
    const tpMinggu = (Array.isArray(body.tpMinggu) ? body.tpMinggu : [])
      .slice(0, 12)
      .map((t) => ({ lingkup_id: String(t.lingkup_id || ""), level: Number(t.level) || 1 }));
    return NextResponse.json(await labelJurnal({ entri, murid, tpMinggu }));
  } catch (err) {
    return balasGalat(err, "label-jurnal");
  }
}
