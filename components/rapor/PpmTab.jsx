"use client";

import { useRef, useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { CP, LINGKUP_BY_ID } from "@/lib/rapor-cp";
import { docxKeHtml, idBaru, panggilApi, semAktif, tanggalIndo } from "@/lib/rapor-client";
import { Ruas, kelasInput, Pesan, Judul } from "./bagian";

const BARU = "__baru";
const SIKLUS = { true: false, false: null, null: true }; // ✓ -> ✗ -> kosong -> ✓

// Unggah dokumen PPM (Perencanaan Pembelajaran Mendalam) mingguan guru. AI membaca TP minggu itu
// (dipetakan ke ATP resmi), ceklis capaian tiap anak, serta anekdot & hasil karya. Guru memeriksa
// hasilnya, lalu disimpan sebagai bukti untuk Penilaian CP dan narasi rapor.
export default function PpmTab({ data, ubah, keTab }) {
  const S = semAktif(data);
  const fileRef = useRef(null);
  const [antrian, setAntrian] = useState([]); // [{file, r}] menunggu diperiksa
  const [proses, setProses] = useState(null); // {ke, total, nama}
  const [galat, setGalat] = useState([]);
  const [info, setInfo] = useState("");

  async function unggah(files) {
    const list = [...(files || [])];
    if (fileRef.current) fileRef.current.value = "";
    if (!list.length) return;
    setGalat([]);
    setInfo("");
    const masalah = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      setProses({ ke: i + 1, total: list.length, nama: f.name });
      try {
        const html = await docxKeHtml(f);
        const r = await panggilApi("baca-ppm", {
          html,
          murid: data.murid.map((m) => ({ id: m.id, nama: m.nama, panggilan: m.panggilan })),
        });
        r.anak = r.anak.map((a) => ({ ...a, anak_id: a.anak_id || (data.murid.length ? "" : BARU) }));
        // Anekdot/karya: pakai pilihan anak yang sama dengan baris ceklis bernama sama.
        const dariCeklis = Object.fromEntries(r.anak.map((a) => [a.nama_tertulis.trim().toLowerCase(), a.anak_id]));
        r.bukti = r.bukti.map((b) => ({
          ...b,
          anak_id: b.anak_id || dariCeklis[b.nama_tertulis.trim().toLowerCase()] || (data.murid.length ? "" : BARU),
          simpan: true,
        }));
        setAntrian((q) => [...q, { file: f.name, r }]);
      } catch (e) {
        masalah.push(`${f.name}: ${e.butuhKode ? `${e.message} Isi kode akses di tab Kelas.` : e.message}`);
        if (e.butuhKode) break;
      }
    }
    setProses(null);
    setGalat(masalah);
  }

  const cur = antrian[0];
  const setR = (fn) => setAntrian((q) => [{ ...q[0], r: fn(q[0].r) }, ...q.slice(1)]);

  function simpan() {
    const r = cur.r;
    const sama = S.ppm.find((p) => r.minggu && p.minggu === r.minggu && p.tanggal === r.tanggal);
    if (sama && !confirm(`PPM minggu ${r.minggu} sudah pernah disimpan. Ganti dengan yang ini?`)) return;

    const ppmId = idBaru();
    ubah((d) => {
      // Murid baru dari nama di PPM (bila dipilih "Tambah sebagai murid baru").
      const muridBaru = [];
      const petaBaru = {};
      const pakaiId = (nama, id) => {
        if (id !== BARU) return id;
        const kunci = nama.trim().toLowerCase();
        if (!petaBaru[kunci]) {
          petaBaru[kunci] = idBaru();
          muridBaru.push({ id: petaBaru[kunci], nama: nama.trim(), panggilan: nama.trim(), jk: "" });
        }
        return petaBaru[kunci];
      };

      const s0 = d.sem[d.kelas.semester];
      const hapusLama = (obj) => {
        if (!sama) return obj;
        const o = {};
        for (const [k, v] of Object.entries(obj)) {
          const t = { ...v };
          delete t[sama.id];
          o[k] = t;
        }
        return o;
      };
      const hasilPpm = hapusLama(s0.hasilPpm || {});
      const nilai = { ...s0.nilai };
      const jurnal = (s0.jurnal || []).filter((j) => !sama || j.ppmId !== sama.id);

      for (const a of r.anak) {
        if (!a.anak_id) continue;
        const id = pakaiId(a.nama_tertulis, a.anak_id);
        const baris = r.tp.map((_, i) => (a.muncul.includes(i + 1) ? true : a.belum.includes(i + 1) ? false : null));
        hasilPpm[id] = { ...(hasilPpm[id] || {}), [ppmId]: baris };
        // Penilaian CP: naikkan level lingkup bila TP-nya muncul (tidak pernah menurunkan nilai guru).
        const n = { ...(nilai[id] || {}) };
        r.tp.forEach((t, i) => {
          if (baris[i] === true && (n[t.lingkup_id] === undefined || n[t.lingkup_id] < t.level)) n[t.lingkup_id] = t.level;
        });
        nilai[id] = n;
      }

      for (const b of r.bukti) {
        if (!b.simpan || !b.anak_id || !b.isi.trim()) continue;
        const id = pakaiId(b.nama_tertulis, b.anak_id);
        const tp = b.tp_no ? r.tp[b.tp_no - 1]?.teks : "";
        const t = b.tp_no ? r.tp[b.tp_no - 1] : null;
        jurnal.push({
          id: idBaru(),
          tanggal: b.tanggal || r.tanggal || "",
          isi: `[PPM minggu ${r.minggu || "?"}${tp ? ` · ${tp}` : ""}] ${b.isi.trim()}`,
          anakIds: [id],
          label: t ? [{ lingkup_id: t.lingkup_id, level: t.level }] : [],
          sumber: "ppm",
          status: "direview",
          ppmId,
        });
      }

      const ppm = [
        ...s0.ppm.filter((p) => p.id !== sama?.id),
        {
          id: ppmId,
          file: cur.file,
          minggu: r.minggu,
          tanggal: r.tanggal,
          tema: r.tema,
          subTema: r.sub_tema,
          kegiatan: r.kegiatan,
          tp: r.tp.map(({ teks, lingkup_id, level }) => ({ teks, lingkup_id, level })),
        },
      ].sort((a, b) => (Number(a.minggu) || 0) - (Number(b.minggu) || 0));

      return {
        ...d,
        murid: [...d.murid, ...muridBaru],
        sem: { ...d.sem, [d.kelas.semester]: { ...s0, ppm, hasilPpm, nilai, jurnal } },
      };
    });
    setInfo(`PPM minggu ${r.minggu || "?"} tersimpan. Penilaian CP anak yang TP-nya muncul sudah diperbarui.`);
    setAntrian((q) => q.slice(1));
  }

  function hapusPpm(p) {
    if (!confirm(`Hapus PPM minggu ${p.minggu}? Ceklis dan anekdot dari file ini ikut terhapus (penilaian CP yang sudah terisi tidak diubah).`)) return;
    ubah((d) => {
      const s0 = d.sem[d.kelas.semester];
      const hasilPpm = {};
      for (const [k, v] of Object.entries(s0.hasilPpm || {})) {
        const t = { ...v };
        delete t[p.id];
        hasilPpm[k] = t;
      }
      const jurnal = (s0.jurnal || []).filter((j) => j.ppmId !== p.id);
      return {
        ...d,
        sem: { ...d.sem, [d.kelas.semester]: { ...s0, ppm: s0.ppm.filter((x) => x.id !== p.id), hasilPpm, jurnal } },
      };
    });
  }

  const pilihanAnak = (
    <>
      <option value="">— lewati —</option>
      {data.murid.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nama}
        </option>
      ))}
      <option value={BARU}>+ Tambah sebagai murid baru</option>
    </>
  );

  return (
    <>
      <Card>
        <Judul kanan={<Badge>{S.ppm.length} minggu</Badge>}>PPM Mingguan · Semester {data.kelas.semester}</Judul>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-muted">
            Unggah file Word <b>PPM (Perencanaan Pembelajaran Mendalam)</b> tiap minggu. Aplikasi membaca TP minggu itu,
            ceklis capaian tiap anak (☑/☐), catatan anekdot, dan hasil karya — lalu jadi bukti Penilaian CP dan rapor.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="hidden"
            onChange={(e) => unggah(e.target.files)}
          />
          <Button type="button" onClick={() => fileRef.current?.click()} disabled={Boolean(proses)}>
            {proses ? `Membaca ${proses.ke}/${proses.total}: ${proses.nama}… (±1 menit/file)` : "📂 Unggah file PPM (.docx)"}
          </Button>
          <p className="text-xs text-muted">Bisa pilih beberapa file sekaligus. Hanya format Word .docx.</p>
          {galat.map((g) => (
            <Pesan key={g} tone="danger">
              {g}
            </Pesan>
          ))}
          {info && <Pesan>{info}</Pesan>}
        </div>
      </Card>

      {cur && (
        <Card>
          <Judul kanan={antrian.length > 1 && <Badge tone="warning">{antrian.length} file menunggu</Badge>}>
            Periksa: {cur.file}
          </Judul>
          <div className="flex flex-col gap-4 p-4">
            {cur.r.peringatan && <Pesan tone="warning">{cur.r.peringatan}</Pesan>}
            {cur.r.semester && cur.r.semester !== data.kelas.semester && (
              <Pesan tone="warning">
                Dokumen ini Semester {cur.r.semester}, sedangkan aplikasi sedang di Semester {data.kelas.semester}. Ganti
                semester di kanan atas bila perlu, sebelum menyimpan.
              </Pesan>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Ruas label="Minggu ke">
                <input className={kelasInput} value={cur.r.minggu} onChange={(e) => setR((r) => ({ ...r, minggu: e.target.value }))} />
              </Ruas>
              <Ruas label="Tanggal">
                <input type="date" className={kelasInput} value={cur.r.tanggal} onChange={(e) => setR((r) => ({ ...r, tanggal: e.target.value }))} />
              </Ruas>
            </div>
            <p className="text-sm">
              <b>{cur.r.tema}</b>
              {cur.r.sub_tema && ` · ${cur.r.sub_tema}`}
            </p>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted">Tujuan Pembelajaran minggu ini → ATP resmi</p>
              {cur.r.tp.map((t, i) => {
                const l = LINGKUP_BY_ID[t.lingkup_id];
                return (
                  <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
                    <p className="text-sm font-semibold">
                      TP {i + 1}. {t.teks}
                    </p>
                    <select
                      className={kelasInput}
                      value={`${t.lingkup_id}|${t.level}`}
                      onChange={(e) => {
                        const [lid, lv] = e.target.value.split("|");
                        setR((r) => ({ ...r, tp: r.tp.map((x, j) => (j === i ? { ...x, lingkup_id: lid, level: Number(lv) } : x)) }));
                      }}
                    >
                      {CP.flatMap((e) =>
                        e.sub.flatMap((s) =>
                          s.lingkup.flatMap((lk) =>
                            lk.tp.map((tp, k) => (
                              <option key={`${lk.id}|${k + 1}`} value={`${lk.id}|${k + 1}`}>
                                {s.id} {lk.nama} · TP {k + 1}: {tp.replace(/^Murid /, "")}
                              </option>
                            )),
                          ),
                        ),
                      )}
                    </select>
                    <p className="text-xs text-muted">
                      Sub-elemen {l.sub} · {l.nama}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted">
                Ceklis capaian tiap anak (ketuk untuk ubah: ✓ muncul → ✗ belum → kosong)
              </p>
              {cur.r.anak.length === 0 && <p className="text-sm text-muted">Ceklis di dokumen ini belum diisi.</p>}
              {cur.r.anak.map((a, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-border p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-20 shrink-0 truncate text-sm font-semibold">{a.nama_tertulis}</span>
                    <select
                      className={`${kelasInput} py-1.5`}
                      value={a.anak_id}
                      onChange={(e) => setR((r) => ({ ...r, anak: r.anak.map((x, j) => (j === i ? { ...x, anak_id: e.target.value } : x)) }))}
                    >
                      {pilihanAnak}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cur.r.tp.map((_, k) => {
                      const v = a.muncul.includes(k + 1) ? true : a.belum.includes(k + 1) ? false : null;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            const nv = SIKLUS[String(v)];
                            setR((r) => ({
                              ...r,
                              anak: r.anak.map((x, j) =>
                                j !== i
                                  ? x
                                  : {
                                      ...x,
                                      muncul: nv === true ? [...x.muncul, k + 1] : x.muncul.filter((n) => n !== k + 1),
                                      belum: nv === false ? [...x.belum, k + 1] : x.belum.filter((n) => n !== k + 1),
                                    },
                              ),
                            }));
                          }}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            v === true ? "border-primary bg-primary-soft text-primary" : v === false ? "border-danger bg-danger-soft text-danger" : "border-border text-muted"
                          }`}
                        >
                          TP{k + 1} {v === true ? "✓" : v === false ? "✗" : "–"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {cur.r.bukti.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted">Catatan anekdot & hasil karya → masuk ke catatan anak</p>
                {cur.r.bukti.map((b, i) => (
                  <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-border p-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={b.simpan}
                        onChange={(e) => setR((r) => ({ ...r, bukti: r.bukti.map((x, j) => (j === i ? { ...x, simpan: e.target.checked } : x)) }))}
                        className="h-5 w-5 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="w-20 shrink-0 truncate text-sm font-semibold">{b.nama_tertulis}</span>
                      <select
                        className={`${kelasInput} py-1.5`}
                        value={b.anak_id}
                        onChange={(e) => setR((r) => ({ ...r, bukti: r.bukti.map((x, j) => (j === i ? { ...x, anak_id: e.target.value } : x)) }))}
                      >
                        {pilihanAnak}
                      </select>
                    </div>
                    <p className="text-xs text-muted">
                      {b.jenis === "karya" ? "Hasil karya" : b.jenis === "anekdot" ? "Anekdot" : "Catatan"}
                      {b.tanggal && ` · ${tanggalIndo(b.tanggal)}`}
                      {b.tp_no ? ` · TP ${b.tp_no}` : ""}
                    </p>
                    <textarea
                      className={`${kelasInput} min-h-20`}
                      value={b.isi}
                      onChange={(e) => setR((r) => ({ ...r, bukti: r.bukti.map((x, j) => (j === i ? { ...x, isi: e.target.value } : x)) }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setAntrian((q) => q.slice(1))}>
                Lewati
              </Button>
              <Button type="button" onClick={simpan}>
                Simpan PPM
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <Judul>PPM tersimpan</Judul>
        {S.ppm.length === 0 ? (
          <p className="p-4 text-sm text-muted">Belum ada PPM untuk semester ini.</p>
        ) : (
          <ul className="divide-y divide-border">
            {S.ppm.map((p) => {
              const nAnak = Object.values(S.hasilPpm || {}).filter((h) => h[p.id]).length;
              return (
                <li key={p.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">
                      Minggu {p.minggu || "?"}
                      {p.tanggal && <span className="font-normal text-muted"> · {tanggalIndo(p.tanggal)}</span>}
                    </p>
                    <button type="button" className="text-xs font-semibold text-danger" onClick={() => hapusPpm(p)}>
                      Hapus
                    </button>
                  </div>
                  <p className="text-sm">{[p.tema, p.subTema].filter(Boolean).join(" · ")}</p>
                  <p className="text-xs text-muted">
                    {p.tp.length} TP · ceklis {nAnak} anak ·{" "}
                    {[...new Set(p.tp.map((t) => LINGKUP_BY_ID[t.lingkup_id]?.sub))].map((s) => `sub-elemen ${s}`).join(", ")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Button type="button" variant="outline" onClick={() => keTab("nilai")}>
        Lihat Penilaian CP →
      </Button>
    </>
  );
}
