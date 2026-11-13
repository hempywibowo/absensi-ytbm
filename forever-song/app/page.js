import Link from "next/link";
import { GENRES } from "@/lib/options";

const STEPS = [
  { n: "1", title: "Pilih genre & untuk siapa", desc: "Pop, koplo, jazz, rohani, keroncong, dan banyak lagi. Untuk pasangan, ibu, ayah, sahabat, atau siapa saja." },
  { n: "2", title: "Ceritakan kenanganmu", desc: "Momen penting, ciri-ciri khasnya, kenangan indah, dan kata-kata yang ingin kamu sampaikan." },
  { n: "3", title: "Terima lagumu", desc: "Lirik personal langsung jadi. Musiknya diproduksi lalu dikirim lewat link khusus yang bisa dibagikan." },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-5 pt-16 pb-12 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-gold">🎵 Lagu Abadi</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl leading-tight">
          Ubah kenanganmu jadi <span className="text-primary">lagu</span> untuk orang tersayang
        </h1>
        <p className="mt-5 text-lg text-muted">
          Ceritakan kisahmu, kami tuliskan lagu yang hanya ada satu di dunia. Untuk ulang tahun, anniversary,
          pernikahan, Hari Ibu, atau sekadar bilang &ldquo;aku sayang kamu&rdquo;.
        </p>
        <Link
          href="/buat"
          className="mt-8 inline-block rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:opacity-90"
        >
          Buat Lagumu Sekarang
        </Link>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{s.n}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-20 text-center">
        <h2 className="font-serif text-2xl">Pilihan genre</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {GENRES.map((g) => (
            <span key={g.id} className="rounded-full border border-border bg-surface px-4 py-2 text-sm">
              {g.emoji} {g.label}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Lagu Abadi
      </footer>
    </main>
  );
}
