export const metadata = {
  title: "Kebijakan Privasi — Yayasan Tunas Bangsa Mandiri",
};

// Kebijakan privasi aplikasi Absensi & Rapor YTBM (juga diminta Google untuk izin Google Drive).
export default function PrivasiPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-5 py-10 text-sm leading-relaxed">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Yayasan Tunas Bangsa Mandiri</p>
      <h1 className="text-2xl font-bold">Kebijakan Privasi</h1>
      <p>
        Aplikasi Absensi Guru dan Rapor Anak dipakai secara internal oleh pendidik, kepala sekolah, dan pengurus
        Yayasan Tunas Bangsa Mandiri (YTBM). Halaman ini menjelaskan data apa yang dikumpulkan dan bagaimana
        menggunakannya.
      </p>

      <h2 className="mt-2 text-lg font-semibold">Data yang dikumpulkan</h2>
      <ul className="list-disc pl-5">
        <li>Absensi guru: nama, waktu masuk/pulang, lokasi saat absen, foto selfie, dan pengajuan izin.</li>
        <li>
          Rapor anak: data murid (nama, tanggal lahir, nama orang tua, dll.), catatan pengamatan harian, penilaian
          capaian pembelajaran, narasi rapor, serta foto/video kegiatan pembelajaran.
        </li>
        <li>Rencana pembelajaran mingguan (PPM) yang diunggah guru.</li>
      </ul>

      <h2 className="mt-2 text-lg font-semibold">Penggunaan data</h2>
      <ul className="list-disc pl-5">
        <li>Hanya untuk administrasi kehadiran guru, pembelajaran, pemantauan oleh kepala sekolah/yayasan, dan penyusunan rapor.</li>
        <li>
          Untuk membaca dokumen/foto dan membantu menyusun narasi, teks dan foto dikirim ke layanan AI (Anthropic).
          Data tersebut tidak dipakai untuk iklan dan tidak dijual.
        </li>
        <li>
          Foto/video kegiatan disimpan di Google Drive milik yayasan dan tidak dibagikan secara publik. Aplikasi hanya
          mengakses folder rapor yayasan.
        </li>
      </ul>

      <h2 className="mt-2 text-lg font-semibold">Penyimpanan &amp; akses</h2>
      <p>
        Data disimpan di perangkat guru dan di server yayasan (Supabase, Google Drive). Akses dibatasi: guru dengan PIN
        untuk kelasnya, kepala sekolah untuk sekolahnya, dan admin yayasan. Orang tua/wali dapat meminta melihat,
        memperbaiki, atau menghapus data anaknya melalui sekolah.
      </p>

      <h2 className="mt-2 text-lg font-semibold">Kontak</h2>
      <p>Pertanyaan tentang privasi dapat disampaikan ke kepala sekolah masing-masing atau pengurus Yayasan Tunas Bangsa Mandiri.</p>
    </main>
  );
}
