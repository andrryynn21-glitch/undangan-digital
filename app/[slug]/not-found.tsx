import Link from "next/link";

/** Ditampilkan saat `notFound()` dipanggil karena slug undangan tidak ada. */
export default function InvitationNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Undangan tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        Tautan undangan yang Anda buka tidak tersedia atau sudah tidak berlaku.
        Silakan periksa kembali tautan dari pengirim.
      </p>
      <Link href="/" className="mt-2 text-sm underline underline-offset-4">
        Kembali ke beranda
      </Link>
    </main>
  );
}
