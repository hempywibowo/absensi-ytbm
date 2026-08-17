import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { todayJakarta } from "@/lib/date";
import { mapAttendance, mapLeaveRequest } from "@/lib/mappers";

export async function GET(req) {
  const teacherId = req.nextUrl.searchParams.get("teacherId");
  if (!teacherId) {
    return NextResponse.json({ error: "teacherId wajib diisi" }, { status: 400 });
  }

  const date = todayJakarta();
  const supabase = getSupabaseAdmin();

  const [{ data: attendance }, { data: leaveRequest }] = await Promise.all([
    supabase.from("attendance").select("*").eq("id", `${teacherId}_${date}`).maybeSingle(),
    supabase
      .from("leave_requests")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("date", date)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    date,
    attendance: attendance ? mapAttendance(attendance) : null,
    leaveRequest: leaveRequest ? mapLeaveRequest(leaveRequest) : null,
  });
}
