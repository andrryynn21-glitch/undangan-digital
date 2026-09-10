import Link from "next/link";

import InvitationForm from "@/components/admin/InvitationForm";
import CopyLinkButton from "@/components/admin/CopyLinkButton";
import { getThemeConfig } from "@/config/themes";
import { logout } from "@/lib/auth-actions";
import { requireAdmin } from "@/lib/auth-session";
import { formatDateTime } from "@/lib/date";
import { getInvitations } from "@/lib/invitation";

export const metadata = {
  title: "Admin — Undangan Digital",
};

/**
 * Daftar undangan harus selalu dibaca ulang dari database.
 * Tanpa ini Next akan mem-prerender halaman ini saat `next build` (query
 * Supabase ikut dieksekusi di build), sehingga undangan yang dibuat langsung
 * dari dashboard Supabase tidak akan pernah muncul di daftar.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Pemeriksaan izin yang sungguhan. `proxy.ts` sudah mengalihkan pengunjung
  // tanpa cookie, tetapi cakupan proxy bisa hilang tanpa suara kalau matcher-nya
  // diubah — jadi halaman ini tidak boleh bergantung padanya.
  await requireAdmin();

  const { data: invitations, error } = await getInvitations();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Dashboard Admin
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Buat undangan baru dan kelola undangan yang sudah ada.
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Logout
            </button>
          </form>
        </div>

        <Link
          href="/paket"
          className="mt-3 inline-block text-sm font-medium underline underline-offset-4 hover:opacity-70"
        >
          Perbandingan paket &amp; undangan contoh
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 p-5 shadow-sm sm:p-6 dark:border-zinc-800">
        <h2 className="mb-5 text-lg font-medium">Buat Undangan Baru</h2>
        <InvitationForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-medium">
          Undangan Tersimpan
          {invitations.length > 0 ? (
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {invitations.length}
            </span>
          ) : null}
        </h2>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <p className="font-medium">Gagal memuat daftar undangan.</p>
            <p className="mt-1 opacity-90">{error}</p>
            <p className="mt-2 opacity-75">
              Periksa tabel <code>invitations</code> dan policy RLS di Supabase.
            </p>
          </div>
        ) : invitations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Belum ada undangan yang dibuat.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="overflow-hidden rounded-xl border border-zinc-200 px-4 py-3.5 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-medium">
                    {invitation.groom_data.nickName} &amp;{" "}
                    {invitation.bride_data.nickName}
                  </p>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                      {invitation.tier}
                    </span>
                    <CopyLinkButton slug={invitation.slug} />
                    <Link
                      href={`/${invitation.slug}`}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      Lihat
                    </Link>
                  </div>
                </div>

                <p className="mt-1 truncate text-xs text-zinc-500">
                  /{invitation.slug} · {getThemeConfig(invitation.theme_id).name}{" "}
                  · {formatDateTime(invitation.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
