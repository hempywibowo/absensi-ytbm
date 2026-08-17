import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { Card } from "@/components/ui";

export default async function AdminLayout({ children }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <Card className="p-6">
          <p className="font-semibold">Akun ini belum terdaftar sebagai admin atau kepala sekolah.</p>
          <p className="mt-2 text-sm text-muted">
            Hubungi admin yayasan untuk didaftarkan dulu di sistem absensi.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Yayasan Tunas Bangsa Mandiri
          </p>
          <p className="text-sm text-muted">
            {admin.name || admin.email} · {admin.role === "admin" ? "Admin Yayasan" : "Kepala Sekolah"}
          </p>
        </div>
        <UserButton afterSignOutUrl="/admin/login" />
      </header>

      <nav className="flex gap-2 border-b border-border pb-3 text-sm font-semibold">
        <Link href="/admin/dashboard" className="rounded-lg px-3 py-2 hover:bg-primary-soft">
          Dashboard
        </Link>
        {admin.role === "admin" && (
          <Link href="/admin/approvals" className="rounded-lg px-3 py-2 hover:bg-primary-soft">
            Persetujuan Izin
          </Link>
        )}
        {admin.role === "admin" && (
          <Link href="/admin/sekolah" className="rounded-lg px-3 py-2 hover:bg-primary-soft">
            Data Sekolah
          </Link>
        )}
      </nav>

      {children}
    </div>
  );
}
