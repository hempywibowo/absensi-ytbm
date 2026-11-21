# Absensi Guru — Yayasan Tunas Bangsa Mandiri

Aplikasi absensi clock in/out berbasis lokasi + foto selfie buat guru 7 TK di bawah Yayasan Tunas
Bangsa Mandiri. Dibangun pakai Next.js, Supabase (Postgres + Storage, akses server-only lewat service
role key — gratis, gak butuh kartu kredit), Clerk (login admin/kepala sekolah), dan sinkronisasi
otomatis ke Google Sheets.

## Cara kerja singkat

- **Guru** (`/`): pilih nama dari daftar, clock in/out — wajib di dalam radius 100 meter dari lokasi
  sekolah + wajib foto selfie tiap clock in dan clock out. Guru gak perlu login/password.
- **Ajukan izin** (`/izin`): guru ajukan izin buat tanggal tertentu, statusnya "menunggu" sampai
  disetujui.
- **Admin/Kepala Sekolah** (`/admin`): login pakai Clerk. Kepala sekolah cuma bisa lihat & approve
  izin di sekolahnya sendiri; admin yayasan bisa akses semua sekolah + atur lokasi tiap TK.
- Semua data (termasuk foto selfie) disimpan di Supabase lewat server saja, pakai service role key —
  gak ada Supabase client yang jalan di browser, jadi foto guru gak pernah jadi URL publik.
- Setiap clock in/out otomatis nambah baris ke Google Sheets (kolom: tanggal, nama guru, sekolah,
  tipe, jam, jarak, status, path foto) sebagai salinan buat laporan manual.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Bikin project Supabase (gratis, gak perlu kartu)

1. Buka **[supabase.com](https://supabase.com)**, daftar/login (bisa pakai GitHub).
2. Klik **New project** → kasih nama (misal "absensi-ytbm") → pilih region terdekat (misal
   Singapore) → bikin password database (gak dipakai langsung, cukup dicatat) → **Create new project**.
   Tunggu ± 2 menit sampai project-nya siap.
3. Di sidebar kiri klik **SQL Editor** → **New query** → buka file [`supabase/schema.sql`](supabase/schema.sql)
   dari project ini, copy-paste semua isinya ke situ → klik **Run**. Ini bikin semua tabel yang
   dibutuhkan aplikasi.
4. Bikin bucket foto: sidebar kiri **Storage** → **New bucket** → nama `selfies` → pastikan toggle
   **Public bucket** dalam keadaan **OFF** (biar foto guru gak bisa diakses sembarang orang) → **Save**.
5. Ambil API key: sidebar kiri ikon **gear ⚙️ (Project Settings)** → **API** → copy **Project URL**
   dan key di bagian **service_role** (bukan yang `anon`/`public`!) → isi ke `.env.local`:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = key `service_role`

   `service_role` key itu setara password admin database — jangan pernah dipakai di kode frontend
   atau di-share ke luar, cuma boleh ada di `.env.local` (server-only).

### 3. Isi `.env.local` sisanya

- **Clerk** (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`): dari clerk.com → buat
  application baru → Configure → API keys.
- **Google Sheets** (opsional, buat sync otomatis ke spreadsheet):
  1. Buka **[console.cloud.google.com](https://console.cloud.google.com)** → bikin project baru
     (gratis, gak perlu billing buat ini) → di search bar atas cari **"Google Sheets API"** → klik
     **Enable**.
  2. Sidebar kiri **APIs & Services** → **Credentials** → **Create Credentials** → **Service account**
     → kasih nama → **Create and continue** → skip bagian akses (Continue) → **Done**.
  3. Klik service account yang baru dibuat → tab **Keys** → **Add Key** → **Create new key** → pilih
     **JSON** → download.
  4. Buka file JSON itu, copy `client_email` ke `GOOGLE_SHEETS_CLIENT_EMAIL` dan `private_key` ke
     `GOOGLE_SHEETS_PRIVATE_KEY`.
  5. Buat spreadsheet baru di Google Sheets, bikin sheet/tab bernama **`Absensi`**, ambil ID dari
     URL-nya (`docs.google.com/spreadsheets/d/<ID_INI>/edit`) → isi ke `GOOGLE_SHEETS_SPREADSHEET_ID`.
  6. **Share spreadsheet-nya (akses Editor)** ke email `client_email` tadi (ini WAJIB, kalau kelewat
     sync-nya akan gagal diam-diam — cek log server kalau baris gak nongol di Sheets).

  Fitur ini opsional — kalau gak diisi, absensi tetap jalan normal, cuma gak ke-copy ke spreadsheet.

### 4. Isi data guru, sekolah, kepala sekolah, admin

Isi `data/DATA-TEMPLATE.md` (atau kirim datanya dalam format serupa), lalu data itu dipindah ke
`data/seed-data.json`. Setelah `seed-data.json` terisi:

```bash
npm run seed
```

Ini nulis data ke tabel `schools`, `teachers`, `admins` di Supabase. Aman dijalanin berkali-kali kalau
ada update data.

Lokasi sekolah boleh dikosongin dulu di tahap ini — begitu ada admin yang login, lokasi bisa diisi
manual lewat halaman **Admin → Data Sekolah**.

### 5. Jalanin lokal

```bash
npm run dev
```

Buka `http://localhost:3000` (halaman guru) dan `http://localhost:3000/admin` (login admin/kepsek).

### 6. Deploy ke Vercel

Push ke GitHub, import project di vercel.com, paste semua isi `.env.local` ke Environment Variables
project-nya, lalu Deploy.

## Fitur Rapor Anak (`/rapor`)

Modul terpisah untuk menyusun rapor PAUD/TK Kurikulum Merdeka **Fase Fondasi**, mengacu CP
**SK BSKAP 046/H/KR/2025** (3 elemen, 14 sub-elemen) dan ATP dari **Panduan CP Fase Fondasi Edisi
Revisi 2025** (41 lingkup, 139 TP — data di `lib/rapor-cp.js`). Fitur ini **tidak mengubah apa pun di
absensi**: tidak ada tabel baru, tidak menulis ke database. Data rapor disimpan di perangkat guru
(localStorage), per semester, plus unduh/pulihkan cadangan.

Alur guru (tab di `/rapor`):
1. **Kelas** — sekolah (dropdown), nama kelas, kelompok usia, guru & pendamping, kepala sekolah, NIP,
   semester (tombol Sem 1/Sem 2 di atas).
2. **Murid** — ketik (data lengkap: NIS/NISN, TTL, agama, orang tua), tempel daftar, atau foto daftar absen.
3. **PPM** — unggah file Word **PPM mingguan** guru. AI membaca TP minggu itu (dipetakan ke ATP resmi),
   ceklis tiap anak, catatan anekdot, dan hasil karya. Guru memeriksa, lalu disimpan: ceklis jadi
   bukti & menaikkan Penilaian CP, anekdot masuk ke catatan anak.
4. **Catatan** — catatan harian tambahan (ketik / foto catatan tulisan tangan).
5. **Penilaian CP** — per anak, semua 14 sub-elemen: tiap lingkup pilih sampai TP mana anak sudah sampai
   (TP berikutnya otomatis jadi "sedang dikembangkan"), bukti per sub-elemen, indikator x/14, usulan
   otomatis dari catatan, dan kokurikuler (tema + 8 Dimensi Profil Lulusan).
6. **Rapor** — narasi per elemen + kokurikuler + refleksi disusun AI dari penilaian/PPM/catatan, bisa
   disunting, lalu cetak/PDF A4 dengan lampiran capaian TP per sub-elemen.

Env tambahan (di Vercel juga):
- `ANTHROPIC_API_KEY` — wajib untuk fitur AI (baca foto/PPM, usulan penilaian, narasi). Isian manual tetap jalan tanpa ini.
- `RAPOR_KODE_AKSES` — opsional tapi disarankan, supaya orang luar tidak bisa memakai kuota AI lewat URL publik.

File/foto yang dikirim ke AI tidak disimpan di server; hanya hasil bacaannya yang disimpan di perangkat guru.

## Catatan penting

- Radius toleransi clock-in/out: **100 meter** dari koordinat sekolah — bisa diubah di
  `lib/geo.js` (`CLOCK_IN_RADIUS_METERS`).
- Belum ada logika "telat" (keterlambatan) karena jam masuk standar tiap TK belum ditentukan — kalau
  mau ditambahkan, kasih tau jam masuk resmi tiap sekolah.
- RLS (Row Level Security) di semua tabel Supabase di-set nolak semua akses langsung — aplikasi cuma
  akses lewat server pakai `service_role` key yang otomatis skip RLS. Aman dari akses browser
  langsung meski URL/key ke-expose secara gak sengaja di frontend (walau seharusnya gak pernah kejadian
  karena semuanya server-only).
