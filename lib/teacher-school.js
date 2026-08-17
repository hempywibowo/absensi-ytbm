// Query manual 2-langkah (bukan embedded resource `schools(...)` punya PostgREST) — sengaja,
// biar gak gantung ke schema-cache PostgREST yang kadang telat detect foreign key abis bikin tabel baru.
export async function getTeacherWithSchool(supabase, teacherId) {
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name, school_id, free_location")
    .eq("id", teacherId)
    .maybeSingle();
  if (!teacher) return { teacher: null, school: null };

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", teacher.school_id)
    .maybeSingle();

  return { teacher, school };
}
