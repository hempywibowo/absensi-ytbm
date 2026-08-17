import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { uploadSelfie } from "@/lib/photo";
import { appendAttendanceRow } from "@/lib/sheets";
import { distanceInMeters, CLOCK_IN_RADIUS_METERS } from "@/lib/geo";
import { todayJakarta, nowJakartaISO, formatJamJakarta, isLateJakarta } from "@/lib/date";
import { mapAttendance } from "@/lib/mappers";
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
    .select("clock_in")
    .eq("id", attendanceId)
    .maybeSingle();
  if (existing?.clock_in) {
    return NextResponse.json({ error: "Sudah clock in hari ini." }, { status: 409 });
  }

  const { data: approvedLeave } = await supabase
    .from("leave_requests")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("date", date)
    .eq("status", "approved")
    .maybeSingle();
  if (approvedLeave) {
    return NextResponse.json(
      { error: "Hari ini sudah tercatat izin yang disetujui, gak perlu clock in." },
      { status: 409 }
    );
  }

  const photoPath = `${teacherId}/${date}/clock-in.jpg`;
  await uploadSelfie(photo, photoPath);

  const clockInTime = nowJakartaISO();
  const clockIn = { time: clockInTime, lat, lng, accuracy: accuracy ?? null, distance, photoPath };
  const status = isLateJakarta(clockInTime) ? "telat" : "hadir";

  const { data: saved, error } = await supabase
    .from("attendance")
    .upsert(
      {
        id: attendanceId,
        teacher_id: teacherId,
        teacher_name: teacher.name,
        school_id: teacher.school_id,
        school_name: school.name,
        date,
        status,
        clock_in: clockIn,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await appendAttendanceRow({
    tanggal: date,
    namaGuru: teacher.name,
    namaSekolah: school.name,
    tipe: "Clock In",
    jam: formatJamJakarta(clockInTime),
    jarakMeter: distance,
    status: status === "telat" ? "Telat" : "Hadir",
    fotoUrl: photoPath,
  });

  return NextResponse.json({ ok: true, record: mapAttendance(saved) });
}
