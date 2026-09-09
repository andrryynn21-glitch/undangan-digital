/**
 * Konfigurasi tradisi budaya & token visual per adat.
 *
 * Setiap tradisi membawa overrides parsial terhadap ThemeConfig — artinya
 * hanya properti yang didefinisikan di sini yang menimpa tema dasar, sisanya
 * tetap mengikuti tema yang dipilih admin. Pola ini memungkinkan satu tema
 * ("Minimal Gold") tampil dengan corak Jawa, Sunda, Minang, dan seterusnya
 * tanpa perlu membuat file tema baru.
 *
 * Warna dipilih dari motif khas masing-masing daerah:
 * - Jawa     : coklat batik + emas kawung
 * - Sunda    : hijau daun + tembaga
 * - Minang   : merah saga + emas
 * - Betawi   : biru ondel-ondel + emas kuning
 * - Batak    : merah ulos + biru tua
 * - Bugis    : biru laut + emas songket
 * - Bali     : coklat pura + emas
 * - Melayu   : hijau tua + emas
 */

import type { FrameStyle } from "@/config/themes";
import type { ThemeColors, ThemeFonts } from "@/config/themes";

// ============================================
// Tipe
// ============================================

/**
 * Data budaya yang disimpan di kolom `theme_config` JSONB.
 * Tidak perlu migrasi — `theme_config default '{}'` sudah ada.
 */
export interface CulturalData {
  /** Kode tradisi, mis. "jawa", "sunda". "modern" berarti tidak ada override. */
  tradition: string;
  /** Daerah asal pasangan, mis. "Yogyakarta". Disimpan untuk konteks. */
  region: string;
}

export interface TraditionOverride {
  /** Label tampilan di dropdown form admin */
  label: string;
  /** Daerah khas; muncul sebagai placeholder field "Daerah" */
  regionHint: string;
  /** Override parsial terhadap ThemeColors */
  colors?: Partial<ThemeColors>;
  /** Override parsial terhadap ThemeFonts */
  fonts?: Partial<ThemeFonts>;
  /** Override gaya bingkai ornamen */
  frameStyle?: FrameStyle;
}

// ============================================
// Katalog tradisi
// ============================================

export const TRADITIONS: Record<string, TraditionOverride> = {
  modern: {
    label: "Modern / Nasional",
    regionHint: "Seluruh Indonesia",
    // Tidak ada override — tema dasar tetap penuh.
  },

  jawa: {
    label: "Adat Jawa",
    regionHint: "Jawa Tengah, DIY, Jawa Timur",
    colors: {
      primary: "#7B5E3E",
      secondary: "#F2EBE0",
      background: "#FAF6F0",
      text: "#2C2018",
      accent: "#C0922A",
    },
    fonts: {
      headingFont: "var(--font-cormorant-garamond), Georgia, serif",
      bodyFont: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    },
    frameStyle: "floral",
  },

  sunda: {
    label: "Adat Sunda",
    regionHint: "Jawa Barat, Banten",
    colors: {
      primary: "#3D6B4F",
      secondary: "#EAF2EC",
      background: "#F5F9F6",
      text: "#1E2E22",
      accent: "#A6763E",
    },
    fonts: {
      headingFont: "var(--font-cormorant-garamond), Georgia, serif",
      bodyFont: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    },
    frameStyle: "floral",
  },

  minang: {
    label: "Adat Minangkabau",
    regionHint: "Sumatera Barat",
    colors: {
      primary: "#9B1D20",
      secondary: "#F5E8E0",
      background: "#FDF8F0",
      text: "#2C1A18",
      accent: "#C9A227",
    },
    fonts: {
      headingFont: "var(--font-cormorant-garamond), Georgia, serif",
      bodyFont: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    },
    frameStyle: "arch",
  },

  betawi: {
    label: "Adat Betawi",
    regionHint: "DKI Jakarta",
    colors: {
      primary: "#2B5FA5",
      secondary: "#E8EEFA",
      background: "#F8F9FF",
      text: "#181E30",
      accent: "#E8A020",
    },
    fonts: {
      headingFont: "var(--font-playfair-display), Georgia, serif",
      bodyFont: "var(--font-inter), system-ui, sans-serif",
    },
    frameStyle: "arch",
  },

  batak: {
    label: "Adat Batak",
    regionHint: "Sumatera Utara",
    colors: {
      primary: "#8B1A1A",
      secondary: "#EDE8F0",
      background: "#FAF8F5",
      text: "#251010",
      accent: "#1A3A6B",
    },
    fonts: {
      headingFont: "var(--font-cormorant-garamond), Georgia, serif",
      bodyFont: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    },
    frameStyle: "minimalist",
  },

  bugis: {
    label: "Adat Bugis / Makassar",
    regionHint: "Sulawesi Selatan",
    colors: {
      primary: "#1A4A6B",
      secondary: "#E0EBF5",
      background: "#F5F8FA",
      text: "#0E1E2C",
      accent: "#C8A020",
    },
    fonts: {
      headingFont: "var(--font-playfair-display), Georgia, serif",
      bodyFont: "var(--font-inter), system-ui, sans-serif",
    },
    frameStyle: "arch",
  },

  bali: {
    label: "Adat Bali",
    regionHint: "Bali",
    colors: {
      primary: "#8B4513",
      secondary: "#F2E8DC",
      background: "#FFF9F0",
      text: "#2C1A0E",
      accent: "#DAA520",
    },
    fonts: {
      headingFont: "var(--font-cormorant-garamond), Georgia, serif",
      bodyFont: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    },
    frameStyle: "floral",
  },

  melayu: {
    label: "Adat Melayu",
    regionHint: "Riau, Kepri, Kalimantan",
    colors: {
      primary: "#2D5A3D",
      secondary: "#E3F0E8",
      background: "#F5FBF6",
      text: "#162B1E",
      accent: "#C9A227",
    },
    fonts: {
      headingFont: "var(--font-playfair-display), Georgia, serif",
      bodyFont: "var(--font-inter), system-ui, sans-serif",
    },
    frameStyle: "minimalist",
  },
};

/** Array urut untuk dropdown form admin */
export const TRADITION_LIST = Object.entries(TRADITIONS).map(
  ([key, val]) => ({ key, label: val.label, regionHint: val.regionHint })
);

/**
 * Mengembalikan override untuk tradisi tertentu.
 * Bila kode tidak dikenali, dikembalikan "modern" (tanpa override).
 */
export function getTraditionOverride(traditionKey: string): TraditionOverride {
  return TRADITIONS[traditionKey] ?? TRADITIONS.modern;
}
