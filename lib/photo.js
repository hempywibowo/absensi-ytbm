import { getSupabaseAdmin } from "./supabase-admin";

export async function uploadSelfie(dataUrl, path) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from("selfies").upload(path, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(`Gagal upload foto: ${error.message}`);

  return path;
}
