"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { muatData, simpanData } from "@/lib/rapor-client";
import KelasTab from "./KelasTab";
import MuridTab from "./MuridTab";
import HarianTab from "./HarianTab";
import PenilaianTab from "./PenilaianTab";
import PpmTab from "./PpmTab";
import RaporTab from "./RaporTab";
import BantuanChat from "./BantuanChat";

// Setiap tab punya warna sendiri supaya ceria & mudah diingat.
const TAB = [
  { id: "kelas", label: "Kelas", ikon: "🏫", warna: "#0096c7" },
  { id: "murid", label: "Murid", ikon: "👧", warna: "#e5508a" },
  { id: "harian", label: "Harian", ikon: "📝", warna: "#f2711c" },
  { id: "ppm", label: "PPM", ikon: "📂", warna: "#7b4fd6" },
  { id: "nilai", label: "Penilaian CP", ikon: "✅", warna: "#2b9348" },
  { id: "rapor", label: "Rapor", ikon: "📄", warna: "#0f8b8d" },
];

export default function RaporApp() {
  // Data dibaca sekali dari perangkat (dan langsung disimpan lagi dalam format terbaru).
  const [data, setData] = useState(() => {
    const d = muatData();
    simpanData(d);
    return d;
  });
  const [tab, setTab] = useState(() => (data.kelas.sekolahId && data.murid.length ? "harian" : "kelas"));
  const [gagalSimpan, setGagalSimpan] = useState(false);
  const [bukaBantuan, setBukaBantuan] = useState(false);
  // Tema warna pilihan guru (disimpan di perangkat).
  const [tema, setTemaState] = useState(() => {
    try {
      return localStorage.getItem("rapor-ytbm:tema") || "pelangi";
    } catch {
      return "pelangi";
    }
  });
  const setTema = (t) => {
    setTemaState(t);
    try {
      localStorage.setItem("rapor-ytbm:tema", t);
    } catch {}
  };

  // Semua perubahan lewat sini: hitung data baru, simpan ke perangkat, lalu render ulang.
  // Setiap perubahan ditandai waktunya, supaya terlihat ada yang belum dikirim ke server.
  const ubah = useCallback((fn, { tanpaTanda = false } = {}) => {
    setData((lama) => {
      let baru = fn(lama);
      if (!tanpaTanda && baru !== lama) baru = { ...baru, kelas: { ...baru.kelas, diubah: new Date().toISOString() } };
      setGagalSimpan(!simpanData(baru));
      return baru;
    });
  }, []);

  const k = data.kelas;
  const props = { data, ubah, keTab: setTab, tema, setTema };

  return (
    <div className="tema-ceria flex flex-1 flex-col" data-tema={tema}>
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <header className="kepala-ceria sticky top-0 z-20 rounded-b-3xl px-4 py-3 text-white shadow-lg print:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
              🌈 Rapor Anak · Yayasan Tunas Bangsa Mandiri
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
            <span className="flex items-center gap-2 text-[11px]">
              <span className="opacity-80">TA {k.ta}</span>
              <button
                type="button"
                onClick={() => setBukaBantuan(true)}
                className="rounded-full bg-white px-2.5 py-1 font-bold text-accent shadow"
              >
                💬 Bantuan
              </button>
            </span>
          </div>
        </div>
        <nav className="mt-3 grid grid-cols-6 gap-1.5">
          {TAB.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={tab === t.id ? { color: t.warna } : { backgroundColor: `${t.warna}cc` }}
              className={`rounded-2xl px-0.5 py-2 text-[11px] font-bold leading-tight transition-transform ${
                tab === t.id ? "scale-105 bg-white shadow-md" : "text-white"
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
        {tab === "harian" && <HarianTab {...props} />}
        {tab === "ppm" && <PpmTab {...props} />}
        {tab === "nilai" && <PenilaianTab {...props} />}
        {tab === "rapor" && <RaporTab {...props} />}
      </main>

      <BantuanChat
        konteks={`tab ${TAB.find((t) => t.id === tab)?.label || tab}`}
        buka={bukaBantuan}
        setBuka={setBukaBantuan}
      />

      <footer className="px-4 pb-6 text-center text-xs text-muted print:hidden">
        Data dikerjakan di perangkat ini, lalu dikirim ke server lewat tombol &quot;Kirim ke Server&quot; di tab Harian.
        <br />
        <Link href="/rapor/panduan" className="font-semibold text-primary underline">
          📖 Buku Panduan
        </Link>
        {" · "}
        <br />
        <Link href="/" className="font-semibold text-primary underline">
          ← Kembali ke Absensi
        </Link>
      </footer>
    </div>
    </div>
  );
}
