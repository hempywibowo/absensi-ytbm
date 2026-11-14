import { isAdmin } from "@/lib/admin";
import { getSong, createAudioUploadUrl, AUDIO_MAX_BYTES } from "@/lib/store";

const ALLOWED_EXT = new Set(["mp3", "m4a", "wav", "ogg"]);

// Admin: minta URL upload untuk file audio lagu.
export async function POST(request, { params }) {
  if (!isAdmin(request)) return Response.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const ext = String(body.fileName || "").split(".").pop().toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return Response.json({ error: "File harus berformat MP3, M4A, WAV, atau OGG." }, { status: 400 });
  }
  if (!(body.size > 0) || body.size > AUDIO_MAX_BYTES) {
    return Response.json({ error: "Ukuran file maksimal 50 MB." }, { status: 400 });
  }

  const song = await getSong(id);
  if (!song) return Response.json({ error: "Lagu tidak ditemukan." }, { status: 404 });

  try {
    return Response.json(await createAudioUploadUrl(id, ext));
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
