/**
 * Definisi font tema (pola "font definitions file" dari dokumentasi next/font).
 *
 * Setiap font dipanggil SEKALI di sini lalu di-import dari mana pun, karena
 * setiap pemanggilan `next/font/google` membuat instance host tersendiri.
 *
 * Font diekspos sebagai CSS variable, bukan className, sebab nama font
 * dipilih per-undangan lewat JSON tema. `next/font` menghasilkan nama
 * font-family yang di-hash (misal `__Playfair_Display_abc123`), jadi menulis
 * "Playfair Display" secara literal di CSS tidak akan pernah cocok — JSON tema
 * harus menunjuk ke variabelnya.
 *
 * MENAMBAH FONT BARU:
 * 1. Import & panggil di sini dengan `variable: "--font-<nama>"`.
 * 2. Masukkan ke `themeFonts` agar variabelnya ikut terpasang di <html>.
 * 3. Pakai `var(--font-<nama>)` pada `fonts.headingFont`/`bodyFont` di JSON tema.
 */

import {
  Cormorant_Garamond,
  Inter,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from "next/font/google";

/**
 * Opsi tiap font ditulis lengkap (tidak di-spread dari satu konstanta), karena
 * `next/font/google` hanya menerima object literal yang bisa dianalisis statis
 * saat build.
 *
 * `preload: false` disengaja: keempat font ini dideklarasikan di root layout,
 * padahal satu undangan hanya memakai dua di antaranya. Tanpa ini Next akan
 * melakukan preload keempatnya di SEMUA rute. `display: "swap"` membuat teks
 * tetap langsung tampil memakai font fallback.
 */
export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-playfair-display",
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-cormorant-garamond",
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-inter",
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-plus-jakarta-sans",
});

const themeFonts = [
  playfairDisplay,
  cormorantGaramond,
  inter,
  plusJakartaSans,
];

/**
 * Gabungan className semua font tema.
 * Dipasang di elemen `<html>` supaya `var(--font-*)` bisa diakses oleh
 * undangan tema apa pun.
 */
export const themeFontVariables = themeFonts
  .map((font) => font.variable)
  .join(" ");
