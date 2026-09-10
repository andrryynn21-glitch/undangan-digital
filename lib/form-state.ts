/**
 * Bentuk state untuk form yang memakai `useActionState`.
 *
 * Terpisah dari `lib/actions.ts` karena file bertanda `"use server"` hanya boleh
 * mengekspor fungsi async — mengekspor objek konstanta dari sana membuat Next
 * gagal saat modulnya masuk ke graph server ("A `use server` file can only
 * export async functions, found object").
 */

export interface RsvpFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export const RSVP_INITIAL_STATE: RsvpFormState = {
  status: "idle",
  message: "",
};

export interface LoginFormState {
  status: "idle" | "error";
  message: string;
}

/**
 * Tidak punya status "success": login yang berhasil diakhiri `redirect()` ke
 * `/admin`, jadi form-nya tidak pernah dirender ulang dengan state sukses.
 */
export const LOGIN_INITIAL_STATE: LoginFormState = {
  status: "idle",
  message: "",
};

export interface CreateInvitationState {
  status: "idle" | "success" | "error";
  message: string;
  /** Slug undangan yang baru dibuat, untuk ditampilkan sebagai tautan */
  slug?: string;
}

export const CREATE_INVITATION_INITIAL_STATE: CreateInvitationState = {
  status: "idle",
  message: "",
};

/**
 * State bersama untuk kedua aksi daftar tamu (tambah & hapus).
 *
 * Satu bentuk untuk keduanya disengaja: panel tamu hanya punya satu tempat
 * menampilkan pesan, jadi aksi mana pun yang terakhir dijalankan boleh
 * mengisinya tanpa perlu dua area pesan yang saling bersaing.
 */
export interface GuestFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export const GUEST_INITIAL_STATE: GuestFormState = {
  status: "idle",
  message: "",
};

/**
 * Batas jumlah rekening amplop digital per undangan.
 *
 * Dipakai bersama oleh form admin (untuk mematikan tombol "Tambah Rekening")
 * dan Server Action (sebagai validasi sungguhan), supaya keduanya tidak pernah
 * berbeda angka.
 */
export const MAX_PAYMENT_ACCOUNTS = 6;
