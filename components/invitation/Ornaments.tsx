import { useId } from "react";
import type { JSX } from "react";

import type { MotifId } from "@/config/motifs";

/**
 * Pustaka ornamen visual untuk halaman undangan.
 *
 * Setiap motif punya TIGA bentuk, dan ketiganya dipakai di tempat berbeda:
 *
 * 1. **Tile** — satuan kecil yang diulang jadi pola latar (`MotifPattern`).
 *    Dirancang menyatu dengan tetangganya di setiap sisi, jadi tidak boleh ada
 *    tepi yang menggantung di dalam satu ubin.
 * 2. **Crest** — ornamen berdiri sendiri yang jadi fokus mata
 *    (`MotifCrest`): puncak kartu sampul, titik tengah pembatas bagian, dan
 *    cap air di belakang bagian undangan.
 * 3. **Glyph sudut** — tanda 24×24 setebal mungkin untuk sudut bingkai
 *    (`MotifCornerGlyph`). Dulu sudut bingkai memakai crest yang diperkecil,
 *    dan hasilnya sekadar coretan: ornamen 44×56 yang dipadatkan ke 24 piksel
 *    kehilangan semua detail yang membuatnya dikenali. Karena itu glyph
 *    digambar terpisah, bukan diperkecil.
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
 * Ukuran ubin BERBEDA antar motif (lihat `TILE_SIZE`), dan yang dijaga seragam
 * adalah intensitas polanya di layar: motif yang detailnya rapat diberi ubin
 * lebih besar supaya jarak antar motif terasa sama, bukan diberi opacity yang
 * berbeda — opacity dipakai untuk kegelapan, bukan untuk kepadatan.
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
 * Parang: deretan "lereng" S yang mengalir diagonal, dengan mlinjon di antaranya.
 *
 * KENAPA SATU PATH DIPAKAI ULANG LIMA KALI
 *
 * `patternUnits="userSpaceOnUse"` MEMOTONG apa pun yang melewati tepi ubin —
 * ia tidak membungkusnya ke ubin sebelah. Jadi supaya motif benar-benar
 * menyambung, setiap goresan harus kembali ke posisi yang sama persis setelah
 * bergeser satu ubin. `BAND` di bawah dibuat maju tepat (+40, +40) per
 * ulangan, sama dengan ukuran ubin di kedua sumbu, sehingga lereng yang
 * keluar di tepi kanan-bawah masuk kembali di tepi kiri-atas ubin berikutnya.
 * Salinan pada offset −40…+40 hanya untuk menutup bagian ubin yang terpotong;
 * yang benar-benar berbeda cuma dua, yaitu offset 0 dan 20.
 *
 * Versi sebelumnya memakai tiga gelombang mendatar berjarak 16px di dalam ubin
 * 40px. Karena 16 tidak membagi 40 dan gelombangnya berakhir pada ketinggian
 * yang berbeda dari awalnya, motifnya terputus di setiap tepi ubin — yang
 * tampil di layar bukan parang yang mengalir, melainkan serpihan garis pendek
 * yang berulang. Salah satu titiknya bahkan digambar di `cy=46`, di luar ubin
 * 40px, jadi tidak pernah terlihat sama sekali.
 */
const PARANG_BAND =
  "M-40 -40C-30 -34 -26 -30 -20 -20S-10 -6 0 0C10 6 14 10 20 20S30 34 40 40C50 46 54 50 60 60S70 74 80 80";

function ParangTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      {[-40, -20, 0, 20, 40].map((dx) => (
        <path key={dx} transform={`translate(${dx} 0)`} d={PARANG_BAND} />
      ))}
      {/* Mlinjon: belah ketupat kecil yang mengisi sela antar lereng. */}
      <g fill="currentColor" stroke="none" opacity="0.75">
        <rect x="7" y="27" width="6" height="6" rx="1" transform="rotate(45 10 30)" />
        <rect x="27" y="7" width="6" height="6" rx="1" transform="rotate(45 30 10)" />
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
// Ubin motif: nusantara
// ============================================

/**
 * Songket: jalur benang emas dengan deret pucuk rebung.
 *
 * KENAPA TULANG POLANYA GARIS MENDATAR PENUH
 *
 * `patternUnits="userSpaceOnUse"` memotong apa pun yang melewati tepi ubin
 * (lihat `PARANG_BAND`), dan satu-satunya goresan yang BEBAS dari masalah itu
 * adalah garis mendatar selebar ubin: ia keluar di tepi kanan pada ketinggian
 * yang sama dengan ia masuk di tepi kiri, jadi sambungannya tidak mungkin
 * salah. Untuk motif tenun kebetulan itu justru benar secara budaya — kain
 * songket memang dibangun dari jalur benang yang menyeberang penuh selebar
 * kain, dan tumpal duduk di antara jalur-jalur itu.
 *
 * Semua bentuk lain di ubin ini sengaja dijaga TIDAK menyentuh tepi, jadi
 * tidak ada satu pun sambungan yang perlu dihitung.
 */
function SongketTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor">
      {/* Pucuk rebung: tumpal berdiri, pengisi utama bidang kain songket. */}
      <g fill="currentColor" stroke="none" fillOpacity="0.28">
        <path d="M10 4L19 18.4H1z" />
        <path d="M30 4L39 18.4H21z" />
      </g>
      <g strokeWidth="0.9">
        <path d="M10 4L19 18.4H1z" />
        <path d="M30 4L39 18.4H21z" />
      </g>
      {/* Benang pakan di dalam tumpal — memendek ke arah puncak, persis cara
          benang emas mengisi bidang tumpal pada kainnya. */}
      <g strokeWidth="0.6" opacity="0.6">
        <path d="M5.4 14.6h9.2M7 11.4h6M8.6 8.2h2.8" />
        <path d="M25.4 14.6h9.2M27 11.4h6M28.6 8.2h2.8" />
      </g>
      {/* Dua jalur benang lungsi. */}
      <g strokeWidth="1.1">
        <path d="M0 21h40M0 23.6h40" />
      </g>
      {/* Baris wajik di bawah jalur benang. */}
      <g fill="currentColor" stroke="none" opacity="0.8">
        <path d="M10 27.4l4.4 4.4-4.4 4.4-4.4-4.4z" />
        <path d="M30 27.4l4.4 4.4-4.4 4.4-4.4-4.4z" />
      </g>
      <path d="M0 38.6h40" strokeWidth="0.7" opacity="0.45" />
    </g>
  );
}

/**
 * Patra punggel Bali — sulur yang melingkar masuk ke matanya sendiri.
 *
 * Dipakai bersama oleh ubin, crest, dan glyph. Digambar sebagai GORESAN, bukan
 * bidang, karena yang membuat ukiran Bali dikenali adalah alur pahatnya yang
 * terus menyempit sampai habis di pusat lingkaran — bidang terisi justru
 * menutup alur itu dan menyisakan gumpalan berbentuk koma.
 *
 * Koordinat lokal: x 0–19,8 dan y 0,6–16, dengan mata lingkaran di sekitar
 * (12, 10,6).
 */
const PATRA_SCROLL =
  "M0 16C0 7.4 4.4 0.6 11.6 0.6 16.6 0.6 19.8 4.2 19.8 8.8 19.8 12.8 17 15.8 13.4 15.8 10.4 15.8 8.4 13.8 8.4 11.2 8.4 9 10 7.4 12 7.4";

function PatraBaliTile(): JSX.Element {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      {/* Dua sulur berlawanan arah pada satu diagonal ubin. Berlawanan arah itu
          disengaja: sulur yang semuanya menghadap satu arah terbaca sebagai
          pola yang "jatuh" ke satu sisi, sedangkan ukiran Bali selalu disusun
          berpasangan saling membalas. */}
      <g transform="translate(3 4)">
        <path d={PATRA_SCROLL} />
        <circle cx="12" cy="10.6" r="1.5" fill="currentColor" stroke="none" />
      </g>
      <g transform="translate(41 40) scale(-1 -1)">
        <path d={PATRA_SCROLL} />
        <circle cx="12" cy="10.6" r="1.5" fill="currentColor" stroke="none" />
      </g>
      {/* Dua ujung daun kecil mengisi diagonal yang satunya, supaya ubin tidak
          terbaca kosong separuh. */}
      <g fill="currentColor" stroke="none" fillOpacity="0.45">
        <path d="M34 6c2.6 1.4 3.8 4 3.4 7-2.8-1-4.4-3.2-3.4-7z" />
        <path d="M10 38c-2.6-1.4-3.8-4-3.4-7 2.8 1 4.4 3.2 3.4 7z" />
      </g>
    </g>
  );
}

// ============================================
// Ubin motif: islami
// ============================================

/**
 * Jalur bintang delapan — bentuk inti seluruh ornamen girih.
 *
 * DIBUAT LEWAT FUNGSI, BUKAN DITULIS SEBAGAI SATU STRING, karena bintang yang
 * sama dipakai pada tiga ukuran yang jauh berbeda: 11 unit di ubin, 17 unit di
 * crest, 10,6 unit di glyph. Kalau jalurnya ditulis sekali lalu diperbesar
 * dengan `scale()`, tebal garisnya ikut terkali — bintang di crest akan
 * bergaris dua kali lebih tebal dari yang diminta, dan satu-satunya cara
 * memperbaikinya adalah menghitung balik `strokeWidth` di setiap pemakainya.
 *
 * `inner` adalah jari-jari lekuk antarsudut. Pada girih sungguhan nilainya
 * sekitar 0,55 dari jari-jari luar: lebih kecil membuat sudutnya jadi jarum
 * yang hilang begitu diperkecil, lebih besar membuatnya jadi segi delapan
 * biasa.
 */
function girihStar(outer: number, inner: number): string {
  const points: string[] = [];

  for (let i = 0; i < 16; i += 1) {
    // Titik genap adalah ujung bintang, titik ganjil lekuk di antaranya.
    // Dimulai dari −90° supaya selalu ada satu ujung yang tepat mengarah ke
    // atas — bintang yang "miring setengah sudut" langsung terbaca sebagai
    // kesalahan, bukan sebagai variasi.
    const radius = i % 2 === 0 ? outer : inner;
    const angle = ((-90 + i * 22.5) * Math.PI) / 180;
    const x = (Math.cos(angle) * radius).toFixed(2);
    const y = (Math.sin(angle) * radius).toFixed(2);
    points.push(`${x} ${y}`);
  }

  return `M${points.join("L")}z`;
}

/** Keempat sudut ubin — dipakai motif yang simpul polanya jatuh di sudut. */
const TILE_CORNERS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [40, 0],
  [0, 40],
  [40, 40],
];

/** Keempat tengah tepi ubin. */
const TILE_EDGE_MIDS: ReadonlyArray<readonly [number, number]> = [
  [20, 0],
  [20, 40],
  [0, 20],
  [40, 20],
];

const GIRIH_STAR_TILE = girihStar(11, 6);

/**
 * Girih: bintang delapan yang terjalin menjadi jaring tak berujung.
 *
 * Bintang di keempat sudut ubin hanya tampak SEPEREMPAT, dan tiga perempat
 * sisanya dilanjutkan oleh tiga ubin tetangganya. Itu bukan efek samping
 * pemotongan, melainkan inti cara kerja pola girih: yang dilihat mata bukan
 * deretan bintang yang masing-masing berdiri sendiri, melainkan satu jaring
 * yang terus bersambung melewati tepi mana pun.
 */
function GirihTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <g transform="translate(20 20)">
        <path d={GIRIH_STAR_TILE} fill="currentColor" fillOpacity="0.24" />
        <path d={GIRIH_STAR_TILE} />
      </g>
      {TILE_CORNERS.map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={GIRIH_STAR_TILE}
          transform={`translate(${x} ${y})`}
          strokeWidth="0.8"
          opacity="0.6"
        />
      ))}
      {/* Wajik pengisi sela, separuhnya terpotong tepi ubin dan disambung ubin
          sebelahnya. */}
      <g fill="currentColor" stroke="none" opacity="0.65">
        {TILE_EDGE_MIDS.map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d="M0 -3.4L3.4 0 0 3.4-3.4 0z"
            transform={`translate(${x} ${y})`}
          />
        ))}
      </g>
    </g>
  );
}

/**
 * Segi delapan kisi mashrabiya, tepat sebesar satu ubin.
 *
 * Kedelapan titiknya jatuh PERSIS di tepi ubin, dua titik per tepi, jadi saat
 * diulang sisi-sisi segi delapan yang bertetangga bertemu ujung ke ujung dan
 * sisa segitiga di keempat sudut ubin bergabung menjadi satu kotak kecil utuh
 * — pola segi-delapan-dan-kotak yang jadi dasar hampir semua kisi jali.
 * Apotema 20 dengan setengah sisi 20·tan(22,5°) = 8,28 adalah satu-satunya
 * pasangan angka yang membuat itu terjadi di ubin 40.
 */
const MASHRABIYA_OCTAGON =
  "M11.72 0H28.28L40 11.72V28.28L28.28 40H11.72L0 28.28V11.72z";

/** Segi delapan dalam, 55% dari yang luar — bilah kedua kisinya. */
const MASHRABIYA_OCTAGON_INNER =
  "M15.45 9H24.55L31 15.45V24.55L24.55 31H15.45L9 24.55V15.45z";

function MashrabiyaTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <path d={MASHRABIYA_OCTAGON} />
      <path d={MASHRABIYA_OCTAGON_INNER} strokeWidth="0.8" opacity="0.7" />
      <g fill="currentColor" stroke="none">
        <path d="M20 16.2L23.8 20 20 23.8 16.2 20z" fillOpacity="0.5" />
        {/* Sudut ubin adalah PUSAT kotak kecil yang terbentuk di antara empat
            segi delapan, jadi wajik di sini menandai simpul kisinya. */}
        <g opacity="0.7">
          {TILE_CORNERS.map(([x, y]) => (
            <path
              key={`${x}-${y}`}
              d="M0 -3.2L3.2 0 0 3.2-3.2 0z"
              transform={`translate(${x} ${y})`}
            />
          ))}
        </g>
      </g>
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
 * Celah dibuat dengan mengurangi bentuk daunnya, bukan menimpanya dengan
 * bentuk lain — jadi bagian yang "dilubangi" benar-benar meneruskan warna
 * kanvas, bukan warna arbitrer yang akan terlihat salah saat tema diganti.
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



/**
 * Satu bunga anggrek bulan, pusatnya di (0,0), jangkauan ±13 unit mendatar.
 *
 * GARIS TEPINYA DIPASOK PEMANGGIL, bukan ditetapkan di sini. Bunga ini dipakai
 * pada tiga ukuran — ubin, crest, dan glyph — dan satu-satunya cara memakai
 * gambar yang sama di tiga ukuran adalah lewat `scale()`, yang ikut mengalikan
 * `strokeWidth`. Karena itu `petalStroke` dinyatakan dalam satuan LOKAL bunga:
 * pemanggil membagi tebal yang diinginkannya dengan skalanya sendiri, persis
 * seperti `girihStar()` menerima ukurannya sebagai argumen.
 *
 * Versi pertama tidak bergaris sama sekali, dan hasilnya gagal dirender: isian
 * 0,3 tanpa tepi di sebelah labellum yang pekat penuh membuat mata hanya
 * menangkap labellumnya, sehingga seluruh rangkaian terbaca sebagai DUA BUTIR
 * GELAP DI ATAS TANGKAI. Kelopak bergaris adalah perlakuan yang sama yang
 * menyelamatkan `KambojaCrest` dan `DedaunanBranch`.
 *
 * DUA HAL YANG MEMBUATNYA TERBACA ANGGREK, bukan bunga apa saja. Pertama,
 * wajahnya LEBIH LEBAR daripada tinggi — 26 banding 23 — sedangkan sakura dan
 * melati di katalog ini keduanya bundar; perbandingan sisi masih terbaca pada
 * ukuran yang sudah terlalu kecil untuk memperlihatkan jumlah kelopak. Kedua,
 * ada satu bidang PEKAT PENUH di tengah bawah, yaitu labellum alias lidah
 * anggrek, berlawanan dengan kelopak yang semuanya samar. Pada ukuran kecil
 * justru kontras itu yang tersisa paling akhir.
 *
 * `petalOpacity` ada semata untuk glyph sudut, yang tampil pada 24 piksel dan
 * membutuhkan kelopak jauh lebih pekat daripada ubin maupun crest. Nilainya
 * bukan bagian dari bentuk, jadi ubin dan crest cukup memakai bawaannya.
 */
function AnggrekBloom({
  petalOpacity = 0.3,
  petalStroke = 0,
}: {
  petalOpacity?: number;
  petalStroke?: number;
}): JSX.Element {
  return (
    <>
      <g
        fill="currentColor"
        fillOpacity={petalOpacity}
        stroke={petalStroke > 0 ? "currentColor" : "none"}
        strokeWidth={petalStroke}
        strokeOpacity="0.85"
      >
        {/* Sepal atas — paling sempit dari kelimanya. */}
        <ellipse cy="-7.6" rx="3.4" ry="4.6" />
        {/* Dua kelopak samping yang lebar: ciri utama anggrek bulan. */}
        <ellipse
          cx="-7.8"
          cy="-1.4"
          rx="5.4"
          ry="4.4"
          transform="rotate(-18 -7.8 -1.4)"
        />
        <ellipse
          cx="7.8"
          cy="-1.4"
          rx="5.4"
          ry="4.4"
          transform="rotate(18 7.8 -1.4)"
        />
        {/* Dua sepal bawah. */}
        <ellipse
          cx="-5"
          cy="6.4"
          rx="3.2"
          ry="4.2"
          transform="rotate(-28 -5 6.4)"
        />
        <ellipse
          cx="5"
          cy="6.4"
          rx="3.2"
          ry="4.2"
          transform="rotate(28 5 6.4)"
        />
      </g>
      <path
        d="M0 -1.2c2.6 0 4 1.6 4 3.6 0 2.4-1.8 4.4-4 5.6-2.2-1.2-4-3.2-4-5.6 0-2 1.4-3.6 4-3.6z"
        fill="currentColor"
      />
      {/* Tugu putik, dipisahkan 0,8 unit dari labellum. Saat keduanya
          bersentuhan mereka melebur menjadi satu piringan gelap, dan piringan
          itulah yang membuat bunganya terbaca sebagai butir buah. */}
      <circle cy="-3.4" r="1.4" fill="currentColor" />
    </>
  );
}

/** Anggrek: satu bunga besar, satu bunga kecil, dan sebuah kuncup. */
function AnggrekTile(): JSX.Element {
  return (
    <g>
      <path
        d="M22 27c-1.6 5-4 9-7 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* `petalStroke` sudah dibagi skala masing-masing bunga: 0,7 ÷ 1 dan
          0,6 ÷ 0,5, supaya tebal garis keduanya seimbang setelah dirender. */}
      <g transform="translate(22 16)">
        <AnggrekBloom petalStroke={0.7} />
      </g>
      <g transform="translate(33 35) scale(0.5)">
        <AnggrekBloom petalStroke={1.2} />
      </g>
      <ellipse
        cx="14"
        cy="37"
        rx="2.2"
        ry="3.4"
        transform="rotate(-32 14 37)"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </g>
  );
}

/**
 * Satu kelopak kamboja, pangkalnya di (0,0) dan ujungnya ke atas.
 *
 * BENTUKNYA SENGAJA TIDAK SIMETRIS: massanya digeser ke kanan, jadi saat
 * disalin lima kali dengan jarak 72° kelopaknya saling menumpang searah dan
 * seluruh bunga terbaca sebagai KINCIR. Itu satu-satunya hal yang
 * membedakannya dari sakura, yang di katalog ini juga berkelopak lima — dan
 * tumpang-tindih berarah masih terbaca jauh setelah jumlah kelopak tidak lagi
 * bisa dihitung mata.
 */
const KAMBOJA_PETAL =
  "M0 -0.4C-5.4 -1.8 -7.4 -6.4 -5.8 -10.8-4.4 -14.6-0.4 -16 3.2 -14.2 7 -12.4 8 -7.4 5.4 -3.4 4 -1.4 2 -0.4 0 -0.4z";

/** Satu bunga kamboja utuh, pusat di (0,0), jangkauan ±15,5 unit. */
function KambojaBloom(): JSX.Element {
  return (
    <>
      {[0, 72, 144, 216, 288].map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path d={KAMBOJA_PETAL} fill="currentColor" fillOpacity="0.28" />
          {/* Garis tepi kelopak inilah yang memperlihatkan tumpangannya. Tanpa
              garis ini kelima kelopak melebur jadi satu bidang berlekuk, dan
              arah kincirnya — satu-satunya pembeda dari sakura — hilang. */}
          <path
            d={KAMBOJA_PETAL}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.75"
          />
        </g>
      ))}
      <circle r="2.2" fill="currentColor" />
    </>
  );
}

function KambojaTile(): JSX.Element {
  return (
    <g>
      <g transform="translate(22 20)">
        <KambojaBloom />
      </g>
      {/* Bunga kecil di keempat sudut ubin, hanya seperempat yang terlihat:
          pengisi sela yang sekaligus menyambungkan ubin ke tetangganya. */}
      {[
        [0, 0],
        [44, 0],
        [0, 44],
        [44, 44],
      ].map(([x, y]) => (
        <g
          key={`${x}-${y}`}
          transform={`translate(${x} ${y}) scale(0.42)`}
          opacity="0.8"
        >
          {[0, 72, 144, 216, 288].map((angle) => (
            <path
              key={angle}
              d={KAMBOJA_PETAL}
              transform={`rotate(${angle})`}
              fill="currentColor"
              fillOpacity="0.3"
            />
          ))}
        </g>
      ))}
    </g>
  );
}

/**
 * Satu ranting daun berpasangan, membentang penuh selebar ubin.
 *
 * TANGKAINYA MENDATAR, BUKAN DIAGONAL, dan itu keputusan yang dipaksa oleh
 * cara `pattern` bekerja. Tangkai diagonal TIDAK BISA menyambung: goresan yang
 * keluar di sudut kanan-atas ubin harus bertemu dengan goresan yang masuk di
 * sudut kiri-bawah ubin SEBELAHNYA, padahal pola hanya bergeser mendatar —
 * jadi yang ditemuinya adalah sudut kiri-atas, dan rantingnya terputus di
 * setiap tepi.
 *
 * Yang membuat ranting mendatar ini tetap menyambung mulus: ketinggian ujung
 * kiri dan ujung kanan sama (y = 11), DAN arah goresannya di kedua ujung juga
 * sama, yaitu (7, −4,4). Kalau hanya ketinggiannya yang sama, sambungannya
 * tetap membentuk sudut patah yang terlihat seperti ranting yang terjepit.
 *
 * `strokeLinecap="round"` bukan soal selera. Posisi dan arah yang sama persis
 * pun masih menyisakan TAKIK setebal satu piksel di tiap sambungan, karena dua
 * goresan yang berbeda dihaluskan tepinya masing-masing dan tepi itu bertemu di
 * garis yang sama. Tudung bundar menambahkan setengah unit di luar tepi ubin,
 * yang memang dipotong `pattern` tetapi juga menindih tudung tetangganya —
 * sehingga tidak ada lagi tepi yang bertemu tepi. Takiknya hanya terlihat
 * setelah ubinnya diulang; satu ubin saja selalu tampak mulus.
 */
function EucalyptusSprig(): JSX.Element {
  return (
    <>
      <path
        d="M0 11C7 6.6 15 6.6 22 11 29 15.4 37 15.4 44 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Simpul daun duduk di puncak, lembah, dan titik balik tangkainya; sudut
          miringnya mengikuti arah tangkai di titik itu, supaya daun selalu
          tumbuh TEGAK LURUS tangkai seperti pada eucalyptus sungguhan. */}
      {[
        { x: 11, y: 7.7, tilt: 0 },
        { x: 22, y: 11, tilt: 32 },
        { x: 33, y: 14.3, tilt: 0 },
      ].map(({ x, y, tilt }) => (
        <g
          key={x}
          transform={`translate(${x} ${y}) rotate(${tilt})`}
          fill="currentColor"
          fillOpacity="0.32"
        >
          <ellipse cy="-4.2" rx="2.5" ry="3.4" />
          <ellipse cy="4.2" rx="2.5" ry="3.4" />
        </g>
      ))}
    </>
  );
}

function DedaunanTile(): JSX.Element {
  return (
    <g>
      <EucalyptusSprig />
      {/* Baris bawah digeser setengah ubin supaya dua baris tidak pernah
          sejajar — dan digambar DUA KALI, di −22 dan +22. `userSpaceOnUse`
          memotong apa pun yang melewati tepi ubin alih-alih membungkusnya, jadi
          separuh ranting yang hilang di tepi kanan harus disediakan oleh
          salinan yang satunya, bukan oleh ubin sebelahnya. */}
      <g transform="translate(-22 22)">
        <EucalyptusSprig />
      </g>
      <g transform="translate(22 22)">
        <EucalyptusSprig />
      </g>
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
 *
 * Kedua mata dipasang menyilang (15,15) dan (45,45), bukan berjajar. Ubin
 * merak berukuran 60×60 dan `patternUnits="userSpaceOnUse"` MEMOTONG apa pun
 * yang melewati tepi ubin — tidak membungkusnya ke ubin sebelah. Susunan
 * sebelumnya menaruh mata kedua tepat di `translate(60 20)`, yaitu persis di
 * garis tepi kanan: separuhnya terpotong dan tepi kirinya kosong, sehingga
 * muncul jalur mata setengah yang berulang di seluruh latar. Pada posisi
 * sekarang kedua mata (rx 7, ry 11) utuh di dalam ubin — x 8–22 dan 38–52,
 * y 4–26 dan 34–56 — dan sebarannya justru lebih menyerupai bulu merak asli.
 */
function MerakTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <g transform="translate(15 15)">
        <ellipse rx="7" ry="11" fill="currentColor" fillOpacity="0.22" />
        <ellipse rx="7" ry="11" />
        <ellipse rx="4" ry="6.5" fill="currentColor" fillOpacity="0.45" stroke="none" />
        <ellipse rx="1.8" ry="3" fill="currentColor" stroke="none" />
      </g>
      <g transform="translate(45 45)">
        <ellipse rx="7" ry="11" fill="currentColor" fillOpacity="0.22" />
        <ellipse rx="7" ry="11" />
        <ellipse rx="4" ry="6.5" fill="currentColor" fillOpacity="0.45" stroke="none" />
        <ellipse rx="1.8" ry="3" fill="currentColor" stroke="none" />
      </g>
    </g>
  );
}

/**
 * Seekor merpati terbang, menghadap kanan, titik asalnya di tengah badan.
 *
 * Bentuknya sengaja MENJIPLAK `MerpatiGlyph`, yang sudah terbukti terbaca
 * sebagai burung: badan satu sapuan dari ekor di kiri ke paruh di kanan, lalu
 * sayap terangkat digambar TERPISAH di atas punggung. Tanpa sayap terpisah itu
 * badannya hanya terbaca sebagai sehelai daun.
 *
 * BADAN, EKOR, DAN PARUH BERADA DALAM SATU `path`, BUKAN TIGA
 * Ketiganya bertindihan di tepinya. Kalau digambar sebagai tiga path
 * berkepekatan 0,32, daerah tindihannya terisi dua kali dan muncul baji gelap
 * di pangkal ekor dan di pangkal paruh — sambungan yang justru mengiklankan
 * bahwa siluetnya dirakit dari potongan. Sebagai satu path, aturan isian
 * `nonzero` menyatukan ketiganya dan hanya ada satu kali pengisian, jadi
 * siluetnya rata. Syaratnya ketiga subpath harus searah putaran (ketiganya
 * searah jarum jam); kalau salah satu berlawanan, `nonzero` malah saling
 * meniadakan dan tindihannya BOLONG.
 *
 * Tidak ada garis tepi sama sekali. Garis tepi badan akan menembus sayap yang
 * tembus pandang dan MEMOTONGNYA JADI DUA, cacat yang sama seperti yang pernah
 * terjadi pada anggrek. Melati membuktikan isian-tanpa-garis sudah cukup tegas
 * pada ukuran ubin.
 */
function MerpatiBird(): JSX.Element {
  return (
    <>
      <path
        d="M-9.9 4.6c3.6-2.8 7.6-4.2 12-4.2 1.8 0 3.4.2 4.9.8-1.1 2.9-3.1 4.9-6 5.9-3.1 1.1-6.8.8-10.9-2.5zM-4.1 7L-10.9 10.2-9.3 4.4zM7 1.2l2.9-.6-2.7 1.8z"
        fill="currentColor"
        fillOpacity="0.32"
      />
      <path
        d="M-1.3 1.2c.5-3.6 2.3-6.4 5.2-8.2-.4 3.1-.2 5.8.7 8.1z"
        fill="currentColor"
        fillOpacity="0.5"
      />
    </>
  );
}

/**
 * Merpati: dua burung terbang searah, disusun setengah-turun.
 *
 * DULU UBIN INI TERBACA SEBAGAI HATI, BUKAN BURUNG
 * Versi sebelumnya menggambar sepasang lengkung cermin yang bertemu pada satu
 * lekuk di atas lalu menutup pada satu titik di bawah. Itu bukan "sayap
 * terangkat" — itu definisi gambar sebuah hati, dan di layar memang hati yang
 * muncul, lengkap dengan dua setrip abu-abu melayang di sisinya yang
 * seharusnya menjadi ujung sayap. Pada undangan pernikahan kesalahan ini
 * sangat halus: hati tetap terasa pantas, jadi tidak ada yang menyadarinya,
 * padahal pengguna yang memilih "Merpati" menerima motif yang bukan merpati —
 * dan latar ubinnya jadi bertentangan dengan crest-nya sendiri, yang memang
 * menggambar burung.
 *
 * Yang membuat sebuah siluet terbaca sebagai burung dan bukan hati adalah
 * KETIDAKSIMETRISANNYA: badan bermassa di satu sisi, ekor mengipas di sisi
 * seberangnya, paruh menonjol, dan sayap yang hanya ada satu. Begitu bentuknya
 * simetri cermin dengan lekuk di atas, ia selalu kembali menjadi hati.
 *
 * Kedua burung menghadap ARAH YANG SAMA supaya terbaca sebagai kawanan.
 * Dicerminkan saling berhadapan, keduanya kembali membentuk susunan simetris —
 * persis jebakan yang baru saja dihindari.
 *
 * Keduanya utuh di dalam kotak 44×44 (x 4,3–20,9 dan 22,3–38,9; y 5,4–19,2 dan
 * 27,4–41,2), jadi tidak ada satu pun goresan yang menyentuh tepi ubin dan
 * sambungannya tidak bisa meleset.
 */
function MerpatiTile(): JSX.Element {
  return (
    <g stroke="none">
      <g transform="translate(13 11) scale(0.8)">
        <MerpatiBird />
      </g>
      <g transform="translate(31 33) scale(0.8)">
        <MerpatiBird />
      </g>
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
 * Yang membuatnya berulang dengan rapi adalah simetri lipat: KEEMPAT ogee
 * ujungnya menunjuk ke tengah sisi ubin — (20,0), (20,40), (0,20), (40,20) —
 * sehingga ujung satu ubin bertemu ujung ubin tetangganya tepat di sambungan
 * dan rantai ogee-nya berjalan terus ke segala arah.
 *
 * DULU OGEE KIRINYA TIDAK ADA. Hanya tiga yang digambar: dua tegak dan satu
 * mendatar ke kanan. Akibatnya rantai mendatarnya putus — ujung kanan sebuah
 * ubin menggantung di udara karena ubin di sebelahnya tidak menyediakan ujung
 * kiri untuk menyambutnya. Di layar yang tampak adalah deretan kolom rapat
 * dengan lorong kosong di antaranya, dan empat goresan rusuk di `M8 20h-6`
 * berubah menjadi SETRIP MELAYANG yang tidak menempel pada bentuk apa pun.
 *
 * Cacat seperti ini mustahil terlihat dari satu ubin: sebuah ubin yang kurang
 * satu bentuk tetap tampak masuk akal sendirian. Yang menemukannya adalah
 * `tiles.mjs`, yang mengulang ubinnya 3x3 lewat `<pattern>` yang sama dengan
 * produksi.
 */
function DamaskTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <g fill="currentColor" fillOpacity="0.3" strokeLinejoin="round">
        <path d="M20 0c5 5 8 9 8 14a8 8 0 0 1-16 0c0-5 3-9 8-14z" />
        <path d="M20 40c-5-5-8-9-8-14a8 8 0 0 1 16 0c0 5-3 9-8 14z" />
      </g>
      {/* Pasangan mendatar, lebih samar supaya sumbu tegaknya tetap memimpin.
          Keduanya memakai jalur ogee yang sama persis, hanya diputar ±90°. */}
      <g fill="currentColor" fillOpacity="0.18" strokeLinejoin="round">
        <g transform="translate(40 20) rotate(90) translate(-20 0)">
          <path d="M20 0c5 5 8 9 8 14a8 8 0 0 1-16 0c0-5 3-9 8-14z" />
        </g>
        <g transform="translate(0 20) rotate(-90) translate(-20 0)">
          <path d="M20 0c5 5 8 9 8 14a8 8 0 0 1-16 0c0-5 3-9 8-14z" />
        </g>
      </g>
      <circle cx="20" cy="20" r="2" fill="currentColor" stroke="none" />
      {/* Rusuk di dalam tiap ogee, dekat ujungnya. */}
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

/**
 * Renda: deret lengkung menggantung berlubang kecil.
 *
 * SYARAT SAMBUNGANNYA CUMA SATU ANGKA: lebar satu lengkung harus membagi habis
 * ukuran ubin. Radius 5 menghasilkan lengkung selebar 10, dan 10 membagi habis
 * 40 — itu seluruh perhitungannya. Deret yang lebarnya, misalnya, 12 akan
 * memotong lengkung ketiga di tengah-tengah dan menyisakan tonjolan pincang di
 * setiap tepi ubin.
 *
 * Baris kedua digeser setengah lengkung (5 unit) supaya dua baris tidak
 * membentuk kolom lurus — renda sungguhan selalu bertumpuk bergeser, dan
 * lengkung yang sejajar sempurna justru terbaca sebagai gelembung, bukan kain.
 *
 * KENAPA LENGKUNGNYA MENGGANTUNG DARI GARIS LURUS, bukan berdiri sendiri:
 * deret setengah-lingkaran tanpa garis di atasnya terbaca sebagai awan, dan
 * awan tidak pernah punya tepi atas yang lurus. Garis tipis itulah yang
 * membuat matanya melihat tepi kain.
 */
function RendaTile(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor">
      {[
        { y: 4, shift: 0 },
        { y: 24, shift: 5 },
      ].map(({ y, shift }) => (
        <g key={y}>
          <path d={`M0 ${y}h40`} strokeWidth="0.8" opacity="0.75" />
          {/* Mulai dari `shift - 10` supaya lengkung yang terpotong tepi kiri
              tetap tergambar; separuhnya yang hilang disediakan lengkung
              terakhir di tepi kanan. */}
          {[-10, 0, 10, 20, 30].map((x) => (
            <g key={x}>
              <path
                d={`M${x + shift} ${y}a5 5 0 0 0 10 0`}
                strokeWidth="0.9"
              />
              <circle
                cx={x + shift + 5}
                cy={y + 7.6}
                r="1.1"
                fill="currentColor"
                stroke="none"
                opacity="0.55"
              />
            </g>
          ))}
        </g>
      ))}
      {/* Dua baris lubang jarum di sela, pengisi bidang kosong antar deret. */}
      <g fill="currentColor" stroke="none" opacity="0.4">
        {[-10, 0, 10, 20, 30].map((x) => (
          <g key={x}>
            <circle cx={x + 10} cy="18" r="0.7" />
            <circle cx={x + 5} cy="38" r="0.7" />
          </g>
        ))}
      </g>
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
 * sumber data murni yang tidak boleh mengimpor React, sedangkan gambar SVG
 * hanya hidup di satu tempat. Keduanya dihubungkan lewat `MotifId` yang sama.
 *
 * Tipe `Record<MotifId, …>` di bawah adalah penjaga kelengkapan katalog.
 * Menambah id ke `MOTIF_IDS` tanpa menggambar motifnya akan langsung gagal di
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
  songket: SongketTile,
  "patra-bali": PatraBaliTile,
  girih: GirihTile,
  mashrabiya: MashrabiyaTile,
  sakura: SakuraTile,
  melati: MelatiTile,
  monstera: MonsteraTile,
  anggrek: AnggrekTile,
  kamboja: KambojaTile,
  dedaunan: DedaunanTile,
  "kupu-kupu": KupuKupuTile,
  merak: MerakTile,
  merpati: MerpatiTile,
  damask: DamaskTile,
  "art-deco": ArtDecoTile,
  renda: RendaTile,
};

/**
 * Ukuran satu ubin dalam piksel untuk setiap motif.
 *
 * Tidak seragam disengaja. Motif yang ukurannya kecil (merak, art-deco) diberi
 * ubin lebih besar supaya jarak antar motif di layar tetap terasa sama
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
  songket: 40,
  "patra-bali": 44,
  girih: 40,
  mashrabiya: 40,
  sakura: 40,
  melati: 40,
  monstera: 44,
  anggrek: 44,
  kamboja: 44,
  dedaunan: 44,
  "kupu-kupu": 44,
  merak: 60,
  merpati: 44,
  damask: 40,
  "art-deco": 40,
  renda: 40,
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
 * untuk jadi titik fokus. Karena itu setiap motif digambar ULANG di sini
 * sebagai komposisi tegak yang berdiri sendiri, dengan garis lebih tebal supaya
 * tetap terbaca pada ukuran kecil (20-56px) di sampul dan di pembatas bagian.
 *
 * KENAPA SEMUA MOTIF WAJIB PUNYA CREST SENDIRI
 *
 * Dulu hanya tiga motif (gunungan, merak, kupu-kupu) punya gambar di sini, dan
 * dua belas sisanya jatuh ke cadangan: `<Tile />` dipakai apa adanya. Itu
 * terlihat wajar di kode, tapi hasilnya di layar salah secara mendasar. Tile
 * dirancang BERSAMBUNG dengan tetangganya di setiap sisi — goresannya memang
 * menggantung di tepi ubin, karena tetangganya yang melanjutkan. Dipakai
 * sendirian, yang tampil bukan ornamen melainkan potongan pola yang terpotong
 * di empat sisinya. Ditambah lagi tile digambar dalam kotak 40x40 sementara
 * kanvas crest 44x56, jadi bentuknya nyangkut di kiri-atas dan menyisakan
 * seperempat kanvas kosong di bawah.
 *
 * Akibatnya langsung ke jualan: motif adalah satu-satunya hal yang dipilih
 * sendiri oleh customer, dan crest adalah tempat pilihan itu paling terlihat —
 * puncak kartu sampul dan titik tengah SETIAP pembatas bagian. Customer yang
 * memilih Batik Parang atau Melati justru mendapat serpihan pola di dua tempat
 * paling menonjol di undangannya.
 *
 * Karena itu `CRESTS` di bawah bertipe `Record<MotifId, …>` dan tidak punya
 * cadangan apa pun: motif baru tanpa crest akan menggagalkan `tsc`, sama
 * seperti motif baru tanpa tile. Cadangan yang "tidak pernah jelek" ternyata
 * justru cara paling sunyi untuk mengirim ornamen yang rusak ke produksi.
 */
/** Sudut kelopak untuk bunga berkelopak lima (sakura). */
const FIVE_PETALS = [0, 72, 144, 216, 288];

/** Sudut kelopak untuk bunga bintang berkelopak enam (melati). */
const SIX_PETALS = [0, 60, 120, 180, 240, 300];

function GununganCrest(): JSX.Element {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      {/* Siluetnya digambar ulang agar MUAT di kanvas 44x56. Versi sebelumnya
          turun sampai y≈62 dan melebar sampai x≈42,6 — di layar, bagian itu
          tidak "agak mepet", melainkan hilang dipotong viewport SVG, sehingga
          gunungan tampak punya kaki rata yang sebetulnya tidak ada. */}
      <path
        d="M22 3c5 7 11 12 12.5 18 1 4-1.5 7-4.5 9.5 4 3.5 7 8.5 7 14 0 2.5-2 4-5 4H12c-3 0-5-1.5-5-4 0-5.5 3-10.5 7-14C11 28 8.5 25 9.5 21 11 15 17 10 22 3z"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <path d="M22 10v33" strokeWidth="1.2" />
      <g fill="currentColor" stroke="none">
        <circle cx="22" cy="14.5" r="2.2" />
        <circle cx="18" cy="21" r="1.5" />
        <circle cx="26" cy="21" r="1.5" />
        <circle cx="22" cy="26.5" r="1.5" />
        <circle cx="18" cy="32.5" r="1.3" />
        <circle cx="26" cy="32.5" r="1.3" />
      </g>
      <path d="M17.5 38.5h9" strokeWidth="1.2" strokeLinecap="round" />
      {/* Lapik. Gunungan selalu ditancapkan, tidak pernah melayang. */}
      <path
        d="M14 48.5v3.5h16v-3.5"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Sudut bulu pada kipas ekor merak, diukur dari tegak lurus. */
const PEACOCK_FAN = [-45, -22, 0, 22, 45];

function MerakCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.3">
      {/* Yang membuat merak dikenali adalah EKORNYA YANG MENGIPAS, bukan mata
          bulunya. Versi sebelumnya hanya memasang dua mata bulu di atas satu
          batang, dan pada ukuran pembatas (20px) bentuk itu terbaca sebagai
          sepasang mata — bukan sebagai burung. */}
      {/* Seluruh burungnya dinaikkan dan dipadatkan: pada versi sebelumnya
          badan dan kakinya menyentuh y=55 dari kanvas 56, sehingga di undangan
          kakinya terlihat terpotong rapat tepi bawah. */}
      <g transform="translate(22 41)">
        {PEACOCK_FAN.map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path d="M0 0c-1.2-7.6-1.2-13.4 0-20" strokeWidth="1" opacity="0.75" />
            <g transform="translate(0 -21)">
              <ellipse rx="3.6" ry="4.6" fill="currentColor" fillOpacity="0.18" />
              <ellipse rx="3.6" ry="4.6" strokeWidth="1" />
              <ellipse
                rx="2"
                ry="2.8"
                fill="currentColor"
                fillOpacity="0.45"
                stroke="none"
              />
              <circle r="1" fill="currentColor" stroke="none" />
            </g>
          </g>
        ))}
      </g>
      {/* Badan, leher, dan jambul tiga helai. */}
      <ellipse
        cx="20"
        cy="46.4"
        rx="4.8"
        ry="4"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path d="M23.4 44.2c1.9-1.5 3-3.2 3.4-5.2" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="27.4" cy="37.6" r="2.2" fill="currentColor" fillOpacity="0.3" />
      <path d="M29.5 37l3.2-.8-3 1.9z" fill="currentColor" stroke="none" />
      <g strokeWidth="0.8" strokeLinecap="round" opacity="0.85">
        <path d="M27.4 35.2v-2.2M25.9 35.6l-.9-2M28.9 35.6l.9-2" />
      </g>
      <g strokeWidth="1" strokeLinecap="round">
        <path d="M18 50.2c-1.5.9-2.4 1.7-2.8 2.6M22 50.2c1.5.9 2.4 1.7 2.8 2.6" />
      </g>
    </g>
  );
}

function KupuKupuCrest(): JSX.Element {
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

function KawungCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.4">
      {/* Cincin luar tipis, lalu cincin utama yang dilewati keempat oval.
          Susunan berlapis inilah yang membuat kawung terbaca sebagai medalion
          batik, bukan sebagai bunga berkelopak empat. */}
      <circle cx="22" cy="23" r="16.5" strokeWidth="0.9" opacity="0.5" />
      <circle cx="22" cy="23" r="11" />
      <g fill="currentColor" stroke="none">
        <ellipse cx="22" cy="12" rx="4" ry="5.8" />
        <ellipse cx="22" cy="34" rx="4" ry="5.8" />
        <ellipse cx="11" cy="23" rx="5.8" ry="4" />
        <ellipse cx="33" cy="23" rx="5.8" ry="4" />
        <circle cx="22" cy="23" r="2.8" />
      </g>
      {/* Di pola latar, kisi diagonal memisahkan antarkawung. Di sini kisinya
          disisakan sebagai empat goresan pendek saja — kisi penuh akan membuat
          medalion tunggal tampak seperti pola yang terpotong. */}
      <g strokeWidth="0.8" opacity="0.55">
        <path d="M13.5 14.5l4 4M30.5 14.5l-4 4M13.5 31.5l4-4M30.5 31.5l-4-4" />
      </g>
      {/* Untaian bawah. Kanvas crest tinggi (44x56), jadi tanpa ini medalion
          bulat akan mengambang di tengah dengan ruang kosong di bawahnya. */}
      <path d="M22 39.5V47" strokeWidth="1.1" strokeLinecap="round" />
      <path
        d="M22 47l3.2 3.3-3.2 3.3-3.2-3.3z"
        fill="currentColor"
        stroke="none"
      />
    </g>
  );
}

function ParangCrest(): JSX.Element {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Parang itu motif DIAGONAL YANG BERULANG, bukan satu bentuk tunggal.
          Crest sebelumnya menggambarnya sebagai satu almond simetris tegak,
          dan hasilnya kehilangan dua-duanya: tanpa kemiringan dan tanpa
          pengulangan, bentuk itu terbaca sebagai daun. Tiga lereng sejajar di
          bawah ini mengembalikan keduanya. */}
      <g strokeWidth="3.4">
        <path d="M3 42c4-2 6-6 7-10s3-8 7-10 6-6 7-10" opacity="0.45" />
        <path d="M10 47c4-2 6-6 7-10s3-8 7-10 6-6 7-10" />
        <path d="M17 52c4-2 6-6 7-10s3-8 7-10 6-6 7-10" opacity="0.45" />
      </g>
      {/* Mlinjon: belah ketupat kecil pengisi sela antar lereng. Tanpa
          mlinjon, tiga goresan miring hanya terbaca sebagai garis miring. */}
      <g fill="currentColor" stroke="none">
        <path d="M6.5 42.7l1.8 1.8-1.8 1.8-1.8-1.8z" />
        <path d="M13.5 32.7l1.8 1.8-1.8 1.8-1.8-1.8z" />
        <path d="M20.5 22.7l1.8 1.8-1.8 1.8-1.8-1.8z" />
        <path d="M27.5 12.7l1.8 1.8-1.8 1.8-1.8-1.8z" />
      </g>
    </g>
  );
}

/** Sudut kelopak roset ceplok: empat mata angin + empat diagonal. */
const CEPLOK_PETALS = [0, 45, 90, 135, 180, 225, 270, 315];

function CeplokCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      {/* Ceplok selalu tersusun di dalam kotak, jadi bingkai wajik inilah yang
          memberi kesan "ceplok". */}
      <rect
        x="9"
        y="10"
        width="26"
        height="26"
        transform="rotate(45 22 23)"
        strokeWidth="0.9"
        opacity="0.55"
      />
      <rect
        x="11.5"
        y="12.5"
        width="21"
        height="21"
        transform="rotate(45 22 23)"
        strokeWidth="0.7"
        opacity="0.3"
      />
      {/* Isinya ROSET delapan kelopak, bukan salib. Versi sebelumnya memakai
          palang bertingkat pejal, dan pada ukuran kecil bentuk itu terbaca
          sebagai palang medis — bukan sebagai ceplok. Kelopaknya dibuat
          bersudut, bukan melengkung, supaya tetap terbaca geometris seperti
          batik dan tidak tertukar dengan crest bunga. */}
      <g transform="translate(22 23)">
        {CEPLOK_PETALS.map((angle, i) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path
              d={
                i % 2 === 0
                  ? "M0 -4.2l2.8-4.6L0 -13.4l-2.8 4.6z"
                  : "M0 -3.8l1.9-3.2L0 -10.4l-1.9 3.2z"
              }
              fill="currentColor"
              fillOpacity={i % 2 === 0 ? 0.55 : 0.3}
              stroke="none"
            />
          </g>
        ))}
        <circle r="4.2" fill="currentColor" fillOpacity="0.18" />
        <circle r="4.2" />
        <circle r="1.6" fill="currentColor" stroke="none" />
      </g>
      <g fill="currentColor" stroke="none" opacity="0.7">
        <circle cx="13" cy="14" r="1.5" />
        <circle cx="31" cy="14" r="1.5" />
        <circle cx="13" cy="32" r="1.5" />
        <circle cx="31" cy="32" r="1.5" />
      </g>
      <path d="M22 40v6" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="22" cy="49" r="2.4" fill="currentColor" stroke="none" />
    </g>
  );
}

function JlamprangCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.3">
      {/* Belah ketupat bertingkat, tiga lapis mengecil ke pusat. */}
      <path d="M22 4l16 19-16 19L6 23z" />
      <path d="M22 10.5l11 12.5L22 35.5 11 23z" fill="currentColor" fillOpacity="0.18" />
      <path
        d="M22 16l6.5 7-6.5 7-6.5-7z"
        fill="currentColor"
        fillOpacity="0.55"
        stroke="none"
      />
      <circle cx="22" cy="23" r="2.2" fill="currentColor" stroke="none" />
      <g fill="currentColor" stroke="none" opacity="0.8">
        <circle cx="22" cy="4" r="1.5" />
        <circle cx="38" cy="23" r="1.5" />
        <circle cx="22" cy="42" r="1.5" />
        <circle cx="6" cy="23" r="1.5" />
      </g>
      <path d="M22 44.5v4.5" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M18.5 51h7" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  );
}

function LasemCrest(): JSX.Element {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Ciri lasem ada pada PENATAAN kuncup yang bertingkat di satu tangkai,
          bukan pada bentuk satu kuncupnya — karena itu crest ini digambar
          sebagai tangkai utuh, bukan sebagai satu kuncup yang diperbesar. */}
      <path d="M22 53V22" />
      <path
        d="M22 22c-4.6 0-8-3.6-8-8 0-4.8 3.6-8.6 8-12 4.4 3.4 8 7.2 8 12 0 4.4-3.4 8-8 8z"
        fill="currentColor"
        fillOpacity="0.24"
      />
      <path d="M22 5v17" strokeWidth="0.9" opacity="0.65" />
      <g fill="currentColor" fillOpacity="0.3">
        <path d="M22 31c-4.4 0-8-2.8-9-7 4.4-1.6 8.6.8 9 7z" />
        <path d="M22 31c4.4 0 8-2.8 9-7-4.4-1.6-8.6.8-9 7z" />
      </g>
      <g fill="currentColor" fillOpacity="0.22">
        <path d="M22 42c-3.6 0-6.6-2.4-7.4-5.8 3.6-1.4 7 .6 7.4 5.8z" />
        <path d="M22 42c3.6 0 6.6-2.4 7.4-5.8-3.6-1.4-7 .6-7.4 5.8z" />
      </g>
    </g>
  );
}

function WayangKulitCrest(): JSX.Element {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* KENAPA VERSI SEBELUMNYA TERBACA SEBAGAI BURUNG
          Bukan karena hidungnya kurang panjang, justru sebaliknya. Kepala
          bulat + satu tonjolan lancip yang keluar PADA KETINGGIAN MATA adalah
          definisi siluet paruh; mata otak akan selalu membacanya sebagai
          unggas, sepanjang apa pun tonjolan itu dibuat.
          Dua hal yang mematahkan bacaan itu: (1) GELUNG besar di belakang
          kepala, yang membuat garis luarnya tidak lagi bulat, dan (2) DAGU
          yang jelas di bawah hidung, karena paruh tidak punya dagu. */}
      <path
        d="M18 21.6c-4.4.6-7.6-1.4-8.8-5.4-.8-2.8-.2-5.4 1.6-7.6 1.6 3.4 4.2 5.6 7.8 6.6z"
        fill="currentColor"
        fillOpacity="0.26"
      />
      {/* Jamang bermata tiga di atas dahi. */}
      <path
        d="M17.6 11.2l1.2-4.6 2.4 3 2-3.2 1.4 4.6z"
        fill="currentColor"
        fillOpacity="0.34"
        stroke="none"
      />
      <path
        d="M17.4 13.4c1.2-1.6 3.2-2.6 5.4-2.6 3.2 0 5.6 2.2 5.6 5.2 0 .9-.2 1.7-.6 2.4l3.4 1.6-3.8 1c-.7 1.5-2.2 2.5-4.2 2.6l-.4 2.4h-4.2z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <circle cx="25.2" cy="16" r="0.9" fill="currentColor" stroke="none" />
      {/* Badan condong ke depan: bahu maju, punggung melengkung ke belakang.
          Postur miring ini baku pada wayang dan tidak pernah tegak lurus. */}
      <path
        d="M19 26.4c-2.4 3-3.6 6.6-3.4 10.6.1 1.6.4 3.2 1 4.6h9.4c.8-1.5 1.3-3.1 1.5-4.8.4-4-.7-7.6-3-10.4z"
        fill="currentColor"
        fillOpacity="0.16"
      />
      {/* Tatahan: lubang-lubang yang membuatnya terbaca sebagai kulit yang
          ditatah, bukan sebagai bayangan pejal. */}
      <g fill="currentColor" stroke="none">
        <circle cx="19.6" cy="31" r="0.9" />
        <circle cx="23.6" cy="33.4" r="0.9" />
        <circle cx="19.6" cy="36.6" r="0.9" />
      </g>
      {/* Tangan luar biasa panjang dengan jari lancip — ciri wayang yang
          paling kuat, dan satu-satunya bagian yang masih terbaca di 20px. */}
      <path d="M25.6 27.6c4 3 6.6 6.8 7.6 11.6l2.8-.6-1.6 2.8 2.2 1.2-3.6.4" />
      <path d="M18.2 27.6c-3.4 3-5.6 6.8-6.6 11.6l-2.8-.6 1.6 2.8-2.2 1.2 3.6.4" />
      {/* Kain & tumpuan. */}
      <path
        d="M16.6 41.6h10l2.6 7H14z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path d="M22 48.6v4.4" strokeWidth="1.3" />
      <path d="M15.6 53.4h12.8" strokeWidth="1.3" />
    </g>
  );
}

function SakuraCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      {/* Sakura dikenali bersama rantingnya. Bunga tunggal yang mengambang
          terbaca sebagai bunga mana pun, jadi rantingnya ikut digambar. */}
      <path d="M22 53c0-7.5-.6-12-2.6-15.5" strokeLinecap="round" />
      <path
        d="M19.4 43c-2.8-.6-4.8-2.2-6-4.8"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
      <g transform="translate(22 20)">
        {FIVE_PETALS.map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path
              d="M0 -3.4c3.6 0 6.6-2.6 6.6-6.6 0-4-3-7.2-6.6-7.2s-6.6 3.2-6.6 7.2c0 4 3 6.6 6.6 6.6z"
              fill="currentColor"
              fillOpacity="0.22"
            />
            {/* Belahan di ujung kelopak. Tanpa belahan ini bentuknya jadi
                bunga lima kelopak apa saja; dengan belahan, sakura. */}
            <path d="M0 -17v3.4" strokeWidth="0.9" opacity="0.75" />
          </g>
        ))}
        <circle r="2.6" fill="currentColor" stroke="none" />
        <g strokeWidth="0.8" opacity="0.7">
          <path d="M0 0l3.4-3.4M0 0l-3.4-3.4M0 0v-4.6" />
        </g>
      </g>
      {/* Dua kuncup di ranting. */}
      <g fill="currentColor" fillOpacity="0.3" stroke="none">
        <ellipse cx="13.6" cy="37.6" rx="2.6" ry="3.6" transform="rotate(-35 13.6 37.6)" />
        <ellipse cx="29.4" cy="45" rx="2.2" ry="3.2" transform="rotate(30 29.4 45)" />
      </g>
      <path
        d="M19.8 44.6c2.8 0 5.6.8 7.8 2.4"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
    </g>
  );
}

function MelatiCrest(): JSX.Element {
  const petal = (
    <path
      d="M0 -4c2.6-1.4 3.4-5.2 0-11.5-3.4 6.3-2.6 10.1 0 11.5z"
      fill="currentColor"
      fillOpacity="0.24"
    />
  );

  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M24 53c-2-6-3.4-11-3.8-20" />
      {/* Kelopak melati lancip dan menyempit di pangkal, bukan bulat — itu
          yang membedakannya dari sakura pada ukuran kecil. */}
      <g transform="translate(20 17)">
        {SIX_PETALS.map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            {petal}
          </g>
        ))}
        <circle r="2.4" fill="currentColor" stroke="none" />
      </g>
      {/* Melati tumbuh bergerombol, jadi bunga kedua dan sepasang kuncup ikut
          digambar; satu bunga tunggal akan terbaca sebagai bunga lain.
          Pusatnya ditarik masuk ke (31, 36): pada posisi sebelumnya jangkauan
          kelopaknya melewati tepi kanan kanvas dan terpotong. */}
      <g transform="translate(31 36) scale(0.48)" opacity="0.85">
        {SIX_PETALS.map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            {petal}
          </g>
        ))}
        <circle r="2.4" fill="currentColor" stroke="none" />
      </g>
      <path d="M22.6 42.4c2.4-2 4.6-3.8 6.6-5.8" strokeWidth="1" opacity="0.75" />
      <g fill="currentColor" fillOpacity="0.28" stroke="none">
        <ellipse cx="13.4" cy="38.6" rx="2.2" ry="3.4" transform="rotate(-30 13.4 38.6)" />
        <ellipse cx="16.8" cy="47" rx="2" ry="3" transform="rotate(-20 16.8 47)" />
      </g>
      <path d="M21.6 36.6c-2.4 1-5 1.4-7.4 1.2" strokeWidth="1" opacity="0.75" />
      <path d="M22.8 45.6c-1.8-.2-3.6.2-5.2 1" strokeWidth="1" opacity="0.7" />
    </g>
  );
}

/** Tepi luar daun monstera, dalam koordinat lokal (0,0 di pangkal helai). */
const MONSTERA_EDGE =
  "M0 15C-9.4 12.6-14.5 4.6-14.5-3.6c0-7.4 5.2-13.6 14.5-16.4 9.3 2.8 14.5 9 14.5 16.4C14.5 4.6 9.4 12.6 0 15z";

/**
 * Celah daun, sebagai sub-path tertutup.
 *
 * Digabung dengan `MONSTERA_EDGE` di bawah satu `fill-rule="evenodd"`, celah
 * ini jadi LUBANG sungguhan, bukan garis di atas daun. Bedanya menentukan:
 * versi sebelumnya menggambar celah sebagai garis lurus yang menyeberangi
 * tepi daun, dan hasilnya terbaca sebagai daun bergaris — bukan monstera.
 *
 * Semua celah sengaja tidak menyentuh tepi: sub-path yang keluar dari tepi
 * daun akan di-XOR oleh `evenodd` jadi bidang terisi, bukan lubang.
 */
const MONSTERA_SLITS = [
  "M-3.4 -14.6l-4.6 1.2.5 2.2 4.6-1.2z",
  "M-3.4 -8.4l-7 1.8.5 2.2 7-1.8z",
  "M-3.4 -2l-7.4 1.9.5 2.2 7.4-1.9z",
  "M-3.4 4.2l-6 1.6.5 2.2 6-1.6z",
  "M-3.4 9.8l-3.6 1 .5 2.2 3.6-1z",
  "M3.4 -14.6l4.6 1.2-.5 2.2-4.6-1.2z",
  "M3.4 -8.4l7 1.8-.5 2.2-7-1.8z",
  "M3.4 -2l7.4 1.9-.5 2.2-7.4-1.9z",
  "M3.4 4.2l6 1.6-.5 2.2-6-1.6z",
  "M3.4 9.8l3.6 1-.5 2.2-3.6-1z",
].join("");

function MonsteraCrest(): JSX.Element {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Daun monstera nyaris tidak pernah tegak lurus. Kemiringan kecil di
          bawah inilah yang membuatnya terasa tropis, bukan simetris-dekoratif. */}
      <path d="M22 53c0-8 .6-12 2-15" />
      <g transform="translate(22 22) rotate(-7)">
        <path
          d={MONSTERA_EDGE + MONSTERA_SLITS}
          fillRule="evenodd"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="none"
        />
        <path d={MONSTERA_EDGE} />
        <path d="M0 15V-19" strokeWidth="1" opacity="0.8" />
        <path d={MONSTERA_SLITS} strokeWidth="0.7" opacity="0.55" />
      </g>
    </g>
  );
}

function MerpatiCrest(): JSX.Element {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Sayap terangkat DI ATAS PUNGGUNG, bukan di atas kepala. Versi
          sebelumnya menaruhnya tepat di depan kepala, jadi kepala dan paruhnya
          tertutup dan yang tersisa hanya gumpalan. */}
      <path
        d="M18 31c-2.6-5.6-2.6-11.6 0-18 4.4 4.2 6.6 9.8 6 16.4z"
        fill="currentColor"
        fillOpacity="0.28"
      />
      {/* Badan, miring turun ke belakang. */}
      <ellipse
        cx="21.5"
        cy="33"
        rx="9.2"
        ry="6.2"
        transform="rotate(-18 21.5 33)"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Ekor mengipas ke kiri-bawah. */}
      <path d="M14 35.6L4.4 38.4l9 4.2z" fill="currentColor" fillOpacity="0.2" />
      {/* Kepala & paruh. */}
      <circle cx="29.4" cy="24.4" r="3.4" fill="currentColor" fillOpacity="0.22" />
      <path d="M32.4 23.2l3.8 1-3.6 1.8z" fill="currentColor" fillOpacity="0.55" />
      <circle cx="30.4" cy="23.4" r="0.8" fill="currentColor" stroke="none" />
      <path d="M26.8 26.8c-1.4 1.1-2.5 2.3-3.2 3.6" strokeWidth="1" opacity="0.8" />
      {/* Ranting zaitun di paruhnya. */}
      <path d="M36.2 25.2c1.6 2.2 2.4 4.6 2.4 7.2" strokeWidth="1" />
      <g fill="currentColor" stroke="none" opacity="0.8">
        <ellipse cx="37.8" cy="27.4" rx="2.2" ry="1.1" transform="rotate(55 37.8 27.4)" />
        <ellipse cx="39" cy="31.6" rx="2.2" ry="1.1" transform="rotate(55 39 31.6)" />
      </g>
      {/* Tumpuan. */}
      <path d="M22 39.6v8.8" strokeWidth="1.1" />
      <path d="M16.5 50h11" strokeWidth="1.1" />
    </g>
  );
}

function DamaskCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      {/* Cartouche ogee: dua lengkung berbalik arah yang bertemu di puncak dan
          di dasar. Lengkung berbalik itulah damask — bukan kerapatan
          ornamennya, yang sering disalahartikan sebagai cirinya. */}
      <path
        d="M22 4c6.4 6.2 12.4 10.4 12.4 17.4S28.4 32.6 22 39c-6.4-6.4-12.4-10.6-12.4-17.6S15.6 10.2 22 4z"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <path
        d="M22 11c4.2 4.2 8 6.9 8 10.5S26.2 30 22 34c-4.2-4-8-6.9-8-12.5S17.8 15.2 22 11z"
        strokeWidth="1"
        opacity="0.65"
      />
      {/* Daun akantus di kedua sisi. */}
      <path
        d="M9.6 21.4c-4-1.2-6-4.2-5.8-8.4 4.2.2 7 2.4 7.8 6.4z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path
        d="M34.4 21.4c4-1.2 6-4.2 5.8-8.4-4.2.2-7 2.4-7.8 6.4z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <circle cx="22" cy="21.6" r="2.4" fill="currentColor" stroke="none" />
      <path d="M22 39v7" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M17 48h10" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="22" cy="52" r="1.6" fill="currentColor" stroke="none" />
    </g>
  );
}

function ArtDecoCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      {/* Kipas bertingkat di atas garis berjenjang. Keduanya wajib: kipas
          sendirian terbaca sebagai matahari terbit, dan garis berjenjang
          sendirian hanya terbaca sebagai garis. */}
      <path
        d="M6 33a16 16 0 0 1 32 0z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
      />
      <path d="M6 33a16 16 0 0 1 32 0" />
      <path d="M11 33a11 11 0 0 1 22 0" strokeWidth="1" opacity="0.7" />
      <path d="M16 33a6 6 0 0 1 12 0" strokeWidth="1" opacity="0.55" />
      <g strokeWidth="0.9" opacity="0.6">
        <path d="M22 33V19M22 33l9.9-9.9M22 33L12.1 23.1" />
      </g>
      <path d="M22 14l3.2 4.4h-6.4z" fill="currentColor" stroke="none" />
      <path d="M22 8.5v5" strokeWidth="1.1" />
      <g strokeWidth="1.3">
        <path d="M6 37.5h32M9.5 42h25M13 46.5h18M16.5 51h11" />
      </g>
    </g>
  );
}

/**
 * Songket: deret tumpal, rosette tengah, dan rumbai di bawah.
 *
 * Susunannya mengikuti kain songket sungguhan dari atas ke bawah: barisan
 * tumpal (pucuk rebung) di kepala kain, bidang tengah berisi satu motif utama,
 * lalu rumbai di tepi bawah. Urutan itu yang membuat ornamen ini terbaca
 * sebagai KAIN dan bukan sebagai kumpulan segitiga — tumpal yang disebar tanpa
 * jalur benang kehilangan seluruh rujukannya.
 */
function SongketCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      {/* Kepala kain: tumpal tengah lebih tinggi dari dua pengapitnya. */}
      <g fill="currentColor" fillOpacity="0.2" stroke="none">
        <path d="M22 4l6.4 13H15.6z" />
        <path d="M10.5 8l4.6 9H5.9z" />
        <path d="M33.5 8l4.6 9h-9.2z" />
      </g>
      <path d="M22 4l6.4 13H15.6z" />
      <g strokeWidth="1">
        <path d="M10.5 8l4.6 9H5.9z" />
        <path d="M33.5 8l4.6 9h-9.2z" />
      </g>

      {/* Jalur benang lungsi: pembatas antar bidang kain. */}
      <g strokeWidth="1.2">
        <path d="M4 20h36M4 22.6h36" />
      </g>

      {/* Bidang tengah: wajik berlapis, satu motif utama seperti pada kainnya. */}
      <path d="M22 25.5l8.5 9.5-8.5 9.5-8.5-9.5z" />
      <path
        d="M22 29.4l5 5.6-5 5.6-5-5.6z"
        fill="currentColor"
        fillOpacity="0.24"
        strokeWidth="1"
      />
      <circle cx="22" cy="35" r="1.7" fill="currentColor" stroke="none" />

      <g strokeWidth="1.2">
        <path d="M4 47.4h36" />
      </g>
      {/* Rumbai: tumpal yang MENGHADAP KE BAWAH, berlawanan dengan yang di
          kepala kain — begitulah tepi bawah songket diselesaikan. */}
      <g fill="currentColor" fillOpacity="0.3" stroke="none">
        <path d="M22 55l-4.6-7.6h9.2z" />
        <path d="M11 53.4l-3.6-6h7.2z" />
        <path d="M33 53.4l-3.6-6h7.2z" />
      </g>
    </g>
  );
}

/**
 * Patra Bali: sulur berpasangan saling membalas pada satu batang tengah.
 *
 * SULURNYA DIPERKECIL LEWAT `scale()`, jadi `strokeWidth` di sini harus
 * dihitung balik: 2 × 0,7 = 1,4 dan 2,4 × 0,58 = 1,39, dua-duanya mendarat di
 * tebal garis yang sama dengan crest lain di berkas ini. Kalau angka itu
 * ditulis 1,4 begitu saja, sulur bawah akan bergaris dua kali lebih tipis dari
 * sulur atas — cacat yang di layar terbaca sebagai ukiran yang memudar.
 */
function PatraBaliCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M22 52.5V13" strokeWidth="1.5" />

      {/* Pasangan bawah. Yang kiri adalah cermin yang kanan: `scale(-0.7 0.7)`
          membalik sumbu x saja, jadi arah lingkar sulurnya ikut berlawanan —
          persis cara ukiran Bali disusun saling membalas. */}
      <g strokeWidth="2">
        <g transform="translate(22 36) scale(0.7)">
          <path d={PATRA_SCROLL} />
        </g>
        <g transform="translate(22 36) scale(-0.7 0.7)">
          <path d={PATRA_SCROLL} />
        </g>
      </g>
      <g fill="currentColor" stroke="none">
        <circle cx="30.4" cy="43.4" r="1.6" />
        <circle cx="13.6" cy="43.4" r="1.6" />
      </g>

      {/* Pasangan atas, lebih kecil — ukiran patra selalu menyempit ke puncak. */}
      <g strokeWidth="2.4">
        <g transform="translate(22 21) scale(0.58)">
          <path d={PATRA_SCROLL} />
        </g>
        <g transform="translate(22 21) scale(-0.58 0.58)">
          <path d={PATRA_SCROLL} />
        </g>
      </g>
      <g fill="currentColor" stroke="none">
        <circle cx="28.9" cy="27.1" r="1.3" />
        <circle cx="15.1" cy="27.1" r="1.3" />
      </g>

      {/* Pucuk daun di ujung batang. */}
      <path
        d="M22 4c3.2 3.8 3.2 8.2 0 11.4-3.2-3.2-3.2-7.6 0-11.4z"
        fill="currentColor"
        fillOpacity="0.28"
        strokeWidth="1.4"
      />
      <path d="M12 52.5h20" strokeWidth="1.5" />
    </g>
  );
}

/**
 * Girih: bintang delapan berlapis dengan bandul di bawahnya.
 *
 * Bintangnya digambar dari `girihStar()` pada ukuran akhirnya, BUKAN dengan
 * memperbesar bintang ubin — itulah sebabnya fungsi pembangkit jalur itu ada.
 * Bandul di bawah bukan hiasan tambahan: bintang delapan tunggal yang
 * mengapung di tengah kanvas tidak punya atas-bawah, dan ornamen tanpa
 * atas-bawah tampak seperti ikon yang kelupaan diputar.
 */
function GirihCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <g transform="translate(22 22)">
        <path
          d={girihStar(17, 9.2)}
          fill="currentColor"
          fillOpacity="0.16"
        />
        <path d={girihStar(17, 9.2)} />
        <path d={girihStar(9.6, 5.2)} strokeWidth="1.1" opacity="0.75" />
        <circle r="2.1" fill="currentColor" stroke="none" />
      </g>

      <path d="M22 39.2v3.2" strokeWidth="1.1" />
      <path
        d="M22 42.4l4 5.2-4 5.2-4-5.2z"
        fill="currentColor"
        fillOpacity="0.2"
        strokeWidth="1.2"
      />
    </g>
  );
}

/**
 * Simpul kisi mashrabiya — disusun BERSELANG-SELING, tidak sebagai salib.
 *
 * SUSUNAN PERTAMA DI SINI ADALAH SATU KOLOM TEGAK DITAMBAH DUA PASANG SAMPING,
 * DAN SETELAH DIRENDER BENTUKNYA SALIB. Di dalam lengkungan, pada motif yang
 * satu-satunya alasan keberadaannya adalah melayani undangan pernikahan
 * muslim, itu kesalahan terparah yang bisa terjadi — dan mustahil terlihat
 * dari kode, karena di kode yang tertulis hanya delapan pasang koordinat.
 *
 * Susunan berselang-seling di bawah tidak punya sumbu tegak maupun sumbu
 * mendatar yang menonjol, jadi tidak ada bacaan salib yang bisa terbentuk.
 * Kebetulan itu juga susunan yang benar: kisi jali sungguhan memang disusun
 * diagonal, bukan dalam kolom dan baris.
 *
 * `r` menyusut ke arah puncak karena bidang di dalam lengkungannya menyempit.
 */
const MASHRABIYA_NODES = [
  { x: 15.5, y: 47, r: 3 },
  { x: 22, y: 47, r: 3 },
  { x: 28.5, y: 47, r: 3 },
  { x: 18.75, y: 39.5, r: 3 },
  { x: 25.25, y: 39.5, r: 3 },
  { x: 15.5, y: 32, r: 3 },
  { x: 22, y: 32, r: 3 },
  { x: 28.5, y: 32, r: 3 },
  { x: 18.75, y: 24.5, r: 3 },
  { x: 25.25, y: 24.5, r: 3 },
  { x: 18, y: 18, r: 2.8 },
  { x: 26, y: 18, r: 2.8 },
  { x: 22, y: 11.5, r: 2 },
];

/**
 * Mashrabiya: panel berlengkung ogee berisi kisi, duduk di atas ambang.
 *
 * LENGKUNGANNYA OGEE — melebar di bawah lalu menyempit cekung ke satu titik —
 * BUKAN lancet. Percobaan pertama memakai lancet (dua busur cembung yang
 * bertemu di puncak), dan itu persis profil jendela gereja Gotik. Ogee adalah
 * lengkungan yang justru tidak pernah dipakai gereja Gotik dan dipakai hampir
 * di seluruh arsitektur Islam, dari Mughal sampai Mamluk.
 *
 * KISINYA DIGAMBAR SATU PER SATU, TIDAK DIPOTONG DENGAN `clipPath`. Memotong
 * kisi penuh dengan bentuk lengkungnya memang lebih singkat ditulis, tapi
 * hasilnya adalah wajik-wajik yang terpangkas separuh di seluruh tepi
 * lengkungan — dan kisi mashrabiya sungguhan justru dikerjakan sebaliknya:
 * bilahnya disusun mengikuti bentuk bidangnya, tidak pernah dipotong di tepi.
 *
 * Ambang di bawah juga wajib. Lengkungan tanpa ambang mengapung, dan yang
 * membuat bentuk ini terbaca sebagai JENDELA adalah justru tumpuannya.
 */
function MashrabiyaCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path
        d="M8 52V26C8 20 10.5 16 14.5 13.5 18 11.3 20.5 8 22 3c1.5 5 4 8.3 7.5 10.5C33.5 16 36 20 36 26v26z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="none"
      />
      <path d="M8 52V26C8 20 10.5 16 14.5 13.5 18 11.3 20.5 8 22 3c1.5 5 4 8.3 7.5 10.5C33.5 16 36 20 36 26v26" />
      <path
        d="M11.5 52V26.4C11.5 21.2 13.7 17.8 17 15.7 19.8 13.9 21.3 11 22 7.2c0.7 3.8 2.2 6.7 5 8.5 3.3 2.1 5.5 5.5 5.5 10.7V52"
        strokeWidth="0.9"
        opacity="0.6"
      />

      <g fill="currentColor" stroke="none">
        {MASHRABIYA_NODES.map(({ x, y, r }) => (
          <path
            key={`${x}-${y}`}
            d={`M0 ${-r}L${r} 0 0 ${r}-${r} 0z`}
            transform={`translate(${x} ${y})`}
            fillOpacity="0.5"
          />
        ))}
      </g>

      <path d="M5 52h34" strokeWidth="1.6" />
      <path d="M7.5 55h29" strokeWidth="1.1" opacity="0.7" />
    </g>
  );
}

/**
 * Anggrek bulan: satu tangkai melengkung dengan DUA bunga yang tidak bertumpuk.
 *
 * TIGA BUNGA SUDAH DICOBA DAN DIBUANG. Tangkai anggrek sungguhan memang
 * berbunga banyak, jadi tiga bunga pada satu lengkung tampak seperti pilihan
 * yang benar — tapi satu bunga tingginya 23 unit sedangkan kanvasnya 56, jadi
 * tiga bunga pasti saling menindih. Dirender, hasilnya BUAH ANGGUR: kelopak
 * samar yang bertumpuk melebur jadi satu gerombolan, dan lidah-lidah pekatnya
 * terbaca sebagai butir-butir di dalamnya. Tidak ada satu pun wajah bunga yang
 * masih bisa dikenali.
 *
 * Dua bunga adalah jumlah terbanyak yang muat tanpa bersentuhan: bunga atas
 * berakhir di y 27,1 dan bunga bawah baru mulai di y 34,2. Karakter "tangkai
 * berbunga banyak" tetap tersampaikan oleh lengkung tangkainya dan oleh kuncup
 * di dekat pangkal — tanpa harus menumpuk apa pun.
 *
 * TANGKAINYA BERHENTI DI TEPI BUNGA, TIDAK MENEMBUSNYA. Versi sebelumnya
 * menaruh kedua bunga tepat di atas kurva tangkai supaya tidak ada yang tampak
 * melayang, dan itu justru menghasilkan cacat yang lebih buruk: kelopak hanya
 * berisian 0,3, jadi tangkai hitam setebal 1,4 TEMBUS PANDANG di belakangnya
 * dan membelah wajah bunga menjadi dua. Karena itu tangkai utama berakhir di
 * (23,5 25,5), tepat menyentuh labellum bunga atas — keduanya sama-sama pekat
 * penuh, jadi sambungannya tidak terlihat sebagai garis yang terpotong.
 *
 * Bunga bawah digantung pada TANGKAI CABANG pendek ke kiri, bukan ditusuk
 * tangkai utama. Itu memang susunan anggrek sungguhan: bunganya berselang-seling
 * pada tangkai-tangkai pendek, bukan berjejer di satu batang.
 */
function AnggrekCrest(): JSX.Element {
  return (
    <g>
      <path
        d="M22 54.2C21 45 20 35 23.5 25.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Tangkai cabang bunga bawah: berhenti 1,5 unit di dalam tepi kelopak
          kanannya, jadi sambungannya terbaca tanpa menyeberangi wajah bunga. */}
      <path
        d="M21 39.3C19.6 39.9 18.4 40.1 17.5 40.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path d="M15 54.6h14" fill="none" stroke="currentColor" strokeWidth="1.4" />
      {/* Kuncup yang belum membuka, menempel di tangkai dekat pangkal. */}
      <ellipse
        cx="19.8"
        cy="49"
        rx="2.3"
        ry="3.9"
        transform="rotate(-32 19.8 49)"
        fill="currentColor"
        fillOpacity="0.34"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeOpacity="0.85"
      />
      {/* 0,84 ÷ 0,52 dan 0,9 ÷ 0,95 — lihat `AnggrekBloom`. */}
      <g transform="translate(12.5 40.5) scale(0.52)">
        <AnggrekBloom petalStroke={1.6} />
      </g>
      <g transform="translate(24 17) scale(0.95)">
        <AnggrekBloom petalStroke={0.95} />
      </g>
    </g>
  );
}

/** Kamboja: satu bunga besar bertangkai, seperti jepun yang baru dipetik. */
function KambojaCrest(): JSX.Element {
  return (
    <g>
      <path
        d="M22 34C22 42 21.2 48 20.6 53"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <g fill="currentColor" fillOpacity="0.3">
        <ellipse cx="13.6" cy="42" rx="3.2" ry="6" transform="rotate(-34 13.6 42)" />
        <ellipse cx="29" cy="46" rx="3" ry="5.6" transform="rotate(34 29 46)" />
      </g>
      <g transform="translate(22 20)">
        <KambojaBloom />
      </g>
      <path d="M13.5 53.5h14" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </g>
  );
}

/**
 * Simpul daun pada satu cabang crest dedaunan.
 *
 * `tilt` adalah arah cabang di titik itu, diukur dari sumbu x — dihitung dari
 * turunan kurva Béziernya, bukan dikira-kira. Daun selalu dipasang tegak lurus
 * cabangnya, jadi memakai sudut yang salah membuat daun tampak menancap miring
 * di satu sisi saja, dan rangkaiannya langsung terbaca sebagai gambar yang
 * dikerjakan setengah jalan.
 */
const DEDAUNAN_BRANCH_NODES = [
  { x: 16.97, y: 45.7, tilt: 59 },
  { x: 12.5, y: 37.38, tilt: 65 },
  { x: 8.78, y: 28.11, tilt: 71 },
];

/**
 * Satu cabang kiri rangkaian dedaunan, lengkap dengan daunnya.
 *
 * UJUNGNYA MELEBAR KELUAR, TIDAK MELENGKUNG MASUK. Versi pertama cabang ini
 * berakhir di `C14 46 9 34 9 20` — ujungnya membalik ke dalam, sehingga sepasang
 * cabang bercerminnya bertemu di dua tempat sekaligus (di pangkal dan hampir di
 * ujung) dan garis luarnya menutup menjadi siluet PERISAI. Karena itu titik
 * akhirnya sekarang berada di (6 18), jauh di luar lengkungan pangkalnya: dua
 * ujung yang terpisah 32 satuan tidak bisa menutup menjadi bidang apa pun.
 *
 * UJUNG CABANG HANYA DAPAT SATU DAUN. Sepasang daun di (6 18) dengan `tilt` 78
 * melebar sampai x ≈ −2, jadi daun luarnya terpotong tepi kanvas. Satu daun yang
 * berbaring di sepanjang cabang menutup ujungnya tanpa keluar kotak.
 *
 * DAUNNYA DIBERI GARIS TEPI. Isian 0,34 saja terlalu pucat di sebelah cabang
 * setebal 1,3 — daunnya lenyap dan yang tersisa hanya dua goresan melengkung.
 * Perlakuan yang sama membuat `KambojaCrest` terbaca.
 */
function DedaunanBranch(): JSX.Element {
  return (
    <>
      <path
        d="M22 53C15 44 9 32 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* `tilt` tiap simpul dihitung dari turunan kurva di atas pada
          t = 0,25 / 0,5 / 0,75 — lihat catatan di `DEDAUNAN_BRANCH_NODES`. */}
      <g
        fill="currentColor"
        fillOpacity="0.34"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeOpacity="0.8"
      >
        {DEDAUNAN_BRANCH_NODES.map(({ x, y, tilt }) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${tilt})`}>
            <ellipse cy="-4" rx="2.5" ry="4.2" />
            <ellipse cy="4" rx="2.5" ry="4.2" />
          </g>
        ))}
        <ellipse
          cx="5.2"
          cy="15.2"
          rx="2.4"
          ry="4.2"
          transform="rotate(-12 5.2 15.2)"
        />
      </g>
    </>
  );
}

/**
 * Dedaunan: sepasang cabang daun yang membuka lebar seperti laurel.
 *
 * TENGAHNYA MEMANG DIBIARKAN KOSONG. Versi sebelumnya mengisi rongga itu dengan
 * satu ranting tegak, dan justru itulah yang merusaknya: ranting tengah di dalam
 * siluet perisai terbaca sebagai lambang di atas perisai, bukan sebagai
 * dedaunan. Ranting tegak juga sudah menjadi bentuk `LasemCrest` — memakainya di
 * sini membuat dua motif berbeda tampak sama di pemilih motif admin.
 *
 * Rongga kosong di antara dua cabang adalah cara laurel digambar di mana-mana,
 * jadi bentuknya tetap terbaca tanpa pengisi.
 */
function DedaunanCrest(): JSX.Element {
  return (
    <g>
      <DedaunanBranch />
      <g transform="translate(44 0) scale(-1 1)">
        <DedaunanBranch />
      </g>

      {/* Garis pengikat di bawah titik temu kedua cabang. Tanpa ini pangkalnya
          hanya berupa dua garis yang bersilangan, dan rangkaiannya terbaca
          sebagai dua tangkai lepas yang kebetulan berdekatan. */}
      <path
        d="M15.5 54.8h13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * Jalur tepi berlekuk: lingkaran yang tepinya berupa deret busur menonjol.
 *
 * DIBANGUN DARI BUSUR YANG BERBAGI UJUNG, bukan dari lingkaran-lingkaran kecil
 * yang separuhnya ditutup bidang buram. Cara menutup itu memaksa adanya satu
 * warna solid di berkas yang seluruh isinya `currentColor` — dan begitu
 * undangannya memakai latar gelap, tutup putihnya berubah menjadi piringan
 * terang yang menelan ornamennya sendiri.
 *
 * Karena setiap busur BERAKHIR tepat di titik awal busur berikutnya, tidak ada
 * sambungan yang perlu dicocokkan: celah bergerigi di tepi renda — cacat yang
 * paling cepat terlihat pada ornamen seperti ini — mustahil terjadi.
 *
 * `bulge` sebaiknya sedikit lebih besar dari separuh panjang tali busurnya.
 * Tepat sama membuat lekuknya setengah lingkaran penuh (paling tinggi, tapi
 * rawan dibulatkan jadi busur kosong), jauh lebih besar membuatnya nyaris
 * datar.
 */
function scallopRing(radius: number, count: number, bulge: number): string {
  const points: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const angle = ((i * 360) / count - 90) * (Math.PI / 180);
    const x = (Math.cos(angle) * radius).toFixed(2);
    const y = (Math.sin(angle) * radius).toFixed(2);
    points.push(`${x} ${y}`);
  }

  // Sudut yang menaik + sweep-flag 1 membuat busurnya menonjol KE LUAR. Dengan
  // flag 0, lekuknya menekuk ke dalam dan tepinya terbaca sebagai gerigi gir.
  const arcs = points
    .slice(1)
    .concat(points[0] as string)
    .map((p) => `A${bulge} ${bulge} 0 0 1 ${p}`)
    .join("");

  return `M${points[0]}${arcs}z`;
}

/** Tepi medali renda: dua belas lekuk pada lingkaran berjari-jari 12. */
const RENDA_MEDALLION = scallopRing(12, 12, 3.15);

/**
 * Renda: medali berlekuk dengan bandul kecil di bawahnya.
 *
 * Lubang-lubang kecil di antara dua cincinnya adalah yang membedakan motif ini
 * dari sekadar piringan berlekuk — renda dikenali dari lubangnya, sama seperti
 * kain berlubang mana pun.
 */
function RendaCrest(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <g transform="translate(22 22)">
        <path d={RENDA_MEDALLION} fill="currentColor" fillOpacity="0.14" />
        <path d={RENDA_MEDALLION} strokeWidth="1.3" />
        <circle r="7.6" strokeWidth="1" opacity="0.75" />
        <g fill="currentColor" stroke="none" opacity="0.6">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <circle
              key={angle}
              cx={(Math.cos((angle * Math.PI) / 180) * 9.8).toFixed(2)}
              cy={(Math.sin((angle * Math.PI) / 180) * 9.8).toFixed(2)}
              r="1.2"
            />
          ))}
        </g>
        <circle r="2.2" fill="currentColor" stroke="none" />
      </g>

      {/* Bandul: deret lekuk yang menggantung dari garis lurus, sama seperti
          ubinnya — supaya karakter motif ini tetap sama di kedua ukuran. */}
      <path d="M22 36.6v4.2" strokeWidth="1" />
      <path d="M13.5 40.8h17" strokeWidth="1.3" />
      <g strokeWidth="1">
        {[14, 19.3, 24.6].map((x) => (
          <path key={x} d={`M${x} 40.8a2.65 2.65 0 0 0 5.3 0`} />
        ))}
      </g>
      <g fill="currentColor" stroke="none" opacity="0.55">
        {[16.65, 21.95, 27.25].map((x) => (
          <circle key={x} cx={x} cy="47.2" r="1" />
        ))}
      </g>
    </g>
  );
}

/**
 * Peta motif → crest-nya.
 *
 * Tanpa cadangan, dan itu disengaja — lihat alasan panjangnya di atas.
 * `Record<MotifId, …>` membuat motif baru tanpa crest menggagalkan `tsc`,
 * sama seperti motif baru tanpa tile.
 */
const CRESTS: Record<MotifId, () => JSX.Element> = {
  kawung: KawungCrest,
  parang: ParangCrest,
  ceplok: CeplokCrest,
  jlamprang: JlamprangCrest,
  lasem: LasemCrest,
  gunungan: GununganCrest,
  "wayang-kulit": WayangKulitCrest,
  songket: SongketCrest,
  "patra-bali": PatraBaliCrest,
  girih: GirihCrest,
  mashrabiya: MashrabiyaCrest,
  sakura: SakuraCrest,
  melati: MelatiCrest,
  monstera: MonsteraCrest,
  anggrek: AnggrekCrest,
  kamboja: KambojaCrest,
  dedaunan: DedaunanCrest,
  "kupu-kupu": KupuKupuCrest,
  merak: MerakCrest,
  merpati: MerpatiCrest,
  damask: DamaskCrest,
  "art-deco": ArtDecoCrest,
  renda: RendaCrest,
};

/**
 * Ornamen berdiri sendiri untuk sebuah motif.
 *
 * Dipakai di dua tempat: puncak kartu sampul (sebagai hierarki vertikal di
 * bawah nama) dan titik tengah pembatas antar bagian. Sudut bingkai TIDAK
 * memakai crest — lihat `MotifCornerGlyph` di bawah untuk alasannya.
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
  const Crest = CRESTS[motif];

  return (
    <svg
      width={width}
      height={width * (28 / 22)}
      viewBox="0 0 44 56"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <Crest />
    </svg>
  );
}

// ============================================
// Glyph sudut — bentuk KETIGA setiap motif
// ============================================

/**
 * KENAPA ADA BENTUK KETIGA, BUKAN CREST YANG DIPERKECIL
 *
 * `CornerFrame` adalah ornamen yang PALING SERING TERULANG di seluruh produk:
 * dipakai di tiga belas tempat, empat salinan tiap tempat, dengan ukuran mulai
 * `h-8` (32 px) sampai `h-20` (80 px). Sampai sekarang ia buta motif — ia
 * berkunci pada `frameStyle` yang hanya punya tiga nilai, sehingga sudut
 * bingkai klien yang memilih Burung Merak identik dengan klien yang memilih
 * Batik Parang. Itu ornamen paling banyak jumlahnya sekaligus paling tidak
 * personal.
 *
 * Perbaikan yang tampak jelas — menyelipkan crest ke sudut — TIDAK BISA
 * dipakai. Crest digambar di kanvas 44×56 dan dirancang terbaca pada 20–56 px.
 * Di sudut `h-8`, kotak 64 unit dipetakan ke 32 px, jadi crest yang diperkecil
 * agar muat hanya menyisakan tinggi sekitar 12 px. Pada ukuran itu detail
 * tatahan wayang, celah monstera, dan mata bulu merak semuanya runtuh jadi
 * satu gumpalan; yang tampil bukan motif, hanya noda.
 *
 * Karena itu glyph di bawah BUKAN crest yang diperkecil, melainkan satu ciri
 * paling khas dari tiap motif yang digambar ulang setebal mungkin: kawung jadi
 * empat bulatan, parang jadi dua garis miring, merak jadi satu mata bulu.
 * Kanvasnya 24×24 dan garisnya jauh lebih tebal dari crest, supaya masih
 * terbaca di 9 px maupun di 23 px.
 *
 * Sama seperti `TILES` dan `CRESTS`, registrinya bertipe `Record<MotifId, …>`
 * tanpa cadangan — motif baru tanpa glyph akan menggagalkan `tsc`.
 */

/** Sudut empat mata angin, dipakai beberapa glyph geometris. */
const QUARTERS = [0, 90, 180, 270];

function KawungGlyph(): JSX.Element {
  return (
    <g fill="currentColor">
      <ellipse cx="12" cy="5.6" rx="3" ry="4.2" />
      <ellipse cx="12" cy="18.4" rx="3" ry="4.2" />
      <ellipse cx="5.6" cy="12" rx="4.2" ry="3" />
      <ellipse cx="18.4" cy="12" rx="4.2" ry="3" />
      <circle cx="12" cy="12" r="1.9" />
    </g>
  );
}

function ParangGlyph(): JSX.Element {
  return (
    <>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        <path d="M4 20.5L13 3.5" />
        <path d="M12.5 20.5L20 6.5" />
      </g>
      {/* Mlinjon — wajik kecil yang selalu menyertai garis parang. */}
      <path d="M17.6 16.4l2.2 2.2-2.2 2.2-2.2-2.2z" fill="currentColor" />
    </>
  );
}

function CeplokGlyph(): JSX.Element {
  return (
    <g transform="translate(12 12)">
      {QUARTERS.map((angle) => (
        <path
          key={angle}
          d="M0 -3l2.6-3.6L0 -10.6l-2.6 3.6z"
          transform={`rotate(${angle})`}
          fill="currentColor"
        />
      ))}
      <circle r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle r="1.3" fill="currentColor" />
    </g>
  );
}

function JlamprangGlyph(): JSX.Element {
  return (
    <>
      <path
        d="M12 2l10 10-10 10L2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 7.4l4.6 4.6L12 16.6 7.4 12z" fill="currentColor" />
    </>
  );
}

function LasemGlyph(): JSX.Element {
  return (
    <g fill="currentColor">
      <path
        d="M12 22V6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="12" cy="5.2" rx="2.7" ry="3.8" />
      <ellipse cx="7.6" cy="12" rx="3.6" ry="2.1" transform="rotate(-28 7.6 12)" />
      <ellipse
        cx="16.4"
        cy="15.2"
        rx="3.6"
        ry="2.1"
        transform="rotate(28 16.4 15.2)"
      />
    </g>
  );
}

function GununganGlyph(): JSX.Element {
  return (
    <path
      d="M12 1.8c2.6 3.8 5.4 6.4 5.4 9.2 0 1.5-.8 2.6-2 3.4 2 1.5 3.2 3.6 3.2 5.6 0 .7-.5 1.2-1.4 1.2H6.8c-.9 0-1.4-.5-1.4-1.2 0-2 1.2-4.1 3.2-5.6-1.2-.8-2-1.9-2-3.4 0-2.8 2.8-5.4 5.4-9.2z"
      fill="currentColor"
    />
  );
}

function WayangKulitGlyph(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      {/* Yang dipakai sebagai ciri di sini adalah GELUNG-nya — sulur melingkar
          di belakang kepala wayang. Wajahnya tidak dipakai: pada 9 px kepala
          bulat dengan hidung selalu jatuh jadi siluet unggas, persis kesalahan
          yang sudah diperbaiki di crest. */}
      <path
        d="M18.4 21.6c-6.6 0-11.4-4.4-11.4-10.2 0-4.6 3.2-8 7.6-8 3.3 0 5.7 2.2 5.7 5.1 0 2.6-2 4.5-4.5 4.5-1.8 0-3.1-1.1-3.1-2.7"
        strokeWidth="2.3"
      />
      <path d="M4.6 21.6h14.8" strokeWidth="2" />
    </g>
  );
}

function SakuraGlyph(): JSX.Element {
  return (
    <g transform="translate(12 12)" fill="currentColor">
      {FIVE_PETALS.map((angle) => (
        <circle
          key={angle}
          cx="0"
          cy="-6.4"
          r="4"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </g>
  );
}

function MelatiGlyph(): JSX.Element {
  return (
    <g transform="translate(12 12)" fill="currentColor">
      {SIX_PETALS.map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy="-5.8"
          rx="2"
          ry="4.8"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle r="1.7" />
    </g>
  );
}

function MonsteraGlyph(): JSX.Element {
  return (
    <>
      <path
        d="M12 16V22.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* TIGA BACAAN SALAH YANG SUDAH DICOBA DAN DIBUANG
          (1) Daun dibelah dalam sampai hampir ke tangkai → pada 13 px jadi dua
              tonjolan di atas satu batang: terbaca HURUF Y.
          (2) Belahan didangkalkan, celahnya dilubangi `evenodd` → dua lubang
              simetris terbaca SEPASANG MATA, seluruh daun jadi seperti ngengat.
          (3) Empat celah ditakik dari tepi → takikan mendatar itu menumpuk
              jadi tingkatan, dan tingkatan bertumpuk di atas satu batang
              adalah tanda tangan POHON CEMARA.
          Yang dipakai sekarang memisahkan dua tugas. Garis luarnya dibuat MULUS
          — satu daun bulat telur, tanpa takik sama sekali, jadi tidak ada
          tingkatan yang bisa terbentuk. Celah monstera-nya dilubangi di DALAM
          daun, tapi sebagai empat sayatan PANJANG DAN MIRING, bukan dua lubang
          bulat: sayatan miring tidak bisa terbaca sebagai mata, dan empat
          buah tidak bisa terbaca sebagai sepasang apa pun.
          Di 13 px keempat sayatan itu menutup (tebalnya 1,1 unit, jadi di
          bawah satu piksel) dan yang tersisa daun bulat mulus — kegagalan yang
          aman, karena bentuk luarnya tidak berubah jadi benda lain. */}
      <path
        d="M12 2.6C16.6 3.6 20 7 20 11C20 14 16.8 16.4 12 17.2C7.2 16.4 4 14 4 11C4 7 7.4 3.6 12 2.6z M13.4 6.4l4.4 2.2-.5 1.1-4.4-2.2z M13.4 11.2l4 2-.5 1.1-4-2z M10.6 6.4l-4.4 2.2.5 1.1 4.4-2.2z M10.6 11.2l-4 2 .5 1.1 4-2z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </>
  );
}

function KupuKupuGlyph(): JSX.Element {
  return (
    <>
      <g fill="currentColor">
        <ellipse cx="6.8" cy="9.2" rx="5.2" ry="4" transform="rotate(-18 6.8 9.2)" />
        <ellipse cx="17.2" cy="9.2" rx="5.2" ry="4" transform="rotate(18 17.2 9.2)" />
        <ellipse
          cx="8.4"
          cy="16.6"
          rx="3.6"
          ry="2.9"
          transform="rotate(22 8.4 16.6)"
          opacity="0.7"
        />
        <ellipse
          cx="15.6"
          cy="16.6"
          rx="3.6"
          ry="2.9"
          transform="rotate(-22 15.6 16.6)"
          opacity="0.7"
        />
      </g>
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M12 5.8v13.4" strokeWidth="1.9" />
        <path d="M12 5.8L9.4 2.6M12 5.8l2.6-3.2" strokeWidth="1.3" />
      </g>
    </>
  );
}

function MerakGlyph(): JSX.Element {
  return (
    <>
      {/* KENAPA TANGKAINYA TIPIS DAN LURUS
          Versi sebelumnya memakai tangkai TEBAL yang MELENGKUNG, dan hasilnya
          seluruh glyph terbaca sebagai BALON BERTALI — bulatan besar di ujung
          satu tali melengkung adalah definisi siluet balon, dan mata akan
          selalu memilih bacaan itu lebih dulu.
          Sirip di tangkainya juga yang membedakan glyph ini dari
          `DamaskGlyph`: keduanya lonjong berlapis, dan pada 13 px hanya
          tangkai bersirip inilah yang membuat yang satu terbaca bulu dan yang
          lain terbaca ornamen. Siripnya sendiri hilang di ukuran terkecil, dan
          memang tidak diandalkan di sana.
          ARAH SIRIPNYA PENTING: menghadap ke ATAS, ke arah mata bulu. Ketika
          sempat digambar menghadap ke bawah, hasilnya terbaca sebagai ANAK
          PANAH — sirip yang menghadap menjauhi ujung adalah bulu pengarah
          panah, bukan bulu burung. */}
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M12 22.4V12.6" strokeWidth="1.4" />
        <g strokeWidth="1" opacity="0.8">
          <path d="M12 15.8l-3.6-1.6M12 15.8l3.6-1.6M12 19l-3-1.6M12 19l3-1.6" />
        </g>
      </g>
      {/* Ocellus — mata bulu, tiga lapis sewarna dengan kepekatan berbeda. */}
      <ellipse
        cx="12"
        cy="7"
        rx="4.4"
        ry="5.4"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <ellipse cx="12" cy="7" rx="2.2" ry="2.9" fill="currentColor" fillOpacity="0.55" />
      <circle cx="12" cy="7" r="1.1" fill="currentColor" />
    </>
  );
}

function MerpatiGlyph(): JSX.Element {
  return (
    <>
      {/* Badan burung terbang: satu sapuan dari ekor di kiri ke kepala di
          kanan. Sayap terangkat digambar terpisah supaya siluetnya terbaca
          sebagai burung, bukan sebagai daun. */}
      <path
        d="M2.6 14.8c3.6-2.8 7.6-4.2 12-4.2 1.8 0 3.4.2 4.9.8-1.1 2.9-3.1 4.9-6 5.9-3.1 1.1-6.8.8-10.9-2.5z"
        fill="currentColor"
      />
      <path
        d="M11.2 11.4c.5-3.6 2.3-6.4 5.2-8.2-.4 3.1-.2 5.8.7 8.1z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <path
        d="M19.5 11.4l2.9-.6-2.7 1.8z"
        fill="currentColor"
      />
      {/* EKOR HARUS SEWARNA PENUH DAN MENUMPUK BADAN
          Versi sebelumnya menggambar ekor ini pada kepekatan 0,6 dan hanya
          menyentuh tepi badan di satu titik, jadi yang tampil bukan ekor
          melainkan SERPIHAN ABU-ABU yang melayang di bawah burungnya.
          Dua simpul segitiga ini sekarang berada di DALAM badan, dan
          kepekatannya penuh — jadi gabungannya jadi satu siluet bersambung
          tanpa sambungan yang terlihat. Sayap terangkat tetap 0,6 karena ia
          memang harus tampak di belakang badan, dan tumpukannya lebar. */}
      <path d="M8.4 17.2L1.6 20.4 3.2 14.6z" fill="currentColor" />
    </>
  );
}

function DamaskGlyph(): JSX.Element {
  return (
    <>
      <path
        d="M12 2c3.4 4.2 6 7.2 6 10.2 0 3.2-2.6 5.8-6 9.8-3.4-4-6-6.6-6-9.8C6 9.2 8.6 6.2 12 2z"
        fill="currentColor"
        fillOpacity="0.24"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <ellipse cx="12" cy="11.4" rx="2" ry="3.4" fill="currentColor" />
    </>
  );
}

function ArtDecoGlyph(): JSX.Element {
  return (
    <>
      <path
        d="M3.4 16.2a8.6 8.6 0 0 1 17.2 0z"
        fill="currentColor"
        fillOpacity="0.24"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.8">
        <path d="M12 16.2V7.6M12 16.2L6.4 11M12 16.2l5.6-5.2" />
      </g>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M4 19.2h16M7 22h10" />
      </g>
    </>
  );
}

/**
 * Songket: satu tumpal pekat di atas dua jalur benang.
 *
 * Tumpal sendirian hanyalah segitiga. Dua jalur benang di bawahnya yang
 * mengubahnya menjadi KAIN — dan pada ukuran 24 piksel itu satu-satunya
 * keterangan yang masih sempat terbaca.
 */
function SongketGlyph(): JSX.Element {
  return (
    <>
      <path d="M12 2.6l9 13.4H3z" fill="currentColor" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M3 19h18M6 22.2h12" />
      </g>
    </>
  );
}

/**
 * Patra Bali: satu sulur tunggal, segemuk yang bisa dimuat kanvas 24.
 *
 * MEMAKAI `PATRA_SCROLL` YANG SAMA dengan ubin dan crestnya. Menggambar ulang
 * sulurnya khusus untuk ukuran ini akan menghasilkan lekuk yang sedikit
 * berbeda, dan karena glyph sudut dan crest kadang tampil bersebelahan di satu
 * layar, perbedaan sedikit itu justru terbaca sebagai dua motif berbeda.
 *
 * `scale(1.05)` membesarkan `strokeWidth` 2,2 menjadi 2,31 — tebal yang
 * disengaja: sudut bingkai berukuran 24 piksel, dan garis setipis crest akan
 * lenyap di sana.
 */
function PatraBaliGlyph(): JSX.Element {
  return (
    <g transform="translate(1.6 3.27) scale(1.05)">
      <path
        d={PATRA_SCROLL}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="10.6" r="1.6" fill="currentColor" />
    </g>
  );
}

/** Girih: bintang delapan pekat, satu-satunya bentuk yang dibutuhkan. */
function GirihGlyph(): JSX.Element {
  return (
    <g transform="translate(12 12)">
      <path d={girihStar(10.6, 5.8)} fill="currentColor" />
    </g>
  );
}

/**
 * Mashrabiya: segi delapan bergaris tebal dengan wajik pekat di tengahnya.
 *
 * BIDANGNYA DIBIARKAN KOSONG, hanya bergaris. Kisi mashrabiya adalah kayu
 * BERLUBANG — lubangnya yang jadi ciri, dan segi delapan yang terisi penuh
 * justru terbaca sebagai perisai atau rambu lalu lintas.
 */
function MashrabiyaGlyph(): JSX.Element {
  return (
    <>
      <path
        d="M7.65 1.5H16.35L22.5 7.65V16.35L16.35 22.5H7.65L1.5 16.35V7.65z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M12 7.4L16.6 12 12 16.6 7.4 12z" fill="currentColor" />
    </>
  );
}

/**
 * Anggrek: satu bunga sebesar mungkin, dengan kelopak yang dipekatkan.
 *
 * `petalOpacity` dinaikkan dari 0,3 ke 0,55 di sini. Nilai 0,3 sudah benar
 * untuk ubin dan crest yang tampil pada bidang besar, tetapi di sudut bingkai
 * berukuran 24 piksel kelopak sesamar itu hilang sama sekali dan yang tersisa
 * hanya titik pekat lidah anggreknya — satu noktah, bukan bunga.
 *
 * `petalStroke` 1,7 ÷ skala 0,84 ≈ 1,43 — setebal glyph sudut lain, karena di
 * ukuran ini garis tepi kelopaklah yang menanggung seluruh bentuknya.
 */
/**
 * Anggrek: bunga anggrek simetri kiri-kanan, PEJAL.
 *
 * KENAPA TIDAK MEMAKAI `AnggrekBloom`
 * `AnggrekBloom` berkelopak tembus pandang karena di ubin dan crest ia memang
 * ditumpuk dengan tangkai dan daun. Dibawa apa adanya ke sudut, hasilnya
 * BUBUR ABU-ABU di 32 px: isian 0,55 dan garis tepi 1,7 melebur jadi satu
 * gumpalan bercincin, tidak terbaca sebagai bunga apa pun — dan kebetulan
 * mirip sekali dengan kamboja, yang dulu juga dibangun begitu. Dari 23 glyph,
 * hanya kedua inilah yang memakai isian tembus pandang; 21 sisanya pejat dan
 * semuanya terbaca. Jadi yang salah bukan ukurannya, melainkan caranya.
 *
 * YANG MEMISAHKAN KELOPAK DI SINI ADALAH JARAK, BUKAN GARIS TEPI
 * Semua bagian diisi penuh lalu disusun agar TIDAK bersentuhan — celah antar
 * kelopaklah yang menggambar batasnya. Garis tepi butuh dua warna untuk
 * terlihat, dan pada 32 px dua warna itu saling memakan; celah hanya butuh
 * satu warna dan tetap ada berapa pun kecilnya.
 *
 * Yang membuatnya terbaca anggrek dan bukan bunga bundar biasa adalah
 * susunannya yang BERCERMIN KIRI-KANAN — bukan berputar seperti sakura,
 * kamboja, dan melati — ditambah labellum (bibir) pejal di bawah tengah, satu
 * bagian yang tidak dimiliki bunga lain di katalog ini.
 */
function AnggrekGlyph(): JSX.Element {
  return (
    <g transform="translate(12 12.6) scale(0.8)" fill="currentColor">
      {/* sepal atas */}
      <ellipse cy="-9.4" rx="2.9" ry="4" />
      {/* kelopak samping — bagian terlebar anggrek */}
      <ellipse cx="-9.4" cy="-2" rx="4.8" ry="3.8" transform="rotate(-20 -9.4 -2)" />
      <ellipse cx="9.4" cy="-2" rx="4.8" ry="3.8" transform="rotate(20 9.4 -2)" />
      {/* sepal bawah */}
      <ellipse cx="-7" cy="7.4" rx="2.9" ry="3.8" transform="rotate(-30 -7 7.4)" />
      <ellipse cx="7" cy="7.4" rx="2.9" ry="3.8" transform="rotate(30 7 7.4)" />
      {/* labellum */}
      <path d="M0 -2.2c3 0 4.6 1.9 4.6 4.1 0 2.8-2.1 5.1-4.6 6.6-2.5-1.5-4.6-3.8-4.6-6.6 0-2.2 1.6-4.1 4.6-4.1z" />
    </g>
  );
}

/**
 * Kelopak kamboja versi glyph: bilah pejal yang MENYEMPIT SUDUTNYA.
 *
 * `KAMBOJA_PETAL` tidak bisa dipakai di sini. Kelopak itu selebar ±130° supaya
 * saling bertumpang tindih, dan tumpangan itulah yang digambarkan oleh garis
 * tepinya di ubin dan crest. Memperkecilnya dengan `scale()` tidak menolong:
 * penskalaan dari titik pusat mengecilkan jari-jari DAN lebar sudut secara
 * bersamaan, jadi kelopaknya tetap bertumpang tindih persis seperti semula,
 * hanya lebih kecil.
 *
 * Bilah ini lebarnya ±54°, sedangkan jaraknya 72° — menyisakan celah ±18° di
 * antara tiap pasangan. Celah itulah yang menggantikan garis tepi.
 *
 * Ujungnya tetap DIBELOKKAN KE SATU ARAH. Arah belok itu satu-satunya pembeda
 * kamboja dari sakura, yang kelopaknya bundar simetris; begitu bilahnya lurus
 * simetris, keduanya jadi bunga lima kelopak yang sama.
 */
const KAMBOJA_GLYPH_PETAL =
  "M0 -1C-3.2 -3.4 -4.6 -7.2 -3.4 -10.6-2.6 -13.2 0.4 -14.4 2.4 -12.8 4.4 -11.2 4.2 -7.4 2.6 -4.4 1.8 -2.8 0.8 -1.8 0 -1z";

/**
 * Kamboja: kincir lima bilah, PEJAL.
 *
 * Versi sebelumnya memakai isian 0,5 ditambah garis tepi 2,4, dan pada 32 px
 * keduanya melebur jadi gumpalan bercincin abu-abu yang nyaris tidak bisa
 * dibedakan dari glyph anggrek lama. Alasan lengkapnya ada di `AnggrekGlyph`.
 */
function KambojaGlyph(): JSX.Element {
  return (
    <g transform="translate(12 12) scale(0.78)" fill="currentColor">
      {FIVE_PETALS.map((angle) => (
        <path key={angle} d={KAMBOJA_GLYPH_PETAL} transform={`rotate(${angle})`} />
      ))}
      <circle r="2.6" />
    </g>
  );
}

/**
 * Dedaunan: satu ranting tegak dengan tiga pasang daun.
 *
 * TEGAK, bukan mendatar seperti di ubinnya, dan bukan melengkung seperti di
 * crestnya. Glyph sudut diputar mengikuti sudut bingkai yang ditempatinya
 * (lihat `MotifCornerGlyph`), jadi ranting yang punya arah tumbuh jelas akan
 * tampak tumbuh ke bawah di dua sudut bawah. Ranting tegak bersimetri kiri-kanan
 * adalah satu-satunya susunan yang masih benar setelah diputar ke arah mana pun.
 */
function DedaunanGlyph(): JSX.Element {
  return (
    <>
      <path
        d="M12 22.4V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g fill="currentColor">
        {[19, 14.4, 9.8].map((y) => (
          <g key={y}>
            <ellipse cx="7.4" cy={y} rx="2.3" ry="3.4" transform={`rotate(-28 7.4 ${y})`} />
            <ellipse cx="16.6" cy={y} rx="2.3" ry="3.4" transform={`rotate(28 16.6 ${y})`} />
          </g>
        ))}
        <ellipse cx="12" cy="5" rx="2.3" ry="3.6" />
      </g>
    </>
  );
}

/**
 * Renda: lekuk yang MENGGANTUNG DARI GARIS LURUS.
 *
 * Garis lurus di atasnya bukan hiasan — tanpanya deret setengah lingkaran ini
 * terbaca sebagai awan, dan awan tidak pernah punya tepi atas yang lurus.
 * Lubang-lubang di bawahnya menegaskan bahwa yang digambar adalah kain, bukan
 * deretan gelembung.
 */
function RendaGlyph(): JSX.Element {
  return (
    <g fill="none" stroke="currentColor">
      <path d="M2.4 7h19.2" strokeWidth="2.1" strokeLinecap="round" />
      <g fill="currentColor" stroke="none">
        {[2.4, 8.8, 15.2].map((x) => (
          <path key={x} d={`M${x} 7a3.2 3.2 0 0 0 6.4 0z`} />
        ))}
      </g>
      <g fill="currentColor" stroke="none" opacity="0.85">
        {[5.6, 12, 18.4].map((x) => (
          <circle key={x} cx={x} cy="14.6" r="1.4" />
        ))}
      </g>
      <path d="M4.6 19.4h14.8" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

const CORNER_GLYPHS: Record<MotifId, () => JSX.Element> = {
  kawung: KawungGlyph,
  parang: ParangGlyph,
  ceplok: CeplokGlyph,
  jlamprang: JlamprangGlyph,
  lasem: LasemGlyph,
  gunungan: GununganGlyph,
  "wayang-kulit": WayangKulitGlyph,
  songket: SongketGlyph,
  "patra-bali": PatraBaliGlyph,
  girih: GirihGlyph,
  mashrabiya: MashrabiyaGlyph,
  sakura: SakuraGlyph,
  melati: MelatiGlyph,
  monstera: MonsteraGlyph,
  anggrek: AnggrekGlyph,
  kamboja: KambojaGlyph,
  dedaunan: DedaunanGlyph,
  "kupu-kupu": KupuKupuGlyph,
  merak: MerakGlyph,
  merpati: MerpatiGlyph,
  damask: DamaskGlyph,
  "art-deco": ArtDecoGlyph,
  renda: RendaGlyph,
};

/**
 * Glyph motif untuk diselipkan ke dalam `<svg viewBox="0 0 64 64">` milik
 * `CornerFrame`.
 *
 * Mengembalikan `<g>`, BUKAN `<svg>`: sudut bingkai sudah punya SVG-nya
 * sendiri, dan menyarangkan SVG di dalam SVG akan memaksa viewport kedua yang
 * memotong glyph-nya.
 *
 * `spin` adalah rotasi yang sudah dikenakan pemanggil pada sudut tersebut
 * (0/90/180/270). Glyph diputar BALIK sebesar itu supaya tetap berdiri tegak
 * di keempat sudut — tanpa ini, merak di sudut kanan-bawah akan tampil
 * jungkir balik.
 */
export function MotifCornerGlyph({
  motif,
  spin = 0,
}: {
  motif: MotifId;
  spin?: 0 | 90 | 180 | 270;
}) {
  const Glyph = CORNER_GLYPHS[motif];

  return (
    // UKURAN & PUSAT INI DIUKUR, BUKAN DIKIRA-KIRA
    //
    // Semula kanvas 24 unit diperkecil ke 18 unit di pusat (30,30). Dirender
    // 1:1 ke piksel, itu ternyata gagal justru pada ukuran yang jadi alasan
    // glyph ini dibuat: di sudut `h-8` kotak 64 unit dipetakan ke 32 px, jadi
    // 18 unit hanya 9 px — setiap motif cuma jadi bintik. Sama saja dengan
    // crest yang runtuh, hanya bentuknya lebih sederhana.
    //
    // 26 unit (skala 1,1) di pusat (34,34) adalah yang terbesar yang masih
    // muat, dan pada 32 px menghasilkan 13 px yang terbaca. Batasnya bukan
    // kotak 64 unit itu, melainkan lengkung bingkai — dan yang mengikat adalah
    // LENGKUNG KEDUA milik VIP, bukan lengkung luarnya:
    //   floral dalam  r 53 dari (63,63) — tinta terjauh ke arah siku ±52  ✓
    //   floral luar   r 62 dari (63,63) — sudut kotak glyph 58,3          ✓
    //   arch dalam    r 20 dari (29,29) — sudut kotak glyph 11,6          ✓
    //   minimalist    r 13 dari (22,22) — sudut kotak glyph  1,7          ✓
    // Menaikkannya lagi membuat glyph memotong lengkung kedua.
    //
    // `translate` harus selalu `pusat - 12 * skala`, dan pivot rotasi harus
    // sama dengan pusatnya — kalau tidak, glyph bergeser saat diputar balik.
    <g transform={`rotate(${-spin} 34 34) translate(20.8 20.8) scale(1.1)`}>
      <Glyph />
    </g>
  );
}

