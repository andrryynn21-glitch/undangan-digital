import type { CSSProperties, ReactNode } from "react";

import type { FrameStyle, ThemeLayout, TierType } from "@/config/themes";
import type { MotifCategory, MotifId } from "@/config/motifs";
import { MOTIFS } from "@/config/motifs";
import {
  MotifCornerGlyph,
  MotifCrest,
  MotifPattern,
  getPatternStep,
} from "@/components/invitation/Ornaments";

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
  /**
   * Tata letak sampul, judul bagian, dan galeri — dari file tema.
   *
   * Yang selama ini memisahkan "tema" dari "template" adalah tiadanya field ini:
   * setiap undangan memakai susunan yang sama, jadi mengganti tema hanya terasa
   * seperti mengganti cat. Dengan satu field ini, `CoverGate`, `Section`, dan
   * `PhotoGallery` masing-masing bercabang susunannya tanpa menambah satu pun
   * prop baru — persis alasan objek ini dibuat.
   */
  layout: ThemeLayout;
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
  /** Ornamen motif berukuran besar di belakang judul tiap bagian */
  watermark: boolean;
  /** Kepekatan ornamen besar itu; sengaja jauh lebih samar dari pola latar */
  watermarkOpacity: number;
}

const DECOR_PROFILES: Record<DecorLevel, DecorProfile> = {
  simple: {
    corners: false,
    doubleFrame: false,
    pattern: false,
    patternOpacity: 0,
    shimmerHeading: false,
    strongGlass: false,
    watermark: false,
    watermarkOpacity: 0,
  },
  rich: {
    corners: true,
    doubleFrame: false,
    pattern: true,
    patternOpacity: 0.1,
    shimmerHeading: false,
    strongGlass: true,
    watermark: true,
    watermarkOpacity: 0.07,
  },
  lavish: {
    corners: true,
    doubleFrame: true,
    pattern: true,
    patternOpacity: 0.16,
    shimmerHeading: true,
    strongGlass: true,
    watermark: true,
    watermarkOpacity: 0.11,
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

/**
 * Satu sudut bingkai, digambar untuk posisi kiri-atas lalu diputar.
 *
 * PEMBAGIAN TUGAS: LENGKUNG IKUT `frameStyle`, ORNAMEN IKUT `motif`
 *
 * Dulu keduanya ikut `frameStyle`, dan itu membuat ornamen yang paling sering
 * terulang di seluruh undangan justru satu-satunya yang tidak pernah berubah.
 * `frameStyle` hanya punya tiga nilai, jadi klien yang memilih Burung Merak
 * mendapat sudut yang identik dengan klien yang memilih Batik Parang —
 * padahal sudut ini muncul empat kali di setiap kartu, di tiga belas tempat.
 *
 * Sekarang lengkungnya saja yang ikut `frameStyle` (itu memang bentuk
 * BINGKAI-nya), sementara ornamen di siku diganti glyph motif. Rosette floral,
 * relung arch, dan wajik minimalist yang dulu digambar di sini sengaja dihapus,
 * bukan ditambahkan bersama glyph: ketiganya menempati titik yang sama persis
 * dengan glyph dan hasilnya hanya tumpang tindih.
 */
function CornerMark({
  frameStyle,
  doubleFrame,
  motif,
  spin,
}: {
  frameStyle: FrameStyle;
  doubleFrame: boolean;
  motif: MotifId;
  /** Rotasi yang dikenakan pemanggil pada sudut ini; glyph diputar balik. */
  spin: 0 | 90 | 180 | 270;
}) {
  const glyph = <MotifCornerGlyph motif={motif} spin={spin} />;

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
        {glyph}
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
        {glyph}
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
      {glyph}
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

  // Tiap sudut dibuat terpisah, bukan satu elemen yang dipakai ulang empat
  // kali: glyph motif di dalamnya butuh tahu berapa derajat sudutnya diputar
  // supaya ia bisa memutar balik dan tetap berdiri tegak.
  const corner = (spin: 0 | 90 | 180 | 270) => (
    <CornerMark
      frameStyle={design.frameStyle}
      doubleFrame={profile.doubleFrame}
      motif={design.motif}
      spin={spin}
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
        {corner(0)}
      </svg>
      <svg className={`${shared} top-0 right-0 rotate-90`} viewBox="0 0 64 64">
        {corner(90)}
      </svg>
      <svg
        className={`${shared} right-0 bottom-0 rotate-180`}
        viewBox="0 0 64 64"
      >
        {corner(180)}
      </svg>
      <svg
        className={`${shared} bottom-0 left-0 -rotate-90`}
        viewBox="0 0 64 64"
      >
        {corner(270)}
      </svg>
    </span>
  );
}

// ============================================
// Ornamen besar di belakang judul bagian
// ============================================

/**
 * Motif yang sama, dirender BESAR dan sangat samar di belakang judul bagian.
 *
 * KENAPA INI ADA
 *
 * Sampai sini motif hanya pernah tampil kecil: 20–26 px di pembatas, 13–33 px
 * di sudut, dan sebagai pola latar yang begitu samar sampai tidak terbaca
 * bentuknya. Jadi klien yang memilih Wayang Kulit sebenarnya tidak pernah
 * MELIHAT wayangnya — ia hanya melihat titik-titik kecil. Di sini motif itu
 * mendapat panggung: satu crest selebar 150 px di belakang setiap judul.
 *
 * KENAPA KEPEKATANNYA LEBIH RENDAH DARI POLA LATAR
 *
 * Pola latar (0,1 / 0,16) berupa ubin kecil berulang, jadi tidak ada satu
 * bentuk pun yang cukup besar untuk bersaing dengan teks. Ornamen ini satu
 * bentuk besar yang tepat berada di belakang judul, jadi pada kepekatan yang
 * sama ia akan menarik mata menjauh dari judulnya. 0,07 / 0,11 adalah jejak,
 * bukan gambar.
 *
 * Silver tetap tidak mendapat apa pun, supaya janji "tampil bersih" di
 * halaman paket tidak dilanggar.
 */
export function SectionWatermark({
  design,
  width = 150,
  className = "",
  align = "center",
}: {
  design: Design;
  /** Lebar crest dalam piksel. */
  width?: number;
  className?: string;
  /**
   * Penempatan horizontal watermark di dalam induk ber-`position: relative`.
   * `center` (bawaan): di tengah, di atas judul — dipakai header rata tengah.
   * `right`: menempel di kanan, di belakang konten header — dipakai header
   * editorial yang rata kiri, supaya motif besar tidak bertumpuk dengan garis
   * aksen tegak di kirinya.
   */
  align?: "center" | "right";
}) {
  const profile = DECOR_PROFILES[design.level];

  if (!profile.watermark) return null;

  const positionClass =
    align === "right"
      ? "top-1/2 right-0 -translate-y-1/2"
      : "top-0 left-1/2 -translate-x-1/2 -translate-y-[38%]";

  return (
    // Diletakkan di atas judul lalu digeser naik 38% tingginya sendiri, bukan
    // dipusatkan di tengah `header`: di tengah, ia akan berhimpitan dengan
    // crest kecil di `Divider` yang bentuknya SAMA PERSIS, dan dua salinan
    // bentuk yang sama saling menimpa terbaca sebagai kesalahan render.
    // Ruang di atasnya memang kosong — `Section` memberi `py-16 sm:py-24`.
    <span
      className={`pointer-events-none absolute ${positionClass} ${className}`}
      style={{
        color: "var(--theme-accent)",
        opacity: profile.watermarkOpacity,
      }}
      aria-hidden="true"
    >
      <MotifCrest motif={design.motif} width={width} />
    </span>
  );
}

// ============================================
// Kelopak jatuh di depan konten
// ============================================

/**
 * Bentuk satu serpih yang jatuh, dipilih dari KATEGORI motif.
 *
 * KENAPA KATEGORI, BUKAN MOTIFNYA SENDIRI
 *
 * Lima belas motif tidak butuh lima belas serpih. Serpih ini melintas pada
 * ukuran 12–22 px sambil berputar, dan pada ukuran itu detail yang membedakan
 * Kawung dari Ceplok sama sekali tidak sampai ke mata — kerjanya hanya
 * memperberat DOM. Yang benar-benar terbaca sambil bergerak cuma golongan
 * bentuknya: bersudut, melengkung, atau berkilau. Kategori sudah tepat
 * memisahkan itu, dan `Record<MotifCategory, …>` membuat kategori baru di
 * `config/motifs.ts` gagal di `tsc` kalau serpihnya belum digambar.
 *
 * Semuanya digambar di kanvas 12×12 sebagai fragmen tanpa `<svg>`, sama seperti
 * crest dan glyph di `Ornaments.tsx`: pembungkusnya yang menentukan ukuran.
 */
const PARTICLE_SHAPES: Record<MotifCategory, () => ReactNode> = {
  // Wajik/mlinjon — belah ketupat yang jadi pengisi hampir semua motif batik.
  batik: () => <path d="M6 0.6 11.4 6 6 11.4 0.6 6z" fill="currentColor" />,

  // Kayon: puncak lancip, sisi cembung yang melebar, DASAR RATA DAN LEBAR.
  //
  // Dasar rata itulah seluruh alasannya. Versi pertama memakai dasar melengkung
  // dan hasilnya — setelah dirender — bukan kayon melainkan TETES AIR, persis
  // sama dengan kelopak flora di bawah; seluruh lapisan jadi terbaca hujan.
  // Komentar lama di sini mengklaim "sisi lurus" yang membedakan keduanya, dan
  // itu salah: pada 14 px selisih lurus/melengkung tidak sampai ke mata.
  // Yang sampai ke mata cuma dasarnya, karena tetes air TIDAK PERNAH berdasar
  // rata — begitu dasarnya rata, bacaan hujan mustahil.
  wayang: () => (
    <path
      d="M6 0.5C7.4 4 9.2 7.6 9.6 11.5H2.4C2.8 7.6 4.6 4 6 0.5z"
      fill="currentColor"
    />
  ),

  // Tumpal: segitiga BERSISI LURUS yang MENGHADAP KE BAWAH.
  //
  // Kedua sifatnya menjawab satu masalah yang sama. Kategori wayang di atas
  // juga bersegitiga, jadi tanpa pembeda yang tahan ukuran kecil, nusantara
  // dan wayang akan menjatuhkan serpih yang sama. Arah adalah pembeda yang
  // paling murah dan paling tahan: pada 12 px sambil berputar, "lancip di
  // bawah" dan "lancip di atas" masih terbaca saat selisih bentuk apa pun
  // sudah tidak. Sisinya dijaga lurus-tajam karena tumpal pada kain songket
  // memang digarap dengan sisi lurus — dan itu sekaligus menjauhkannya dari
  // sisi cembung milik kayon.
  nusantara: () => (
    <path d="M1.2 1.8H10.8L6 11.2z" fill="currentColor" />
  ),

  // Bintang delapan — bentuk inti seluruh ornamen girih.
  //
  // DELAPAN SUDUT, BUKAN EMPAT, dan itu bukan pilihan gaya. Kategori luxury di
  // bawah memakai kilau empat arah, jadi bintang bersudut empat akan langsung
  // tertukar dengannya. Sudut kedelapan juga yang membuat siluetnya mendekati
  // bundar pada ukuran kecil — persis kesan yang benar untuk ornamen geometris
  // Islam, yang memang tidak pernah bersiluet tajam seperti kilau.
  //
  // Sisinya LURUS, tidak cekung seperti kilau luxury: cekungan membuat sudutnya
  // tampak seperti jarum, dan jarum pada 12 px hilang jadi titik.
  islami: () => (
    <path
      d="M6 0.4 7.11 3.32 9.96 2.04 8.68 4.89 11.6 6 8.68 7.11 9.96 9.96 7.11 8.68 6 11.6 4.89 8.68 2.04 9.96 3.32 7.11 0.4 6 3.32 4.89 2.04 2.04 4.89 3.32z"
      fill="currentColor"
    />
  ),

  // Kelopak: ujung lebar membulat di atas, pangkal menyempit jadi satu titik di
  // bawah — persis cara kelopak menempel di tangkainya.
  //
  // ARAHNYA SENGAJA TERBALIK dari tetes air: lancip di BAWAH, bulat di ATAS.
  // Versi pertama lancip di atas dan membulat di bawah, dan itu definisi
  // siluet tetes air — mata selalu memilih bacaan itu lebih dulu. Tidak ada
  // tetes air yang jatuh dengan ujung tumpul di depan, jadi membalik arahnya
  // menutup bacaan itu sepenuhnya.
  //
  // BELAHAN SAKURA SUDAH DICOBA DUA KALI DAN DIBUANG. Catatan motifnya memang
  // menjanjikan "kelopak lima yang berbelah", jadi belahan di tengah ujungnya
  // tampak seperti pilihan yang benar — tapi dirender, hasilnya HATI, dua kali.
  // Percobaan kedua sudah menyempitkan lebarnya (6,2 berbanding tinggi 9,2) dan
  // mendangkalkan belahannya sampai 1,1 unit, dan tetap terbaca hati. Ternyata
  // yang menciptakan bacaan itu bukan proporsinya, melainkan pasangan CEKUNGAN
  // DI ATAS + UJUNG LANCIP DI BAWAH — dan pasangan itu tidak bisa dipertahankan
  // sambil membuang bacaannya.
  //
  // Jadi belahannya diserahkan ke tempat yang memang bisa menampungnya: crest
  // dan ubin pola di `Ornaments.tsx`, yang tampil pada 20–150 px. Di 12–22 px
  // sambil berputar, belahan sedalam satu piksel tidak pernah sampai ke mata —
  // yang sampai cuma bacaan hati yang tidak diminta siapa pun.
  flora: () => (
    <path
      d="M6 11.4C3.4 9 2.4 6.4 2.8 4.4 3.2 2.2 4.5 1 6 0.8 7.5 1 8.8 2.2 9.2 4.4 9.6 6.4 8.6 9 6 11.4z"
      fill="currentColor"
    />
  ),

  // Bulu: bilah yang TIDAK SIMETRIS — satu sisi membusung jauh, sisi lain
  // menempel dekat tangkai.
  //
  // Dua hal dibuang dari versi pertama, keduanya karena dirender lebih dulu.
  // (1) Tulang di tengah: sebagai garis pekat di atas badan yang pucat, ia
  //     terbaca JAHITAN, bukan tangkai bulu.
  // (2) `fillOpacity` 0,62 pada badannya: nilai itu BERKALI DUA dengan
  //     kepekatan lapisan (0,16–0,36), jadi kategori fauna tampil jauh lebih
  //     pucat dari empat kategori lain — perbedaan yang tidak pernah
  //     dimaksudkan, cuma akibat sampingan dua kepekatan yang bertumpuk.
  // Ketidaksimetrisan sekarang yang memikul seluruh beban pembeda, dan justru
  // itu yang paling tahan ukuran kecil: keempat serpih lain bersimetri, jadi
  // yang ini satu-satunya yang tampak MIRING — dan miring masih terbaca di
  // 12 px, saat detail apa pun sudah tidak.
  fauna: () => (
    <path
      d="M6 0.5C8.4 3.2 9.4 6.6 8.2 9.2 7.6 10.4 6.6 11.2 5.7 11.5 5.2 9.6 4.6 7 4.8 4.8 4.9 3.1 5.4 1.6 6 0.5z"
      fill="currentColor"
    />
  ),

  // Kilau empat arah dengan sisi cekung — bentuk yang paling tidak mungkin
  // tertukar dengan daun atau kelopak apa pun.
  luxury: () => (
    <path
      d="M6 0.4C6.7 3.9 8.1 5.3 11.6 6 8.1 6.7 6.7 8.1 6 11.6 5.3 8.1 3.9 6.7 0.4 6 3.9 5.3 5.3 3.9 6 0.4z"
      fill="currentColor"
    />
  ),
};

/**
 * Banyaknya serpih per tingkat paket.
 *
 * Angkanya sengaja kecil. Yang dikejar kesan GERIMIS kelopak — beberapa serpih
 * yang sesekali melintas — bukan hujan. Lapisan ini berada di depan teks, jadi
 * jumlah yang terlalu banyak berubah dari mewah menjadi mengganggu, dan setiap
 * serpih membawa dua animasi transform yang harus dijalankan terus-menerus.
 *
 * Silver nol, bukan sedikit: janji paketnya "tampil bersih", dan satu-dua
 * kelopak yang melayang justru terbaca sebagai kesalahan, bukan hiasan.
 */
const PARTICLE_COUNT: Record<DecorLevel, number> = {
  simple: 0,
  rich: 9,
  lavish: 14,
};

/**
 * Nilai 0–1 yang tampak acak tapi SEPENUHNYA ditentukan indeks.
 *
 * `Math.random()` di sini akan merusak halaman, bukan cuma jelek: komponen ini
 * dirender di server, lalu React membandingkan hasilnya dengan render pertama
 * di browser. Dua panggilan acak selalu berbeda, jadi setiap serpih akan
 * memicu hydration mismatch.
 *
 * Kelipatan tak-rasional (rasio emas dan √2 − ⁄₂) dipakai karena barisan
 * `frac(n·α)` untuk α tak rasional tersebar rata tanpa pernah berulang — jadi
 * sembilan serpih tidak akan pernah kebetulan sejajar, yang akan langsung
 * terbaca sebagai pola.
 */
function spread(index: number, salt: number): number {
  const value = (index + 1) * 0.6180339887 + salt * 0.7548776662;
  return value - Math.floor(value);
}

/**
 * Angka stabil dari sebuah teks, dipakai sebagai bumbu tambahan `spread()`.
 *
 * KENAPA PERLU
 *
 * Tanpa ini seluruh nilai hanya bergantung pada indeks, jadi SETIAP undangan
 * pada tingkat yang sama mendapat susunan kelopak yang identik — posisi, ukuran,
 * dan fase animasi yang sama persis. Dua undangan yang dibuka bersebelahan akan
 * memperlihatkannya, dan yang terbaca bukan "tema yang konsisten" melainkan
 * template yang belum disesuaikan.
 *
 * Diambil dari id motif, bukan dari slug undangan, karena motif sudah ada di
 * `design` — dan menambah prop baru hanya untuk mengacak hiasan berarti setiap
 * pemanggil `PetalLayer` harus ikut diubah.
 *
 * Tetap TIDAK BOLEH acak: hasilnya harus sama di server dan di browser, jadi
 * yang dipakai adalah hash biasa atas teks yang sudah pasti sama di keduanya.
 */
function seedOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  }
  return hash;
}

/**
 * Serpih motif yang jatuh perlahan DI DEPAN seluruh isi undangan.
 *
 * KENAPA DI DEPAN, padahal semua ornamen lain di belakang
 *
 * Isi undangan duduk di kartu kaca yang menutup hampir seluruh lebar layar.
 * Apa pun yang bergerak di belakangnya praktis tidak pernah terlihat — itu
 * sebabnya pola latar `Backdrop` sudah bergerak sejak lama tanpa ada yang
 * menyadarinya. Supaya gerakan benar-benar terasa, ia harus melintas di depan.
 *
 * Yang membuat itu aman ada di `app/globals.css` (`.inv-petals`): lapisannya
 * `pointer-events: none` sehingga tidak bisa mencuri satu klik pun, dan
 * z-index-nya 60 — di depan sampul (50) supaya efeknya terlihat sejak layar
 * pertama, tapi di belakang lightbox galeri (100) supaya foto yang dibuka penuh
 * layar tidak pernah terhalang.
 *
 * SEMUA NILAINYA DITURUNKAN DARI INDEKS, bukan diacak — lihat `spread()`.
 */
export function PetalLayer({ design }: { design: Design }) {
  const count = PARTICLE_COUNT[design.level];

  if (count === 0) return null;

  const Shape = PARTICLE_SHAPES[MOTIFS[design.motif].category];

  // Digeser per motif supaya susunannya tidak sama di semua undangan; lihat
  // `seedOf()`. Setiap bumbu diberi jarak 1 supaya kelima nilai di bawah tetap
  // saling tidak berhubungan.
  const seed = seedOf(design.motif);

  return (
    <div className="inv-petals" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const size = 12 + Math.round(spread(i, seed + 1) * 10);
        const fall = 16 + Math.round(spread(i, seed + 2) * 12);
        const sway = 5 + Math.round(spread(i, seed + 3) * 4);

        // Kolomnya DIBAGI RATA lebih dulu, baru digoyang sepertiga lebar kolom.
        // Kalau posisinya murni dari `spread()`, sembilan nilai acak sangat
        // mungkin menyisakan separuh layar kosong sementara separuh lainnya
        // menggerombol — dan gerombolan itu terbaca sebagai bocor, bukan angin.
        const left = ((i + 0.35 + spread(i, seed + 4) * 0.3) / count) * 100;

        // Jeda NEGATIF, sepanjang satu putaran jatuhnya: tanpa ini semua serpih
        // baru mulai dari atas layar saat halaman dibuka, jadi tamu menunggu
        // belasan detik sebelum melihat apa pun. Dengan jeda negatif, animasi
        // sudah berjalan di tengah-tengah sejak frame pertama.
        const delay = (spread(i, seed + 5) * fall).toFixed(1);

        // Yang besar lebih pekat, yang kecil lebih samar — memberi kesan jarak,
        // jadi lapisan ini terbaca punya kedalaman alih-alih menempel di kaca.
        // Dibulatkan karena hasil mentahnya ikut terkirim apa adanya ke HTML:
        // tanpa ini sebagian serpih mengirim `opacity:0.24000000000000002`.
        const opacity = (0.16 + ((size - 12) / 10) * 0.2).toFixed(2);

        return (
          <span
            key={i}
            className="inv-petal"
            style={
              {
                left: `${left.toFixed(2)}%`,
                "--inv-petal-fall": `${fall}s`,
                "--inv-petal-sway": `${sway}s`,
                "--inv-petal-delay": `-${delay}s`,
              } as CSSProperties
            }
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 12 12"
              style={{ color: "var(--theme-accent)", opacity }}
              focusable="false"
            >
              <Shape />
            </svg>
          </span>
        );
      })}
    </div>
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
 * dari `frameStyle`, jadi semua tema hanya punya tiga varian latar yang bisa
 * ditampilkan; sekarang motifnya bebas.
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
 *
 * `variant` — ini jalan masuknya font script ke halaman tanpa merombak puluhan
 * panggilan yang sudah ada:
 *
 *   - `heading` (bawaan): perilaku lama persis, font judul.
 *   - `script`: memakai `--theme-font-script` untuk aksen pendek tulisan tangan
 *     ("The Wedding Of", sapaan tamu). Kilau VIP tidak dipasang di sini, bukan
 *     karena lupa, melainkan karena gradasi `inv-shimmer` dirancang untuk huruf
 *     berjenjang dan membuat sambungan script berpendar putih.
 */
export function ThemedHeading({
  children,
  level,
  className = "",
  as: Tag = "h2",
  variant = "heading",
}: {
  children: ReactNode;
  level: DecorLevel;
  className?: string;
  as?: "h1" | "h2" | "h3";
  variant?: "heading" | "script";
}) {
  const shimmer = DECOR_PROFILES[level].shimmerHeading;

  if (variant === "script") {
    return (
      <Tag
        className={className}
        style={{
          fontFamily: "var(--theme-font-script)",
          color: "var(--theme-primary)",
        }}
      >
        {children}
      </Tag>
    );
  }

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
