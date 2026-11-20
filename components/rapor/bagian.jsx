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
