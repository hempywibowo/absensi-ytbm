import "server-only";
import { normalizeWhatsapp } from "./packages";

// Pengaturan toko (diisi lewat Environment Variables di Vercel).
export function shopConfig() {
  return {
    // Nomor WhatsApp admin/usaha untuk konfirmasi pembayaran, mis. 6281234567890
    adminWhatsapp: normalizeWhatsapp(process.env.ADMIN_WHATSAPP),
    // Gambar QRIS statis (atas nama usaha). Default: file public/qris.png kalau ada.
    qrisImageUrl: process.env.QRIS_IMAGE_URL || (process.env.QRIS_IN_REPO === "1" ? "/qris.png" : null),
  };
}
