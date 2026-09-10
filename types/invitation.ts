/**
 * Tipe data untuk aplikasi Undangan Digital
 *
 * Catatan penamaan:
 * - Interface berakhiran `Row` = bentuk mentah baris tabel Supabase (snake_case).
 *   Bentuk ini dicocokkan dengan tabel yang SUDAH ADA di project Supabase
 *   (lihat skema lengkap di `lib/invitation.ts`), jadi jangan diubah tanpa
 *   mengubah tabelnya juga.
 * - Interface tanpa akhiran (`Person`, `WeddingEvent`) = isi kolom JSONB dan
 *   tipe bantu untuk UI. Bentuk JSONB bebas ditentukan aplikasi.
 *
 * CATATAN GAYA KUNCI JSONB: field foto memakai snake_case (`photo_url`,
 * `cover_photo_url`, `gallery_urls`) sesuai kesepakatan, sementara field lama
 * memakai camelCase (`fullName`, `venueName`, `startTime`). Campuran ini
 * disengaja agar data yang sudah ada tidak perlu dimigrasi; ikuti gaya yang
 * sudah tertulis di sini saat menambah field baru.
 */

import type { TierType } from "@/config/themes";

// ============================================
// Data Pengantin
// ============================================

export interface Person {
  /** Nama lengkap pengantin */
  fullName: string;
  /** Nama panggilan, misal: "Reno" & "Dina" */
  nickName: string;
  /** Nama putra/putri terakhir, misal: "Putra pertama dari Budi & Sari" */
  childOf?: string;
  /** Foto pengantin (URL penuh, dipakai sebagai avatar di halaman undangan) */
  photo_url?: string;
  /** Instagram pengantin (username tanpa @) */
  instagram?: string;
}

// ============================================
// Acara
// ============================================

export type EventName =
  | "akad"
  | "resepsi"
  | "ngunduh_mantu"
  | "lainnya";

export interface WeddingEvent {
  /** Jenis acara, misal: "akad", "resepsi" */
  name: EventName | string;
  /** Label tampilan, misal: "Akad Nikah", "Resepsi" */
  label: string;
  /** Tanggal pelaksanaan (ISO 8601), misal: "2026-11-20" */
  date: string;
  /** Waktu mulai, misal: "08.00 WIB" */
  startTime: string;
  /** Waktu selesai, misal: "11.00 WIB" */
  endTime?: string;
  /** Nama tempat acara */
  venueName: string;
  /** Alamat lengkap */
  address: string;
  /** Link Google Maps */
  mapsUrl?: string;
}

// ============================================
// Isi kolom JSONB `event_data`
// ============================================

/**
 * Isi kolom `invitations.event_data`.
 *
 * Tabel tidak punya kolom khusus untuk daftar acara maupun kutipan, jadi
 * keduanya disimpan dalam satu objek JSONB di sini. `events` berbentuk array
 * agar satu undangan bisa memuat akad + resepsi sekaligus, dengan urutan
 * tampil mengikuti urutan array.
 */
export interface EventData {
  events: WeddingEvent[];
  /** Kutipan / ayat pembuka undangan */
  quote?: string;
  /** Foto sampul (hero) yang tampil di belakang nama mempelai */
  cover_photo_url?: string;
  /**
   * Foto galeri kenangan. Jumlahnya dibatasi `getTierFeatures(tier).maxPhotos`
   * saat undangan dibuat, jadi array ini tidak pernah lebih panjang dari kuota
   * paket yang berlaku ketika data disimpan.
   */
  gallery_urls?: string[];
}

// ============================================
// Isi kolom JSONB `payment_data`
// ============================================

/** Satu rekening bank atau akun e-wallet untuk amplop digital. */
export interface PaymentAccount {
  /** Nama bank atau e-wallet, misal: "BCA", "GoPay" */
  bank: string;
  /** Nomor rekening atau nomor HP e-wallet */
  number: string;
  /** Nama pemilik rekening */
  holder: string;
}

/**
 * Isi kolom `invitations.payment_data`.
 *
 * Kolomnya bertipe JSONB dengan default `{}`, jadi `accounts` bisa tidak ada
 * sama sekali pada undangan lama — komponen wajib memperlakukannya opsional.
 */
export interface PaymentData {
  accounts?: PaymentAccount[];
}

// ============================================
// RSVP
// ============================================

/**
 * Nilai `rsvps.status` yang diizinkan database.
 *
 * Kolomnya punya check constraint yang hanya menerima kedua nilai ini — tidak
 * ada opsi "ragu"/"mungkin". Label bahasa Indonesia-nya ada di komponen form.
 */
export type RsvpStatus = "attending" | "declined";

// ============================================
// Bentuk Baris Tabel Supabase (snake_case)
// ============================================

/**
 * Baris tabel `invitations`.
 *
 * Data pengantin dipisah ke dua kolom JSONB (`groom_data`, `bride_data`),
 * sementara acara + kutipan berada di `event_data`.
 */
export interface InvitationRow {
  id: string;
  /** Slug unik untuk URL undangan, misal: "reno-dina" */
  slug: string;
  /** Paket yang dibeli klien; menentukan fitur yang aktif */
  tier: TierType;
  /** ID tema, dicocokkan dengan katalog di `config/themes.ts` */
  theme_id: string;
  /** JSONB, wajib ada */
  groom_data: Person;
  /** JSONB, wajib ada */
  bride_data: Person;
  /** JSONB, wajib ada */
  event_data: EventData;
  /** JSONB, default `{}` — rekening & e-wallet untuk amplop digital */
  payment_data: PaymentData;
  /** JSONB, default `{}` — penimpaan warna/font per undangan, belum dipakai */
  theme_config: Record<string, unknown>;
  /** URL musik latar; hanya relevan untuk paket VIP (`customMusic`) */
  music_url: string | null;
  created_at: string;
}

/**
 * Baris tabel `wishes` (buku ucapan).
 * Terhubung ke undangan lewat `invitation_id` (UUID), bukan slug.
 * Tabel ini tidak punya kolom moderasi, jadi ucapan langsung tampil.
 */
export interface WishRow {
  id: string;
  invitation_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

/** Baris tabel `rsvps`. */
export interface RsvpRow {
  id: string;
  invitation_id: string;
  guest_name: string;
  status: RsvpStatus;
  /** Jumlah orang yang datang; default `1` di database */
  headcount: number;
  created_at: string;
}

/**
 * Baris tabel `guests` — daftar tamu yang diundang.
 *
 * Dipakai panel `/admin/undangan/[slug]` untuk membuat tautan personal
 * (`?to=nama.a1b2c3`) dan melacak siapa yang belum menjawab. Tabelnya tertutup
 * bagi anon key: hanya service role yang boleh membacanya.
 */
export interface GuestRow {
  id: string;
  invitation_id: string;
  name: string;
  created_at: string;
}
