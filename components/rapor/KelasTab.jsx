"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Button } from "@/components/ui";
import { KELOMPOK, dataKosong, rapikanData, unduhCadangan, ambilKode, simpanKode } from "@/lib/rapor-client";
import { Ruas, kelasInput, Pesan, Judul } from "./bagian";

export default function KelasTab({ data, ubah, keTab }) {
  const k = data.kelas;
  const [sekolah, setSekolah] = useState(null);
  const [galatSekolah, setGalatSekolah] = useState("");
  const [kode, setKode] = useState(ambilKode);
  const [info, setInfo] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("/api/rapor/sekolah")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((j) => setSekolah(j.sekolah || []))
      .catch(() => setGalatSekolah("Daftar sekolah gagal dimuat. Periksa koneksi lalu buka ulang halaman."));
  }, []);

  const set = (field, value) => ubah((d) => ({ ...d, kelas: { ...d.kelas, [field]: value } }));

  function pilihSekolah(id) {
    const s = sekolah?.find((x) => x.id === id);
    ubah((d) => ({
      ...d,
      kelas: { ...d.kelas, sekolahId: id, sekolahNama: s?.nama || "", sekolahAlamat: s?.alamat || "" },
    }));
  }

  const guruSekolah = sekolah?.find((s) => s.id === k.sekolahId)?.guru || [];

  async function pulihkan(file) {
    if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (!d || !d.kelas || !Array.isArray(d.murid)) throw new Error();
      if (!confirm("Data rapor di perangkat ini akan DIGANTI dengan isi file cadangan. Lanjutkan?")) return;
      ubah(() => rapikanData(d));
      setInfo("Cadangan berhasil dipulihkan.");
    } catch {
      setInfo("File cadangan tidak valid.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function mulaiBaru() {
    if (!confirm("Hapus SEMUA data rapor di perangkat ini (murid, catatan, narasi)? Unduh cadangan dulu bila perlu.")) return;
    ubah(() => dataKosong());
    setInfo("Data rapor dikosongkan.");
  }

  const lengkap = k.sekolahId && k.namaKelas && k.kelompok;

  return (
    <>
      <Card>
        <Judul>Data Kelas</Judul>
        <div className="flex flex-col gap-4 p-4">
          <Ruas label="Sekolah">
            {sekolah ? (
              <select className={kelasInput} value={k.sekolahId} onChange={(e) => pilihSekolah(e.target.value)}>
                <option value="">— Pilih sekolah —</option>
                {sekolah.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted">{galatSekolah || "Memuat daftar sekolah…"}</p>
            )}
          </Ruas>

          <div className="grid grid-cols-2 gap-3">
            <Ruas label="Nama kelas" bantu="Contoh: Melati, Mawar, A1">
              <input className={kelasInput} value={k.namaKelas} onChange={(e) => set("namaKelas", e.target.value)} />
            </Ruas>
            <Ruas label="Kelompok usia">
              <select className={kelasInput} value={k.kelompok} onChange={(e) => set("kelompok", e.target.value)}>
                <option value="">— Pilih —</option>
                {KELOMPOK.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Ruas>
          </div>

          <Ruas label="NPSN sekolah (opsional)">
            <input className={kelasInput} inputMode="numeric" value={k.npsn} onChange={(e) => set("npsn", e.target.value)} />
          </Ruas>

          <Ruas label="Guru kelas" bantu={guruSekolah.length ? "Pilih dari daftar atau ketik nama." : undefined}>
            <input
              className={kelasInput}
              list="daftar-guru-rapor"
              value={k.guru}
              onChange={(e) => set("guru", e.target.value)}
            />
            <datalist id="daftar-guru-rapor">
              {guruSekolah.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Ruas>

          <div className="grid grid-cols-2 gap-3">
            <Ruas label="NIP/NUPTK guru (opsional)">
              <input className={kelasInput} value={k.nipGuru} onChange={(e) => set("nipGuru", e.target.value)} />
            </Ruas>
            <Ruas label="Guru pendamping (opsional)">
              <input className={kelasInput} list="daftar-guru-rapor" value={k.pendamping} onChange={(e) => set("pendamping", e.target.value)} />
            </Ruas>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Ruas label="Kepala sekolah">
              <input className={kelasInput} value={k.kepsek} onChange={(e) => set("kepsek", e.target.value)} />
            </Ruas>
            <Ruas label="NIP/NUPTK kepsek (opsional)">
              <input className={kelasInput} value={k.nipKepsek} onChange={(e) => set("nipKepsek", e.target.value)} />
            </Ruas>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Ruas label="Tahun ajaran">
              <input className={kelasInput} value={k.ta} onChange={(e) => set("ta", e.target.value)} />
            </Ruas>
            <Ruas label="Semester">
              <select className={kelasInput} value={k.semester} onChange={(e) => set("semester", e.target.value)}>
                <option value="1">1 (Ganjil)</option>
                <option value="2">2 (Genap)</option>
              </select>
            </Ruas>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Ruas label="Tempat tanda tangan">
              <input className={kelasInput} value={k.tempat} onChange={(e) => set("tempat", e.target.value)} />
            </Ruas>
            <Ruas label="Tanggal rapor">
              <input
                type="date"
                className={kelasInput}
                value={k.tanggalRapor}
                onChange={(e) => set("tanggalRapor", e.target.value)}
              />
            </Ruas>
          </div>

          {lengkap && (
            <Button type="button" onClick={() => keTab("murid")}>
              Lanjut isi data murid →
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <Judul>Kode Akses</Judul>
        <div className="flex flex-col gap-2 p-4">
          <p className="text-sm text-muted">
            Isi bila admin yayasan memberikan kode akses untuk fitur baca foto &amp; narasi otomatis.
          </p>
          <div className="flex gap-2">
            <input
              className={kelasInput}
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              placeholder="Kode akses"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                simpanKode(kode.trim());
                setInfo("Kode akses disimpan.");
              }}
            >
              Simpan
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Judul>Cadangan Data</Judul>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-muted">
            Data rapor hanya tersimpan di HP/laptop ini. Unduh cadangan supaya aman, dan pakai file cadangan untuk
            pindah perangkat.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => unduhCadangan(data)}>
              ⬇️ Unduh Cadangan
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              ⬆️ Pulihkan
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => pulihkan(e.target.files?.[0])}
          />
          <Button type="button" variant="ghost" className="text-danger" onClick={mulaiBaru}>
            Mulai kelas baru (kosongkan data)
          </Button>
        </div>
      </Card>

      {info && <Pesan>{info}</Pesan>}
    </>
  );
}
