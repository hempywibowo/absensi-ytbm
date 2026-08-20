"use client";

import { useCallback, useState } from "react";

const ERROR_MESSAGES = {
  1: "Akses lokasi ditolak. Izinkan akses lokasi di browser dulu ya.",
  2: "Lokasi gak terdeteksi. Coba lagi di area yang sinyal GPS-nya lebih bagus.",
  3: "Deteksi lokasi lama banget, coba lagi.",
};

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const locate = useCallback(() => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Browser ini gak dukung deteksi lokasi.");
      setLoading(false);
      return;
    }

    const onSuccess = (pos) => {
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
      setLoading(false);
    };

    // GPS presisi tinggi bisa lama banget (bahkan gagal total) di dalam ruangan/gedung —
    // kalau itu gagal, coba sekali lagi pakai mode network-based (lebih cepat, akurasi lebih
    // rendah tapi masih cukup buat toleransi radius 100m kita) daripada langsung nyerah.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err) => {
            setError(ERROR_MESSAGES[err.code] || "Gagal deteksi lokasi.");
            setLoading(false);
          },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  return { position, error, loading, locate };
}
