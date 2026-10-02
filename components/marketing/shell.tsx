import type { CSSProperties, ReactNode } from "react";

import {
  Backdrop,
  Divider,
  PetalLayer,
  ThemedHeading,
} from "@/components/invitation/decor";
import type { Design } from "@/components/invitation/decor";
import {
  DEFAULT_THEME_ID,
  getThemeConfig,
  getThemeCssVars,
} from "@/config/themes";
import { ensureReadableTheme } from "@/lib/culture-theme";

/**
 * Kerangka visual halaman jualan (`/` dan `/paket`).
 *
 * KENAPA ADA BERKAS INI
 *
 * Halaman undangan sudah lama memakai mesin dekorasi di `components/invitation`
 * — motif, kaca, kilau emas, latar berlapis. Halaman jualannya tidak, sehingga
 * calon pembeli justru melihat halaman abu-abu polos lebih dulu, lalu baru
 * melihat produk yang mewah. Kedua halaman jualan itu sekarang memakai mesin
 * yang sama.
 *
 * Yang dibagikan di sini hanya hal yang HARUS sama di keduanya: tema rumah,
 * pembungkus bertema, dan dua ornamen kecil yang dipakai berulang. Kalau
 * masing-masing halaman menyalin sendiri konstanta temanya, cukup satu yang
 * lupa diperbarui untuk membuat perpindahan dari `/` ke `/paket` terlihat
 * seperti pindah situs.
 */

/**
 * Tema rumah untuk halaman jualan: Minimal Gold, tingkat dekorasi tertinggi.
 *
 * `ensureReadableTheme` WAJIB di sini, sama seperti lapis terakhir di
 * `app/[slug]/page.tsx`. Warna mentah di `config/themes/*.json` belum pernah
 * diuji kontrasnya: Minimal Gold keluar dengan emas `#C9A227` di atas krem
 * `#FFFDF9` pada rasio 2,38:1 — di bawah ambang teks (4,5:1) maupun ambang
 * ornamen (3:1) yang ditetapkan `lib/palette.ts` sendiri. Halaman undangan
 * memperbaikinya jadi `#8D721B`; tanpa baris ini halaman jualan akan menjadi
 * satu-satunya tempat di aplikasi yang menampilkan emas yang tak terbaca itu,
 * sekaligus memajang warna yang BERBEDA dari yang nanti diterima tamu.
 */
export const HOUSE_THEME = ensureReadableTheme(
  getThemeConfig(DEFAULT_THEME_ID)
);

export const HOUSE_DESIGN: Design = {
  frameStyle: HOUSE_THEME.frameStyle,
  level: "lavish",
  motif: HOUSE_THEME.defaultMotif,
  layout: HOUSE_THEME.layout,
};

/**
 * Pembungkus halaman jualan: memasang token tema, latar berlapis, dan font.
 *
 * Perhatikan tidak ada satu pun kelas `dark:` di halaman jualan setelah ini.
 * Itu disengaja: begitu tema dipasang, warnanya datang dari token tema yang
 * kanvasnya sudah pasti terang. Kelas `dark:` akan tetap ikut mode gelap sistem
 * operasi dan menulis teks pucat di atas latar krem — persis kebalikan dari
 * yang dijanjikan token tema.
 */
export function MarketingMain({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`inv-page flex-1 ${className}`.trim()}
      // Dibaca CSS untuk menyetel permukaan kaca, garis, dan bayangan.
      data-theme-canvas={HOUSE_THEME.colors.canvas?.mode ?? "light"}
      style={
        {
          ...getThemeCssVars(HOUSE_THEME),
          backgroundColor: "var(--theme-background)",
          color: "var(--theme-text)",
          fontFamily: "var(--theme-font-body)",
        } as CSSProperties
      }
    >
      {/* Latar yang sama dengan undangan paket VIP: gradasi tema, pola motif
          yang bergerak sangat lambat, dan tekstur kertas. */}
      <Backdrop design={HOUSE_DESIGN} />

      {/* Serpih motif yang jatuh di depan isi halaman.
          Di sini fungsinya bukan cuma hiasan: efek ini yang paling sulit
          dijelaskan dengan kalimat di daftar fitur, jadi halaman jualannya
          menunjukkannya langsung. Lapisannya `pointer-events: none`, jadi tidak
          ada satu pun tombol "Pesan" yang bisa terhalang olehnya. */}
      <PetalLayer design={HOUSE_DESIGN} />

      {children}
    </main>
  );
}

/**
 * Warna teks tema pada kepekatan tertentu.
 *
 * Dipakai untuk teks pendukung. `color-mix` dengan `transparent` dipilih
 * daripada `opacity` supaya hanya warnanya yang melemah — bukan seluruh elemen
 * beserta ikon dan garis di dalamnya.
 */
export function mutedText(percent: number): string {
  return `color-mix(in srgb, var(--theme-text) ${percent}%, transparent)`;
}

/** Centang untuk fitur yang termasuk paket. */
export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`mt-0.5 h-4 w-4 shrink-0 ${className}`.trim()}
      style={{ color: "var(--theme-primary)" }}
      aria-hidden="true"
    >
      <path
        d="M4 10.5l4 4 8-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Judul bagian dengan label kecil di atas dan pembatas bermotif di bawahnya. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  align?: "center" | "start";
}) {
  const centered = align === "center";

  return (
    <header className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p
        className="text-[0.7rem] font-medium uppercase tracking-[0.22em]"
        style={{ color: "var(--theme-accent)" }}
      >
        {eyebrow}
      </p>

      <ThemedHeading
        level={HOUSE_DESIGN.level}
        className="mt-3 text-2xl leading-tight tracking-tight sm:text-3xl"
      >
        {title}
      </ThemedHeading>

      {/* `Divider` selalu memusatkan isinya sendiri, dan menambah
          `justify-start` di sini tidak bisa diandalkan — dua utility Tailwind
          dengan specificity sama dimenangkan oleh urutan di CSS hasil build,
          bukan oleh urutan penulisan di atribut `class`. Jadi untuk versi rata
          kiri, yang dipersempit adalah kotaknya. */}
      <div className={centered ? "mt-5" : "mt-5 max-w-xs"}>
        <Divider design={HOUSE_DESIGN} />
      </div>

      {lead ? (
        <p
          className="mt-5 text-sm leading-relaxed"
          style={{ color: mutedText(78) }}
        >
          {lead}
        </p>
      ) : null}
    </header>
  );
}
