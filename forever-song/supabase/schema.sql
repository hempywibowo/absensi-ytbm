-- Jalankan di Supabase SQL Editor
create table if not exists public.songs (
  id          text primary key,
  created_at  timestamptz not null default now(),
  input       jsonb not null,
  result      jsonb not null,
  audio_url   text,
  status      text not null default 'lirik_jadi'  -- lirik_jadi | diproses | selesai
);

create index if not exists songs_created_at_idx on public.songs (created_at desc);

-- Akses hanya lewat server (service role), jadi RLS dinyalakan tanpa policy publik.
alter table public.songs enable row level security;

-- ============================================================
-- BAGIAN 2: paket, pembayaran & cuplikan audio
-- (jalankan ini juga kalau tabel songs sudah dibuat sebelumnya)
-- ============================================================
alter table public.songs
  add column if not exists package              text,
  add column if not exists payment_status       text not null default 'belum_bayar', -- belum_bayar | menunggu_konfirmasi | lunas
  add column if not exists buyer_whatsapp       text,
  add column if not exists amount               integer,
  add column if not exists paid_at              timestamptz,
  add column if not exists preview_audio_url    text,
  add column if not exists preview_requested_at timestamptz;
