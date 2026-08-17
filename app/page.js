"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";
import CameraCapture from "@/components/CameraCapture";
import { useGeolocation } from "@/lib/useGeolocation";

const LAST_TEACHER_KEY = "absensi-ytbm:teacherId";

export default function GuruPage() {
  const [teachers, setTeachers] = useState(null);
  const [teachersError, setTeachersError] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [today, setToday] = useState(null);
  const loadingToday = Boolean(teacherId) && today === null;
  const [mode, setMode] = useState(null); // null | "clock-in" | "clock-out"
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { position, error: geoError, loading: geoLoading, locate } = useGeolocation();

  useEffect(() => {
    fetch("/api/teachers")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Gagal memuat data guru (${r.status}).`);
        return r.json();
      })
      .then((data) => {
        setTeachers(data.teachers);
        const saved = localStorage.getItem(LAST_TEACHER_KEY);
        if (saved && data.teachers.some((t) => t.id === saved)) {
          setTeacherId(saved);
        }
      })
      .catch((err) => setTeachersError(err.message || "Gagal memuat data guru."));
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;
    fetch(`/api/attendance/today?teacherId=${teacherId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setToday(data);
      });
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  function selectTeacher(id) {
    setTeacherId(id);
    setToday(null);
    localStorage.setItem(LAST_TEACHER_KEY, id);
  }

  function gantiNama() {
    localStorage.removeItem(LAST_TEACHER_KEY);
    setTeacherId("");
    setToday(null);
  }

  function startFlow(type) {
    setMode(type);
    setPhoto(null);
    setSubmitError("");
    locate();
  }

  function cancelFlow() {
    setMode(null);
    setPhoto(null);
    setSubmitError("");
  }

  async function submit() {
    if (!position || !photo) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          lat: position.lat,
          lng: position.lng,
          accuracy: position.accuracy,
          photo,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Gagal mengirim absensi.");
        return;
      }

      setMode(null);
      setPhoto(null);
      const refreshed = await fetch(`/api/attendance/today?teacherId=${teacherId}`).then((r) => r.json());
      setToday(refreshed);
    } catch {
      setSubmitError("Koneksi bermasalah, coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const teacher = teachers?.find((t) => t.id === teacherId);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Yayasan Tunas Bangsa Mandiri
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-primary">Absensi Guru</h1>
      </header>

      {teachersError ? (
        <Card className="border-danger bg-danger-soft p-4 text-center text-sm text-danger">
          {teachersError} Coba refresh halaman ini beberapa saat lagi.
        </Card>
      ) : !teachers ? (
        <p className="text-center text-sm text-muted">Memuat data guru…</p>
      ) : !teacherId ? (
        <Card className="p-5">
          <label className="mb-2 block text-sm font-semibold">Pilih nama Anda</label>
          <select
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            defaultValue=""
            onChange={(e) => e.target.value && selectTeacher(e.target.value)}
          >
            <option value="" disabled>
              — pilih nama —
            </option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.schoolName}
              </option>
            ))}
          </select>
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{teacher?.name}</p>
                <p className="text-sm text-muted">{teacher?.schoolName}</p>
                {teacher?.freeLocation && (
                  <Badge tone="neutral">Bisa absen dari mana saja</Badge>
                )}
              </div>
              <button onClick={gantiNama} className="text-xs font-semibold text-primary underline">
                Ganti nama
              </button>
            </div>
          </Card>

          {teacher && !teacher.schoolHasLocation && (
            <Card className="border-danger bg-danger-soft p-4 text-sm text-danger">
              Lokasi {teacher.schoolName} belum diatur oleh admin. Clock in/out belum bisa dipakai dulu —
              hubungi admin yayasan.
            </Card>
          )}

          {loadingToday ? (
            <p className="text-center text-sm text-muted">Memuat status absensi…</p>
          ) : mode ? (
            <Card className="flex flex-col gap-4 p-5">
              <h2 className="text-center font-bold">
                {mode === "clock-in" ? "Clock In" : "Clock Out"}
              </h2>

              <div>
                <p className="mb-2 text-sm font-semibold">1. Lokasi</p>
                {geoLoading && <p className="text-sm text-muted">Mendeteksi lokasi…</p>}
                {geoError && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-danger">{geoError}</p>
                    <Button variant="outline" onClick={locate} type="button">
                      Coba lagi
                    </Button>
                  </div>
                )}
                {position && (
                  <Badge tone="neutral">
                    Lokasi terdeteksi (akurasi ~{Math.round(position.accuracy)}m)
                  </Badge>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">2. Foto Selfie</p>
                <CameraCapture photo={photo} onCapture={setPhoto} onRetake={() => setPhoto(null)} />
              </div>

              {submitError && <p className="text-sm text-danger">{submitError}</p>}

              <div className="flex gap-3">
                <Button variant="outline" onClick={cancelFlow} type="button" className="flex-1">
                  Batal
                </Button>
                <Button
                  onClick={submit}
                  disabled={!position || !photo || submitting}
                  type="button"
                  className="flex-1"
                >
                  {submitting ? "Mengirim…" : "Kirim"}
                </Button>
              </div>
            </Card>
          ) : (
            <AttendanceStatus
              today={today}
              teacher={teacher}
              onClockIn={() => startFlow("clock-in")}
              onClockOut={() => startFlow("clock-out")}
            />
          )}

          <Link
            href={`/izin?teacherId=${teacherId}`}
            className="text-center text-sm font-semibold text-primary underline"
          >
            Ajukan Izin
          </Link>
        </>
      )}
    </main>
  );
}

function AttendanceStatus({ today, teacher, onClockIn, onClockOut }) {
  if (!today) return null;

  if (today.leaveRequest?.status === "approved") {
    return (
      <Card className="p-5 text-center">
        <Badge tone="neutral">Izin disetujui</Badge>
        <p className="mt-2 text-sm text-muted">Hari ini Anda tercatat izin. Gak perlu clock in.</p>
      </Card>
    );
  }

  if (today.leaveRequest?.status === "pending") {
    return (
      <Card className="p-5 text-center">
        <Badge tone="warning">Menunggu persetujuan</Badge>
        <p className="mt-2 text-sm text-muted">
          Pengajuan izin hari ini masih menunggu persetujuan kepala sekolah/admin.
        </p>
      </Card>
    );
  }

  const { attendance } = today;
  const canClockIn = teacher?.schoolHasLocation && !attendance?.clockIn;
  const canClockOut = teacher?.schoolHasLocation && attendance?.clockIn && !attendance?.clockOut;
  const done = attendance?.clockIn && attendance?.clockOut;

  return (
    <Card className="flex flex-col gap-4 p-5">
      {attendance?.clockIn && (
        <StatusRow label="Clock In" time={attendance.clockIn.time} />
      )}
      {attendance?.clockOut && (
        <StatusRow label="Clock Out" time={attendance.clockOut.time} />
      )}

      {done && (
        <p className="text-center text-sm font-semibold text-primary">
          Absensi hari ini sudah lengkap. Sampai jumpa besok!
        </p>
      )}

      {canClockIn && (
        <Button onClick={onClockIn} type="button">
          Clock In
        </Button>
      )}
      {canClockOut && (
        <Button onClick={onClockOut} type="button">
          Clock Out
        </Button>
      )}
    </Card>
  );
}

function StatusRow({ label, time }) {
  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));

  return (
    <div className="flex items-center justify-between rounded-xl bg-primary-soft px-4 py-3">
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-sm">{jam} WIB</span>
    </div>
  );
}
