"use client";

import { useState } from "react";

// Palet divalidasi lolos cek warna (kontras & aman buat buta warna) pakai dataviz skill validator.
const SERIES = [
  { key: "hadir", label: "Hadir" },
  { key: "telat", label: "Telat" },
  { key: "izin", label: "Izin" },
  { key: "belumClockOut", label: "Belum Clock Out" },
];

const ROW_HEIGHT = 30;
const BAR_HEIGHT = 20;
const GAP = 2;
const LABEL_WIDTH = 160;
const CHART_PAD_RIGHT = 16;

export default function AttendanceChart({ rows }) {
  const [hover, setHover] = useState(null); // { teacherId, key, x, y }

  const withTotals = rows.map((r) => ({
    ...r,
    total: r.hadir + r.telat + r.izin + r.belumClockOut,
  }));

  const maxTotal = Math.max(1, ...withTotals.map((r) => r.total));
  const niceMax = Math.ceil(maxTotal / 5) * 5 || 5;

  const width = 560;
  const plotWidth = width - LABEL_WIDTH - CHART_PAD_RIGHT;
  const height = withTotals.length * ROW_HEIGHT + 24;

  function scaleX(value) {
    return (value / niceMax) * plotWidth;
  }

  if (withTotals.every((r) => r.total === 0)) {
    return (
      <div className="attendance-chart-root flex items-center justify-center rounded-2xl border border-border p-8 text-sm text-muted">
        Belum ada data buat digambar grafiknya.
      </div>
    );
  }

  return (
    <div className="attendance-chart-root">
      <style>{`
        .attendance-chart-root {
          --chart-hadir: #0f8a6c;
          --chart-izin: #2a6fd6;
          --chart-telat: #c0392b;
          --chart-belum: #6b5fa8;
          --chart-ink: #52514e;
          --chart-muted: #898781;
          --chart-grid: #e1e0d9;
          --chart-surface: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          .attendance-chart-root {
            --chart-hadir: #35a583;
            --chart-izin: #4a84dd;
            --chart-telat: #d9645c;
            --chart-belum: #8f7fc9;
            --chart-ink: #c3c2b7;
            --chart-muted: #898781;
            --chart-grid: #2c2c2a;
            --chart-surface: #16302a;
          }
        }
      `}</style>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: `var(--chart-${s.key === "belumClockOut" ? "belum" : s.key})` }}
            />
            <span style={{ color: "var(--chart-ink)" }}>{s.label}</span>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <svg width={width} height={height} role="img" aria-label="Grafik kondisi absensi per guru">
          {/* gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={LABEL_WIDTH + plotWidth * f}
              x2={LABEL_WIDTH + plotWidth * f}
              y1={4}
              y2={height - 20}
              stroke="var(--chart-grid)"
              strokeWidth="1"
            />
          ))}

          {withTotals.map((r, i) => {
            const y = i * ROW_HEIGHT + 4;
            let cursor = 0;
            return (
              <g key={r.teacherId}>
                <text
                  x={LABEL_WIDTH - 8}
                  y={y + BAR_HEIGHT / 2 + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--chart-ink)"
                >
                  {r.teacherName.length > 22 ? `${r.teacherName.slice(0, 21)}…` : r.teacherName}
                </text>

                {SERIES.map((s) => {
                  const value = r[s.key];
                  if (value === 0) return null;
                  const segWidth = Math.max(0, scaleX(value) - GAP);
                  const x = LABEL_WIDTH + cursor;
                  cursor += scaleX(value);
                  const isFirst = x === LABEL_WIDTH;
                  const isLast = cursor >= scaleX(r.total) - 0.5;

                  return (
                    <rect
                      key={s.key}
                      x={x}
                      y={y}
                      width={segWidth}
                      height={BAR_HEIGHT}
                      rx={4}
                      fill={`var(--chart-${s.key === "belumClockOut" ? "belum" : s.key})`}
                      style={{
                        // Cuma ujung terluar yang dibulatin (data-end), ujung dalam tetap kotak biar nyambung mulus.
                        clipPath:
                          isFirst && isLast
                            ? undefined
                            : isFirst
                            ? "inset(0 0 0 0 round 4px 0 0 4px)"
                            : isLast
                            ? "inset(0 0 0 0 round 0 4px 4px 0)"
                            : "inset(0)",
                      }}
                      onMouseEnter={() => setHover({ teacherId: r.teacherId, key: s.key, value })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <title>
                        {r.teacherName} — {s.label}: {value}
                      </title>
                    </rect>
                  );
                })}
              </g>
            );
          })}

          {/* sumbu x */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <text
              key={f}
              x={LABEL_WIDTH + plotWidth * f}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              fill="var(--chart-muted)"
            >
              {Math.round(niceMax * f)}
            </text>
          ))}
        </svg>
      </div>

      {hover && (
        <p className="mt-1 text-xs text-muted">
          {withTotals.find((r) => r.teacherId === hover.teacherId)?.teacherName} —{" "}
          {SERIES.find((s) => s.key === hover.key)?.label}: <strong>{hover.value}</strong>
        </p>
      )}
    </div>
  );
}
