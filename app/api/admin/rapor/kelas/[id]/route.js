import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin, canAccessSchool } from "@/lib/admin-auth";

// Detail satu kelas (salinan data terakhir yang dikirim guru), untuk dibaca kepala sekolah/admin.
export async function GET(req, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Belum terdaftar sebagai admin/kepsek." }, { status: 403 });
  }
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: kelas, error } = await supabase.from("rapor_kelas").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!kelas) return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
  if (!canAccessSchool(admin, kelas.school_id)) {
    return NextResponse.json({ error: "Tidak punya akses ke kelas ini." }, { status: 403 });
  }
  const { data: guru } = await supabase.from("teachers").select("name").eq("id", kelas.teacher_id).maybeSingle();
  return NextResponse.json({ kelas: { ...kelas, guru: guru?.name || "" } });
}
