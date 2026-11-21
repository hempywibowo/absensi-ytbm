import Link from "next/link";

export const metadata = {
  title: "Panduan Rapor — Yayasan Tunas Bangsa Mandiri",
  description: "Buku panduan penggunaan fitur Rapor Anak untuk guru, kepala sekolah, dan admin YTBM",
};

// Buku panduan fitur Rapor. Satu sumber: dibaca di aplikasi (/rapor/panduan) dan dicetak jadi PDF.

function Bab({ id, no, judul, children }) {
  return (
    <section id={id} className="bab flex scroll-mt-4 flex-col gap-3 border-t border-border pt-6">
      <h2 className="text-xl font-bold text-primary">
        {no}. {judul}
      </h2>
      {children}
    </section>
  );
}

function Langkah({ children }) {
  return <ol className="flex list-decimal flex-col gap-1.5 pl-6">{children}</ol>;
}

function Kotak({ tone = "info", judul, children }) {
  const warna = {
    info: "border-primary bg-primary-soft",
    penting: "border-accent bg-accent-soft",
    awas: "border-danger bg-danger-soft",
  }[tone];
  return (
    <div className={`blok rounded-xl border-l-4 px-4 py-3 ${warna}`}>
      {judul && <p className="mb-1 font-bold">{judul}</p>}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

const B = ({ children }) => <b className="whitespace-nowrap">{children}</b>;

// Screenshot aplikasi (diambil dari layar HP; dashboard dari laptop).
function Gambar({ src, judul, lebar = "hp" }) {
  return (
    <figure className={`blok mx-auto flex w-full flex-col items-center gap-1 ${lebar === "hp" ? "max-w-[300px] print:max-w-[62mm]" : "max-w-full print:max-w-[150mm]"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar statis panduan, juga untuk versi cetak */}
      <img src={`/panduan/${src}.jpg`} alt={judul} loading="lazy" className="w-full rounded-xl border border-border bg-white shadow-md" />
      <figcaption className="text-center text-xs text-muted">{judul}</figcaption>
    </figure>
  );
}

function DuaGambar({ children }) {
  return <div className="grid items-start gap-4 sm:grid-cols-2 print:grid-cols-2">{children}</div>;
}

const DAFTAR = [
  ["alur", "Gambaran & alur mingguan"],
  ["mulai", "Persiapan pertama kali"],
  ["murid", "Data murid"],
  ["ppm", "Jumat: unggah PPM minggu depan"],
  ["harian", "Senin–Jumat: laporan harian"],
  ["kirim", "Kirim ke Server"],
  ["mingguan", "Jumat siang: Laporan Aktivitas Mingguan"],
  ["nilai", "Penilaian CP"],
  ["rapor", "Menyusun & mencetak rapor"],
  ["kejar", "Mengejar rapor semester ini (PPM berisi asesmen)"],
  ["pindah", "Pindah perangkat & cadangan"],
  ["tanya", "Bantuan & pertanyaan yang sering muncul"],
  ["kepsek", "Untuk kepala sekolah & admin"],
];

export default function PanduanRaporPage() {
  return (
    <div className="tema-ceria flex flex-1 flex-col">
    <main className="panduan mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 text-[15px] leading-relaxed print:max-w-none print:px-0 print:py-0 print:text-[10.5pt]">
      <style>{`
        @page { size: A4; margin: 14mm 15mm; }
        @media print {
          .panduan .bab { break-before: auto; }
          .panduan .blok, .panduan li { break-inside: avoid; }
          .panduan h2 { break-after: avoid; }
          .panduan a { color: inherit; text-decoration: none; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/rapor" className="text-sm font-semibold text-primary">
          ← Kembali ke Rapor
        </Link>
        <span className="text-xs text-muted">Simpan sebagai PDF: menu browser → Cetak / Print</span>
      </div>

      <header className="flex flex-col gap-1 border-b-4 border-double border-primary pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Yayasan Tunas Bangsa Mandiri</p>
        <h1 className="text-3xl font-bold">Buku Panduan Rapor Anak</h1>
        <p className="text-sm text-muted">
          Perencanaan mingguan, laporan harian, penilaian CP Fase Fondasi, dan rapor — untuk guru, kepala sekolah, dan admin
        </p>
        <p className="text-xs text-muted">Alamat aplikasi: absensi-ytbm.vercel.app/rapor</p>
      </header>

      <Gambar src="00-tampilan" judul="Tampilan aplikasi Rapor di HP (tab Harian)" />

      <nav className="blok rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 font-bold">Daftar isi</p>
        <ol className="grid list-decimal gap-x-6 gap-y-1 pl-6 text-sm sm:grid-cols-2">
          {DAFTAR.map(([id, judul]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-primary underline">
                {judul}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Bab id="alur" no={1} judul="Gambaran & alur mingguan">
        <p>
          Fitur Rapor membantu guru merencanakan pembelajaran, mencatat perkembangan anak setiap hari, dan menyusun rapor
          naratif yang sesuai <b>Capaian Pembelajaran (CP) Fase Fondasi — SK BSKAP 046/H/KR/2025</b> (3 elemen, 14
          sub-elemen) beserta Tujuan Pembelajaran (TP) resmi dari Panduan CP 2025.
        </p>
        <div className="blok grid gap-2 sm:grid-cols-4">
          {[
            ["📂 Jumat", "Unggah PPM untuk minggu depan (paling lambat 23.59 WIB)"],
            ["📝 Senin–Jumat", "Laporan harian: catatan, foto/video, ceklis → review → kirim"],
            ["🗓️ Jumat siang", "Laporan Aktivitas Mingguan + Asesmen Awal untuk PPM berikutnya"],
            ["📄 Akhir semester", "Penilaian CP lengkap → narasi rapor → cetak/PDF"],
          ].map(([a, b]) => (
            <div key={a} className="rounded-xl border border-border bg-surface p-3">
              <p className="font-bold text-primary">{a}</p>
              <p className="text-sm">{b}</p>
            </div>
          ))}
        </div>
        <Kotak judul="Prinsip penting">
          <p>• Semua isian dikerjakan dulu di HP/laptop guru sebagai <b>draf</b> — masih bisa diubah kapan saja.</p>
          <p>• Data baru masuk ke yayasan setelah guru menekan <B>⬆️ Kirim ke Server</B> (memakai PIN guru).</p>
          <p>• AI hanya membantu (membaca foto/dokumen, memberi label TP, menyusun kalimat). Guru <b>selalu memeriksa</b> hasilnya.</p>
          <p>• Tidak semua TP harus muncul dalam sehari. CP adalah target akhir Fase Fondasi; setiap anak berkembang sesuai lajunya.</p>
        </Kotak>
        <p>
          Enam tab di bagian atas aplikasi: <b>Kelas · Murid · Harian · PPM · Penilaian CP · Rapor</b>. Tombol <b>Sem 1 / Sem 2</b>{" "}
          di kanan atas memilih semester, dan tombol <B>💬 Bantuan</B> membuka asisten tanya-jawab (bagian 12).
        </p>
        <Gambar src="00-header" judul="Bagian atas aplikasi: semester, tombol Bantuan, dan enam tab" />
      </Bab>

      <Bab id="mulai" no={2} judul="Persiapan pertama kali">
        <p>Yang Anda perlukan dari kepala sekolah/admin: <b>PIN guru</b> (4–6 angka) dan <b>Kode Akses</b> rapor.</p>
        <Langkah>
          <li>Buka <b>absensi-ytbm.vercel.app/rapor</b> di Chrome (Android/laptop) atau Safari (iPhone).</li>
          <li>
            Agar mudah dibuka: menu browser <B>⋮</B> → <b>Tambahkan ke layar utama</b>. Ikon Rapor akan muncul seperti aplikasi.
          </li>
          <li>
            Tab <b>Kelas</b>: pilih <b>Sekolah</b>, <b>Guru kelas (akun)</b> = nama Anda, isi <b>Nama kelas</b> (mis. B2) dan{" "}
            <b>Kelompok usia</b>. Lengkapi nama kepala sekolah, NIP (opsional), tahun ajaran, semester, tempat & tanggal rapor.
          </li>
          <li>
            Masih di tab Kelas, kotak <b>Kode Akses</b>: isi kode dari kepala sekolah → <B>Simpan</B>.
          </li>
          <li>
            Opsional: kotak <b>🎨 Tema tampilan</b> — pilih warna yang Anda suka (Pelangi, Laut, Bunga, Hutan).
          </li>
        </Langkah>
        <DuaGambar>
          <Gambar src="01-kelas" judul="Tab Kelas: data kelas" />
          <div className="flex flex-col gap-4">
            <Gambar src="02-kode-akses" judul="Kotak Kode Akses" />
            <Gambar src="01b-tema" judul="Pilihan tema warna" />
          </div>
        </DuaGambar>
        <Kotak tone="penting" judul="Pernah mengisi di HP/laptop lain?">
          <p>
            Jangan mengisi ulang. Pakai <b>Pindah Perangkat</b> di tab Kelas untuk mengambil data kelas Anda dari server (lihat
            bagian 11).
          </p>
        </Kotak>
      </Bab>

      <Bab id="murid" no={3} judul="Data murid">
        <p>Tab <b>Murid</b> → pilih salah satu cara:</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-6">
          <li>
            <B>📷 Foto absen</B> — foto lembar daftar hadir/buku nama (maks. 4 foto). Ketuk <b>Baca nama dari foto</b>, periksa
            hasilnya (centang yang benar, perbaiki ejaan), lalu <B>Tambahkan</B>.
          </li>
          <li>
            <B>📋 Tempel daftar</B> — salin daftar nama dari WhatsApp/Excel, satu nama per baris.
          </li>
          <li>
            <B>⌨️ Ketik</B> — satu per satu, sekaligus data lengkap: panggilan, NIS/NISN, tempat & tanggal lahir, jenis kelamin,
            agama, nama ayah & ibu.
          </li>
        </ul>
        <p>
          Titik oranye ● di samping nama = data belum lengkap. Ketuk <b>Ubah</b> untuk melengkapi — data ini tercetak di identitas
          rapor.
        </p>
        <DuaGambar>
          <Gambar src="03-murid-foto" judul="Hasil baca foto daftar absen — periksa lalu Tambahkan" />
          <Gambar src="04-murid-ketik" judul="Melengkapi data murid (Ubah)" />
        </DuaGambar>
        <Gambar src="05-murid-daftar" judul="Daftar murid" />
      </Bab>

      <Bab id="ppm" no={4} judul="Jumat: unggah PPM minggu depan">
        <Kotak tone="awas" judul="WAJIB">
          <p>
            PPM (Perencanaan Pembelajaran Mendalam) minggu depan harus diunggah <b>paling lambat Jumat pukul 23.59 WIB</b>.
            Dashboard kepala sekolah mencatat <b>tepat waktu / terlambat / belum masuk</b>.
          </p>
        </Kotak>
        <p>
          PPM harus memuat: <b>Dimensi Profil Lulusan (DPL)</b>, <b>CP & Tujuan Pembelajaran</b>, <b>tema/sub tema</b>,{" "}
          <b>kegiatan</b> (memahami–mengaplikasi–merefleksi), <b>pertanyaan pemantik</b>, dan <b>asesmen awal</b>.
        </p>
        <Langkah>
          <li>Simpan PPM dalam format Word <b>.docx</b> (bukan PDF/.doc lama).</li>
          <li>
            Tab <b>PPM</b> → <B>📂 Unggah file PPM (.docx)</B> → pilih file. Tunggu ±1 menit.
          </li>
          <li>
            Periksa hasil bacaan:
            <ul className="mt-1 list-disc pl-6">
              <li>Badge <b>PPM rencana</b> dan minggu tujuannya (mis. 23–27 November).</li>
              <li>
                Kotak kelengkapan: hijau ✓ = lengkap. Merah = ada yang kurang (mis. &quot;DPL belum ada&quot;) → lengkapi di Word, unggah
                ulang.
              </li>
              <li>Setiap TP dicocokkan otomatis dengan TP resmi (sub-elemen & nomor TP). Ubah lewat pilihan bila kurang tepat.</li>
              <li>DPL yang dicentang, daftar kegiatan, pertanyaan pemantik.</li>
            </ul>
          </li>
          <li>
            Ketuk <B>Simpan rencana</B>, lalu <B>⬆️ Kirim ke Server</B> (di bagian bawah tab PPM) sebelum batas waktu.
          </li>
        </Langkah>
        <DuaGambar>
          <Gambar src="06-ppm-unggah" judul="Tombol unggah PPM" />
          <Gambar src="07-ppm-rencana" judul="Periksa PPM rencana: minggu tujuan, batas waktu, kelengkapan, DPL, TP" />
        </DuaGambar>
        <p className="text-sm text-muted">
          Mulai Kamis, tab Harian menampilkan pengingat bila PPM minggu depan belum ada. Bila minggu berjalan belum punya PPM,
          muncul peringatan merah.
        </p>
      </Bab>

      <Bab id="harian" no={5} judul="Senin–Jumat: laporan harian">
        <p>Tab <b>Harian</b>. Pilih tanggal (default hari ini) — deret Sen–Jum di bawahnya menunjukkan jumlah catatan per hari.</p>
        <p>
          Kartu <b>Rencana minggu ini</b> menampilkan PPM yang diunggah Jumat lalu (DPL, TP, kegiatan, pemantik).
        </p>
        <Gambar src="08-harian-rencana" judul="Rencana minggu ini (dari PPM)" />
        <h3 className="font-bold">A. Mencatat kegiatan</h3>
        <Langkah>
          <li>
            Ketuk <B>⌨️ Ketik</B>. Tuliskan apa yang benar-benar dilihat/didengar: kegiatan, ucapan anak, hasil karya, kemajuan,
            atau yang masih perlu dibantu.
          </li>
          <li>
            Tidak sempat mengetik? Ketuk <B>🎤 Bicara (dikte suara)</B> lalu bercerita sambil bekerja. Ketuk lagi untuk berhenti.
            (Pertama kali, izinkan mikrofon.)
          </li>
          <li>
            Tambahkan dokumentasi: <B>📷 Foto kegiatan</B> atau <B>🖼️ Galeri / 🎬 video</B> (video opsional, maks. 150 MB).
          </li>
          <li>Pilih nama anak bila perlu — boleh dikosongkan, AI akan mengenali nama dari isi catatan.</li>
          <li>
            <B>Simpan draf</B>. AI otomatis memberi label: anak siapa saja & sub-elemen/TP yang dibuktikan.
          </li>
        </Langkah>
        <DuaGambar>
          <Gambar src="09-harian-catat" judul="Mencatat dengan dikte suara 🎤 + foto kegiatan" />
          <Gambar src="10-harian-draf" judul="Catatan tersimpan sebagai draf, sudah diberi label TP" />
        </DuaGambar>
        <p>
          Punya catatan tulisan tangan? Ketuk <B>📷 Foto catatan</B> → foto halaman catatan → <b>Baca foto jadi catatan</b>. Catatan
          banyak anak dipecah otomatis per anak.
        </p>
        <h3 className="font-bold">B. Ceklis TP hari ini</h3>
        <p>
          Ketuk <b>TP1 / TP2 / …</b> di samping nama anak yang menunjukkan kemampuan itu hari ini (✓). Kosong artinya{" "}
          <i>belum diamati</i>, bukan &quot;belum mampu&quot;.
        </p>
        <Gambar src="12-harian-ceklis" judul="Ceklis TP hari ini" />
        <h3 className="font-bold">C. Review setelah jam kelas</h3>
        <Langkah>
          <li>
            Ketuk <B>🔍 Review … draf satu per satu</B>.
          </li>
          <li>Periksa isi, anak, foto, dan label CP/TP. Hapus label yang tidak tepat (×), tambah lewat <b>+ Tambah label TP</b>.</li>
          <li>
            <B>✓ Simpan</B> → lanjut ke catatan berikutnya. Penilaian CP anak ikut naik otomatis sesuai label.
          </li>
          <li>
            Setelah semua direview, <b>kesesuaian hari ini dengan PPM dinilai otomatis</b>: skor %, kegiatan
            terlaksana/sebagian/belum, TP teramati, dan kegiatan di luar rencana.
          </li>
        </Langkah>
        <DuaGambar>
          <Gambar src="11-harian-review" judul="Review satu per satu: isi, anak, foto, label TP" />
          <Gambar src="13-harian-kesesuaian" judul="Kesesuaian hari ini dengan PPM (otomatis)" />
        </DuaGambar>
        <Kotak judul="Kotak Kelengkapan">
          <p>Menunjukkan TP minggu ini yang belum diamati dan anak yang belum punya catatan minggu ini — pengingat untuk pengamatan besok, bukan nilai.</p>
        </Kotak>
        <Gambar src="13b-kelengkapan" judul="Kotak Kelengkapan" />
      </Bab>

      <Bab id="kirim" no={6} judul="Kirim ke Server">
        <Langkah>
          <li>
            Di bagian bawah tab Harian (atau tab PPM), isi <b>PIN guru</b>. Centang <b>Ingat PIN</b> bila HP pribadi.
          </li>
          <li>
            Ketuk <B>⬆️ Kirim ke Server</B>. Foto/video diunggah ke Google Drive yayasan, lalu data dikirim.
          </li>
          <li>
            Muncul <b>&quot;Terkirim ✓&quot;</b>. Status kartu berubah menjadi <b>✓ terkirim</b>.
          </li>
        </Langkah>
        <ul className="flex list-disc flex-col gap-1 pl-6">
          <li>Hanya catatan yang sudah direview yang ikut terkirim. Draf tetap di perangkat.</li>
          <li>Boleh kirim berkali-kali; data di server selalu diperbarui dengan yang terbaru.</li>
          <li>Disarankan: kirim setiap hari setelah review, dan pastikan terkirim sebelum Jumat malam.</li>
        </ul>
        <Gambar src="15-kirim" judul="Kirim ke Server berhasil" />
      </Bab>

      <Bab id="mingguan" no={7} judul="Jumat siang: Laporan Aktivitas Mingguan">
        <Langkah>
          <li>
            Tab Harian → kartu <b>Laporan Aktivitas Mingguan</b> → <B>🗓️ Susun laporan minggu ini</B> (±1 menit).
          </li>
          <li>
            Baca hasilnya: skor kesesuaian minggu ini, ringkasan, status setiap kegiatan rencana, TP yang teramati pada berapa
            anak, kegiatan di luar rencana, dan <b>saran untuk minggu depan</b>.
          </li>
          <li>
            Kotak <b>Asesmen Awal untuk PPM minggu depan</b> → <B>📋 Salin</B> → tempel ke bagian Asesmen Awal di dokumen PPM
            minggu depan. Saran dari laporan menjadi pijakan perencanaan berikutnya.
          </li>
          <li>Lengkapi PPM minggu depan di Word, lalu unggah (bagian 4) dan Kirim ke Server.</li>
        </Langkah>
        <Gambar src="14-mingguan" judul="Laporan Aktivitas Mingguan + Asesmen Awal siap salin" />
      </Bab>

      <Bab id="nilai" no={8} judul="Penilaian CP">
        <p>
          Tab <b>Penilaian CP</b> menampilkan, per anak, ke-14 sub-elemen CP. Nilainya naik otomatis dari catatan berlabel,
          ceklis, dan PPM — guru cukup memeriksa & melengkapi.
        </p>
        <Langkah>
          <li>Pilih anak (tombol ‹ › untuk pindah cepat).</li>
          <li>
            Buka elemen (1 Nilai Agama & Budi Pekerti, 2 Jati Diri, 3 Literasi-STEAM). Di setiap lingkup, pilih{" "}
            <b>sampai TP mana</b> anak sudah sampai. TP berikutnya otomatis menjadi <i>sedang dikembangkan</i>.
          </li>
          <li>Isi <b>Bukti pengamatan</b> per sub-elemen bila perlu. Label &quot;PPM mg 17 ✓&quot; menunjukkan asal buktinya.</li>
          <li>
            <B>✨ Usulkan penilaian dari … catatan</B> — AI memetakan catatan ke TP; periksa lalu <b>Terapkan</b>.
          </li>
          <li>
            <b>Kokurikuler</b>: isi tema & kegiatan (berlaku sekelas), centang Dimensi Profil Lulusan yang tampak pada anak, isi
            bukti.
          </li>
        </Langkah>
        <p>
          Angka <b>x/14</b> = sub-elemen yang sudah punya bukti sepanjang semester (target 14 di akhir semester), bukan nilai.
        </p>
        <DuaGambar>
          <div className="flex flex-col gap-4">
            <Gambar src="16-nilai-ringkas" judul="Ringkasan bukti CP per anak" />
            <Gambar src="18-nilai-usulan" judul="Usulan penilaian dari catatan (AI)" />
          </div>
          <Gambar src="17-nilai-subelemen" judul="Sub-elemen 2.3: pilih sampai TP mana" />
        </DuaGambar>
      </Bab>

      <Bab id="rapor" no={9} judul="Menyusun & mencetak rapor">
        <Langkah>
          <li>
            Tab <b>Rapor</b> → pilih anak di <b>Rekap Kelas</b> → <B>✨ Susun narasi dari penilaian CP</B> (±30–60 detik), atau{" "}
            <B>✨ Narasi semua yang belum</B> untuk sekelas.
          </li>
          <li>
            Baca & <b>sunting</b> narasi setiap elemen, kokurikuler, dan refleksi untuk orang tua. Tanda ⚠️ = bukti elemen itu masih
            sedikit.
          </li>
          <li>Isi tinggi, berat, lingkar kepala, dan kehadiran (sakit, izin, tanpa keterangan).</li>
          <li>
            <B>🖨️ Cetak / simpan PDF</B> (per anak) atau <B>🖨️ Cetak semua</B>. Pilih kertas A4 → printer atau &quot;Simpan sebagai
            PDF&quot;.
          </li>
        </Langkah>
        <p>
          Isi rapor: identitas, A. Capaian Pembelajaran (3 elemen), B. Kokurikuler, C. Pertumbuhan, D. Kehadiran, E. Refleksi Guru,
          F. Tanggapan Orang Tua, tanda tangan, dan (opsional) Lampiran capaian TP per sub-elemen.
        </p>
        <DuaGambar>
          <Gambar src="19-rapor-rekap" judul="Rekap kelas & tombol cetak" />
          <Gambar src="20-rapor-narasi" judul="Narasi rapor per anak (bisa disunting)" />
        </DuaGambar>
      </Bab>

      <Bab id="kejar" no={10} judul="Mengejar rapor semester ini (PPM berisi asesmen)">
        <p>
          Untuk minggu-minggu yang sudah lewat, unggah PPM yang <b>sudah berisi asesmen</b> (ceklis ☑/☐ per anak, catatan anekdot,
          hasil karya). Bisa memilih banyak file sekaligus.
        </p>
        <Langkah>
          <li>Tab PPM → unggah semua file minggu 1 s.d. sekarang.</li>
          <li>
            Periksa tiap file: TP → TP resmi, ceklis tiap anak (ketuk untuk ubah ✓/✗/–), anekdot & hasil karya → anak yang tepat.
            Nama yang belum ada bisa dipilih <b>+ Tambah sebagai murid baru</b>.
          </li>
          <li>
            <B>Simpan PPM</B> → ceklis menjadi bukti Penilaian CP, anekdot masuk ke catatan anak.
          </li>
          <li>Lanjut ke Penilaian CP → Rapor, lalu Kirim ke Server.</li>
        </Langkah>
        <Gambar src="22-ppm-asesmen" judul="Ceklis tiap anak dari PPM berisi asesmen" />
      </Bab>

      <Bab id="pindah" no={11} judul="Pindah perangkat & cadangan">
        <p>Data dikerjakan per perangkat. Untuk pindah HP ↔ laptop:</p>
        <Langkah>
          <li>Di perangkat lama: <B>⬆️ Kirim ke Server</B>.</li>
          <li>
            Di perangkat baru: tab <b>Kelas</b> → <b>Pindah Perangkat</b> → pilih sekolah, guru, isi PIN → <B>⬇️ Cari kelas saya</B> →{" "}
            <B>Ambil</B>.
          </li>
        </Langkah>
        <Kotak tone="penting">
          <p>• Draf yang belum direview dan foto/video yang belum terunggah tidak ikut pindah.</p>
          <p>• Jangan mengisi kelas yang sama di dua perangkat sekaligus. Bila muncul &quot;data di server lebih baru&quot;, batalkan lalu Ambil dulu.</p>
        </Kotak>
        <p>
          <b>Cadangan</b> (tab Kelas): <B>⬇️ Unduh Cadangan</B> menyimpan file data kelas; <B>⬆️ Pulihkan</B> mengembalikannya.
          Unduh cadangan secara berkala, terutama sebelum membersihkan data browser atau ganti HP.
        </p>
        <DuaGambar>
          <Gambar src="23-pindah" judul="Pindah Perangkat: ambil data kelas dari server" />
          <Gambar src="23b-cadangan" judul="Cadangan data" />
        </DuaGambar>
      </Bab>

      <Bab id="tanya" no={12} judul="Bantuan & pertanyaan yang sering muncul">
        <p>
          Bingung atau lupa langkah? Ketuk <B>💬 Bantuan</B> di kanan atas aplikasi. Anda bisa membuka bab Buku Panduan, atau
          mengetik pertanyaan dan langsung mendapat jawaban dari asisten (berdasarkan buku panduan ini).
        </p>
        <DuaGambar>
          <Gambar src="24-bantuan" judul="Panel Bantuan" />
          <Gambar src="25-bantuan-jawab" judul="Contoh tanya-jawab dengan asisten" />
        </DuaGambar>
        <dl className="flex flex-col gap-3">
          {[
            ["Muncul “Kode akses rapor salah atau belum diisi”.", "Isi Kode Akses dari kepala sekolah di tab Kelas → Simpan."],
            ["“PIN salah” / “dikunci 15 menit”.", "Setelah 5x salah, pengiriman dikunci 15 menit. Lupa PIN? Minta kepala sekolah membuat PIN baru di dashboard."],
            ["Tombol 🎤 tidak ada / dikte tidak jalan.", "Butuh internet dan izin mikrofon. Pakai Chrome (Android) atau Safari (iPhone). Alternatif: ikon mikrofon di keyboard HP."],
            ["Foto/video belum terunggah.", "Tetap aman di perangkat. Akan dicoba lagi otomatis pada Kirim ke Server berikutnya."],
            ["Label TP dari AI kurang tepat.", "Ubah saat review: hapus label (×) lalu tambah label yang benar. Guru yang menentukan."],
            ["Data hilang setelah membersihkan browser.", "Ambil lagi lewat Pindah Perangkat (data yang sudah terkirim) atau Pulihkan dari file cadangan."],
            ["PPM tidak terbaca.", "Pastikan format .docx dan isinya teks (bukan foto/scan). Satu file = satu minggu."],
          ].map(([q, a]) => (
            <div key={q} className="blok">
              <dt className="font-semibold">❓ {q}</dt>
              <dd className="pl-6">{a}</dd>
            </div>
          ))}
        </dl>
      </Bab>

      <Bab id="kepsek" no={13} judul="Untuk kepala sekolah & admin">
        <p>
          Buka <b>absensi-ytbm.vercel.app/admin</b> (login seperti biasa) → menu <b>Rapor</b>. Kepala sekolah melihat sekolahnya
          sendiri; admin yayasan melihat semua sekolah.
        </p>
        <h3 className="font-bold">Membuat PIN guru</h3>
        <p>
          Kolom <b>PIN</b> → <B>Buat PIN</B> / <B>Ganti</B> → ketik 4–6 angka → berikan ke guru. Bagikan juga Kode Akses rapor.
        </p>
        <h3 className="font-bold">Membaca Pantauan Rapor</h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-6">
          <li>
            <b>Ringkasan</b>: guru yang mengisi hari ini, guru aktif minggu ini, PPM minggu ini (berapa tepat waktu), PPM minggu
            depan yang sudah masuk.
          </li>
          <li>
            <b>PPM minggu ini / depan</b>: ✓ tepat waktu · ⚠ terlambat · ✗ belum masuk, beserta kekurangannya (mis. &quot;kurang: DPL&quot;).
          </li>
          <li>
            <b>Kalender Sen–Jum</b>: angka = jumlah laporan harian, % = kesesuaian dengan PPM. 🟩 ada laporan · 🟧 PPM berisi asesmen ·
            🟥 tidak ada laporan (hari sudah lewat) · ⬜ izin/belum lewat.
          </li>
          <li>
            <b>Laporan mingguan</b> (%), <b>Bukti CP</b> rata-rata per anak (x/14), dan <b>terakhir kirim</b>.
          </li>
          <li>Tombol ‹ › untuk melihat minggu lain.</li>
        </ul>
        <Gambar src="26-dashboard" judul="Pantauan Rapor (contoh data)" lebar="laptop" />
        <h3 className="font-bold">Detail kelas</h3>
        <p>
          Klik nama kelas: kelengkapan bukti CP setiap anak per elemen, PPM & laporan mingguan per minggu (dengan saran & asesmen
          awal), skor kesesuaian harian, catatan terbaru beserta foto kegiatan, dan pratinjau narasi rapor sebelum dicetak.
        </p>
        <Gambar src="27-detail-kelas" judul="Detail kelas (contoh data)" lebar="laptop" />
        <Kotak judul="Data tampil setelah guru menekan Kirim ke Server">
          <p>Bila guru terlihat merah padahal sudah mengisi, kemungkinan belum mengirim. Ingatkan untuk menekan Kirim ke Server.</p>
        </Kotak>
      </Bab>

      <footer className="border-t border-border pt-4 text-center text-xs text-muted">
        Yayasan Tunas Bangsa Mandiri · Buku Panduan Rapor Anak · Kebijakan privasi: absensi-ytbm.vercel.app/privasi
      </footer>
    </main>
    </div>
  );
}
