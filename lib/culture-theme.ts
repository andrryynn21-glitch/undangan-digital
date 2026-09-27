/**
 * Penyusunan ThemeConfig akhir dari tema dasar + dua lapis override.
 *
 * Urutannya: tema dasar -> warna dari gambar acuan -> override adat.
 *
 * URUTAN INI DISENGAJA, DAN ADAT YANG MENANG. Kalau admin memilih "Jawa", dia
 * memilihnya karena alasan budaya, bukan estetika — warna batik tidak boleh
 * digeser oleh warna yang kebetulan menonjol di sebuah foto. Gambarnya tetap
 * tampil sebagai latar sampul. Bila tradisinya "modern" (tanpa override warna),
 * warna dari gambar berlaku penuh.
 *
 * Keduanya bersifat parsial: properti yang tidak disebut tetap dari tema dasar.
 * Undangan lama yang `theme_config`-nya `{}` melewati kedua lapis ini tanpa
 * perubahan sama sekali.
 */

import {
  getTraditionOverride,
} from "@/config/cultures";
import type { CulturalData } from "@/config/cultures";
import type { ThemeCanvasTokens, ThemeColors, ThemeConfig } from "@/config/themes";
import {
  ensureReadableColors,
  forceContrast,
  hexToRgb,
  hslToRgb,
  parseDerivedPalette,
  relativeLuminance,
  resolvePaletteColors,
  rgbToHex,
  rgbToHsl,
} from "@/lib/palette";
import type { DerivedPalette } from "@/lib/palette";

/**
 * Membaca data budaya dari `theme_config` JSONB dengan aman.
 * Mengembalikan `null` bila field tidak ada atau bentuknya tidak valid —
 * undangan lama yang tidak punya data budaya harus tetap dirender normal.
 */
export function parseCulturalData(
  raw: Record<string, unknown>
): CulturalData | null {
  const tradition = raw.tradition;
  const region = raw.region;

  if (typeof tradition !== "string" || tradition.length === 0) return null;

  return {
    tradition,
    region: typeof region === "string" ? region : "",
  };
}

/**
 * Data gambar acuan tema yang tersimpan di `theme_config` JSONB.
 *
 * Dua bagian yang sengaja dipisah: `backgroundUrl` dipakai untuk menampilkan
 * gambarnya, `palette` untuk mewarnai undangan. Salah satunya boleh ada tanpa
 * yang lain — gambar yang terlalu pucat menghasilkan `palette: null` tapi tetap
 * layak tampil sebagai latar sampul.
 */
export interface ThemeImageData {
  backgroundUrl: string | null;
  palette: DerivedPalette | null;
}

/**
 * Membaca data gambar acuan dari `theme_config` JSONB dengan aman.
 *
 * Undangan lama tidak punya field ini sama sekali, jadi keduanya `null` dan
 * tampilannya tidak berubah sedikit pun.
 */
export function parseThemeImageData(
  raw: Record<string, unknown>
): ThemeImageData {
  const url = raw.backgroundUrl;

  return {
    backgroundUrl:
      typeof url === "string" && /^https?:\/\//.test(url) ? url : null,
    palette: parseDerivedPalette(raw.palette),
  };
}

/**
 * Terapkan warna hasil pembacaan gambar ke ThemeConfig dasar.
 *
 * Hanya warna yang berubah; font dan gaya bingkai tetap milik tema dasar.
 * Warna bisa diukur dari gambar, "rasa" tipografi tidak.
 *
 * CATATAN: `ensureReadableColors` sengaja TIDAK dipanggil di sini. Pipeline
 * memanggilnya di tahap akhir, supaya ada satu titik koreksi kontras terakhir
 * untuk semua warna — dari gambar maupun dari tema dasar. Kalau dipanggil di
 * dua tempat, kontras bisa dihitung dua kali dengan acuan berbeda dan
 * hasilnya sulit dilacak.
 */
export function applyPaletteOverride(
  base: ThemeConfig,
  palette: DerivedPalette | null
): ThemeConfig {
  if (!palette) return base;

  return { ...base, colors: resolvePaletteColors(base.colors, palette) };
}

/**
 * Tahap terakhir pipeline tema: jamin semua warna akhirnya terbaca.
 *
 * Dipanggil setelah override gambar DAN override adat, karena kedua lapis
 * itu sama-sama bisa membawa warna yang belum pernah diuji kontrasnya —
 * terutama override adat yang menimpa `primary`/`accent` dengan warna
 * budayanya sendiri.
 */
export function ensureReadableTheme(theme: ThemeConfig): ThemeConfig {
  return { ...theme, colors: ensureReadableColors(theme.colors) };
}

/**
 * Terapkan override budaya ke ThemeConfig dasar.
 *
 * Bila `culturalData` null (undangan lama / modern), tema dasar dikembalikan
 * apa adanya. Bila ada, properti yang didefinisikan override menimpa tema dasar;
 * properti yang tidak ada di override tetap dari tema dasar.
 *
 * TOKEN KANVAS WAJIB DIHITUNG ULANG
 *
 * Override adat menimpa `background` dan `text` dengan warna budayanya
 * sendiri (krem untuk Jawa, hijau muda untuk Sunda, dst). Kalau token
 * `canvas` bawaan dari langkah gambar tidak ikut dihitung ulang, tema
 * berakhir dengan dua kebenaran yang saling bertentangan: `background`
 * krem tetapi `canvas.mode` masih "dark".
 *
 * Akibatnya nyata dan tidak halus: aturan CSS `[data-theme-canvas="dark"]`
 * menyetel kaca dan border untuk latar gelap, sementara latarnya krem
 * terang. Kartu jadi gelap di atas krem — persis masalah "terasa jelek"
 * yang seharusnya dipecahkan oleh override adat ini.
 *
 * Jadi setiap kali `background` berubah, mode ikut disetel ulang dari
 * warna background yang FINAL, bukan dari gambar yang sudah tidak berlaku.
 */
export function applyCulturalOverride(
  base: ThemeConfig,
  culturalData: CulturalData | null
): ThemeConfig {
  if (!culturalData) return base;

  const override = getTraditionOverride(culturalData.tradition);

  const colors = override.colors
    ? { ...base.colors, ...override.colors }
    : base.colors;

  // Cukup noticing bahwa override tersebut punya `background` — kalau
  // tidak, mode dari langkah gambar sudah benar dan tidak boleh diubah.
  const backgroundOverridden = override.colors?.background !== undefined;

  return {
    ...base,
    colors: backgroundOverridden
      ? { ...colors, canvas: canvasFor(colors) }
      : colors,
    fonts: override.fonts ? { ...base.fonts, ...override.fonts } : base.fonts,
    frameStyle: override.frameStyle ?? base.frameStyle,
  };
}

/**
 * Token kanvas untuk sekumpulan warna yang sudah final.
 *
 * Mode disimpulkan dari terang/gelapnya `background` yang dipakai, dan
 * warna turunannya diturunkan dari warna-warna itu sendiri — bukan dari
 * gambar, karena gambar sudah tidak lagi menentukan warna di titik ini.
 */
function canvasFor(colors: ThemeColors): ThemeCanvasTokens {
  const background = hexToRgb(colors.background);
  const text = hexToRgb(colors.text);
  const dark = background ? relativeLuminance(background) <= 0.5 : false;

  const [hue, saturation] = background ? rgbToHsl(background) : [0, 0];
  const gold = hexToRgb(colors.accent) ?? background ?? [200, 170, 90];

  // `primary` dipakai sebagai isian solid tombol, jadi teks tombol dihitung
  // terhadap `primary` itu sendiri — bukan terhadap latar halaman.
  const primary = forceContrast(
    hexToRgb(colors.primary) ?? background ?? [0, 0, 0],
    background ?? [255, 255, 255],
    4.5
  );

  // Permukaan: satu langkah dari latar ke arah teks, lalu dikoreksi agar
  // teks di atasnya tetap terbaca.
  const surface = forceContrast(
    hslToRgb(hue, Math.min(saturation, 0.3), dark ? 0.16 : 0.95),
    text ?? (dark ? [255, 255, 255] : [0, 0, 0]),
    4.5
  );

  return {
    mode: dark ? "dark" : "light",
    surface: rgbToHex(surface),
    border: rgbToHex(
      hslToRgb(hue, Math.min(saturation, 0.3), dark ? 0.3 : 0.86)
    ),
    muted: colors.text,
    gold: rgbToHex(gold),
    onPrimary: relativeLuminance(primary) > 0.45 ? "#12100E" : "#FFFDF9",
  };
}
