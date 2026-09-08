import type { ReactNode } from "react";

import type { FrameStyle, TierType } from "@/config/themes";

/**
 * Ornamen & lapisan dekorasi undangan.
 *
 * Tingkat kemewahan ditentukan paket (tier), BUKAN tema — tema mengatur warna
 * dan bentuk motif (`frameStyle`), sementara paket mengatur seberapa banyak
 * ornamen yang dipasang. Dengan begitu satu tema bisa terlihat bersih di
 * Silver dan sangat kaya di VIP tanpa menambah file tema baru.
 *
 * Semua warna diambil dari CSS custom property tema lewat `currentColor`,
 * jadi tidak ada warna yang di-hardcode di sini.
 */

// ============================================
// Tingkat dekorasi per paket
// ============================================

export type DecorLevel = "simple" | "rich" | "lavish";

export interface DecorProfile {
  /** Bingkai sudut SVG di kartu & bagian utama */
  corners: boolean;
  /** Garis bingkai kedua di dalam bingkai pertama (kesan berlapis) */
  doubleFrame: boolean;
  /** Pola motif berulang di latar halaman */
  pattern: boolean;
  /** Kepekatan pola latar */
  patternOpacity: number;
  /** Kilau emas bergerak pada judul */
  shimmerHeading: boolean;
  /** Kartu memakai bayangan & kaca yang lebih tebal */
  strongGlass: boolean;
}

const DECOR_PROFILES: Record<DecorLevel, DecorProfile> = {
  simple: {
    corners: false,
    doubleFrame: false,
    pattern: false,
    patternOpacity: 0,
    shimmerHeading: false,
    strongGlass: false,
  },
  rich: {
    corners: true,
    doubleFrame: false,
    pattern: true,
    patternOpacity: 0.1,
    shimmerHeading: false,
    strongGlass: true,
  },
  lavish: {
    corners: true,
    doubleFrame: true,
    pattern: true,
    patternOpacity: 0.16,
    shimmerHeading: true,
    strongGlass: true,
  },
};

/** Silver tampil bersih, Premium kaya, VIP paling mewah. */
export function getDecorLevel(tier: TierType): DecorLevel {
  if (tier === "vip") return "lavish";
  if (tier === "premium") return "rich";
  return "simple";
}

/** Profil dekorasi dari tingkat yang sudah dihitung. */
export function getDecorProfile(level: DecorLevel): DecorProfile {
  return DECOR_PROFILES[level];
}

// ============================================
// Motif dasar per gaya bingkai
// ============================================

/** Motif tengah pembatas: bunga (floral), gapura (arch), atau wajik. */
function Motif({ frameStyle, size }: { frameStyle: FrameStyle; size: number }) {
  if (frameStyle === "floral") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="shrink-0"
      >
        <g fill="currentColor">
          <ellipse cx="16" cy="9" rx="3.2" ry="6" opacity="0.85" />
          <ellipse cx="23" cy="16" rx="6" ry="3.2" opacity="0.85" />
          <ellipse cx="16" cy="23" rx="3.2" ry="6" opacity="0.85" />
          <ellipse cx="9" cy="16" rx="6" ry="3.2" opacity="0.85" />
          <circle cx="16" cy="16" r="2.6" />
        </g>
      </svg>
    );
  }

  if (frameStyle === "arch") {
    return (
      <svg
        width={size * 0.8}
        height={size}
        viewBox="0 0 26 32"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M13 3c5.5 0 10 4.5 10 10v16H3V13C3 7.5 7.5 3 13 3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M13 9c2.2 0 4 1.8 4 4v9h-8v-9c0-2.2 1.8-4 4-4z"
          fill="currentColor"
          opacity="0.28"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size * 0.72}
      height={size * 0.72}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 0l12 12-12 12L0 12z" fill="currentColor" opacity="0.9" />
      <path
        d="M12 5l7 7-7 7-7-7z"
        fill="none"
        stroke="var(--theme-background)"
        strokeWidth="1.1"
        opacity="0.7"
      />
    </svg>
  );
}

/** Percikan kelopak kecil di kedua sisi motif (khusus VIP). */
function PetalSpray({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="28"
      height="12"
      viewBox="0 0 28 12"
      aria-hidden="true"
      className={`shrink-0 ${flip ? "-scale-x-100" : ""}`}
    >
      <g fill="currentColor">
        <ellipse cx="7" cy="6" rx="6" ry="2.4" opacity="0.7" />
        <ellipse cx="17" cy="6" rx="4" ry="1.7" opacity="0.5" />
        <circle cx="25" cy="6" r="1.3" opacity="0.45" />
      </g>
    </svg>
  );
}

// ============================================
// Pembatas antar bagian
// ============================================

interface DividerProps {
  frameStyle: FrameStyle;
  level: DecorLevel;
  className?: string;
}

/**
 * Pembatas dekoratif antar bagian.
 * Semakin tinggi paket, semakin banyak elemen yang menyertai motif tengahnya.
 */
export function Divider({ frameStyle, level, className = "" }: DividerProps) {
  const dot = (
    <span
      className="h-1 w-1 shrink-0 rounded-full bg-current"
      style={{ opacity: 0.55 }}
    />
  );

  return (
    <div
      className={`flex items-center justify-center gap-2 sm:gap-3 ${className}`}
      style={{ color: "var(--theme-accent)" }}
      aria-hidden="true"
    >
      {level !== "simple" ? dot : null}
      <span className="inv-rule w-10 sm:w-20" />
      {level === "lavish" ? <PetalSpray flip /> : null}
      <Motif frameStyle={frameStyle} size={level === "simple" ? 20 : 26} />
      {level === "lavish" ? <PetalSpray /> : null}
      <span className="inv-rule inv-rule--flip w-10 sm:w-20" />
      {level !== "simple" ? dot : null}
    </div>
  );
}

// ============================================
// Bingkai sudut
// ============================================

/** Satu sudut bingkai, digambar untuk posisi kiri-atas lalu diputar. */
function CornerMark({
  frameStyle,
  doubleFrame,
}: {
  frameStyle: FrameStyle;
  doubleFrame: boolean;
}) {
  if (frameStyle === "floral") {
    return (
      <>
        <path
          d="M1 63C1 28.7 28.7 1 63 1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        {doubleFrame ? (
          <path
            d="M10 63C10 33.6 33.6 10 63 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.5"
          />
        ) : null}
        <g fill="currentColor">
          <ellipse
            cx="26"
            cy="26"
            rx="2.6"
            ry="6"
            transform="rotate(45 26 26)"
            opacity="0.85"
          />
          <ellipse
            cx="26"
            cy="26"
            rx="6"
            ry="2.6"
            transform="rotate(45 26 26)"
            opacity="0.85"
          />
          <circle cx="26" cy="26" r="1.7" />
        </g>
        <path
          d="M14 46c7 0 12-5 12-12"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.55"
        />
      </>
    );
  }

  if (frameStyle === "arch") {
    return (
      <>
        <path
          d="M1 63V26C1 12.2 12.2 1 26 1h37"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        {doubleFrame ? (
          <path
            d="M9 63V29C9 17 17 9 29 9h34"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.5"
          />
        ) : null}
        <path
          d="M19 36v-7a7 7 0 0 1 14 0v7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.75"
        />
      </>
    );
  }

  return (
    <>
      <path
        d="M1 63V19C1 9.06 9.06 1 19 1h44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      {doubleFrame ? (
        <path
          d="M9 63V22C9 14.8 14.8 9 22 9h41"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.5"
        />
      ) : null}
      <path d="M21 17l4.5 4.5L21 26l-4.5-4.5z" fill="currentColor" />
    </>
  );
}

interface CornerFrameProps {
  frameStyle: FrameStyle;
  level: DecorLevel;
  /** Ukuran sudut dalam kelas Tailwind, mis. "h-12 w-12 sm:h-16 sm:w-16" */
  size?: string;
}

/**
 * Empat bingkai sudut di dalam elemen ber-`position: relative`.
 * Tidak dirender sama sekali pada paket Silver.
 */
export function CornerFrame({
  frameStyle,
  level,
  size = "h-12 w-12 sm:h-16 sm:w-16",
}: CornerFrameProps) {
  const profile = DECOR_PROFILES[level];

  if (!profile.corners) return null;

  const corner = (
    <CornerMark frameStyle={frameStyle} doubleFrame={profile.doubleFrame} />
  );

  const shared = `pointer-events-none absolute ${size}`;

  return (
    <span
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      style={{ color: "var(--theme-accent)", opacity: 0.6 }}
      aria-hidden="true"
    >
      <svg className={`${shared} top-0 left-0`} viewBox="0 0 64 64">
        {corner}
      </svg>
      <svg className={`${shared} top-0 right-0 rotate-90`} viewBox="0 0 64 64">
        {corner}
      </svg>
      <svg
        className={`${shared} right-0 bottom-0 rotate-180`}
        viewBox="0 0 64 64"
      >
        {corner}
      </svg>
      <svg
        className={`${shared} bottom-0 left-0 -rotate-90`}
        viewBox="0 0 64 64"
      >
        {corner}
      </svg>
    </span>
  );
}

// ============================================
// Latar halaman
// ============================================

/** Pola motif berulang untuk latar (Premium & VIP). */
function BackdropPattern({ frameStyle }: { frameStyle: FrameStyle }) {
  const pattern =
    frameStyle === "floral" ? (
      <pattern
        id="inv-bg-pattern"
        width="80"
        height="80"
        patternUnits="userSpaceOnUse"
      >
        <g fill="currentColor" opacity="0.6">
          <ellipse cx="20" cy="16" rx="2.6" ry="6" />
          <ellipse cx="20" cy="16" rx="6" ry="2.6" />
          <circle cx="20" cy="16" r="1.6" />
          <ellipse cx="60" cy="56" rx="2.6" ry="6" />
          <ellipse cx="60" cy="56" rx="6" ry="2.6" />
          <circle cx="60" cy="56" r="1.6" />
        </g>
        <g fill="currentColor" opacity="0.35">
          <circle cx="60" cy="18" r="1.5" />
          <circle cx="20" cy="58" r="1.5" />
          <circle cx="40" cy="37" r="1" />
        </g>
      </pattern>
    ) : frameStyle === "arch" ? (
      <pattern
        id="inv-bg-pattern"
        width="64"
        height="76"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M16 62V32a16 16 0 0 1 32 0v30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.55"
        />
        <circle cx="32" cy="69" r="1.4" fill="currentColor" opacity="0.4" />
      </pattern>
    ) : (
      <pattern
        id="inv-bg-pattern"
        width="56"
        height="56"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M28 5l23 23-23 23L5 28z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.5"
        />
        <circle cx="28" cy="28" r="1.3" fill="currentColor" opacity="0.45" />
      </pattern>
    );

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      style={{ color: "var(--theme-accent)" }}
      aria-hidden="true"
    >
      <defs>{pattern}</defs>
      <rect width="100%" height="100%" fill="url(#inv-bg-pattern)" />
    </svg>
  );
}

/**
 * Latar berlapis halaman undangan: gradasi tema + pola motif + tekstur kertas.
 *
 * Dirender sekali di halaman dan dipasang `position: fixed`, jadi gradasinya
 * tidak ikut memanjang (dan meregang) saat halaman digulir.
 */
export function Backdrop({
  frameStyle,
  level,
}: {
  frameStyle: FrameStyle;
  level: DecorLevel;
}) {
  const profile = DECOR_PROFILES[level];

  return (
    <div className={`inv-backdrop inv-grain inv-surface--${level}`}>
      {profile.pattern ? (
        <div
          className="absolute inset-0"
          style={{ opacity: profile.patternOpacity }}
        >
          <BackdropPattern frameStyle={frameStyle} />
        </div>
      ) : null}
    </div>
  );
}

// ============================================
// Monogram
// ============================================

/**
 * Segel monogram inisial.
 * Dipakai di sampul (inisial kedua mempelai) dan sebagai pengganti foto bila
 * mempelai belum mengisi `photo_url`.
 */
export function Monogram({
  initials,
  className = "h-16 w-16",
  textClass = "text-lg",
}: {
  /** Inisial yang ditampilkan, mis. "B&A" atau "B" */
  initials: string;
  className?: string;
  textClass?: string;
}) {
  return (
    <span
      className={`inv-glass inv-sheen flex shrink-0 items-center justify-center rounded-full ${className}`}
      aria-hidden="true"
    >
      <span
        className={`${textClass} tracking-[0.08em]`}
        style={{
          fontFamily: "var(--theme-font-heading)",
          color: "var(--theme-primary)",
        }}
      >
        {initials.toUpperCase()}
      </span>
    </span>
  );
}

// ============================================
// Judul bergaya
// ============================================

/**
 * Judul dengan tipografi tema. Pada paket VIP, judul mendapat kilau emas
 * bergerak; paket lain memakai warna solid agar tetap tenang dan terbaca.
 */
export function ThemedHeading({
  children,
  level,
  className = "",
  as: Tag = "h2",
}: {
  children: ReactNode;
  level: DecorLevel;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const shimmer = DECOR_PROFILES[level].shimmerHeading;

  return (
    <Tag
      className={`${shimmer ? "inv-shimmer" : ""} ${className}`}
      style={{
        fontFamily: "var(--theme-font-heading)",
        ...(shimmer ? {} : { color: "var(--theme-primary)" }),
      }}
    >
      {children}
    </Tag>
  );
}
