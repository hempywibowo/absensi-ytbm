import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { mapSchool } from "@/lib/mappers";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Belum terdaftar sebagai admin/kepsek." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  let query = supabase.from("schools").select("*").order("name");
  if (admin.role === "kepsek") {
    query = query.eq("id", admin.schoolId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schools: data.map(mapSchool) });
}
