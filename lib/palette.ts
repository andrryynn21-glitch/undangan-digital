/**
 * Logika warna untuk tema yang diturunkan dari gambar.
 *
 * Berkas ini SENGAJA tidak menyentuh `sharp`. Pembacaan piksel ada di
 * `lib/palette-extract.ts` yang hanya jalan saat admin menyimpan undangan,
 * sementara berkas ini ikut jalan setiap kali tamu membuka undangan — jadi
 * isinya harus murni hitungan, tanpa dependensi native.
 *
 * KENAPA WARNA GAMBAR TIDAK DIPAKAI MENTAH-MENTAH
 *
 * Diuji pada foto sampul asli: warna paling luas ternyata abu-abu dinding
 * (porsi 5,3%), dan `sharp.stats().dominant` malah mengembalikan `#080818` —
 * area kecil nyaris hitam yang tidak mewakili apa pun. Dipakai apa adanya
 * sebagai latar + teks, kontrasnya 1,95:1, jauh di bawah ambang terbaca 4,5:1.
 *
 * Karena itu aturannya: `background` dan `text` SELALU milik tema dasar, dan
 * warna yang diambil dari gambar digeser terangnya sampai memenuhi ambang
 * kontras sebelum dipakai. Gambar menentukan rona, tema dasar menjaga keterbacaan.
 */

import type { ThemeColors } from "@/config/themes";

/** Ambang kontras WCAG AA untuk teks biasa. */
const TEXT_CONTRAST = 4.5;

/** Ambang WCAG untuk elemen non-teks (ornamen, garis, ikon). */
const DECOR_CONTRAST = 3;

/** Jarak rona minimum agar aksen terbaca berbeda dari warna utama. */
const MIN_HUE_DISTANCE = 40;

/** Pemutaran rona bila gambar tidak menyediakan warna kedua yang cukup beda. */
const HUE_ROTATION = 150;

/** Langkah pencarian lightness. 0,005 menghasilkan ~200 percobaan per arah. */
const LIGHTNESS_STEP = 0.005;

/**
 * Sisi terpanjang gambar saat dibaca. Menaikkannya tidak mengubah warna yang
 * menang — hanya menambah waktu proses.
 */
export const SAMPLE_SIZE = 64;

/** Presisi kuantisasi: 4 bit per kanal = 4096 ember warna. */
const QUANTIZE_SHIFT = 4;

/** Saturasi minimum agar sebuah warna dianggap "berwarna", bukan abu-abu. */
const MIN_SATURATION = 0.25;

/** Warna terlalu gelap/terang tidak dipakai — ronanya tidak bisa diandalkan. */
const MIN_LIGHTNESS = 0.15;
const MAX_LIGHTNESS = 0.85;

/**
 * Porsi minimum piksel berwarna sebelum gambar dianggap layak jadi sumber tema.
 *
 * Di bawah ini gambar dianggap pucat (hitam-putih, berkabut, sepia lemah) dan
 * temanya tidak diubah sama sekali. Lebih baik memakai tema dasar yang memang
 * dirancang daripada memaksakan rona dari beberapa piksel yang kebetulan berwarna.
 */
const MIN_VIVID_SHARE = 0.02;

export type Rgb = [number, number, number];

/**
 * Palet mentah hasil pembacaan gambar.
 *
 * Disimpan di `theme_config` apa adanya — TANPA koreksi kontras. Koreksinya
 * dikerjakan `resolvePaletteColors()` saat render, karena hasilnya bergantung
 * pada tema dasar yang sedang dipakai: satu palet yang sama harus tetap terbaca
 * kalau admin mengganti tema dari terang ke gelap.
 */
export interface DerivedPalette {
  /** Warna berwarna paling menonjol di gambar. */
  primary: string;
  /** Warna berwarna kedua, rona-nya sudah dipisahkan dari `primary`. */
  accent: string;
  /** Rata-rata terang gambar (0-1); menentukan kekuatan peredup sampul. */
  luminance: number;
}

// ============================================
// Konversi warna
// ============================================

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());

  if (!match) return null;

  const n = parseInt(match[1], 16);

  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const part = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");

  return `#${part(r)}${part(g)}${part(b)}`;
}

/** HSL dengan hue dalam derajat (0-360), saturation & lightness 0-1. */
export function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  // Abu-abu murni tidak punya rona; 0 dipakai sebagai nilai netral.
  if (d === 0) return [0, 0, l];

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return [h * 360, s, l];
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hn = (((h % 360) + 360) % 360) / 360;

  if (s === 0) return [l * 255, l * 255, l * 255];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const channel = (t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  return [
    channel(hn + 1 / 3) * 255,
    channel(hn) * 255,
    channel(hn - 1 / 3) * 255,
  ];
}

// ============================================
// Kontras (WCAG 2.1)
// ============================================

/** Luminans relatif sesuai definisi WCAG. */
export function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  );
}

/** Rasio kontras dua warna, 1:1 (sama) sampai 21:1 (hitam vs putih). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];

  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Menggeser terang sebuah warna sampai kontrasnya terhadap `against` memenuhi
 * `target`, sambil mempertahankan rona & saturasinya.
 *
 * Pencariannya dimulai dari tengah lalu melebar, jadi yang terpilih adalah
 * lightness TERDEKAT yang lolos — warnanya tetap terasa berasal dari gambar,
 * bukan berubah jadi warna lain.
 *
 * Arah pencarian ditentukan latar: di atas latar terang warna digelapkan, di
 * atas latar gelap diterangkan. Bila tidak ada yang mencapai target (misalnya
 * latar abu-abu tengah), yang dikembalikan adalah percobaan terbaik — bukan
 * warna aslinya, karena yang terbaik tetap lebih terbaca.
 */
export function forceContrast(color: Rgb, against: Rgb, target: number): Rgb {
  if (contrastRatio(color, against) >= target) return color;

  const [h, s] = rgbToHsl(color);
  const darken = relativeLuminance(against) > 0.5;

  let best = color;
  let bestRatio = contrastRatio(color, against);

  for (let step = 0; ; step++) {
    const l = darken ? 0.5 - step * LIGHTNESS_STEP : 0.5 + step * LIGHTNESS_STEP;

    if (l < 0 || l > 1) break;

    const candidate = hslToRgb(h, s, l);
    const ratio = contrastRatio(candidate, against);

    if (ratio >= target) return candidate;

    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }

  return best;
}

/** Jarak rona terpendek pada lingkaran warna (0-180). */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;

  return d > 180 ? 360 - d : d;
}

// ============================================
// Pembacaan piksel
// ============================================

interface Bucket {
  count: number;
  r: number;
  g: number;
  b: number;
}

interface Candidate {
  rgb: Rgb;
  share: number;
  hue: number;
  saturation: number;
}

/**
 * Menurunkan palet dari piksel mentah.
 *
 * Bentuk masukannya sengaja serendah mungkin — deretan byte + jumlah kanal —
 * supaya dua pemanggil yang sangat berbeda bisa memakai fungsi yang SAMA:
 * `sharp` di server saat admin menyimpan, dan `<canvas>` di browser saat admin
 * masih memilih gambar. Kalau algoritmanya digandakan, pratinjau di form cepat
 * atau lambat akan menjanjikan warna yang berbeda dari yang tersimpan.
 *
 * `null` berarti temanya tidak usah diubah: gambarnya terlalu pucat untuk jadi
 * acuan warna (hitam-putih, berkabut, sepia lemah).
 */
export function derivePaletteFromPixels(
  data: Uint8Array | Uint8ClampedArray,
  channels: number
): DerivedPalette | null {
  const { vivid, luminance } = collectCandidates(data, channels);

  if (!vivid.length) return null;

  const vividShare = vivid.reduce((sum, c) => sum + c.share, 0);

  if (vividShare < MIN_VIVID_SHARE) return null;

  // Skor = porsi x saturasi. Yang menang adalah warna yang kuat DAN cukup
  // luas — bukan satu piksel neon, bukan juga abu-abu yang kebetulan dominan.
  const ranked = [...vivid].sort(
    (a, b) => b.share * b.saturation - a.share * a.saturation
  );

  const primary = ranked[0];

  // Aksen diambil dari rona yang cukup jauh bila gambar menyediakannya. Bila
  // tidak, `resolvePaletteColors()` yang memutar ronanya — supaya aturan
  // pemisahan rona hanya hidup di satu tempat.
  const accent =
    ranked.find((c) => hueDistance(c.hue, primary.hue) >= MIN_HUE_DISTANCE) ??
    primary;

  return {
    primary: rgbToHex(primary.rgb),
    accent: rgbToHex(accent.rgb),
    // Dibulatkan supaya JSON yang tersimpan tetap ringkas dan enak dibaca.
    luminance: Math.round(luminance * 1000) / 1000,
  };
}

/**
 * Mengelompokkan piksel menjadi ember warna, lalu menyaring yang layak jadi
 * warna hias. Sekalian menghitung rata-rata terang seluruh gambar.
 *
 * Piksel yang nyaris transparan dilewati bila datanya punya kanal alpha: PNG
 * berlatar transparan akan menyumbang hitam pekat yang tidak pernah terlihat.
 */
function collectCandidates(
  data: Uint8Array | Uint8ClampedArray,
  channels: number
): { vivid: Candidate[]; luminance: number } {
  const buckets = new Map<number, Bucket>();
  let luminanceSum = 0;
  let pixels = 0;

  for (let i = 0; i + channels - 1 < data.length; i += channels) {
    if (channels > 3 && data[i + 3] < 128) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const key =
      ((r >> QUANTIZE_SHIFT) << (QUANTIZE_SHIFT * 2)) |
      ((g >> QUANTIZE_SHIFT) << QUANTIZE_SHIFT) |
      (b >> QUANTIZE_SHIFT);

    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = { count: 0, r: 0, g: 0, b: 0 };
      buckets.set(key, bucket);
    }

    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;

    luminanceSum += relativeLuminance([r, g, b]);
    pixels++;
  }

  if (!pixels) return { vivid: [], luminance: 0.5 };

  const vivid: Candidate[] = [];

  for (const bucket of buckets.values()) {
    // Rata-rata isi ember, bukan titik tengahnya — warnanya jadi lebih dekat
    // ke warna yang benar-benar ada di gambar.
    const rgb: Rgb = [
      bucket.r / bucket.count,
      bucket.g / bucket.count,
      bucket.b / bucket.count,
    ];

    const [hue, saturation, lightness] = rgbToHsl(rgb);

    if (
      saturation >= MIN_SATURATION &&
      lightness >= MIN_LIGHTNESS &&
      lightness <= MAX_LIGHTNESS
    ) {
      vivid.push({ rgb, share: bucket.count / pixels, hue, saturation });
    }
  }

  return { vivid, luminance: luminanceSum / pixels };
}

// ============================================
// Penerapan ke tema
// ============================================

/**
 * Menyusun warna tema dari palet gambar + tema dasar.
 *
 * `background` dan `text` tidak pernah disentuh — keduanya milik tema dasar,
 * dan itulah yang menjamin isi undangan selalu terbaca apa pun yang diunggah.
 *
 * Yang diganti hanya warna hias:
 * - `primary` — dipakai heading, jadi diperlakukan sebagai teks (4,5:1).
 * - `accent` — ornamen & garis, ambang non-teks (3:1). Ronanya dipisahkan dari
 *   `primary` supaya keduanya tidak tampak sebagai warna yang sama.
 * - `secondary` — permukaan kartu/panel yang di atasnya ada teks, jadi
 *   kontrasnya diukur terhadap `text`, bukan terhadap `background`.
 */
export function resolvePaletteColors(
  base: ThemeColors,
  palette: DerivedPalette
): ThemeColors {
  const background = hexToRgb(base.background);
  const text = hexToRgb(base.text);
  const primarySource = hexToRgb(palette.primary);
  const accentSource = hexToRgb(palette.accent);

  // Tema dasar berasal dari JSON yang sudah divalidasi, tapi bila salah satu
  // tidak terbaca, lebih baik tema dasar dipakai utuh daripada setengah jadi.
  if (!background || !text || !primarySource || !accentSource) return base;

  const primary = forceContrast(primarySource, background, TEXT_CONTRAST);

  // Aksen dijauhkan ronanya dulu, baru dikoreksi kontras. Urutannya penting:
  // memutar rona sesudah koreksi akan merusak kontras yang sudah didapat.
  const [primaryHue] = rgbToHsl(primary);
  const [accentHue, accentSat, accentLight] = rgbToHsl(accentSource);

  const separated =
    hueDistance(primaryHue, accentHue) >= MIN_HUE_DISTANCE
      ? accentSource
      : hslToRgb(accentHue + HUE_ROTATION, accentSat, accentLight);

  const accent = forceContrast(separated, background, DECOR_CONTRAST);

  // Permukaan panel: rona dari gambar, tapi sangat terang/gelap mengikuti
  // tema dasar supaya teks di atasnya tetap terbaca.
  const [surfaceHue, surfaceSat] = rgbToHsl(primary);
  const surfaceLight = relativeLuminance(background) > 0.5 ? 0.92 : 0.16;
  const secondary = forceContrast(
    hslToRgb(surfaceHue, Math.min(surfaceSat, 0.35), surfaceLight),
    text,
    TEXT_CONTRAST
  );

  return {
    ...base,
    primary: rgbToHex(primary),
    secondary: rgbToHex(secondary),
    accent: rgbToHex(accent),
  };
}

/**
 * Membaca palet dari `theme_config` JSONB dengan aman.
 *
 * Isinya ditulis server sendiri, tapi tetap divalidasi: baris database bisa
 * saja lama, tersunting manual, atau berasal dari versi kode sebelumnya.
 */
export function parseDerivedPalette(value: unknown): DerivedPalette | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const { primary, accent, luminance } = raw;

  if (typeof primary !== "string" || !hexToRgb(primary)) return null;
  if (typeof accent !== "string" || !hexToRgb(accent)) return null;

  return {
    primary,
    accent,
    luminance:
      typeof luminance === "number" && luminance >= 0 && luminance <= 1
        ? luminance
        : 0.5,
  };
}
