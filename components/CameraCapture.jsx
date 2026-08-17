"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

// Kompres & resize selfie sebelum dikirim ke server, biar upload cepat & hemat storage.
function captureFrame(video) {
  const MAX_WIDTH = 480;
  const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;

  const ctx = canvas.getContext("2d");
  // Mirror biar sesuai apa yang guru lihat di preview (selfie kamera depan)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.7);
}

export default function CameraCapture({ onCapture, photo, onRetake }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // Cuma buat cleanup pas komponen beneran unmount (bukan auto-start) — dengan sengaja
  // gak manggil getUserMedia() otomatis pas mount, karena di dev mode React manggil efek
  // 2x berturut-turut, dan beberapa browser HP suka macet kalau ada 2 permintaan kamera
  // nyaris bersamaan sebelum yang pertama dijawab user. Kamera baru dibuka pas user tap tombol.
  useEffect(() => stopStream, []);

  async function startCamera() {
    setStarting(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setReady(true);
    } catch {
      setError("Gak bisa akses kamera. Pastikan sudah izinkan akses kamera di browser.");
    } finally {
      setStarting(false);
    }
  }

  function handleCapture() {
    if (!videoRef.current) return;
    const dataUrl = captureFrame(videoRef.current);
    stopStream();
    setReady(false);
    onCapture(dataUrl);
  }

  if (photo) {
    return (
      <div className="flex flex-col gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- preview dari data: URI kamera, bukan aset next/image */}
        <img
          src={photo}
          alt="Selfie absensi"
          className="aspect-square w-full max-w-xs mx-auto rounded-2xl object-cover border border-border"
        />
        <Button variant="outline" onClick={onRetake} type="button">
          Foto ulang
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-2xl border border-border bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
            <Button onClick={startCamera} type="button" disabled={starting}>
              {starting ? "Membuka kamera…" : "Buka Kamera"}
            </Button>
          </div>
        )}
      </div>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
      {ready && (
        <Button onClick={handleCapture} type="button">
          Ambil Foto Selfie
        </Button>
      )}
    </div>
  );
}
