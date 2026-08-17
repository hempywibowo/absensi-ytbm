"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import AttendanceChart from "@/components/AttendanceChart";

function toISODate(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}

function jakartaNow() {
  // Tanggal "hari ini" di WIB, dibungkus jadi Date object lokal buat perhitungan range.
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Minggu
  const diff = day === 0 ? -6 : 1 - day; // Senin sebagai awal minggu
  date.setDate(date.getDate() + diff);
  return date;
}

function presetRange(preset) {
  const now = jakartaNow();
  if (preset === "week") {
    const start = startOfWeek(now);
    return { from: toISODate(start), to: toISODate(now) };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISODate(start), to: toISODate(now) };
  }
  return { from: toISODate(now), to: toISODate(now) };
}

export default function RekapPage() {
  const [preset, setPreset] = useState("week");
  const [range, setRange] = useState(() => presetRange("week"));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/admin/attendance-summary?from=${range.from}&to=${range.to}`);
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error || "Gagal memuat rekap.");
        setData(null);
        return;
      }
      setError("");
      setData(json);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  function choosePreset(p) {
    setPreset(p);
    setRange(presetRange(p));
  }

  const rows = data?.rows ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Rekap Absensi</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={preset === "week" ? "primary" : "outline"} onClick={() => choosePreset("week")} type="button">
            Minggu Ini
          </Button>
          <Button variant={preset === "month" ? "primary" : "outline"} onClick={() => choosePreset("month")} type="button">
            Bulan Ini
          </Button>
        </div>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <label className="text-sm font-semibold">Dari</label>
        <input
          type="date"
          value={range.from}
          onChange={(e) => {
            setPreset("custom");
            setRange((r) => ({ ...r, from: e.target.value }));
          }}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        />
        <label className="text-sm font-semibold">Sampai</label>
        <input
          type="date"
          value={range.to}
          onChange={(e) => {
            setPreset("custom");
            setRange((r) => ({ ...r, to: e.target.value }));
          }}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        />
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      {data && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold">Kondisi Absensi</h2>
          <AttendanceChart rows={rows} />
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Guru</th>
              <th className="px-4 py-3">Sekolah</th>
              <th className="px-4 py-3 text-center">Hadir</th>
              <th className="px-4 py-3 text-center">Telat</th>
              <th className="px-4 py-3 text-center">Izin</th>
              <th className="px-4 py-3 text-center">Belum Clock Out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.teacherId} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold">{r.teacherName}</td>
                <td className="px-4 py-3 text-muted">{r.schoolName}</td>
                <td className="px-4 py-3 text-center">{r.hadir}</td>
                <td className="px-4 py-3 text-center">
                  <span className={r.telat > 0 ? "font-bold text-danger" : ""}>{r.telat}</span>
                </td>
                <td className="px-4 py-3 text-center">{r.izin}</td>
                <td className="px-4 py-3 text-center text-muted">{r.belumClockOut}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Belum ada data untuk rentang tanggal ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
