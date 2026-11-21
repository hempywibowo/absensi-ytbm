"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { idBaru, panggilApi, hariIniISO, tanggalIndo, semAktif, ubahSem } from "@/lib/rapor-client";
import FotoPicker from "./FotoPicker";
import { Ruas, kelasInput, Pesan, Judul } from "./bagian";

export default function CatatanTab({ data, ubah, keTab }) {
  const S = semAktif(data);
  const [anakId, setAnakId] = useState(data.murid[0]?.id || "");
  const [mode, setMode] = useState(null); // null | "ketik" | "foto"
  const [tanggal, setTanggal] = useState(hariIniISO);
  const [isi, setIsi] = useState("");
  const [fotoUntuk, setFotoUntuk] = useState("satu"); // "satu" | "banyak"
  const [foto, setFoto] = useState([]);
  const [hasil, setHasil] = useState(null); // {entri:[{anak_id,nama_tertulis,tanggal,isi,pilih}], umum, peringatan, pakaiUmum}
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");
  const [editId, setEditId] = useState(null);
  const [editIsi, setEditIsi] = useState("");

  if (data.murid.length === 0) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted">Belum ada murid. Isi data murid dulu.</p>
        <Button type="button" onClick={() => keTab("murid")}>
          Ke tab Murid →
        </Button>
      </Card>
    );
  }

  const anak = data.murid.find((m) => m.id === anakId) || data.murid[0];
  const daftarCatatan = [...(S.catatan[anak.id] || [])].sort((a, b) =>
    (b.tanggal || "").localeCompare(a.tanggal || ""),
  );

  function tambahCatatan(list) {
    ubahSem(ubah, (d) => {
      const catatan = { ...d.catatan };
      for (const c of list) {
        catatan[c.anakId] = [
          ...(catatan[c.anakId] || []),
          { id: idBaru(), tanggal: c.tanggal || "", isi: c.isi.trim(), sumber: c.sumber },
        ];
      }
      return { ...d, catatan };
    });
  }

  function simpanKetik(e) {
    e.preventDefault();
    if (!isi.trim()) return;
    tambahCatatan([{ anakId: anak.id, tanggal, isi, sumber: "ketik" }]);
    setIsi("");
    setInfo(`Catatan untuk ${anak.nama} tersimpan.`);
  }

  async function bacaFoto() {
    setSibuk(true);
    setGalat("");
    setInfo("");
    try {
      const j = await panggilApi("baca-catatan", {
        foto,
        murid: data.murid.map((m) => ({ id: m.id, nama: m.nama, panggilan: m.panggilan })),
        anakId: fotoUntuk === "satu" ? anak.id : "",
      });
      setHasil({
        entri: j.catatan.map((c) => ({ ...c, tanggal: c.tanggal || tanggal, pilih: Boolean(c.anak_id) })),
        umum: j.catatan_umum || "",
        peringatan: j.peringatan || "",
        pakaiUmum: false,
      });
    } catch (e) {
      setGalat(e.butuhKode ? `${e.message} Isi kode akses di tab Kelas.` : e.message);
    } finally {
      setSibuk(false);
    }
  }

  const ubahEntri = (i, field, v) =>
    setHasil((h) => ({ ...h, entri: h.entri.map((x, j) => (j === i ? { ...x, [field]: v } : x)) }));

  function simpanHasil() {
    const pilih = hasil.entri.filter((x) => x.pilih && x.anak_id && x.isi.trim());
    tambahCatatan(
      pilih.map((x) => ({
        anakId: x.anak_id,
        tanggal: x.tanggal,
        isi: hasil.pakaiUmum && hasil.umum.trim() ? `Kegiatan: ${hasil.umum.trim()}. ${x.isi}` : x.isi,
        sumber: "foto",
      })),
    );
    setInfo(`${pilih.length} catatan dari foto tersimpan.`);
    setHasil(null);
    setFoto([]);
    setMode(null);
  }

  function hapusCatatan(id) {
    if (!confirm("Hapus catatan ini?")) return;
    ubahSem(ubah, (d) => ({ ...d, catatan: { ...d.catatan, [anak.id]: (d.catatan[anak.id] || []).filter((c) => c.id !== id) } }));
  }

  function simpanEdit(id) {
    ubahSem(ubah, (d) => ({
      ...d,
      catatan: {
        ...d.catatan,
        [anak.id]: (d.catatan[anak.id] || []).map((c) => (c.id === id ? { ...c, isi: editIsi } : c)),
      },
    }));
    setEditId(null);
  }

  return (
    <>
      <Card>
        <Judul>Catatan / Laporan Harian</Judul>
        <div className="flex flex-col gap-3 p-4">
          <Ruas label="Anak">
            <select className={kelasInput} value={anak.id} onChange={(e) => setAnakId(e.target.value)}>
              {data.murid.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama} ({(S.catatan[m.id] || []).length} catatan)
                </option>
              ))}
            </select>
          </Ruas>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "ketik" ? "primary" : "outline"}
              onClick={() => setMode(mode === "ketik" ? null : "ketik")}
            >
              ⌨️ Ketik catatan
            </Button>
            <Button
              type="button"
              variant={mode === "foto" ? "primary" : "outline"}
              onClick={() => setMode(mode === "foto" ? null : "foto")}
            >
              📷 Foto catatan
            </Button>
          </div>

          {mode === "ketik" && (
            <form onSubmit={simpanKetik} className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <Ruas label="Tanggal">
                <input type="date" className={kelasInput} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </Ruas>
              <Ruas
                label={`Apa yang dilakukan/diucapkan ${anak.panggilan || anak.nama} hari ini?`}
                bantu="Tulis apa adanya: kegiatan, ucapan anak, kemajuan, atau yang masih perlu dibantu."
              >
                <textarea
                  className={`${kelasInput} min-h-32`}
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  placeholder="Contoh: Saat kegiatan menanam, ia menyiram bibitnya sendiri dan bertanya kenapa tanaman perlu air."
                />
              </Ruas>
              <Button type="submit" disabled={!isi.trim()}>
                Simpan catatan
              </Button>
            </form>
          )}

          {mode === "foto" && !hasil && (
            <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["satu", `Foto ini untuk ${anak.panggilan || anak.nama.split(" ")[0]} saja`],
                  ["banyak", "Foto berisi catatan banyak anak"],
                ].map(([id, label]) => (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 ${
                      fotoUntuk === id ? "border-primary bg-primary-soft" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="foto-untuk"
                      checked={fotoUntuk === id}
                      onChange={() => setFotoUntuk(id)}
                      className="mt-0.5 accent-[var(--primary)]"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <Ruas label="Tanggal (dipakai bila di foto tidak tertulis tanggal)">
                <input type="date" className={kelasInput} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </Ruas>
              <FotoPicker foto={foto} setFoto={setFoto} />
              <Button type="button" onClick={bacaFoto} disabled={!foto.length || sibuk}>
                {sibuk ? "Membaca tulisan… (bisa ±1 menit)" : "Baca catatan dari foto"}
              </Button>
            </div>
          )}

          {hasil && (
            <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">Periksa &amp; perbaiki hasil bacaan sebelum disimpan:</p>
              {hasil.peringatan && <Pesan tone="warning">{hasil.peringatan}</Pesan>}
              {hasil.umum && (
                <div className="flex flex-col gap-2 rounded-xl bg-primary-soft p-3">
                  <Ruas label="Kegiatan / tema hari itu">
                    <textarea
                      className={kelasInput}
                      value={hasil.umum}
                      onChange={(e) => setHasil({ ...hasil, umum: e.target.value })}
                    />
                  </Ruas>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={hasil.pakaiUmum}
                      onChange={(e) => setHasil({ ...hasil, pakaiUmum: e.target.checked })}
                      className="accent-[var(--primary)]"
                    />
                    Tambahkan keterangan kegiatan ini ke setiap catatan
                  </label>
                </div>
              )}
              {hasil.entri.length === 0 && <p className="text-sm text-muted">Tidak ada catatan yang terbaca.</p>}
              {hasil.entri.map((x, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={x.pilih}
                      onChange={(e) => ubahEntri(i, "pilih", e.target.checked)}
                      className="h-5 w-5 shrink-0 accent-[var(--primary)]"
                    />
                    <select
                      className={kelasInput}
                      value={x.anak_id}
                      onChange={(e) => {
                        ubahEntri(i, "anak_id", e.target.value);
                        if (e.target.value) ubahEntri(i, "pilih", true);
                      }}
                    >
                      <option value="">— Pilih anak —</option>
                      {data.murid.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  {x.nama_tertulis && (
                    <p className="text-xs text-muted">
                      Tertulis di foto: <b>{x.nama_tertulis}</b>
                      {!x.anak_id && " — belum cocok dengan daftar murid, pilih manual."}
                    </p>
                  )}
                  <input
                    type="date"
                    className={kelasInput}
                    value={x.tanggal}
                    onChange={(e) => ubahEntri(i, "tanggal", e.target.value)}
                  />
                  <textarea
                    className={`${kelasInput} min-h-24`}
                    value={x.isi}
                    onChange={(e) => ubahEntri(i, "isi", e.target.value)}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setHasil(null)}>
                  Batal
                </Button>
                <Button type="button" onClick={simpanHasil}>
                  Simpan ({hasil.entri.filter((x) => x.pilih && x.anak_id).length})
                </Button>
              </div>
            </div>
          )}

          {galat && <Pesan tone="danger">{galat}</Pesan>}
          {info && <Pesan>{info}</Pesan>}
        </div>
      </Card>

      <Card>
        <Judul kanan={<Badge>{daftarCatatan.length}</Badge>}>Catatan {anak.nama}</Judul>
        {daftarCatatan.length === 0 ? (
          <p className="p-4 text-sm text-muted">Belum ada catatan untuk anak ini.</p>
        ) : (
          <ul className="divide-y divide-border">
            {daftarCatatan.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted">
                    {tanggalIndo(c.tanggal) || "Tanpa tanggal"} · {c.sumber === "foto" ? "📷 dari foto" : "⌨️ diketik"}
                  </p>
                  <div className="flex gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      className="text-primary"
                      onClick={() => {
                        setEditId(c.id);
                        setEditIsi(c.isi);
                      }}
                    >
                      Ubah
                    </button>
                    <button type="button" className="text-danger" onClick={() => hapusCatatan(c.id)}>
                      Hapus
                    </button>
                  </div>
                </div>
                {editId === c.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className={`${kelasInput} min-h-24`}
                      value={editIsi}
                      onChange={(e) => setEditIsi(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setEditId(null)}>
                        Batal
                      </Button>
                      <Button type="button" onClick={() => simpanEdit(c.id)}>
                        Simpan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm">{c.isi}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button type="button" variant="outline" onClick={() => keTab("nilai")}>
        Lanjut penilaian CP →
      </Button>
    </>
  );
}
