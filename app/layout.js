import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata = {
  title: "Absensi Guru — Yayasan Tunas Bangsa Mandiri",
  description: "Absensi clock in/out berbasis lokasi & selfie untuk guru TK Yayasan Tunas Bangsa Mandiri",
};

export const viewport = {
  themeColor: "#0f6b5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider signInUrl="/admin/login">
      <html lang="id" className="h-full antialiased">
        <body className="min-h-full flex flex-col bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
