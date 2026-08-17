import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "./supabase-admin";

// Role disimpan di tabel "admins", keyed by email (bukan Clerk user id) — biar admin yayasan
// bisa nambah kepsek/admin baru cukup dengan input email, sebelum orangnya sign up ke Clerk.
export async function getCurrentAdmin() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("admins").select("*").eq("email", email).maybeSingle();
  if (!data) return null;

  return { email, name: data.name, role: data.role, schoolId: data.school_id };
}

// admin = akses lihat semua sekolah, kepsek = dibatasi lihat schoolId miliknya sendiri.
// Ini cuma buat hak LIHAT (dashboard, data sekolah) — bukan hak approve izin, lihat canApprove().
export function canAccessSchool(admin, schoolId) {
  if (!admin) return false;
  if (admin.role === "admin") return true;
  return admin.role === "kepsek" && admin.schoolId === schoolId;
}

// Approve/reject izin cuma boleh admin (ketua yayasan & guru yang dikasih wewenang admin).
// Kepala sekolah biasa BISA lihat dashboard sekolahnya, tapi TIDAK BISA approve izin sama sekali,
// termasuk izin guru di sekolahnya sendiri.
export function canApprove(admin) {
  return admin?.role === "admin";
}
