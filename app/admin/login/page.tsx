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
    <main className="mx-auto w-full max-w-sm px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Masuk Admin</h1>
      <p className="mt-1.5 mb-7 text-sm text-zinc-600 dark:text-zinc-400">
        Masukkan password untuk membuka dashboard undangan.
      </p>

      <LoginForm />
    </main>
  );
}
