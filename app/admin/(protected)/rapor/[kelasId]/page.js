"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { CP, DIMENSI, SEMUA_SUB, LINGKUP_BY_ID, subTerisi } from "@/lib/rapor-cp";

function tgl(isoTgl) {
  return isoTgl ? new Date(`${isoTgl}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }) : "";
}

// Detail kelas untuk kepala sekolah/admin: kelengkapan bukti CP per anak, jurnal terbaru, dan pratinjau narasi.
export default function DetailKelasRaporPage({ params }) {
  const { kelasId } = use(params);
  const [kelas, setKelas] = useState(null);
  const [galat, setGalat] = useState("");
  const [buka, setBuka] = useState(null);
  const [semPilih, setSemPilih] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/rapor/kelas/${kelasId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || `Gagal (${r.status})`);
        setKelas(j.kelas);
      })
      .catch((e) => setGalat(e.message));
  }, [kelasId]);

  if (galat) return <Card className="p-4 text-sm text-danger">{galat}</Card>;
  if (!kelas) return <p className="text-sm text-muted">Memuat…</p>;

  const semester = semPilih || kelas.semester;
  const S = kelas.data?.sem?.[semester] || {};
  const murid = kelas.data?.murid || [];
  const jurnal = [...(S.jurnal || [])].sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || "")).slice(0, 30);
  const nama = (id) => {
    const m = murid.find((x) => x.id === id);
    return m ? m.panggilan || m.nama.split(" ")[0] : "?";
  };

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/rapor" className="text-sm font-semibold text-primary">
        ← Pantauan Rapor
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            Kelas {kelas.nama_kelas} · {kelas.kelompok}
          </h1>
          <p className="text-sm text-muted">
            {kelas.guru} · TA {kelas.ta} · terakhir dikirim{" "}
            {new Date(kelas.uploaded_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex gap-1">
          {["1", "2"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSemPilih(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${semester === s ? "bg-primary text-primary-foreground" : "border border-border"}`}
            >
              Semester {s}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto">
        <p className="border-b border-border px-4 py-3 font-semibold">Murid & kelengkapan bukti CP</p>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="px-4 py-2">Nama</th>
              {CP.map((e) => (
                <th key={e.id} className="px-2 py-2 text-center">
                  Elemen {e.no}
                </th>
              ))}
              <th className="px-2 py-2 text-center">Total</th>
              <th className="px-2 py-2 text-center">Catatan</th>
              <th className="px-2 py-2">Narasi</th>
            </tr>
          </thead>
          <tbody>
            {murid.map((m) => {
              const nilai = S.nilai?.[m.id];
              const total = SEMUA_SUB.filter((s) => subTerisi(s, nilai)).length;
              const r = S.rapor?.[m.id];
              const nCat = (S.jurnal || []).filter((j) => j.anakIds?.includes(m.id)).length;
              return (
                <tr key={m.id} className="border-t border-border align-top">
                  <td className="px-4 py-2 font-semibold">{m.nama}</td>
                  {CP.map((e) => (
                    <td key={e.id} className="px-2 py-2 text-center">
                      {e.sub.filter((s) => subTerisi(s, nilai)).length}/{e.sub.length}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-semibold">{total}/14</td>
                  <td className="px-2 py-2 text-center">{nCat}</td>
                  <td className="px-2 py-2">
                    {r?.agama ? (
                      <button type="button" onClick={() => setBuka(buka === m.id ? null : m.id)} className="text-xs font-semibold text-primary underline">
                        {buka === m.id ? "Tutup" : "Lihat"}
                      </button>
                    ) : (
                      <Badge tone="warning">belum</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {buka && S.rapor?.[buka] && (
        <Card className="flex flex-col gap-3 p-4 text-sm">
          <p className="font-semibold">Pratinjau narasi: {murid.find((m) => m.id === buka)?.nama}</p>
          {[...CP.map((e) => [e.id, `${e.no}. ${e.nama}`]), ["kokurikuler", "Kokurikuler"], ["saran", "Refleksi guru"]].map(
            ([f, judul]) =>
              S.rapor[buka][f] ? (
                <div key={f}>
                  <p className="text-xs font-semibold text-muted">{judul}</p>
                  <p className="whitespace-pre-line leading-relaxed">{S.rapor[buka][f]}</p>
                </div>
              ) : null,
          )}
        </Card>
      )}

      <MingguanKelas S={S} murid={murid} />

      <Card>
        <p className="border-b border-border px-4 py-3 font-semibold">Catatan harian terbaru</p>
        {jurnal.length === 0 ? (
          <p className="p-4 text-sm text-muted">Belum ada catatan yang dikirim.</p>
        ) : (
          <ul className="divide-y divide-border">
            {jurnal.map((j) => (
              <li key={j.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <p className="text-xs font-semibold text-muted">
                  {tgl(j.tanggal)} · {(j.anakIds || []).map(nama).join(", ") || "kelas"}
                </p>
                <p>{j.isi}</p>
                {j.media?.some((m) => m.driveId) && (
                  <div className="flex flex-wrap gap-2">
                    {j.media
                      .filter((m) => m.driveId)
                      .map((m) =>
                        m.jenis === "foto" ? (
                          <a key={m.id} href={`/api/admin/rapor/media?kelas=${kelasId}&file=${m.driveId}`} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element -- foto dari Drive lewat proxy admin */}
                            <img
                              src={`/api/admin/rapor/media?kelas=${kelasId}&file=${m.driveId}`}
                              alt="Foto kegiatan"
                              className="h-20 w-20 rounded-lg border border-border object-cover"
                              loading="lazy"
                            />
                          </a>
                        ) : (
                          <a
                            key={m.id}
                            href={`https://drive.google.com/file/d/${m.driveId}/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-20 w-20 items-center justify-center rounded-lg border border-border text-xs font-semibold text-primary"
                          >
                            ▶ Video
                          </a>
                        ),
                      )}
                  </div>
                )}
                {j.label?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {j.label.map((l, i) => {
                      const lk = LINGKUP_BY_ID[l.lingkup_id];
                      return lk ? (
                        <span key={i} title={lk.tp[l.level - 1]} className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                          {lk.sub} {lk.nama} · TP{l.level}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// Rencana PPM per minggu, kesesuaian harian, dan laporan aktivitas mingguan.
function MingguanKelas({ S, murid }) {
  const minggu = Object.keys({ ...(S.minggu || {}), ...(S.laporan || {}) }).sort().reverse();
  const [pilih, setPilih] = useState(null);
  const senin = pilih || minggu[0];
  if (!senin) return null;
  const r = S.minggu?.[senin] || {};
  const lap = S.laporan?.[senin];
  const hari = Object.entries(S.evaluasi || {})
    .filter(([t]) => t >= senin && t <= tambah(senin, 6))
    .sort(([a], [b]) => a.localeCompare(b));
  return (
    <Card className="flex flex-col gap-3 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">PPM & laporan mingguan</p>
        <select value={senin} onChange={(e) => setPilih(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1 text-sm">
          {minggu.map((m) => (
            <option key={m} value={m}>
              Minggu {tgl(m)} – {tgl(tambah(m, 4))}
            </option>
          ))}
        </select>
      </div>
      {r.tp?.length || r.kegiatan?.length ? (
        <div className="rounded-xl border border-border p-3">
          <p className="font-semibold">
            Rencana: {[r.tema, r.subTema].filter(Boolean).join(" · ") || "-"}
          </p>
          {r.dpl?.length > 0 && <p className="text-xs text-muted">DPL: {r.dpl.map((i) => DIMENSI[i]).join(", ")}</p>}
          <div className="mt-1 flex flex-wrap gap-1">
            {(r.tp || []).map((t, i) => {
              const lk = LINGKUP_BY_ID[t.lingkup_id];
              return lk ? (
                <span key={i} title={lk.tp[t.level - 1]} className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                  {lk.sub} {lk.nama} · TP{t.level}
                </span>
              ) : null;
            })}
          </div>
          {r.kegiatan?.length > 0 && <p className="mt-1 text-xs text-muted">{r.kegiatan.length} kegiatan · {r.pemantik?.length || 0} pertanyaan pemantik</p>}
        </div>
      ) : (
        <p className="text-danger">Belum ada PPM untuk minggu ini.</p>
      )}
      {hari.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hari.map(([t, e]) => (
            <span key={t} title={e.ringkasan} className={`rounded-lg px-2 py-1 text-xs font-semibold ${e.skor >= 75 ? "bg-primary-soft text-primary" : e.skor >= 50 ? "bg-accent-soft text-accent" : "bg-danger-soft text-danger"}`}>
              {tgl(t)}: {e.skor}%
            </span>
          ))}
        </div>
      )}
      {lap ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
          <p className="font-semibold">
            Laporan Aktivitas Mingguan · kesesuaian {lap.kesesuaian}%
          </p>
          <p>{lap.ringkasan}</p>
          {lap.saran?.length > 0 && (
            <ul className="list-disc pl-5 text-xs">
              {lap.saran.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
          <p className="rounded-lg bg-primary-soft p-2 text-xs">
            <b>Asesmen awal untuk minggu berikutnya:</b> {lap.asesmen_awal}
          </p>
          <p className="text-xs text-muted">{murid.length} murid di kelas.</p>
        </div>
      ) : (
        <p className="text-xs text-muted">Laporan mingguan belum disusun guru.</p>
      )}
    </Card>
  );
}

function tambah(isoTgl, n) {
  const d = new Date(`${isoTgl}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
