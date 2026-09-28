import { useId } from "react";
import type { JSX } from "react";

import type { MotifId } from "@/config/motifs";

/**
 * Pustaka ornamen visual untuk halaman undangan.
 *
 * Setiap motif punya DUA bentuk, dan keduanya dipakai di tempat berbeda:
 *
 * 1. **Tile** — satuan kecil yang diulang jadi pola latar (`MotifPattern`).
 *    Dirancang menyatu dengan tetangganya di setiap sisi, jadi tidak boleh ada
 *    tepi yang menggantung di dalam satu ubin.
 * 2. **Crest** — ornamen berdiri sendiri yang jadi fokus mata
 *    (`MotifCrest`): puncak kartu sampul, titik tengah pembatas bagian, dan
 *    sudut bingkai.
 *
 * KENAPA DIGAMBAR SEBAGAI SVG, BUKAN DIUNDUH SEBAGAI GAMBAR
 *
 * - Tajam di layar retina apa pun, dan tidak menambah permintaan jaringan
 *   untuk tiap ornamen. Undangan dibuka lewat WhatsApp di jaringan seluler,
 *   jadi setiap aset tambahan terasa.
 * - Warna diambil dari `currentColor`, jadi otomatis mengikuti tema — tidak
 *   ada satu pun warna yang di-hardcode di berkas ini.
 * - Bisa dianimasikan lewat CSS tanpa-keyframes per gambar.
 *
 * Ukuran tile sengaja dijaga pada angka yang sama untuk semua motif (lihat
 * `TILE_SIZE`) supaya intensitas pola di latar terasa seragam: motif yang
 * detail otomatis tampil lebih rapat lewat `viewBox` yang lebih kecil, bukan
 * lewat opacity yang berbeda — opacity dipakai untuk kegelapan, bukan untuk
 * kepadatan.
 */

// ============================================
// Ubin motif: batik
// ============================================

/**
 * Kawung: empat oval mengelilingi titik pusat, dipisah kisi diagonal.
 *
 * Bentuk oval yang berulang inilah yang membuat motif ini terbaca sebagai
 * batik, bukan sebagai motif floral biasa.
 */
function KawungTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="20" cy="20" r="10" />
      <g fill="currentColor" stroke="none">
        <ellipse cx="20" cy="10" rx="3.6" ry="6.4" />
        <ellipse cx="20" cy="30" rx="3.6" ry="6.4" />
        <ellipse cx="10" cy="20" rx="6.4" ry="3.6" />
        <ellipse cx="30" cy="20" rx="6.4" ry="3.6" />
      </g>
      <circle cx="20" cy="20" r="2.4" fill="currentColor" stroke="none" />
      {/* Kisi pemisah antarkawung — bagian yang membuatnya terbaca "batik". */}
      <path d="M0 0L40 40M40 0L0 40" strokeWidth="0.5" opacity="0.45" />
    </g>
  );
}

/**
 * Parang: decler S yang berulang diagonal.
 *
 * Gelombangnya disambung dari tepi kanan ke tepi kiri ubin berikutnya, jadi
 * motifnya benar-benar mengalir tanpa sambungan yang terlihat.
 */
function ParangTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M-6 8C2 0 10 16 18 8s16 16 24 8 16 8 24 0" />
      <path d="M-6 24C2 16 10 32 18 24s16 16 24 8 16 8 24 0" />
      <path d="M-6 40C2 32 10 48 18 40s16 16 24 8 16 8 24 0" />
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="14" r="1.8" />
        <circle cx="32" cy="30" r="1.8" />
        <circle cx="12" cy="46" r="1.8" opacity="0.6" />
      </g>
    </g>
  );
}

/** Ceplok: salib silang dengan lengan bertingkat, ciri motif ini. */
function CeplokTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <path
        d="M20 2h7v11h11v7H27v11h-7V20H9v-7h11z"
        fill="currentColor"
        fillOpacity="0.85"
        stroke="none"
      />
      <rect x="2" y="2" width="13" height="13" />
      <rect x="25" y="2" width="13" height="13" />
      <rect x="2" y="25" width="13" height="13" />
      <rect x="25" y="25" width="13" height="13" />
      <circle cx="8.5" cy="8.5" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="31.5" cy="8.5" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="31.5" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="31.5" cy="31.5" r="2.2" fill="currentColor" stroke="none" />
    </g>
  );
}

/**
 * Jlamprang: belah ketupat bertingkat yang tersusun diagonal.
 *
 * Motif ini dikenal sebagai "broken diagonal", jadi ubinnya sengaja berisi
 * dua baris dengan arah berlawanan supaya pola keseluruhan tetap berimbun.
 */
function JlamprangTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M0 0l10 10-10 10L0 10z" fill="currentColor" fillOpacity="0.8" />
      <path d="M20 20l10 10-10 10-10-10z" fill="currentColor" fillOpacity="0.55" />
      <path d="M40 0l-10 10 10 10" strokeWidth="0.9" opacity="0.7" />
      <path d="M0 30l10 10M20 0l10 10" strokeWidth="0.7" opacity="0.5" />
    </g>
  );
}

/** Lasem: kuncup bunga bertingkat, motif khas pesisir Jawa. */
function LasemTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      {/* Kuncup utama, digambar penuh supaya tidak hanya garis. */}
      <path
        d="M20 3c5.2 5.4 8.4 8.6 8.4 13.6a8.4 8.4 0 0 1-16.8 0C11.6 11.6 14.8 8.4 20 3z"
        fill="currentColor"
        fillOpacity="0.72"
        stroke="none"
      />
      <path d="M20 11c3.2 3.4 4.8 5.2 4.8 7.8a4.8 4.8 0 0 1-9.6 0c0-2.6 1.6-4.4 4.8-7.8z" />
      {/* Dua kuncup kecil di bawah, dibuat dengan translate saja supaya
          posisinya pasti — bukan hasil perkalian transform yang sulit
          ditelusuri kalau nanti ada yang mau diubah. */}
      <g opacity="0.7">
        <path d="M9 24c2.8 3 4.2 4.6 4.2 7.2a4.2 4.2 0 0 1-8.4 0c0-2.6 1.4-4.2 4.2-7.2z" />
        <path d="M31 24c-2.8 3-4.2 4.6-4.2 7.2a4.2 4.2 0 0 0 8.4 0c0-2.6-1.4-4.2-4.2-7.2z" />
      </g>
    </g>
  );
}


// ============================================
// Ubin motif: wayang
// ============================================

/**
 * Gunungan (kayon): gerbang dunia wayang dalam bentuk gunung lancip.
 *
 * Untuk pola latar, gunungan diletakkan berdiri dan disusun rapat secara
 * horizontal — itulah penataannya di kain dan di panggung, dan itulah yang
 * membuat pola ini langsung terbaca sebagai wayang, bukan sebagai motif
 * oriental yang umum.
 */
function GununganTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <path
        d="M20 2c3 4.6 5.6 6.8 8.4 9.6 2 2 3.2 3.8 3.2 6.2 0 3.2-2.6 5.2-5.4 7 1.8 2.6 3 4.2 6 5.8 1.8 1 2.4 1.8 2.4 3.4 0 3.4-4 4.8-8 5.2 1 1 1.4 1.4 1.4 2.4 0 .4 0 .6-.2 1H12.2c-.2-.4-.2-.6-.2-1 0-1 .4-1.4 1.4-2.4-4-.4-8-1.8-8-5.2 0-1.6.6-2.4 2.4-3.4 3-1.6 4.2-3.2 6-5.8-2.8-1.8-5.4-3.8-5.4-7 0-2.4 1.2-4.2 3.2-6.2 2.8-2.8 5.4-5 8.4-9.6z"
        fill="currentColor"
        fillOpacity="0.22"
        strokeLinejoin="round"
      />
      {/* Pohon hayat di dalam gunungan — bagian yang membuatnya terbaca
          sebagai lambang, bukan sekadar siluet gunung. */}
      <path d="M20 8v26" strokeWidth="0.9" opacity="0.75" />
      <g fill="currentColor" stroke="none" opacity="0.8">
        <circle cx="20" cy="12" r="1.7" />
        <circle cx="16.6" cy="17" r="1.2" />
        <circle cx="23.4" cy="17" r="1.2" />
        <circle cx="20" cy="21" r="1.2" />
      </g>
    </g>
  );
}

/**
 * Wayang kulit: figur wayang berdiri dengan ceking (tangkai) di tangan.
 *
 * Digambar sebagai garis kontur, bukan silhouette penuh. Untuk motif latar,
 * silhouette penuh dari figur sebesar ini akan berubah jadi blok gelap yang
 * menutup teks di belakangnya — persis masalah yang sudah berulang kali
 * muncul di motif batik.
 */
function WayangKulitTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <path
        d="M20 3c2.6 0 4 1.6 4 3.6 0 1.2-.5 2-1.2 2.7 1.4.9 2.4 2.3 2.4 4.2 0 2.4-1.6 4.3-3.8 4.9l.6 3.2c.2 1.1-.4 2-1.4 2.4l-3.4 1.3v9.4c0 1.1-.8 1.8-1.8 1.8s-1.8-.7-1.8-1.8v-7.6l-3.4 1.6-2.2 6.8c-.3 1-1.2 1.6-2.1 1.3s-1.1-1.4-.8-2.3l2.4-7.2c.2-.7.7-1.2 1.4-1.5l3.5-1.4V25c0-1-.6-1.8-1.6-2.3-1.6-.8-2.6-2.4-2.6-4.3 0-2.1 1.2-3.7 3-4.6"
        strokeLinejoin="round"
      />
      {/* Ceking: garis panjang yang turun ke bawah, ciri wayang kulit. */}
      <path d="M22 20.5L28 34" strokeWidth="0.9" opacity="0.8" />
      <path d="M18 20.5L12 34" strokeWidth="0.9" opacity="0.8" />
      <circle cx="20" cy="9" r="0.9" fill="currentColor" stroke="none" />
    </g>
  );
}

// ============================================
// Ubin motif: flora
// ============================================

/** Sakura: lima kelopak berujung robek, digambar dari lingkaran kelopak. */
function SakuraTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <g fill="currentColor" fillOpacity="0.34">
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="20"
            cy="12.4"
            rx="4.2"
            ry="7.6"
            transform={`rotate(${angle} 20 20)`}
          />
        ))}
      </g>
      <circle cx="20" cy="20" r="3" />
      <g stroke="currentColor" strokeWidth="0.8" opacity="0.75">
        <path d="M20 17v6M17 20h6M17.8 17.8l4.4 4.4M22.2 17.8l-4.4 4.4" />
      </g>
      {/* Ujung kelopak yang robek — tanda pembeda dari bunga daisy biasa. */}
      <g stroke="currentColor" strokeWidth="0.7" opacity="0.6">
        <path d="M20 4.6v2.2M27.7 8.5l-1.6 1.5M33.7 16.3h-2.2M27.7 24.1l-1.6-1.5" />
      </g>
    </g>
  );
}

/** Melati: bunga kecil bintang lima, disusun bergiliran. */
function MelatiTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      {[0, 180].map((offset) => (
        <g key={offset} transform={`translate(${offset === 0 ? 0 : 20} ${offset === 0 ? 0 : 20})`}>
          <g fill="currentColor" fillOpacity="0.38" stroke="none">
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx="10"
                cy="6.4"
                rx="2.4"
                ry="4.4"
                transform={`rotate(${angle} 10 10)`}
              />
            ))}
          </g>
          <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
        </g>
      ))}
    </g>
  );
}

/**
 * Monstera: daun bercelah.
 *
 * Celah dibuat dengan subtracting latar, bukan overlay — jadi warna motifyang
 * "dilubang" benar-benar mengambil warna kanvas, bukan warna arbitrer yang
 * akan terlihat salah saat tema diganti.
 */
function MonsteraTile(): JSX.Element {
  return (
    <g fill="currentColor">
      <path
        d="M20 2c7 3 11 8 11 15 0 4-1.5 7-4 9.5-1-2-2.5-3.5-4.5-4.5.5 2 .5 4 0 6-1.5-1.5-3-2.5-4.5-3 .3 2.8.2 5.5-.5 8.5-5-2.5-8-7-8-13 0-8 5-14 12-18.5z"
        fillOpacity="0.3"
      />
      <path
        d="M20 2c7 3 11 8 11 15 0 4-1.5 7-4 9.5-1-2-2.5-3.5-4.5-4.5.5 2 .5 4 0 6-1.5-1.5-3-2.5-4.5-3 .3 2.8.2 5.5-.5 8.5-5-2.5-8-7-8-13 0-8 5-14 12-18.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <path d="M20 4v32" stroke="currentColor" strokeWidth="0.9" fill="none" />
    </g>
  );
}



// ============================================
// Ubin motif: fauna
// ============================================

/**
 * Kupu-kupu: dua sayap simetris dengan tubuh di tengah.
 *
 * Sayap dibuat dari satu jalur yang dicerminkan lewat `scale(-1, 1)`, jadi sisi
 * kanan dan kiri dijamin identik — kalau keduanya digambar terpisah,
 * perbedaan sekecil apa pun akan terlihat saat pola diulang ribuan kali.
 */
function KupuKupuTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <g fill="currentColor" fillOpacity="0.3" strokeLinejoin="round">
        <path d="M20 20c-4-6-9-8-12-6-3 2-2 7 1 10 2.5 2.5 7 3 11 1z" />
        <path d="M20 24c-3 4-7 6-10 4-2-1.5-1-5 1-7 2-2 6-1.5 9 .5z" />
      </g>
      <g transform="translate(40 0) scale(-1 1)">
        <g fill="currentColor" fillOpacity="0.3" strokeLinejoin="round">
          <path d="M20 20c-4-6-9-8-12-6-3 2-2 7 1 10 2.5 2.5 7 3 11 1z" />
          <path d="M20 24c-3 4-7 6-10 4-2-1.5-1-5 1-7 2-2 6-1.5 9 .5z" />
        </g>
      </g>
      <path d="M20 12v20" strokeWidth="1.1" />
      <path d="M20 12l-2-4M20 12l2-4" strokeWidth="0.8" opacity="0.8" />
    </g>
  );
}

/**
 * Merak: mata bulu — cincin cekung dengan bentuk mata memanjang.
 *
 * Yang membuat pola ini dikenali bukan siluet burungnya, melainkan bentuk
 * "mata" bulunya: bentuk kecil yang bisa diulang ribuan kali tanpa kehilangan
 * pengenalan.
 */
function MerakTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <g transform="translate(20 20)">
        <ellipse rx="7" ry="11" fill="currentColor" fillOpacity="0.22" />
        <ellipse rx="7" ry="11" />
        <ellipse rx="4" ry="6.5" fill="currentColor" fillOpacity="0.45" stroke="none" />
        <ellipse rx="1.8" ry="3" fill="currentColor" stroke="none" />
      </g>
      <g transform="translate(60 20)">
        <ellipse rx="7" ry="11" fill="currentColor" fillOpacity="0.22" />
        <ellipse rx="7" ry="11" />
        <ellipse rx="4" ry="6.5" fill="currentColor" fillOpacity="0.45" stroke="none" />
        <ellipse rx="1.8" ry="3" fill="currentColor" stroke="none" />
      </g>
    </g>
  );
}

/** Merpati: siluet burung terbang, sayap terangkat. */
function MerpatiTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
      <path
        d="M20 24c-3-1-6-4-7-8-.6-2.4.4-4.6 2-5.4 1.6-.8 3.4 0 4.6 1.6 1-1.2 2.2-2 3.6-2.4 2.2-.6 4.4.4 5.4 2.4"
        strokeWidth="1.2"
      />
      <path d="M20 24c2 2 4 3 6.4 3.4 1.6.2 3-.6 3.6-2" />
      <path d="M13 18.5c-1.5 1-2.6 2.4-3.2 4" strokeWidth="0.9" opacity="0.7" />
      <path d="M27 18.5c1.5 1 2.6 2.4 3.2 4" strokeWidth="0.9" opacity="0.7" />
    </g>
  );
}


// ============================================
// Ubin motif: mewah
// ============================================

/**
 * Damask: bentuk ogee berganda yang membelah ubin menjadi empat bagian.
 *
 * Ogee adalah bentuk jantung lancip terbalik yang menjadi ciri motif damasyar.
 * Yang membuatnya berulang dengan rapi adalah simetri lipat, jadi setiap
 * seperempat digambar sekali lalu dicerminkan.
 */
function DamaskTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <g fill="currentColor" fillOpacity="0.3" strokeLinejoin="round">
        <path d="M20 0c5 5 8 9 8 14a8 8 0 0 1-16 0c0-5 3-9 8-14z" />
        <path d="M20 40c-5-5-8-9-8-14a8 8 0 0 1 16 0c0 5-3 9-8 14z" />
      </g>
      <g transform="translate(40 20) rotate(90) translate(-20 0)">
        <path
          d="M20 0c5 5 8 9 8 14a8 8 0 0 1-16 0c0-5 3-9 8-14z"
          fill="currentColor"
          fillOpacity="0.18"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="20" cy="20" r="2" fill="currentColor" stroke="none" />
      <path d="M20 8v-6M20 32v6M8 20h-6M32 20h6" strokeWidth="0.7" opacity="0.6" />
    </g>
  );
}

/** Art Deco: kipas langkah yang tersusun simetris, ikonik era 1920-an. */
function ArtDecoTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      {[0, 90, 180, 270].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 20 20)`}>
          <path d="M20 20V2" strokeWidth="1.1" />
          <path d="M20 20L24 3" strokeWidth="0.8" opacity="0.75" />
          <path d="M20 20L16 3" strokeWidth="0.8" opacity="0.75" />
          <path d="M20 6h3.5M20 10h4.5M20 14h5.5" strokeWidth="0.7" opacity="0.6" />
        </g>
      ))}
      <circle cx="20" cy="20" r="3.4" fill="currentColor" fillOpacity="0.35" />
      <circle cx="20" cy="20" r="3.4" />
    </g>
  );
}


// ============================================
// Registri ubin
// ============================================

/**
 * Peta motif → komponen ubinnya.
 *
 * Dipisah dari `config/motifs.ts` dengan sengaja: berkas konfigurasi adalah
 * sumber data murni yang tidak boleh mengimpat React, sedangkan gambar SVG
 * hanya hidup di satu tempat. Keduanya dihubungkan lewat `MotifId` yang sama.
 *
 * Tipe `Record<MotifId, …>` di bawah adalah penjaga kelengkapan katalog.
 * Menambah id ke `MOTIF_IDS` tanpa menggambar motifyang akan langsung gagal di
 * `tsc`, dan `next build` selalu menjalankan `tsc` — jadi motif tanpa gambar
 * tidak mungkin lolos ke produksi tanpa terlihat.
 *
 * Yang TIDAK tertangkapnya: dua id yang gambarnya tertukar. Bentuknya masih
 * valid, kompilasi tetap hijau, dan yang salah baru terlihat saat admin
 * menatap pratinjaunya. Tidak ada cara murah mendeteksi itu di compile time.
 */
const TILES: Record<MotifId, () => JSX.Element> = {
  kawung: KawungTile,
  parang: ParangTile,
  ceplok: CeplokTile,
  jlamprang: JlamprangTile,
  lasem: LasemTile,
  gunungan: GununganTile,
  "wayang-kulit": WayangKulitTile,
  sakura: SakuraTile,
  melati: MelatiTile,
  monstera: MonsteraTile,
  "kupu-kupu": KupuKupuTile,
  merak: MerakTile,
  merpati: MerpatiTile,
  damask: DamaskTile,
  "art-deco": ArtDecoTile,
};

/**
 * Ukuran satu ubin dalam piksel untuk setiap motif.
 *
 * Tidak seragam disengaja. Motif yang ukurannya kecil (merak, art-deco) diberi
 * ubin lebih besar supayaigua jarak antar motif di layar tetap terasa sama
 * dengan motif besar — kalau semuanya dipaksa 40px, merak akan tampil seperti
 * butiran debu dan art-deco seperti garis blur.
 */
const TILE_SIZE: Record<MotifId, number> = {
  kawung: 40,
  parang: 40,
  ceplok: 40,
  jlamprang: 40,
  lasem: 40,
  gunungan: 44,
  "wayang-kulit": 48,
  sakura: 40,
  melati: 40,
  monstera: 44,
  "kupu-kupu": 44,
  merak: 60,
  merpati: 44,
  damask: 40,
  "art-deco": 40,
};

/**
 * Ubah ukuran ubin motif menjadi kelipatan 4.
 *
 * Dipakai `Backdrop` untuk menggeser pola sebesar satu ubin utuh saat
 * beranimasi. Kalau geserannya bukan kelipatan ukuran ubin, motif akan
 * "terlompat" tepat saat layar diputar atau di-resize — dan kilatan yang
 * paling langsung merusak kesan mewah sebuah undangan.
 */
export function getPatternStep(motif: MotifId): number {
  return Math.round(TILE_SIZE[motif] / 4) * 4;
}

// ============================================
// Pola latar
// ============================================

/**
 * Lapisan pola berulang untuk latar halaman.
 *
 * Dipasang sebagai elemen yang benar-benar menutup area, supaya bisa dipakai
 * baik di `.inv-backdrop` (fixed) maupun di dalam kartu (absolute). Seluruh
 * warna mengikuti `currentColor`, jadi pemanggil cukup memberi
 * `color: var(--theme-accent)`.
 */
export function MotifPattern({
  motif,
  className = "",
  opacity = 1,
}: {
  motif: MotifId;
  className?: string;
  opacity?: number;
}) {
  // `useId` menghasilkan id yang mengandung `:` dan `.`, yang tidak sah di
  // dalam `url(#...)`; karakternya dibuang supaya rujukan selalu valid.
  const rawId = useId();
  const patternId = `inv-motif-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const Tile = TILES[motif];
  const size = TILE_SIZE[motif];

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
// Crest: ornamen berdiri sendiri
// ============================================

/**
 * Ornamen standalone untuk sebuah motif — versi "display" dari motif yang
 * sama.
 *
 * Berbeda dari tile, crest tidak boleh dipakai berulang: bentuknya dirancang
 * untuk jadi titik fokus. Karena itu di sini motif digambar ulang dengan
 * garis lebih tebal, supaya tetap terbaca pada ukuran
 * kecil (24-56px) di sampul dan di pembatas bagian.
 *
 * Kalau sebuah motif tidak punya gambar khusus di sini, crest memakai tile-nya
 * sendiri. Hasilnya tidak pernah jelek — hanya kurang mencolok.
 */
function CrestArt({ motif }: { motif: MotifId }): JSX.Element {
  if (motif === "gunungan") {
    return (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path
          d="M22 2c4.6 7 8.2 10.4 12 14.4 2.8 3 4.4 5.6 4.4 8.8 0 4.8-3.8 7.8-8 11 2.6 3.8 4.4 6.2 8.8 8.6 2.6 1.4 3.4 2.6 3.4 5 0 5-6 7.2-12 7.8 1.4 1.4 2 2 2 3.6 0 .6 0 .8-.2 1.2H9.6c-.2-.4-.2-.6-.2-1.2 0-1.6.6-2.2 2-3.6-6-.6-12-2.8-12-7.8 0-2.4.8-3.6 3.4-5 4.4-2.4 6.2-4.8 8.8-8.6-4.2-3.2-8-6.2-8-11 0-3.2 1.6-5.8 4.4-8.8C13.8 12.4 17.4 9 22 2z"
          fill="currentColor"
          fillOpacity="0.16"
        />
        <path d="M22 9v36" strokeWidth="1.3" />
        <g fill="currentColor" stroke="none">
          <circle cx="22" cy="14" r="2.4" />
          <circle cx="17.6" cy="20.5" r="1.7" />
          <circle cx="26.4" cy="20.5" r="1.7" />
          <circle cx="22" cy="26" r="1.7" />
          <circle cx="17.6" cy="31.5" r="1.4" />
          <circle cx="26.4" cy="31.5" r="1.4" />
        </g>
        <path d="M17.6 40h8.8" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    );
  }

  if (motif === "merak") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.3">
        {/* Bulu merak membentang dari satu batang ke dua mata bulu. */}
        <path d="M22 52V22" strokeLinecap="round" />
        <g transform="translate(12 20)">
          <ellipse rx="8" ry="12" fill="currentColor" fillOpacity="0.2" />
          <ellipse rx="8" ry="12" />
          <ellipse rx="4.6" ry="7.2" fill="currentColor" fillOpacity="0.4" stroke="none" />
          <ellipse rx="2" ry="3.2" fill="currentColor" stroke="none" />
        </g>
        <g transform="translate(32 20)">
          <ellipse rx="8" ry="12" fill="currentColor" fillOpacity="0.2" />
          <ellipse rx="8" ry="12" />
          <ellipse rx="4.6" ry="7.2" fill="currentColor" fillOpacity="0.4" stroke="none" />
          <ellipse rx="2" ry="3.2" fill="currentColor" stroke="none" />
        </g>
        <path d="M22 52c-4 0-6-1-8-2M22 52c4 0 6-1 8-2" strokeLinecap="round" />
      </g>
    );
  }

  if (motif === "kupu-kupu") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <g fill="currentColor" fillOpacity="0.24">
          <path d="M22 26c-6-9-14-12-19-9-5 3-3.5 11 1.5 15 4 3.4 11 4 16.5 1.5z" />
          <path d="M22 32c-4.5 6-11 9-16 6-3.2-1.9-1.5-7.5 1.5-10.5 3-3 9-2.2 13 .8z" />
        </g>
        <g transform="translate(44 0) scale(-1 1)">
          <g fill="currentColor" fillOpacity="0.24">
            <path d="M22 26c-6-9-14-12-19-9-5 3-3.5 11 1.5 15 4 3.4 11 4 16.5 1.5z" />
            <path d="M22 32c-4.5 6-11 9-16 6-3.2-1.9-1.5-7.5 1.5-10.5 3-3 9-2.2 13 .8z" />
          </g>
        </g>
        <path d="M22 15v34" strokeWidth="1.7" />
        <path d="M22 15l-3-6M22 15l3-6" strokeWidth="1.2" />
      </g>
    );
  }

  // Motif lain: pakai tile-nya, diperbesar dan ditebalkan garisnya supaya
  // tetap terbaca sebagai ornamen berdiri sendiri.
  const Tile = TILES[motif];
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Tile />
    </g>
  );
}

/**
 * Ornamen berdiri sendiri untuk sebuah motif.
 *
 * Dipakai di tiga tempat: puncak kartu sampul (sebagai hierarki vertikal di
 * bawah nama), titik tengah pembatas antar bagian, dan sudut bingkai.
 *
 * `width` sengaja dalam piksel, bukan kelas Tailwind, karena pemanggil
 * membutuhkannya untuk menyetel `height` yang ikut menyesuaikan proporsi
 * SVG-nya.
 */
export function MotifCrest({
  motif,
  className = "",
  width = 44,
}: {
  motif: MotifId;
  className?: string;
  /** Lebar dalam piksel; tinggi mengikuti proporsi 22:28. */
  width?: number;
}) {
  return (
    <svg
      width={width}
      height={width * (28 / 22)}
      viewBox="0 0 44 56"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <CrestArt motif={motif} />
    </svg>
  );
}

