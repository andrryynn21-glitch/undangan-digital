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
import type { ThemeConfig } from "@/config/themes";
import { parseDerivedPalette, resolvePaletteColors } from "@/lib/palette";
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
 */
export function applyPaletteOverride(
  base: ThemeConfig,
  palette: DerivedPalette | null
): ThemeConfig {
  if (!palette) return base;

  return { ...base, colors: resolvePaletteColors(base.colors, palette) };
}

/**
 * Terapkan override budaya ke ThemeConfig dasar.
 *
 * Bila `culturalData` null (undangan lama / modern), tema dasar dikembalikan
 * apa adanya. Bila ada, properti yang didefinisikan override menimpa tema dasar;
 * properti yang tidak ada di override tetap dari tema dasar.
 */
export function applyCulturalOverride(
  base: ThemeConfig,
  culturalData: CulturalData | null
): ThemeConfig {
  if (!culturalData) return base;

  const override = getTraditionOverride(culturalData.tradition);

  return {
    ...base,
    colors: override.colors ? { ...base.colors, ...override.colors } : base.colors,
    fonts: override.fonts ? { ...base.fonts, ...override.fonts } : base.fonts,
    frameStyle: override.frameStyle ?? base.frameStyle,
  };
}
