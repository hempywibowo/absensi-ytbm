"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { Card, Button, Badge } from "@/components/ui";
import { CP, SEMUA_SUB, subTerisi } from "@/lib/rapor-cp";
import { panggilApi, semAktif, ubahSem, buktiPpmAnak } from "@/lib/rapor-client";
import LembarRapor from "./LembarRapor";
import { Ruas, kelasInput, Pesan, Judul } from "./bagian";

const ANGKA = [
  ["tb", "Tinggi (cm)"],
  ["bb", "Berat (kg)"],
  ["lk", "Lingkar kepala (cm)"],
  ["sakit", "Sakit (hari)"],
  ["izin", "Izin (hari)"],
  ["alfa", "Tanpa ket. (hari)"],
];

const adaNarasi = (r) => Boolean(r && CP.some((e) => (r[e.id] || "").trim()));

export default function RaporTab({ data, ubah, keTab }) {
  const S = semAktif(data);
  const [anakId, setAnakId] = useState(data.murid[0]?.id || "");
  const [sibuk, setSibuk] = useState(null);
  const [massal, setMassal] = useState(null);
  const [galat, setGalat] = useState("");
  const [cetak, setCetak] = useState([]);

  if (data.murid.length === 0) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted">Belum ada murid. Isi data murid dulu.</p>
        <Button type="button" onClick={() => keTab("murid")}>
          Ke tab Murid →
        </Button>
      </Card>
    );
  }

  const anak = data.murid.find((m) => m.id === anakId) || data.murid[0];
  const r = S.rapor[anak.id] || {};
  const nCatatan = (id) => (S.catatan[id] || []).length;
  const nSub = (id) => SEMUA_SUB.filter((s) => subTerisi(s, S.nilai[id])).length;
  const bisaNarasi = (id) => nSub(id) > 0 || nCatatan(id) > 0 || buktiPpmAnak(S, id).length > 0;

  const setRapor = (id, patch) =>
    ubahSem(ubah, (s) => ({ ...s, rapor: { ...s.rapor, [id]: { ...(s.rapor[id] || {}), ...patch } } }));

  async function buatNarasi(m) {
    const j = await panggilApi("narasi", {
      anak: { nama: m.nama, panggilan: m.panggilan, jk: m.jk },
      kelas: data.kelas,
      nilai: S.nilai[m.id] || {},
      bukti: S.bukti[m.id] || {},
      catatan: (S.catatan[m.id] || []).map((c) => ({ tanggal: c.tanggal, isi: c.isi })),
      koku: { ...S.koku, ...(S.kokuAnak[m.id] || {}) },
      ppm: buktiPpmAnak(S, m.id),
    });
    setRapor(m.id, {
      agama: j.agama.narasi,
      jati_diri: j.jati_diri.narasi,
      literasi: j.literasi.narasi,
      kurang: { agama: j.agama.kurang_bukti, jati_diri: j.jati_diri.kurang_bukti, literasi: j.literasi.kurang_bukti },
      kokurikuler: j.kokurikuler,
      saran: j.saran,
      dibuat: new Date().toISOString(),
    });
  }

  async function buatSatu() {
    if (adaNarasi(r) && !confirm("Narasi yang sudah ada (termasuk suntingan Anda) akan diganti. Lanjutkan?")) return;
    if (nSub(anak.id) < 14 && !confirm(`Baru ${nSub(anak.id)} dari 14 sub-elemen CP yang dinilai. Tetap susun narasi?`)) return;
    setGalat("");
    setSibuk(anak.id);
    try {
      await buatNarasi(anak);
    } catch (e) {
      setGalat(e.butuhKode ? `${e.message} Isi kode akses di tab Kelas.` : e.message);
    } finally {
      setSibuk(null);
    }
  }

  async function buatSemua() {
    const target = data.murid.filter((m) => bisaNarasi(m.id) && !adaNarasi(S.rapor[m.id]));
    if (!target.length) {
      setGalat("Semua anak yang sudah dinilai sudah dibuatkan narasi.");
      return;
    }
    setGalat("");
    setMassal({ selesai: 0, total: target.length });
    const gagal = [];
    for (const m of target) {
      setSibuk(m.id);
      try {
        await buatNarasi(m);
      } catch (e) {
        gagal.push(m.nama);
        if (e.butuhKode) {
          setGalat(`${e.message} Isi kode akses di tab Kelas.`);
          break;
        }
      }
      setMassal((x) => ({ ...x, selesai: x.selesai + 1 }));
    }
    setSibuk(null);
    setMassal(null);
    if (gagal.length) setGalat((g) => g || `Narasi gagal dibuat untuk: ${gagal.join(", ")}. Coba lagi.`);
  }

  function cetakRapor(ids) {
    flushSync(() => setCetak(ids));
    window.print();
  }

  const siapCetak = data.murid.filter((m) => adaNarasi(S.rapor[m.id]));
  const kelasBelumLengkap = !data.kelas.sekolahId || !data.kelas.namaKelas;

  return (
    <>
      <div className="flex flex-col gap-4 print:hidden">
        {kelasBelumLengkap && (
          <Pesan tone="warning">
            Data kelas belum lengkap (sekolah/nama kelas).{" "}
            <button type="button" className="font-semibold underline" onClick={() => keTab("kelas")}>
              Lengkapi
            </button>
          </Pesan>
        )}

        <Card>
          <Judul kanan={<Badge>{siapCetak.length}/{data.murid.length} siap</Badge>}>
            Rekap Kelas · Semester {data.kelas.semester}
          </Judul>
          <ul className="divide-y divide-border">
            {data.murid.map((m) => {
              const ada = adaNarasi(S.rapor[m.id]);
              const ns = nSub(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setAnakId(m.id)}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${m.id === anak.id ? "bg-primary-soft" : ""}`}
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold">{m.nama}</span>
                    <span className={`text-xs ${ns === 14 ? "text-primary" : "text-accent"}`}>CP {ns}/14</span>
                    {sibuk === m.id ? (
                      <Badge tone="warning">menyusun…</Badge>
                    ) : ada ? (
                      <Badge>✓ narasi</Badge>
                    ) : (
                      <Badge tone="danger">belum</Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-2 p-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.kelas.lampiranTP}
                onChange={(e) => ubah((d) => ({ ...d, kelas: { ...d.kelas, lampiranTP: e.target.checked } }))}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Sertakan lampiran capaian TP per sub-elemen saat dicetak
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={buatSemua} disabled={Boolean(sibuk)}>
                {massal ? `Menyusun ${massal.selesai}/${massal.total}…` : "✨ Narasi semua yang belum"}
              </Button>
              <Button type="button" onClick={() => cetakRapor(siapCetak.map((m) => m.id))} disabled={!siapCetak.length}>
                🖨️ Cetak semua ({siapCetak.length})
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <Judul kanan={<Badge tone={nSub(anak.id) === 14 ? "neutral" : "warning"}>CP {nSub(anak.id)}/14</Badge>}>
            {anak.nama}
          </Judul>
          <div className="flex flex-col gap-4 p-4">
            {!bisaNarasi(anak.id) ? (
              <Pesan tone="warning">
                Anak ini belum dinilai. Narasi disusun dari Penilaian CP (dan catatan harian).{" "}
                <button type="button" className="font-semibold underline" onClick={() => keTab("nilai")}>
                  Isi penilaian
                </button>
              </Pesan>
            ) : (
              <Button type="button" onClick={buatSatu} disabled={Boolean(sibuk)}>
                {sibuk === anak.id
                  ? "Menyusun narasi… (±30-60 detik)"
                  : adaNarasi(r)
                    ? "✨ Susun ulang narasi"
                    : "✨ Susun narasi dari penilaian CP"}
              </Button>
            )}

            {CP.map((e) => (
              <Ruas key={e.id} label={`${e.no}. ${e.nama}`}>
                {r.kurang?.[e.id] && (
                  <span className="text-xs font-semibold text-accent">
                    ⚠️ Penilaian/bukti elemen ini masih sedikit — narasi masih umum. Lengkapi penilaian atau sunting manual.
                  </span>
                )}
                <textarea
                  className={`${kelasInput} min-h-40 leading-relaxed`}
                  value={r[e.id] || ""}
                  onChange={(ev) => setRapor(anak.id, { [e.id]: ev.target.value })}
                  placeholder="Ketik manual, atau tekan tombol susun narasi di atas."
                />
              </Ruas>
            ))}

            <Ruas label="Kokurikuler">
              <textarea
                className={`${kelasInput} min-h-24`}
                value={r.kokurikuler || ""}
                onChange={(ev) => setRapor(anak.id, { kokurikuler: ev.target.value })}
              />
            </Ruas>

            <Ruas label="Saran / refleksi guru untuk orang tua">
              <textarea
                className={`${kelasInput} min-h-24`}
                value={r.saran || ""}
                onChange={(ev) => setRapor(anak.id, { saran: ev.target.value })}
              />
            </Ruas>

            <div className="grid grid-cols-3 gap-2">
              {ANGKA.map(([f, label]) => (
                <Ruas key={f} label={label}>
                  <input
                    className={kelasInput}
                    inputMode="decimal"
                    value={r[f] ?? ""}
                    onChange={(ev) => setRapor(anak.id, { [f]: ev.target.value })}
                  />
                </Ruas>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => cetakRapor([anak.id])} disabled={!adaNarasi(r)}>
              🖨️ Cetak / simpan PDF rapor {anak.panggilan || anak.nama.split(" ")[0]}
            </Button>
            <p className="text-xs text-muted">
              Di jendela cetak, pilih printer atau &quot;Simpan sebagai PDF&quot; dengan ukuran kertas A4.
            </p>
          </div>
        </Card>

        {galat && <Pesan tone="danger">{galat}</Pesan>}
      </div>

      <div className="hidden print:block">
        {cetak.map((id) => {
          const m = data.murid.find((x) => x.id === id);
          return m ? (
            <LembarRapor
              key={id}
              anak={m}
              kelas={data.kelas}
              rapor={S.rapor[id] || {}}
              nilai={S.nilai[id] || {}}
              koku={{ ...S.koku, ...(S.kokuAnak[id] || {}) }}
            />
          ) : null;
        })}
      </div>
    </>
  );
}
