"use client";

// Data rapor dikerjakan di perangkat guru (localStorage) sebagai draf: bisa diubah-ubah dan direview
// dulu. Setelah guru menekan "Kirim ke Server", data yang sudah direview disalin ke database server
// (tabel khusus rapor, terpisah dari absensi) untuk dashboard kepala sekolah/admin.
// Foto tidak pernah disimpan — cuma teks hasil bacaannya.

const KUNCI = "rapor-ytbm:v1";
const KUNCI_KODE = "rapor-ytbm:kode";
const KUNCI_PIN = "rapor-ytbm:pin";

export function ambilPin() {
  try {
    return localStorage.getItem(KUNCI_PIN) || "";
  } catch {
    return "";
  }
}
export function simpanPin(p) {
  try {
    if (p) localStorage.setItem(KUNCI_PIN, p);
    else localStorage.removeItem(KUNCI_PIN);
  } catch {}
}

export const KELOMPOK = [
  { id: "KB", label: "Kelompok Bermain / Kober (3-4 tahun)" },
  { id: "TK A", label: "TK Kelompok A (4-5 tahun)" },
  { id: "TK B", label: "TK Kelompok B (5-6 tahun)" },
];

export const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Kepercayaan"];

function tahunAjaranSekarang() {
  const d = new Date();
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

export function semesterKosong() {
  return {
    // Jurnal harian: satu entri = satu catatan kegiatan/pengamatan, bisa untuk beberapa anak.
    // status: "draf" (baru, belum direview) | "direview" (siap dikirim). AI memberi label CP/TP.
    // [{id, tanggal, isi, anakIds, label: [{lingkup_id, level}], sumber, status, ppmId?,
    //   media: [{id, jenis: "foto"|"video", nama, mime, ukuran, driveId?}]}]  (file media di IndexedDB)
    jurnal: [],
    // Rencana mingguan (dari PPM yang diunggah Jumat sebelumnya, atau diisi manual):
    // minggu[tanggal Senin] = {tema, subTema, tp: [{lingkup_id, level}], dpl: [idx], kegiatan: [{fase, teks}],
    //                          pemantik: [..], asesmenAwal, sumber: "ppm"|"manual", file}
    minggu: {},
    evaluasi: {}, // evaluasi[tanggal] = {skor, ringkasan, kegiatan: [{no, status}], tp_teramati: [no], luar_rencana, dibuat}
    laporan: {}, // laporan[tanggal Senin] = laporan aktivitas mingguan (rencana vs pelaksanaan + asesmen awal)
    ceklis: {}, // ceklis[tanggal][muridId] = ["lingkupId:level", ...] TP yang muncul hari itu
    nilai: {}, // nilai[muridId][lingkupId] = 0..n (lihat lib/rapor-cp.js)
    bukti: {}, // bukti[muridId][subId] = teks bukti pengamatan
    koku: { tema: "", kegiatan: "" }, // kokurikuler kelas semester ini
    kokuAnak: {}, // kokuAnak[muridId] = {dimensi: [index DIMENSI], bukti}
    rapor: {}, // rapor[muridId] = {agama, jati_diri, literasi, kokurikuler, saran, kurang, tb, bb, lk, sakit, izin, alfa}
    ppm: [], // PPM mingguan: [{id, file, minggu, tanggal, tema, subTema, kegiatan, tp: [{teks, lingkup_id, level}]}]
    hasilPpm: {}, // hasilPpm[muridId][ppmId] = [true|false|null per TP minggu itu]
  };
}

export function dataKosong() {
  return {
    versi: 2,
    kelas: {
      id: idBaru(), // id kelas di server
      guruId: "", // id guru (tabel teachers) pemilik kelas
      terakhirKirim: "", // waktu terakhir berhasil dikirim ke server
      diubah: "", // waktu terakhir ada perubahan di perangkat
      sekolahNama: "",
      sekolahAlamat: "",
      npsn: "",
      namaKelas: "",
      kelompok: "",
      guru: "",
      nipGuru: "",
      pendamping: "",
      kepsek: "",
      nipKepsek: "",
      ta: tahunAjaranSekarang(),
      semester: new Date().getMonth() >= 6 ? "1" : "2",
      tempat: "Kab. Bandung",
      tanggalRapor: "",
      lampiranTP: true,
    },
    murid: [], // {id, nama, panggilan, jk, nisn, nis, tempatLahir, tanggalLahir, agama, ayah, ibu}
    sem: { 1: semesterKosong(), 2: semesterKosong() },
  };
}

// Pastikan data dari versi lama / file cadangan punya bentuk lengkap.
export function rapikanData(d) {
  const kosong = dataKosong();
  const kelas = { ...kosong.kelas, ...(d?.kelas || {}) };
  const sem = { 1: semesterKosong(), 2: semesterKosong() };
  for (const k of ["1", "2"]) {
    const s = d?.sem?.[k] || {};
    sem[k] = { ...sem[k], ...s, koku: { ...sem[k].koku, ...(s.koku || {}) } };
  }
  if (!kelas.id) kelas.id = idBaru();
  // Versi 1: catatan & rapor belum dipisah per semester -> masukkan ke semester aktif.
  if (d && !d.sem && (d.catatan || d.rapor)) {
    sem[kelas.semester].catatan = d.catatan || {};
    sem[kelas.semester].rapor = d.rapor || {};
  }
  // Catatan per anak (versi sebelumnya) -> jurnal harian.
  for (const k of ["1", "2"]) {
    const lama = sem[k].catatan;
    if (lama && Object.keys(lama).length) {
      for (const [muridId, list] of Object.entries(lama)) {
        for (const c of list || []) {
          sem[k].jurnal.push({
            id: c.id || idBaru(),
            tanggal: c.tanggal || "",
            isi: c.isi || "",
            anakIds: [muridId],
            label: [],
            sumber: c.sumber || "ketik",
            status: "direview",
            ...(c.ppmId ? { ppmId: c.ppmId } : {}),
          });
        }
      }
    }
    delete sem[k].catatan;
  }
  return { versi: 3, kelas, murid: Array.isArray(d?.murid) ? d.murid : [], sem };
}

export function muatData() {
  try {
    const raw = localStorage.getItem(KUNCI);
    return raw ? rapikanData(JSON.parse(raw)) : dataKosong();
  } catch {
    return dataKosong();
  }
}

// Bukti PPM mingguan untuk satu anak: [{minggu, tema, teks, lingkup_id, level, muncul}]
export function buktiPpmAnak(sem, muridId) {
  const hasil = sem.hasilPpm?.[muridId] || {};
  return (sem.ppm || []).flatMap((p) =>
    p.tp
      .map((t, i) => ({ minggu: p.minggu, tanggal: p.tanggal, tema: p.subTema || p.tema, teks: t.teks, lingkup_id: t.lingkup_id, level: t.level, muncul: hasil[p.id]?.[i] }))
      .filter((x) => x.muncul === true || x.muncul === false),
  );
}

// Semua catatan jurnal yang menyebut anak ini: [{tanggal, isi, label}]
export function catatanAnak(sem, muridId) {
  return (sem.jurnal || []).filter((j) => j.anakIds?.includes(muridId));
}

// Senin dari minggu yang memuat tanggal ISO tsb (kunci rencana mingguan).
export function seninDari(iso) {
  const d = new Date(`${iso}T00:00:00`);
  const geser = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - geser);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Batas unggah PPM: Jumat 23.59 WIB sebelum Senin minggu itu.
export function batasPpm(senin) {
  return new Date(`${tambahHari(senin, -3)}T23:59:59+07:00`);
}

export function tambahHari(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Naikkan nilai CP anak sesuai bukti (tidak pernah menurunkan nilai yang sudah ada).
export function naikkanNilai(nilai, muridId, label) {
  const n = { ...(nilai[muridId] || {}) };
  for (const { lingkup_id, level } of label || []) {
    if (n[lingkup_id] === undefined || n[lingkup_id] < level) n[lingkup_id] = level;
  }
  return { ...nilai, [muridId]: n };
}

// Data semester aktif.
export const semAktif = (d) => d.sem[d.kelas.semester];

// Ubah data semester aktif saja: ubahSem(ubah, (s) => ({...s, ...}))
export function ubahSem(ubah, fn) {
  ubah((d) => ({ ...d, sem: { ...d.sem, [d.kelas.semester]: fn(d.sem[d.kelas.semester]) } }));
}

// Data yang dikirim ke server: hanya jurnal yang sudah direview (draf tetap di perangkat).
export function dataUntukServer(d) {
  const sem = {};
  for (const [k, s] of Object.entries(d.sem)) sem[k] = { ...s, jurnal: (s.jurnal || []).filter((j) => j.status === "direview") };
  return { kelas: d.kelas, murid: d.murid, sem };
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

// Ubah file .docx (mis. PPM mingguan) jadi HTML ringkas di browser, supaya yang dikirim ke server
// cuma teks + struktur tabel (gambar dibuang).
export async function docxKeHtml(file) {
  if (!/\.docx$/i.test(file.name)) throw new Error(`${file.name}: hanya file Word .docx yang didukung.`);
  const mammoth = (await import("mammoth")).default;
  const { value } = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    { convertImage: mammoth.images.imgElement(() => ({ src: "" })) },
  );
  return value
    .replace(/<img[^>]*>/g, "")
    .replace(/<\/?(strong|em|u|s|sup|sub|a)[^>]*>/g, "")
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
