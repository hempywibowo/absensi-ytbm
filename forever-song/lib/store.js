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
    return data;
  }
  const songs = await readFileStore();
  return songs.find((s) => s.id === id) ?? null;
}

export async function listSongs(limit = 100) {
  if (useSupabase) {
    const { data, error } = await db()
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data;
  }
  return (await readFileStore()).slice(0, limit);
}

export async function updateSong(id, patch) {
  const allowed = {};
  if ("audio_url" in patch) allowed.audio_url = patch.audio_url || null;
  if ("status" in patch) allowed.status = patch.status;

  if (useSupabase) {
    const { data, error } = await db().from("songs").update(allowed).eq("id", id).select().maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }
  const songs = await readFileStore();
  const idx = songs.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  songs[idx] = { ...songs[idx], ...allowed };
  await writeFileStore(songs);
  return songs[idx];
}
