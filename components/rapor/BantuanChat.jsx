"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { panggilApi } from "@/lib/rapor-client";

const CEPAT = [
  "Bagaimana cara unggah PPM minggu depan?",
  "Cara pakai dikte suara?",
  "Saya lupa PIN, bagaimana?",
  "Foto kegiatan tidak terkirim",
  "Apa arti angka x/14?",
  "Cara pindah dari HP ke laptop?",
];

const PANDUAN = [
  ["Alur mingguan", "alur"],
  ["Unggah PPM", "ppm"],
  ["Laporan harian", "harian"],
  ["Kirim ke Server", "kirim"],
  ["Laporan mingguan", "mingguan"],
  ["Cetak rapor", "rapor"],
  ["Pertanyaan umum", "tanya"],
];

// Tampilkan jawaban: **tebal** dan baris baru.
function Teks({ isi }) {
  return isi.split("\n").map((baris, i) => (
    <p key={i} className={baris.trim() ? "" : "h-2"}>
      {baris.split(/(\*\*[^*]+\*\*)/g).map((b, j) =>
        b.startsWith("**") && b.endsWith("**") ? <b key={j}>{b.slice(2, -2)}</b> : <span key={j}>{b}</span>,
      )}
    </p>
  ));
}

// Tombol Bantuan melayang: pintasan Buku Panduan + tanya jawab dengan asisten (berdasarkan isi panduan).
// `buka`/`setBuka` opsional: bila diberikan, panel dibuka dari tombol lain (mis. di header) dan
// tombol melayang tidak ditampilkan.
export default function BantuanChat({ konteks, buka: bukaLuar, setBuka: setBukaLuar }) {
  const [bukaDalam, setBukaDalam] = useState(false);
  const dikontrol = typeof setBukaLuar === "function";
  const buka = dikontrol ? bukaLuar : bukaDalam;
  const setBuka = dikontrol ? setBukaLuar : setBukaDalam;
  const [riwayat, setRiwayat] = useState([]);
  const [tanya, setTanya] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const bawahRef = useRef(null);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [riwayat, sibuk]);

  async function kirim(teks) {
    const q = (teks ?? tanya).trim();
    if (!q || sibuk) return;
    const baru = [...riwayat, { role: "user", content: q }];
    setRiwayat(baru);
    setTanya("");
    setSibuk(true);
    try {
      const j = await panggilApi("bantuan", { riwayat: baru, konteks });
      setRiwayat([...baru, { role: "assistant", content: j.jawab }]);
    } catch (e) {
      setRiwayat([
        ...baru,
        {
          role: "assistant",
          content: e.butuhKode
            ? "Asisten butuh Kode Akses. Isi di tab **Kelas → Kode Akses**, lalu coba lagi. Sementara itu, buka Buku Panduan di atas."
            : `Maaf, asisten sedang tidak bisa menjawab (${e.message}). Silakan buka Buku Panduan di atas atau hubungi kepala sekolah.`,
          galat: true,
        },
      ]);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <>
      {!buka && !dikontrol && (
        <button
          type="button"
          onClick={() => setBuka(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-bold text-white shadow-lg print:hidden"
        >
          💬 Bantuan
        </button>
      )}
      {buka && (
        <div className="fixed inset-x-2 bottom-2 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:left-auto sm:right-4 sm:w-[400px] print:hidden">
          <div className="flex items-center justify-between bg-accent px-4 py-3 text-white">
            <div>
              <p className="font-bold">💬 Bantuan Rapor</p>
              <p className="text-[11px] opacity-90">Tanya apa saja tentang cara memakai aplikasi</p>
            </div>
            <button type="button" onClick={() => setBuka(false)} className="text-2xl leading-none" aria-label="Tutup">
              ×
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 text-sm">
            <div className="rounded-xl bg-primary-soft p-3">
              <p className="mb-1.5 font-semibold text-primary">📖 Buku Panduan</p>
              <div className="flex flex-wrap gap-1.5">
                {PANDUAN.map(([label, id]) => (
                  <Link
                    key={id}
                    href={`/rapor/panduan#${id}`}
                    className="rounded-full border border-primary bg-surface px-2.5 py-1 text-xs font-semibold text-primary"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {riwayat.length === 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-muted">
                  Halo! Saya asisten aplikasi Rapor YTBM. Bingung, lupa langkah, atau ada kendala? Tulis pertanyaan Anda, atau pilih:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CEPAT.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => kirim(q)}
                      className="rounded-xl border border-border px-2.5 py-1.5 text-left text-xs font-semibold"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {riwayat.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] rounded-2xl px-3 py-2 leading-relaxed ${
                  m.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : m.galat
                      ? "self-start bg-danger-soft text-danger"
                      : "self-start bg-background"
                }`}
              >
                <Teks isi={m.content} />
              </div>
            ))}
            {sibuk && <p className="self-start rounded-2xl bg-background px-3 py-2 text-muted">Sedang mengetik…</p>}
            <div ref={bawahRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              kirim();
            }}
            className="flex gap-2 border-t border-border p-2"
          >
            <input
              value={tanya}
              onChange={(e) => setTanya(e.target.value)}
              placeholder="Tulis pertanyaan…"
              className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button type="submit" disabled={!tanya.trim() || sibuk} className="rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">
              Kirim
            </button>
          </form>
          <p className="px-3 pb-2 text-center text-[10px] text-muted">
            Jawaban dibuat AI berdasarkan Buku Panduan. Untuk PIN & akun, hubungi kepala sekolah.
          </p>
        </div>
      )}
    </>
  );
}
