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

// Jam masuk resmi berlaku sama buat semua sekolah — clock-in setelah jam ini otomatis "telat".
export const CLOCK_IN_DEADLINE = { hour: 7, minute: 30 };

export function isLateJakarta(isoString) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(isoString));

  const hour = Number(parts.find((p) => p.type === "hour").value) % 24;
  const minute = Number(parts.find((p) => p.type === "minute").value);

  return (
    hour > CLOCK_IN_DEADLINE.hour ||
    (hour === CLOCK_IN_DEADLINE.hour && minute > CLOCK_IN_DEADLINE.minute)
  );
}
