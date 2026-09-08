/**
 * Aturan foto undangan yang berlaku di kedua sisi.
 *
 * Dipisah dari `lib/storage.ts` karena tiga pihak membutuhkannya sekaligus:
 * komponen di browser (validasi cepat sebelum mengunggah), Server Action
 * penerbit tiket unggah (menyusun path), dan `lib/storage.ts` sendiri. Kalau
 * semuanya tetap di `lib/storage.ts`, Server Action dan `lib/storage.ts` akan
 * saling mengimpor — impor melingkar.
 *
 * Berkas ini murni: tidak menyentuh Supabase, tidak memegang rahasia apa pun.
 */

/** Nama bucket tempat semua foto undangan disimpan. */
export const PHOTO_BUCKET = "invitation-photos";

/**
 * Batas ukuran satu foto.
 * Harus sama dengan `file_size_limit` bucket — nilai di sini hanya untuk
 * memberi pesan error yang cepat & ramah sebelum file dikirim.
 */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Format gambar yang diterima; harus sama dengan `allowed_mime_types` bucket. */
export const ACCEPTED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

/** Jenis foto, dipakai sebagai awalan nama berkas agar mudah dikenali. */
export const PHOTO_KINDS = ["groom", "bride", "cover", "gallery"] as const;

export type PhotoKind = (typeof PHOTO_KINDS)[number];

/**
 * Izin unggah satu berkas yang diterbitkan backend.
 *
 * Tipenya ditaruh di sini, bukan di `lib/photo-actions.ts`, karena berkas
 * bertanda `"use server"` sebaiknya hanya mengekspor fungsi async.
 */
export interface PhotoUploadTicket {
  /** Path objek di dalam bucket; harus dipakai apa adanya saat mengunggah. */
  path?: string;
  /** Token unggah sekali pakai untuk `uploadToSignedUrl`. */
  token?: string;
  error?: string;
}

/** Ekstensi berkas untuk tiap MIME type yang didukung. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export function formatMegabytes(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

/** Apakah nilai ini salah satu jenis foto yang dikenal. */
export function isPhotoKind(value: string): value is PhotoKind {
  return (PHOTO_KINDS as readonly string[]).includes(value);
}

/** Apakah MIME type ini termasuk format gambar yang diterima. */
export function isAcceptedPhotoType(value: string): boolean {
  return (ACCEPTED_PHOTO_TYPES as readonly string[]).includes(value);
}

/**
 * Memeriksa satu file sebelum diunggah.
 * Mengembalikan pesan error, atau `null` bila file lolos.
 */
export function validatePhotoFile(file: File): string | null {
  if (!isAcceptedPhotoType(file.type)) {
    return `"${file.name}" bukan gambar yang didukung. Gunakan JPG, PNG, WebP, AVIF, atau GIF.`;
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return `"${file.name}" berukuran ${formatMegabytes(
      file.size
    )}, melebihi batas ${formatMegabytes(MAX_PHOTO_BYTES)} per foto.`;
  }

  return null;
}

/**
 * Menyusun path objek di dalam bucket: `<slug>/<jenis>-<acak>.<ekstensi>`.
 *
 * Nama berkas asli sengaja dibuang — namanya bisa memuat spasi, unicode, atau
 * karakter yang tidak valid sebagai key Storage, dan dua admin bisa mengunggah
 * berkas dengan nama sama. Slug yang belum diisi memakai folder `draft`.
 *
 * Slug disaring dengan pola ketat, jadi path hasil fungsi ini tidak pernah bisa
 * keluar dari foldernya sendiri walau slug-nya datang dari luar.
 */
export function buildPhotoPath(
  kind: PhotoKind,
  slug: string,
  mimeType: string
): string {
  const folder = slug.length > 0 && /^[a-z0-9-]+$/.test(slug) ? slug : "draft";
  const extension = EXTENSIONS[mimeType] ?? "jpg";

  return `${folder}/${kind}-${crypto.randomUUID()}.${extension}`;
}
