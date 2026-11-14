import "server-only";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";

// Penyimpanan lagu.
// - Production: Supabase (tabel `songs`, lihat supabase/schema.sql)
// - Development tanpa Supabase: file .data/songs.json

const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let supabase = null;
function db() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabase;
}

const FILE = path.join(process.cwd(), ".data", "songs.json");

async function readFileStore() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeFileStore(songs) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(songs, null, 2));
}

// Kolom pembayaran ditambahkan belakangan (supabase/schema.sql bagian 2);
// isi nilai default supaya baris lama tetap terbaca.
function withDefaults(song) {
  if (!song) return null;
  return { payment_status: "belum_bayar", ...song, payment_status: song.payment_status || "belum_bayar" };
}

export function isPaid(song) {
  return song?.payment_status === "lunas";
}

export async function createSong({ id, input, result }) {
  const song = {
    id,
    created_at: new Date().toISOString(),
    input,
    result,
    audio_url: null,
    status: "lirik_jadi",
  };
  if (useSupabase) {
    const { error } = await db().from("songs").insert(song);
    if (error) throw new Error(`Gagal menyimpan lagu: ${error.message}`);
  } else {
    const songs = await readFileStore();
    songs.unshift(song);
    await writeFileStore(songs);
  }
  return song;
}

export async function getSong(id) {
  if (useSupabase) {
    const { data, error } = await db().from("songs").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return withDefaults(data);
  }
  const songs = await readFileStore();
  return withDefaults(songs.find((s) => s.id === id) ?? null);
}

export async function listSongs(limit = 100) {
  if (useSupabase) {
    const { data, error } = await db()
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data.map(withDefaults);
  }
  return (await readFileStore()).slice(0, limit).map(withDefaults);
}

// ---------- Audio (Supabase Storage) ----------

const AUDIO_BUCKET = "song-audio";
const AUDIO_MAX_BYTES = 50 * 1024 * 1024; // batas file paket gratis Supabase
let bucketReady = false;

async function ensureAudioBucket() {
  if (bucketReady) return;
  const storage = db().storage;
  const { data } = await storage.getBucket(AUDIO_BUCKET);
  if (!data) {
    const { error } = await storage.createBucket(AUDIO_BUCKET, {
      public: true, // supaya link MP3 bisa diputar langsung di halaman lagu
      fileSizeLimit: AUDIO_MAX_BYTES,
      allowedMimeTypes: ["audio/*"],
    });
    if (error && !/exist/i.test(error.message)) throw new Error(`Gagal membuat bucket audio: ${error.message}`);
  }
  bucketReady = true;
}

// Membuat URL upload sekali pakai supaya browser admin bisa upload file besar
// langsung ke Supabase (tidak lewat server Vercel yang dibatasi ±4,5 MB per request).
export async function createAudioUploadUrl(songId, ext, kind = "full") {
  if (!useSupabase) {
    throw new Error("Upload audio butuh Supabase (SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY).");
  }
  await ensureAudioBucket();
  const storage = db().storage.from(AUDIO_BUCKET);
  const path = `${songId}/${kind}-${Date.now()}.${ext}`;
  const { data, error } = await storage.createSignedUploadUrl(path);
  if (error) throw new Error(`Gagal menyiapkan upload: ${error.message}`);
  const { data: pub } = storage.getPublicUrl(path);
  return { signedUrl: data.signedUrl, publicUrl: pub.publicUrl };
}

export { AUDIO_MAX_BYTES };

export async function updateSong(id, patch) {
  const FIELDS = [
    "audio_url",
    "status",
    "package",
    "payment_status",
    "buyer_whatsapp",
    "amount",
    "paid_at",
    "preview_audio_url",
    "preview_requested_at",
  ];
  const allowed = {};
  for (const f of FIELDS) if (f in patch) allowed[f] = patch[f] ?? null;

  if (useSupabase) {
    const { data, error } = await db().from("songs").update(allowed).eq("id", id).select().maybeSingle();
    if (error) {
      if (/column/i.test(error.message)) {
        throw new Error(`Kolom database belum lengkap. Jalankan bagian 2 di supabase/schema.sql. (${error.message})`);
      }
      throw new Error(error.message);
    }
    return withDefaults(data);
  }
  const songs = await readFileStore();
  const idx = songs.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  songs[idx] = { ...songs[idx], ...allowed };
  await writeFileStore(songs);
  return withDefaults(songs[idx]);
}
