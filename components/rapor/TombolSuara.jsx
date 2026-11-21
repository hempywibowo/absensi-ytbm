"use client";

import { useEffect, useRef, useState } from "react";

// Dikte suara -> teks (Web Speech API, bahasa Indonesia). Guru cukup ketuk sekali lalu bercerita
// sambil bekerja; teks ditambahkan ke catatan. Ketuk lagi untuk berhenti.
// Didukung Chrome (Android/desktop) dan Safari (iPhone/iPad). Bila tidak didukung, tombol disembunyikan
// dan guru tetap bisa memakai ikon mikrofon di keyboard HP.
export default function TombolSuara({ onTeks }) {
  const [dukung] = useState(
    () => typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
  );
  const [aktif, setAktif] = useState(false);
  const [sementara, setSementara] = useState("");
  const [galat, setGalat] = useState("");
  const recRef = useRef(null);
  const mauAktif = useRef(false);
  const onTeksRef = useRef(onTeks);

  useEffect(() => {
    onTeksRef.current = onTeks;
  });

  useEffect(() => () => {
    mauAktif.current = false;
    recRef.current?.abort();
  }, []);

  if (!dukung) return null;

  function mulai() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "id-ID";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let akhir = "";
      let antara = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) akhir += t;
        else antara += t;
      }
      if (akhir.trim()) onTeksRef.current(akhir.trim());
      setSementara(antara);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        mauAktif.current = false;
        setGalat("Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser.");
      } else if (e.error === "network") {
        setGalat("Dikte suara butuh internet. Periksa koneksi.");
      }
    };
    // HP sering menghentikan dikte saat guru diam sebentar — nyalakan lagi selama tombol masih aktif.
    rec.onend = () => {
      setSementara("");
      if (mauAktif.current) {
        try {
          rec.start();
          return;
        } catch {}
      }
      setAktif(false);
    };
    recRef.current = rec;
    mauAktif.current = true;
    setGalat("");
    try {
      rec.start();
      setAktif(true);
    } catch {
      setGalat("Dikte suara tidak bisa dimulai. Coba lagi.");
    }
  }

  function berhenti() {
    mauAktif.current = false;
    recRef.current?.stop();
    setAktif(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={aktif ? berhenti : mulai}
        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
          aktif ? "animate-pulse border-danger bg-danger-soft text-danger" : "border-primary bg-primary-soft text-primary"
        }`}
      >
        {aktif ? "🔴 Mendengarkan… ketuk untuk berhenti" : "🎤 Bicara (dikte suara)"}
      </button>
      {sementara && <p className="text-xs italic text-muted">{sementara}…</p>}
      {galat && <p className="text-xs text-danger">{galat}</p>}
    </div>
  );
}
