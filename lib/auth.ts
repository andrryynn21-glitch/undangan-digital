/**
 * Primitif sesi admin: verifikasi password & cookie bertanda tangan.
 *
 * Berkas ini sengaja TIDAK mengimpor apa pun dari `next`, supaya bisa dipakai
 * `proxy.ts` (yang jalan sebelum request masuk ke React) tanpa menarik
 * `next/headers` ke tempat yang tidak semestinya.
 *
 * Sesi berupa cookie stateless bertanda tangan HMAC-SHA256, bukan baris di
 * database — tidak ada tabel sesi yang perlu diurus. Proxy di Next 16 berjalan
 * di runtime Node.js, jadi `node:crypto` tersedia dan tidak perlu menambah
 * dependensi JWT apa pun.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

/** Umur sesi: 8 jam, cukup untuk satu sesi kerja mengisi undangan. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/** Password bawaan yang HANYA berlaku di luar produksi. */
const DEV_FALLBACK_PASSWORD = "admin123";

/**
 * Password admin yang berlaku, atau `null` bila belum dikonfigurasi.
 *
 * Di luar produksi, `ADMIN_PASSWORD` yang kosong jatuh ke `admin123` supaya
 * `next dev` bisa langsung dipakai. Di produksi justru sebaliknya: hasilnya
 * `null` sehingga login SELALU ditolak. Password bawaan yang ikut ter-deploy
 * jauh lebih berbahaya daripada admin yang tidak bisa masuk.
 */
export function getAdminPassword(): string | null {
  const configured = process.env.ADMIN_PASSWORD;

  if (configured && configured.length > 0) return configured;

  return process.env.NODE_ENV === "production" ? null : DEV_FALLBACK_PASSWORD;
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Membandingkan dua string tanpa membocorkan isinya lewat lama eksekusi.
 *
 * Keduanya di-digest lebih dulu agar `timingSafeEqual` selalu menerima buffer
 * 32 byte — fungsi itu melempar bila panjang kedua sisi berbeda, dan panjang
 * password tidak boleh ikut bocor.
 */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/** Apakah password yang dikirim cocok dengan yang dikonfigurasi. */
export function verifyPassword(input: string): boolean {
  const password = getAdminPassword();
  if (!password) return false;

  return safeEqual(input, password);
}

/**
 * Kunci tanda tangan cookie, diturunkan dari password itu sendiri.
 *
 * Konsekuensi yang disengaja: mengganti `ADMIN_PASSWORD` otomatis membatalkan
 * semua cookie sesi yang sudah beredar. Pada skema stateless itulah satu-satunya
 * cara mencabut sesi — dan didapat tanpa perlu env var kedua.
 */
function getSigningKey(password: string): Buffer {
  return sha256(`undangan-admin-session:v1:${password}`);
}

function sign(payload: string, password: string): string {
  return createHmac("sha256", getSigningKey(password))
    .update(payload, "utf8")
    .digest("base64url");
}

/**
 * Membuat token sesi berbentuk `<detik kedaluwarsa>.<tanda tangan>`.
 * `null` bila password belum dikonfigurasi (produksi tanpa `ADMIN_PASSWORD`).
 */
export function createSessionToken(now: number = Date.now()): string | null {
  const password = getAdminPassword();
  if (!password) return null;

  const payload = String(Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS);

  return `${payload}.${sign(payload, password)}`;
}

/**
 * Memeriksa token sesi: tanda tangannya sah DAN belum kedaluwarsa.
 * Dipakai proxy (pengalih cepat) dan DAL (pemeriksaan sungguhan).
 */
export function verifySessionToken(
  token: string | undefined,
  now: number = Date.now()
): boolean {
  if (!token) return false;

  const password = getAdminPassword();
  if (!password) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!/^\d+$/.test(payload)) return false;

  // Tanda tangan diperiksa lebih dulu: nilai `exp` di dalam payload baru boleh
  // dipercaya setelah terbukti bukan karangan orang lain.
  if (!safeEqual(signature, sign(payload, password))) return false;

  return Number(payload) * 1000 > now;
}
