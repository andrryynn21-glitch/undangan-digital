/**
 * Materi perbandingan paket untuk halaman `/paket`.
 *
 * ATURAN PENTING: setiap angka & ketersediaan fitur di file ini DIAMBIL dari
 * sumber aslinya — `TIER_FEATURES` (config/themes.ts), profil dekorasi
 * (components/invitation/decor.tsx), `getThemesForTier`, dan
 * `MAX_PAYMENT_ACCOUNTS`. Tidak ada yang ditulis ulang sebagai teks bebas,
 * supaya halaman paket tidak pernah menjanjikan sesuatu yang tidak benar-benar
 * dilakukan aplikasi. Ubah batasannya di sumbernya, tabel di /paket ikut.
 *
 * Import ke `components/invitation/decor` disengaja meski arahnya "config →
 * components": profil dekorasi hanya ada di sana, dan menyalinnya ke sini
 * justru membuat tabel bisa berbeda dari tampilan sebenarnya.
 */

import {
  getDecorLevel,
  getDecorProfile,
} from "@/components/invitation/decor";
import {
  TIERS,
  TIER_FEATURES,
  getThemesForTier,
} from "@/config/themes";
import type { TierType } from "@/config/themes";
import { MAX_PAYMENT_ACCOUNTS } from "@/lib/form-state";

// ============================================
// Batas tampilan ucapan
// ============================================

/**
 * Banyaknya ucapan terbaru yang ditampilkan di buku ucapan.
 *
 * Dipakai bersama oleh `app/[slug]/page.tsx` (saat mengambil data) dan tabel
 * perbandingan, supaya angka yang dijanjikan sama dengan yang dikirim.
 */
export const WISH_DISPLAY_LIMIT: Record<TierType, number> = {
  silver: 30,
  premium: 30,
  vip: 100,
};

// ============================================
// Kartu paket
// ============================================

export interface TierPresentation {
  tier: TierType;
  /** Nama paket seperti yang disebut ke customer */
  name: string;
  /** Satu kalimat: paket ini untuk siapa */
  tagline: string;
  /**
   * Harga paket. ISI SENDIRI di sini — mis. "Rp 150.000".
   * Selama `null`, kartu menampilkan "Hubungi kami" agar tidak ada angka
   * karangan yang terlihat customer.
   */
  price: string | null;
  /** Label kecil di sudut kartu. Hanya untuk klaim yang memang benar. */
  badge?: string;
  /** Slug undangan contoh; tombolnya hanya tampil bila barisnya ada di database */
  demoSlug: string;
  /** Poin jual utama, angkanya diturunkan dari TIER_FEATURES */
  highlights: string[];
}

const themeNames = (tier: TierType) =>
  getThemesForTier(tier)
    .map((theme) => theme.name)
    .join(" · ");

export const TIER_PRESENTATIONS: Record<TierType, TierPresentation> = {
  silver: {
    tier: "silver",
    name: "Silver",
    tagline:
      "Undangan rapi dan bersih untuk acara sederhana atau tamu terbatas.",
    price: "Rp 75.000",
    demoSlug: "paket-silver",
    highlights: [
      `Tema ${themeNames("silver")}`,
      `Galeri sampai ${TIER_FEATURES.silver.maxPhotos} foto`,
      "Amplop digital & buku ucapan",
      "Hitung mundur dan tombol petunjuk arah",
    ],
  },
  premium: {
    tier: "premium",
    name: "Premium",
    tagline:
      "Tampilan kaya ornamen dan konfirmasi kehadiran tamu yang tercatat otomatis.",
    price: "Rp 150.000",
    demoSlug: "paket-premium",
    highlights: [
      `${getThemesForTier("premium").length} tema terbuka: ${themeNames("premium")}`,
      `Galeri sampai ${TIER_FEATURES.premium.maxPhotos} foto`,
      "RSVP tamu tersimpan otomatis",
      "Bingkai sudut & pola motif di latar",
    ],
  },
  vip: {
    tier: "vip",
    name: "VIP",
    tagline:
      "Paling mewah dan paling lengkap, untuk resepsi besar dengan banyak tamu.",
    price: "Rp 250.000",
    badge: "Paling Lengkap",
    demoSlug: "paket-vip",
    highlights: [
      `Galeri sampai ${TIER_FEATURES.vip.maxPhotos} foto`,
      "Ucapan tamu muncul tanpa perlu refresh",
      "Ornamen terlengkap: bingkai ganda & judul berkilau",
      `${WISH_DISPLAY_LIMIT.vip} ucapan terbaru ditampilkan`,
    ],
  },
};

/** Urutan kolom di halaman paket: dari paket terendah ke tertinggi. */
export const TIER_ORDER: readonly TierType[] = TIERS;

/**
 * Ada paket yang harganya belum diisi (`price: null`).
 *
 * Dipakai halaman /paket untuk memunculkan catatan pengingat hanya selama masih
 * ada yang kosong — catatan itu untuk pemilik aplikasi, bukan untuk customer
 * yang sedang melihat harga.
 */
export const HAS_UNSET_PRICE: boolean = TIER_ORDER.some(
  (tier) => TIER_PRESENTATIONS[tier].price === null
);

/** Semua slug undangan contoh, untuk sekali query ke database. */
export const DEMO_SLUGS: string[] = TIER_ORDER.map(
  (tier) => TIER_PRESENTATIONS[tier].demoSlug
);

/**
 * Contoh tambahan untuk memperlihatkan tema lain.
 *
 * Bukan bagian dari perbandingan paket — ketiga contoh paket sengaja memakai
 * tema yang sama supaya perbedaannya murni soal paket. Daftar ini menjawab
 * pertanyaan customer "tema yang satu lagi seperti apa?".
 */
export interface ThemeShowcase {
  slug: string;
  /** Nama tema seperti di katalog `config/themes/` */
  themeName: string;
  /** Paket minimum yang bisa memakai tema ini */
  minTier: TierType;
}

export const THEME_SHOWCASES: ThemeShowcase[] = [
  { slug: "budi-ani", themeName: "Floral Romantic", minTier: "premium" },
];

/** Slug yang perlu diperiksa keberadaannya sebelum ditautkan. */
export const ALL_EXAMPLE_SLUGS: string[] = [
  ...DEMO_SLUGS,
  ...THEME_SHOWCASES.map((showcase) => showcase.slug),
];

// ============================================
// Tabel perbandingan
// ============================================

export interface FeatureCell {
  /** Teks yang ditampilkan di sel */
  text: string;
  /** Menentukan ikon centang atau garis; juga dibacakan screen reader */
  available: boolean;
}

export interface FeatureRow {
  label: string;
  /** Keterangan kecil di bawah label */
  note?: string;
  cells: Record<TierType, FeatureCell>;
}

export interface FeatureGroup {
  title: string;
  rows: FeatureRow[];
}

/** Sel yang sama untuk ketiga paket. */
function sameForAll(
  text: string,
  available = true
): Record<TierType, FeatureCell> {
  const cell: FeatureCell = { text, available };
  return { silver: cell, premium: cell, vip: cell };
}

/** Sel yang dihitung per paket. */
function perTier(
  build: (tier: TierType) => FeatureCell
): Record<TierType, FeatureCell> {
  return {
    silver: build("silver"),
    premium: build("premium"),
    vip: build("vip"),
  };
}

/** Sel ya/tidak dari sebuah flag paket. */
function flag(
  test: (tier: TierType) => boolean,
  yes = "Termasuk",
  no = "Tidak termasuk"
): Record<TierType, FeatureCell> {
  return perTier((tier) => {
    const available = test(tier);
    return { text: available ? yes : no, available };
  });
}

/** Profil dekorasi paket — sumber kebenaran soal ornamen. */
const decor = (tier: TierType) => getDecorProfile(getDecorLevel(tier));

export const COMPARISON_GROUPS: FeatureGroup[] = [
  {
    title: "Tema & Tampilan",
    rows: [
      {
        label: "Tema yang bisa dipilih",
        cells: perTier((tier) => ({
          text: themeNames(tier),
          available: true,
        })),
      },
      {
        label: "Ornamen bingkai sudut",
        note: "ukiran di keempat sudut kartu & bagian utama",
        cells: flag((tier) => decor(tier).corners),
      },
      {
        label: "Bingkai berlapis ganda",
        note: "garis kedua di dalam bingkai, kesan berlapis",
        cells: flag((tier) => decor(tier).doubleFrame),
      },
      {
        label: "Pola motif di latar halaman",
        cells: perTier((tier) => {
          const profile = decor(tier);
          return {
            text: profile.pattern
              ? `Ada, kepekatan ${Math.round(profile.patternOpacity * 100)}%`
              : "Latar polos bergradasi",
            available: profile.pattern,
          };
        }),
      },
      {
        label: "Judul berkilau emas",
        note: "kilau bergerak pada nama mempelai",
        cells: flag((tier) => decor(tier).shimmerHeading),
      },
      {
        label: "Kartu kaca & bayangan mewah",
        cells: perTier((tier) => {
          const strong = decor(tier).strongGlass;
          return {
            text: strong ? "Kaca tebal + elevasi" : "Kaca tipis, gaya bersih",
            available: strong,
          };
        }),
      },
    ],
  },
  {
    title: "Foto",
    rows: [
      {
        label: "Foto mempelai pria & wanita",
        cells: sameForAll("Termasuk"),
      },
      {
        label: "Foto sampul di belakang nama",
        cells: sameForAll("Termasuk"),
      },
      {
        label: "Galeri foto kenangan",
        note: "diunggah langsung dari galeri HP atau file manager",
        cells: perTier((tier) => ({
          text: `Sampai ${TIER_FEATURES[tier].maxPhotos} foto`,
          available: true,
        })),
      },
      {
        label: "Galeri layar penuh saat diklik",
        cells: sameForAll("Termasuk"),
      },
    ],
  },
  {
    title: "Interaksi Tamu",
    rows: [
      {
        label: "Detail acara & tombol petunjuk arah",
        cells: sameForAll("Termasuk"),
      },
      {
        label: "Hitung mundur menuju hari acara",
        cells: sameForAll("Termasuk"),
      },
      {
        label: "Amplop digital",
        note: "rekening bank & e-wallet dengan tombol salin nomor",
        cells: sameForAll(`Sampai ${MAX_PAYMENT_ACCOUNTS} rekening`),
      },
      {
        label: "Konfirmasi kehadiran (RSVP) tersimpan",
        cells: flag(
          (tier) => TIER_FEATURES[tier].rsvpToDb,
          "Tersimpan otomatis",
          "Tamu konfirmasi langsung ke keluarga"
        ),
      },
      {
        label: "Buku ucapan tamu",
        cells: perTier((tier) => ({
          text: `${WISH_DISPLAY_LIMIT[tier]} ucapan terbaru`,
          available: true,
        })),
      },
      {
        label: "Ucapan baru muncul tanpa refresh",
        note: "cocok saat ucapan ditayangkan di layar resepsi",
        cells: flag((tier) => TIER_FEATURES[tier].wishbookRealtime),
      },
    ],
  },
  {
    title: "Suasana",
    rows: [
      {
        label: "Musik latar pilihan sendiri",
        note: "unggah MP3 sendiri; musik mulai saat tamu menekan \"Buka Undangan\"",
        cells: flag(
          (tier) => TIER_FEATURES[tier].customMusic,
          "Unggah MP3 sendiri",
          "Tidak termasuk"
        ),
      },
    ],
  },
];

/**
 * Baris yang seluruh selnya belum tersedia. Ditandai supaya halaman bisa
 * menampilkannya lebih redup, alih-alih terlihat seperti fitur yang aktif.
 */
export function isRowUnavailable(row: FeatureRow): boolean {
  return TIER_ORDER.every((tier) => !row.cells[tier].available);
}
