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
 *
 * Bucket-nya sendiri kini berbatas 8 MB karena harus menampung musik juga —
 * lihat `supabase/storage-setup.sql`. Angka 5 MB di sini adalah batas khusus
 * foto, ditegakkan sebelum berkas dikirim.
 */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Batas ukuran berkas musik latar.
 * Harus sama dengan `file_size_limit` bucket — inilah berkas terbesar yang
 * boleh masuk, jadi angkanya yang menentukan batas bucket.
 */
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

/** Format gambar yang diterima; harus sama dengan `allowed_mime_types` bucket. */
export const ACCEPTED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

/**
 * Format musik yang diterima; harus sama dengan `allowed_mime_types` bucket.
 *
 * Tiga ini cukup: MP3 (`audio/mpeg`) yang dipakai hampir semua orang, M4A/AAC
 * (`audio/mp4`) yang keluar dari perangkat Apple, dan OGG. Format lain sengaja
 * ditolak — bukan karena tidak bisa diputar, tetapi karena daftar ini harus
 * sama persis dengan yang diizinkan bucket.
 */
export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
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
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
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
 * Nama folder undangan di dalam bucket.
 *
 * Slug disaring dengan pola ketat, jadi path yang dibangun di atasnya tidak
 * pernah bisa keluar dari foldernya sendiri walau slug-nya datang dari luar.
 * Slug yang belum diisi (form yang masih kosong) memakai folder `draft`.
 */
function safeFolder(slug: string): string {
  return slug.length > 0 && /^[a-z0-9-]+$/.test(slug) ? slug : "draft";
}

/**
 * Menyusun path objek di dalam bucket: `<slug>/<jenis>-<acak>.<ekstensi>`.
 *
 * Nama berkas asli sengaja dibuang — namanya bisa memuat spasi, unicode, atau
 * karakter yang tidak valid sebagai key Storage, dan dua admin bisa mengunggah
 * berkas dengan nama sama.
 */
export function buildPhotoPath(
  kind: PhotoKind,
  slug: string,
  mimeType: string
): string {
  const extension = EXTENSIONS[mimeType] ?? "jpg";

  return `${safeFolder(slug)}/${kind}-${crypto.randomUUID()}.${extension}`;
}

/** Apakah MIME type ini termasuk format musik yang diterima. */
export function isAcceptedAudioType(value: string): boolean {
  return (ACCEPTED_AUDIO_TYPES as readonly string[]).includes(value);
}

/**
 * Memeriksa satu berkas musik sebelum diunggah.
 * Mengembalikan pesan error, atau `null` bila berkasnya lolos.
 */
export function validateAudioFile(file: File): string | null {
  if (!isAcceptedAudioType(file.type)) {
    return `"${file.name}" bukan berkas musik yang didukung. Gunakan MP3, M4A, atau OGG.`;
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return `"${file.name}" berukuran ${formatMegabytes(
      file.size
    )}, melebihi batas ${formatMegabytes(MAX_AUDIO_BYTES)}.`;
  }

  return null;
}

/**
 * Path berkas musik: `<slug>/music-<acak>.<ekstensi>`.
 *
 * Sengaja memakai nama acak, bukan `music.mp3` yang tetap: mengganti lagu
 * undangan yang sudah tayang tidak boleh mengubah berkas yang sedang diputar
 * di HP tamu, dan tidak boleh gagal karena berkas dengan nama itu sudah ada.
 */
export function buildAudioPath(slug: string, mimeType: string): string {
  const extension = EXTENSIONS[mimeType] ?? "mp3";

  return `${safeFolder(slug)}/music-${crypto.randomUUID()}.${extension}`;
}
