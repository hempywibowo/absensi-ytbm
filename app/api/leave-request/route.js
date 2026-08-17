import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin, canApprove } from "@/lib/admin-auth";
import { todayJakarta } from "@/lib/date";
import { mapLeaveRequest } from "@/lib/mappers";
import { getTeacherWithSchool } from "@/lib/teacher-school";

// Guru mengajukan izin — publik, gak perlu login Clerk (konsisten sama halaman clock-in/out).
export async function POST(req) {
  const { teacherId, date, reason } = await req.json();

  if (!teacherId || !date || !reason?.trim()) {
    return NextResponse.json({ error: "Data gak lengkap." }, { status: 400 });
  }
  if (date < todayJakarta()) {
    return NextResponse.json({ error: "Gak bisa ajukan izin untuk tanggal yang sudah lewat." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { teacher, school } = await getTeacherWithSchool(supabase, teacherId);
  if (!teacher) {
    return NextResponse.json({ error: "Guru gak ditemukan." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("leave_requests")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("date", date)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Sudah ada pengajuan izin untuk tanggal ini." }, { status: 409 });
  }

  const { data: inserted, error } = await supabase
    .from("leave_requests")
    .insert({
      teacher_id: teacherId,
      teacher_name: teacher.name,
      school_id: teacher.school_id,
      school_name: school?.name ?? "",
      date,
      reason: reason.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}

// Cuma admin/ketua yayasan yang bisa lihat & proses antrean approval — kepala sekolah biasa
// gak punya akses ke fitur ini sama sekali (lihat lib/admin-auth.js canApprove()).
export async function GET(req) {
  const admin = await getCurrentAdmin();
  if (!canApprove(admin)) {
    return NextResponse.json(
      { error: "Cuma admin/ketua yayasan yang bisa lihat antrean approval." },
      { status: 403 }
    );
  }

  const status = req.nextUrl.searchParams.get("status") || "pending";
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("status", status)
    .order("requested_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data.map(mapLeaveRequest) });
}
