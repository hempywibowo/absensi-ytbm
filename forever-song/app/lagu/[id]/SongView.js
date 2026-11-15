"use client";

import { useState } from "react";

const DUMMY = "La la la la la la la la la la";

export default function SongView({ sections, songKey, tempo, title, recipient, paid, showChords: chordsAvailable }) {
  const [showChords, setShowChords] = useState(false);
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = `🎵 "${title}" — lagu spesial untuk ${recipient}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // user batal, lanjut ke salin link
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = `🎵 Aku punya lagu spesial buat kamu: "${title}"\nDengarkan di sini 👉 ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <>
      {paid && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 text-center">
          <p className="font-semibold">💝 Kirim lagu ini ke {recipient}</p>
          <p className="mt-1 text-sm text-muted">Bagikan link-nya lewat WhatsApp, atau pasang di status &amp; Instagram story.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button onClick={shareWhatsApp} className="rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white">
              Kirim via WhatsApp
            </button>
            <button onClick={share} className="rounded-full border border-border px-5 py-2 text-sm font-semibold">
              {copied ? "Link tersalin ✓" : "Bagikan / Salin Link"}
            </button>
            {chordsAvailable && (
              <button onClick={() => setShowChords((v) => !v)} className="rounded-full border border-border px-5 py-2 text-sm font-semibold">
                {showChords ? "Sembunyikan chord" : "Tampilkan chord 🎸"}
              </button>
            )}
          </div>
        </div>
      )}

      {showChords && (
        <p className="mt-4 text-center text-sm text-muted">
          Nada dasar: <b>{songKey}</b> · Tempo: ±{tempo} BPM
        </p>
      )}

      <article className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <section key={i} className="text-center">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-primary">
              {s.label} {s.locked && "🔒"}
            </h2>
            {s.locked ? (
              <p aria-hidden className="mt-2 select-none whitespace-pre-line font-serif text-lg leading-relaxed blur-[6px]">
                {Array.from({ length: s.lineCount }, () => DUMMY).join("\n")}
              </p>
            ) : (
              <>
                {showChords && s.chords && <p className="mt-1 font-mono text-sm text-gold">{s.chords}</p>}
                <p className="mt-2 whitespace-pre-line font-serif text-lg leading-relaxed">{s.lyrics}</p>
              </>
            )}
          </section>
        ))}
      </article>

      {!paid && (
        <p className="mt-6 text-center text-sm text-muted">🔒 Bagian yang diburamkan terbuka setelah memilih paket.</p>
      )}
    </>
  );
}
