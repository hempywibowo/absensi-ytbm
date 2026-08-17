"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";

function todayInputValue() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function IzinForm() {
  const searchParams = useSearchParams();
  const teacherId = searchParams.get("teacherId");

  const [teacher, setTeacher] = useState(null);
  const [date, setDate] = useState(todayInputValue());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok } | { error }

  useEffect(() => {
    if (!teacherId) return;
    fetch("/api/teachers")
      .then((r) => r.json())
      .then((data) => setTeacher(data.teachers.find((t) => t.id === teacherId)));
  }, [teacherId]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/leave-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, date, reason }),
      });
      const data = await res.json();
      setResult(res.ok ? { ok: true } : { error: data.error });
    } catch {
      setResult({ error: "Koneksi bermasalah, coba lagi." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!teacherId) {
    return (
      <Card className="p-5 text-center text-sm">
        Buka halaman ini lewat menu &quot;Ajukan Izin&quot; di halaman absensi.
      </Card>
    );
  }

  if (result?.ok) {
    return (
      <Card className="p-5 text-center">
        <Badge tone="warning">Terkirim</Badge>
        <p className="mt-2 text-sm text-muted">
          Pengajuan izin sudah dikirim, menunggu persetujuan kepala sekolah/admin.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary underline">
          Kembali ke Absensi
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{teacher?.name ?? "Memuat…"}</p>
      <h1 className="mb-4 text-lg font-bold">Ajukan Izin</h1>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold">Tanggal</label>
          <input
            type="date"
            required
            min={todayInputValue()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Alasan</label>
          <textarea
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: sakit, ada acara keluarga, dll."
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
          />
        </div>

        {result?.error && <p className="text-sm text-danger">{result.error}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Mengirim…" : "Kirim Pengajuan"}
        </Button>
        <Link href="/" className="text-center text-sm text-muted underline">
          Batal
        </Link>
      </form>
    </Card>
  );
}

export default function IzinPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <Suspense fallback={<p className="text-center text-sm text-muted">Memuat…</p>}>
        <IzinForm />
      </Suspense>
    </main>
  );
}
