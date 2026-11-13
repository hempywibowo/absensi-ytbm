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
