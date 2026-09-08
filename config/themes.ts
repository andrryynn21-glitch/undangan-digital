/**
 * Theme Engine & Batasan Paket (Tier)
 *
 * Sumber data tema adalah file JSON di `config/themes/*.json`
 * (single source of truth). File ini hanya:
 * - mendefinisikan tipe & kontrak tema
 * - memvalidasi JSON tersebut menjadi `ThemeConfig` yang aman dipakai
 * - menyediakan batasan fitur per paket (Silver / Premium / VIP)
 *
 * MENAMBAH TEMA BARU:
 * 1. Buat `config/themes/<id>.json` mengikuti bentuk `ThemeConfig`.
 * 2. Import di blok "Registry" di bawah dan daftarkan ke `THEME_SOURCES`.
 *
 * Import statis dipakai (bukan baca folder saat runtime) supaya tema ikut
 * ter-bundle dan aman di serverless/edge, serta JSON yang salah bentuk
 * langsung gagal saat build — bukan saat tamu membuka undangan.
 */

import floralRomanticJson from "./themes/floral-romantic.json";
import minimalGoldJson from "./themes/minimal-gold.json";

// ============================================
// Tipe Dasar
// ============================================

/** Urutan paket dari yang paling rendah ke paling tinggi. */
export const TIERS = ["silver", "premium", "vip"] as const;

export type TierType = (typeof TIERS)[number];

/**
 * Gaya bingkai/ornamen yang dipakai komponen undangan.
 * Menambah nilai baru di sini berarti komponen frame-nya juga harus dibuat.
 */
export const FRAME_STYLES = ["arch", "floral", "minimalist"] as const;

export type FrameStyle = (typeof FRAME_STYLES)[number];

export interface ThemeColors {
  /** Warna utama: heading, tombol utama, aksen kuat */
  primary: string;
  /** Warna pendukung: kartu, panel, pembatas */
  secondary: string;
  /** Warna latar halaman */
  background: string;
  /** Warna teks utama di atas `background` */
  text: string;
  /** Warna aksen: ikon, garis ornamen, highlight */
  accent: string;
}

export interface ThemeFonts {
  /** Font untuk judul & nama pengantin (CSS font-family) */
  headingFont: string;
  /** Font untuk isi/paragraf (CSS font-family) */
  bodyFont: string;
}

export interface ThemeConfig {
  /** ID unik tema, dipakai di URL & database. Contoh: "minimal-gold" */
  id: string;
  /** Nama tampilan tema di galeri pemilihan tema */
  name: string;
  /** Path gambar preview (relatif terhadap folder `public/`) */
  previewImage: string;
  /** Paket MINIMUM yang boleh memakai tema ini (berlaku untuk tier di atasnya juga) */
  tierRequirement: TierType;
  colors: ThemeColors;
  fonts: ThemeFonts;
  frameStyle: FrameStyle;
}

/** Batasan fitur yang berlaku untuk sebuah paket. */
export interface TierFeatures {
  /** Jumlah maksimum foto di galeri */
  maxPhotos: number;
  /** RSVP tamu disimpan ke database (bukan hanya link WhatsApp) */
  rsvpToDb: boolean;
  /** Boleh mengunggah musik latar sendiri */
  customMusic: boolean;
  /** Buku ucapan tampil realtime tanpa reload */
  wishbookRealtime: boolean;
}

// ============================================
// Parser / Validator Tema
// ============================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  source: Record<string, unknown>,
  key: string,
  path: string
): string {
  const value = source[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`[themes] Field "${path}${key}" wajib berupa string.`);
  }
  return value;
}

/**
 * Memvalidasi objek tema mentah (hasil `import` file JSON, fetch dari database,
 * atau upload admin) menjadi `ThemeConfig` yang aman dipakai.
 *
 * @throws Error bila ada field yang hilang atau nilainya tidak valid.
 */
export function parseThemeConfig(raw: unknown): ThemeConfig {
  if (!isRecord(raw)) {
    throw new Error("[themes] Data tema harus berupa objek.");
  }

  const tierRequirement = requireString(raw, "tierRequirement", "");
  if (!TIERS.includes(tierRequirement as TierType)) {
    throw new Error(
      `[themes] tierRequirement "${tierRequirement}" tidak valid. Pilihan: ${TIERS.join(", ")}.`
    );
  }

  const frameStyle = requireString(raw, "frameStyle", "");
  if (!FRAME_STYLES.includes(frameStyle as FrameStyle)) {
    throw new Error(
      `[themes] frameStyle "${frameStyle}" tidak valid. Pilihan: ${FRAME_STYLES.join(", ")}.`
    );
  }

  if (!isRecord(raw.colors)) {
    throw new Error('[themes] Field "colors" wajib berupa objek.');
  }
  if (!isRecord(raw.fonts)) {
    throw new Error('[themes] Field "fonts" wajib berupa objek.');
  }

  const colors = raw.colors;
  const fonts = raw.fonts;

  return {
    id: requireString(raw, "id", ""),
    name: requireString(raw, "name", ""),
    previewImage: requireString(raw, "previewImage", ""),
    tierRequirement: tierRequirement as TierType,
    colors: {
      primary: requireString(colors, "primary", "colors."),
      secondary: requireString(colors, "secondary", "colors."),
      background: requireString(colors, "background", "colors."),
      text: requireString(colors, "text", "colors."),
      accent: requireString(colors, "accent", "colors."),
    },
    fonts: {
      headingFont: requireString(fonts, "headingFont", "fonts."),
      bodyFont: requireString(fonts, "bodyFont", "fonts."),
    },
    frameStyle: frameStyle as FrameStyle,
  };
}

// ============================================
// Registry Tema (dari file JSON)
// ============================================

/** Daftarkan setiap file `config/themes/*.json` di sini. */
const THEME_SOURCES: unknown[] = [minimalGoldJson, floralRomanticJson];

function buildThemeRegistry(sources: unknown[]): Record<string, ThemeConfig> {
  const registry: Record<string, ThemeConfig> = {};

  for (const source of sources) {
    const theme = parseThemeConfig(source);
    if (registry[theme.id]) {
      throw new Error(
        `[themes] Duplikat id tema "${theme.id}". Setiap tema harus punya id unik.`
      );
    }
    registry[theme.id] = theme;
  }

  return registry;
}

/** Katalog tema, dibangun & divalidasi dari file JSON saat modul dimuat. */
export const THEMES: Record<string, ThemeConfig> =
  buildThemeRegistry(THEME_SOURCES);

/** Tema yang dipakai bila `themeId` tidak dikenali. */
export const DEFAULT_THEME_ID = "minimal-gold";

// ============================================
// Batasan Fitur per Paket
// ============================================

export const TIER_FEATURES: Record<TierType, TierFeatures> = {
  silver: {
    maxPhotos: 5,
    rsvpToDb: false,
    customMusic: false,
    wishbookRealtime: false,
  },
  premium: {
    maxPhotos: 15,
    rsvpToDb: true,
    customMusic: false,
    wishbookRealtime: false,
  },
  vip: {
    maxPhotos: 99,
    rsvpToDb: true,
    customMusic: true,
    wishbookRealtime: true,
  },
};

/** Peringkat numerik paket, dipakai untuk perbandingan "tier ke atas". */
const TIER_RANK: Record<TierType, number> = {
  silver: 1,
  premium: 2,
  vip: 3,
};

// ============================================
// Helper
// ============================================

/**
 * Mengambil konfigurasi tema berdasarkan ID.
 * Bila ID tidak dikenali, dikembalikan `DEFAULT_THEME_ID` agar undangan
 * tetap bisa dirender (tidak pernah melempar error di halaman publik).
 */
export function getThemeConfig(themeId: string): ThemeConfig {
  const theme = THEMES[themeId];
  if (theme) return theme;

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[themes] Tema "${themeId}" tidak ditemukan, memakai "${DEFAULT_THEME_ID}".`
    );
  }

  return THEMES[DEFAULT_THEME_ID];
}

/** Mengembalikan batasan fitur untuk sebuah paket. */
export function getTierFeatures(tier: TierType): TierFeatures {
  return TIER_FEATURES[tier];
}

/** Semua tema dalam bentuk array (untuk galeri pemilihan tema). */
export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}

/**
 * Apakah `userTier` memenuhi `requiredTier` (berlaku "ke atas").
 * Contoh: VIP memenuhi syarat tema Premium.
 */
export function isTierAllowed(
  userTier: TierType,
  requiredTier: TierType
): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}

/** Apakah paket user boleh memakai tema tersebut. */
export function canUseTheme(userTier: TierType, themeId: string): boolean {
  const theme = THEMES[themeId];
  if (!theme) return false;
  return isTierAllowed(userTier, theme.tierRequirement);
}

/** Tema yang terbuka untuk sebuah paket (dipakai di galeri, untuk memfilter). */
export function getThemesForTier(tier: TierType): ThemeConfig[] {
  return getAllThemes().filter((theme) =>
    isTierAllowed(tier, theme.tierRequirement)
  );
}

/**
 * Mengubah tema menjadi CSS custom properties.
 * Dipasang sekali di elemen pembungkus undangan, lalu komponen anak cukup
 * memakai `var(--theme-primary)` dan sejenisnya.
 */
export function getThemeCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--theme-primary": theme.colors.primary,
    "--theme-secondary": theme.colors.secondary,
    "--theme-background": theme.colors.background,
    "--theme-text": theme.colors.text,
    "--theme-accent": theme.colors.accent,
    "--theme-font-heading": theme.fonts.headingFont,
    "--theme-font-body": theme.fonts.bodyFont,
  };
}
