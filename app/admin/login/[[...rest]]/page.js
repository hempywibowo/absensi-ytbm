import { SignIn } from "@clerk/nextjs";

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Yayasan Tunas Bangsa Mandiri
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-primary">Login Admin / Kepala Sekolah</h1>
      </div>
      <SignIn forceRedirectUrl="/admin/dashboard" signUpForceRedirectUrl="/admin/dashboard" />
    </main>
  );
}
