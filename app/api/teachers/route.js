import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const [{ data: teachers, error: teachersError }, { data: schools, error: schoolsError }] =
    await Promise.all([
      supabase.from("teachers").select("id, name, school_id, free_location").order("name"),
      supabase.from("schools").select("id, name, lat, lng"),
    ]);

  if (teachersError) return NextResponse.json({ error: teachersError.message }, { status: 500 });
  if (schoolsError) return NextResponse.json({ error: schoolsError.message }, { status: 500 });

  const schoolsById = Object.fromEntries((schools ?? []).map((s) => [s.id, s]));

  return NextResponse.json({
    teachers: (teachers ?? []).map((t) => {
      const school = schoolsById[t.school_id];
      return {
        id: t.id,
        name: t.name,
        schoolId: t.school_id,
        schoolName: school?.name ?? "(sekolah tidak ditemukan)",
        schoolHasLocation: t.free_location || Boolean(school?.lat && school?.lng),
        freeLocation: t.free_location,
      };
    }),
  });
}
