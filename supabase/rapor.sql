-- Tabel untuk fitur RAPOR. Jalanin SEKALI di Supabase Dashboard > SQL Editor > New query > Run.
-- Terpisah total dari tabel absensi (schools/teachers hanya dibaca sebagai referensi).
-- Aman dijalanin ulang (pakai "if not exists").

-- PIN guru untuk mengirim data rapor dari HP/laptop ke server. Dibuat oleh admin/kepala sekolah
-- di dashboard. Disimpan sebagai hash (scrypt), bukan angka aslinya.
create table if not exists rapor_pin (
  teacher_id text primary key references teachers(id) on delete cascade,
  pin_hash text not null,
  gagal int not null default 0,          -- jumlah salah PIN berturut-turut
  kunci_sampai timestamptz,              -- dikunci sementara setelah 5x salah
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Satu baris per kelas: salinan lengkap data rapor kelas (murid, penilaian, jurnal, narasi, dll.)
-- yang dikirim guru. Dashboard membaca dari sini.
create table if not exists rapor_kelas (
  id text primary key,
  teacher_id text not null references teachers(id),
  school_id text not null references schools(id),
  nama_kelas text not null default '',
  kelompok text not null default '',
  ta text not null default '',
  semester text not null default '1',
  jumlah_murid int not null default 0,
  data jsonb not null,
  uploaded_at timestamptz not null default now()
);
create index if not exists rapor_kelas_school_idx on rapor_kelas(school_id);

-- Jurnal harian yang sudah direview & dikirim (untuk pantauan harian per guru).
create table if not exists rapor_jurnal (
  kelas_id text not null references rapor_kelas(id) on delete cascade,
  id text not null,
  teacher_id text not null,
  school_id text not null,
  semester text not null,
  tanggal date,
  isi text not null,
  anak_ids jsonb not null default '[]',
  label jsonb not null default '[]',
  sumber text,
  primary key (kelas_id, id)
);
create index if not exists rapor_jurnal_school_tanggal_idx on rapor_jurnal(school_id, tanggal);
create index if not exists rapor_jurnal_teacher_tanggal_idx on rapor_jurnal(teacher_id, tanggal);

-- Riwayat pengiriman.
create table if not exists rapor_kiriman (
  id uuid primary key default gen_random_uuid(),
  kelas_id text not null,
  teacher_id text not null,
  school_id text not null,
  jumlah_jurnal int not null default 0,
  created_at timestamptz not null default now()
);

-- Sama seperti tabel absensi: tolak semua akses langsung dari browser. Aplikasi mengakses lewat
-- server (service role key) saja.
alter table rapor_pin enable row level security;
alter table rapor_kelas enable row level security;
alter table rapor_jurnal enable row level security;
alter table rapor_kiriman enable row level security;
