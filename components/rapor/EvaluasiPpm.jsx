"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { LINGKUP_BY_ID } from "@/lib/rapor-cp";
import { panggilApi, tambahHari, tanggalIndo, ubahSem } from "@/lib/rapor-client";
import { fotoUntukAi } from "@/lib/rapor-media";
import { ChipTp, Judul, Pesan } from "./bagian";

const kunciTp = (t) => `${t.lingkup_id}:${t.level}`;
const STATUS = {
  terlaksana: { teks: "✓ terlaksana", kelas: "text-primary" },
  sebagian: { teks: "◐ sebagian", kelas: "text-accent" },
  belum: { teks: "○ belum", kelas: "text-muted" },
};
const muridRingkas = (data) => data.murid.map((m) => ({ id: m.id, nama: m.nama, panggilan: m.panggilan }));
const galatApi = (e) => (e.butuhKode ? `${e.message} Isi kode akses di tab Kelas.` : e.message);

function WarnaSkor({ skor }) {
  const tone = skor >= 75 ? "bg-primary" : skor >= 50 ? "bg-accent" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-soft">
        <div className={`h-full ${tone}`} style={{ width: `${skor}%` }} />
      </div>
      <b className="w-12 text-right">{skor}%</b>
    </div>
  );
}

// Penilaian otomatis: apakah laporan hari ini sesuai dengan PPM (rencana) minggu ini.
export function EvaluasiHarian({ data, ubah, S, tanggal, rencana, pemicu = 0 }) {
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const ev = S.evaluasi?.[tanggal];
  const entri = (S.jurnal || []).filter((j) => j.tanggal === tanggal);
  const adaRencana = rencana.tp?.length || rencana.kegiatan?.length;

  async function nilai() {
    setSibuk(true);
    setGalat("");
    try {
      const fotoIds = entri.flatMap((j) => (j.media || []).filter((m) => m.jenis === "foto").map((m) => m.id)).slice(0, 4);
      const foto = (await Promise.all(fotoIds.map(fotoUntukAi))).filter(Boolean);
      const hasil = await panggilApi("evaluasi-harian", {
        tanggal,
        rencana,
        jurnal: entri.map((j) => ({ isi: j.isi, anakIds: j.anakIds, label: j.label })),
        murid: muridRingkas(data),
        foto,
      });
      ubahSem(ubah, (s) => ({ ...s, evaluasi: { ...(s.evaluasi || {}), [tanggal]: { ...hasil, dibuat: new Date().toISOString() } } }));
    } catch (e) {
      setGalat(galatApi(e));
    } finally {
      setSibuk(false);
    }
  }

  // Dinilai otomatis setiap kali guru selesai mereview semua catatan hari itu.
  const pemicuTerakhir = useRef(pemicu);
  useEffect(() => {
    if (pemicu !== pemicuTerakhir.current) {
      pemicuTerakhir.current = pemicu;
      nilai();
    }
  });

  return (
    <Card>
      <Judul kanan={ev ? <Badge tone={ev.skor >= 75 ? "neutral" : "warning"}>{ev.skor}%</Badge> : null}>Kesesuaian dengan PPM hari ini</Judul>
      <div className="flex flex-col gap-3 p-4 text-sm">
        {!adaRencana ? (
          <Pesan tone="warning">Minggu ini belum ada PPM/rencana, jadi kesesuaian belum bisa dinilai.</Pesan>
        ) : (
          <>
            {ev && (
              <>
                <WarnaSkor skor={ev.skor} />
                <p>{ev.ringkasan}</p>
                {rencana.kegiatan?.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {rencana.kegiatan.map((k, i) => {
                      const st = ev.kegiatan.find((x) => x.no === i + 1)?.status || "belum";
                      return (
                        <li key={i} className="flex gap-2 text-xs">
                          <span className={`w-24 shrink-0 font-semibold ${STATUS[st].kelas}`}>{STATUS[st].teks}</span>
                          <span>{k.teks}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {ev.tp_teramati?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted">TP teramati:</span>
                    {ev.tp_teramati.map((n) => rencana.tp[n - 1] && <ChipTp key={n} {...rencana.tp[n - 1]} />)}
                  </div>
                )}
                {ev.luar_rencana?.length > 0 && <p className="text-xs text-muted">Di luar rencana: {ev.luar_rencana.join("; ")}</p>}
              </>
            )}
            <Button type="button" variant={ev ? "outline" : "primary"} onClick={nilai} disabled={sibuk || !entri.length}>
              {sibuk ? "Menilai… (±30 detik)" : ev ? "↻ Nilai ulang" : "📊 Nilai kesesuaian hari ini"}
            </Button>
            {!entri.length && <p className="text-xs text-muted">Isi laporan hari ini dulu.</p>}
          </>
        )}
        {galat && <Pesan tone="danger">{galat}</Pesan>}
      </div>
    </Card>
  );
}

// Laporan Aktivitas Mingguan: rencana (PPM Jumat lalu) vs pelaksanaan harian, saran, dan asesmen awal
// untuk PPM minggu depan.
export function LaporanMingguan({ data, ubah, S, senin, rencana }) {
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [tersalin, setTersalin] = useState(false);
  const lap = S.laporan?.[senin];
  const adaRencana = rencana.tp?.length || rencana.kegiatan?.length;
  const hariList = [0, 1, 2, 3, 4, 5, 6].map((i) => tambahHari(senin, i));

  // Anak yang sudah teramati per TP rencana (dari label catatan & ceklis).
  const tpAnak = {};
  const hari = hariList.map((t) => {
    const jurnal = (S.jurnal || []).filter((j) => j.tanggal === t);
    const per = {};
    for (const j of jurnal) for (const l of j.label || []) for (const a of j.anakIds || []) (per[kunciTp(l)] ||= new Set()).add(a);
    for (const [a, list] of Object.entries(S.ceklis?.[t] || {})) for (const k of list) (per[k] ||= new Set()).add(a);
    for (const [k, set] of Object.entries(per)) (tpAnak[k] ||= new Set()) && set.forEach((a) => tpAnak[k].add(a));
    const ceklis = Object.entries(S.ceklis?.[t] || {})
      .filter(([, l]) => l.length)
      .map(([a, l]) => `${data.murid.find((m) => m.id === a)?.panggilan || "?"}: ${l.join(", ")}`)
      .join("; ");
    return {
      tanggal: t,
      evaluasi: S.evaluasi?.[t] ? { skor: S.evaluasi[t].skor } : null,
      jurnal: jurnal.map((j) => ({ isi: j.isi, anakIds: j.anakIds })),
      ceklis,
      tpAnak: Object.fromEntries(Object.entries(per).map(([k, set]) => [k, [...set]])),
    };
  });

  async function susun() {
    setSibuk(true);
    setGalat("");
    try {
      const hasil = await panggilApi("laporan-mingguan", { senin, rencana, hari, murid: muridRingkas(data) });
      ubahSem(ubah, (s) => ({ ...s, laporan: { ...(s.laporan || {}), [senin]: { ...hasil, dibuat: new Date().toISOString() } } }));
    } catch (e) {
      setGalat(galatApi(e));
    } finally {
      setSibuk(false);
    }
  }

  async function salin() {
    try {
      await navigator.clipboard.writeText(lap.asesmen_awal);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      setGalat("Tidak bisa menyalin otomatis. Tekan lama teks asesmen awal lalu salin manual.");
    }
  }

  return (
    <Card className="border-primary">
      <Judul kanan={lap ? <Badge tone={lap.kesesuaian >= 75 ? "neutral" : "warning"}>{lap.kesesuaian}%</Badge> : null}>
        Laporan Aktivitas Mingguan
      </Judul>
      <div className="flex flex-col gap-3 p-4 text-sm">
        <p className="text-xs text-muted">
          {tanggalIndo(senin)} – {tanggalIndo(tambahHari(senin, 4))}. Disusun Jumat siang, sebelum mengunggah PPM minggu depan.
        </p>
        {!adaRencana && <Pesan tone="warning">Minggu ini belum ada PPM/rencana.</Pesan>}
        {lap && (
          <>
            <WarnaSkor skor={lap.kesesuaian} />
            <p>{lap.ringkasan}</p>

            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Rencana vs pelaksanaan</p>
              <ul className="flex flex-col gap-1.5">
                {(rencana.kegiatan || []).map((k, i) => {
                  const x = lap.kegiatan.find((y) => y.no === i + 1);
                  const st = x?.status || "belum";
                  return (
                    <li key={i} className="text-xs">
                      <span className={`font-semibold ${STATUS[st].kelas}`}>{STATUS[st].teks}</span> — {k.teks}
                      {x?.catatan && <span className="block text-muted">{x.catatan}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-muted">TP minggu ini</p>
              {(rencana.tp || []).map((t, i) => {
                const n = tpAnak[kunciTp(t)]?.size || 0;
                return (
                  <p key={i} className="flex flex-wrap items-center gap-1 text-xs">
                    <ChipTp {...t} tone={n < data.murid.length ? "warning" : "neutral"} />
                    teramati pada {n}/{data.murid.length} anak
                    <span className="block w-full text-muted">{LINGKUP_BY_ID[t.lingkup_id]?.tp[t.level - 1]}</span>
                  </p>
                );
              })}
            </div>

            {lap.luar_rencana?.length > 0 && (
              <p className="text-xs">
                <b>Di luar rencana:</b> {lap.luar_rencana.join("; ")}
              </p>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Saran untuk minggu depan</p>
              <ul className="list-disc pl-5 text-xs">
                {lap.saran.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-primary-soft p-3">
              <p className="mb-1 text-xs font-semibold text-primary">Asesmen Awal untuk PPM minggu depan</p>
              <p className="text-sm">{lap.asesmen_awal}</p>
              <button type="button" onClick={salin} className="mt-2 text-xs font-semibold text-primary underline">
                {tersalin ? "✓ Tersalin" : "📋 Salin untuk ditempel ke PPM"}
              </button>
            </div>
          </>
        )}
        <Button type="button" variant={lap ? "outline" : "primary"} onClick={susun} disabled={sibuk || !adaRencana}>
          {sibuk ? "Menyusun laporan… (±1 menit)" : lap ? "↻ Susun ulang laporan" : "🗓️ Susun laporan minggu ini"}
        </Button>
        {galat && <Pesan tone="danger">{galat}</Pesan>}
      </div>
    </Card>
  );
}
