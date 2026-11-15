import { NextResponse } from "next/server";
import { bacaCatatanHarian } from "@/lib/rapor-ai";
import { cekKodeAkses, parseFoto, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 120;

export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const foto = parseFoto(body.foto);
    const murid = (Array.isArray(body.murid) ? body.murid : [])
      .slice(0, 80)
      .map((m) => ({ id: String(m.id), nama: String(m.nama || ""), panggilan: String(m.panggilan || "") }));
    const ids = new Set(murid.map((m) => m.id));
    const anakIdTetap = body.anakId && ids.has(String(body.anakId)) ? String(body.anakId) : "";

    const hasil = await bacaCatatanHarian(foto, murid, anakIdTetap);
    // Buang anak_id yang gak ada di daftar (jaga-jaga AI salah tebak id).
    hasil.catatan = hasil.catatan.map((c) => ({
      ...c,
      anak_id: anakIdTetap || (ids.has(c.anak_id) ? c.anak_id : ""),
    }));
    return NextResponse.json(hasil);
  } catch (err) {
    return balasGalat(err, "baca-catatan");
  }
}
