import { NextResponse } from "next/server";
import { tanyaBantuan } from "@/lib/rapor-ai";
import { cekKodeAkses, balasGalat } from "@/lib/rapor-guard";

export const maxDuration = 60;

// Isi Buku Panduan diambil dari halaman /rapor/panduan (satu sumber), disimpan sebentar di memori.
let cache = { teks: "", waktu: 0 };
async function teksPanduan(asal) {
  if (cache.teks && Date.now() - cache.waktu < 10 * 60_000) return cache.teks;
  const res = await fetch(new URL("/rapor/panduan", asal), { cache: "no-store" });
  if (!res.ok) throw new Error(`Panduan tidak bisa dibaca (${res.status})`);
  const html = await res.text();
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html;
  const teks = main
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(h[1-3])[^>]*>/gi, "\n\n## ")
    .replace(/<(li|dt|dd|p|div)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
  cache = { teks, waktu: Date.now() };
  return teks;
}

export async function POST(request) {
  const tolak = cekKodeAkses(request);
  if (tolak) return tolak;
  try {
    const body = await request.json();
    const riwayat = (Array.isArray(body.riwayat) ? body.riwayat : [])
      .slice(-12)
      .filter((m) => (m.role === "user" || m.role === "assistant") && String(m.content || "").trim())
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
    if (!riwayat.length || riwayat[riwayat.length - 1].role !== "user") {
      return NextResponse.json({ error: "Tulis pertanyaan dulu." }, { status: 400 });
    }
    while (riwayat[0]?.role !== "user") riwayat.shift();
    const panduan = await teksPanduan(request.url);
    const jawab = await tanyaBantuan({ panduan, riwayat, konteks: String(body.konteks || "").slice(0, 100) });
    return NextResponse.json({ jawab });
  } catch (err) {
    return balasGalat(err, "bantuan");
  }
}
