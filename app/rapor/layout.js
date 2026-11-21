import "./tema.css";

// Identitas aplikasi "Rapor YTBM" supaya bisa dipasang (instal) di layar utama HP/laptop
// dengan ikon sendiri dan terbuka layar penuh. Hanya berlaku untuk halaman /rapor.
export const metadata = {
  title: "Rapor Anak — Yayasan Tunas Bangsa Mandiri",
  description: "Penyusunan rapor naratif PAUD/TK untuk sekolah-sekolah Yayasan Tunas Bangsa Mandiri",
  applicationName: "Rapor YTBM",
  manifest: "/rapor.webmanifest",
  icons: {
    icon: [
      { url: "/ikon-rapor-192.png", sizes: "192x192", type: "image/png" },
      { url: "/ikon-rapor-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/ikon-rapor-180.png",
  },
  appleWebApp: { capable: true, title: "Rapor YTBM", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: "#9b5de5",
};

export default function RaporLayout({ children }) {
  return children;
}
