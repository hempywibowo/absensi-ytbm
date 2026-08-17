import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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
      <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
