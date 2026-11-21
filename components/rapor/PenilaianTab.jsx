"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { CP, DIMENSI, LINGKUP_BY_ID, SEMUA_SUB, capaianLingkup, subTerisi } from "@/lib/rapor-cp";
import { panggilApi, semAktif, ubahSem, buktiPpmAnak, catatanAnak } from "@/lib/rapor-client";
import { Ruas, kelasInput, Pesan, Judul } from "./bagian";

// Penilaian per anak berdasarkan CP Fase Fondasi (14 sub-elemen) dan ATP-nya.
// Guru cukup memilih sampai TP mana anak sudah sampai di tiap lingkup; TP berikutnya otomatis
// menjadi "kemampuan yang sedang dikembangkan".
export default function PenilaianTab({ data, ubah, keTab }) {
  const S = semAktif(data);
  const [anakId, setAnakId] = useState(data.murid[0]?.id || "");
  const [buka, setBuka] = useState("agama");
  const [usulan, setUsulan] = useState(null); // [{lingkup_id, level, bukti, pilih}]
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");

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

  const idx = Math.max(0, data.murid.findIndex((m) => m.id === anakId));
  const anak = data.murid[idx];
  const nilai = S.nilai[anak.id] || {};
  const bukti = S.bukti[anak.id] || {};
  const kokuAnak = S.kokuAnak[anak.id] || { dimensi: [], bukti: "" };
  const nCatatan = catatanAnak(S, anak.id).length;
  const terisi = SEMUA_SUB.filter((s) => subTerisi(s, nilai)).length;
  const ppmAnak = buktiPpmAnak(S, anak.id);

  const gantiAnak = (i) => {
    setAnakId(data.murid[(i + data.murid.length) % data.murid.length].id);
    setUsulan(null);
    setGalat("");
    setInfo("");
  };

  const setNilai = (lingkupId, v) =>
    ubahSem(ubah, (s) => {
      const lama = { ...(s.nilai[anak.id] || {}) };
      if (v === "") delete lama[lingkupId];
      else lama[lingkupId] = Number(v);
      return { ...s, nilai: { ...s.nilai, [anak.id]: lama } };
    });

  const setBukti = (subId, v) =>
    ubahSem(ubah, (s) => ({ ...s, bukti: { ...s.bukti, [anak.id]: { ...(s.bukti[anak.id] || {}), [subId]: v } } }));

  const setKokuAnak = (patch) =>
    ubahSem(ubah, (s) => ({
      ...s,
      kokuAnak: { ...s.kokuAnak, [anak.id]: { dimensi: [], bukti: "", ...(s.kokuAnak[anak.id] || {}), ...patch } },
    }));

  const setKoku = (patch) => ubahSem(ubah, (s) => ({ ...s, koku: { ...s.koku, ...patch } }));

  async function mintaUsulan() {
    setSibuk(true);
    setGalat("");
    setInfo("");
    try {
      const j = await panggilApi("usul-penilaian", {
        anak: { nama: anak.nama },
        catatan: catatanAnak(S, anak.id).map((c) => ({ tanggal: c.tanggal, isi: c.isi })),
      });
      if (!j.usulan.length) setInfo("Catatan harian belum memuat bukti yang cukup untuk dipetakan ke TP.");
      setUsulan(j.usulan.map((u) => ({ ...u, pilih: true })));
    } catch (e) {
      setGalat(e.butuhKode ? `${e.message} Isi kode akses di tab Kelas.` : e.message);
    } finally {
      setSibuk(false);
    }
  }

  function terapkanUsulan() {
    const pilih = usulan.filter((u) => u.pilih);
    ubahSem(ubah, (s) => {
      const n = { ...(s.nilai[anak.id] || {}) };
      const b = { ...(s.bukti[anak.id] || {}) };
      for (const u of pilih) {
        n[u.lingkup_id] = u.level;
        const subId = LINGKUP_BY_ID[u.lingkup_id]?.sub;
        if (subId && u.bukti.trim() && !(b[subId] || "").includes(u.bukti.trim())) {
          b[subId] = [b[subId], u.bukti.trim()].filter(Boolean).join(" ");
        }
      }
      return { ...s, nilai: { ...s.nilai, [anak.id]: n }, bukti: { ...s.bukti, [anak.id]: b } };
    });
    setInfo(`${pilih.length} penilaian diterapkan. Periksa lagi di bawah dan ubah bila perlu.`);
    setUsulan(null);
  }

  return (
    <>
      {/* Pilih anak */}
      <Card className="flex items-center gap-2 p-3">
        <button type="button" onClick={() => gantiAnak(idx - 1)} className="rounded-lg px-3 py-2 text-lg font-bold text-primary">
          ‹
        </button>
        <select className={kelasInput} value={anak.id} onChange={(e) => gantiAnak(data.murid.findIndex((m) => m.id === e.target.value))}>
          {data.murid.map((m, i) => {
            const t = SEMUA_SUB.filter((s) => subTerisi(s, S.nilai[m.id])).length;
            return (
              <option key={m.id} value={m.id}>
                {i + 1}. {m.nama} — {t}/14
              </option>
            );
          })}
        </select>
        <button type="button" onClick={() => gantiAnak(idx + 1)} className="rounded-lg px-3 py-2 text-lg font-bold text-primary">
          ›
        </button>
      </Card>

      {/* Kelengkapan CP */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Sub-elemen yang sudah ada bukti</span>
          <Badge tone={terisi === 14 ? "neutral" : "warning"}>{terisi}/14</Badge>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
          <div className="h-full bg-primary transition-all" style={{ width: `${(terisi / 14) * 100}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {CP.map((e) => {
            const t = e.sub.filter((s) => subTerisi(s, nilai)).length;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setBuka(e.id)}
                className={`rounded-lg border px-1 py-2 ${buka === e.id ? "border-primary bg-primary-soft" : "border-border"}`}
              >
                <span className="block font-bold">Elemen {e.no}</span>
                {t}/{e.sub.length} sub-elemen
              </button>
            );
          })}
        </div>

        {nCatatan > 0 ? (
          <Button type="button" variant="outline" onClick={mintaUsulan} disabled={sibuk}>
            {sibuk ? "Memetakan catatan ke TP… (±30 detik)" : `✨ Usulkan penilaian dari ${nCatatan} catatan harian`}
          </Button>
        ) : (
          <p className="text-xs text-muted">
            Tip: isi catatan harian dulu, nanti AI bisa mengusulkan penilaian TP otomatis.{" "}
            <button type="button" className="font-semibold text-primary underline" onClick={() => keTab("harian")}>
              Ke Harian
            </button>
          </p>
        )}
        {galat && <Pesan tone="danger">{galat}</Pesan>}
        {info && <Pesan>{info}</Pesan>}
      </Card>

      {/* Review usulan AI */}
      {usulan && usulan.length > 0 && (
        <Card>
          <Judul>Usulan penilaian — periksa dulu</Judul>
          <ul className="divide-y divide-border">
            {usulan.map((u, i) => {
              const l = LINGKUP_BY_ID[u.lingkup_id];
              return (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={u.pilih}
                    onChange={(e) => setUsulan(usulan.map((x, j) => (j === i ? { ...x, pilih: e.target.checked } : x)))}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)]"
                  />
                  <div className="min-w-0 text-sm">
                    <p className="text-xs font-semibold text-muted">
                      {l.sub} · {l.nama}
                    </p>
                    <p className="font-semibold">{u.level > 0 ? `TP ${u.level}: ${l.tp[u.level - 1]}` : "Belum muncul"}</p>
                    {u.bukti && <p className="mt-1 text-muted">“{u.bukti}”</p>}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="grid grid-cols-2 gap-2 p-4">
            <Button type="button" variant="outline" onClick={() => setUsulan(null)}>
              Batal
            </Button>
            <Button type="button" onClick={terapkanUsulan}>
              Terapkan ({usulan.filter((u) => u.pilih).length})
            </Button>
          </div>
        </Card>
      )}

      {/* Elemen CP */}
      {CP.map((e) => (
        <Card key={e.id}>
          <button
            type="button"
            onClick={() => setBuka(buka === e.id ? "" : e.id)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
          >
            <span className="font-semibold">
              {e.no}. {e.nama}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Badge tone={e.sub.every((s) => subTerisi(s, nilai)) ? "neutral" : "warning"}>
                {e.sub.filter((s) => subTerisi(s, nilai)).length}/{e.sub.length}
              </Badge>
              <span className="text-muted">{buka === e.id ? "▲" : "▼"}</span>
            </span>
          </button>

          {buka === e.id && (
            <div className="flex flex-col gap-4 border-t border-border p-4">
              {e.sub.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-border p-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 text-sm ${subTerisi(s, nilai) ? "text-primary" : "text-muted"}`}>
                      {subTerisi(s, nilai) ? "●" : "○"}
                    </span>
                    <p className="text-xs leading-relaxed text-muted">
                      <b className="text-foreground">Sub-elemen {s.id}.</b> {s.cp}
                    </p>
                  </div>

                  {s.lingkup.map((l) => {
                    const v = nilai[l.id];
                    const c = capaianLingkup(l, v);
                    return (
                      <div key={l.id} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold">{l.nama}</span>
                        <select
                          className={`${kelasInput} ${c ? "" : "text-muted"}`}
                          value={v ?? ""}
                          onChange={(ev) => setNilai(l.id, ev.target.value)}
                        >
                          <option value="">— belum dinilai —</option>
                          <option value="0">Belum muncul</option>
                          {l.tp.map((t, i) => (
                            <option key={i} value={i + 1}>
                              Sampai TP {i + 1}: {t.replace(/^Murid /, "")}
                            </option>
                          ))}
                        </select>
                        {ppmAnak.some((x) => x.lingkup_id === l.id) && (
                          <div className="flex flex-wrap gap-1">
                            {ppmAnak
                              .filter((x) => x.lingkup_id === l.id)
                              .map((x, k) => (
                                <span
                                  key={k}
                                  title={x.teks}
                                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${x.muncul ? "bg-primary-soft text-primary" : "bg-danger-soft text-danger"}`}
                                >
                                  PPM mg {x.minggu || "?"}: TP {x.level} {x.muncul ? "✓" : "✗"}
                                </span>
                              ))}
                          </div>
                        )}
                        {c && (
                          <p className="text-xs leading-relaxed">
                            {c.tercapai && <span className="text-primary">✓ {c.tercapai}. </span>}
                            {c.berikutnya ? (
                              <span className="text-accent">→ Sedang dikembangkan: {c.berikutnya}.</span>
                            ) : (
                              <span className="font-semibold text-primary">Lingkup ini sudah tuntas.</span>
                            )}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  <Ruas label="Bukti pengamatan (apa yang dilihat/didengar guru)">
                    <textarea
                      className={`${kelasInput} min-h-20`}
                      value={bukti[s.id] || ""}
                      onChange={(ev) => setBukti(s.id, ev.target.value)}
                      placeholder="Contoh: saat bermain di sentra balok, ia menghitung 8 balok sambil menunjuk satu per satu."
                    />
                  </Ruas>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* Kokurikuler */}
      <Card>
        <button
          type="button"
          onClick={() => setBuka(buka === "koku" ? "" : "koku")}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="font-semibold">Kokurikuler · Dimensi Profil Lulusan</span>
          <span className="flex items-center gap-2">
            <Badge tone={kokuAnak.dimensi?.length ? "neutral" : "warning"}>{kokuAnak.dimensi?.length || 0}/8</Badge>
            <span className="text-muted">{buka === "koku" ? "▲" : "▼"}</span>
          </span>
        </button>
        {buka === "koku" && (
          <div className="flex flex-col gap-3 border-t border-border p-4">
            <p className="text-xs text-muted">Tema & kegiatan berlaku untuk semua anak di kelas ini (semester {data.kelas.semester}).</p>
            <Ruas label="Tema kokurikuler">
              <input className={kelasInput} value={S.koku.tema} onChange={(ev) => setKoku({ tema: ev.target.value })} placeholder="Contoh: Aku Cinta Lingkungan" />
            </Ruas>
            <Ruas label="Kegiatan">
              <textarea className={`${kelasInput} min-h-16`} value={S.koku.kegiatan} onChange={(ev) => setKoku({ kegiatan: ev.target.value })} placeholder="Contoh: menanam sayur di polybag, membuat kompos, pameran hasil panen" />
            </Ruas>
            <p className="text-xs font-semibold text-muted">Dimensi yang tampak pada {anak.panggilan || anak.nama.split(" ")[0]}:</p>
            <div className="grid grid-cols-2 gap-2">
              {DIMENSI.map((d, i) => {
                const on = kokuAnak.dimensi?.includes(i);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setKokuAnak({ dimensi: on ? kokuAnak.dimensi.filter((x) => x !== i) : [...(kokuAnak.dimensi || []), i].sort() })
                    }
                    className={`rounded-xl border px-2 py-2 text-left text-xs font-semibold ${on ? "border-primary bg-primary-soft text-primary" : "border-border"}`}
                  >
                    {on ? "✓ " : ""}
                    {d}
                  </button>
                );
              })}
            </div>
            <Ruas label="Bukti keterlibatan anak">
              <textarea className={`${kelasInput} min-h-16`} value={kokuAnak.bukti || ""} onChange={(ev) => setKokuAnak({ bukti: ev.target.value })} />
            </Ruas>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => gantiAnak(idx + 1)}>
          Anak berikutnya ›
        </Button>
        <Button type="button" onClick={() => keTab("rapor")}>
          Susun rapor →
        </Button>
      </div>
    </>
  );
}
