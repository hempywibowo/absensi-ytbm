"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { ambilPin, dataUntukServer, panggilApi, simpanPin } from "@/lib/rapor-client";
import { Judul, Pesan, kelasInput } from "./bagian";

const waktu = (iso) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

// Kirim data rapor yang sudah direview dari perangkat guru ke server (untuk dashboard kepala sekolah).
export default function KirimServer({ data, ubah }) {
  const [pin, setPin] = useState(ambilPin);
  const [ingat, setIngat] = useState(Boolean(ambilPin()));
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");

  const k = data.kelas;
  const semua = Object.values(data.sem).flatMap((s) => s.jurnal || []);
  const nDraf = semua.filter((j) => j.status !== "direview").length;
  const nSiap = semua.length - nDraf;
  const perlu = !k.terakhirKirim || (k.diubah && k.diubah > k.terakhirKirim);

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
    setSibuk(true);
    try {
      const j = await panggilApi("kirim", { pin, data: dataUntukServer(data) });
      simpanPin(ingat ? pin : "");
      const sekarang = new Date().toISOString();
      ubah((d) => ({ ...d, kelas: { ...d.kelas, terakhirKirim: sekarang, diubah: sekarang } }), { tanpaTanda: true });
      setInfo(`Terkirim ✓ ${j.jurnal} catatan, ${j.murid} murid. Kepala sekolah sudah bisa melihatnya di dashboard.`);
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Card className={perlu ? "border-accent" : ""}>
      <Judul kanan={perlu ? <Badge tone="warning">belum terkirim</Badge> : <Badge>✓ terkirim</Badge>}>Kirim ke Server</Judul>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm">
          {nSiap} catatan siap dikirim{nDraf ? ` · ${nDraf} draf (belum direview, tidak ikut)` : ""}
          {k.terakhirKirim && <span className="block text-xs text-muted">Terakhir dikirim: {waktu(k.terakhirKirim)}</span>}
        </p>
        <p className="text-xs text-muted">
          Data tetap tersimpan di perangkat ini. Setelah dikirim, kepala sekolah & admin bisa memantaunya. Kalau nanti
          diubah, kirim ulang saja — data di server akan diperbarui.
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
        <Button type="button" onClick={kirim} disabled={sibuk}>
          {sibuk ? "Mengirim…" : "⬆️ Kirim ke Server"}
        </Button>
        {galat && <Pesan tone="danger">{galat}</Pesan>}
        {info && <Pesan>{info}</Pesan>}
      </div>
    </Card>
  );
}
