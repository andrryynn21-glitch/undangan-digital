/**
 * Pembersihan berkas undangan di Supabase Storage — khusus server.
 *
 * Dipisah dari `lib/storage.ts` karena berkas itu diimpor komponen klien
 * (`PhotoUpload`, `MusicUpload`) dan memakai anon key lewat browser. Fungsi di
 * sini memakai service role, yang tidak boleh sampai ikut terbawa ke bundel
 * browser. Juga bukan `"use server"`: ini bukan Server Action yang boleh
 * dipanggil dari luar, hanya penolong yang dipakai `lib/actions.ts`.
 */

import { PHOTO_BUCKET } from "@/lib/photo-rules";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Menghapus seluruh isi folder `{slug}/` di bucket.
 *
 * Supabase Storage tidak punya "hapus folder": yang ada hanya menghapus daftar
 * path. Jadi isinya didaftar dulu, baru dihapus sekaligus.
 *
 * Foto undangan yang dibuat sebelum penamaan berbasis folder tidak ikut
 * terhapus, dan itu memang tidak bisa dihindari — namanya tidak menyimpan jejak
 * undangan asalnya. Sisa berkas seperti itu tidak mengganggu apa pun selain
 * memakan ruang.
 */
export async function deleteInvitationFiles(
  slug: string
): Promise<{ error: string | null }> {
  try {
    const storage = getSupabaseAdmin().storage.from(PHOTO_BUCKET);

    const { data, error } = await storage.list(slug, { limit: 1000 });

    if (error) return { error: error.message };

    if (!data || data.length === 0) return { error: null };

    const paths = data.map((file) => `${slug}/${file.name}`);

    const { error: removeError } = await storage.remove(paths);

    return { error: removeError ? removeError.message : null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Storage tidak tersedia.",
    };
  }
}
