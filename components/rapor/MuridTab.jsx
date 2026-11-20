"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { idBaru, panggilApi } from "@/lib/rapor-client";
import FotoPicker from "./FotoPicker";
import { Ruas, kelasInput, Pesan, Judul } from "./bagian";

const kosong = { nama: "", panggilan: "", jk: "", nisn: "" };
const normal = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();

export default function MuridTab({ data, ubah, keTab }) {
  const [mode, setMode] = useState(null); // null | "ketik" | "tempel" | "foto"
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [tempel, setTempel] = useState("");
  const [foto, setFoto] = useState([]);
  const [hasilFoto, setHasilFoto] = useState(null); // {murid:[...+pilih], catatan}
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  const sudahAda = new Set(data.murid.map((m) => normal(m.nama)));

  function tambahBanyak(list) {
    const bersih = [];
    const lihat = new Set(sudahAda);
    for (const m of list) {
      const nama = (m.nama || "").trim();
      if (!nama || lihat.has(normal(nama))) continue;
      lihat.add(normal(nama));
      bersih.push({
        id: idBaru(),
        nama,
        panggilan: (m.panggilan || "").trim(),
        jk: m.jk || m.jenis_kelamin || "",
        nisn: (m.nisn || "").trim(),
      });
    }
    ubah((d) => ({ ...d, murid: [...d.murid, ...bersih] }));
    return bersih.length;
  }

  function simpanForm(e) {
    e.preventDefault();
    if (!form.nama.trim()) return;
    if (editId) {
      ubah((d) => ({
        ...d,
        murid: d.murid.map((m) => (m.id === editId ? { ...m, ...form, nama: form.nama.trim() } : m)),
      }));
      setEditId(null);
      setMode(null);
    } else {
      tambahBanyak([form]);
    }
    setForm(kosong);
  }

  function hapus(m) {
    const n = (data.catatan[m.id] || []).length;
    if (!confirm(`Hapus ${m.nama}?${n ? ` ${n} catatan hariannya ikut terhapus.` : ""}`)) return;
    ubah((d) => {
      const catatan = { ...d.catatan };
      const rapor = { ...d.rapor };
      delete catatan[m.id];
      delete rapor[m.id];
      return { ...d, murid: d.murid.filter((x) => x.id !== m.id), catatan, rapor };
    });
  }

  function mulaiEdit(m) {
    setForm({ nama: m.nama, panggilan: m.panggilan || "", jk: m.jk || "", nisn: m.nisn || "" });
    setEditId(m.id);
    setMode("ketik");
  }

  function simpanTempel() {
    const n = tambahBanyak(
      tempel
        .split("\n")
        .map((s) => s.replace(/^\s*\d+[.)\-\s]+/, "").trim())
        .filter(Boolean)
        .map((nama) => ({ nama })),
    );
    setTempel("");
    setMode(null);
    setGalat(n ? "" : "Tidak ada nama baru yang ditambahkan (kosong atau sudah ada).");
  }

  async function bacaFoto() {
    setSibuk(true);
    setGalat("");
    try {
      const j = await panggilApi("baca-daftar", { foto });
      setHasilFoto({
        catatan: j.catatan,
        murid: j.murid.map((m) => ({ ...m, pilih: !sudahAda.has(normal(m.nama)) })),
      });
    } catch (e) {
      setGalat(e.butuhKode ? `${e.message} Isi kode akses di tab Kelas.` : e.message);
    } finally {
      setSibuk(false);
    }
  }

  function simpanHasilFoto() {
    const n = tambahBanyak(hasilFoto.murid.filter((m) => m.pilih));
    setHasilFoto(null);
    setFoto([]);
    setMode(null);
    setGalat(n ? "" : "Tidak ada nama baru yang ditambahkan.");
  }

  const ubahHasil = (i, field, v) =>
    setHasilFoto((h) => ({ ...h, murid: h.murid.map((m, j) => (j === i ? { ...m, [field]: v } : m)) }));

  return (
    <>
      <Card>
        <Judul kanan={<Badge>{data.murid.length} murid</Badge>}>Tambah Murid</Judul>
        <div className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["ketik", "⌨️ Ketik"],
              ["tempel", "📋 Tempel daftar"],
              ["foto", "📷 Foto absen"],
            ].map(([id, label]) => (
              <Button
                key={id}
                type="button"
                variant={mode === id ? "primary" : "outline"}
                className="px-2"
                onClick={() => {
                  setMode(mode === id ? null : id);
                  setEditId(null);
                  setForm(kosong);
                  setGalat("");
                }}
              >
                {label}
              </Button>
            ))}
          </div>

          {mode === "ketik" && (
            <form onSubmit={simpanForm} className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <Ruas label="Nama lengkap">
                <input
                  className={kelasInput}
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  autoFocus
                />
              </Ruas>
              <div className="grid grid-cols-3 gap-2">
                <Ruas label="Panggilan">
                  <input
                    className={kelasInput}
                    value={form.panggilan}
                    onChange={(e) => setForm({ ...form, panggilan: e.target.value })}
                  />
                </Ruas>
                <Ruas label="L/P">
                  <select className={kelasInput} value={form.jk} onChange={(e) => setForm({ ...form, jk: e.target.value })}>
                    <option value="">-</option>
                    <option value="L">L</option>
                    <option value="P">P</option>
                  </select>
                </Ruas>
                <Ruas label="NISN">
                  <input
                    className={kelasInput}
                    inputMode="numeric"
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                  />
                </Ruas>
              </div>
              <Button type="submit" disabled={!form.nama.trim()}>
                {editId ? "Simpan perubahan" : "Tambah murid"}
              </Button>
            </form>
          )}

          {mode === "tempel" && (
            <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <Ruas label="Satu nama per baris" bantu="Bisa disalin dari WhatsApp, Excel, atau dokumen lain.">
                <textarea
                  className={`${kelasInput} min-h-40`}
                  value={tempel}
                  onChange={(e) => setTempel(e.target.value)}
                  placeholder={"1. Aisyah Putri\n2. Muhammad Rizki\n3. ..."}
                />
              </Ruas>
              <Button type="button" onClick={simpanTempel} disabled={!tempel.trim()}>
                Tambahkan semua
              </Button>
            </div>
          )}

          {mode === "foto" && !hasilFoto && (
            <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <p className="text-sm text-muted">
                Foto lembar daftar hadir / buku absen murid. Pastikan nama-nama terlihat jelas dan tidak terpotong.
              </p>
              <FotoPicker foto={foto} setFoto={setFoto} />
              <Button type="button" onClick={bacaFoto} disabled={!foto.length || sibuk}>
                {sibuk ? "Membaca foto… (bisa ±30 detik)" : "Baca nama dari foto"}
              </Button>
            </div>
          )}

          {hasilFoto && (
            <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">Periksa hasil bacaan — centang yang mau ditambahkan:</p>
              {hasilFoto.catatan && <Pesan tone="warning">{hasilFoto.catatan}</Pesan>}
              {hasilFoto.murid.length === 0 && <p className="text-sm text-muted">Tidak ada nama yang terbaca.</p>}
              {hasilFoto.murid.map((m, i) => {
                const dobel = sudahAda.has(normal(m.nama));
                return (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={m.pilih}
                      onChange={(e) => ubahHasil(i, "pilih", e.target.checked)}
                      className="h-5 w-5 shrink-0 accent-[var(--primary)]"
                    />
                    <input className={kelasInput} value={m.nama} onChange={(e) => ubahHasil(i, "nama", e.target.value)} />
                    {dobel && <Badge tone="warning">sudah ada</Badge>}
                  </div>
                );
              })}
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setHasilFoto(null)}>
                  Batal
                </Button>
                <Button type="button" onClick={simpanHasilFoto}>
                  Tambahkan ({hasilFoto.murid.filter((m) => m.pilih).length})
                </Button>
              </div>
            </div>
          )}

          {galat && <Pesan tone="danger">{galat}</Pesan>}
        </div>
      </Card>

      <Card>
        <Judul>Daftar Murid</Judul>
        {data.murid.length === 0 ? (
          <p className="p-4 text-sm text-muted">Belum ada murid.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.murid.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-right text-sm text-muted">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.nama}</p>
                  <p className="text-xs text-muted">
                    {[m.panggilan && `"${m.panggilan}"`, m.jk, m.nisn && `NISN ${m.nisn}`].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>
                <button type="button" className="text-sm font-semibold text-primary" onClick={() => mulaiEdit(m)}>
                  Ubah
                </button>
                <button type="button" className="text-sm font-semibold text-danger" onClick={() => hapus(m)}>
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {data.murid.length > 0 && (
        <Button type="button" onClick={() => keTab("catatan")}>
          Lanjut isi catatan harian →
        </Button>
      )}
    </>
  );
}
