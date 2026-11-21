import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

export const PIN_VALID = /^\d{4,6}$/;
const MAKS_GAGAL = 5;
const MENIT_KUNCI = 15;

export async function hashPin(pin) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(pin, salt, 32);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

async function cocok(pin, disimpan) {
  const [jenis, salt, hex] = String(disimpan).split("$");
  if (jenis !== "scrypt" || !salt || !hex) return false;
  const hash = await scrypt(pin, salt, 32);
  const target = Buffer.from(hex, "hex");
  return target.length === hash.length && timingSafeEqual(target, hash);
}

// Periksa PIN guru; dikunci sementara setelah beberapa kali salah supaya tidak bisa ditebak.
// Mengembalikan null bila cocok, atau pesan galat untuk guru.
export async function periksaPin(supabase, teacherId, pin) {
  const { data: row, error } = await supabase.from("rapor_pin").select("*").eq("teacher_id", teacherId).maybeSingle();
  if (error) throw error;
  if (!row) return "PIN Anda belum dibuat. Minta kepala sekolah/admin membuatkan PIN di dashboard.";
  if (row.kunci_sampai && new Date(row.kunci_sampai) > new Date()) {
    const jam = new Date(row.kunci_sampai).toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Terlalu banyak salah PIN. Coba lagi setelah pukul ${jam}.`;
  }
  if (PIN_VALID.test(pin) && (await cocok(pin, row.pin_hash))) {
    if (row.gagal) await supabase.from("rapor_pin").update({ gagal: 0, kunci_sampai: null }).eq("teacher_id", teacherId);
    return null;
  }
  const gagal = (row.gagal || 0) + 1;
  const kunci = gagal >= MAKS_GAGAL;
  await supabase
    .from("rapor_pin")
    .update({
      gagal: kunci ? 0 : gagal,
      kunci_sampai: kunci ? new Date(Date.now() + MENIT_KUNCI * 60_000).toISOString() : null,
    })
    .eq("teacher_id", teacherId);
  return kunci ? `PIN salah ${MAKS_GAGAL} kali. Pengiriman dikunci ${MENIT_KUNCI} menit.` : "PIN salah.";
}
