"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-session";
import type { GuestFormState } from "@/lib/form-state";
import { parseGuestNames } from "@/lib/guest";
import {
  MAX_GUESTS_PER_INVITATION,
  addGuestRows,
  deleteGuestRow,
  getInvitationBySlug,
} from "@/lib/invitation";

/**
 * Aksi pengelola daftar tamu undangan.
 *
 * Dipisah dari `lib/actions.ts` karena keduanya berbeda pemilik: berkas itu
 * berisi aksi yang dipanggil TAMU (RSVP, ucapan) dan hanya sebagian yang admin;
 * berkas ini seluruhnya admin. Setiap aksi diawali `requireAdmin()` — Server
 * Action adalah endpoint HTTP sungguhan yang bisa dipanggil langsung, jadi
 * pemeriksaan izinnya tidak boleh menumpang pada halaman yang merendernya.
 *
 * Kedua aksi menerima `slug`, bukan `invitation_id`, supaya nilai yang dikirim
 * dari browser selalu dipetakan ulang ke undangan yang benar di server.
 */

/** Batas panjang tempelan nama, sekadar penjaga agar body-nya tidak liar. */
const MAX_NAMES_TEXT = 20_000;

/**
 * Menambahkan banyak nama tamu sekaligus.
 *
 * Formatnya sengaja permisif: satu nama per baris ATAU dipisah koma, karena
 * pemilik acara biasanya menempelkan daftar dari catatan HP atau spreadsheet
 * dan bentuknya tidak pernah rapi. Duplikat dan baris kosong dibuang di
 * `parseGuestNames()`, nama yang sudah terdaftar dilewati `addGuestRows()`.
 */
export async function addGuests(
  _prev: GuestFormState,
  formData: FormData
): Promise<GuestFormState> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "").trim();
  const namesText = String(formData.get("names") ?? "").slice(0, MAX_NAMES_TEXT);

  const invitation = await getInvitationBySlug(slug).catch(() => null);

  if (!invitation) {
    return { status: "error", message: "Undangan tidak ditemukan." };
  }

  const names = parseGuestNames(namesText, MAX_GUESTS_PER_INVITATION);

  if (names.length === 0) {
    return {
      status: "error",
      message: "Belum ada nama yang bisa ditambahkan. Tulis satu nama per baris.",
    };
  }

  const { added, skipped, error } = await addGuestRows(invitation.id, names);

  if (error) {
    return { status: "error", message: error };
  }

  // Halaman pengelola dibaca ulang supaya daftarnya langsung ikut berubah.
  revalidatePath(`/admin/undangan/${slug}`);

  return {
    status: "success",
    message:
      skipped > 0
        ? `${added} tamu ditambahkan, ${skipped} dilewati karena sudah ada.`
        : `${added} tamu ditambahkan.`,
  };
}

/**
 * Menghapus satu tamu dari daftar.
 *
 * Tautan yang sudah terlanjur dikirim ke tamu itu TIDAK mati: nama pada tautan
 * tetap terbaca oleh `resolveGuestName()` walau barisnya sudah tidak ada. Yang
 * hilang hanya pelacakan status RSVP-nya di panel ini.
 */
export async function deleteGuest(
  _prev: GuestFormState,
  formData: FormData
): Promise<GuestFormState> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "").trim();
  const guestId = String(formData.get("guestId") ?? "").trim();

  const invitation = await getInvitationBySlug(slug).catch(() => null);

  if (!invitation || !guestId) {
    return { status: "error", message: "Tamu tidak ditemukan." };
  }

  const { error } = await deleteGuestRow(invitation.id, guestId);

  if (error) {
    return { status: "error", message: error };
  }

  revalidatePath(`/admin/undangan/${slug}`);

  return { status: "success", message: "Tamu dihapus." };
}
