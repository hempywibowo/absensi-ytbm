"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { muatData, simpanData } from "@/lib/rapor-client";
import KelasTab from "./KelasTab";
import MuridTab from "./MuridTab";
import CatatanTab from "./CatatanTab";
import RaporTab from "./RaporTab";

const TAB = [
  { id: "kelas", label: "Kelas", ikon: "🏫" },
  { id: "murid", label: "Murid", ikon: "👧" },
  { id: "catatan", label: "Catatan Harian", ikon: "📝" },
  { id: "rapor", label: "Rapor", ikon: "📄" },
];

export default function RaporApp() {
  const [data, setData] = useState(muatData);
  const [tab, setTab] = useState(() => (muatData().kelas.sekolahId ? "catatan" : "kelas"));
  const [gagalSimpan, setGagalSimpan] = useState(false);

  // Semua perubahan lewat sini: hitung data baru, simpan ke perangkat, lalu render ulang.
  const ubah = useCallback((fn) => {
    setData((lama) => {
      const baru = fn(lama);
      setGagalSimpan(!simpanData(baru));
      return baru;
    });
  }, []);

  const k = data.kelas;
  const props = { data, ubah, keTab: setTab };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-primary px-4 py-3 text-primary-foreground print:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Rapor Anak · Yayasan Tunas Bangsa Mandiri
            </p>
            <p className="truncate font-semibold">
              {k.sekolahNama ? `${k.sekolahNama}${k.namaKelas ? ` · ${k.namaKelas}` : ""}` : "Atur data kelas dulu"}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-white/15 px-2 py-1 text-xs font-semibold">
            Sem {k.semester} · {k.ta}
          </span>
        </div>
        <nav className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-white/10 p-1">
          {TAB.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-1 py-2 text-xs font-semibold leading-tight ${
                tab === t.id ? "bg-surface text-primary" : "opacity-85"
              }`}
            >
              <span className="block text-base">{t.ikon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {gagalSimpan && (
        <p className="bg-danger-soft px-4 py-2 text-sm text-danger print:hidden">
          Penyimpanan perangkat penuh — perubahan terakhir belum tersimpan. Unduh cadangan di tab Kelas.
        </p>
      )}

      <main className="flex flex-1 flex-col gap-4 px-4 py-5 print:p-0">
        {tab === "kelas" && <KelasTab {...props} />}
        {tab === "murid" && <MuridTab {...props} />}
        {tab === "catatan" && <CatatanTab {...props} />}
        {tab === "rapor" && <RaporTab {...props} />}
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-muted print:hidden">
        Data rapor tersimpan di perangkat ini saja. Unduh cadangan secara berkala.
        <br />
        <Link href="/" className="font-semibold text-primary underline">
          ← Kembali ke Absensi
        </Link>
      </footer>
    </div>
  );
}
