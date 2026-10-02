"use client";

import { useEffect, useState } from "react";

import { getThemeConfig } from "@/config/themes";
import { getTraditionOverride } from "@/config/cultures";
import { MotifCrest } from "@/components/invitation/Ornaments";
import {
  applyCulturalOverride,
  applyCustomColorOverride,
  ensureReadableTheme,
} from "@/lib/culture-theme";
import {
  SAMPLE_SIZE,
  derivePaletteFromPixels,
  resolvePaletteColors,
} from "@/lib/palette";
import type { CustomColorOverride, DerivedPalette } from "@/lib/palette";

/**
 * Pratinjau warna tema hasil pembacaan gambar acuan.
 *
 * Warnanya dihitung DI BROWSER memakai `derivePaletteFromPixels()` — fungsi
 * yang sama persis dengan yang dipakai server saat menyimpan. Itu sebabnya
 * logika warna tidak ikut `sharp`: kalau algoritmanya digandakan, pratinjau di
 * sini cepat atau lambat akan menjanjikan warna yang berbeda dari yang benar-
 * benar tersimpan, dan admin jadi tidak bisa mempercayainya.
 *
 * Gunanya bukan sekadar hiasan: admin bisa tahu **sebelum menyimpan** kalau
 * gambarnya terlalu pucat untuk dijadikan acuan, atau kalau warna adat yang
 * dipilih akan menimpa warna gambarnya.
 */

/** Ukuran kanvas pembacaan; sama dengan yang dipakai `sharp` di server. */
const CANVAS_SIZE = SAMPLE_SIZE;

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "pale" }
  | { kind: "unreadable" }
  | { kind: "ready"; palette: DerivedPalette };

/**
 * Lima warna dasar yang ditampilkan sebagai pratinjau.
 *
 * `key` dicetak eksplisit sebagai `ColorKey`, bukan `keyof ThemeColors`:
 * `ThemeColors` kini punya `canvas` (token turunan, objek bukan string) dan
 * memetakannya di sini akan membuat TypeScript menebak tipe yang salah.
 */
type ColorKey = "primary" | "secondary" | "background" | "text" | "accent";

const SWATCH_LABELS: { key: ColorKey; label: string }[] = [
  { key: "primary", label: "Judul" },
  { key: "secondary", label: "Panel" },
  { key: "accent", label: "Ornamen" },
  { key: "background", label: "Latar" },
  { key: "text", label: "Teks" },
];

export default function ThemePalettePreview({
  imageUrl,
  themeId,
  tradition,
  customColors,
}: {
  /** URL gambar acuan yang sudah terunggah; kosong berarti belum ada. */
  imageUrl: string;
  /** Tema dasar yang sedang dipilih — menentukan latar & teks. */
  themeId: string;
  /** Adat yang sedang dipilih; menimpa warna gambar bila bukan "modern". */
  tradition: string;
  /** Warna manual yang sedang diketik admin, agar pratinjau ikut berubah. */
  customColors?: CustomColorOverride;
}) {
  /**
   * Hasil pembacaan disimpan BESERTA URL asalnya, lalu status yang dipakai
   * diturunkan saat render. Dengan begitu tidak ada `setState` yang dipanggil
   * langsung di dalam effect: berganti gambar otomatis berarti "sedang dibaca"
   * tanpa perlu diset, dan hasil lama tidak mungkin tampil sebagai hasil gambar
   * baru karena URL-nya tidak cocok.
   */
  const [result, setResult] = useState<{ url: string; status: Status } | null>(
    null
  );

  const status: Status = !imageUrl
    ? { kind: "idle" }
    : result?.url === imageUrl
      ? result.status
      : { kind: "reading" };

  useEffect(() => {
    if (!imageUrl) return;

    // Gambar bisa berganti sebelum yang lama selesai dibaca; hasil yang
    // kedaluwarsa tidak boleh menimpa hasil yang baru.
    let cancelled = false;

    const finish = (next: Status) => {
      if (!cancelled) setResult({ url: imageUrl, status: next });
    };

    const image = new Image();

    // WAJIB, dan harus sebelum `src`: tanpa ini kanvas menjadi "tercemar" dan
    // `getImageData()` melempar SecurityError, sehingga tidak ada satu piksel
    // pun yang bisa dibaca. Bucket Storage-nya publik, jadi permintaan tanpa
    // kredensial tetap dilayani.
    image.crossOrigin = "anonymous";

    image.onload = () => {
      if (cancelled) return;

      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(
          CANVAS_SIZE / image.naturalWidth,
          CANVAS_SIZE / image.naturalHeight,
          1
        );

        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          finish({ kind: "unreadable" });
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        const palette = derivePaletteFromPixels(data, 4);

        finish(palette ? { kind: "ready", palette } : { kind: "pale" });
      } catch {
        // Kanvas tercemar (CORS) atau gambar tidak bisa digambar. Bukan galat
        // yang perlu ditonjolkan: server tetap akan membacanya saat disimpan.
        finish({ kind: "unreadable" });
      }
    };

    image.onerror = () => finish({ kind: "unreadable" });

    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // Tanpa gambar acuan TAPI tanpa warna manual, tidak ada yang perlu
  // dipratinjau dan panelnya disembunyikan seperti sebelumnya. Begitu admin
  // mulai mengetik warna, panel muncul lagi: justru saat itu paling perlu
  // melihat akibatnya, karena warna manual adalah lapisan terakhir yang
  // menimpa semua lapisan lain.
  const hasCustom = Boolean(customColors && Object.keys(customColors).length);

  if (status.kind === "idle" && !hasCustom) return null;

  const note = (text: string) => (
    <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {text}
    </p>
  );

  if (status.kind === "reading") return note("Membaca warna gambar…");

  if (status.kind === "pale") {
    return note(
      "Gambar ini terlalu pucat untuk dijadikan acuan warna (mis. hitam-putih atau berkabut). Gambarnya tetap dipakai sebagai latar sampul, tetapi warna undangan memakai tema dasar."
    );
  }

  if (status.kind === "unreadable") {
    return note(
      "Warna belum bisa dibaca di sini. Gambarnya tetap dibaca ulang di server saat undangan disimpan."
    );
  }

  // Pipeline-nya DICERMINI PERSIS dari `resolveTheme()` di `app/[slug]/page.tsx`:
  // gambar acuan, override adat, warna manual, lalu koreksi kontras terakhir.
  //
  // Fungsi yang sama dipanggil, bukan logikanya yang disalin. Kalau pratinjau
  // memakai jalur sendiri, begitu salah satu langkah berubah admin langsung
  // melihat warna yang berbeda dari yang benar-benar dirender tamu -- dan
  // pratinjau yang menyimpang lebih merusak daripada tidak ada pratinjau.
  //
  // `status.palette` hanya ada saat gambar terbaca; tanpa gambar, pipeline
  // dijalankan tanpa langkah 1 dan hasilnya persis sama dengan yang akan
  // dirender tamu.
  const base = getThemeConfig(themeId);
  const withImage =
    status.kind === "ready"
      ? { ...base, colors: resolvePaletteColors(base.colors, status.palette) }
      : base;

  const finalTheme = ensureReadableTheme(
    applyCustomColorOverride(
      applyCulturalOverride(withImage, { tradition, region: "" }),
      customColors ?? null
    )
  );
  const finalColors = finalTheme.colors;

  const override = getTraditionOverride(tradition).colors;

  const overridden = override
    ? SWATCH_LABELS.filter(({ key }) => key in override).map(
        ({ label }) => label
      )
    : [];

  const customOverridden = hasCustom
    ? SWATCH_LABELS.filter(({ key }) => customColors?.[key]).map(
        ({ label }) => label
      )
    : [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {SWATCH_LABELS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <span
              className="h-10 w-10 rounded-lg border border-zinc-300 dark:border-zinc-600"
              style={{ backgroundColor: finalColors[key] }}
            />
            <span className="text-[0.65rem] text-zinc-500">{label}</span>
            <span className="font-mono text-[0.6rem] text-zinc-400">
              {finalColors[key]}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        Gambar menentukan seluruh kanvas undangan: gambar gelap menghasilkan
        latar gelap dan teks terang, gambar terang sebaliknya. Judul, panel,
        dan ornamen mengikuti warna yang terbaca di gambar, dengan kontrasnya
        dijamin aman.
      </p>

      {overridden.length > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Adat yang dipilih menimpa warna dari gambar pada: {overridden.join(", ")}.
          Pilih adat <strong>Modern</strong> bila ingin warna gambar dipakai penuh.
        </p>
      ) : null}

      {customOverridden.length > 0 ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          Warna manual menimpa hasil tema, adat, dan gambar pada:{" "}
          {customOverridden.join(", ")}.
        </p>
      ) : null}

      {/*
        Pratinjau tata letak: admin yang memilih tema tidak sedang memilih lima
        kotak warna — ia sedang memilih SUSUNAN. Satu miniatur sampul & judul
        yang mengikuti `layout` tema memberi tahu admin: sampul tema ini kartu
        di tengah (`classic`), panel setinggi layar (`veil`), atau gapura
        (`arch`); judulnya rata tengah atau editorial.
      */}
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <span
          className="flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-md border px-1 text-center"
          style={{
            backgroundColor: finalColors.background,
            borderColor: finalColors.accent,
            color: finalColors.primary,
          }}
          aria-hidden="true"
        >
          <span
            className="block w-3/4 rounded-full"
            style={{
              height: 2,
              backgroundColor: finalColors.accent,
            }}
          />
          <span
            className="block w-full leading-none"
            style={{
              fontFamily:
                finalTheme.fonts.scriptFont ?? finalTheme.fonts.headingFont,
              fontSize: 11,
            }}
          >
            Aa
          </span>
          <span
            className="block w-1/2 rounded-full"
            style={{ height: 1, backgroundColor: finalColors.text }}
          />
        </span>

        <div className="flex min-w-0 flex-col gap-0.5 text-xs text-zinc-600 dark:text-zinc-300">
          <p className="font-medium text-zinc-800 dark:text-zinc-100">
            {base.name}
          </p>
          <p>
            Sampul:{" "}
            {finalTheme.layout.cover === "veil"
              ? "panel penuh (veil)"
              : finalTheme.layout.cover === "arch"
                ? "kartu gapura (arch)"
                : "kartu kaca tengah (classic)"}
          </p>
          <p>
            Judul bagian:{" "}
            {finalTheme.layout.section === "editorial"
              ? "rata kiri bergaris (editorial)"
              : "rata tengah (centered)"}
          </p>
          <p>
            Galeri:{" "}
            {finalTheme.layout.gallery === "mosaic"
              ? "dinding bertingkat (mosaic)"
              : "kisi beraturan (grid)"}
          </p>
          <p className="flex items-center gap-1.5">
            <span style={{ color: finalColors.accent }}>
              <MotifCrest motif={base.defaultMotif} width={16} />
            </span>
            Motif bawaan: {base.defaultMotif}
          </p>
        </div>
      </div>
    </div>
  );
}
