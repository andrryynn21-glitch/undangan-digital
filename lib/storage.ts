/**
 * Unggah foto undangan ke Supabase Storage.
 *
 * Alur unggah (sejak `/admin` punya autentikasi):
 *
 *   1. Browser meminta tiket ke `createPhotoUploadTicket()` — Server Action yang
 *      memverifikasi sesi admin lebih dulu, lalu menerbitkan token unggah sekali
 *      pakai memakai service role.
 *   2. Browser mengunggah berkasnya sendiri dengan token itu lewat
 *      `uploadToSignedUrl`, jadi file besar tetap tidak melewati batas 1MB body
 *      Server Action.
 *   3. URL publik hasilnya dititipkan ke `<input type="hidden">` oleh
 *      `components/admin/PhotoUpload.tsx`, sehingga Server Action pembuat
 *      undangan tetap hanya menerima string URL seperti sebelumnya.
 *
 * Anon key kini TIDAK punya izin menulis ke bucket sama sekali — token dari
 * langkah 1-lah yang memberi izin, satu berkas untuk satu path.
 *
 * PENYIAPAN DI SUPABASE: lihat `supabase/storage-setup.sql` (bucket + policy
 * baca publik) dan `supabase/security_rls.sql` (RLS tabel).
 */

import { createPhotoUploadTicket } from "@/lib/photo-actions";
import {
  MAX_PHOTO_BYTES,
  PHOTO_BUCKET,
  formatMegabytes,
  validatePhotoFile,
} from "@/lib/photo-rules";
import type { PhotoKind } from "@/lib/photo-rules";
import { getSupabaseBrowserClient } from "@/lib/supabase";

// Aturan foto (batas ukuran, format, penyusunan path) tinggal di
// `lib/photo-rules.ts` agar bisa dipakai browser dan server tanpa impor
// melingkar. Diteruskan di sini supaya pemanggil lama tidak perlu berubah.
export {
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  PHOTO_BUCKET,
  buildPhotoPath,
  validatePhotoFile,
} from "@/lib/photo-rules";
export type { PhotoKind } from "@/lib/photo-rules";

/** Menerjemahkan error Storage ke pesan berbahasa Indonesia yang actionable. */
function translateError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("bucket not found")) {
    return `Bucket "${PHOTO_BUCKET}" belum ada di Supabase. Jalankan dulu supabase/storage-setup.sql.`;
  }

  // Token unggah punya masa berlaku. Kalau form dibiarkan terbuka sangat lama,
  // tiketnya bisa kedaluwarsa sebelum berkasnya terkirim.
  if (
    lower.includes("jwt") ||
    lower.includes("expired") ||
    lower.includes("invalid signature") ||
    lower.includes("invalid token")
  ) {
    return "Izin unggah sudah kedaluwarsa. Coba pilih foto itu sekali lagi.";
  }

  if (lower.includes("row-level security") || lower.includes("unauthorized")) {
    return `Supabase menolak unggahan ke bucket "${PHOTO_BUCKET}". Pastikan sesi admin masih aktif, lalu coba lagi.`;
  }

  if (lower.includes("exceeded the maximum allowed size")) {
    return `Ukuran foto melebihi batas ${formatMegabytes(MAX_PHOTO_BYTES)} yang diizinkan bucket.`;
  }

  if (lower.includes("mime type") || lower.includes("content type")) {
    return "Jenis berkas ini tidak diizinkan bucket. Gunakan JPG, PNG, WebP, AVIF, atau GIF.";
  }

  if (lower.includes("already exists")) {
    return "Nama berkas bertabrakan di Storage. Coba pilih foto itu sekali lagi.";
  }

  return `Gagal mengunggah foto: ${message}`;
}

/**
 * Mengunggah satu file ke bucket dan mengembalikan URL publiknya.
 *
 * Tanda tangan fungsi ini tidak berubah sejak jalur unggah pindah ke signed
 * URL, jadi `PhotoUpload` / `PhotoUploadMulti` memakainya seperti biasa.
 */
export async function uploadPhoto(
  file: File,
  kind: PhotoKind,
  slug: string
): Promise<{ url?: string; error?: string }> {
  const invalid = validatePhotoFile(file);
  if (invalid) return { error: invalid };

  try {
    // Path & token ditentukan server; klien tidak boleh memilih lokasi berkas.
    const ticket = await createPhotoUploadTicket(kind, slug, file.type);

    if (ticket.error) return { error: ticket.error };

    if (!ticket.path || !ticket.token) {
      return { error: "Server tidak mengembalikan izin unggah yang lengkap." };
    }

    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .uploadToSignedUrl(ticket.path, ticket.token, file, {
        contentType: file.type,
      });

    if (error) return { error: translateError(error.message) };

    const { data } = supabase.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(ticket.path);

    if (!data?.publicUrl) {
      return { error: "Foto terunggah tetapi URL publiknya tidak terbaca." };
    }

    return { url: data.publicUrl };
  } catch (error) {
    // Termasuk kasus konfigurasi Supabase belum diisi di `.env.local`.
    const message =
      error instanceof Error ? error.message : "Kesalahan tidak diketahui.";

    return { error: translateError(message) };
  }
}
