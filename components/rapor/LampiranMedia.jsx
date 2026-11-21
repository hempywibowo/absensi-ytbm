"use client";

import { useEffect, useRef, useState } from "react";
import { idBaru } from "@/lib/rapor-client";
import { ambilMedia, hapusMedia, siapkanMedia, simpanMedia, MAKS_VIDEO_MB } from "@/lib/rapor-media";

// Gambar mini foto/video dari penyimpanan perangkat (IndexedDB).
export function MiniMedia({ m, onHapus }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let u = "";
    let batal = false;
    ambilMedia(m.id).then((blob) => {
      if (blob && !batal) {
        u = URL.createObjectURL(blob);
        setUrl(u);
      }
    });
    return () => {
      batal = true;
      if (u) URL.revokeObjectURL(u);
    };
  }, [m.id]);
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-black/5">
      {url && m.jenis === "foto" && (
        // eslint-disable-next-line @next/next/no-img-element -- pratinjau blob lokal
        <img src={url} alt={m.nama} className="h-full w-full object-cover" />
      )}
      {url && m.jenis === "video" && <video src={url} className="h-full w-full object-cover" muted playsInline />}
      {!url && <span className="flex h-full items-center justify-center text-[10px] text-muted">{m.driveId ? "di Drive" : "…"}</span>}
      {m.jenis === "video" && <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] text-white">▶ video</span>}
      {m.driveId && <span className="absolute right-0.5 top-0.5 rounded bg-primary px-1 text-[9px] text-white">✓</span>}
      {onHapus && (
        <button
          type="button"
          onClick={onHapus}
          className="absolute -right-0 -top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-danger text-xs font-bold text-white"
          aria-label="Hapus"
        >
          ×
        </button>
      )}
    </div>
  );
}

// Tombol lampirkan foto/video kegiatan + daftar gambar mini. `media` = [{id, jenis, nama, mime, ukuran}]
export default function LampiranMedia({ media, setMedia }) {
  const kameraRef = useRef(null);
  const galeriRef = useRef(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  async function tambah(files) {
    const list = [...(files || [])];
    if (kameraRef.current) kameraRef.current.value = "";
    if (galeriRef.current) galeriRef.current.value = "";
    if (!list.length) return;
    setSibuk(true);
    setGalat("");
    const baru = [];
    for (const f of list) {
      try {
        const s = await siapkanMedia(f);
        const id = idBaru();
        await simpanMedia(id, s.blob);
        baru.push({ id, jenis: s.jenis, nama: s.nama, mime: s.mime, ukuran: s.blob.size });
      } catch (e) {
        setGalat(e.message);
      }
    }
    setMedia([...media, ...baru]);
    setSibuk(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={kameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => tambah(e.target.files)} />
      <input ref={galeriRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => tambah(e.target.files)} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => kameraRef.current?.click()}
          disabled={sibuk}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
        >
          📷 Foto kegiatan
        </button>
        <button
          type="button"
          onClick={() => galeriRef.current?.click()}
          disabled={sibuk}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
        >
          🖼️ Galeri / 🎬 video (opsional)
        </button>
        {sibuk && <span className="self-center text-xs text-muted">Menyiapkan…</span>}
      </div>
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((m) => (
            <MiniMedia
              key={m.id}
              m={m}
              onHapus={
                m.driveId
                  ? undefined
                  : () => {
                      hapusMedia(m.id);
                      setMedia(media.filter((x) => x.id !== m.id));
                    }
              }
            />
          ))}
        </div>
      )}
      {galat && <p className="text-xs text-danger">{galat}</p>}
      <p className="text-[11px] text-muted">Video maks. {MAKS_VIDEO_MB} MB. Foto & video tersimpan di perangkat, diunggah ke Google Drive yayasan saat Kirim ke Server.</p>
    </div>
  );
}
