import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin, canApprove } from "@/lib/admin-auth";
import { nowJakartaISO } from "@/lib/date";

export async function POST(req, { params }) {
  const admin = await getCurrentAdmin();
  if (!canApprove(admin)) {
    return NextResponse.json(
      { error: "Cuma admin/ketua yayasan yang bisa approve izin. Kepala sekolah gak punya akses ini." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const { action } = await req.json();
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: request } = await supabase.from("leave_requests").select("*").eq("id", id).maybeSingle();
  if (!request) {
    return NextResponse.json({ error: "Pengajuan izin gak ditemukan." }, { status: 404 });
  }
  if (request.status !== "pending") {
    return NextResponse.json({ error: "Pengajuan ini sudah diproses sebelumnya." }, { status: 409 });
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      reviewed_by: admin.name || admin.email,
      reviewed_at: nowJakartaISO(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
