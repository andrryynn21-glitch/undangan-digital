import type { CSSProperties, ReactNode } from "react";

import type { FrameStyle, TierType } from "@/config/themes";
import type { MotifId } from "@/config/motifs";
import { MotifCrest, MotifPattern, getPatternStep } from "@/components/invitation/Ornaments";

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

/**
 * Seluruh keputusan visual yang dibutuhkan oleh setiap komponen undangan, dalam
 * satu objek.
 *
 * KENAPA SATU OBJEK, BUKAN TIGA PROP TERPISAH
 *
 * Ketiganya (`frameStyle`, `level`, `motif`) selalu diturunkan dari undangan yang
 * sama dan selalu bergerak bersama. Semula hanya dua yang ada dan sudah harus
 * di-drill ke sebelas komponen; menambah `motif` berarti satu prop baru di
 * setiap signature dan di setiap call site. Dengan satu objek, field berikutnya
 * cukup ditambah di satu tempat, dan yang terlupa akan langsung ketahuan oleh
 * TypeScript — bukan diam-diam hilang di satu komponen.
 */
export interface Design {
  /** Bentuk bingkai & pembatas: arch, floral, atau minimalist. */
  frameStyle: FrameStyle;
  /** Seberapa banyak ornamen yang dipasang; ditentukan paket. */
  level: DecorLevel;
  /** Motif ornamen yang dipakai: pola latar, crest, dan sudut bingkai. */
  motif: MotifId;
}

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
// Motif pembatas
// ============================================

/**
 * Ornamen tengah pembatas antar bagian.
 *
 * Dulu komponen ini menggambar bentuk berbeda tergantung `frameStyle` (bunga
 * untuk floral, gapura untuk arch, wajik untuk minimalist). Sekarang bentuknya
 * ditentukan `motif` — itulah gunanya katalog motif: pembatas yang muncul di
 * tengah setiap bagian ikut berubah mengikuti imajinasi yang dipilih, bukan lagi
 * ikut bentuk bingkai yang tidak ada hubungannya.
 *
 * `frameStyle` tidak dihapus dari pemanggilnya karena `Section` dan `CoverGate`
 * tetap membutuhkannya untuk bingkai sudut; motif pembatas sendiri sudah tidak
 * memakainya.
 */
function Motif({ motif, size }: { motif: MotifId; size: number }) {
  return <MotifCrest motif={motif} width={size} />;
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
  design: Design;
  className?: string;
}

/**
 * Pembatas dekoratif antar bagian.
 *
 * Semakin tinggi paket, semakin banyak elemen yang menyertai motif tengahnya.
 * Ornamen tengahnya sendiri mengikuti `design.motif` — jadi seluruh pembatas di
 * undangan langsung berubah begitu admin mengganti imajinasi.
 */
export function Divider({ design, className = "" }: DividerProps) {
  const { level, motif } = design;
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
      <Motif motif={motif} size={level === "simple" ? 20 : 26} />
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
  design: Design;
  /** Ukuran sudut dalam kelas Tailwind, mis. "h-12 w-12 sm:h-16 sm:w-16" */
  size?: string;
}

/**
 * Empat bingkai sudut di dalam elemen ber-`position: relative`.
 * Tidak dirender sama sekali pada paket Silver.
 */
export function CornerFrame({
  design,
  size = "h-12 w-12 sm:h-16 sm:w-16",
}: CornerFrameProps) {
  const profile = DECOR_PROFILES[design.level];

  if (!profile.corners) return null;

  const corner = (
    <CornerMark
      frameStyle={design.frameStyle}
      doubleFrame={profile.doubleFrame}
    />
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

/**
 * Pola motif berulang untuk latar (Premium & VIP).
 *
 * Motifnya datang dari katalog `Ornaments.tsx`, jadi latar ini bisa bermotif
 * wayang, merak, atau damask — bukan cuma batik. Semula motif batik dipilih
 * dari `frameStyle`, jadi semua tema hanya punya tiga varian batik yang
 * menampilkan; sekarang motife bebas.
 *
 * Warnanya tetap `currentColor` supaya tidak ada warna yang di-hardcode di sini.
 */
function BackdropPattern({ motif }: { motif: MotifId }) {
  return <MotifPattern motif={motif} />;
}

/**
 * Latar berlapis halaman undangan: gradasi tema + pola motif + tekstur kertas.
 *
 * Dirender sekali di halaman dan dipasang `position: fixed`, jadi gradasinya
 * tidak ikut memanjang (dan meregang) saat halaman digulir.
 */
export function Backdrop({
  design,
  backgroundUrl,
}: {
  design: Design;
  /**
   * Gambar acuan tema. Bila ada, dipasang sebagai TEKSTUR yang sangat samar di
   * belakang isi undangan — bukan sebagai gambar yang dilihat. Kepekatannya
   * memakai `patternOpacity` yang sama dengan motif (0,1 / 0,16), jadi Silver
   * yang nilainya 0 tetap tampil bersih sesuai janji paketnya.
   */
  backgroundUrl?: string | null;
}) {
  const { level, motif } = design;
  const profile = DECOR_PROFILES[level];

  return (
    // `overflow-hidden` menahan tekstur yang diperbesar `scale(1.1)` di bawah:
    // transform ikut menghitung area gulir, jadi tanpa ini layar sempit bisa
    // mendapat gulir mendatar 5% yang tidak ada isinya.
    <div
      className={`inv-backdrop inv-grain inv-surface--${level} overflow-hidden`}
    >
      {/* Tekstur gambar acuan dipasang paling bawah supaya motif tetap di
          atasnya. Diblur kuat dan diperbesar sedikit: yang diinginkan adalah
          jejak warna & bentuknya, bukan detailnya — dan blur pada tepi gambar
          menyisakan pinggiran pucat bila tidak diperbesar.
          Memakai CSS background, bukan `next/image`, karena berkas ini komponen
          server tanpa ukuran layout yang perlu dihitung.

          `mix-blend-mode: soft-light` adalah bagian yang paling penting di
          sini. Tanpa blend, gambar gelap yang di-blur selalu menggeser
          seluruh halaman jadi kelabu — di kanvas terang ia hanya menambal
          dengan abu-abu, sedangkan di kanvas gelap ia menekan teks.
          `soft-light` membiarkan gambar MEMPERKUAT kanvas yang sudah ada:
          gelap di atas gelap jadi lebih pekat, terang di atas terang tetap
          terang, dan tidak ada satu pun yang merusak keterbacaan teks. */}
      {backgroundUrl && profile.patternOpacity > 0 ? (
        <div
          className="absolute inset-0 inv-blend-soft"
          style={{
            backgroundImage: `url("${backgroundUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: profile.patternOpacity * 2.2,
            filter: "blur(28px)",
            transform: "scale(1.1)",
          }}
          aria-hidden="true"
        />
      ) : null}

      {profile.pattern ? (
        <div
          className="absolute inset-0 inv-motif-drift"
          style={{
            opacity: profile.patternOpacity,
            // Jarak geser animasi disamakan dengan ukuran ubin motif ini,
            // supaya pola kembali ke posisi semula tanpa terlihat melompat.
            "--inv-drift-step": `${getPatternStep(motif)}px`,
          } as CSSProperties}
        >
          <BackdropPattern motif={motif} />
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
