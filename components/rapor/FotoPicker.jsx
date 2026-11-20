"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { kompresFoto } from "@/lib/rapor-client";

const MAKS = 4;

// Ambil foto pakai kamera belakang atau pilih dari galeri (bisa beberapa sekaligus, maks 4).
export default function FotoPicker({ foto, setFoto }) {
  const kameraRef = useRef(null);
  const galeriRef = useRef(null);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState("");

  async function tambah(files) {
    const list = [...(files || [])].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setGalat("");
    setMemproses(true);
    try {
      const sisa = MAKS - foto.length;
      if (list.length > sisa) setGalat(`Maksimal ${MAKS} foto sekali baca. Sisanya bisa dikirim berikutnya.`);
      const hasil = [];
      for (const f of list.slice(0, Math.max(0, sisa))) hasil.push(await kompresFoto(f));
      setFoto([...foto, ...hasil]);
    } catch (e) {
      setGalat(e.message || "Foto gagal diproses.");
    } finally {
      setMemproses(false);
      if (kameraRef.current) kameraRef.current.value = "";
      if (galeriRef.current) galeriRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={kameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => tambah(e.target.files)}
      />
      <input
        ref={galeriRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => tambah(e.target.files)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={memproses || foto.length >= MAKS}
          onClick={() => kameraRef.current?.click()}
        >
          📷 Foto Kamera
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={memproses || foto.length >= MAKS}
          onClick={() => galeriRef.current?.click()}
        >
          🖼️ Dari Galeri
        </Button>
      </div>
      {memproses && <p className="text-sm text-muted">Memproses foto…</p>}
      {galat && <p className="text-sm text-danger">{galat}</p>}
      {foto.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {foto.map((src, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau data: URI */}
              <img src={src} alt={`Foto ${i + 1}`} className="aspect-square w-full rounded-lg border border-border object-cover" />
              <button
                type="button"
                onClick={() => setFoto(foto.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-xs font-bold text-white"
                aria-label="Hapus foto"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
