import { CP, DIMENSI, capaianLingkup } from "@/lib/rapor-cp";
import { KELOMPOK, tanggalIndo } from "@/lib/rapor-client";

// Lembar rapor (A4) untuk dicetak / disimpan PDF. Hitam-putih biar hemat tinta.
export default function LembarRapor({ anak, kelas, rapor, nilai, koku }) {
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
  const ttl = [anak.tempatLahir, tanggalIndo(anak.tanggalLahir)].filter(Boolean).join(", ") || "-";
  const dimensi = (koku?.dimensi || []).map((i) => DIMENSI[i]).filter(Boolean);
  const ortu = [anak.ayah && `${anak.ayah} (ayah)`, anak.ibu && `${anak.ibu} (ibu)`].filter(Boolean).join(", ") || "-";
  const nomor = (s) => (s?.trim() ? s : " ");

  return (
    <section className="lembar-rapor bg-white text-[10.5pt] leading-snug text-black">
      <style>{`
        @page { size: A4; margin: 14mm 15mm; }
        .lembar-rapor { break-after: page; }
        .lembar-rapor:last-child { break-after: auto; }
        .lembar-rapor .blok { break-inside: avoid; }
        .lembar-rapor .halaman-baru { break-before: page; }
      `}</style>

      <header className="mb-3 border-b-[3px] border-double border-black pb-2 text-center">
        <p className="text-[10pt] font-semibold uppercase tracking-wide">Yayasan Tunas Bangsa Mandiri</p>
        <p className="text-[15pt] font-bold uppercase">{kelas.sekolahNama || "Nama Sekolah"}</p>
        {kelas.sekolahAlamat && <p className="text-[9pt]">{kelas.sekolahAlamat}</p>}
        {kelas.npsn && <p className="text-[9pt]">NPSN: {kelas.npsn}</p>}
      </header>

      <h1 className="mb-3 text-center text-[12.5pt] font-bold uppercase">
        Laporan Hasil Belajar Murid
        <br />
        <span className="text-[10.5pt] font-semibold normal-case">
          Fase Fondasi · Semester {kelas.semester} · Tahun Ajaran {kelas.ta}
        </span>
      </h1>

      <table className="mb-4 w-full text-[10pt]">
        <tbody>
          {[
            ["Nama Murid", anak.nama, "Kelas", kelas.namaKelas || "-"],
            ["Nama Panggilan", anak.panggilan || "-", "Kelompok", kelompok || "-"],
            ["NIS / NISN", [anak.nis, anak.nisn].filter(Boolean).join(" / ") || "-", "Jenis Kelamin", anak.jk === "L" ? "Laki-laki" : anak.jk === "P" ? "Perempuan" : "-"],
            ["Tempat, Tgl Lahir", ttl, "Agama", anak.agama || "-"],
            ["Orang Tua", ortu, "Guru Kelas", kelas.guru || "-"],
          ].map((row, i) => (
            <tr key={i}>
              <td className="w-[19%] py-0.5 align-top">{row[0]}</td>
              <td className="w-[36%] py-0.5 align-top">: {row[1]}</td>
              <td className="w-[15%] py-0.5 align-top">{row[2]}</td>
              <td className="py-0.5 align-top">: {row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mb-1 font-bold uppercase">A. Capaian Pembelajaran</p>
      {CP.map((e) => (
        <div key={e.id} className="mb-3 border border-black">
          <p className="border-b border-black bg-neutral-100 px-2 py-1 font-bold">
            {e.no}. {e.nama}
          </p>
          <div className="px-3 py-2">{paragraf(rapor[e.id])}</div>
        </div>
      ))}

      {(rapor.kokurikuler || koku?.tema) && (
        <div className="blok mb-3">
          <p className="mb-1 font-bold uppercase">B. Kokurikuler</p>
          <div className="border border-black px-3 py-2">
            {koku?.tema && (
              <p className="mb-1">
                <b>Tema:</b> {koku.tema}
                {dimensi.length > 0 && (
                  <>
                    {" "}
                    · <b>Dimensi Profil Lulusan:</b> {dimensi.join(", ")}
                  </>
                )}
              </p>
            )}
            {paragraf(rapor.kokurikuler)}
          </div>
        </div>
      )}

      <div className="blok mb-3 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 font-bold uppercase">C. Pertumbuhan</p>
          <table className="w-full border-collapse text-[10pt]">
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
          <p className="mb-1 font-bold uppercase">D. Kehadiran</p>
          <table className="w-full border-collapse text-[10pt]">
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
        <div className="blok mb-3">
          <p className="mb-1 font-bold uppercase">E. Refleksi Guru untuk Orang Tua</p>
          <div className="border border-black px-3 py-2">{paragraf(rapor.saran)}</div>
        </div>
      )}

      {/* Tanggapan orang tua + tanda tangan selalu satu halaman */}
      <div className="blok">
      <div className="mb-3">
        <p className="mb-1 font-bold uppercase">F. Tanggapan Orang Tua/Wali</p>
        <div className="h-16 border border-black" />
      </div>

      <div className="mt-4 text-[10pt]">
        <p className="mb-1 text-right">
          {kelas.tempat || "........"}, {tanggalIndo(kelas.tanggalRapor) || "...................."}
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            ["", "Orang Tua/Wali", "", ""],
            ["Mengetahui,", "Kepala Sekolah", kelas.kepsek, kelas.nipKepsek],
            ["", "Guru Kelas", kelas.guru, kelas.nipGuru],
          ].map(([atas, jabatan, nama, nip]) => (
            <div key={jabatan}>
              <p>{atas || " "}</p>
              <p>{jabatan}</p>
              <div className="h-14" />
              <p className={nama ? "font-semibold underline" : ""}>{nama || "(...............................)"}</p>
              <p className="text-[9pt]">{nip ? `NIP/NUPTK ${nip}` : nomor("")}</p>
            </div>
          ))}
        </div>
      </div>
      </div>

      {kelas.lampiranTP && (
        <div className="halaman-baru">
          <p className="mb-1 font-bold uppercase">Lampiran · Capaian Tujuan Pembelajaran</p>
          <p className="mb-2 text-[9pt]">
            {anak.nama} · Semester {kelas.semester} · Mengacu CP Fase Fondasi (SK BSKAP 046/H/KR/2025)
          </p>
          <table className="w-full border-collapse text-[8.5pt]">
            <thead>
              <tr className="bg-neutral-100">
                <th className="w-[9%] border border-black px-1 py-1">Sub-elemen</th>
                <th className="w-[22%] border border-black px-1 py-1">Lingkup</th>
                <th className="border border-black px-1 py-1">Sudah dicapai</th>
                <th className="border border-black px-1 py-1">Sedang dikembangkan</th>
              </tr>
            </thead>
            <tbody>
              {CP.flatMap((e) =>
                e.sub.flatMap((s) =>
                  s.lingkup.map((l, i) => {
                    const c = capaianLingkup(l, nilai?.[l.id]);
                    return (
                      <tr key={l.id} className="blok">
                        {i === 0 && (
                          <td rowSpan={s.lingkup.length} className="border border-black px-1 py-0.5 text-center align-top font-semibold">
                            {s.id}
                          </td>
                        )}
                        <td className="border border-black px-1 py-0.5 align-top">{l.nama}</td>
                        <td className="border border-black px-1 py-0.5 align-top">
                          {!c ? "Belum dinilai" : c.tercapai ? c.tercapai.replace(/^Murid /, "") : "Belum muncul"}
                        </td>
                        <td className="border border-black px-1 py-0.5 align-top">
                          {!c ? "-" : c.tuntas ? "Tuntas" : c.berikutnya.replace(/^Murid /, "")}
                        </td>
                      </tr>
                    );
                  }),
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
