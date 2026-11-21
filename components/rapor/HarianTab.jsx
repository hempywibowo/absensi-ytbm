"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { LINGKUP_BY_ID } from "@/lib/rapor-cp";
import { DIMENSI } from "@/lib/rapor-cp";
import {
  batasPpm,
  hariIniISO,
  idBaru,
  naikkanNilai,
  panggilApi,
  semAktif,
  seninDari,
  tambahHari,
  tanggalIndo,
  ubahSem,
} from "@/lib/rapor-client";
import FotoPicker from "./FotoPicker";
import KirimServer from "./KirimServer";
import LampiranMedia, { MiniMedia } from "./LampiranMedia";
import { EvaluasiHarian, LaporanMingguan } from "./EvaluasiPpm";
import { ChipTp, Judul, OpsiTp, Pesan, Ruas, kelasInput } from "./bagian";

const kunciTp = (t) => `${t.lingkup_id}:${t.level}`;
const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum"];

// Input harian guru: rencana TP mingguan, catatan kegiatan (ketik/foto) yang diberi label CP/TP oleh AI,
// ceklis cepat TP minggu ini, review satu per satu, kelengkapan, dan kirim ke server.
// Semua tersimpan di perangkat dulu (draf); baru masuk server saat guru menekan "Kirim ke Server".
export default function HarianTab({ data, ubah, keTab }) {
  const S = semAktif(data);
  const [tanggal, setTanggal] = useState(hariIniISO);
  const [mode, setMode] = useState(null); // null | "ketik" | "foto"
  const [isi, setIsi] = useState("");
  const [anakDipilih, setAnakDipilih] = useState([]);
  const [foto, setFoto] = useState([]);
  const [sibuk, setSibuk] = useState("");
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");
  const [reviewKe, setReviewKe] = useState(null); // index entri yang sedang direview
  const [lampiran, setLampiran] = useState([]); // foto/video untuk catatan baru
  const [pemicuNilai, setPemicuNilai] = useState(0); // naik -> nilai kesesuaian otomatis
  // Rencana minggu terbuka otomatis bila minggu ini belum punya rencana.
  const [bukaRencana, setBukaRencana] = useState(() => {
    const r = semAktif(data).minggu?.[seninDari(hariIniISO())];
    return !r || (!r.tp?.length && !r.tema);
  });

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

  const senin = seninDari(tanggal);
  // Strip hari: Senin–Jumat, plus Sabtu/Minggu bila tanggal yang dipilih jatuh di akhir pekan.
  const hariMinggu = [0, 1, 2, 3, 4].map((i) => tambahHari(senin, i));
  if (!hariMinggu.includes(tanggal)) hariMinggu.push(tanggal);
  const semuaHariMinggu = [0, 1, 2, 3, 4, 5, 6].map((i) => tambahHari(senin, i));
  const rencana = { tema: "", subTema: "", tp: [], ...(S.minggu?.[senin] || {}) };
  // Mulai Kamis, ingatkan PPM minggu depan bila belum ada.
  const seninDepan = tambahHari(senin, 7);
  const rencanaDepan = S.minggu?.[seninDepan];
  const perluPpmDepan = tanggal >= tambahHari(senin, 3) && !(rencanaDepan?.tp?.length || rencanaDepan?.kegiatan?.length);
  const lewatBatasDepan = new Date() > batasPpm(seninDepan);
  const entriHari = (S.jurnal || []).filter((j) => j.tanggal === tanggal);
  const draf = entriHari.filter((j) => j.status !== "direview");
  const ceklisHari = S.ceklis?.[tanggal] || {};
  const namaAnak = (id) => {
    const m = data.murid.find((x) => x.id === id);
    return m ? m.panggilan || m.nama.split(" ")[0] : "?";
  };
  const galatApi = (e) => (e.butuhKode ? `${e.message} Isi kode akses di tab Kelas.` : e.message);

  /* ----------------------------- rencana minggu ----------------------------- */
  const setRencana = (patch) =>
    ubahSem(ubah, (s) => ({ ...s, minggu: { ...(s.minggu || {}), [senin]: { ...rencana, ...patch } } }));

  /* ----------------------------- jurnal ----------------------------- */
  const setJurnal = (fn) => ubahSem(ubah, (s) => ({ ...s, jurnal: fn(s.jurnal || []) }));

  async function beriLabel(entri) {
    if (!entri.length) return;
    try {
      const j = await panggilApi("label-jurnal", {
        entri: entri.map((e) => ({ id: e.id, isi: e.isi })),
        murid: data.murid.map((m) => ({ id: m.id, nama: m.nama, panggilan: m.panggilan })),
        tpMinggu: rencana.tp,
      });
      const peta = Object.fromEntries(j.hasil.map((h) => [h.id, h]));
      setJurnal((list) =>
        list.map((e) => {
          const h = peta[e.id];
          if (!h) return e;
          return {
            ...e,
            anakIds: e.anakIds?.length ? e.anakIds : h.anak_ids,
            label: h.label,
            berlabel: true,
          };
        }),
      );
    } catch (e) {
      setGalat(`Catatan tersimpan sebagai draf, tetapi label otomatis gagal: ${galatApi(e)} Bisa diberi label saat review.`);
    }
  }

  async function simpanKetik(e) {
    e.preventDefault();
    if (!isi.trim()) return;
    const baru = {
      id: idBaru(),
      tanggal,
      isi: isi.trim(),
      anakIds: anakDipilih,
      label: [],
      sumber: "ketik",
      status: "draf",
      media: lampiran,
    };
    setJurnal((list) => [...list, baru]);
    setIsi("");
    setAnakDipilih([]);
    setLampiran([]);
    setGalat("");
    setInfo("Catatan tersimpan sebagai draf. Memberi label CP/TP…");
    setSibuk("label");
    await beriLabel([baru]);
    setSibuk("");
    setInfo("Catatan tersimpan sebagai draf. Review setelah kelas selesai.");
  }

  async function bacaFoto() {
    setSibuk("foto");
    setGalat("");
    setInfo("");
    try {
      const j = await panggilApi("baca-catatan", {
        foto,
        murid: data.murid.map((m) => ({ id: m.id, nama: m.nama, panggilan: m.panggilan })),
        anakId: anakDipilih.length === 1 ? anakDipilih[0] : "",
      });
      const baru = j.catatan
        .filter((c) => c.isi.trim())
        .map((c) => ({
          id: idBaru(),
          tanggal: c.tanggal || tanggal,
          isi: (j.catatan_umum ? `Kegiatan: ${j.catatan_umum}. ` : "") + c.isi.trim(),
          anakIds: c.anak_id ? [c.anak_id] : [],
          namaTertulis: c.anak_id ? "" : c.nama_tertulis,
          label: [],
          sumber: "foto",
          status: "draf",
          media: [],
        }));
      if (baru.length && lampiran.length) baru[0].media = lampiran;
      setLampiran([]);
      setJurnal((list) => [...list, ...baru]);
      setFoto([]);
      setMode(null);
      setInfo(`${baru.length} catatan dari foto tersimpan sebagai draf. Memberi label CP/TP…`);
      setSibuk("label");
      await beriLabel(baru);
      setInfo(`${baru.length} catatan dari foto tersimpan sebagai draf. Review setelah kelas selesai.`);
      if (j.peringatan) setGalat(j.peringatan);
    } catch (e) {
      setGalat(galatApi(e));
    } finally {
      setSibuk("");
    }
  }

  /* ----------------------------- ceklis ----------------------------- */
  function toggleCeklis(anakId, t) {
    const k = kunciTp(t);
    ubahSem(ubah, (s) => {
      const hari = { ...(s.ceklis?.[tanggal] || {}) };
      const list = hari[anakId] || [];
      const nyala = !list.includes(k);
      hari[anakId] = nyala ? [...list, k] : list.filter((x) => x !== k);
      return {
        ...s,
        ceklis: { ...(s.ceklis || {}), [tanggal]: hari },
        nilai: nyala ? naikkanNilai(s.nilai, anakId, [t]) : s.nilai,
      };
    });
  }

  /* ----------------------------- review ----------------------------- */
  const antrianReview = entriHari;
  const cur = reviewKe !== null ? antrianReview[reviewKe] : null;
  const ubahEntri = (id, patch) => setJurnal((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  function simpanReview() {
    if (!cur) return;
    ubahSem(ubah, (s) => {
      let nilai = s.nilai;
      for (const a of cur.anakIds || []) nilai = naikkanNilai(nilai, a, cur.label);
      return {
        ...s,
        nilai,
        jurnal: (s.jurnal || []).map((e) => (e.id === cur.id ? { ...e, status: "direview" } : e)),
      };
    });
    if (reviewKe + 1 < antrianReview.length) setReviewKe(reviewKe + 1);
    else {
      setReviewKe(null);
      setInfo("Semua catatan hari ini sudah direview — kesesuaian dengan PPM dinilai otomatis. Lalu tekan \"Kirim ke Server\".");
      if (rencana.tp.length || rencana.kegiatan?.length) setPemicuNilai((x) => x + 1);
    }
  }

  function hapusEntri(id) {
    if (!confirm("Hapus catatan ini?")) return;
    setJurnal((list) => list.filter((e) => e.id !== id));
    if (reviewKe !== null && reviewKe >= antrianReview.length - 1) setReviewKe(antrianReview.length > 1 ? antrianReview.length - 2 : null);
  }

  /* ----------------------------- kelengkapan ----------------------------- */
  const buktiMinggu = {}; // anakId -> Set(kunciTp)
  const anakAdaBuktiMinggu = new Set();
  for (const h of semuaHariMinggu) {
    for (const e of (S.jurnal || []).filter((j) => j.tanggal === h)) {
      for (const a of e.anakIds || []) {
        anakAdaBuktiMinggu.add(a);
        buktiMinggu[a] = buktiMinggu[a] || new Set();
        for (const l of e.label || []) buktiMinggu[a].add(kunciTp(l));
      }
    }
    for (const [a, list] of Object.entries(S.ceklis?.[h] || {})) {
      if (list.length) anakAdaBuktiMinggu.add(a);
      buktiMinggu[a] = buktiMinggu[a] || new Set();
      list.forEach((k) => buktiMinggu[a].add(k));
    }
  }
  const tpBelum = rencana.tp.filter((t) => !Object.values(buktiMinggu).some((set) => set.has(kunciTp(t))));
  const anakBelum = data.murid.filter((m) => !anakAdaBuktiMinggu.has(m.id));
  const anakHariIni = new Set([
    ...entriHari.flatMap((e) => e.anakIds || []),
    ...Object.entries(ceklisHari)
      .filter(([, l]) => l.length)
      .map(([a]) => a),
  ]);

  return (
    <>
      {/* Tanggal */}
      <Card className="flex items-center gap-2 p-3">
        <button type="button" onClick={() => setTanggal(tambahHari(tanggal, -1))} className="rounded-lg px-3 py-2 text-lg font-bold text-primary">
          ‹
        </button>
        <input type="date" className={kelasInput} value={tanggal} onChange={(e) => e.target.value && setTanggal(e.target.value)} />
        <button type="button" onClick={() => setTanggal(tambahHari(tanggal, 1))} className="rounded-lg px-3 py-2 text-lg font-bold text-primary">
          ›
        </button>
      </Card>
      <div className={`grid gap-1 text-center text-[11px] ${hariMinggu.length > 5 ? "grid-cols-6" : "grid-cols-5"}`}>
        {hariMinggu.map((h, i) => {
          const n = (S.jurnal || []).filter((j) => j.tanggal === h).length;
          return (
            <button
              key={h}
              type="button"
              onClick={() => setTanggal(h)}
              className={`rounded-lg border py-1.5 ${h === tanggal ? "border-primary bg-primary-soft font-bold text-primary" : "border-border"}`}
            >
              {HARI[i] || (new Date(`${h}T00:00:00`).getDay() === 6 ? "Sab" : "Min")} {Number(h.slice(8))}
              <span className={`block ${n ? "text-primary" : "text-muted"}`}>{n ? `${n} catatan` : "—"}</span>
            </button>
          );
        })}
      </div>

      {/* Kewajiban PPM */}
      {!rencana.tp.length && !rencana.kegiatan?.length && (
        <Pesan tone="danger">
          ⚠️ PPM minggu ini belum diunggah. PPM wajib diunggah sebelum minggu berjalan (paling lambat Jumat 23.59 WIB).{" "}
          <button type="button" className="font-semibold underline" onClick={() => keTab("ppm")}>
            Unggah PPM
          </button>
        </Pesan>
      )}
      {perluPpmDepan && (
        <Pesan tone="warning">
          📂 PPM minggu depan ({tanggalIndo(seninDepan)}) belum ada.{" "}
          {lewatBatasDepan
            ? "Batas Jumat 23.59 WIB sudah lewat — segera unggah (tercatat terlambat)."
            : `Batas unggah: Jumat ${tanggalIndo(tambahHari(seninDepan, -3))} pukul 23.59 WIB.`}{" "}
          <button type="button" className="font-semibold underline" onClick={() => keTab("ppm")}>
            Unggah sekarang
          </button>
        </Pesan>
      )}

      {/* Rencana minggu */}
      <Card>
        <button type="button" onClick={() => setBukaRencana(!bukaRencana)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
          <span>
            <span className="block font-semibold">Rencana minggu ini</span>
            <span className="text-xs text-muted">
              {rencana.tema || rencana.tp.length
                ? `${[rencana.tema, rencana.subTema].filter(Boolean).join(" · ") || "Tanpa tema"} · ${rencana.tp.length} TP`
                : `${tanggalIndo(senin)} — belum diisi`}
            </span>
          </span>
          <span className="text-muted">{bukaRencana ? "▲" : "▼"}</span>
        </button>
        {bukaRencana && (
          <div className="flex flex-col gap-3 border-t border-border p-4">
            <div className="grid grid-cols-2 gap-2">
              <Ruas label="Tema">
                <input className={kelasInput} value={rencana.tema} onChange={(e) => setRencana({ tema: e.target.value })} />
              </Ruas>
              <Ruas label="Sub tema">
                <input className={kelasInput} value={rencana.subTema} onChange={(e) => setRencana({ subTema: e.target.value })} />
              </Ruas>
            </div>
            {rencana.sumber === "ppm" && (
              <div className="flex flex-col gap-2 rounded-xl bg-primary-soft p-3 text-xs">
                <p className="font-semibold text-primary">Dari PPM: {rencana.file}</p>
                {rencana.dpl?.length > 0 && <p><b>DPL:</b> {rencana.dpl.map((i) => DIMENSI[i]).join(", ")}</p>}
                {rencana.kegiatan?.length > 0 && (
                  <details>
                    <summary className="cursor-pointer font-semibold">Kegiatan ({rencana.kegiatan.length})</summary>
                    <ol className="mt-1 list-decimal pl-5">
                      {rencana.kegiatan.map((k, i) => (
                        <li key={i}>{k.teks}</li>
                      ))}
                    </ol>
                  </details>
                )}
                {rencana.pemantik?.length > 0 && (
                  <details>
                    <summary className="cursor-pointer font-semibold">Pertanyaan pemantik ({rencana.pemantik.length})</summary>
                    <ul className="mt-1 list-disc pl-5">
                      {rencana.pemantik.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
            <p className="text-xs font-semibold text-muted">TP minggu ini (3–5 TP dari ATP resmi)</p>
            <div className="flex flex-wrap gap-1.5">
              {rencana.tp.map((t, i) => (
                <ChipTp key={i} {...t} onHapus={() => setRencana({ tp: rencana.tp.filter((_, j) => j !== i) })} />
              ))}
            </div>
            <select
              className={kelasInput}
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                const [lingkup_id, lv] = e.target.value.split("|");
                const t = { lingkup_id, level: Number(lv) };
                if (!rencana.tp.some((x) => kunciTp(x) === kunciTp(t))) setRencana({ tp: [...rencana.tp, t] });
              }}
            >
              <option value="">+ Tambah TP…</option>
              <OpsiTp />
            </select>
          </div>
        )}
      </Card>

      {/* Tambah catatan */}
      <Card>
        <Judul kanan={<Badge>{entriHari.length} catatan</Badge>}>Catatan {tanggalIndo(tanggal)}</Judul>
        <div className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "ketik" ? "primary" : "outline"} onClick={() => setMode(mode === "ketik" ? null : "ketik")}>
              ⌨️ Ketik
            </Button>
            <Button type="button" variant={mode === "foto" ? "primary" : "outline"} onClick={() => setMode(mode === "foto" ? null : "foto")}>
              📷 Foto catatan
            </Button>
          </div>

          {mode && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted">
                Anak (opsional — kalau kosong, AI mengenali dari isi catatan)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.murid.map((m) => {
                  const on = anakDipilih.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAnakDipilih(on ? anakDipilih.filter((x) => x !== m.id) : [...anakDipilih, m.id])}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${on ? "border-primary bg-primary-soft text-primary" : "border-border"}`}
                    >
                      {m.panggilan || m.nama.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode && <LampiranMedia media={lampiran} setMedia={setLampiran} />}

          {mode === "ketik" && (
            <form onSubmit={simpanKetik} className="flex flex-col gap-2">
              <textarea
                className={`${kelasInput} min-h-28`}
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Contoh: Saat menyelidiki angin, Hafizh dan Bilal membandingkan kincir siapa yang berputar lebih cepat. Hafizh berkata, 'Punyaku lebih cepat karena di depan kipas.'"
              />
              <Button type="submit" disabled={!isi.trim() || Boolean(sibuk)}>
                Simpan draf
              </Button>
            </form>
          )}

          {mode === "foto" && (
            <div className="flex flex-col gap-2">
              <FotoPicker foto={foto} setFoto={setFoto} />
              <Button type="button" onClick={bacaFoto} disabled={!foto.length || Boolean(sibuk)}>
                {sibuk === "foto" ? "Membaca tulisan… (±1 menit)" : "Baca foto jadi catatan"}
              </Button>
            </div>
          )}

          {sibuk === "label" && <p className="text-sm text-muted">Memberi label CP/TP…</p>}
          {galat && <Pesan tone="danger">{galat}</Pesan>}
          {info && <Pesan>{info}</Pesan>}

          {entriHari.length > 0 && (
            <ul className="flex flex-col gap-2">
              {entriHari.map((e, i) => (
                <li key={e.id} className="rounded-xl border border-border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted">
                      {(e.anakIds || []).map(namaAnak).join(", ") || e.namaTertulis || "Belum ada anak"}
                    </span>
                    {e.status === "direview" ? <Badge>✓ direview</Badge> : <Badge tone="warning">draf</Badge>}
                  </div>
                  <p className="line-clamp-3 text-sm">{e.isi}</p>
                  {e.media?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {e.media.map((m) => (
                        <MiniMedia key={m.id} m={m} />
                      ))}
                    </div>
                  )}
                  {e.label?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {e.label.map((l, k) => (
                        <ChipTp key={k} {...l} />
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => setReviewKe(i)} className="mt-1.5 text-xs font-semibold text-primary">
                    {e.status === "direview" ? "Ubah" : "Review"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {draf.length > 0 && reviewKe === null && (
            <Button type="button" onClick={() => setReviewKe(entriHari.findIndex((e) => e.status !== "direview"))}>
              🔍 Review {draf.length} draf satu per satu
            </Button>
          )}
        </div>
      </Card>

      {/* Review satu per satu */}
      {cur && (
        <Card className="border-primary">
          <Judul kanan={<Badge>{reviewKe + 1}/{antrianReview.length}</Badge>}>Review catatan</Judul>
          <div className="flex flex-col gap-3 p-4">
            <textarea className={`${kelasInput} min-h-28`} value={cur.isi} onChange={(e) => ubahEntri(cur.id, { isi: e.target.value })} />
            {cur.namaTertulis && !cur.anakIds?.length && (
              <p className="text-xs text-accent">Nama di foto: {cur.namaTertulis} — pilih anaknya di bawah.</p>
            )}
            <p className="text-xs font-semibold text-muted">Anak</p>
            <div className="flex flex-wrap gap-1.5">
              {data.murid.map((m) => {
                const on = cur.anakIds?.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      ubahEntri(cur.id, { anakIds: on ? cur.anakIds.filter((x) => x !== m.id) : [...(cur.anakIds || []), m.id] })
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${on ? "border-primary bg-primary-soft text-primary" : "border-border"}`}
                  >
                    {m.panggilan || m.nama.split(" ")[0]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-muted">Foto / video kegiatan</p>
            <LampiranMedia media={cur.media || []} setMedia={(m) => ubahEntri(cur.id, { media: m })} />
            <p className="text-xs font-semibold text-muted">Label CP/TP {cur.berlabel ? "(usulan AI — periksa)" : ""}</p>
            <div className="flex flex-wrap gap-1.5">
              {(cur.label || []).map((l, k) => (
                <ChipTp key={k} {...l} onHapus={() => ubahEntri(cur.id, { label: cur.label.filter((_, j) => j !== k) })} />
              ))}
              {!cur.label?.length && <span className="text-xs text-muted">Belum ada label.</span>}
            </div>
            <select
              className={kelasInput}
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                const [lingkup_id, lv] = e.target.value.split("|");
                ubahEntri(cur.id, { label: [...(cur.label || []), { lingkup_id, level: Number(lv) }] });
              }}
            >
              <option value="">+ Tambah label TP…</option>
              {rencana.tp.length > 0 && (
                <optgroup label="TP minggu ini">
                  {rencana.tp.map((t) => (
                    <option key={kunciTp(t)} value={`${t.lingkup_id}|${t.level}`}>
                      {LINGKUP_BY_ID[t.lingkup_id]?.sub} · TP {t.level}: {LINGKUP_BY_ID[t.lingkup_id]?.tp[t.level - 1]?.replace(/^Murid /, "")}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Semua TP">
                <OpsiTp />
              </optgroup>
            </select>
            {!cur.berlabel && (
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(sibuk)}
                onClick={async () => {
                  setSibuk("label");
                  await beriLabel([cur]);
                  setSibuk("");
                }}
              >
                {sibuk === "label" ? "Memberi label…" : "✨ Beri label otomatis"}
              </Button>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="ghost" className="px-2 text-danger" onClick={() => hapusEntri(cur.id)}>
                Hapus
              </Button>
              <Button type="button" variant="outline" className="px-2" onClick={() => setReviewKe(null)}>
                Tutup
              </Button>
              <Button type="button" className="px-2" onClick={simpanReview} disabled={!cur.isi.trim()}>
                ✓ Simpan
              </Button>
            </div>
            {!cur.anakIds?.length && <p className="text-xs text-muted">Catatan tanpa anak tetap disimpan sebagai catatan kegiatan kelas.</p>}
          </div>
        </Card>
      )}

      {/* Ceklis cepat */}
      {rencana.tp.length > 0 && (
        <Card>
          <Judul kanan={<Badge>{Object.values(ceklisHari).filter((l) => l.length).length} anak</Badge>}>Ceklis TP hari ini</Judul>
          <div className="flex flex-col gap-1 p-3">
            <p className="px-1 pb-1 text-xs text-muted">Ketuk TP yang muncul pada anak hari ini (✓). Kosong = belum diamati, bukan berarti belum mampu.</p>
            {data.murid.map((m) => (
              <div key={m.id} className="flex items-center gap-2 border-t border-border py-1.5 first:border-t-0">
                <span className="w-20 shrink-0 truncate text-sm font-semibold">{m.panggilan || m.nama.split(" ")[0]}</span>
                <div className="flex flex-wrap gap-1">
                  {rencana.tp.map((t, i) => {
                    const on = (ceklisHari[m.id] || []).includes(kunciTp(t));
                    return (
                      <button
                        key={i}
                        type="button"
                        title={LINGKUP_BY_ID[t.lingkup_id]?.tp[t.level - 1]}
                        onClick={() => toggleCeklis(m.id, t)}
                        className={`rounded-lg border px-2 py-1 text-xs font-bold ${on ? "border-primary bg-primary-soft text-primary" : "border-border text-muted"}`}
                      >
                        TP{i + 1} {on ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-2 flex flex-col gap-0.5 px-1 text-[11px] text-muted">
              {rencana.tp.map((t, i) => (
                <span key={i}>
                  TP{i + 1} = {LINGKUP_BY_ID[t.lingkup_id]?.tp[t.level - 1]}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Kelengkapan */}
      <Card>
        <Judul>Kelengkapan</Judul>
        <div className="flex flex-col gap-2 p-4 text-sm">
          <p>
            <b>Hari ini:</b> {entriHari.length} catatan ({draf.length} draf) · {anakHariIni.size}/{data.murid.length} anak sudah ada bukti
          </p>
          {rencana.tp.length > 0 && (
            <p>
              <b>TP minggu ini belum diamati:</b>{" "}
              {tpBelum.length ? tpBelum.map((t) => `TP${rencana.tp.findIndex((x) => kunciTp(x) === kunciTp(t)) + 1}`).join(", ") : "semua sudah ✓"}
            </p>
          )}
          <p>
            <b>Belum ada catatan/ceklis minggu ini:</b> {anakBelum.length ? anakBelum.map((m) => m.panggilan || m.nama.split(" ")[0]).join(", ") : "semua anak sudah ✓"}
          </p>
          <p className="text-xs text-muted">Ini pengingat untuk pengamatan berikutnya, bukan nilai. Tidak semua TP harus muncul dalam sehari.</p>
        </div>
      </Card>

      <EvaluasiHarian data={data} ubah={ubah} S={S} tanggal={tanggal} rencana={rencana} pemicu={pemicuNilai} />
      <LaporanMingguan data={data} ubah={ubah} S={S} senin={senin} rencana={rencana} />

      <KirimServer data={data} ubah={ubah} />
    </>
  );
}
