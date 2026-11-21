import { NextResponse } from "next/server";
import { bacaPpm, UserFacingError } from "@/lib/rapor-ai";
import { cekKodeAkses, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 180;

// Menerima isi dokumen PPM (.docx) yang sudah diubah jadi HTML ringkas di HP guru.
export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const html = String(body.html || "");
    if (html.trim().length < 50) throw new UserFacingError("Isi dokumen kosong atau tidak terbaca.");
    if (html.length > 300_000) {
      throw new UserFacingError("Dokumen terlalu panjang. Unggah satu file PPM mingguan per sekali baca.");
    }
    const murid = (Array.isArray(body.murid) ? body.murid : [])
      .slice(0, 80)
      .map((m) => ({ id: String(m.id), nama: String(m.nama || ""), panggilan: String(m.panggilan || "") }));
    return NextResponse.json(await bacaPpm({ html, murid }));
  } catch (err) {
    return balasGalat(err, "baca-ppm");
  }
}
