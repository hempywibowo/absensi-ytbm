import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin, canAccessSchool } from "@/lib/admin-auth";
import { ambilFile } from "@/lib/rapor-drive";

// Pratinjau foto kegiatan untuk kepala sekolah/admin. Hanya file yang memang tercatat di kelas
// yang boleh diakses (dicek dari salinan data kelas di server).
export async function GET(req) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Belum terdaftar sebagai admin/kepsek." }, { status: 403 });
  const kelasId = req.nextUrl.searchParams.get("kelas") || "";
  const fileId = req.nextUrl.searchParams.get("file") || "";

  const supabase = getSupabaseAdmin();
  const { data: kelas } = await supabase.from("rapor_kelas").select("school_id, data").eq("id", kelasId).maybeSingle();
  if (!kelas || !canAccessSchool(admin, kelas.school_id)) {
    return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
  }
  const ada = Object.values(kelas.data?.sem || {}).some((s) =>
    (s.jurnal || []).some((j) => (j.media || []).some((m) => m.driveId === fileId)),
  );
  if (!ada) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });

  try {
    const { data, mime } = await ambilFile(fileId);
    return new NextResponse(data, { headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" } });
  } catch (err) {
    console.error("[rapor] media:", err);
    return NextResponse.json({ error: "Gagal mengambil file dari Google Drive." }, { status: 502 });
  }
}
