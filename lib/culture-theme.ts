/**
 * Merge cultural override ke ThemeConfig dasar.
 *
 * Fungsi ini menerima tema yang sudah dipilih admin (dari config/themes.ts) dan
 * data budaya yang tersimpan di kolom `theme_config` JSONB. Hasilnya adalah
 * ThemeConfig lengkap dengan warna, font, dan frameStyle yang mencerminkan
 * tradisi yang dipilih — sementara field lain (id, name, previewImage, dll.)
 * tetap dari tema dasar supaya sistem tema yang sudah ada tidak rusak.
 *
 * Override bersifat parsial: kalau tradisi hanya mendefinisikan colors tapi
 * tidak fonts, maka font tetap dari tema dasar. Ini berarti "Modern/Nasional"
 * (yang tidak punya override sama sekali) menghasilkan output identik dengan
 * tema dasar.
 */

import {
  getTraditionOverride,
} from "@/config/cultures";
import type { CulturalData } from "@/config/cultures";
import type { ThemeConfig } from "@/config/themes";

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
