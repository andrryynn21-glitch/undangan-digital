"use server";

import { verifyAdminSession } from "@/lib/auth-session";
import {
  PHOTO_BUCKET,
  buildPhotoPath,
  isAcceptedPhotoType,
  isPhotoKind,
} from "@/lib/photo-rules";
import type { PhotoUploadTicket } from "@/lib/photo-rules";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Penerbit tiket unggah foto.
 *
 * Bucket `invitation-photos` tidak lagi menerima unggahan dari publik. Sebagai
 * gantinya, backend yang sudah memverifikasi sesi admin menerbitkan token
 * unggah sekali pakai (signed upload URL) memakai service role, lalu browser
 * mengunggah dengan token itu. Dengan begitu file besar tetap tidak melewati
 * batas body Server Action, tetapi hanya admin yang bisa menaruh berkas.
 *
 * Kenapa bukan `to authenticated` di policy Storage: sesi admin di aplikasi ini
 * berupa cookie password, bukan JWT Supabase — browser tidak pernah menjadi
 * `authenticated` di mata Supabase, jadi policy semacam itu justru mematikan
 * unggahan.
 */

export async function createPhotoUploadTicket(
  kind: string,
  slug: string,
  mimeType: string
): Promise<PhotoUploadTicket> {
  // Sengaja tidak memakai `requireAdmin()` yang mengalihkan halaman: pemanggil
  // di sini adalah widget unggah, jadi pesan error lebih berguna daripada
  // navigasi mendadak yang membuang isi form yang sedang diisi.
  if (!(await verifyAdminSession())) {
    return {
      error:
        "Sesi admin sudah berakhir. Muat ulang halaman ini lalu login kembali.",
    };
  }

  if (!isPhotoKind(kind)) {
    return { error: `Jenis foto "${kind}" tidak dikenali.` };
  }

  if (!isAcceptedPhotoType(mimeType)) {
    return {
      error: "Jenis berkas ini tidak didukung. Gunakan JPG, PNG, WebP, AVIF, atau GIF.",
    };
  }

  try {
    // Path disusun di server, tidak pernah diterima dari klien — klien yang
    // boleh menentukan path bisa menulis ke lokasi mana pun di bucket.
    const path = buildPhotoPath(kind, slug, mimeType);

    const { data, error } = await getSupabaseAdmin()
      .storage.from(PHOTO_BUCKET)
      .createSignedUploadUrl(path);

    if (error) {
      return { error: `Gagal menyiapkan unggahan: ${error.message}` };
    }

    return { path: data.path, token: data.token };
  } catch (error) {
    // Termasuk kasus SUPABASE_SERVICE_ROLE_KEY belum diisi — pesan aslinya
    // sudah menyebut nama env var-nya.
    return {
      error:
        error instanceof Error
          ? error.message
          : "Gagal menyiapkan unggahan foto.",
    };
  }
}
