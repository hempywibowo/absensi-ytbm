"use client";

import { useEffect, useState } from "react";
import { GENRES, RECIPIENTS, OCCASIONS, MOODS, VOCALS, LANGUAGES, findLabel } from "@/lib/options";

const STATUS_LABEL = { lirik_jadi: "Lirik jadi", diproses: "Musik diproses", selesai: "Selesai" };
const KEY_STORAGE = "lagu-abadi-admin-key";

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

function SongRow({ song, adminKey, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [audio, setAudio] = useState(song.audio_url || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState(null);
  const { input, result } = song;

  async function upload(file) {
    if (!file) return;
    setErr("");
    setProgress(0);
    try {
      const res = await fetch(`/api/songs/${song.id}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ fileName: file.name, size: file.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await putFile(data.signedUrl, file, setProgress);
      setAudio(data.publicUrl);
      await save({ audio_url: data.publicUrl, status: "selesai" });
    } catch (e) {
      setErr(e.message);
    } finally {
      setProgress(null);
    }
  }

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

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 text-left">
        <div>
          <p className="font-semibold">{result.title}</p>
          <p className="text-sm text-muted">
            {findLabel(GENRES, input.genre)} · untuk {input.recipientName} ({findLabel(RECIPIENTS, input.recipient)}) · dari {input.senderName}
          </p>
          <p className="text-xs text-muted">{new Date(song.created_at).toLocaleString("id-ID")}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            song.status === "selesai" ? "bg-primary-soft text-primary" : "bg-gold-soft text-gold"
          }`}
        >
          {STATUS_LABEL[song.status] ?? song.status}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <a href={`/lagu/${song.id}`} target="_blank" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              Buka halaman lagu
            </a>
            <CopyButton text={lyricsText(result)} label="Salin lirik" />
            <CopyButton text={result.music_prompt} label="Salin prompt musik" />
          </div>

          <div>
            <p className="font-semibold">Prompt gaya musik (untuk AI musik / produser)</p>
            <p className="mt-1 rounded-lg bg-gold-soft p-3 font-mono text-xs">{result.music_prompt}</p>
            <p className="mt-1 text-xs text-muted">
              Nada {result.key} · ±{result.tempo_bpm} BPM · {findLabel(VOCALS, input.vocal)} · {findLabel(MOODS, input.mood)} · {findLabel(LANGUAGES, input.language)}
            </p>
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

          <div>
            <p className="font-semibold">Audio lagu</p>
            {song.audio_url && <audio controls src={song.audio_url} className="mt-2 w-full" preload="none" />}

            <label
              className={`mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary-soft px-4 py-4 font-semibold text-primary ${
                progress !== null || saving ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {progress !== null ? `Mengupload... ${progress}%` : song.audio_url ? "⬆️ Ganti file MP3" : "⬆️ Upload file MP3 (dari Suno, dll)"}
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav"
                className="hidden"
                onChange={(e) => {
                  upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="mt-1 text-xs text-muted">Maksimal 50 MB. Setelah upload, lagu langsung bisa diputar di halaman pelanggan.</p>

            <p className="mt-3 text-xs text-muted">Atau tempel link audio (https://):</p>
            <div className="mt-1 flex gap-2">
              <input
                value={audio}
                onChange={(e) => setAudio(e.target.value)}
                placeholder="https://.../lagu.mp3"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2"
              />
              <button
                disabled={saving}
                onClick={() => save({ audio_url: audio, status: audio ? "selesai" : "lirik_jadi" })}
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
            {song.status === "lirik_jadi" && (
              <button disabled={saving} onClick={() => save({ status: "diproses" })} className="mt-2 text-xs font-semibold text-gold underline">
                Tandai &ldquo;musik sedang diproses&rdquo;
              </button>
            )}
            {err && <p className="mt-1 text-xs text-danger">{err}</p>}
          </div>
        </div>
      )}
    </li>
  );
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [songs, setSongs] = useState(null);
  const [error, setError] = useState("");

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

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Pesanan Lagu ({songs.length})</h1>
        <button onClick={() => load(adminKey)} className="rounded-lg border border-border px-3 py-1.5 text-sm">
          Muat ulang
        </button>
      </div>
      {songs.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada pesanan.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {songs.map((s) => (
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
