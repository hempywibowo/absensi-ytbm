// Semua tanggal absensi dikunci ke zona waktu WIB (Asia/Jakarta), gak peduli timezone device guru,
// biar konsisten dengan hari kerja sekolah.
export function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function nowJakartaISO() {
  return new Date().toISOString();
}

export function formatJamJakarta(isoString) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}
