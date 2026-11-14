import { GENRES, RECIPIENTS, OCCASIONS, MOODS, VOCALS, LANGUAGES } from "./options";

const ids = (list) => new Set(list.map((x) => x.id));
const CHOICES = {
  genre: ids(GENRES),
  recipient: ids(RECIPIENTS),
  occasion: ids(OCCASIONS),
  mood: ids(MOODS),
  vocal: ids(VOCALS),
  language: ids(LANGUAGES),
};

const TEXT_LIMITS = {
  recipientName: [1, 60],
  senderName: [1, 60],
  story: [20, 2000],
  traits: [0, 1000],
  memories: [0, 1500],
  message: [0, 1000],
};

// Mengembalikan { input } kalau valid, atau { error } berisi pesan untuk user.
export function validateOrder(body) {
  if (!body || typeof body !== "object") return { error: "Data tidak valid." };
  const input = {};

  const choiceNames = { genre: "Genre", recipient: "Untuk siapa", occasion: "Momen", mood: "Suasana", vocal: "Vokal", language: "Bahasa" };
  for (const [field, allowed] of Object.entries(CHOICES)) {
    if (!allowed.has(body[field])) return { error: `${choiceNames[field]} belum dipilih.` };
    input[field] = body[field];
  }

  const names = {
    recipientName: "Nama penerima",
    senderName: "Nama pengirim",
    story: "Cerita / momen",
    traits: "Ciri-ciri",
    memories: "Kenangan indah",
    message: "Pesan",
  };
  for (const [field, [min, max]] of Object.entries(TEXT_LIMITS)) {
    const v = typeof body[field] === "string" ? body[field].trim() : "";
    if (v.length < min) {
      return { error: min === 1 ? `${names[field]} wajib diisi.` : `${names[field]} minimal ${min} karakter ya, biar lagunya personal.` };
    }
    if (v.length > max) return { error: `${names[field]} maksimal ${max} karakter.` };
    input[field] = v;
  }

  return { input };
}
