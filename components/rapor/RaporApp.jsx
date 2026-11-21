"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { muatData, simpanData } from "@/lib/rapor-client";
import KelasTab from "./KelasTab";
import MuridTab from "./MuridTab";
import CatatanTab from "./CatatanTab";
import PenilaianTab from "./PenilaianTab";
import PpmTab from "./PpmTab";
import RaporTab from "./RaporTab";

const TAB = [
  { id: "kelas", label: "Kelas", ikon: "🏫" },
  { id: "murid", label: "Murid", ikon: "👧" },
  { id: "ppm", label: "PPM", ikon: "📂" },
  { id: "catatan", label: "Catatan", ikon: "📝" },
  { id: "nilai", label: "Penilaian CP", ikon: "✅" },
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
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex rounded-lg bg-white/15 p-0.5 text-xs font-bold">
              {["1", "2"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ubah((d) => ({ ...d, kelas: { ...d.kelas, semester: s } }))}
                  className={`rounded-md px-2.5 py-1 ${k.semester === s ? "bg-surface text-primary" : "opacity-80"}`}
                >
                  Sem {s}
                </button>
              ))}
            </div>
            <span className="text-[11px] opacity-80">TA {k.ta}</span>
          </div>
        </div>
        <nav className="mt-3 grid grid-cols-6 gap-1 rounded-xl bg-white/10 p-1">
          {TAB.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-0.5 py-2 text-[11px] font-semibold leading-tight ${
                tab === t.id ? "bg-surface text-primary" : "opacity-85"
              }`}
            >
              <span className="block text-base leading-tight">{t.ikon}</span>
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
        {tab === "ppm" && <PpmTab {...props} />}
        {tab === "nilai" && <PenilaianTab {...props} />}
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
