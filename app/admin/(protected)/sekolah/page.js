"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge } from "@/components/ui";

// Nerima format "-6.200000, 106.816666" (hasil klik-kanan di Google Maps -> klik koordinat teratas)
function parseCoords(text) {
  const match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (!match) return null;
  return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
}

function SchoolRow({ school, onSaved }) {
  const [address, setAddress] = useState(school.address || "");
  const [mapsLink, setMapsLink] = useState(school.mapsLink || "");
  const [coordInput, setCoordInput] = useState(
    school.lat && school.lng ? `${school.lat}, ${school.lng}` : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);

    const coords = parseCoords(coordInput);
    if (coordInput && !coords) {
      setError('Format koordinat gak dikenali. Contoh yang benar: "-6.200000, 106.816666"');
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/schools/${school.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        mapsLink,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Gagal menyimpan.");
      return;
    }
    setSaved(true);
    onSaved();
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">{school.name}</p>
        {school.lat && school.lng ? (
          <Badge tone="neutral">Lokasi diatur</Badge>
        ) : (
          <Badge tone="danger">Lokasi belum diatur</Badge>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Alamat</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Koordinat (klik kanan lokasi di Google Maps → klik angka koordinat teratas → paste di sini)
          </label>
          <input
            value={coordInput}
            onChange={(e) => setCoordInput(e.target.value)}
            placeholder="-6.200000, 106.816666"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Link Google Maps (opsional, buat referensi)</label>
          <input
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && !error && <p className="text-sm text-primary">Tersimpan.</p>}

        <Button onClick={save} disabled={saving} type="button" className="self-start">
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </Card>
  );
}

export default function SekolahPage() {
  const [schools, setSchools] = useState(null);

  function load() {
    fetch("/api/schools")
      .then((r) => r.json())
      .then((data) => setSchools(data.schools ?? []));
  }

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Data Sekolah</h1>
      <p className="text-sm text-muted">
        Selama lokasi belum diisi, guru di sekolah itu belum bisa clock in/out. Radius toleransi clock-in
        saat ini <strong>100 meter</strong> dari titik koordinat ini.
      </p>

      {!schools ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {schools.map((s) => (
            <SchoolRow key={s.id} school={s} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}
