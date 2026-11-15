import { getSong, updateSong, isPaid } from "@/lib/store";
import { findPackage, normalizeWhatsapp } from "@/lib/packages";

// Pembeli memilih paket & mengisi nomor WA -> pesanan menunggu pembayaran.
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const pkg = findPackage(body.package);
  if (!pkg) return Response.json({ error: "Pilih paket dulu ya." }, { status: 400 });
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  if (!whatsapp) return Response.json({ error: "Nomor WhatsApp tidak valid. Contoh: 0812xxxxxxx" }, { status: 400 });

  const song = await getSong(id);
  if (!song) return Response.json({ error: "Lagu tidak ditemukan." }, { status: 404 });
  if (isPaid(song)) return Response.json({ error: "Lagu ini sudah lunas." }, { status: 409 });

  // Kode unik 3 digit di belakang nominal supaya transfer QRIS mudah dicocokkan.
  const keepAmount = song.package === pkg.id && song.amount > pkg.price && song.amount < pkg.price + 1000;
  const amount = keepAmount ? song.amount : pkg.price + 1 + Math.floor(Math.random() * 299);

  try {
    await updateSong(id, {
      package: pkg.id,
      amount,
      buyer_whatsapp: whatsapp,
      payment_status: "menunggu_konfirmasi",
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Maaf, pesanan gagal disimpan. Coba lagi sebentar lagi." }, { status: 500 });
  }
  return Response.json({ amount, package: pkg.id });
}
