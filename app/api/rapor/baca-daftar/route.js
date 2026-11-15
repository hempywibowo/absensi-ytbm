import { NextResponse } from "next/server";
import { bacaDaftarMurid } from "@/lib/rapor-ai";
import { cekKodeAkses, parseFoto, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 120;

export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const hasil = await bacaDaftarMurid(parseFoto(body.foto));
    return NextResponse.json(hasil);
  } catch (err) {
    return balasGalat(err, "baca-daftar");
  }
}
