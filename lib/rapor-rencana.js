import { LINGKUP_BY_ID, DIMENSI } from "./rapor-cp";

// Rapikan objek rencana minggu (PPM) yang datang dari perangkat guru sebelum dipakai di server.
export function rapikanRencana(r = {}) {
  const teks = (v, n) => String(v ?? "").slice(0, n);
  return {
    tema: teks(r.tema, 200),
    subTema: teks(r.subTema, 200),
    tp: (Array.isArray(r.tp) ? r.tp : [])
      .slice(0, 12)
      .filter((t) => LINGKUP_BY_ID[t?.lingkup_id])
      .map((t) => ({
        lingkup_id: t.lingkup_id,
        level: Math.max(1, Math.min(LINGKUP_BY_ID[t.lingkup_id].tp.length, Number(t.level) || 1)),
      })),
    dpl: (Array.isArray(r.dpl) ? r.dpl : []).filter((i) => Number.isInteger(i) && i >= 0 && i < DIMENSI.length),
    kegiatan: (Array.isArray(r.kegiatan) ? r.kegiatan : [])
      .slice(0, 40)
      .map((k) => ({ fase: teks(k?.fase, 20), teks: teks(k?.teks, 500) }))
      .filter((k) => k.teks.trim()),
    pemantik: (Array.isArray(r.pemantik) ? r.pemantik : []).slice(0, 20).map((p) => teks(p, 300)),
  };
}

// Kelengkapan PPM sesuai ketentuan yayasan: DPL, CP/TP, tema, kegiatan, pertanyaan pemantik.
export function kekuranganPpm(r = {}) {
  const kurang = [];
  if (!r.tema?.trim()) kurang.push("tema");
  if (!r.dpl?.length) kurang.push("Dimensi Profil Lulusan (DPL)");
  if (!r.tp?.length) kurang.push("CP & Tujuan Pembelajaran");
  if (!r.kegiatan?.length) kurang.push("kegiatan");
  if (!r.pemantik?.length) kurang.push("pertanyaan pemantik");
  return kurang;
}
