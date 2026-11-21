"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import BantuanChat from "@/components/rapor/BantuanChat";

const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum"];

function iso(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}
function hariIni() {
  return iso(new Date());
}
function geser(isoTgl, n) {
  const d = new Date(`${isoTgl}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function seninDari(isoTgl) {
  const d = new Date(`${isoTgl}T00:00:00Z`);
  return geser(isoTgl, -((d.getUTCDay() + 6) % 7));
}
function tglPendek(isoTgl) {
  return new Date(`${isoTgl}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
}
function waktu(t) {
  return t
    ? new Date(t).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";
}

export default function PantauanRaporPage() {
  const [senin, setSenin] = useState(() => seninDari(hariIni()));
  const [data, setData] = useState(null);
  const [galat, setGalat] = useState("");
  const [muat, setMuat] = useState(0);

  const hari = [0, 1, 2, 3, 4].map((i) => geser(senin, i));
  const jumat = hari[4];

  useEffect(() => {
    let batal = false;
    fetch(`/api/admin/rapor?from=${senin}&to=${jumat}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || `Gagal (${r.status})`);
        return j;
      })
      .then((j) => {
        if (!batal) {
          setData(j);
          setGalat("");
        }
      })
      .catch((e) => !batal && setGalat(e.message));
    return () => {
      batal = true;
    };
  }, [senin, jumat, muat]);

  async function aturPin(g) {
    const pin = prompt(`PIN baru untuk ${g.nama} (4–6 angka). Berikan PIN ini ke guru yang bersangkutan.`);
    if (pin === null) return;
    const r = await fetch("/api/admin/rapor/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: g.id, pin: pin.trim() }),
    });
    const j = await r.json();
    if (!r.ok) alert(j.error || "Gagal menyimpan PIN.");
    else {
      alert(`PIN untuk ${g.nama} tersimpan.`);
      setMuat((x) => x + 1);
    }
  }

  const guru = data?.guru ?? [];
  const today = hariIni();
  const aktif = (g, h) => (g.harian[h]?.catatan || 0) + (g.harian[h]?.ceklis || 0) > 0;
  const guruBerkelas = guru.filter((g) => g.kelas.length);
  const aktifHariIni = guruBerkelas.filter((g) => aktif(g, today)).length;
  const aktifMinggu = guruBerkelas.filter((g) => hari.some((h) => aktif(g, h))).length;
  const totalCatatan = guru.reduce((n, g) => n + hari.reduce((m, h) => m + (g.harian[h]?.catatan || 0), 0), 0);
  const kelasSemua = guru.flatMap((g) => g.kelas);
  const ppmIniAda = kelasSemua.filter((k) => k.ppmIni?.ada).length;
  const ppmIniTepat = kelasSemua.filter((k) => k.ppmIni?.tepat).length;
  const ppmDepanAda = kelasSemua.filter((k) => k.ppmDepan?.ada).length;
  const sekolahList = [...new Set(guru.map((g) => g.sekolah))];

  return (
    <div className="flex flex-col gap-5">
      <BantuanChat konteks="dashboard Pantauan Rapor (kepala sekolah/admin)" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          Pantauan Rapor{" "}
          <Link href="/rapor/panduan#kepsek" className="ml-2 align-middle text-sm font-semibold text-primary underline">
            ❓ Panduan
          </Link>
        </h1>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="px-3 py-2" onClick={() => setSenin(geser(senin, -7))}>
            ‹
          </Button>
          <span className="text-sm font-semibold">
            {tglPendek(senin)} – {tglPendek(jumat)}
          </span>
          <Button type="button" variant="outline" className="px-3 py-2" onClick={() => setSenin(geser(senin, 7))}>
            ›
          </Button>
        </div>
      </div>

      {galat && <Card className="p-4 text-sm text-danger">{galat}</Card>}
      {!data && !galat && <p className="text-sm text-muted">Memuat…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Ringkas label="Guru mengisi hari ini" nilai={hari.includes(today) ? `${aktifHariIni}/${guruBerkelas.length}` : "—"} />
            <Ringkas label="Guru aktif minggu ini" nilai={`${aktifMinggu}/${guruBerkelas.length}`} />
            <Ringkas label={`PPM minggu ini (tepat waktu ${ppmIniTepat})`} nilai={`${ppmIniAda}/${kelasSemua.length}`} />
            <Ringkas label="PPM minggu depan sudah masuk" nilai={`${ppmDepanAda}/${kelasSemua.length}`} />
          </div>

          <p className="text-xs text-muted">
            PPM wajib masuk paling lambat Jumat 23.59 WIB sebelum minggu berjalan. Kotak hari: angka = jumlah laporan
            harian, % = kesesuaian dengan PPM ({totalCatatan} laporan minggu ini). 🟩 ada laporan · 🟧 PPM berisi asesmen
            diunggah (tanpa laporan harian) · 🟥 tidak ada (hari sudah lewat) · ⬜ izin / belum lewat. Data muncul setelah guru menekan
            &quot;Kirim ke Server&quot;. Kelengkapan CP adalah rata-rata sub-elemen yang sudah ada bukti per anak (target 14 di akhir
            semester), bukan nilai harian.
          </p>

          {sekolahList.map((sk) => (
            <Card key={sk} className="overflow-x-auto">
              <p className="border-b border-border px-4 py-3 font-semibold">{sk}</p>
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-4 py-2">Guru / kelas</th>
                    <th className="px-2 py-2">PPM minggu ini</th>
                    {hari.map((h, i) => (
                      <th key={h} className="px-1 py-2 text-center">
                        {HARI[i]}
                        <span className="block font-normal">{Number(h.slice(8))}</span>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center">Laporan mingguan</th>
                    <th className="px-2 py-2">PPM minggu depan</th>
                    <th className="px-2 py-2">Bukti CP</th>
                    <th className="px-2 py-2">Terakhir kirim</th>
                    <th className="px-2 py-2">PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {guru
                    .filter((g) => g.sekolah === sk)
                    .map((g) => {
                      // Minggu yang sudah diunggah PPM-nya tidak dianggap "tidak mengisi".
                      const ppm = g.kelas.flatMap((k) => (k.ppmMinggu || []).filter((p) => seninDari(p.tanggal) === senin));
                      return (
                        <tr key={g.id} className="border-t border-border align-top">
                          <td className="px-4 py-2">
                            <p className="font-semibold">{g.nama}</p>
                            {g.kelas.length ? (
                              g.kelas.map((k) => (
                                <Link key={k.id} href={`/admin/rapor/${k.id}`} className="block text-xs text-primary underline">
                                  {k.nama || "Kelas"} · {k.jumlahMurid} anak
                                </Link>
                              ))
                            ) : (
                              <span className="text-xs text-muted">belum pernah kirim</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-xs">
                            {g.kelas.map((k) => (
                              <StatusPpm key={k.id} s={k.ppmIni} />
                            ))}
                          </td>
                          {hari.map((h) => {
                            const n = (g.harian[h]?.catatan || 0) + (g.harian[h]?.ceklis || 0);
                            const izin = g.izin.includes(h);
                            const lewat = h < today || h === today;
                            const kelasAda = g.kelas.length > 0;
                            const warna = n
                              ? "bg-primary-soft text-primary"
                              : ppm.length
                                ? "bg-accent-soft text-accent"
                                : izin || !lewat || !kelasAda
                                  ? "bg-background text-muted"
                                  : "bg-danger-soft text-danger";
                            return (
                              <td key={h} className="px-1 py-2 text-center">
                                <span className={`inline-block min-w-9 rounded-md px-1.5 py-1 text-xs font-bold ${warna}`} title={izin ? "Izin" : `${g.harian[h]?.catatan || 0} catatan, ${g.harian[h]?.ceklis || 0} anak dicentang`}>
                                  {izin
                                    ? "izin"
                                    : g.harian[h]?.catatan || (n ? "✓" : ppm.length ? "PPM" : lewat && kelasAda ? "0" : "–")}
                                </span>
                                {g.kelas.map((k) =>
                                  k.skorHarian?.[h] !== undefined ? (
                                    <span
                                      key={k.id}
                                      className={`block text-[10px] font-semibold ${k.skorHarian[h] >= 75 ? "text-primary" : k.skorHarian[h] >= 50 ? "text-accent" : "text-danger"}`}
                                      title="Kesesuaian dengan PPM"
                                    >
                                      {k.skorHarian[h]}%
                                    </span>
                                  ) : null,
                                )}
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-center text-xs">
                            {g.kelas.map((k) => (
                              <span key={k.id} className="block">
                                {k.laporan ? <b className={k.laporan.kesesuaian >= 75 ? "text-primary" : "text-accent"}>{k.laporan.kesesuaian}%</b> : <span className="text-muted">belum</span>}
                              </span>
                            ))}
                          </td>
                          <td className="px-2 py-2 text-xs">
                            {g.kelas.map((k) => (
                              <StatusPpm key={k.id} s={k.ppmDepan} />
                            ))}
                          </td>
                          <td className="px-2 py-2 text-xs">
                            {g.kelas.map((k) => (
                              <span key={k.id} className="block">
                                {k.rataBukti}/14
                              </span>
                            ))}
                          </td>
                          <td className="px-2 py-2 text-xs">{waktu(g.terakhirKirim)}</td>
                          <td className="px-2 py-2">
                            <button type="button" onClick={() => aturPin(g)} className="text-xs font-semibold text-primary underline">
                              {g.pinAda ? "Ganti" : "Buat PIN"}
                            </button>
                            {!g.pinAda && (
                              <span className="block">
                                <Badge tone="warning">belum ada</Badge>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// Status PPM satu kelas untuk satu minggu: tepat waktu / terlambat / belum, plus kelengkapannya.
function StatusPpm({ s }) {
  if (!s) return <span className="block text-muted">—</span>;
  if (!s.ada) {
    return <span className={`block font-semibold ${s.lewatBatas ? "text-danger" : "text-muted"}`}>{s.lewatBatas ? "✗ belum masuk" : "belum"}</span>;
  }
  return (
    <span className="block">
      <span className={`font-semibold ${s.tepat ? "text-primary" : "text-accent"}`}>{s.tepat ? "✓ tepat waktu" : "⚠ terlambat"}</span>
      <span className="block text-[10px] text-muted">{waktu(s.dikirim)}</span>
      {s.tema && <span className="block text-[10px]">{s.tema}</span>}
      {s.kurang?.length > 0 && <span className="block text-[10px] text-danger">kurang: {s.kurang.join(", ")}</span>}
    </span>
  );
}

function Ringkas({ label, nilai }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{nilai}</p>
    </Card>
  );
}
