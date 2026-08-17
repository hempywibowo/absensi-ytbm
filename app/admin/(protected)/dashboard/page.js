"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

function todayInputValue() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function jam(iso) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso)
  );
}

export default function DashboardPage() {
  const [date, setDate] = useState(todayInputValue());
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/admin/attendance?date=${date}`);
      const json = await res.json();
      if (!cancelled) setData(json);
    }

    load();
    const isToday = date === todayInputValue();
    const interval = isToday ? setInterval(load, 8000) : null;

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [date]);

  const rows = data?.rows ?? [];
  const hadir = rows.filter((r) => r.attendance?.clockIn).length;
  const lengkap = rows.filter((r) => r.attendance?.clockIn && r.attendance?.clockOut).length;
  const belum = rows.length - hadir;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Dashboard Absensi</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total Guru" value={rows.length} />
        <SummaryCard label="Sudah Clock In" value={hadir} tone="neutral" />
        <SummaryCard label="Belum Absen" value={belum} tone="warning" />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Guru</th>
              <th className="px-4 py-3">Sekolah</th>
              <th className="px-4 py-3">Clock In</th>
              <th className="px-4 py-3">Clock Out</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.teacherId} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold">{r.teacherName}</td>
                <td className="px-4 py-3 text-muted">{r.schoolName}</td>
                <td className="px-4 py-3">
                  {r.attendance?.clockIn ? (
                    <PhotoLink label={jam(r.attendance.clockIn.time)} path={r.attendance.clockIn.photoPath} />
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.attendance?.clockOut ? (
                    <PhotoLink label={jam(r.attendance.clockOut.time)} path={r.attendance.clockOut.photoPath} />
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.attendance?.clockIn && r.attendance?.clockOut ? (
                    <Badge tone="neutral">Lengkap</Badge>
                  ) : r.attendance?.clockIn ? (
                    <Badge tone="warning">Belum Clock Out</Badge>
                  ) : (
                    <Badge tone="danger">Belum Absen</Badge>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Belum ada data untuk tanggal ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-primary">{value}</p>
    </Card>
  );
}

function PhotoLink({ label, path }) {
  return (
    <a
      href={`/api/photo/${path}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary underline underline-offset-2"
    >
      {label} WIB
    </a>
  );
}
