import "./globals.css";

export const metadata = {
  title: "Lagu Abadi — Lagu Personal untuk Orang Tersayang",
  description: "Ceritakan kenanganmu, kami ubah jadi lagu personal: pop, koplo, jazz, rohani, keroncong, dan banyak lagi.",
};

export const viewport = {
  themeColor: "#b8325c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
