"use client";

import { useCallback, useState } from "react";

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

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLoading(false);
      },
      (err) => {
        const messages = {
          1: "Akses lokasi ditolak. Izinkan akses lokasi di browser dulu ya.",
          2: "Lokasi gak terdeteksi. Coba lagi di area yang sinyal GPS-nya lebih bagus.",
          3: "Deteksi lokasi lama banget, coba lagi.",
        };
        setError(messages[err.code] || "Gagal deteksi lokasi.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  return { position, error, loading, locate };
}
