// Jalanin: npm run seed
// Baca data/seed-data.json lalu upsert ke Supabase (schools, teachers, admins).
// Aman dijalanin berkali-kali — upsert per-id, bukan duplikat.
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const seed = JSON.parse(readFileSync(join(__dirname, "..", "data", "seed-data.json"), "utf-8"));

async function run() {
  console.log(`Seeding data untuk: ${seed.yayasan}`);

  for (const school of seed.schools) {
    const { error } = await supabase.from("schools").upsert({
      id: school.id,
      name: school.name,
      address: school.address,
      lat: school.lat,
      lng: school.lng,
      maps_link: school.mapsLink,
    });
    if (error) throw error;
    console.log(`  sekolah: ${school.name}${school.lat ? "" : "  (lokasi belum diisi)"}`);
  }

  for (const teacher of seed.teachers) {
    const { error } = await supabase.from("teachers").upsert({
      id: teacher.id,
      name: teacher.name,
      school_id: teacher.schoolId,
      free_location: teacher.freeLocation ?? false,
    });
    if (error) throw error;
    console.log(`  guru: ${teacher.name} -> ${teacher.schoolId}${teacher.freeLocation ? "  (bebas lokasi)" : ""}`);
  }

  for (const admin of seed.admins) {
    const { error } = await supabase.from("admins").upsert({
      email: admin.email,
      name: admin.name,
      role: admin.role,
      school_id: admin.schoolId ?? null,
    });
    if (error) throw error;
    console.log(`  admin: ${admin.name} (${admin.role})`);
  }

  console.log("Selesai.");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
