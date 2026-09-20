"use client";

import { useEffect, useState } from "react";

import { getThemeConfig } from "@/config/themes";
import type { ThemeColors } from "@/config/themes";
import { getTraditionOverride } from "@/config/cultures";
import {
  SAMPLE_SIZE,
  derivePaletteFromPixels,
  resolvePaletteColors,
} from "@/lib/palette";
import type { DerivedPalette } from "@/lib/palette";

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

const SWATCH_LABELS: { key: keyof ThemeColors; label: string }[] = [
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
}: {
  /** URL gambar acuan yang sudah terunggah; kosong berarti belum ada. */
  imageUrl: string;
  /** Tema dasar yang sedang dipilih — menentukan latar & teks. */
  themeId: string;
  /** Adat yang sedang dipilih; menimpa warna gambar bila bukan "modern". */
  tradition: string;
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

  if (status.kind === "idle") return null;

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

  const base = getThemeConfig(themeId).colors;
  const fromImage = resolvePaletteColors(base, status.palette);

  // Adat menang atas gambar — urutan yang sama dengan `app/[slug]/page.tsx`.
  // Pratinjau harus menunjukkan hasil AKHIR, bukan hasil setengah jalan.
  const override = getTraditionOverride(tradition).colors;
  const finalColors: ThemeColors = override
    ? { ...fromImage, ...override }
    : fromImage;

  const overridden = override
    ? SWATCH_LABELS.filter(({ key }) => key in override).map(
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
        Latar dan teks selalu mengikuti tema dasar agar isi undangan pasti
        terbaca; gambar menentukan warna judul, panel, dan ornamen.
      </p>

      {overridden.length > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Adat yang dipilih menimpa warna dari gambar pada: {overridden.join(", ")}.
          Pilih adat <strong>Modern</strong> bila ingin warna gambar dipakai penuh.
        </p>
      ) : null}
    </div>
  );
}
