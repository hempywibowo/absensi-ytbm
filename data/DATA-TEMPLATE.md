# Template Data — Yayasan Tunas Bangsa Mandiri

Isi file ini (atau kirim dalam format serupa, boleh lewat Excel juga), nanti dipindah ke
`data/seed-data.json` lalu di-seed ke Supabase. Lokasi (koordinat) boleh dikosongin dulu kalau
belum ada — sekolah yang lokasinya kosong otomatis "clock-in dinonaktifkan sementara" sampai
diisi lewat halaman Admin → Data Sekolah.

**Penting soal struktur organisasi (biar gak salah isi):**
- Semua kepala sekolah **juga guru** di TK-nya masing-masing — jadi tiap kepala sekolah harus
  muncul di dua tabel: tabel **Guru** (buat clock in/out hariannya sendiri) DAN tabel **Kepala
  Sekolah** (buat akses dashboard read-only sekolahnya).
- **Kepala sekolah biasa cuma bisa LIHAT dashboard sekolahnya sendiri — TIDAK BISA approve izin.**
- Cuma **2 peran** yang boleh approve izin guru mana pun (semua sekolah): **Ketua Yayasan**
  (salah satu kepala sekolah yang merangkap jabatan ini) dan **Admin** (guru yang diberi
  wewenang admin). Tandai siapa orangnya di bagian ⭐ di bawah.

## Sekolah (7 TK)

| No | Nama TK | Alamat | Koordinat / Link Google Maps |
|----|---------|--------|-------------------------------|
| 1  |         |        |                               |
| 2  |         |        |                               |
| 3  |         |        |                               |
| 4  |         |        |                               |
| 5  |         |        |                               |
| 6  |         |        |                               |
| 7  |         |        |                               |

> Cara ambil koordinat: buka lokasi sekolah di Google Maps → klik kanan titik lokasinya → klik
> angka koordinat yang muncul paling atas menu (otomatis ke-copy) → paste di sini.

## Guru (semua guru, TERMASUK yang juga kepala sekolah)

| Nama Guru | Ditugaskan di TK (No) |
|-----------|-------------------------|
|           |                         |

## Kepala Sekolah (1 per TK — nama harus sama persis dengan di tabel Guru di atas)

| Nama Kepala Sekolah | TK (No) | Email (buat login) | ⭐ Ketua Yayasan? |
|----------------------|---------|----------------------|---------------------|
|                      |         |                      | Ya / Tidak          |

## Admin (guru yang diberi wewenang admin, boleh approve izin semua sekolah)

| Nama (harus sama persis dengan di tabel Guru) | Email (buat login) |
|-------------------------------------------------|----------------------|
|                                                   |                      |
