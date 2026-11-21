"use client";

// Foto & video kegiatan disimpan dulu di perangkat (IndexedDB, karena terlalu besar untuk localStorage),
// lalu diunggah ke Google Drive yayasan saat guru menekan "Kirim ke Server".

const DB = "rapor-ytbm-media";
const STORE = "media";
export const MAKS_VIDEO_MB = 150;

function buka() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function jalankan(mode, fn) {
  const db = await buka();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const simpanMedia = (id, blob) => jalankan("readwrite", (s) => s.put(blob, id));
export const ambilMedia = (id) => jalankan("readonly", (s) => s.get(id));
export const hapusMedia = (id) => jalankan("readwrite", (s) => s.delete(id));

// Foto dikecilkan (sisi terpanjang 1600px, JPEG) supaya hemat kuota Drive; video disimpan apa adanya.
export async function siapkanMedia(file) {
  if (file.type.startsWith("video/")) {
    if (file.size > MAKS_VIDEO_MB * 1024 * 1024) {
      throw new Error(`Video ${file.name} lebih dari ${MAKS_VIDEO_MB} MB. Potong/kirim versi lebih pendek.`);
    }
    return { jenis: "video", blob: file, mime: file.type || "video/mp4", nama: file.name };
  }
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} bukan foto/video.`);
  const blob = await kecilkanFoto(file, 1600, 0.8);
  return { jenis: "foto", blob, mime: "image/jpeg", nama: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
}

export async function kecilkanFoto(blob, maks, kualitas) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Foto tidak bisa dibuka."));
      i.src = url;
    });
    const skala = Math.min(1, maks / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * skala);
    c.height = Math.round(img.naturalHeight * skala);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((resolve) => c.toBlob(resolve, "image/jpeg", kualitas));
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Foto kecil (data URL) untuk dinilai AI — hemat biaya.
export async function fotoUntukAi(id) {
  const blob = await ambilMedia(id);
  if (!blob) return null;
  const kecil = await kecilkanFoto(blob, 800, 0.7);
  return await new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(kecil);
  });
}
