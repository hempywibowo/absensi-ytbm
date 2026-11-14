"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GENRES, RECIPIENTS, OCCASIONS, MOODS, VOCALS, LANGUAGES, findLabel } from "@/lib/options";

const STEPS = ["Genre", "Untuk Siapa", "Cerita", "Detail", "Cek"];

const INITIAL = {
  genre: "",
  recipient: "",
  recipientName: "",
  senderName: "",
  occasion: "",
  story: "",
  traits: "",
  memories: "",
  message: "",
  mood: "romantis",
  vocal: "pria",
  language: "indonesia",
};

function ChoiceGrid({ options, value, onChange, cols = "grid-cols-2 sm:grid-cols-3" }) {
  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            type="button"
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`relative rounded-xl border px-3 py-3 text-left text-sm transition ${
              active ? "border-primary bg-primary-soft font-semibold" : "border-border bg-surface hover:border-primary/50"
            }`}
          >
            {o.emoji && <span className="mr-1.5">{o.emoji}</span>}
            {o.label}
            {o.popular && (
              <span className="absolute -top-2 right-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-white">
                Rekomendasi
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function TextArea({ value, onChange, max, rows = 4, placeholder }) {
  return (
    <>
      <textarea
        className={inputCls}
        rows={rows}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="mt-1 block text-right text-xs text-muted">
        {value.length}/{max}
      </span>
    </>
  );
}

export default function BuatLagu() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const [hint, setHint] = useState("");

  // Apa saja yang belum diisi di langkah ini (ditampilkan kalau user klik Lanjut).
  const missing = [
    () => [!form.genre && "genre"],
    () => [
      !form.recipient && "lagu ini untuk siapa",
      !form.recipientName.trim() && "nama penerima",
      !form.senderName.trim() && "nama kamu (pengirim)",
      !form.occasion && "momen / acaranya",
    ],
    () => [form.story.trim().length < 20 && "cerita minimal 20 karakter"],
    () => [!form.mood && "suasana lagu", !form.vocal && "vokal", !form.language && "bahasa"],
    () => [],
  ][step]().filter(Boolean);
  const canNext = missing.length === 0;

  function next() {
    if (!canNext) {
      setHint(`Belum diisi: ${missing.join(", ")}.`);
      return;
    }
    setHint("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat lagu.");
      router.push(`/lagu/${data.id}?baru=1`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <div className="animate-bounce text-6xl">🎶</div>
        <h2 className="mt-6 font-serif text-2xl">Sedang menulis lagu untuk {form.recipientName}...</h2>
        <p className="mt-2 max-w-sm text-muted">
          Penulis lagu kami sedang merangkai cerita dan kenanganmu jadi lirik. Biasanya butuh sekitar 1 menit, jangan tutup halaman ini ya.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/" className="text-sm text-muted hover:text-primary">
        ← Lagu Abadi
      </Link>

      {/* Progress */}
      <div className="mt-6 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
            <p className={`mt-1.5 text-xs ${i === step ? "font-semibold text-primary" : "text-muted"}`}>{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {step === 0 && (
          <>
            <div>
              <h1 className="font-serif text-3xl">Mau lagu bergenre apa?</h1>
              <p className="mt-1 text-muted">Yang ada label &ldquo;Rekomendasi&rdquo; paling banyak dipilih.</p>
            </div>
            <ChoiceGrid options={GENRES} value={form.genre} onChange={set("genre")} />
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-serif text-3xl">Lagu ini untuk siapa?</h1>
            <ChoiceGrid options={RECIPIENTS} value={form.recipient} onChange={set("recipient")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama / panggilan penerima" hint="Akan disebut di dalam lagu">
                <input className={inputCls} maxLength={60} value={form.recipientName} onChange={(e) => set("recipientName")(e.target.value)} placeholder="mis. Sayang, Mama, Dinda" />
              </Field>
              <Field label="Nama kamu (pengirim)" hint="Boleh nama panggilan">
                <input className={inputCls} maxLength={60} value={form.senderName} onChange={(e) => set("senderName")(e.target.value)} placeholder="mis. Mas Budi" />
              </Field>
            </div>
            <Field label="Momen / acaranya apa?">
              <ChoiceGrid options={OCCASIONS} value={form.occasion} onChange={set("occasion")} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="font-serif text-3xl">Ceritakan kisah kalian</h1>
              <p className="mt-1 text-muted">Makin detail, makin personal lagunya. Nama tempat, tanggal, kebiasaan kecil, semuanya bisa jadi lirik.</p>
            </div>
            <Field label="Momen-momen penting" hint="Wajib. Bagaimana kalian bertemu, perjalanan hidup bersama, momen yang tak terlupakan.">
              <TextArea
                value={form.story}
                onChange={set("story")}
                max={2000}
                rows={6}
                placeholder="mis. Kami pertama ketemu di kantin kampus tahun 2015, dia numpahin es teh ke bajuku..."
              />
            </Field>
            <Field label="Ciri-ciri / sifat khasnya" hint="Opsional. Senyumnya, kebiasaannya, hal yang bikin dia unik.">
              <TextArea value={form.traits} onChange={set("traits")} max={1000} placeholder="mis. Selalu ketawa ngakak, suka masak rendang, gak bisa jauh dari kucingnya" />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-serif text-3xl">Sedikit lagi...</h1>
            <Field label="Kenangan indah bersama" hint="Opsional. Liburan, kejutan, masa sulit yang dilalui bersama.">
              <TextArea value={form.memories} onChange={set("memories")} max={1500} placeholder="mis. Waktu naik motor ke Bromo jam 2 pagi, kehujanan tapi tetap ketawa" />
            </Field>
            <Field label="Kata-kata yang ingin disampaikan" hint="Opsional. Pesan dari hati yang ingin ada di lagu.">
              <TextArea value={form.message} onChange={set("message")} max={1000} placeholder="mis. Terima kasih sudah sabar menemaniku, aku janji akan selalu ada" />
            </Field>
            <Field label="Suasana lagu">
              <ChoiceGrid options={MOODS} value={form.mood} onChange={set("mood")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vokal">
                <ChoiceGrid options={VOCALS} value={form.vocal} onChange={set("vocal")} cols="grid-cols-3 sm:grid-cols-3" />
              </Field>
              <Field label="Bahasa lirik">
                <select className={inputCls} value={form.language} onChange={(e) => set("language")(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="font-serif text-3xl">Cek pesananmu</h1>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {[
                ["Genre", findLabel(GENRES, form.genre)],
                ["Untuk", `${form.recipientName} (${findLabel(RECIPIENTS, form.recipient)})`],
                ["Dari", form.senderName],
                ["Momen", findLabel(OCCASIONS, form.occasion)],
                ["Suasana", findLabel(MOODS, form.mood)],
                ["Vokal", findLabel(VOCALS, form.vocal)],
                ["Bahasa", findLabel(LANGUAGES, form.language)],
                ["Cerita", form.story],
                ["Ciri-ciri", form.traits || "-"],
                ["Kenangan", form.memories || "-"],
                ["Pesan", form.message || "-"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 px-4 py-3 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="col-span-2 whitespace-pre-line">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}

        <div className="flex justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setHint("");
              setStep((s) => s - 1);
            }}
            disabled={step === 0}
            className="rounded-full border border-border px-6 py-3 font-semibold disabled:invisible"
          >
            Kembali
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className={`rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground ${canNext ? "" : "opacity-60"}`}
            >
              Lanjut
            </button>
          ) : (
            <button type="button" onClick={submit} className="rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground">
              🎵 Lihat Pratinjau Gratis
            </button>
          )}
        </div>
        {hint && !canNext && <p className="rounded-xl bg-gold-soft px-4 py-3 text-sm">⚠️ {hint}</p>}
      </div>
    </main>
  );
}
