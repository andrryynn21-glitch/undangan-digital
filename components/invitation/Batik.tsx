import { useId } from "react";
import type { JSX } from "react";

import type { FrameStyle } from "@/config/themes";

/**
 * Motif batik & ornamen budaya untuk halaman undangan.
 *
 * Kenapa motif ini digambar sendiri sebagai SVG, bukan dipasang sebagai
 * gambar dekoratif:
 * - skalanya tetap tajam di layar retina, dan tidak menambah permintaan
 *   jaringan untuk tiap ornamen;
 * - warnanya diambil dari `currentColor`, jadi otomatis mengikuti tema tanpa
 *   perlu membuat varian warna per tema;
 * - bisa dianimasikan lewat CSS (kilau, denyut) tanpa-keyframes per gambar.
 *
 * Motif yang dipakai adalah tiga motif batik Jawa yang paling dikenali —
 * kawung, parang, dan ceplok — ditambah gunungan, bentuk gunting wayang
 * yang jadi lambang khas Jawa dan sangat lazim dipakai sebagai pembatas
 * di undangan batik.
 */

/** Motif batik yang bisa dipakai sebagai pola berulang. */
export type BatikVariant = "kawung" | "parang" | "ceplok";

/**
 * Pemetaan motif ke gaya bingkai tema.
 *
 * Gaya bingkai sudah ada di kontrak tema, jadi dipakai di sini untuk
 * memilih motif. Hasilnya: satu tema otomatis kelihatan berbeda secara
 * budaya tanpa perlu menambah berkas atau pilihan baru di form admin.
 */
const VARIANT_BY_FRAME: Record<FrameStyle, BatikVariant> = {
  floral: "kawung",
  arch: "ceplok",
  minimalist: "parang",
};

/** Motif untuk sebuah gaya bingkai. */
export function getBatikVariant(frameStyle: FrameStyle): BatikVariant {
  return VARIANT_BY_FRAME[frameStyle];
}

// ============================================
// Ubin motif (dipakai di dalam <defs>)
// ============================================

/**
 * Satu ubin kawung: empat oval mengelilingi titik pusat dalam kisi. Bentuk
 * oval yang berulang inilah yang membuat motif ini terbaca sebagai batik,
 * bukan sebagai motif floral biasa.
 */
function KawungTile(): JSX.Element {
  return (
    <>
      <circle
        cx="20"
        cy="20"
        r="9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <g fill="currentColor">
        <ellipse cx="20" cy="10.5" rx="3.4" ry="6" />
        <ellipse cx="20" cy="29.5" rx="3.4" ry="6" />
        <ellipse cx="10.5" cy="20" rx="6" ry="3.4" />
        <ellipse cx="29.5" cy="20" rx="6" ry="3.4" />
      </g>
      <circle cx="20" cy="20" r="2.2" fill="currentColor" />
    </>
  );
}

/**
 * Satu ubin parang: gelombang diagonal yang berulang — bentuk decler parang
 * yang kalau dibaca miring memberi kesan mengalir seperti kainnya.
 */
function ParangTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M2 30c8-7 14 5 22-2s14 5 22-2" />
      <path d="M2 46c8-7 14 5 22-2s14 5 22-2" />
      <path d="M2 14c8-7 14 5 22-2s14 5 22-2" />
      <circle cx="14" cy="26" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="36" cy="40" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="24" cy="10" r="1.7" fill="currentColor" stroke="none" />
    </g>
  );
}

/** Satu ubin ceplok: salib silang dengan lengan bertingkat, ciri motif ini. */
function CeplokTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <path
        d="M20 4h6v10h10v6H26v10h-6V20H10v-6h10z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <rect x="4" y="4" width="7" height="7" />
      <rect x="29" y="29" width="7" height="7" />
      <rect x="29" y="4" width="7" height="7" opacity="0.5" />
      <rect x="4" y="29" width="7" height="7" opacity="0.5" />
    </g>
  );
}

const TILES: Record<BatikVariant, () => JSX.Element> = {
  kawung: KawungTile,
  parang: ParangTile,
  ceplok: CeplokTile,
};

/** Ukuran kisi tiap motif, dalam satuan viewBox ubin. */
const TILE_SIZE: Record<BatikVariant, number> = {
  kawung: 40,
  parang: 48,
  ceplok: 40,
};

// ============================================
// Pola latar
// ============================================

/**
 * Lapisan pola batik penuh untuk latar halaman.
 *
 * Dipasang sebagai elemen yang benar-benar menutup area, supaya bisa dipakai
 * baik di `.inv-backdrop` (fixed) maupun di dalam kartu (absolute). Seluruh
 * warna mengikuti `currentColor`, jadi pemanggil cukup memberi
 * `color: var(--theme-accent)`.
 */
export function BatikPattern({
  variant,
  className = "",
  opacity = 1,
}: {
  variant: BatikVariant;
  className?: string;
  opacity?: number;
}) {
  // `useId` menghasilkan id yang mengandung `:` dan `.`, yang tidak sah di
  // dalam `url(#...)`; karakternya dibuang supaya rujukan selalu valid.
  const rawId = useId();
  const patternId = `inv-batik-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const Tile = TILES[variant];
  const size = TILE_SIZE[variant];

  return (
    <svg
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id={patternId}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <Tile />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

// ============================================
// Gunungan
// ============================================

/**
 * Gunungan — bentuk gunung bersusun dengan pohon hayat di dalamnya, lambang
 * khas Jawa dan pemisah bagian paling lazim di undangan Jawa.
 *
 * Dipakai sebagai pembatas dan bingkai sampul, karena siluetnya yang
 * melancip membuat halaman terasa punya "puncak" di setiap pergantian bagian.
 */
export function Gunungan({
  className = "",
  width = 44,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      width={width}
      height={width * 1.25}
      viewBox="0 0 44 55"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22 2c4.5 6.2 7.5 9.6 11 13.4 2.6 2.8 4.2 5 4.2 8.2 0 4.4-3.4 7-7 9.4 2.2 3.4 3.8 5.4 7.8 7.6 2.2 1.2 3 2.4 3 4.4 0 4.6-5.4 6.6-11 7.2 1.2 1 1.8 1.6 1.8 2.8 0 .4 0 .6-.2 1H12.4c-.2-.4-.2-.6-.2-1 0-1.2.6-1.8 1.8-2.8-5.6-.6-11-2.6-11-7.2 0-2 .8-3.2 3-4.4 4-2.2 5.6-4.2 7.8-7.6-3.6-2.4-7-5-7-9.4 0-3.2 1.6-5.4 4.2-8.2C14.5 11.6 17.5 8.2 22 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M22 9.5c3 4.2 5 6.4 7.4 9 1.6 1.8 2.6 3.2 2.6 5.2 0 3-2.2 4.8-4.6 6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.75"
      />
      <path
        d="M22 9.5c-3 4.2-5 6.4-7.4 9-1.6 1.8-2.6 3.2-2.6 5.2 0 3 2.2 4.8 4.6 6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.75"
      />
      <path
        d="M22 27v18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <g fill="currentColor">
        <circle cx="22" cy="30" r="2.1" />
        <circle cx="18.4" cy="35" r="1.5" />
        <circle cx="25.6" cy="35" r="1.5" />
        <circle cx="22" cy="39.5" r="1.5" />
      </g>
      <path
        d="M18.6 45h6.8"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
