import { getSong, updateSong } from "@/lib/store";
import { normalizeWhatsapp } from "@/lib/packages";

// Calon pembeli minta cuplikan audio (dengan nomor WA).
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  if (!whatsapp) return Response.json({ error: "Nomor WhatsApp tidak valid. Contoh: 0812xxxxxxx" }, { status: 400 });

  const song = await getSong(id);
  if (!song) return Response.json({ error: "Lagu tidak ditemukan." }, { status: 404 });

  try {
    await updateSong(id, {
      buyer_whatsapp: whatsapp,
      preview_requested_at: song.preview_requested_at || new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Maaf, permintaan gagal disimpan. Coba lagi sebentar lagi." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
