"use client";

import dynamic from "next/dynamic";

// Data rapor disimpan di perangkat (localStorage), jadi halamannya dirender di browser saja.
const RaporApp = dynamic(() => import("@/components/rapor/RaporApp"), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-sm text-muted">Menyiapkan rapor…</p>,
});

export default function RaporPage() {
  return <RaporApp />;
}
