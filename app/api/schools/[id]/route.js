import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentAdmin } from "@/lib/admin-auth";

// Cuma admin yayasan yang boleh ubah lokasi sekolah, bukan kepsek.
export async function PATCH(req, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Cuma admin yayasan yang bisa mengubah data sekolah." }, { status: 403 });
  }

  const { id } = await params;
  const { name, address, lat, lng, mapsLink } = await req.json();

  if (lat != null && (typeof lat !== "number" || lat < -90 || lat > 90)) {
    return NextResponse.json({ error: "Latitude gak valid." }, { status: 400 });
  }
  if (lng != null && (typeof lng !== "number" || lng < -180 || lng > 180)) {
    return NextResponse.json({ error: "Longitude gak valid." }, { status: 400 });
  }

  const update = {};
  if (name !== undefined) update.name = name;
  if (address !== undefined) update.address = address;
  if (lat !== undefined) update.lat = lat;
  if (lng !== undefined) update.lng = lng;
  if (mapsLink !== undefined) update.maps_link = mapsLink;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("schools").update(update).eq("id", id).select().maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Sekolah gak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
