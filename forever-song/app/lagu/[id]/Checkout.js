"use client";

import { useState } from "react";
import { rupiah } from "@/lib/packages";

export default function Checkout({ songId, packages, initial, adminWhatsapp, qrisImageUrl, title }) {
  const [selected, setSelected] = useState(initial.package || "premium");
  const [wa, setWa] = useState(initial.whatsapp ? "0" + initial.whatsapp.slice(2) : "");
  const [order, setOrder] = useState(
    initial.status === "menunggu_konfirmasi" && initial.amount ? { amount: initial.amount, package: initial.package } : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pkg = packages.find((p) => p.id === (order?.package || selected));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/songs/${songId}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package: selected, whatsapp: wa }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setOrder(data);
  }

  function confirmViaWa() {
    const text =
      `Halo Lagu Abadi, saya sudah bayar 🙏\n\n` +
      `Lagu: ${title}\n` +
      `Kode pesanan: ${songId}\n` +
      `Paket: ${pkg.name}\n` +
      `Nominal: ${rupiah(order.amount)}\n\n` +
      `(bukti pembayaran saya lampirkan)`;
    window.open(`https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  if (order) {
    return (
      <section id="bayar" className="mt-12 rounded-3xl border-2 border-primary bg-surface p-6 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-gold">Selesaikan pembayaran</p>
        <h2 className="mt-2 font-serif text-2xl">Paket {pkg.name}</h2>
        <p className="mt-4 text-sm text-muted">Transfer tepat sebesar:</p>
        <p className="font-serif text-4xl font-bold text-primary">{rupiah(order.amount)}</p>
        <p className="mt-1 text-xs text-muted">3 angka terakhir adalah kode unik supaya pembayaranmu cepat dicek.</p>

        {qrisImageUrl ? (
          <div className="mt-5">
            <p className="text-sm font-semibold">Scan QRIS (semua e-wallet &amp; m-banking)</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrisImageUrl} alt="QRIS Lagu Abadi" className="mx-auto mt-2 w-64 max-w-full rounded-xl border border-border bg-white p-2" />
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-gold-soft p-3 text-sm">Info pembayaran akan dikirim admin lewat WhatsApp.</p>
        )}

        {adminWhatsapp && (
          <>
            <button onClick={confirmViaWa} className="mt-6 w-full rounded-full bg-[#25D366] py-3.5 font-semibold text-white">
              ✅ Sudah bayar? Kirim bukti via WhatsApp
            </button>
            <p className="mt-2 text-xs text-muted">Setelah dicek admin, lirik lengkap terbuka di halaman ini dan lagumu mulai diproduksi.</p>
          </>
        )}

        <button onClick={() => setOrder(null)} className="mt-4 text-xs text-muted underline">
          Ganti paket
        </button>
      </section>
    );
  }

  return (
    <section id="bayar" className="mt-12">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-gold">Promo peluncuran</p>
        <h2 className="mt-2 font-serif text-3xl">Dapatkan lagu lengkapmu</h2>
        <p className="mt-1 text-muted">Buka lirik lengkap &amp; terima lagunya, siap dikirim ke orang tersayang.</p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        {packages.map((p) => {
          const active = selected === p.id;
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`relative w-full rounded-2xl border-2 p-5 text-left transition ${
                active ? "border-primary bg-primary-soft" : "border-border bg-surface"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 right-4 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-white">Paling dipilih</span>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-semibold">{p.name}</span>
                <span className="text-right">
                  <span className="mr-2 text-sm text-muted line-through">{rupiah(p.normalPrice)}</span>
                  <span className="text-xl font-bold text-primary">{rupiah(p.price)}</span>
                </span>
              </div>
              <ul className="mt-2 space-y-0.5 text-sm text-muted">
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </button>
          );
        })}

        <label className="block pt-2">
          <span className="font-semibold">Nomor WhatsApp kamu</span>
          <span className="block text-sm text-muted">Untuk mengirim lagu &amp; info pesanan.</span>
          <input
            type="tel"
            inputMode="tel"
            required
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            placeholder="0812xxxxxxxx"
            className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3"
          />
        </label>

        {error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}

        <button disabled={loading} className="w-full rounded-full bg-primary py-4 text-lg font-semibold text-primary-foreground disabled:opacity-50">
          {loading ? "Memproses..." : `Lanjut Bayar ${rupiah(packages.find((p) => p.id === selected).price)}`}
        </button>
      </form>
    </section>
  );
}
