import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin } from "@/lib/admin-auth";

export async function GET(req) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Belum terdaftar sebagai admin/kepsek." }, { status: 403 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Parameter from dan to wajib diisi." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  let teacherQuery = supabase.from("teachers").select("id, name, school_id").order("name");
  if (admin.role === "kepsek") teacherQuery = teacherQuery.eq("school_id", admin.schoolId);

  let attendanceQuery = supabase
    .from("attendance")
    .select("teacher_id, status, clock_in, clock_out")
    .gte("date", from)
    .lte("date", to);
  if (admin.role === "kepsek") attendanceQuery = attendanceQuery.eq("school_id", admin.schoolId);

  let leaveQuery = supabase
    .from("leave_requests")
    .select("teacher_id")
    .eq("status", "approved")
    .gte("date", from)
    .lte("date", to);
  if (admin.role === "kepsek") leaveQuery = leaveQuery.eq("school_id", admin.schoolId);

  const [
    { data: teachers, error: teachersError },
    { data: attendanceRows, error: attendanceError },
    { data: leaveRows, error: leaveError },
    { data: schools, error: schoolsError },
  ] = await Promise.all([teacherQuery, attendanceQuery, leaveQuery, supabase.from("schools").select("id, name")]);

  if (teachersError) return NextResponse.json({ error: teachersError.message }, { status: 500 });
  if (attendanceError) return NextResponse.json({ error: attendanceError.message }, { status: 500 });
  if (leaveError) return NextResponse.json({ error: leaveError.message }, { status: 500 });
  if (schoolsError) return NextResponse.json({ error: schoolsError.message }, { status: 500 });

  const schoolsById = Object.fromEntries((schools ?? []).map((s) => [s.id, s]));

  const summaryByTeacher = {};
  for (const t of teachers ?? []) {
    summaryByTeacher[t.id] = {
      teacherId: t.id,
      teacherName: t.name,
      schoolId: t.school_id,
      schoolName: schoolsById[t.school_id]?.name ?? "",
      hadir: 0,
      telat: 0,
      izin: 0,
      belumClockOut: 0,
    };
  }

  for (const r of attendanceRows ?? []) {
    const row = summaryByTeacher[r.teacher_id];
    if (!row) continue;
    if (r.status === "telat") row.telat += 1;
    else if (r.clock_in) row.hadir += 1;
    if (r.clock_in && !r.clock_out) row.belumClockOut += 1;
  }

  for (const r of leaveRows ?? []) {
    const row = summaryByTeacher[r.teacher_id];
    if (!row) continue;
    row.izin += 1;
  }

  return NextResponse.json({ from, to, rows: Object.values(summaryByTeacher) });
}
