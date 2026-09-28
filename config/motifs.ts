/**
 * Katalog "imajinasi" — motif ornamen yang boleh dipilih admin per undangan.
 *
 * KENAPA KATALOG INI ADA
 *
 * Tema menentukan *warna dan karakter umum*. Request customer sering kali jauh
 * lebih spesifik dari tema mana pun: "pakai wayang", "ada meraknya", "bunga
 * sakura", "motif batik parang". Tanpa katalog motif, semua request itu hanya
 * bisa dijawab "tidak tersedia" — padahal justru inilah pembeda utama
 * undangan digital dari sekadar membuat Folder Foto.
 *
 * Karena itu motif dipisah dari tema: satu tema yang sama bisa dipakai untuk
 * sepuluh undangan berbeda, masing-masing dengan imajinasi berbeda, tanpa perlu
 * membuat file tema baru.
 *
 * MOTIF TIDAK DIKUNCI PAKET
 *
 * Semua motif terbuka untuk semua paket. Yang dibedakan paket adalah *seberapa
 * banyak* ornamen yang dipasang (`getDecorLevel()` di `decor.tsx`), bukan motif
 * apa yang boleh dipilih. Alasannya praktis: customer sudah membayar paketnya,
 * dan menolak motif justru memaksa admin membuat file tema baru — persis
 * pekerjaan yang seharusnya dihemat oleh katalog ini.
 *
 * MENAMBAH MOTIF BARU:
 * 1. Tambahkan id ke `MOTIF_IDS`.
 * 2. Tambahkan entri ke `MOTIFS` (label, kategori, catatan untuk admin).
 * 3. Gambar SVG-nya di `components/invitation/Ornaments.tsx`.
 *
 * Berkas ini SENGAJA tidak mengimpor apa pun: ia adalah sumber data murni
 * yang dipakai bersama oleh server, komponen server, dan form admin.
 */

/** Kelompok motif — dipakai untuk mengelompokkan tombol di form admin. */
export type MotifCategory = "batik" | "wayang" | "flora" | "fauna" | "luxury";

/**
 * Daftar semua motif yang dikenal.
 *
 * Dipakai sebagai tipe `MotifId` sekaligus daftar putih saat membaca
 * `theme_config` dari database — nilai yang tidak ada di sini diabaikan, bukan
 * diteruskan ke komponen.
 */
export const MOTIF_IDS = [
  // Batik
  "kawung",
  "parang",
  "ceplok",
  "jlamprang",
  "lasem",
  // Wayang
  "gunungan",
  "wayang-kulit",
  // Flora
  "sakura",
  "melati",
  "monstera",
  // Fauna
  "kupu-kupu",
  "merak",
  "merpati",
  // Mewah
  "damask",
  "art-deco",
] as const;

/** Id motif yang sah. */
export type MotifId = (typeof MOTIF_IDS)[number];

export interface MotifDef {
  id: MotifId;
  /** Nama yang dilihat admin di pemilih motif. */
  label: string;
  category: MotifCategory;
  /**
   * Kalimat singkat yang menjelaskan motifnya ke admin.
   *
   * Ini bukan hiasan: admin perlu tahu persis apa yang akan muncul di
   * undangan, supaya "imajinasi" yang ditawarkan ke customer terasa nyata dan
   * bukan sekadar tebakan.
   */
  note: string;
}

/** Katalog motif. Kunci objek harus sama dengan `id` di dalamnya. */
/**
 * Katalog motif, dikunci dengan `Record<MotifId, MotifDef>`.
 *
 * Tipe itu sendiri yang menjamin kelengkapan: menambahkan id baru ke
 * `MOTIF_IDS` tanpa menambahkan entri di sini akan langsung gagal di
 * `tsc`, begitu juga id yang tidak ada di `MOTIF_IDS` tapi dipakai sebagai
 * kunci. Yang tidak dijamin tipe adalah kecocokan `MOTIFS[id].id` dengan
 * kuncinya — untuk itu cukup teliti saat mengetik, karena akibatnya hanya satu
 * motif yang tidak bisa dipilih admin, bukan halaman yang rusak.
 *
 * Kelengkapan katalog sudah dijamin oleh `Record<MotifId, MotifDef>` di bawah
 * dan oleh `Record<MotifId, …>` di `Ornaments.tsx`: motif yang tidak punya
 * entri maupun gambar akan menggagalkan `tsc`, dan `next build` selalu
 * menjalankan `tsc`.
 */
export const MOTIFS: Record<MotifId, MotifDef> = {
  kawung: {
    id: "kawung",
    label: "Batik Kawung",
    category: "batik",
    note: "Empat oval mengelilingi titik pusat — motif batik paling klasik.",
  },
  parang: {
    id: "parang",
    label: "Batik Parang",
    category: "batik",
    note: "Gelombang diagonal mengalir, kesan kain yang terus berjalan.",
  },
  ceplok: {
    id: "ceplok",
    label: "Batik Ceplok",
    category: "batik",
    note: "Salib silang berjenjang, geometris dan tegas.",
  },
  jlamprang: {
    id: "jlamprang",
    label: "Batik Jlamprang",
    category: "batik",
    note: "Belah ketupat bertingkat yang tersusun diagonal.",
  },
  lasem: {
    id: "lasem",
    label: "Batik Lasem",
    category: "batik",
    note: "Kuncup bunga bertingkat, lembut dan khas pesisir.",
  },
  gunungan: {
    id: "gunungan",
    label: "Gunungan / Kayon",
    category: "wayang",
    note: "Gerbang dunia wayang — siluet gunung lancip, sangat Jawa.",
  },
  "wayang-kulit": {
    id: "wayang-kulit",
    label: "Wayang Kulit",
    category: "wayang",
    note: "Figur wayang bersendi lengkap dengan ceking, benar-benar khas Jawa.",
  },
  sakura: {
    id: "sakura",
    label: "Bunga Sakura",
    category: "flora",
    note: "Kelopak lima yang berbelah, lembut dan romantis.",
  },
  melati: {
    id: "melati",
    label: "Bunga Melati",
    category: "flora",
    note: "Bunga kecil berbentuk bintang, simbol kesucian yang sangat Indonesia.",
  },
  monstera: {
    id: "monstera",
    label: "Daun Monstera",
    category: "flora",
    note: "Daun bercelah, tropis dan bergaya modern.",
  },
  "kupu-kupu": {
    id: "kupu-kupu",
    label: "Kupu-Kupu",
    category: "fauna",
    note: "Sayap bersimetri, ringan dan bebas.",
  },
  merak: {
    id: "merak",
    label: "Burung Merak",
    category: "fauna",
    note: "Mata bulu berulang, paling mewah dari semua motif hewan.",
  },
  merpati: {
    id: "merpati",
    label: "Burung Merpati",
    category: "fauna",
    note: "Siluet burung yang tegas, melambangkan damai dan kirab.",
  },
  damask: {
    id: "damask",
    label: "Damask Arab",
    category: "luxury",
    note: "Motif ogee berganda, ala kain damasyar dan hotel Arab.",
  },
  "art-deco": {
    id: "art-deco",
    label: "Art Deco",
    category: "luxury",
    note: "Kipas dan garis berjenjang, bernuansa era deco 1920-an.",
  },
};

/** Label kategori untuk mengelompokkan tombol di form admin. */
export const MOTIF_CATEGORY_LABELS: Record<MotifCategory, string> = {
  batik: "Batik",
  wayang: "Wayang & Gunungan",
  flora: "Bunga & Daun",
  fauna: "Hewan",
  luxury: "Mewah",
};

/** Urutan kategori saat ditampilkan di form admin. */
export const MOTIF_CATEGORIES: readonly MotifCategory[] = [
  "batik",
  "wayang",
  "flora",
  "fauna",
  "luxury",
];

/**
 * Apakah sebuah nilai adalah motif yang dikenal.
 *
 * Dipakai sebagai type guard, sehingga `MOTIFS[value]` di pemakai berikutnya
 * sudah dijamin ada — tanpa itu, setiap pemakai katalog harus mengecek ulang
 * secara manual di banyak tempat.
 */
export function isMotifId(value: unknown): value is MotifId {
  return (
    typeof value === "string" &&
    (MOTIF_IDS as readonly string[]).includes(value)
  );
}

/**
 * Motif untuk sebuah nilai yang belum tentu dikenal.
 *
 * Nilai asing kembali ke `fallback`, bukan `null`: undangan lama yang
 * `theme_config`-nya kosong harus tetap tampil, dan `null` di seluruh
 * komponen hanya menambah cabang kondisi tanpa menambah keamanan.
 */
export function getMotif(id: string | undefined, fallback: MotifId): MotifDef {
  return isMotifId(id) ? MOTIFS[id] : MOTIFS[fallback];
}

/**
 * Motif untuk sebuah nilai yang belum tentu dikenal, dalam bentuk ID.
 *
 * Ini yang dipakai halaman undangan: komponen butuh `MotifId`, bukan seluruh
 * objek definisinya. Nilai asing kembali ke `fallback`, bukan `null` — undangan
 * lama yang `theme_config`-nya kosong harus tetap tampil, dan `null` di seluruh
 * komponen hanya menambah cabang kondisi tanpa menambah keamanan.
 */
export function resolveMotifId(
  id: string | null | undefined,
  fallback: MotifId
): MotifId {
  return isMotifId(id) ? id : fallback;
}

/** Motif dalam satu kategori, sesuai urutan katalog. */
export function getMotifsByCategory(category: MotifCategory): MotifDef[] {
  return MOTIF_IDS.filter((id) => MOTIFS[id].category === category).map(
    (id) => MOTIFS[id]
  );
}

/**
 * Menentukan motif bawaan sebuah tema dari gaya bingkainya.
 *
 * Dipakai tema yang belum menyebut `defaultMotif`, dan sebagai cadangan kalau
 * `theme_config.motif` berisi nilai yang tidak dikenal — misalnya baris
 * database yang dibuat versi aplikasi yang lebih lama.
 */
export const DEFAULT_MOTIF_BY_FRAME: Record<string, MotifId> = {
  floral: "sakura",
  arch: "gunungan",
  minimalist: "parang",
};

/** Motif bawaan untuk sebuah gaya bingkai. */
export function defaultMotifForFrame(frameStyle: string): MotifId {
  return DEFAULT_MOTIF_BY_FRAME[frameStyle] ?? "kawung";
}

