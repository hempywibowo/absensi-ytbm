"use client";

// Semua data rapor (kelas, murid, catatan, narasi) disimpan di perangkat guru (localStorage),
// TIDAK di database absensi. Foto tidak disimpan — cuma teks hasil bacaannya.

const KUNCI = "rapor-ytbm:v1";
const KUNCI_KODE = "rapor-ytbm:kode";

export const KELOMPOK = [
  { id: "KB", label: "Kelompok Bermain / Kober (3-4 tahun)" },
  { id: "TK A", label: "TK Kelompok A (4-5 tahun)" },
  { id: "TK B", label: "TK Kelompok B (5-6 tahun)" },
];

export const ELEMEN = [
  { id: "agama", judul: "Nilai Agama dan Budi Pekerti" },
  { id: "jati_diri", judul: "Jati Diri" },
  {
    id: "literasi",
    judul: "Dasar-dasar Literasi, Matematika, Sains, Teknologi, Rekayasa, dan Seni",
  },
];

function tahunAjaranSekarang() {
  const d = new Date();
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

export function dataKosong() {
  return {
    kelas: {
      sekolahId: "",
      sekolahNama: "",
      sekolahAlamat: "",
      namaKelas: "",
      kelompok: "",
      guru: "",
      kepsek: "",
      ta: tahunAjaranSekarang(),
      semester: new Date().getMonth() >= 6 ? "1" : "2",
      tempat: "Kab. Bandung",
      tanggalRapor: "",
    },
    murid: [], // {id, nama, panggilan, jk, nisn}
    catatan: {}, // catatan[muridId] = [{id, tanggal, isi, sumber}]
    rapor: {}, // rapor[muridId] = {agama, jati_diri, literasi, kurang:{}, saran, tb, bb, lk, sakit, izin, alfa}
  };
}

export function muatData() {
  try {
    const raw = localStorage.getItem(KUNCI);
    if (!raw) return dataKosong();
    const d = JSON.parse(raw);
    const kosong = dataKosong();
    return {
      ...kosong,
      ...d,
      kelas: { ...kosong.kelas, ...(d.kelas || {}) },
      murid: Array.isArray(d.murid) ? d.murid : [],
      catatan: d.catatan || {},
      rapor: d.rapor || {},
    };
  } catch {
    return dataKosong();
  }
}

export function simpanData(d) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function idBaru() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function ambilKode() {
  try {
    return localStorage.getItem(KUNCI_KODE) || "";
  } catch {
    return "";
  }
}
export function simpanKode(k) {
  try {
    localStorage.setItem(KUNCI_KODE, k);
  } catch {}
}

// Perkecil foto di HP sebelum dikirim: sisi terpanjang maks 1600px (tulisan tangan tetap terbaca),
// JPEG, dan diturunkan kualitasnya sampai < ~900 KB.
export async function kompresFoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Foto tidak bisa dibuka."));
      i.src = url;
    });
    const MAKS = 1600;
    const skala = Math.min(1, MAKS / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * skala);
    canvas.height = Math.round(img.naturalHeight * skala);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let q = 0.82;
    let hasil = canvas.toDataURL("image/jpeg", q);
    while (hasil.length > 1_200_000 && q > 0.4) {
      q -= 0.12;
      hasil = canvas.toDataURL("image/jpeg", q);
    }
    return hasil;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function panggilApi(jalur, body) {
  let res;
  try {
    res = await fetch(`/api/rapor/${jalur}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-rapor-kode": ambilKode() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(json.error || `Gagal (${res.status}).`);
    e.butuhKode = Boolean(json.butuhKode);
    throw e;
  }
  return json;
}

export function unduhCadangan(d) {
  const blob = new Blob([JSON.stringify(d, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const nama = [d.kelas.sekolahNama, d.kelas.namaKelas, `Sem${d.kelas.semester}`]
    .filter(Boolean)
    .join("_")
    .replace(/[^\w-]+/g, "-");
  a.download = `Cadangan-Rapor_${nama || "kelas"}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function tanggalIndo(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function hariIniISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
