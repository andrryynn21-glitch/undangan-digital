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
 * kontras sebelum dipakai. Gambar menentukan rona, tema dasar menjaga
 * keterbacaan.
 *
 * KANVAS, BUKAN SEKADAR LATAR
 *
 * Versi lama membiarkan `background` dan `text` selalu milik tema dasar.
 * Itu benar untuk gambar terang, tapi salah untuk gambar gelap: sampul
 * batik gelap ikut gelap, sementara isi halaman tetap krem terang. Dua
 * bahasa visual berbeda dalam satu dokumen, dan itulah yang bikin terasa
 * jelek, padahal secara teknis tidak ada yang rusak.
 *
 * Sekarang `luminance` gambar juga menentukan kanvas: gambar gelap
 * mendapat kanvas gelap, dengan `background` dan `text` diturunkan dari
 * rona gambar itu sendiri sehingga tetap nyambung dengan foto.
 */

import type { ThemeCanvasTokens, ThemeColors } from "@/config/themes";

/** Ambang kontras WCAG AA untuk teks biasa. */
const TEXT_CONTRAST = 4.5;

/** Ambang WCAG untuk elemen non-teks (ornamen, garis, ikon). */
const DECOR_CONTRAST = 3;

/** Jarak rona minimum agar aksen terbaca berbeda dari warna utama. */
const MIN_HUE_DISTANCE = 40;

/** Pemutaran rona bila gambar tidak menyediakan warna kedua yang cukup beda. */
const HUE_ROTATION = 150;

/**
 * Ambang `luminance` gambar untuk memilih kanvas.
 *
 * Di bawah `DARK_CANVAS_MAX` gambar dianggap gelap → kanvas gelap. Di atas
 * `LIGHT_CANVAS_MIN` dianggap terang → kanvas terang. Di antara keduanya
 * ($0,42–0,55$ dilema) keputusan dibawa ke tema dasar lewat
 * `background`-nya, karena kedua pilihan sama-sama masih masuk akal.
 */
const DARK_CANVAS_MAX = 0.42;
const LIGHT_CANVAS_MIN = 0.55;

/**
 * Rona target aksen ketika gambar hanya menyediakan satu warna (coklat batik).
 *
 * BAHAYA ROTASI BLIND
 *
 * Rotasi tetap 150° (lihat `HUE_ROTATION`) tapi TIDAK lagi diterapkan
 * buta pada apa pun. Dari coklat batik hue ~15°, rotasi 150° mendarat
 * persis di hue ~165° — hijau/teal. Hasilnya: aksen hijau tosca di antara
 * krem dan coklat tua, warna yang tidak ada di mana pun pada foto maupun
 * konsep batik Jawa, dan itulah yang terlihat "jelek" seperti yang dilaporkan.
 *
 * Aturannya: rona aksen harus dari gambar bila warnanya memang tersedia.
 * Bila tidak — gambar hanya punya satu keluarga warna — warna tuanya
 * dipindahkan ke `WARM_ACCENT_HUE` (emas), yang justru warna khas batik
 * Jawa dan selalu serasi dengan coklatnya. Emas juga satu-satunya aksen
 * yang selalu terbaca di atas kanvas gelap maupun terang.
 */
const WARM_ACCENT_HUE = 42;

/** Jarak rona dari warna utama untuk menyatakan "warnanya memang beda". */
const DISTINCT_HUE_DISTANCE = 22;

/** Kecerahan kanvas gelap (0-1). Cukup gelap utk teks putih, tapi bukan hitam. */
const DARK_CANVAS_LIGHTNESS = 0.09;

/** Kecerahan kanvas terang — sedikit di bawah putih murni supaya terasa hangat. */
const LIGHT_CANVAS_LIGHTNESS = 0.975;

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
// Override warna manual
// ============================================

/**
 * Warna yang dipilih manual oleh admin, disimpan di `theme_config`.
 *
 * HANYA berisi field yang benar-benar diisi admin. Sifat "partial" adalah inti
 * dari bentuknya: admin boleh menimpa `accent` saja tanpa menyentuh
 * `background`, dan warna yang tidak disebut tetap milik tema. Kalau tipenya
 * penuh, setiap form wajib mengirim kelima warna dan kita kembali ke "admin
 * tidak boleh memilih sebagian" — persis batasan yang sedang dihapus.
 */
export type CustomColorOverride = Partial<
  Pick<ThemeColors, "primary" | "secondary" | "background" | "text" | "accent">
>;

/**
 * Field warna yang boleh ditimpa manual, dengan label untuk form admin.
 *
 * Dipakai bersama oleh form dan server action supaya keduanya tidak bisa
 * berbeda pendapat tentang warna apa saja yang boleh diubah — kalau tidak,
 * form bisa menampilkan input untuk `text` sementara server membuangnya.
 */
export const CUSTOM_COLOR_FIELDS = [
  { key: "background", label: "Latar", hint: "W dasar halaman." },
  { key: "primary", label: "Utama", hint: "Judul & tombol utama." },
  { key: "secondary", label: "Pendukung", hint: "Kartu & panel." },
  { key: "accent", label: "Aksen", hint: "Ornamen, garis, ikon." },
  { key: "text", label: "Teks", hint: "Tulisan di atas latar." },
] as const satisfies readonly { key: keyof CustomColorOverride; label: string; hint: string }[];

/** Warna hex yang boleh dikirim admin: `#rgb` atau `#rrggbb`. */
const HEX_INPUT = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Baca override warna dari `theme_config` dengan aman.
 *
 * Nilai yang bukan hex yang benar DIABAIKAN, bukan membuat halaman gagal. Ini
 * lapisan yang sama dengan `parseDerivedPalette` dan `parseMotifSelection`:
 * data JSONB bisa saja berasal dari versi aplikasi yang lebih lama, atau dari
 * admin yang mengetik warna dengan format yang tidak kita dukung. Menampilkan
 * undangan dengan warna tema yang benar selalu lebih baik daripada halaman
 * putih kosong.
 */
export function parseCustomColors(value: unknown): CustomColorOverride | null {
  if (typeof value !== "object" || value === null) return null;

  const raw = value as Record<string, unknown>;
  const out: CustomColorOverride = {};

  for (const { key } of CUSTOM_COLOR_FIELDS) {
    const color = raw[key];
    if (typeof color === "string" && HEX_INPUT.test(color.trim())) {
      out[key] = color.trim();
    }
  }

  return Object.keys(out).length > 0 ? out : null;
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
 * KANVAS DIJARINGKAN DARI GAMBAR
 *
 * `background` dan `text` TIDAK lagi selalu milik tema dasar. `luminance`
 * gambar memilih kanvas lebih dulu:
 * - gelap  -> kanvas gelap, teks terang.
 * - terang -> kanvas terang, teks gelap.
 * - abu-abu -> ikut warna `background` tema dasar.
 *
 * Rona kanvas diambil dari rona gambar, jadi warnanya terasa berasal dari
 * foto yang sama, bukan warna baru yang ditempelkan dari luar.
 *
 * Sisanya:
 * - `primary` — heading, diperlakukan sebagai teks (4,5:1).
 * - `accent` — ornamen & garis (3:1). Rona diambil dari gambar bila memang
 *   tersedia; bila gambar cuma punya satu keluarga warna, aksennya
 *   dipindahkan ke emas, bukan dirotasi buta ke teal.
 * - `secondary` — permukaan kartu, kontras diukur terhadap `text`.
 */
export function resolvePaletteColors(
  base: ThemeColors,
  palette: DerivedPalette
): ThemeColors {
  return resolveCanvasTheme(base, palette);
}

/**
 * Memilih mode kanvas untuk sebuah palet gambar.
 *
 * Area abu-abu (`DARK_CANVAS_MAX`..`LIGHT_CANVAS_MIN`) diserahkan ke tema
 * dasar: memaksa gambar jadi gelap atau terang di sana sama saja, dan
 * pilihan admin lebih layak dihormati.
 */
function pickCanvasMode(
  base: ThemeColors,
  palette: DerivedPalette
): "dark" | "light" {
  if (palette.luminance < DARK_CANVAS_MAX) return "dark";
  if (palette.luminance > LIGHT_CANVAS_MIN) return "light";

  const background = hexToRgb(base.background);

  return background && relativeLuminance(background) <= 0.5 ? "dark" : "light";
}

/**
 * Menjamin semua warna tema sudah terbaca di latarnya sendiri.
 *
 * MASALAH YANG DISELESAIKAN
 *
 * Warna dari gambar sudah selalu dikoreksi kontrasnya, tapi warna yang
 * diketik manual di `config/themes/*.json` dan `config/cultures.ts` TIDAK
 * pernah. Akibatnya tema dasar "Minimal Gold" —emas `#C9A227` di atas krem
 * `#FFFDF9`— punya kontras 2,38:1, dan aksen emas `#A8842C`-nya 3,44:1.
 * Di bawah ambang 4,5:1 untuk teks dan 3:1 untuk ornamen.
 *
 * Itu bukan sekadar pilihan estetika: heading di tema itu memang nyaris tidak
 * terbaca, dan terverifikasi pada 9 dari 14 undangan.
 *
 * Yang dilakukan di sini: `primary` digelapkan atau diterangkan sampai 4,5:1,
 * `accent` sampai 3:1, dan token `canvas` dihitung ulang dari warna final.
 * RONA-nya tetap sama persis — hanya terang yang digeser, persis seperti
 * yang sudah dilakukan untuk warna gambar. Hasilnya emas tetap emas, hanya
 * dalam nada yang bisa dibaca.
 *
 * Undangan tanpa `canvas` (file tema murni) juga ikut diuntungkan karena
 * tokennya diturunkan di sini, bukan di `getThemeCssVars()`.
 */
export function ensureReadableColors(colors: ThemeColors): ThemeColors {
  const background = hexToRgb(colors.background);
  const text = hexToRgb(colors.text);

  if (!background || !text) return colors;

  const primary = forceContrast(
    hexToRgb(colors.primary) ?? background,
    background,
    TEXT_CONTRAST
  );

  const accent = forceContrast(
    hexToRgb(colors.accent) ?? background,
    background,
    DECOR_CONTRAST
  );

  const surface = forceContrast(
    hexToRgb(colors.secondary) ?? background,
    text,
    TEXT_CONTRAST
  );

  // Emas untuk detail mewah mengikuti `accent` yang sudah terkoreksi, lalu
  // dijamin lagi terhadap latar supaya tidak bisa gagal di mode terang.
  const gold = forceContrast(accent, background, DECOR_CONTRAST);
  const dark = relativeLuminance(background) <= 0.5;

  return {
    ...colors,
    primary: rgbToHex(primary),
    secondary: rgbToHex(surface),
    accent: rgbToHex(accent),
    canvas: {
      mode: dark ? "dark" : "light",
      surface: rgbToHex(surface),
      border: rgbToHex(
        dark
          ? hslToRgb(rgbToHsl(background)[0], 0.28, 0.3)
          : hslToRgb(rgbToHsl(background)[0], 0.28, 0.86)
      ),
      muted: colors.text,
      gold: rgbToHex(gold),
      onPrimary: relativeLuminance(primary) > 0.45 ? "#12100E" : "#FFFDF9",
    },
  };
}

/**
 * Token cadangan saat warna gambar tidak terbaca: cukup, tapi tetap aman. */
function staticCanvasTokens(
  base: ThemeColors,
  baseBackground: Rgb | null,
  baseText: Rgb | null
): ThemeCanvasTokens {
  // Tanpa `base.background` yang terbaca, warna tetap dijaga oleh tema dasar
  // (sudah tervalidasi saat load), jadi mode disimpulkan darinya.
  const mode =
    baseBackground && relativeLuminance(baseBackground) <= 0.5
      ? "dark"
      : "light";

  const primary = hexToRgb(base.primary) ?? baseBackground ?? [128, 128, 128];

  return {
    mode,
    surface: base.secondary,
    border: mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)",
    muted: baseText ? rgbToHex(baseText) : base.text,
    gold: base.accent,
    onPrimary: relativeLuminance(primary) > 0.45 ? "#12100E" : "#FFFDF9",
  };
}

/**
 * Menyusun seluruh warna tema dari palet gambar + tema dasar.
 *
 * Mengembalikan `ThemeColors` yang sudah diwarnai ulang (kanvas ikut berubah
 * mengikuti terang/gelapnya gambar) sekaligus token turunannya di `canvas`.
 */
export function resolveCanvasTheme(
  base: ThemeColors,
  palette: DerivedPalette
): ThemeColors {
  const mode = pickCanvasMode(base, palette);

  const primarySource = hexToRgb(palette.primary);
  const accentSource = hexToRgb(palette.accent);
  const baseBackground = hexToRgb(base.background);
  const baseText = hexToRgb(base.text);

  // Bila warna gambar tidak terbaca, tema dasar dipakai utuh. Undangan tetap
  // tampil, hanya tidak dapat pewarnaan dari gambar.
  if (!primarySource || !accentSource || !baseBackground || !baseText) {
    return {
      ...base,
      canvas: staticCanvasTokens(base, baseBackground, baseText),
    };
  }

  const [hue, saturation] = rgbToHsl(primarySource);

  // Kanvas: rona gambar dengan saturasi ditahan supaya tidak bersaing
  // dengan isi, dan lightness dikunci di titik yang nyaman untuk teks.
  const canvasSat = Math.min(saturation, 0.32);
  const background = hslToRgb(
    hue,
    canvasSat,
    mode === "dark" ? DARK_CANVAS_LIGHTNESS : LIGHT_CANVAS_LIGHTNESS
  );

  // Teks: putih hangat di kanvas gelap, tinta gelap di kanvas terang.
  const text = forceContrast(
    mode === "dark"
      ? hslToRgb(hue, 0.14, 0.97)
      : hslToRgb(hue, Math.min(saturation, 0.45), 0.12),
    background,
    TEXT_CONTRAST
  );

  // Aksen: rona kedua dari gambar kalau memang beda jauh. Kalau tidak —
  // gambar hanya punya satu keluarga warna, misalnya coklat batik tulam —
  // aksennya pindah ke emas. Detail kenapa rotasi buta tidak lagi dipakai
  // ada di `WARM_ACCENT_HUE`.
  const [primaryHue] = rgbToHsl(primarySource);
  const [accentHue] = rgbToHsl(accentSource);

  const accentBase =
    hueDistance(primaryHue, accentHue) >= DISTINCT_HUE_DISTANCE
      ? accentSource
      : hslToRgb(WARM_ACCENT_HUE, 0.62, 0.45);

  const accent = forceContrast(accentBase, background, DECOR_CONTRAST);

  // Emas: rona konsisten untuk detail mewah, dijamin kontras di dua mode.
  const gold = forceContrast(
    hslToRgb(WARM_ACCENT_HUE, 0.55, mode === "dark" ? 0.62 : 0.42),
    background,
    DECOR_CONTRAST
  );

  // Permukaan kartu: satu langkah jauh dari kanvas ke arah teks, cukup
  // untuk terasa sebagai "kartu" tanpa kehilangan keterbacaan teks di atasnya.
  const surface = forceContrast(
    mode === "dark"
      ? hslToRgb(hue, canvasSat * 0.8, DARK_CANVAS_LIGHTNESS + 0.06)
      : hslToRgb(hue, canvasSat * 0.5, LIGHT_CANVAS_LIGHTNESS - 0.05),
    text,
    TEXT_CONTRAST
  );

  // Warna tombol: `primary` akan dipakai sebagai isian solid, jadi teksnya
  // harus kontras dengan `primary` itu sendiri — bukan dengan kanvas.
  const primary = forceContrast(primarySource, background, TEXT_CONTRAST);

  return {
    ...base,
    background: rgbToHex(background),
    text: rgbToHex(text),
    // `primary` adalah heading, jadi harus lolos ambang teks di kanvas.
    primary: rgbToHex(primary),
    secondary: rgbToHex(surface),
    accent: rgbToHex(accent),
    canvas: {
      mode,
      surface: rgbToHex(surface),
      border: rgbToHex(
        mode === "dark"
          ? hslToRgb(hue, canvasSat, 0.28)
          : hslToRgb(hue, canvasSat, 0.86)
      ),
      muted: rgbToHex(
        forceContrast(
          mode === "dark"
            ? hslToRgb(hue, 0.12, 0.74)
            : hslToRgb(hue, Math.min(saturation, 0.4), 0.42),
          background,
          TEXT_CONTRAST
        )
      ),
      gold: rgbToHex(gold),
      onPrimary: relativeLuminance(primary) > 0.45 ? "#12100E" : "#FFFDF9",
    },
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
