"use client";

import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { ambilPin, panggilApi, rapikanData } from "@/lib/rapor-client";
import { Judul, Pesan, Ruas, kelasInput } from "./bagian";

const waktu = (iso) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

// Pindah perangkat (HP <-> laptop): ambil data kelas yang pernah dikirim ke server ke perangkat ini.
export default function AmbilServer({ sekolah, data, ubah }) {
  const [sekolahId, setSekolahId] = useState(data.kelas.sekolahId);
  const [guruId, setGuruId] = useState(data.kelas.guruId);
  const [pin, setPin] = useState(ambilPin);
  const [daftar, setDaftar] = useState(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");

  const guruList = sekolah?.find((s) => s.id === sekolahId)?.guru || [];
  const adaDataLokal = data.murid.length > 0 || Object.values(data.sem).some((s) => (s.jurnal || []).length);
  const belumTerkirim = data.kelas.diubah && (!data.kelas.terakhirKirim || data.kelas.diubah > data.kelas.terakhirKirim);

  async function cari() {
    setGalat("");
    setInfo("");
    setSibuk(true);
    try {
      const j = await panggilApi("ambil", { guruId, pin });
      setDaftar(j.kelas);
      if (!j.kelas.length) setInfo("Belum ada kelas yang pernah dikirim ke server atas nama guru ini.");
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  }

  async function ambil(k) {
    const peringatan = adaDataLokal
      ? `Data rapor di perangkat ini akan DIGANTI dengan data kelas ${k.nama_kelas} dari server (dikirim ${waktu(k.uploaded_at)}).` +
        (belumTerkirim ? "\n\n⚠️ Ada perubahan di perangkat ini yang BELUM dikirim ke server dan akan hilang. Unduh cadangan dulu bila perlu." : "") +
        "\n\nLanjutkan?"
      : `Ambil data kelas ${k.nama_kelas} dari server ke perangkat ini?`;
    if (!confirm(peringatan)) return;
    setSibuk(true);
    setGalat("");
    try {
      const j = await panggilApi("ambil", { guruId, pin, kelasId: k.id });
      const d = rapikanData(j.data);
      d.kelas = { ...d.kelas, terakhirKirim: j.uploaded_at, diubah: j.uploaded_at };
      ubah(() => d, { tanpaTanda: true });
      setDaftar(null);
      setInfo(
        `Data kelas ${k.nama_kelas} berhasil diambil. Catatan yang masih draf di perangkat lain dan foto/video yang belum terunggah tidak ikut.`,
      );
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Card>
      <Judul>Pindah Perangkat (HP ↔ Laptop)</Judul>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted">
          Sudah pernah mengisi & <b>Kirim ke Server</b> dari perangkat lain? Ambil data kelasnya ke perangkat ini, supaya
          bisa lanjut bekerja di sini.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Ruas label="Sekolah">
            <select className={kelasInput} value={sekolahId} onChange={(e) => { setSekolahId(e.target.value); setGuruId(""); setDaftar(null); }}>
              <option value="">— Pilih —</option>
              {(sekolah || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </Ruas>
          <Ruas label="Guru">
            <select className={kelasInput} value={guruId} onChange={(e) => { setGuruId(e.target.value); setDaftar(null); }}>
              <option value="">— Pilih —</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </Ruas>
        </div>
        <div className="flex gap-2">
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
          <Button type="button" variant="outline" onClick={cari} disabled={sibuk || !guruId || pin.length < 4}>
            {sibuk && !daftar ? "Mencari…" : "⬇️ Cari kelas saya"}
          </Button>
        </div>
        {daftar?.length > 0 && (
          <ul className="flex flex-col gap-2">
            {daftar.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
                <div className="text-sm">
                  <p className="font-semibold">
                    {k.nama_kelas || "Kelas"} · {k.kelompok} · {k.jumlah_murid} anak
                  </p>
                  <p className="text-xs text-muted">
                    TA {k.ta} · dikirim {waktu(k.uploaded_at)}
                    {k.id === data.kelas.id ? " · kelas di perangkat ini" : ""}
                  </p>
                </div>
                <Button type="button" className="px-3 py-2" onClick={() => ambil(k)} disabled={sibuk}>
                  Ambil
                </Button>
              </li>
            ))}
          </ul>
        )}
        {galat && <Pesan tone="danger">{galat}</Pesan>}
        {info && <Pesan>{info}</Pesan>}
      </div>
    </Card>
  );
}
