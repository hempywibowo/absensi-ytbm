import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { uploadSelfie } from "@/lib/photo";
import { appendAttendanceRow } from "@/lib/sheets";
import { distanceInMeters, CLOCK_IN_RADIUS_METERS } from "@/lib/geo";
import { todayJakarta, nowJakartaISO, formatJamJakarta } from "@/lib/date";
import { getTeacherWithSchool } from "@/lib/teacher-school";

export async function POST(req) {
  const { teacherId, lat, lng, accuracy, photo } = await req.json();

  if (!teacherId || typeof lat !== "number" || typeof lng !== "number" || !photo) {
    return NextResponse.json({ error: "Data gak lengkap." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { teacher, school } = await getTeacherWithSchool(supabase, teacherId);
  if (!teacher) {
    return NextResponse.json({ error: "Guru gak ditemukan." }, { status: 404 });
  }

  let distance = null;
  if (!teacher.free_location) {
    if (!school?.lat || !school?.lng) {
      return NextResponse.json(
        { error: `Lokasi ${school?.name ?? "sekolah"} belum diatur admin. Hubungi admin yayasan dulu.` },
        { status: 409 }
      );
    }

    distance = Math.round(distanceInMeters(lat, lng, school.lat, school.lng));
    if (distance > CLOCK_IN_RADIUS_METERS) {
      return NextResponse.json(
        {
          error: `Anda berada ${distance}m dari ${school.name}, di luar radius ${CLOCK_IN_RADIUS_METERS}m yang diizinkan.`,
          distance,
        },
        { status: 422 }
      );
    }
  }

  const date = todayJakarta();
  const attendanceId = `${teacherId}_${date}`;

  const { data: existing } = await supabase
    .from("attendance")
    .select("clock_in, clock_out, status")
    .eq("id", attendanceId)
    .maybeSingle();
  if (!existing?.clock_in) {
    return NextResponse.json({ error: "Belum clock in hari ini." }, { status: 409 });
  }
  if (existing.clock_out) {
    return NextResponse.json({ error: "Sudah clock out hari ini." }, { status: 409 });
  }

  const photoPath = `${teacherId}/${date}/clock-out.jpg`;
  await uploadSelfie(photo, photoPath);

  const clockOutTime = nowJakartaISO();
  const clockOut = { time: clockOutTime, lat, lng, accuracy: accuracy ?? null, distance, photoPath };

  const { error } = await supabase.from("attendance").update({ clock_out: clockOut }).eq("id", attendanceId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await appendAttendanceRow({
    tanggal: date,
    namaGuru: teacher.name,
    namaSekolah: school.name,
    tipe: "Clock Out",
    jam: formatJamJakarta(clockOutTime),
    jarakMeter: distance,
    status: existing.status === "telat" ? "Telat" : "Hadir",
    fotoUrl: photoPath,
  });

  return NextResponse.json({ ok: true, clockOut });
}
