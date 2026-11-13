import { notFound } from "next/navigation";
import Link from "next/link";
import { getSong } from "@/lib/store";
import { GENRES, OCCASIONS, findLabel } from "@/lib/options";
import SongView from "./SongView";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const song = await getSong(id);
  if (!song) return { title: "Lagu tidak ditemukan" };
  return {
    title: `${song.result.title} — untuk ${song.input.recipientName}`,
    description: `Lagu spesial dari ${song.input.senderName} untuk ${song.input.recipientName} 🎵`,
    robots: { index: false },
  };
}

export default async function SongPage({ params }) {
  const { id } = await params;
  const song = await getSong(id);
  if (!song) notFound();

  const { input, result } = song;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-gold">
          {findLabel(OCCASIONS, input.occasion)} · {findLabel(GENRES, input.genre)}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight">{result.title}</h1>
        <p className="mt-2 text-muted">
          untuk <span className="font-semibold text-foreground">{input.recipientName}</span> dari{" "}
          <span className="font-semibold text-foreground">{input.senderName}</span>
        </p>
        {result.dedication && (
          <blockquote className="mx-auto mt-6 max-w-md font-serif text-lg italic text-muted">&ldquo;{result.dedication}&rdquo;</blockquote>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
        {song.audio_url ? (
          <audio controls src={song.audio_url} className="w-full" preload="metadata" />
        ) : (
          <div className="text-center">
            <p className="text-2xl">🎧</p>
            <p className="mt-1 font-semibold">Lirik sudah jadi, musiknya sedang diproduksi</p>
            <p className="mt-1 text-sm text-muted">Simpan link halaman ini. Lagu bisa diputar di sini setelah musiknya selesai.</p>
          </div>
        )}
      </div>

      <SongView sections={result.sections} songKey={result.key} tempo={result.tempo_bpm} title={result.title} recipient={input.recipientName} />

      <div className="mt-12 text-center">
        <Link href="/buat" className="inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
          Buat lagu untuk orang lain
        </Link>
      </div>
    </main>
  );
}
