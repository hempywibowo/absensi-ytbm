import { ELEMEN, KELOMPOK, tanggalIndo } from "@/lib/rapor-client";

// Satu lembar rapor (A4) untuk dicetak / disimpan sebagai PDF. Warna hitam-putih biar hemat tinta.
export default function LembarRapor({ anak, kelas, rapor }) {
  const kelompok = KELOMPOK.find((g) => g.id === kelas.kelompok)?.label || kelas.kelompok;
  const paragraf = (t) =>
    (t || "")
      .split(/\n+/)
      .filter((p) => p.trim())
      .map((p, i) => (
        <p key={i} className="mb-1.5 text-justify indent-6">
          {p}
        </p>
      ));
  const angka = (v, sat) => (String(v ?? "").trim() ? `${v} ${sat}` : "-");

  return (
    <section className="lembar-rapor bg-white text-[11pt] leading-snug text-black">
      <style>{`
        @page { size: A4; margin: 15mm 16mm; }
        .lembar-rapor { break-after: page; }
        .lembar-rapor:last-child { break-after: auto; }
        .lembar-rapor .blok { break-inside: avoid; }
      `}</style>

      <header className="mb-3 border-b-[3px] border-double border-black pb-2 text-center">
        <p className="text-[10pt] font-semibold uppercase tracking-wide">Yayasan Tunas Bangsa Mandiri</p>
        <p className="text-[15pt] font-bold uppercase">{kelas.sekolahNama || "Nama Sekolah"}</p>
        {kelas.sekolahAlamat && <p className="text-[9pt]">{kelas.sekolahAlamat}</p>}
      </header>

      <h1 className="mb-3 text-center text-[12.5pt] font-bold uppercase">
        Laporan Hasil Belajar Peserta Didik
        <br />
        <span className="text-[10.5pt] font-semibold normal-case">
          Semester {kelas.semester} · Tahun Ajaran {kelas.ta}
        </span>
      </h1>

      <table className="mb-4 w-full text-[10.5pt]">
        <tbody>
          {[
            ["Nama Peserta Didik", anak.nama, "Kelas", kelas.namaKelas || "-"],
            ["Nama Panggilan", anak.panggilan || "-", "Kelompok", kelompok || "-"],
            ["NISN", anak.nisn || "-", "Jenis Kelamin", anak.jk === "L" ? "Laki-laki" : anak.jk === "P" ? "Perempuan" : "-"],
          ].map((row, i) => (
            <tr key={i}>
              <td className="w-[22%] py-0.5 align-top">{row[0]}</td>
              <td className="w-[33%] py-0.5 align-top">: {row[1]}</td>
              <td className="w-[17%] py-0.5 align-top">{row[2]}</td>
              <td className="py-0.5 align-top">: {row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mb-1 font-bold uppercase">A. Capaian Pembelajaran</p>
      {ELEMEN.map((e, i) => (
        <div key={e.id} className="blok mb-3 border border-black">
          <p className="border-b border-black bg-neutral-100 px-2 py-1 font-bold">
            {i + 1}. {e.judul}
          </p>
          <div className="px-3 py-2">{paragraf(rapor[e.id]) }</div>
        </div>
      ))}

      <div className="blok mb-3 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 font-bold uppercase">B. Pertumbuhan</p>
          <table className="w-full border-collapse text-[10.5pt]">
            <tbody>
              {[
                ["Tinggi badan", angka(rapor.tb, "cm")],
                ["Berat badan", angka(rapor.bb, "kg")],
                ["Lingkar kepala", angka(rapor.lk, "cm")],
              ].map(([a, b]) => (
                <tr key={a}>
                  <td className="border border-black px-2 py-1">{a}</td>
                  <td className="border border-black px-2 py-1 text-center">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="mb-1 font-bold uppercase">C. Kehadiran</p>
          <table className="w-full border-collapse text-[10.5pt]">
            <tbody>
              {[
                ["Sakit", angka(rapor.sakit, "hari")],
                ["Izin", angka(rapor.izin, "hari")],
                ["Tanpa keterangan", angka(rapor.alfa, "hari")],
              ].map(([a, b]) => (
                <tr key={a}>
                  <td className="border border-black px-2 py-1">{a}</td>
                  <td className="border border-black px-2 py-1 text-center">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rapor.saran && (
        <div className="blok mb-4">
          <p className="mb-1 font-bold uppercase">D. Saran untuk Orang Tua</p>
          <div className="border border-black px-3 py-2">{paragraf(rapor.saran)}</div>
        </div>
      )}

      <div className="blok mt-6 text-[10.5pt]">
        <p className="mb-1 text-right">
          {kelas.tempat || "........"}, {tanggalIndo(kelas.tanggalRapor) || "...................."}
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            ["", "Orang Tua/Wali", ""],
            ["Mengetahui,", "Kepala Sekolah", kelas.kepsek],
            ["", "Guru Kelas", kelas.guru],
          ].map(([atas, jabatan, nama]) => (
            <div key={jabatan}>
              <p>{atas || " "}</p>
              <p>{jabatan}</p>
              <div className="h-16" />
              <p className={nama ? "font-semibold underline" : ""}>{nama || "(...............................)"}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
