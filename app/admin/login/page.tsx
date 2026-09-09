import LoginForm from "@/components/admin/LoginForm";

export const metadata = {
  title: "Masuk Admin — Undangan Digital",
};

/**
 * Halaman login admin.
 *
 * Rute ini sengaja tetap bisa dibuka tanpa cookie — `proxy.ts` mengecualikannya
 * dari pengalihan, dan justru mengalihkan ke `/admin` bila sesinya sudah sah.
 */
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Masuk Admin</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Masukkan password untuk membuka dashboard undangan.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
