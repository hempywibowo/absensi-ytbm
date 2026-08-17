-- Jalanin script ini di Supabase Dashboard > SQL Editor > New query > Run.
-- Bikin semua tabel + kunci akses (RLS) buat aplikasi Absensi Guru YTBM.

create table if not exists schools (
  id text primary key,
  name text not null,
  address text default '',
  lat double precision,
  lng double precision,
  maps_link text default ''
);

create table if not exists teachers (
  id text primary key,
  name text not null,
  school_id text not null references schools(id),
  -- true buat orang yang sering tugas luar (ketua yayasan, bendahara, admin yayasan) —
  -- clock in/out mereka gak dicek jarak ke sekolah sama sekali, bisa dari mana aja.
  free_location boolean not null default false
);

-- Role admin/kepala sekolah, keyed by email (bukan id Clerk) — biar admin yayasan bisa
-- daftarin kepsek/admin baru cukup dengan input email, sebelum orangnya sign up ke Clerk.
create table if not exists admins (
  email text primary key,
  name text not null,
  role text not null check (role in ('admin', 'kepsek')),
  school_id text references schools(id)
);

-- id format: "{teacherId}_{date}" biar lookup "sudah absen hari ini?" jadi 1 query langsung (bukan filter).
create table if not exists attendance (
  id text primary key,
  teacher_id text not null references teachers(id),
  teacher_name text not null,
  school_id text not null references schools(id),
  school_name text not null,
  date date not null,
  status text not null default 'hadir',
  clock_in jsonb,
  clock_out jsonb
);
create index if not exists attendance_date_idx on attendance(date);
create index if not exists attendance_school_date_idx on attendance(school_id, date);

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  teacher_id text not null references teachers(id),
  teacher_name text not null,
  school_id text not null references schools(id),
  school_name text not null,
  date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz
);
create index if not exists leave_requests_status_idx on leave_requests(status);
create index if not exists leave_requests_teacher_date_idx on leave_requests(teacher_id, date);

-- RLS: nolak SEMUA akses langsung dari browser/client (mirip Firestore rules sebelumnya).
-- Aplikasi ini cuma akses tabel-tabel ini lewat server (Next.js API routes) pakai
-- SUPABASE_SERVICE_ROLE_KEY, yang otomatis skip RLS. Ini jaga-jaga kalau ada yang nyoba
-- akses langsung pakai anon key.
alter table schools enable row level security;
alter table teachers enable row level security;
alter table admins enable row level security;
alter table attendance enable row level security;
alter table leave_requests enable row level security;

-- Bucket buat foto selfie — PRIVATE (jangan dicentang "Public bucket").
-- Bikin manual di Dashboard > Storage > New bucket > nama: "selfies" > Public: OFF.
-- Baris ini opsional, cuma jaga-jaga kalau mau bikin lewat SQL juga:
insert into storage.buckets (id, name, public)
values ('selfies', 'selfies', false)
on conflict (id) do nothing;
