import { CP as _CP, LINGKUP_BY_ID as _LBI } from "@/lib/rapor-cp";
// Komponen kecil yang dipakai bersama di halaman Rapor.

export function Ruas({ label, children, bantu }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
      {bantu && <span className="text-xs text-muted">{bantu}</span>}
    </label>
  );
}

export const kelasInput =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

export function Pesan({ tone = "info", children }) {
  const t = {
    info: "bg-primary-soft text-primary",
    warning: "bg-accent-soft text-accent",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return <div className={`rounded-xl px-4 py-3 text-sm ${t}`}>{children}</div>;
}

export function Judul({ children, kanan }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
      <h2 className="font-semibold">{children}</h2>
      {kanan}
    </div>
  );
}

// <option> untuk semua TP ATP, nilai "lingkupId|level".
export function OpsiTp() {
  return _CP.flatMap((e) =>
    e.sub.flatMap((s) =>
      s.lingkup.flatMap((l) =>
        l.tp.map((tp, k) => (
          <option key={`${l.id}|${k + 1}`} value={`${l.id}|${k + 1}`}>
            {s.id} {l.nama} · TP {k + 1}: {tp.replace(/^Murid /, "")}
          </option>
        )),
      ),
    ),
  );
}

// Label TP ringkas, mis. "2.3 Membangun hubungan sosial · TP2"
export function ChipTp({ lingkup_id, level, onHapus, tone = "neutral" }) {
  const l = _LBI[lingkup_id];
  if (!l) return null;
  const warna = tone === "warning" ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary";
  return (
    <span title={l.tp[level - 1]} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${warna}`}>
      {l.sub} {l.nama} · TP{level}
      {onHapus && (
        <button type="button" onClick={onHapus} className="ml-0.5 font-bold" aria-label="Hapus label">
          ×
        </button>
      )}
    </span>
  );
}
