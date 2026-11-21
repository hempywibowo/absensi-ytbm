// Capaian Pembelajaran (CP) Fase Fondasi PAUD dan Alur Tujuan Pembelajaran (ATP).
//
// Sumber:
// - Narasi sub-elemen: Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 (dicocokkan dengan
//   naskah SK). Rumusan ini TIDAK boleh diubah.
// - Lingkup & TP: Panduan Capaian Pembelajaran Fase Fondasi Edisi Revisi 2025 (Tabel 1-3,
//   hlm. 61-79), sesuai dokumen referensi yang diberikan yayasan. Urutan TP di tiap lingkup adalah
//   urutan ATP-nya (dari sederhana ke kompleks).
//
// Dipakai di browser (form penilaian) dan di server (penyusunan narasi), jadi file ini tidak boleh
// mengimpor apa pun yang khusus server/klien.

export const CP = [
  {
    id: "agama",
    no: 1,
    nama: "Nilai Agama dan Budi Pekerti",
    sub: [
      {
        id: "1.1",
        cp: "Murid percaya kepada Tuhan Yang Maha Esa sebagai pencipta dirinya, makhluk lain dan alam, serta mulai mengenal dan mempraktikkan ajaran pokok sesuai dengan agama dan kepercayaannya",
        lingkup: [
          {
            id: "1.1A",
            nama: "Mengenal ajaran agama/kepercayaan yang dianut",
            tp: [
              "Murid mengenal nama Tuhannya sesuai dengan agama yang dianutnya",
              "Murid mengenal simbol yang berkaitan dengan agama yang dianut",
              "Murid menerapkan nilai-nilai ajaran agama dalam kehidupan sehari-hari",
            ],
          },
          {
            id: "1.1B",
            nama: "Mempraktikkan ajaran pokok sesuai agama/kepercayaan",
            tp: [
              "Murid meniru praktik ibadah sederhana sesuai agama/kepercayaannya",
              "Murid mempraktikkan kegiatan ibadah sesuai agama/kepercayaannya",
            ],
          },
        ],
      },
      {
        id: "1.2",
        cp: "Murid menghargai diri sendiri dan memiliki rasa syukur terhadap Tuhan YME sehingga dapat berpartisipasi aktif dalam menjaga kebersihan, kesehatan, dan keselamatan dirinya",
        lingkup: [
          {
            id: "1.2A",
            nama: "Kebersihan diri",
            tp: [
              "Murid mengenali kondisi tubuhnya saat bersih dan kotor",
              "Murid menjelaskan cara melakukan kegiatan bina diri",
              "Murid menerapkan kegiatan bina diri",
            ],
          },
          {
            id: "1.2B",
            nama: "Kesehatan diri",
            tp: [
              "Murid mengenali ciri-ciri tubuh yang sehat",
              "Murid menjelaskan cara merawat kesehatan diri",
              "Murid dapat menerapkan cara menjaga kesehatan diri",
            ],
          },
          {
            id: "1.2C",
            nama: "Keselamatan diri",
            tp: [
              "Murid mengenali hal-hal yang dapat mengancam keselamatan diri",
              "Murid menerapkan tindakan yang mendukung keselamatan diri",
              "Murid merefleksi pentingnya menjaga keselamatan dirinya sebagai bentuk rasa syukur kepada Tuhan Yang Maha Esa",
            ],
          },
        ],
      },
      {
        id: "1.3",
        cp: "Murid menghargai sesama manusia dengan berbagai perbedaannya sehingga mempraktikkan perilaku baik dan berakhlak mulia",
        lingkup: [
          {
            id: "1.3A",
            nama: "Menghargai sesama manusia",
            tp: [
              "Murid mengenali persamaan dan perbedaan ciri fisik dengan orang lain",
              "Murid mengidentifikasi persamaan dan perbedaan ciri non fisik antara diri dengan orang lain",
              "Murid mulai bisa menerima perbedaan dirinya dan orang lain",
              "Murid merefleksi perbedaan sesama manusia agar dapat saling menghargai",
            ],
          },
          {
            id: "1.3B",
            nama: "Perilaku akhlak mulia dalam kehidupan sehari-hari",
            tp: [
              "Murid meniru perilaku akhlak mulia",
              "Murid menjelaskan perilaku akhlak mulia",
              "Murid mempraktikkan perilaku akhlak mulia",
            ],
          },
        ],
      },
      {
        id: "1.4",
        cp: "Murid menghargai alam dan seluruh makhluk hidup ciptaan Tuhan Yang Maha Esa",
        lingkup: [
          {
            id: "1.4A",
            nama: "Menghargai alam dan makhluk hidup",
            tp: [
              "Murid mengenal alam dan makhluk hidup di sekitarnya",
              "Murid menjelaskan cara menjaga alam dan merawat seluruh makhluk ciptaan Tuhan",
              "Murid menerapkan cara menjaga alam dan merawat seluruh makhluk ciptaan Tuhan",
              "Murid merefleksi dampak dari kerusakan alam dan cara mencegahnya dan merawat seluruh makhluk ciptaan Tuhan",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "jati_diri",
    no: 2,
    nama: "Jati Diri",
    sub: [
      {
        id: "2.1",
        cp: "Murid mengenali identitas dirinya yang terbentuk oleh karakteristik fisik dan gender, minat, kebutuhan, agama, dan sosial budaya",
        lingkup: [
          {
            id: "2.1A",
            nama: "Mengenali identitas dirinya",
            tp: ["Murid mengenal ciri fisik diri", "Murid menyebutkan informasi tentang dirinya"],
          },
          {
            id: "2.1B",
            nama: "Mengenal minat dan kebutuhan dirinya",
            tp: [
              "Murid menunjukkan ketertarikan terhadap kesukaannya",
              "Murid mampu menyebutkan kesukaan dan/atau kebutuhannya",
              "Murid mampu menghubungkan minat dan kebutuhannya dengan lingkungan dan orang lain",
              "Murid merefleksikan minat dan kebutuhannya untuk memilih serta mengambil keputusan sederhana",
            ],
          },
        ],
      },
      {
        id: "2.2",
        cp: "Murid mengenali kebiasaan-kebiasaan di lingkungan keluarga, satuan pendidikan, dan masyarakat",
        lingkup: [
          {
            id: "2.2A",
            nama: "Kebiasaan di keluarga, sekolah, dan masyarakat",
            tp: [
              "Murid mengenali rutinitas di keluarga",
              "Murid menjelaskan kebiasaan di lingkungan sekitarnya",
              "Murid membedakan kebiasaan di lingkungan yang berbeda",
              "Murid menghubungkan kebiasaan di keluarga dan nilai-nilai sosial di masyarakat",
            ],
          },
        ],
      },
      {
        id: "2.3",
        cp: "Murid mengenali, mengekspresikan, dan mengelola emosi diri, serta membangun hubungan sosial secara sehat",
        lingkup: [
          {
            id: "2.3A",
            nama: "Mengenal berbagai ragam emosi",
            tp: [
              "Murid mengenali beragam emosi dasar",
              "Murid membedakan ciri dari ragam emosi dasar",
              "Murid menjelaskan sebab-akibat emosi yang dirasakan",
            ],
          },
          {
            id: "2.3B",
            nama: "Mengekspresikan emosi",
            tp: [
              "Murid mengekspresikan emosi dengan berbagai cara",
              "Murid menyampaikan secara verbal emosi yang dirasakan",
              "Murid merefleksikan emosi yang ia rasakan dengan ekspresi dan respon tubuhnya",
            ],
          },
          {
            id: "2.3C",
            nama: "Mengelola emosi",
            tp: [
              "Murid memilih strategi sederhana untuk mengelola emosi",
              "Murid menerapkan strategi regulasi emosi untuk memecahkan masalah",
            ],
          },
          {
            id: "2.3D",
            nama: "Membangun hubungan sosial secara sehat",
            tp: [
              "Murid melakukan interaksi sosial secara sederhana",
              "Murid menerima ajakan dan beraktivitas bersama teman",
              "Murid berkolaborasi dan berkomunikasi dalam melakukan aktivitas",
              "Murid merefleksi pentingnya beraktivitas bersama dengan teman",
            ],
          },
        ],
      },
      {
        id: "2.4",
        cp: "Murid mengenali perannya sebagai bagian dari keluarga, satuan pendidikan, masyarakat dan warga negara Indonesia sehingga dapat menyesuaikan diri dengan lingkungan, aturan dan norma yang berlaku, dan mengetahui keberadaan negara lain di dunia",
        lingkup: [
          {
            id: "2.4A",
            nama: "Perannya di keluarga, sekolah, dan masyarakat",
            tp: [
              "Murid mengenali dirinya bagian dari keluarga",
              "Murid mengenal perannya di keluarga, sekolah, dan masyarakat",
              "Murid merefleksikan perannya di keluarga, sekolah, dan masyarakat",
            ],
          },
          {
            id: "2.4A2",
            nama: "Aturan dan norma",
            tp: [
              "Murid membedakan aturan dan norma yang berlaku di keluarga, sekolah, dan masyarakat",
              "Murid menerapkan aturan dan norma yang berlaku di keluarga, sekolah, dan masyarakat",
            ],
          },
          {
            id: "2.4B",
            nama: "Warga negara Indonesia dan keberadaan negara lain",
            tp: [
              "Murid mengenal simbol-simbol negara",
              "Murid mengidentifikasi identitas negara",
              "Murid mengetahui adanya negara lain di dunia",
              "Murid merefleksi bahwa dirinya bagian dari warga dunia",
            ],
          },
        ],
      },
      {
        id: "2.5",
        cp: "Murid memiliki fungsi gerak (motorik kasar, halus, dan taktil) untuk merawat dirinya, membangun kemandirian dan berkegiatan",
        lingkup: [
          {
            id: "2.5A",
            nama: "Motorik kasar",
            tp: [
              "Murid mulai menunjukkan minat untuk bergerak bebas",
              "Murid melakukan gerakan motorik kasar",
              "Murid melakukan gerakan motorik kasar dengan melibatkan keseimbangan dan kekuatan koordinasi",
            ],
          },
          {
            id: "2.5B",
            nama: "Motorik halus",
            tp: [
              "Murid menunjukkan minat untuk menggerakan jari dan pergelangan tangan",
              "Murid melakukan gerakan motorik halus (koordinasi mata dan tangan)",
              "Murid mengontrol dan mengoordinasikan gerakan motorik halus",
            ],
          },
          {
            id: "2.5C",
            nama: "Taktil",
            tp: [
              "Murid mengenali berbagai jenis tekstur",
              "Murid membedakan reaksi taktil terhadap aktivitas dan lingkungan",
              "Murid merespon taktil sesuai dengan konteks aktivitas dan lingkungan",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "literasi",
    no: 3,
    nama: "Dasar-dasar Literasi, Matematika, Sains, Teknologi, Rekayasa, dan Seni",
    sub: [
      {
        id: "3.1",
        cp: "Murid mengenali dan memahami berbagai informasi, mengomunikasikan perasaan dan pikiran secara lisan, tulisan, atau menggunakan berbagai media serta membangun percakapan, menunjukkan minat, dan berpartisipasi dalam kegiatan pramembaca",
        lingkup: [
          {
            id: "3.1A",
            nama: "Mengenali, menyimak, dan memahami informasi",
            tp: [
              "Murid mengenali informasi yang disampaikan kepada dirinya",
              "Murid menyimak informasi yang disampaikan kepada dirinya",
              "Murid memahami berbagai informasi yang disampaikan",
            ],
          },
          {
            id: "3.1B",
            nama: "Mengomunikasikan perasaan dan pikiran",
            tp: [
              "Murid menyebutkan perasaan dan pikirannya dengan gestur",
              "Murid menyampaikan perasaan dan pikirannya menggunakan kata maupun frasa sederhana",
              "Murid menjelaskan perasaan dan pikirannya secara lisan dengan menyertakan alasan",
            ],
          },
          {
            id: "3.1C",
            nama: "Membangun percakapan",
            tp: [
              "Murid merespon pertanyaan atau pernyataan secara singkat",
              "Murid merespon pertanyaan atau pernyataan sesuai dengan pikiran dan perasaan",
              "Murid mengomunikasikan pikiran dan perasaan dengan komunikasi dua arah",
            ],
          },
          {
            id: "3.1D",
            nama: "Minat terhadap teks",
            tp: [
              "Murid menunjukkan ketertarikan terhadap gambar",
              "Murid menunjukkan ketertarikan terhadap teks",
              "Murid menunjukkan ketertarikan terhadap teks dengan berbagai cara",
            ],
          },
          {
            id: "3.1E",
            nama: "Kemampuan membaca",
            tp: [
              "Murid mengenal bahwa simbol memiliki makna",
              "Murid mengenal huruf memiliki makna",
              "Murid mengenal bunyi huruf (fonetik) dan atau mulai merangkai beberapa bunyi huruf",
              "Murid memahami makna dari kata sederhana",
            ],
          },
          {
            id: "3.1F",
            nama: "Kemampuan dasar untuk menulis",
            tp: [
              "Murid membuat coretan yang bermakna",
              "Murid meniru bentuk/simbol",
              "Murid membuat rangkaian kata sederhana",
              "Murid menulis kata menjadi kalimat",
              "Murid menulis kata menjadi kalimat yang bermakna",
            ],
          },
        ],
      },
      {
        id: "3.2",
        cp: "Murid memiliki kepekaan bilangan; mengidentifikasi pola; memiliki kesadaran tentang bentuk, posisi, dan ruang; menyadari adanya persamaan dan perbedaan karakteristik antar objek; mampu melakukan pengukuran dengan satuan tidak baku; dan memiliki kesadaran mengenai waktu",
        lingkup: [
          {
            id: "3.2A",
            nama: "Kepekaan bilangan",
            tp: [
              "Murid menyebutkan bilangan secara berurutan (membilang/rote counting)",
              "Murid membandingkan jumlah (banyak-sedikit) benda yang ada di sekitarnya tanpa membilang (subitasi)",
              "Murid menunjukkan pemahaman korespondensi satu ke satu menggunakan benda konkret",
              "Murid memahami bilangan terakhir yang disebut menunjukkan jumlah benda yang dihitung",
              "Murid memahami representasi bilangan dalam simbol yang berbeda (termasuk simbol angka)",
            ],
          },
          {
            id: "3.2B",
            nama: "Operasi hitung",
            tp: [
              "Murid memahami penjumlahan sebagai menggabungkan dan pengurangan sebagai memisahkan",
              "Murid mulai melakukan penjumlahan atau pengurangan sederhana menggunakan alat bantu konkret",
              "Murid melakukan penjumlahan atau pengurangan sederhana menggunakan alat bantu visual",
            ],
          },
          {
            id: "3.2C",
            nama: "Bentuk",
            tp: [
              "Murid mengenali bentuk geometri sederhana dua dimensi (segitiga, lingkaran, dan persegi) dan tiga dimensi (kubus, bola, dan tabung) yang dilihat",
              "Murid membandingkan persamaan dan perbedaan dari bentuk geometri sederhana secara visual",
              "Murid membandingkan bentuk bangun dua dimensi (segitiga, lingkaran, persegi) dan bangun tiga dimensi (kubus, bola, limas) yang dilihat",
              "Murid menggabungkan dan mengurai bentuk geometri menjadi bentuk baru (tidak harus menjadi bentuk yang memiliki nama khusus)",
            ],
          },
          {
            id: "3.2D",
            nama: "Kesadaran ruang dan lokasi",
            tp: [
              "Murid mengenali posisi dasar: atas, bawah, depan, belakang",
              "Murid mengenali istilah posisi dan arah: samping, dalam, luar",
              "Murid memahami perintah lokasi yang lebih kompleks",
            ],
          },
          {
            id: "3.2E",
            nama: "Pengukuran",
            tp: [
              "Murid mengenal beberapa atribut pengukuran: panjang, besar, dan banyak",
              "Murid membandingkan atribut dua benda secara langsung dan tidak langsung",
              "Murid melakukan pengukuran dengan menggunakan satuan tidak baku untuk membandingkan atribut benda",
              "Murid menggunakan bilangan untuk menyatakan ukuran atribut benda dengan satuan tidak baku",
            ],
          },
          {
            id: "3.2E2",
            nama: "Pengenalan uang",
            tp: [
              "Murid mengenal bentuk uang",
              "Murid mengenal simbol yang melambangkan uang",
              "Murid mengenal fungsi uang, barang, dan kebutuhan",
              "Murid mengenal nilai uang",
            ],
          },
          {
            id: "3.2F",
            nama: "Waktu",
            tp: [
              "Murid mengenal konsep pagi, siang, dan malam hari",
              "Murid mengenal urutan kejadian",
              "Murid membandingkan banyaknya aktivitas yang dapat dilakukan dalam satu waktu",
              "Murid mengenal istilah satuan waktu baku",
            ],
          },
          {
            id: "3.2G",
            nama: "Pola",
            tp: [
              "Murid mengenali pola berulang sederhana (warna, bentuk, suara, gerakan)",
              "Murid melanjutkan dua pola sederhana secara konsisten",
              "Murid mengembangkan pola secara mandiri",
              "Murid mengenali pola bilangan",
            ],
          },
          {
            id: "3.2H",
            nama: "Analisis data",
            tp: [
              "Murid mengenal setiap objek/benda memiliki sejumlah atribut",
              "Murid menyortir objek/benda berdasarkan atribut tertentu",
              "Murid mengelompokkan sejumlah objek/benda menggunakan atribut yang sama",
              "Murid menyimpulkan atribut benda dari sejumlah data",
            ],
          },
        ],
      },
      {
        id: "3.3",
        cp: "Murid mampu mengamati, menyebutkan alasan, pilihan atau keputusannya, mampu memecahkan masalah sederhana, serta mengetahui hubungan sebab akibat dari suatu kondisi atau situasi yang dipengaruhi oleh hukum alam dan kondisi sosial",
        lingkup: [
          {
            id: "3.3A",
            nama: "Hubungan sebab-akibat dan pengambilan keputusan",
            tp: [
              "Murid mengenal hubungan sebab-akibat",
              "Murid menyampaikan alasan/dampak dari suatu peristiwa",
              "Murid mengambil keputusan untuk menyelesaikan masalah sederhana terkait peristiwa",
              "Murid mengomunikasikan alasan dari pengambilan keputusan dan solusi dari suatu peristiwa",
            ],
          },
          {
            id: "3.3B",
            nama: "Rasa ingin tahu dan eksplorasi",
            tp: [
              "Murid menunjukkan rasa ingin tahu tentang objek dan/atau peristiwa",
              "Murid menyampaikan rasa ingin tahu akan objek dan/atau peristiwa dengan berbagai cara",
              "Murid terlibat dalam kegiatan eksplorasi, eksperimen, atau penelitian tentang objek dan/atau peristiwa",
            ],
          },
        ],
      },
      {
        id: "3.4",
        cp: "Murid menunjukkan kemampuan awal menggunakan dan merekayasa teknologi serta untuk mencari informasi, gagasan, dan keterampilan secara aman dan bertanggung jawab",
        lingkup: [
          {
            id: "3.4A",
            nama: "Kemampuan awal menggunakan teknologi sederhana",
            tp: [
              "Murid memahami fungsi alat sederhana",
              "Murid menggunakan alat sederhana untuk berbagai aktivitas",
              "Murid memahami fungsi alat untuk memudahkan aktivitas dalam kehidupan sehari-hari",
              "Murid merekayasa teknologi dengan cara-cara kreatif",
            ],
          },
          {
            id: "3.4B",
            nama: "Kemampuan awal merekayasa teknologi",
            tp: [
              "Murid mencoba menggunakan beberapa alat untuk memecahkan masalah sederhana",
              "Murid menggunakan alat dan bahan yang tersedia di sekitarnya untuk memecahkan masalah sederhana",
              "Murid merancang strategi pemecahan masalah dengan merekayasa teknologi",
            ],
          },
        ],
      },
      {
        id: "3.5",
        cp: "Murid mengeksplorasi berbagai proses seni, mengekspresikannya, serta mengapresiasi karya seni",
        lingkup: [
          {
            id: "3.5A",
            nama: "Eksplorasi, ekspresi, dan apresiasi seni",
            tp: [
              "Murid mengeksplorasi berbagai media seni (visual, musik, tari, drama dan digital)",
              "Murid mengungkapkan pikiran dan perasaannya melalui berbagai media seni (visual, musik, tari, drama, dan digital)",
              "Murid mengekspresikan seni melalui pikiran dan perasaannya melalui berbagai karya seni",
              "Murid menghargai berbagai karya seni baik yang dibuat oleh dirinya maupun orang lain",
            ],
          },
        ],
      },
    ],
  },
];

// Delapan Dimensi Profil Lulusan, dipakai untuk penilaian kokurikuler.
export const DIMENSI = [
  "Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa",
  "Kewargaan",
  "Penalaran Kritis",
  "Kreativitas",
  "Kolaborasi",
  "Kemandirian",
  "Kesehatan",
  "Komunikasi",
];

export const SEMUA_SUB = CP.flatMap((e) => e.sub.map((s) => ({ ...s, elemen: e.id })));
export const SEMUA_LINGKUP = SEMUA_SUB.flatMap((s) => s.lingkup.map((l) => ({ ...l, sub: s.id, elemen: s.elemen })));
export const LINGKUP_BY_ID = Object.fromEntries(SEMUA_LINGKUP.map((l) => [l.id, l]));

// Nilai penilaian per lingkup:
//   undefined/null = belum dinilai
//   0              = belum muncul (anak belum mencapai TP pertama)
//   n (1..tp.length) = anak sudah mencapai TP ke-n pada ATP lingkup tsb.
// TP berikutnya (n+1) otomatis dianggap "kemampuan yang sedang dikembangkan".
export function capaianLingkup(lingkup, nilai) {
  if (nilai === undefined || nilai === null || nilai === "") return null;
  const n = Number(nilai);
  return {
    tercapai: n > 0 ? lingkup.tp[n - 1] : "",
    berikutnya: n < lingkup.tp.length ? lingkup.tp[n] : "",
    tuntas: n >= lingkup.tp.length,
  };
}

// Sub-elemen dianggap terisi bila minimal satu lingkupnya sudah dinilai.
export function subTerisi(sub, nilaiAnak) {
  return sub.lingkup.some((l) => nilaiAnak?.[l.id] !== undefined && nilaiAnak?.[l.id] !== null && nilaiAnak?.[l.id] !== "");
}
