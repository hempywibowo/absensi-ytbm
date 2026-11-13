import { isAdmin } from "@/lib/admin";
import { listSongs } from "@/lib/store";

export async function GET(request) {
  if (!isAdmin(request)) return Response.json({ error: "Kunci admin salah." }, { status: 401 });
  return Response.json({ songs: await listSongs() });
}
