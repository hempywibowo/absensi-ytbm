"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { ambilPin, dataUntukServer, panggilApi, simpanPin } from "@/lib/rapor-client";
import { ambilMedia } from "@/lib/rapor-media";
import { Judul, Pesan, kelasInput } from "./bagian";

const waktu = (iso) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

// Kirim data rapor yang sudah direview dari perangkat guru ke server (untuk dashboard kepala sekolah).
// Foto/video yang belum terunggah dikirim dulu ke Google Drive yayasan.
export default function KirimServer({ data, ubah }) {
  const [pin, setPin] = useState(ambilPin);
  const [ingat, setIngat] = useState(Boolean(ambilPin()));
  const [sibuk, setSibuk] = useState("");
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");

  const k = data.kelas;
  const semua = Object.values(data.sem).flatMap((s) => s.jurnal || []);
  const nDraf = semua.filter((j) => j.status !== "direview").length;
  const nSiap = semua.length - nDraf;
  const mediaBelum = semua.filter((j) => j.status === "direview").flatMap((j) => (j.media || []).filter((m) => !m.driveId).map((m) => ({ ...m, tanggal: j.tanggal, isi: j.isi })));
  const perlu = !k.terakhirKirim || (k.diubah && k.diubah > k.terakhirKirim) || mediaBelum.length > 0;

  async function unggahMedia(petaDrive) {
    let gagal = 0;
    for (let i = 0; i < mediaBelum.length; i++) {
      const m = mediaBelum[i];
      setSibuk(`Mengunggah foto/video ${i + 1}/${mediaBelum.length}…`);
      try {
        const blob = await ambilMedia(m.id);
        if (!blob) throw new Error("File tidak ada di perangkat ini.");
        const { url } = await panggilApi("media-sesi", {
          pin,
          guruId: k.guruId,
          kelasId: k.id,
          namaKelas: k.namaKelas,
          media: { id: m.id, nama: m.nama, mime: m.mime, ukuran: blob.size, tanggal: m.tanggal, keterangan: m.isi.slice(0, 400) },
        });
        const res = await fetch(url, { method: "PUT", headers: { "Content-Type": m.mime }, body: blob });
        if (!res.ok) throw new Error(`Google Drive menolak (${res.status}).`);
        const { id: driveId } = await res.json();
        petaDrive[m.id] = driveId;
        ubah((d) => {
          const sem = {};
          for (const [key, s] of Object.entries(d.sem)) {
            sem[key] = {
              ...s,
              jurnal: (s.jurnal || []).map((j) => ({
                ...j,
                media: (j.media || []).map((x) => (x.id === m.id ? { ...x, driveId } : x)),
              })),
            };
          }
          return { ...d, sem };
        });
      } catch (e) {
        gagal++;
        // PIN salah / Drive belum siap: hentikan, tampilkan pesannya.
        if (/PIN|Drive belum|dikunci/i.test(e.message)) throw e;
      }
    }
    return gagal;
  }

  async function kirim() {
    setGalat("");
    setInfo("");
    if (!k.guruId) {
      setGalat("Pilih nama guru (akun) di tab Kelas dulu.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setGalat("Masukkan PIN 4–6 angka dari kepala sekolah/admin.");
      return;
    }
    if (nDraf && !confirm(`${nDraf} catatan masih draf (belum direview) dan TIDAK ikut dikirim. Lanjutkan?`)) return;
    try {
      let gagalMedia = 0;
      const petaDrive = {};
      if (mediaBelum.length) {
        try {
          gagalMedia = await unggahMedia(petaDrive);
        } catch (e) {
          if (/PIN|dikunci/i.test(e.message)) throw e;
          gagalMedia = mediaBelum.length;
          setGalat(`${e.message} Data catatan tetap dikirim; foto/video dicoba lagi pada pengiriman berikutnya.`);
        }
      }
      setSibuk("Mengirim data…");
      // Masukkan id Drive yang baru didapat ke data yang dikirim.
      const sem = {};
      for (const [key, s] of Object.entries(data.sem)) {
        sem[key] = {
          ...s,
          jurnal: (s.jurnal || []).map((j) => ({
            ...j,
            media: (j.media || []).map((x) => (petaDrive[x.id] ? { ...x, driveId: petaDrive[x.id] } : x)),
          })),
        };
      }
      const j = await panggilApi("kirim", { pin, data: dataUntukServer({ ...data, sem }) });
      simpanPin(ingat ? pin : "");
      const sekarang = new Date().toISOString();
      ubah((d) => ({ ...d, kelas: { ...d.kelas, terakhirKirim: sekarang, diubah: sekarang } }), { tanpaTanda: true });
      setInfo(
        `Terkirim ✓ ${j.jurnal} catatan, ${j.murid} murid${mediaBelum.length ? `, ${mediaBelum.length - gagalMedia}/${mediaBelum.length} foto/video` : ""}. Kepala sekolah sudah bisa melihatnya di dashboard.`,
      );
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk("");
    }
  }

  return (
    <Card className={perlu ? "border-accent" : ""}>
      <Judul kanan={perlu ? <Badge tone="warning">belum terkirim</Badge> : <Badge>✓ terkirim</Badge>}>Kirim ke Server</Judul>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm">
          {nSiap} catatan siap dikirim{nDraf ? ` · ${nDraf} draf (belum direview, tidak ikut)` : ""}
          {mediaBelum.length > 0 && ` · ${mediaBelum.length} foto/video belum terunggah`}
          {k.terakhirKirim && <span className="block text-xs text-muted">Terakhir dikirim: {waktu(k.terakhirKirim)}</span>}
        </p>
        <p className="text-xs text-muted">
          Data tetap tersimpan di perangkat ini. Foto/video diunggah ke Google Drive yayasan. Kalau nanti diubah, kirim
          ulang saja — data di server akan diperbarui.
        </p>
        <div className="flex items-center gap-2">
          <input
            className={kelasInput}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="PIN guru"
          />
          <label className="flex shrink-0 items-center gap-1.5 text-xs">
            <input type="checkbox" checked={ingat} onChange={(e) => setIngat(e.target.checked)} className="accent-[var(--primary)]" />
            Ingat PIN
          </label>
        </div>
        <Button type="button" onClick={kirim} disabled={Boolean(sibuk)}>
          {sibuk || "⬆️ Kirim ke Server"}
        </Button>
        {galat && <Pesan tone="danger">{galat}</Pesan>}
        {info && <Pesan>{info}</Pesan>}
      </div>
    </Card>
  );
}
