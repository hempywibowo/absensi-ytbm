"use client";

import { useState } from "react";

export default function PreviewRequest({ songId, requested: initialRequested }) {
  const [requested, setRequested] = useState(initialRequested);
  const [open, setOpen] = useState(false);
  const [wa, setWa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/songs/${songId}/preview-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp: wa }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setRequested(true);
  }

  if (requested) {
    return (
      <div className="text-center">
        <p className="text-2xl">🎧</p>
        <p className="mt-1 font-semibold">Cuplikan lagumu sedang disiapkan</p>
        <p className="mt-1 text-sm text-muted">Kami kabari lewat WhatsApp begitu cuplikannya siap didengar di halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-2xl">🎧</p>
      <p className="mt-1 font-semibold">Penasaran gimana lagunya kalau dinyanyikan?</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="mt-3 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
          Dengar cuplikan lagumu (gratis)
        </button>
      ) : (
        <form onSubmit={submit} className="mx-auto mt-3 max-w-sm space-y-2">
          <p className="text-sm text-muted">Masukkan nomor WhatsApp, kami kabari begitu cuplikannya siap.</p>
          <input
            type="tel"
            inputMode="tel"
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            placeholder="0812xxxxxxxx"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center"
          />
          <button disabled={loading} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
            {loading ? "Mengirim..." : "Minta Cuplikan"}
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      )}
    </div>
  );
}
