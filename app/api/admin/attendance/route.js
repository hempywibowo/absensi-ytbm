import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { todayJakarta } from "@/lib/date";
import { mapAttendance } from "@/lib/mappers";

export async function GET(req) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Belum terdaftar sebagai admin/kepsek." }, { status: 403 });
  }

  const date = req.nextUrl.searchParams.get("date") || todayJakarta();
  const supabase = getSupabaseAdmin();

  let teacherQuery = supabase.from("teachers").select("id, name, school_id").order("name");
  if (admin.role === "kepsek") teacherQuery = teacherQuery.eq("school_id", admin.schoolId);

  let attendanceQuery = supabase.from("attendance").select("*").eq("date", date);
  if (admin.role === "kepsek") attendanceQuery = attendanceQuery.eq("school_id", admin.schoolId);

  const [
    { data: teachers, error: teachersError },
    { data: attendanceRows, error: attendanceError },
    { data: schools, error: schoolsError },
  ] = await Promise.all([teacherQuery, attendanceQuery, supabase.from("schools").select("id, name")]);

  if (teachersError) return NextResponse.json({ error: teachersError.message }, { status: 500 });
  if (attendanceError) return NextResponse.json({ error: attendanceError.message }, { status: 500 });
  if (schoolsError) return NextResponse.json({ error: schoolsError.message }, { status: 500 });

  const schoolsById = Object.fromEntries((schools ?? []).map((s) => [s.id, s]));
  const attendanceByTeacher = Object.fromEntries(
    (attendanceRows ?? []).map((r) => [r.teacher_id, mapAttendance(r)])
  );

  const rows = (teachers ?? []).map((t) => ({
    teacherId: t.id,
    teacherName: t.name,
    schoolId: t.school_id,
    schoolName: schoolsById[t.school_id]?.name ?? "",
    attendance: attendanceByTeacher[t.id] ?? null,
  }));

  return NextResponse.json({ date, rows });
}
