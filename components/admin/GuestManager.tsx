"use client";

import { useActionState, useState } from "react";

import { GUEST_INITIAL_STATE } from "@/lib/form-state";
import { buildGuestToken } from "@/lib/guest";
import { addGuests, deleteGuest } from "@/lib/guest-actions";
import type { GuestRow, RsvpStatus } from "@/types/invitation";

/** Label & warna untuk status RSVP tiap tamu. */
const STATUS_LABEL: Record<RsvpStatus, string> = {
  attending: "Hadir",
  declined: "Tidak hadir",
};

const STATUS_CLASS: Record<RsvpStatus, string> = {
  attending:
    "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400",
  declined:
    "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
};

interface GuestManagerProps {
  slug: string;
  /** "Budi & Ani" — dipakai pada teks undangan yang dikirim lewat WhatsApp. */
  coupleNames: string;
  guests: GuestRow[];
  /**
   * Status RSVP per nama tamu, kuncinya nama huruf kecil.
   *
   * Pencocokan lewat nama, bukan id, karena form RSVP di sisi tamu adalah
   * kolom teks bebas — tamu boleh mengetik namanya sendiri, bahkan berbeda dari
   * yang tertulis di undangan. Nama yang tidak cocok tetap muncul di tabel RSVP;
   * yang hilang hanya penandaannya di baris daftar tamu ini.
   */
  rsvpByName: Record<string, RsvpStatus>;
  /** Sisa kuota tamu, untuk memberi tahu batasnya sebelum admin menempel. */
  remaining: number;
}

/**
 * Panel daftar tamu: tempel banyak nama, lalu bagikan tautan personal.
 *
 * Tautannya berbentuk `/{slug}?to=nama-tamu.a1b2c3` — nama yang terbaca manusia
 * plus potongan id tamu sebagai pembeda bila ada dua nama yang sama persis.
 * Alamat domainnya dibaca dari `window.location.origin` saat tombolnya ditekan,
 * bukan dikirim dari server, supaya tautan yang disalin selalu memakai domain
 * yang benar-benar sedang dibuka.
 */
export default function GuestManager({
  slug,
  coupleNames,
  guests,
  rsvpByName,
  remaining,
}: GuestManagerProps) {
  const [addState, addAction, adding] = useActionState(
    addGuests,
    GUEST_INITIAL_STATE
  );
  const [deleteState, deleteAction] = useActionState(
    deleteGuest,
    GUEST_INITIAL_STATE
  );

  /** Id tamu yang tautannya baru saja disalin, untuk umpan balik tombol. */
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function guestLink(guest: GuestRow): string {
    const token = buildGuestToken(guest.name, guest.id);
    return `${window.location.origin}/${slug}?to=${encodeURIComponent(token)}`;
  }

  function guestMessage(guest: GuestRow): string {
    return [
      `Kepada Yth. ${guest.name}`,
      "",
      "Dengan memohon rahmat dan ridho Allah, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara pernikahan kami:",
      "",
      coupleNames,
      guestLink(guest),
      "",
      "Merupakan suatu kehormatan bagi kami apabila berkenan hadir dan memberikan doa restu.",
    ].join("\n");
  }

  async function copyLink(guest: GuestRow) {
    try {
      if (!navigator.clipboard) throw new Error("clipboard tidak tersedia");

      await navigator.clipboard.writeText(guestLink(guest));
      setCopiedId(guest.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard ditolak / konteks tidak aman. Tautannya tetap harus bisa
      // diambil admin, jadi ditampilkan untuk disalin manual.
      window.prompt("Salin tautan tamu ini:", guestLink(guest));
    }
  }

  function sendWhatsApp(guest: GuestRow) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(guestMessage(guest))}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /**
   * Satu pesan, dua aksi.
   *
   * Masing-masing `useActionState` punya state sendiri, jadi keduanya dirender
   * di tempat yang berbeda — di bawah form untuk penambahan, di atas daftar
   * untuk penghapusan. Menggabungkannya menjadi satu area pesan akan membuat
   * hasil aksi lama tertinggal di layar setelah aksi yang lain dijalankan.
   */
  function messageClass(status: "success" | "error"): string {
    return status === "error"
      ? "rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
      : "rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={addAction} className="flex flex-col gap-3">
        <input type="hidden" name="slug" value={slug} />

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Tambah nama tamu</span>
          <textarea
            name="names"
            rows={5}
            required
            placeholder={"Bapak Andi Wijaya\nIbu Siti & Keluarga\nRani Puspita"}
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          />
          <span className="text-xs text-zinc-500">
            Satu nama per baris, atau dipisah koma. Nama yang sudah terdaftar
            otomatis dilewati. Sisa kuota: {remaining} tamu.
          </span>
        </label>

        <button
          type="submit"
          disabled={adding || remaining <= 0}
          className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {adding ? "Menyimpan..." : "Tambahkan"}
        </button>
      </form>

      {addState.status !== "idle" ? (
        <p role="status" className={messageClass(addState.status)}>
          {addState.message}
        </p>
      ) : null}

      {deleteState.status !== "idle" ? (
        <p role="status" className={messageClass(deleteState.status)}>
          {deleteState.message}
        </p>
      ) : null}

      {guests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Belum ada tamu. Tambahkan nama di atas untuk mendapat tautan personal.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {guests.map((guest) => {
            const status = rsvpByName[guest.name.trim().toLowerCase()];

            return (
              <li
                key={guest.id}
                className="overflow-hidden rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {guest.name}
                  </p>

                  {status ? (
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${STATUS_CLASS[status]}`}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-dashed border-zinc-300 px-2.5 py-0.5 text-xs text-zinc-400 dark:border-zinc-700">
                      Belum menjawab
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(guest)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {copiedId === guest.id ? "Tersalin!" : "Salin link"}
                  </button>

                  <button
                    type="button"
                    onClick={() => sendWhatsApp(guest)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Kirim WhatsApp
                  </button>

                  {/* Form terpisah per tamu, bukan bersarang di form tambah:
                      form di dalam form bukan HTML yang sah. */}
                  <form action={deleteAction} className="contents">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="guestId" value={guest.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Hapus
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
