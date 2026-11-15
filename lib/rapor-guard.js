import "server-only";
import { NextResponse } from "next/server";
import { UserFacingError } from "./rapor-ai";

const MAKS_FOTO = 4;
const MAKS_BYTE_PER_FOTO = 3 * 1024 * 1024; // setelah dikompres di HP biasanya < 1 MB
const TIPE_DIIZINKAN = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Kode akses opsional: kalau env RAPOR_KODE_AKSES diisi, guru wajib memasukkan kode yang sama
// di halaman /rapor. Ini mencegah orang luar memakai fitur AI (yang berbayar) lewat URL publik.
export function cekKodeAkses(request) {
  const kode = process.env.RAPOR_KODE_AKSES;
  if (!kode) return null;
  if (request.headers.get("x-rapor-kode") === kode) return null;
  return NextResponse.json(
    { error: "Kode akses rapor salah atau belum diisi.", butuhKode: true },
    { status: 401 },
  );
}

// "data:image/jpeg;base64,...." -> { mediaType, data }
export function parseFoto(list) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new UserFacingError("Belum ada foto yang dikirim.");
  }
  if (list.length > MAKS_FOTO) {
    throw new UserFacingError(`Maksimal ${MAKS_FOTO} foto sekali kirim.`);
  }
  return list.map((dataUrl) => {
    const m = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ""));
    if (!m || !TIPE_DIIZINKAN.has(m[1])) {
      throw new UserFacingError("Format foto tidak didukung. Pakai JPG atau PNG.");
    }
    if ((m[2].length * 3) / 4 > MAKS_BYTE_PER_FOTO) {
      throw new UserFacingError("Ukuran foto terlalu besar.");
    }
    return { mediaType: m[1], data: m[2] };
  });
}

export function balasGalat(err, label) {
  if (err instanceof UserFacingError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  console.error(`[rapor] ${label}:`, err);
  return NextResponse.json(
    { error: "Server sedang sibuk atau terjadi gangguan. Coba lagi sebentar." },
    { status: 500 },
  );
}
