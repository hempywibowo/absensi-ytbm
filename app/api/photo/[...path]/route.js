import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin, canAccessSchool } from "@/lib/admin-auth";

// Foto selfie guru itu data pribadi — jangan pernah dibikin public URL.
// Selalu lewat sini biar dicek dulu admin/kepsek yang minta punya akses ke sekolah guru itu.
export async function GET(req, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { path } = await params;
  const storagePath = path.join("/"); // {teacherId}/{date}/{type}.jpg
  const teacherId = path[0];

  const supabase = getSupabaseAdmin();
  const { data: teacher } = await supabase.from("teachers").select("school_id").eq("id", teacherId).maybeSingle();
  if (!teacher || !canAccessSchool(admin, teacher.school_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.storage.from("selfies").download(storagePath);
  if (error || !data) {
    return NextResponse.json({ error: "Foto gak ditemukan." }, { status: 404 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
