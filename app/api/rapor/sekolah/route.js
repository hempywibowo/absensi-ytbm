import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Daftar sekolah + guru untuk dropdown di halaman Rapor. Hanya MEMBACA tabel schools & teachers
// (nama & alamat sekolah, nama guru) — tidak mengubah data absensi sama sekali.
export async function GET() {
  const supabase = getSupabaseAdmin();
  const [{ data: schools, error: e1 }, { data: teachers, error: e2 }] = await Promise.all([
    supabase.from("schools").select("id, name, address").order("name"),
    supabase.from("teachers").select("name, school_id").order("name"),
  ]);
  if (e1 || e2) {
    return NextResponse.json({ error: (e1 || e2).message }, { status: 500 });
  }
  return NextResponse.json({
    sekolah: (schools ?? []).map((s) => ({
      id: s.id,
      nama: s.name,
      alamat: s.address || "",
      guru: (teachers ?? []).filter((t) => t.school_id === s.id).map((t) => t.name),
    })),
  });
}
