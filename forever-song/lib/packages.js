// Paket & harga. Ubah di sini kalau mau ganti harga/isi paket.
export const PACKAGES = [
  {
    id: "basic",
    name: "Basic",
    price: 99000,
    normalPrice: 149000,
    features: ["1 lagu lengkap (MP3)", "Lirik lengkap", "Halaman lagu yang bisa dibagikan"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 169000,
    normalPrice: 249000,
    popular: true,
    features: ["2 versi lagu (MP3)", "Lirik lengkap + chord", "Revisi lirik 1x", "Halaman lagu yang bisa dibagikan"],
  },
  {
    id: "spesial",
    name: "Spesial",
    price: 279000,
    normalPrice: 399000,
    features: ["Semua isi Premium", "Video lirik untuk status WA/IG", "Prioritas jadi dalam 24 jam"],
  },
];

export function findPackage(id) {
  return PACKAGES.find((p) => p.id === id) ?? null;
}

export function rupiah(n) {
  return "Rp" + Number(n).toLocaleString("id-ID");
}

// 0812xxxx / +62812xxxx / 62812xxxx  ->  62812xxxx ; null kalau tidak valid
export function normalizeWhatsapp(raw) {
  let n = String(raw || "").replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return /^628\d{7,12}$/.test(n) ? n : null;
}
