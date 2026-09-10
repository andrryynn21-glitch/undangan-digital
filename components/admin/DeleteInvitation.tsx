"use client";

import { useActionState, useState } from "react";

import { deleteInvitation } from "@/lib/actions";
import { CREATE_INVITATION_INITIAL_STATE } from "@/lib/form-state";

/**
 * Panel penghapusan undangan.
 *
 * Konfirmasinya berupa ketik-ulang slug, bukan dialog "yakin?" yang bisa
 * ditekan tanpa dibaca. Yang dihapus di sini ikut membawa RSVP, ucapan, daftar
 * tamu, dan seluruh fotonya — dan tidak ada tombol batal setelahnya.
 *
 * Pemeriksaan yang sama diulang di Server Action; yang di sini hanya menjaga
 * agar admin tidak sampai ke titik itu tanpa sadar.
 */
export default function DeleteInvitation({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(
    deleteInvitation,
    CREATE_INVITATION_INITIAL_STATE
  );

  const [typed, setTyped] = useState("");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/50 px-4 py-4 dark:border-red-900 dark:bg-red-950/30"
    >
      <input type="hidden" name="slug" value={slug} />

      <div>
        <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
          Hapus Undangan
        </h2>
        <p className="mt-1 text-xs text-red-700/90 dark:text-red-300/80">
          Undangan, seluruh konfirmasi kehadiran, ucapan, daftar tamu, dan
          fotonya akan hilang permanen. Tautan{" "}
          <code className="font-mono">/{slug}</code> akan menjadi halaman tidak
          ditemukan bagi tamu yang sudah menerimanya.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-red-800 dark:text-red-300">
          Ketik <code className="font-mono">{slug}</code> untuk mengonfirmasi
        </span>
        <input
          type="text"
          name="confirmSlug"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          className="w-full min-w-0 rounded-lg border border-red-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-red-500 sm:max-w-sm dark:border-red-900 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      {state.status === "error" ? (
        <p
          role="alert"
          className="text-xs text-red-700 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || typed.trim() !== slug}
        className="self-start rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {pending ? "Menghapus..." : "Hapus Undangan Ini"}
      </button>
    </form>
  );
}
