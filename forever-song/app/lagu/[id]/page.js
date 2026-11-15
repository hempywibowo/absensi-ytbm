import { notFound } from "next/navigation";
import Link from "next/link";
import { getSong, isPaid } from "@/lib/store";
import { GENRES, OCCASIONS, findLabel } from "@/lib/options";
import { PACKAGES, findPackage } from "@/lib/packages";
import { shopConfig } from "@/lib/config";
import SongView from "./SongView";
import Checkout from "./Checkout";
import PreviewRequest from "./PreviewRequest";

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

// Sebelum lunas: hanya bagian pertama + reff pertama yang terlihat.
// Bagian lain TIDAK dikirim ke browser (hanya label & jumlah baris), jadi tidak bisa diintip.
function previewSections(sections) {
  const firstChorus = sections.findIndex((s, i) => i > 0 && /chorus|reff|refrain/i.test(s.label));
  return sections.map((s, i) => {
    if (i === 0 || i === firstChorus) return { label: s.label, lyrics: s.lyrics, chords: "" };
    return { label: s.label, locked: true, lineCount: s.lyrics.split("\n").length };
  });
}

export default async function SongPage({ params, searchParams }) {
  const { id } = await params;
  const { baru } = await searchParams;
  const song = await getSong(id);
  if (!song) notFound();

  const { input, result } = song;
  const paid = isPaid(song);
  const pkg = findPackage(song.package);
  const showChords = paid && pkg && pkg.id !== "basic";
  const sections = paid ? result.sections.map((s) => ({ ...s, chords: showChords ? s.chords : "" })) : previewSections(result.sections);
  const { adminWhatsapp, qrisImageUrl } = shopConfig();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      {!paid && baru && (
        <div className="mb-8 rounded-2xl bg-gold-soft px-5 py-4 text-center">
          <p className="font-semibold">🎉 Pratinjau lagumu sudah jadi!</p>
          <p className="mt-1 text-sm text-muted">Baca sebagian liriknya di bawah. Pilih paket untuk membuka lirik lengkap &amp; mendapatkan lagunya.</p>
        </div>
      )}

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
        {paid && song.audio_url ? (
          <audio controls src={song.audio_url} className="w-full" preload="metadata" />
        ) : paid ? (
          <div className="text-center">
            <p className="text-2xl">🎧</p>
            <p className="mt-1 font-semibold">Pembayaran diterima, lagumu sedang diproduksi</p>
            <p className="mt-1 text-sm text-muted">Simpan link halaman ini. Lagu bisa diputar di sini setelah selesai, kami juga kabari via WhatsApp.</p>
          </div>
        ) : song.preview_audio_url ? (
          <div>
            <p className="mb-2 text-center text-sm font-semibold">🎧 Cuplikan lagumu</p>
            <audio controls src={song.preview_audio_url} className="w-full" preload="metadata" />
            <p className="mt-2 text-center text-xs text-muted">Ini baru cuplikan. Lagu lengkap didapat setelah memilih paket.</p>
          </div>
        ) : (
          <PreviewRequest songId={song.id} requested={Boolean(song.preview_requested_at)} />
        )}
      </div>

      <SongView sections={sections} songKey={result.key} tempo={result.tempo_bpm} title={result.title} recipient={input.recipientName} paid={paid} showChords={showChords} />

      {!paid && (
        <Checkout
          songId={song.id}
          packages={PACKAGES}
          initial={{
            package: song.package,
            amount: song.amount,
            whatsapp: song.buyer_whatsapp,
            status: song.payment_status,
          }}
          adminWhatsapp={adminWhatsapp}
          qrisImageUrl={qrisImageUrl}
          title={result.title}
        />
      )}

      <div className="mt-14 rounded-3xl bg-primary px-6 py-8 text-center text-primary-foreground">
        <p className="text-3xl">🎵</p>
        <h2 className="mt-2 font-serif text-2xl">Mau buat lagu seperti ini untuk orang tersayangmu?</h2>
        <p className="mt-2 text-sm opacity-90">
          Ceritakan kenanganmu, kami ubah jadi lagu: pop, koplo, jazz, rohani, keroncong &amp; banyak lagi. Coba gratis, lihat pratinjau liriknya dulu.
        </p>
        <Link href="/buat" className="mt-5 inline-block rounded-full bg-white px-7 py-3 font-semibold text-primary">
          Buat Lagumu Sekarang
        </Link>
      </div>
    </main>
  );
}
