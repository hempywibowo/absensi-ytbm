"use client";

import { useEffect, useState } from "react";
import { GENRES, RECIPIENTS, OCCASIONS, MOODS, VOCALS, LANGUAGES, findLabel } from "@/lib/options";
import { findPackage, rupiah } from "@/lib/packages";

const STATUS_LABEL = { lirik_jadi: "Lirik jadi", diproses: "Musik diproses", selesai: "Lagu terkirim" };
const PAY_LABEL = { belum_bayar: "Belum pilih paket", menunggu_konfirmasi: "Menunggu bayar", lunas: "Lunas" };
const KEY_STORAGE = "lagu-abadi-admin-key";

const FILTERS = [
  { id: "semua", label: "Semua", test: () => true },
  { id: "bayar", label: "Cek pembayaran", test: (s) => s.payment_status === "menunggu_konfirmasi" },
  { id: "produksi", label: "Lunas, buat lagu", test: (s) => s.payment_status === "lunas" && !s.audio_url },
  { id: "cuplikan", label: "Minta cuplikan", test: (s) => s.preview_requested_at && !s.preview_audio_url && s.payment_status !== "lunas" },
  { id: "selesai", label: "Selesai", test: (s) => s.payment_status === "lunas" && s.audio_url },
];

function lyricsText(result) {
  return result.sections.map((s) => `[${s.label}]\n${s.lyrics}`).join("\n\n");
}

function CopyButton({ text, label }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
    >
      {done ? "Tersalin ✓" : label}
    </button>
  );
}

function waLink(number, text) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// Upload langsung dari browser ke Supabase Storage (pakai XHR supaya ada progres).
function putFile(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload gagal (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload gagal, cek koneksi internet."));
    xhr.send(form);
  });
}

function UploadBox({ label, busy, progress, onFile }) {
  return (
    <label
      className={`mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary-soft px-4 py-3 text-sm font-semibold text-primary ${
        busy ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {progress !== null ? `Mengupload... ${progress}%` : label}
      <input
        type="file"
        accept="audio/*,.mp3,.m4a,.wav"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function SongRow({ song, adminKey, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState(null); // { kind, pct }
  const { input, result } = song;
  const pkg = findPackage(song.package);
  const songUrl = typeof window !== "undefined" ? `${window.location.origin}/lagu/${song.id}` : `/lagu/${song.id}`;

  async function save(patch) {
    setSaving(true);
    setErr("");
    const res = await fetch(`/api/songs/${song.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setErr(data.error);
    onUpdated(data.song);
  }

  async function upload(file, kind) {
    if (!file) return;
    setErr("");
    setProgress({ kind, pct: 0 });
    try {
      const res = await fetch(`/api/songs/${song.id}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ fileName: file.name, size: file.size, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await putFile(data.signedUrl, file, (pct) => setProgress({ kind, pct }));
      await save(kind === "preview" ? { preview_audio_url: data.publicUrl } : { audio_url: data.publicUrl, status: "selesai" });
    } catch (e) {
      setErr(e.message);
    } finally {
      setProgress(null);
    }
  }

  const busy = saving || progress !== null;
  const paid = song.payment_status === "lunas";

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 text-left">
        <div>
          <p className="font-semibold">{result.title}</p>
          <p className="text-sm text-muted">
            {findLabel(GENRES, input.genre)} · untuk {input.recipientName} ({findLabel(RECIPIENTS, input.recipient)}) · dari {input.senderName}
          </p>
          <p className="text-xs text-muted">
            {new Date(song.created_at).toLocaleString("id-ID")} · kode <b>{song.id}</b>
            {pkg && ` · ${pkg.name} ${rupiah(song.amount || pkg.price)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              paid ? "bg-primary-soft text-primary" : song.payment_status === "menunggu_konfirmasi" ? "bg-gold text-white" : "bg-border text-muted"
            }`}
          >
            {PAY_LABEL[song.payment_status]}
          </span>
          {paid && <span className="text-xs text-muted">{STATUS_LABEL[song.status] ?? song.status}</span>}
          {!paid && song.preview_requested_at && !song.preview_audio_url && <span className="text-xs font-semibold text-gold">🎧 minta cuplikan</span>}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-5 border-t border-border pt-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <a href={`/lagu/${song.id}`} target="_blank" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              Buka halaman lagu
            </a>
            <CopyButton text={lyricsText(result)} label="Salin lirik" />
            <CopyButton text={result.music_prompt} label="Salin prompt musik" />
            <CopyButton text={result.title} label="Salin judul" />
          </div>

          {/* Pembayaran */}
          <div className="rounded-xl bg-background p-3">
            <p className="font-semibold">💰 Pembayaran</p>
            {song.buyer_whatsapp ? (
              <p className="mt-1">
                WA pembeli: <b>+{song.buyer_whatsapp}</b>{" "}
                <a href={waLink(song.buyer_whatsapp, `Halo kak, ini dari Lagu Abadi 🎵 terkait lagu "${result.title}".`)} target="_blank" className="text-primary underline">
                  chat
                </a>
              </p>
            ) : (
              <p className="mt-1 text-muted">Belum ada nomor WA.</p>
            )}
            {pkg && (
              <p className="mt-1">
                Paket <b>{pkg.name}</b> · transfer <b>{rupiah(song.amount || pkg.price)}</b>
              </p>
            )}
            {!paid ? (
              <button
                disabled={busy || !pkg}
                onClick={() => confirm(`Tandai LUNAS: ${result.title} (${pkg ? rupiah(song.amount) : "-"})?`) && save({ payment_status: "lunas", status: "diproses" })}
                className="mt-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-40"
              >
                ✅ Tandai Lunas
              </button>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-primary">Lunas {song.paid_at && `· ${new Date(song.paid_at).toLocaleString("id-ID")}`}</span>
                {song.buyer_whatsapp && (
                  <a
                    href={waLink(
                      song.buyer_whatsapp,
                      song.audio_url
                        ? `Halo kak 🙏 Lagu "${result.title}" sudah jadi! Dengarkan & bagikan di sini:\n${songUrl}\n\nTerima kasih sudah memesan di Lagu Abadi 🎵`
                        : `Halo kak 🙏 Pembayaran untuk lagu "${result.title}" sudah kami terima. Lirik lengkap sudah terbuka di:\n${songUrl}\n\nLagunya sedang kami produksi, nanti kami kabari lagi ya 🎵`,
                    )}
                    target="_blank"
                    className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Kirim kabar ke pembeli
                  </a>
                )}
                <button disabled={busy} onClick={() => confirm("Batalkan status lunas?") && save({ payment_status: "menunggu_konfirmasi" })} className="text-xs text-muted underline">
                  batalkan lunas
                </button>
              </div>
            )}
          </div>

          {/* Cuplikan */}
          {!paid && (
            <div>
              <p className="font-semibold">🎧 Cuplikan (±30 detik, untuk calon pembeli)</p>
              {song.preview_audio_url ? (
                <>
                  <audio controls src={song.preview_audio_url} className="mt-2 w-full" preload="none" />
                  {song.buyer_whatsapp && (
                    <a
                      href={waLink(song.buyer_whatsapp, `Halo kak 🎵 Cuplikan lagu "${result.title}" sudah bisa didengar di sini:\n${songUrl}\n\nKalau suka, pilih paketnya di halaman yang sama ya 🙏`)}
                      target="_blank"
                      className="mt-2 inline-block rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Kabari pembeli via WA
                    </a>
                  )}
                </>
              ) : (
                <p className="mt-1 text-xs text-muted">{song.preview_requested_at ? "Pembeli minta cuplikan." : "Belum diminta."} Potong lagu dari Suno jadi ±30 detik, lalu upload.</p>
              )}
              <UploadBox
                label={song.preview_audio_url ? "⬆️ Ganti cuplikan" : "⬆️ Upload cuplikan"}
                busy={busy}
                progress={progress?.kind === "preview" ? progress.pct : null}
                onFile={(f) => upload(f, "preview")}
              />
            </div>
          )}

          {/* Lagu lengkap */}
          <div>
            <p className="font-semibold">🎵 Lagu lengkap {!paid && <span className="font-normal text-muted">(hanya terdengar setelah lunas)</span>}</p>
            <p className="mt-1 rounded-lg bg-gold-soft p-2 font-mono text-xs">{result.music_prompt}</p>
            <p className="mt-1 text-xs text-muted">
              Nada {result.key} · ±{result.tempo_bpm} BPM · {findLabel(VOCALS, input.vocal)} · {findLabel(MOODS, input.mood)} · {findLabel(LANGUAGES, input.language)}
            </p>
            {song.audio_url && <audio controls src={song.audio_url} className="mt-2 w-full" preload="none" />}
            <UploadBox
              label={song.audio_url ? "⬆️ Ganti lagu lengkap" : "⬆️ Upload lagu lengkap (MP3 dari Suno)"}
              busy={busy}
              progress={progress?.kind === "full" ? progress.pct : null}
              onFile={(f) => upload(f, "full")}
            />
          </div>

          <details>
            <summary className="cursor-pointer font-semibold">Cerita dari pemesan</summary>
            <dl className="mt-2 space-y-2">
              {[
                ["Momen", findLabel(OCCASIONS, input.occasion)],
                ["Cerita", input.story],
                ["Ciri-ciri", input.traits],
                ["Kenangan", input.memories],
                ["Pesan", input.message],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="whitespace-pre-line">{v}</dd>
                  </div>
                ))}
            </dl>
          </details>

          {err && <p className="rounded-lg bg-danger-soft p-2 text-xs text-danger">{err}</p>}
        </div>
      )}
    </li>
  );
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [songs, setSongs] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("semua");

  async function load(key) {
    setError("");
    const res = await fetch("/api/admin/songs", { headers: { "x-admin-key": key } });
    const data = await res.json();
    if (!res.ok) {
      setSongs(null);
      sessionStorage.removeItem(KEY_STORAGE);
      return setError(data.error);
    }
    sessionStorage.setItem(KEY_STORAGE, key);
    setSongs(data.songs);
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY_STORAGE);
    if (saved) {
      setAdminKey(saved);
      load(saved);
    }
  }, []);

  if (!songs) {
    return (
      <main className="mx-auto w-full max-w-sm flex-1 px-5 py-20">
        <h1 className="font-serif text-2xl">Admin Lagu Abadi</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            load(adminKey);
          }}
        >
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Kunci admin"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3"
          />
          <button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Masuk</button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </main>
    );
  }

  const active = FILTERS.find((f) => f.id === filter);
  const shown = songs.filter(active.test);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Pesanan Lagu</h1>
        <button onClick={() => load(adminKey)} className="rounded-lg border border-border px-3 py-1.5 text-sm">
          Muat ulang
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = songs.filter(f.test).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${filter === f.id ? "bg-primary text-primary-foreground" : "border border-border bg-surface"}`}
            >
              {f.label} ({n})
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="mt-8 text-muted">Tidak ada pesanan di sini.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((s) => (
            <SongRow
              key={s.id}
              song={s}
              adminKey={adminKey}
              onUpdated={(updated) => setSongs((list) => list.map((x) => (x.id === updated.id ? updated : x)))}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
