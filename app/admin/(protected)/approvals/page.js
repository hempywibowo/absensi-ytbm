"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge } from "@/components/ui";

export default function ApprovalsPage() {
  const [requests, setRequests] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/leave-request?status=pending");
      const data = await res.json();
      if (cancelled) return;
      setRequests(res.ok ? data.requests : []);
      if (!res.ok) setError(data.error || "Gagal memuat data.");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function review(id, action) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/leave-request/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memproses.");
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Persetujuan Izin</h1>
      {error && <p className="text-sm text-danger">{error}</p>}

      {!requests ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : requests.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted">Gak ada pengajuan izin yang menunggu.</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{r.teacherName}</p>
                  <p className="text-sm text-muted">{r.schoolName}</p>
                  <Badge tone="warning">{r.date}</Badge>
                  <p className="mt-2 text-sm">{r.reason}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => review(r.id, "reject")}
                    type="button"
                  >
                    Tolak
                  </Button>
                  <Button disabled={busyId === r.id} onClick={() => review(r.id, "approve")} type="button">
                    Setujui
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
