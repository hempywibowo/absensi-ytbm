import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { hashPin, PIN_VALID } from "@/lib/rapor-pin";

// Buat / ganti PIN guru untuk mengirim data rapor. Admin: semua guru. Kepsek: guru di sekolahnya.
export async function POST(req) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Belum terdaftar sebagai admin/kepsek." }, { status: 403 });
  }
  const { teacherId, pin } = await req.json();
  if (!PIN_VALID.test(String(pin || ""))) {
    return NextResponse.json({ error: "PIN harus 4–6 angka." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: guru } = await supabase.from("teachers").select("id, school_id").eq("id", String(teacherId || "")).maybeSingle();
  if (!guru) return NextResponse.json({ error: "Guru tidak ditemukan." }, { status: 404 });
  if (admin.role === "kepsek" && guru.school_id !== admin.schoolId) {
    return NextResponse.json({ error: "Kepala sekolah hanya bisa mengatur PIN guru di sekolahnya." }, { status: 403 });
  }

  const { error } = await supabase.from("rapor_pin").upsert({
    teacher_id: guru.id,
    pin_hash: await hashPin(String(pin)),
    gagal: 0,
    kunci_sampai: null,
    updated_at: new Date().toISOString(),
    updated_by: admin.email,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
