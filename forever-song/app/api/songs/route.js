import { randomBytes } from "crypto";
import { validateOrder } from "@/lib/validate";
import { generateSong, UserFacingError } from "@/lib/lyrics";
import { createSong } from "@/lib/store";

// Menulis lirik bisa makan waktu ~30-90 detik.
export const maxDuration = 300;

// Pembatas sederhana per IP (per instance server) supaya tidak disalahgunakan.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi ya." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const { input, error } = validateOrder(body);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    const result = await generateSong(input);
    const id = randomBytes(6).toString("base64url");
    await createSong({ id, input, result });
    return Response.json({ id });
  } catch (err) {
    if (err instanceof UserFacingError) {
      return Response.json({ error: err.message }, { status: 422 });
    }
    console.error("Gagal membuat lagu:", err);
    return Response.json({ error: "Maaf, lagu gagal dibuat. Coba lagi beberapa saat lagi." }, { status: 500 });
  }
}
