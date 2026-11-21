import { NextResponse } from "next/server";
import { usulkanPenilaian, UserFacingError } from "@/lib/rapor-ai";
import { cekKodeAkses, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 120;

export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const nama = String(body.anak?.nama || "").slice(0, 200);
    if (!nama) throw new UserFacingError("Data anak belum lengkap.");
    const catatan = (Array.isArray(body.catatan) ? body.catatan : [])
      .slice(0, 200)
      .map((c) => ({ tanggal: String(c.tanggal || "").slice(0, 20), isi: String(c.isi || "").slice(0, 3000) }))
      .filter((c) => c.isi.trim());
    if (!catatan.length) {
      throw new UserFacingError("Belum ada catatan harian untuk anak ini. Tambahkan catatan dulu.");
    }
    return NextResponse.json(await usulkanPenilaian({ anak: { nama }, catatan }));
  } catch (err) {
    return balasGalat(err, "usul-penilaian");
  }
}
