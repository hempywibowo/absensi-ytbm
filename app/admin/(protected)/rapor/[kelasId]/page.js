"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { CP, SEMUA_SUB, LINGKUP_BY_ID, subTerisi } from "@/lib/rapor-cp";

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
