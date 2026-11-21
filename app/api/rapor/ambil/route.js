import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { periksaPin } from "@/lib/rapor-pin";

// Ambil data kelas milik guru dari server ke perangkat lain (HP <-> laptop). Dilindungi PIN guru.
// Tanpa kelasId: daftar kelas guru. Dengan kelasId: data lengkap kelas itu.
export async function POST(request) {
  try {
    const body = await request.json();
    const guruId = String(body.guruId || "").slice(0, 100);
    if (!guruId) return NextResponse.json({ error: "Pilih nama guru dulu." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: guru } = await supabase.from("teachers").select("id").eq("id", guruId).maybeSingle();
    if (!guru) return NextResponse.json({ error: "Guru tidak ditemukan." }, { status: 400 });
    const salahPin = await periksaPin(supabase, guru.id, String(body.pin || ""));
    if (salahPin) return NextResponse.json({ error: salahPin }, { status: 401 });

    if (!body.kelasId) {
      const { data, error } = await supabase
        .from("rapor_kelas")
        .select("id, nama_kelas, kelompok, ta, semester, jumlah_murid, uploaded_at")
        .eq("teacher_id", guru.id)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ kelas: data || [] });
    }

    const { data: kelas, error } = await supabase
      .from("rapor_kelas")
      .select("id, teacher_id, data, uploaded_at")
      .eq("id", String(body.kelasId))
      .maybeSingle();
    if (error) throw error;
    if (!kelas || kelas.teacher_id !== guru.id) {
      return NextResponse.json({ error: "Kelas tidak ditemukan untuk guru ini." }, { status: 404 });
    }
    return NextResponse.json({ data: kelas.data, uploaded_at: kelas.uploaded_at });
  } catch (err) {
    console.error("[rapor] ambil:", err);
    return NextResponse.json({ error: "Gagal mengambil data dari server. Coba lagi." }, { status: 500 });
  }
}
