import { createClient } from "@supabase/supabase-js";

let _client;

// Ditunda sampai beneran dipakai (bukan pas modul di-import), biar `next build` gak butuh
// Supabase credentials asli — Next.js meng-import semua route module pas build buat baca
// config, dan createClient() langsung throw kalau URL/key kosong.
export function getSupabaseAdmin() {
  if (!_client) {
    _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
