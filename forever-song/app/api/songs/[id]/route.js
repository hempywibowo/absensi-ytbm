import { isAdmin } from "@/lib/admin";
import { updateSong } from "@/lib/store";

const STATUSES = new Set(["lirik_jadi", "diproses", "selesai"]);

// Admin: pasang link audio / ubah status lagu.
export async function PATCH(request, { params }) {
  if (!isAdmin(request)) return Response.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const patch = {};
  if ("audio_url" in body) {
    const url = String(body.audio_url || "").trim();
    if (url && !/^https:\/\//i.test(url)) {
      return Response.json({ error: "Link audio harus diawali https://" }, { status: 400 });
    }
    patch.audio_url = url;
  }
  if ("status" in body) {
    if (!STATUSES.has(body.status)) return Response.json({ error: "Status tidak dikenal." }, { status: 400 });
    patch.status = body.status;
  }

  const song = await updateSong(id, patch);
  if (!song) return Response.json({ error: "Lagu tidak ditemukan." }, { status: 404 });
  return Response.json({ song });
}
