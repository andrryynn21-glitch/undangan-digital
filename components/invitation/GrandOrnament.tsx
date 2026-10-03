import type { JSX } from "react";

import type { MotifId } from "@/config/motifs";

/**
 * GRAND ORNAMEN — versi besar dan beranimasi dari setiap motif.
 *
 * KENAPA BERKAS INI ADA
 *
 * Tiga bentuk yang sudah ada di `Ornaments.tsx` semuanya KECIL: ubin 40px,
 * crest 20-56px, glyph sudut 24px. Klien yang memilih Batik Parang atau
 * Melati selama ini hanya melihat titik-titik kecil di sudut dan kabut
 * samar di latar — motifnya sendiri tidak pernah tampil sebagai gambar
 * yang bisa dibanggakan. Undangan referensinya justru sebaliknya: bouquet
 * bunga besar di sudut sampul, ornamen besar di tiap pergantian bagian,
 * dan garis emas yang menyusuri ornamen.
 *
 * Bentuk keempat ini menjawabnya: SATU komposisi besar per motif, digambar
 * di kanvas 200x200 supaya bisa dipakai dari 90px (pratinjau admin) sampai
 * 320px (sampul), lalu diberi gerak lewat kelas di `app/globals.css`:
 * `inv-grand-spin`, `inv-grand-sway`, `inv-grand-breathe`, `inv-grand-trace`.
 *
 * KENAPA GAMBARNYA DIGAMBAR LAGI, BUKAN MEMBESARIKAN CREST
 *
 * Crest dirancang untuk 20-56px: garisnya tebal supaya tidak hilang dan
 * komposisinya sesak supaya muat. Diperbesar ke 260px, ketebalan itu
 * berubah jadi goresan paling tebal sebesar seperlima lebar gambar
 * sementara detail halusnya lenyap — hasilnya bukan ornamen besar, tapi
 * lambang yang pecah. Grand ornamen karena itu digambar dengan proporsi
 * yang benar untuk ukuran besar: garis 1,6-2,4 unit di kanvas 200, dan
 * ruang kosong yang sengaja dibiarkan supaya silhuetnya tetap terbaca
 * saat diputar.
 *
 * SEMUA WARNA `currentColor`
 *
 * Sama seperti `Ornaments.tsx`: tidak ada warna yang di-hardcode di sini,
 * jadi grand ornamen otomatis mengikuti tema tanpa field baru di kontrak
 * `ThemeConfig`.
 */

/** Titik pusat kanvas 200x200 — semua bentuk di bawah revolves dari titik ini. */
const C = 100;

// ============================================
// Bentuk dasar yang dipakai bersama
// ============================================

/** Lingkaran penuh; boleh putus-putus untuk lapisan yang berputar. */
function ring(
  r: number,
  width = 2,
  opacity = 0.5,
  dash?: string
): JSX.Element {
  return (
    <circle
      cx={C}
      cy={C}
      r={r}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeOpacity={opacity}
      {...(dash ? { strokeDasharray: dash } : {})}
    />
  );
}

/**
 * Kipas jari-jari dari pusat, untuk motif yang berotasi (art-deco, damask).
 *
 * Digitinya dimulai di 12 o'clock lalu dibagi rata, jadi jumlah ganjil
 * selalu punya satu jari tegak di puncak: simetri yang terlihat "diam",
 * bukan tergeletak miring.
 */
function rays(
  count: number,
  r0: number,
  r1: number,
  width = 1.6,
  opacity = 0.45
): JSX.Element {
  const step = 360 / count;

  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap="round"
    >
      {Array.from({ length: count }, (_, i) => (
        <line
          key={i}
          x1={C}
          y1={C - r0}
          x2={C}
          y2={C - r1}
          transform={`rotate(${step * i} ${C} ${C})`}
        />
      ))}
    </g>
  );
}

/**
 * Roset kelopak: `count` kelopak mengelilingi pusat.
 *
 * Kelopak digambar di posisi atas lalu diputar, bukan dihitung dari
 * koordinat trigonometri — supaya jumlah kelopaknya bebas dan tidak ada
 * satu pun yang keluar dari pusat karena akurasi sinus.
 */
function rosette(
  count: number,
  length: number,
  width: number,
  strokeWidth = 1.8,
  opacity = 0.85
): JSX.Element {
  const step = 360 / count;

  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
    >
      {Array.from({ length: count }, (_, i) => (
        <ellipse
          key={i}
          cx={C}
          cy={C - length / 2}
          rx={width / 2}
          ry={length / 2}
          transform={`rotate(${step * i} ${C} ${C})`}
        />
      ))}
    </g>
  );
}

/** Titik pusat penuh — jantung bunga atau inti barred geometris. */
function core(r: number, opacity = 0.9): JSX.Element {
  return (
    <circle cx={C} cy={C} r={r} fill="currentColor" fillOpacity={opacity} />
  );
}

/**
 * Daun runcing dari pangkal (0,0) ke ujung (0,-len).
 *
 * Kedua sisinya sengaja tidak sama lebar. Daun yang simetris sempurna
 * terbaca seperti pil atau tombak, bukan seperti daun.
 */
function Leaf({
  x,
  y,
  rotate,
  len,
  wide,
  opacity = 0.55,
}: {
  x: number;
  y: number;
  rotate: number;
  len: number;
  wide: number;
  opacity?: number;
}): JSX.Element {
  return (
    <path
      d={`M0 0C${wide} ${-len * 0.36} ${wide * 0.55} ${-len * 0.78} 0 ${-len}C${-wide * 0.42} ${-len * 0.74} ${-wide * 0.86} ${-len * 0.34} 0 0Z`}
      transform={`translate(${x} ${y}) rotate(${rotate})`}
      fill="currentColor"
      fillOpacity={opacity}
    />
  );
}

/** Batang melengkung — dipakai untuk tangkai dan sulur. */
function stem(d: string, width = 1.8, opacity = 0.6): JSX.Element {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap="round"
    />
  );
}

/**
 * Bintang bersudut `points`, diselingi titik dalam radius `inner`.
 *
 * Dipakai motif geometris (girih, art-deco, mahkota damask). Bentuk ini
 * hanya berhasil kalau titik LUAR-nya benar-benar runcing: memperbesar
 * `inner` membuat ujungnya tumpul dan bacanya berubah dari bintang jadi
 * bintik.
 */
function star(points: number, outer: number, inner: number, opacity = 0.8): JSX.Element {
  const coords: string[] = [];

  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((180 / points) * i - 90) * (Math.PI / 180);
    coords.push(
      `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`
    );
  }

  return <path d={`M${coords.join("L")}Z`} fill="currentColor" fillOpacity={opacity} />;
}

/**
 * Cincin scallop (lekuk-lekuk) untuk medali renda.
 *
 * Titiknya ditulis di keliling lingkaran, lalu setiap ruas digambar sebagai
 * busur quadratic yang titik kontrolnya digeser ke luar sebesar `bulge`.
 * `bulge` negatif menghasilkan scallop cekung (kain renda), positif
 * menghasilkan tonjolan (paduan scalloped); mendekati nol hasilnya lingkaran
 * biasa, dan itu justru yang tidak boleh terjadi — keduanya tidak terbaca
 * sebagai kain renda.
 */
function scallopRing(r: number, count: number, bulge: number): string {
  const points = Array.from({ length: count }, (_, i) => {
    const a = (360 / count) * i;
    const rad = (a * Math.PI) / 180;
    return [C + r * Math.cos(rad), C + r * Math.sin(rad)] as const;
  });

  const seg = points
    .map(([x, y], i) => {
      const [nx, ny] = points[(i + 1) % count];
      const mx = (x + nx) / 2;
      const my = (y + ny) / 2;
      const len = Math.hypot(mx - C, my - C) || 1;
      const off = bulge / 2;
      return `Q${(mx + ((mx - C) / len) * off).toFixed(2)} ${(my + ((my - C) / len) * off).toFixed(2)} ${nx.toFixed(2)} ${ny.toFixed(2)}`;
    })
    .join("");

  return `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}${seg}Z`;
}

// ============================================
// Grand ornamen: batik
// ============================================

/**
 * KAWUNG: empat oval besar mengelilingi pusat, disambung mlinjon di sela.
 *
 * Di versi 40px yang terlihat hanya bentuk ovoidnya. Di 250px yang terbaca
 * justru JARAK antar oval dan kekosongan di antaranya — dan itu yang membuat
 * pola ini terbaca sebagai batik, bukan sebagai floral. Ovalnya karena itu
 * dibuat sebesar mungkin (±40 dari pusat) supaya ruang kosong di antaranya
 * ikut membentuk komposisi, bukan sekadar ruang kosong.
 */
function KawungGrand(): JSX.Element {
  return (
    <g>
      <g className="inv-grand-spin-slow">{ring(93, 1.2, 0.3, "1.5 7")}</g>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.85">
        <ellipse cx={C} cy={C - 40} rx="26" ry="44" />
        <ellipse cx={C} cy={C + 40} rx="26" ry="44" />
        <ellipse cx={C - 40} cy={C} rx="44" ry="26" />
        <ellipse cx={C + 40} cy={C} rx="44" ry="26" />
        <circle cx={C} cy={C} r="10" />
        <circle cx={C} cy={C} r="72" strokeOpacity="0.32" />
      </g>
      {/* Mlinjon — belah ketupat di sela oval, persis seperti pada kain. */}
      <g fill="currentColor" fillOpacity="0.4">
        <path d={`M${C} 52l12 12-12 12-12-12z`} />
        <path d={`M${C} 124l12 12-12 12-12-12z`} />
        <path d={`M52 ${C}l12 12-12 12-12-12z`} />
        <path d={`M124 ${C}l12 12-12 12-12-12z`} />
      </g>
      {core(4, 0.9)}
      <path
        d="M0 0L200 200M200 0L0 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeOpacity="0.28"
      />
    </g>
  );
}

/**
 * PARANG: lereng S yang mengalir diagonal, dengan mlinjon berhadapan.
 *
 * Yang membuat parang terbaca bukan tekukannya, tapi jarak antar lereng yang
 * selalu sama, dan arahnya tetap 45 derajat seperti kain aslinya.
 *
 * Ujungnya SENGAJA keluar kanvas. Lereng parang di kain bukan gambar yang
 * dibingkai — ia bagian dari kain yang terpotong tepi. Kalau ujungnya
 * dihentikan di dalam kanvas, bentuknya berubah jadi huruf S yang berdiri
 * sendiri, dan yang terbaca bukan lagi parang.
 *
 * Versi pertama salah besar di sini: kurvanya ditulis dari (-40,240) ke
 * (240,-60), sehingga seluruh lukisannya berada DI LUAR kotak 200x200 dan yang
 * tampil di layar hanya sisa ujungnya di satu sudut.
 */
function ParangGrand(): JSX.Element {
  // Salinan digeser tegak lurus terhadap arah lereng (bukan ke kanan), karena
  // hanya geser tegak lurus itu yang menjaga jarak antar lereng tetap sama.
  const band = (offset: number) =>
    `M${-10 + offset * 0.7} ${188 + offset}C${40 + offset * 0.7} ${
      150 + offset
    } ${64 + offset * 0.7} ${166 + offset} ${92 + offset * 0.7} ${
      116 + offset
    }S${148 + offset * 0.7} ${74 + offset} ${212 + offset * 0.7} ${
      24 + offset
    }`;

  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path d={band(0)} strokeWidth="3" strokeOpacity="0.9" />
      <path d={band(0)} strokeWidth="10" strokeOpacity="0.1" />
      <path d={band(-30)} strokeWidth="1.6" strokeOpacity="0.55" />
      <path d={band(-58)} strokeWidth="1.2" strokeOpacity="0.4" />
      <path d={band(30)} strokeWidth="1.6" strokeOpacity="0.55" />
      <path d={band(58)} strokeWidth="1.2" strokeOpacity="0.4" />
      <path d={band(-88)} strokeWidth="1" strokeOpacity="0.3" />
      <path d={band(88)} strokeWidth="1" strokeOpacity="0.3" />
      {ring(90, 1, 0.26)}
      {/* Mlinjon berhadapan di sela lereng — ciri parang yang paling kuat. */}
      <g fill="currentColor" fillOpacity="0.55" stroke="none">
        <path d={`M${C - 44} 116l15 15-15 15-15-15z`} />
        <path d={`M${C + 30} 60l15 15-15 15-15-15z`} />
      </g>
    </g>
  );
}


/**
 * CEPLOK: roset delapan petal (empat mata angin + empat diagonal).
 *
 * Kelopaknya memakai panjang 74 dari 200 — hampir separuh kanvas. Kalau
 * lebih pendek, delapan kelopaknya berubah menjadi titik-titik di dalam
 * cincin, dan Ceplok jadi indistinguishable dari motif lain yang kebetulan
 * memakai angka delapan juga.
 */
function CeplokGrand(): JSX.Element {
  return (
    <g>
      <g className="inv-grand-spin-slow">{ring(94, 1, 0.3, "2 8")}</g>
      {rosette(8, 74, 30, 2, 0.8)}
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.6">
        <circle cx={C} cy={C} r="36" />
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={i}
            cx={C + 52 * Math.cos(((45 * i - 90) * Math.PI) / 180)}
            cy={C + 52 * Math.sin(((45 * i - 90) * Math.PI) / 180)}
            r="5"
          />
        ))}
      </g>
      {core(12, 0.85)}
      {ring(80, 1, 0.28)}
    </g>
  );
}

/**
 * JLAMPRANG: tangga berjenjang yang saling mengunci, dicerminkan di sumbu
 * tegak.
 *
 * TANGKANYA SIKU-SIKU, BUKAN DIAGONAL. Versi pertama memiringkan setiap
 * jenjang supaya terbaca sebagai "tangga" — yang terjadi justru sebaliknya:
 * diagonal sekecil apa pun menghapus sudutnya, dan yang tersisa terbaca
 * sebagai garis-garis acak. Sudut 90 derajatlah yang membuat mata membaca
 * "naik" dan "turun".
 *
 * Sepasang tangga yang SALING MENYUSUP: yang satu naik dari bawah ke kiri,
 * yang satu turun dari atas ke kanan. Kalau keduanya sama-sama naik dari
 * pangkal yang sama, hasilnya bukan jlamprang melainkan piramida — persis
 * bentuk yang terlihat pada versi pertama.
 */
function JlamprangGrand(): JSX.Element {
  // Satu pita tangga: berjalan ke KANAN sambil naik, dari pojok kiri-bawah.
  // Pita kedua dicerminkan terhadap sumbu tegak — jadi berjalan ke KIRI sambil
  // naik. Keduanya tetap naik: yang kedua tidak dicerminkan secara vertikal.
  //
  // Versi pertama mencerminkan arah vertikal juga, sehingga pita kedua
  // berjalan ke kiri sambil TURUN dan langsung keluar kanvas di bawah —
  // yang tampil hanyalah satu pita dan sisa-sisa ujungnya di tepi bawah.
  const ribbon = (dir: 1 | -1) =>
    [0, 1, 2, 3]
      .map(() => `h${32 * dir}v-26`)
      .join("");

  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path
        d={`M${C - 70} ${C + 70}${ribbon(1)}`}
        strokeWidth="2.6"
        strokeOpacity="0.9"
      />
      <path
        d={`M${C + 70} ${C + 70}${ribbon(-1)}`}
        strokeWidth="2.6"
        strokeOpacity="0.9"
      />
      {/* Anak tangga pengisi di sela pita, lebih samar. */}
      <g strokeWidth="1.1" strokeOpacity="0.38">
        {[0, 1, 2, 3].map((i) => (
          <path
            key={`a${i}`}
            d={`M${C - 70 + i * 32} ${C + 44}v-22M${C + 70 - i * 32} ${C + 44}v-22`}
          />
        ))}
      </g>
      {ring(92, 1, 0.24, "3 6")}
      <g className="inv-grand-spin-slow" fill="currentColor" fillOpacity="0.45">
        <path d={`M${C} 74l10 10-10 10-10-10z`} />
        <path d={`M${C} 98l10 10-10 10-10-10z`} />
      </g>
    </g>
  );
}

/**
 * LASEM: kuncup bunga bertingkat, motif khas pesisir Jawa.
 *
 * Bentuk inilah yang membedakan Lasem dari Ceplok: Ceplok simetris
 * mengelilingi pusat, Lasem bertumpuk ke ATAS. Grand versinya memakai tiga
 * kuncup yang mengecil ke atas, ditopang dua sulur dari pangkal.
 */
function LasemGrand(): JSX.Element {
  const bud = (y: number, r: number, opacity: number) => (
    <g key={y}>
      <path
        d={`M${C} ${y - r * 1.5}c${r * 0.9} ${r * 0.7} ${r * 0.9} ${r * 1.2} 0 ${
          r * 2
        }c${-r * 0.9} ${-r * 0.8} ${-r * 0.9} ${-r * 1.3} 0 ${-r * 2}z`}
        fill="currentColor"
        fillOpacity={opacity * 0.4}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity={opacity}
      />
      <path
        d={`M${C} ${y + r * 0.4}v${r}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity={opacity * 0.7}
      />
    </g>
  );

  return (
    <g>
      {stem(`M${C} 190C${C - 10} 154 ${C + 8} 132 ${C} 100`, 2, 0.5)}
      {stem(`M${C} 176C${C + 26} 152 ${C + 36} 130 ${C + 22} 108`, 1.4, 0.35)}
      {<Leaf x={C - 4} y={170} rotate={-48} len={34} wide={13} opacity={0.35} />}
      {<Leaf x={C + 8} y={152} rotate={54} len={30} wide={11} opacity={0.3} />}
      {bud(152, 26, 0.9)}
      {bud(114, 19, 0.8)}
      {bud(84, 13, 0.7)}
      {core(5, 0.9)}
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.3">
        <path d={`M${C - 42} 192C${C - 22} 178 ${C - 28} 152 ${C - 46} 142`} />
        <path d={`M${C + 42} 192C${C + 22} 178 ${C + 28} 152 ${C + 46} 142`} />
      </g>
    </g>
  );
}


// ============================================
// Grand ornamen: wayang
// ============================================

/**
 * GUNUNGAN: kayon yang membelah layar, dengan petir di kedua sisinya.
 *
 * Bentuk kayon di sini bukan segitiga. Yang membuatnya terbaca sebagai
 * gunungan adalah tiga hal sekaligus: puncak LANCIP di atas, sisi cembung
 * yang melebar ke bawah, dan dasar rata yang lebar. Hilangkan salah satu,
 * dan yang tersisa akan terbaca sebagai air mata atau lampion.
 *
 * Kayon digambar memakai ATURAN LANGKUNG DUA TITIK (Q) yang disambung,
 * bukan kurva Bézier panjang, karena titik beloknya itulah yang membuat
 * sisinya berdenyut — persis tepi gunungan wayang yang bergerigi.
 */
function GununganGrand(): JSX.Element {
  return (
    <g>
      <path
        d="M100 8C126 34 150 52 164 78c12 22 16 44 14 64-2 24-14 40-32 48H54c-18-8-30-24-32-48-2-20 2-42 14-64 14-26 38-44 64-70z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M100 8C126 34 150 52 164 78c12 22 16 44 14 64-2 24-14 40-32 48H54c-18-8-30-24-32-48-2-20 2-42 14-64 14-26 38-44 64-70z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeOpacity="0.9"
      />
      {/* Pohon hayat di dalam kayon: batang tegak + tiga helai daun. */}
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.75">
        <path d="M100 186V96" />
        <path d="M100 140c-14-4-22-14-24-28 14 2 22 10 24 28z" />
        <path d="M100 140c14-4 22-14 24-28-14 2-22 10-24 28z" />
        <path d="M100 116c-12-4-18-12-20-24 12 2 18 8 20 24z" />
        <path d="M100 116c12-4 18-12 20-24-12 2-18 8-20 24z" />
      </g>
      {star(6, 22, 8, 0.5)}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.45"
      >
        <path d="M62 56c10 8 16 20 18 34" />
        <path d="M138 56c-10 8-16 20-18 34" />
      </g>
      {core(4, 0.8)}
    </g>
  );
}

/**
 * WAYANG KULIT: gunungan dengan tokoh pipih di dalamnya.
 *
 * Tokohnya digambar sebagai siluet — bahu lebar, lengan mencangkuk,
 * kaki bersilang — karena di wayang kulit yang penting justru posturnya,
 * bukan wajahnya. Wajah di detail 3px tidak akan pernah terbaca, tapi
 * siluet lengan yang mencangkuk terbaca dari jauh.
 */
function WayangKulitGrand(): JSX.Element {
  return (
    <g>
      <g className="inv-grand-spin-slow">{ring(92, 1, 0.25, "2 9")}</g>
      <g
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        {/* Siluet tokoh: dibuat sebagai satu path tertutup agar tidak ada
            celah putih di sambungan tangannya. */}
        <path d="M100 60c9 0 15 7 15 16 0 6-2 11-6 15l16 10c8 5 13 14 13 24v18l14 10v10l-16-6v22h-14l-8-26h-14l-8 26H78v-22l-16 6v-10l14-10v-18c0-10 5-19 13-24l16-10c-4-4-6-9-6-15 0-9 6-16 15-16z" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.55">
        <path d="M100 88v34" />
        <path d="M78 148c8 6 36 6 44 0" />
        <path d="M62 60c-16 10-26 26-30 46" />
        <path d="M138 60c16 10 26 26 30 46" />
      </g>
      {star(6, 20, 7, 0.6)}
      {core(3, 0.85)}
    </g>
  );
}

// ============================================
// Grand ornamen: nusantara
// ============================================

/**
 * SONGKET: belah ketupat besar bertumpuk dengan rumbai di ujungnya.
 *
 * Yang membedakan songket dari pola geometris lain adalah rumbai: tiga
 * untai lurus yang keluar dari ujung bawah belah ketupat. Tanpa rumbai,
 * motif ini hanya terbaca sebagai wajik — dan wajik sudah dipakai Ceplok.
 */
function SongketGrand(): JSX.Element {
  return (
    <g>
      {star(4, 84, 8, 0.1)}
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.85">
        <path d="M100 14L186 100 100 186 14 100z" />
        <path d="M100 46L154 100 100 154 46 100z" strokeOpacity="0.6" />
        <path d="M100 78L122 100 100 122 78 100z" strokeOpacity="0.4" />
      </g>
      {/* Benang rumbai: tiga untai dari ujung bawah, ditambah simpul. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.5"
        strokeLinecap="round"
      >
        <path d="M86 180c0 8-6 10-6 16" />
        <path d="M100 186v14" />
        <path d="M114 180c0 8 6 10 6 16" />
      </g>
      <g fill="currentColor" fillOpacity="0.45">
        <circle cx="80" cy="197" r="2.5" />
        <circle cx="100" cy="202" r="2.5" />
        <circle cx="120" cy="197" r="2.5" />
      </g>
      {core(4, 0.9)}
    </g>
  );
}

/**
 * PATRA BALI: sulur ganda yang saling mengunci, seperti scroll awan.
 *
 * Sulurnya digambar sebagai dua busur yang bertemu di tengah lalu kembali
 * ke pangkal, persis likaran patra pada ukiran gerbang Bali. Yang membuatnya
 * terbaca bukan ujung spiralnya, melainkan fakta bahwa kedua busur itu tidak
 * pernah terpisah: ruang di antaranya tetap terbuka, seperti pada sulur
 * aslinya.
 */
function PatraBaliGrand(): JSX.Element {
  const scroll = (flip: boolean) => (
    <path
      key={flip ? "r" : "l"}
      d="M100 100C100 62 68 40 40 44c-24 4-30 34-14 46 12 9 26 1 22-10-3-7-13-8-16-2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeOpacity="0.85"
      transform={flip ? "rotate(180 100 100)" : undefined}
    />
  );

  return (
    <g>
      {scroll(false)}
      {scroll(true)}
      {ring(88, 1, 0.28)}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeOpacity="0.4"
      >
        <path d="M100 100C100 76 116 62 132 56" />
        <path d="M100 100C100 124 84 138 68 144" />
      </g>
      {core(5, 0.9)}
    </g>
  );
}


// ============================================
// Grand ornamen: islami
// ============================================

/**
 * GIRIH: bintang delapan di dalam kerangka oktagon, dengan cincin bintang
 * kecil yang berputar perlahan.
 *
 * Yang membuat motif ini terbaca sebagai girih dan bukan sebagai bintang
 * biasa adalah TIGA hal sekaligus: bintang di tengah, oktagon di
 * sekelilingnya, dan garis penghubung antar ujungnya. Hilangkan salah satu,
 * sisanya akan terbaca sebagai lambang — bukan sebagai pola bintang.
 */
function GirihGrand(): JSX.Element {
  return (
    <g>
      {star(8, 84, 44, 0.12)}
      {star(8, 62, 34, 0.28)}
      {star(8, 34, 18, 0.55)}
      <path
        d="M100 22l54 31v62l-54 31-54-31V53z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeOpacity="0.8"
      />
      <g className="inv-grand-spin-slow">{star(8, 12, 5, 0.8)}</g>
    </g>
  );
}

/**
 * MASHRABIYA: kisi bintang delapan di dalam segi delapan, berulang empat
 * kali dalam satu bidang.
 *
 * Pengulangan itulah yang membedakan mashrabiya dari girih: girih punya
 * SATU bintang besar di tengah, mashrabiya punya empat sel kecil yang
 * saling bersinggungan. Kalau hanya satu sel, hasilnya bukan lagi kisi.
 */
function MashrabiyaGrand(): JSX.Element {
  // Sel ditaruh di DALAM oktagon dalam, bukan di sekitar titik (100,100).
  //
  // Dua kesalahan versi pertama, keduanya soal transform dan keduanya
  // menghasilkan sel yang melayang di luar kusen:
  //
  //  1. `translate(x, y)` mentah, padahal `star()` menggambar selnya di titik
  //     (100,100) — jadi setiap sel bergeser sebesar dirinya sendiri.
  //  2. `translate(...) scale(...)` digabung dalam satu atribut. Dalam SVG
  //     transform ditulis dari KANAN ke KIRI, jadi `translate(a) scale(s)`
  //     berarti "skalakan dulu, baru geser" — dan karena geserannya ikut
  //     terskalakan, pilihan posisinya meleset lagi.
  //
  // Yang benar: satu grup per translate, grup di dalamnya untuk scale, lalu
  // `translate(-C,-C)` untuk memindahkan titik gambar ke titik asal lokal.
  const cell = (x: number, y: number, s: number) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
      <g transform={`scale(${s})`}>
        <g transform={`translate(${-C} ${-C})`}>{star(8, 34, 15, 0.55)}</g>
      </g>
    </g>
  );

  return (
    <g>
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeOpacity="0.8">
        <path d="M100 18l57 33v66l-57 33-57-33V51z" />
        <path d="M100 32l45 26v52l-45 26-45-26V58z" strokeOpacity="0.4" />
      </g>
      {cell(100, 62, 0.66)}
      {cell(76, 84, 0.56)}
      {cell(124, 84, 0.56)}
      {cell(100, 106, 0.56)}
      {cell(100, 84, 0.26)}
      <g className="inv-grand-spin-slow">{ring(92, 0.9, 0.22, "1 9")}</g>
    </g>
  );
}


// ============================================
// Grand ornamen: flora
// ============================================

/**
 * Satu kelopak sakura: lebar di tengah, dengan takik di ujung pangkal.
 *
 * Takik itu yang membedakan kelopak sakura dari kelopak melati. Tanpa
 * takik, lima kelopak simetris akan selalu terbaca sebagai bunga generik.
 */
function sakuraPetal(): JSX.Element {
  return (
    <path
      d="M100 40c17 9 27 23 27 39 0 12-6 21-15 23-4 1-8-1-12-4-4 3-8 5-12 4-9-2-15-11-15-23 0-16 10-30 27-39z"
      fill="currentColor"
      fillOpacity="0.28"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  );
}

/**
 * SAKURA: lima kelopak berujung robek, melayang di atas tangkai.
 *
 * Tata letaknya disengaja tidak simetris penuh: tangkai masuk dari bawah
 * dan condong ke kiri, sementara kelopaknya tetap simetris. 바로
 * ketidaksimetrian itulah yang membuat komposisinya terbaca sebagai bouquet
 * yang dipetik, bukan sebagai mandala geometris.
 */
function SakuraGrand(): JSX.Element {
  return (
    <g>
      {stem("M100 192C92 168 108 152 100 130", 2, 0.5)}
      {<Leaf x={94} y={170} rotate={-58} len={32} wide={12} opacity={0.32} />}
      {<Leaf x={106} y={156} rotate={60} len={28} wide={10} opacity={0.28} />}
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a} ${C} ${C})`}>
          {sakuraPetal()}
        </g>
      ))}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.7"
      >
        {Array.from({ length: 10 }, (_, i) => {
          const a = ((360 / 10) * i) * (Math.PI / 180);
          return (
            <line
              key={i}
              x1={C}
              y1={C - 4}
              x2={C + 20 * Math.cos(a)}
              y2={C - 4 + 20 * Math.sin(a)}
            />
          );
        })}
      </g>
      {core(5, 0.9)}
    </g>
  );
}

/** Melati: kelopak runcing, ramping, dengan pangkalnya menyempit. */
function melatiPetal(): JSX.Element {
  return (
    <path
      d="M100 40c4 15 4 28 0 40-4-12-4-25 0-40z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  );
}

/**
 * MELATI: dua lapis kelopak lima yang SELANG-SELING 36 derajat.
 *
 * Dua roset segaris akan terlihat seperti satu roset saja; geseran
 * setengah sudut itulah yang membuat mata membaca dua lapis, dan itulah
 * pembeda melati dari melati tunggal pada kartu waar.
 */
function MelatiGrand(): JSX.Element {
  return (
    <g>
      {stem("M100 194v-42", 2, 0.5)}
      {<Leaf x={100} y={172} rotate={-50} len={30} wide={11} opacity={0.3} />}
      {<Leaf x={100} y={158} rotate={52} len={26} wide={10} opacity={0.26} />}
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a} ${C} ${C})`}>
          {melatiPetal()}
        </g>
      ))}
      {[36, 108, 180, 252, 324].map((a) => (
        <g key={a} transform={`rotate(${a} ${C} ${C})`}>
          {melatiPetal()}
        </g>
      ))}
      {ring(21, 1.4, 0.6)}
      {core(4, 0.9)}
    </g>
  );
}

/**
 * MONSTERA: tiga helai daun dengan belahan tepi yang memanjang.
 *
 * Belahannya digambar sebagai celah yang memotong tepi, bukan sebagai
 * lubang tertutup di tengah. Pada ukuran besar keduanya terbaca hampir sama,
 * tapi hanya belahan tepi yang menghasilkan siluet daun monstera yang
 * benar: tepi yang sudah terbelah, bukan daun berlubang.
 */
function MonsteraGrand(): JSX.Element {
  const leafShape = (rotate: number, scale: number) => (
    <g transform={`rotate(${rotate} ${C} ${C}) scale(${scale})`}>
      <path
        d="M100 18c33 12 52 43 52 82 0 33-15 57-38 71h-28c-23-14-38-38-38-71 0-39 19-70 52-82z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M100 20v150M100 66c-15 3-26 12-32 27M100 108c-17 3-29 12-35 28M100 66c15 3 26 12 32 27M100 108c17 3 29 12 35 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeOpacity="0.55"
      />
    </g>
  );

  return (
    <g>
      {stem("M100 194c-4-20 4-32 0-48", 2, 0.45)}
      {leafShape(-34, 0.78)}
      {leafShape(34, 0.78)}
      {leafShape(0, 1)}
    </g>
  );
}

/**
 * ANGGREK: satu bunga besar, satu bunga kecil, dan sebuah kuncup di tangkai.
 *
 * Kelopaknya lima tapi tidak sama: tiga kelopak lebar dan dua kelopak
 * menyempit. Persis perbedaan inilah yang membuat anggrek terbaca sebagai
 * anggrek dan bukan sebagai melati yang kebetulan digambar besar.
 */
function AnggrekGrand(): JSX.Element {
  const bloom = (x: number, y: number, s: number, o: number) => (
    <g
      key={`${x}-${y}`}
      transform={`translate(${x} ${y}) scale(${s})`}
      opacity={o}
    >
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a} 0 0)`}>
          <path
            d="M0 0c10-10 22-30 22-44 0-12-10-18-22-18s-22 6-22 18c0 14 12 34 22 44z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </g>
      ))}
      <path
        d="M-9 0c6-8 12-8 18 0-6 8-12 8-18 0z"
        fill="currentColor"
        fillOpacity="0.7"
      />
    </g>
  );

  return (
    <g>
      {stem("M22 192C56 172 60 140 56 114", 2.2, 0.5)}
      {stem("M54 192C74 176 84 158 86 140", 1.6, 0.4)}
      {<Leaf x={44} y={180} rotate={-62} len={34} wide={12} opacity={0.3} />}
      {<Leaf x={28} y={174} rotate={58} len={28} wide={10} opacity={0.26} />}
      {bloom(56, 94, 0.82, 0.95)}
      {bloom(98, 136, 0.5, 0.8)}
      <ellipse
        cx="114"
        cy="120"
        rx="9"
        ry="13"
        transform="rotate(30 114 120)"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </g>
  );
}

/**
 * KAMBOJA: bunga jepun utuh di ujung tangkai panjang.
 *
 * Ujung kelopaknya TUMPUL, bukan runcing seperti melati atau anggrek.
 * Tumpul itulah yang membuat kamboja terbaca sebagai jepun yang baru
 * dipetik, bukan sebagai bunga aster.
 */
function KambojaGrand(): JSX.Element {
  const petal = (a: number) => (
    <path
      key={a}
      d="M100 96c-14-22-18-42-8-56 8-11 22-13 32-6 10 7 12 20 6 30-8 14-20 24-30 32z"
      transform={`rotate(${a} ${C} ${C})`}
      fill="currentColor"
      fillOpacity="0.24"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  );

  return (
    <g>
      {stem("M100 194C96 160 104 138 100 108", 2.2, 0.5)}
      {<Leaf x={98} y={170} rotate={-56} len={34} wide={13} opacity={0.3} />}
      {<Leaf x={102} y={148} rotate={58} len={28} wide={11} opacity={0.26} />}
      {[0, 72, 144, 216, 288].map(petal)}
      {ring(15, 1.2, 0.5)}
      {core(7, 0.85)}
    </g>
  );
}

/**
 * DEDAUNAN: sepasang ranting eucalyptus yang bertemu di pangkal.
 *
 * Daunnya bulat dan DIPASANG BERPASANGAN di sepanjang batang. Kombinasi
 * bulat + berpasangan itulah yang membedakannya dari dedaunan bergaya umum:
 * daun tunggal di ujung batang saja akan terbaca sebagai pacaran.
 *
 * POSISI DAUN DIHITUNG, BUKAN DITULIS TANGAN. Versi pertama menaruh daun di
 * koordinat tetap sementara rantingnya diputar 30 derajat di sekitar pangkal
 * — sehingga setelah diputar, daun-daunnya tidak lagi menempel pada batang,
 * tapi menumpuk di dekat titik potong. Yang tampil bukan ranting, tapi gumpalan
 * oval. Di sini titik daun dihitung dari garis batang lalu digeser tegak lurus
 * ke sisinya, jadi berapa pun rantingnya ditekuk, daunnya tetap menempel.
 */
function DedaunanGrand(): JSX.Element {
  const sprig = (dir: 1 | -1) => {
    // Batang dari pangkal (100,192) ke ujung (100 + dir*46, 96).
    const ax = 100;
    const ay = 192;
    const bx = 100 + dir * 46;
    const by = 96;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    // Tegak lurus terhadap batang; dipakai untuk menaruh daun di kiri/kanan.
    const px = -dy / len;
    const py = dx / len;

    return (
      <g key={dir}>
        <path
          d={`M${ax} ${ay}C${ax + dx * 0.25 + dir * 6} ${ay + dy * 0.35} ${
            ax + dx * 0.7 - dir * 6
          } ${ay + dy * 0.7} ${bx} ${by}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        {[0.18, 0.42, 0.64, 0.84].map((t, i) =>
          [1, -1].map((side) => {
            const t2 = t + (side > 0 ? 0.05 : -0.05);
            const x = ax + dx * t2 + px * side * 13;
            const y = ay + dy * t2 + py * side * 13;
            const tilt = (Math.atan2(py * side, px * side) * 180) / Math.PI;
            return (
              <ellipse
                key={`${i}-${side}`}
                cx={x}
                cy={y}
                rx="12"
                ry="7"
                fill="currentColor"
                fillOpacity="0.32"
                transform={`rotate(${tilt} ${x} ${y})`}
              />
            );
          })
        )}
      </g>
    );
  };

  return (
    <g>
      {sprig(1)}
      {sprig(-1)}
      {stem("M100 194v-18", 2.2, 0.55)}
      {core(4, 0.8)}
    </g>
  );
}
// ============================================
// Grand ornamen: fauna
// ============================================

/**
 * KUPU-KUPU: sayap atas lebar dengan bintik mata, sayap bawah kecil.
 *
 * Perbandingan ukuran sayap atas dan bawah itu disengaja, bukan sekadar
 * pilihan gaya: kupu-kupu yang kedua sayangnya sama besar terbaca sebagai
 * kupu-kupu PAPER, bukan kupu-kupu. Yang membuat terbaca kupu-kupu sungguhan
 * adalah sayap ATAS yang lebar dan memanjang ke belakang.
 */
function KupuKupuGrand(): JSX.Element {
  const wing = (flip: boolean) => (
    <g key={flip ? "r" : "l"} transform={flip ? "scale(-1 1) translate(-200 0)" : undefined}>
      <path
        d="M100 84C74 62 40 58 24 74c-16 16-10 42 8 50 12 5 24 2 34-6l34-24z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M100 112c-20 6-38 26-34 42 3 12 15 16 26 11 14-6 24-20 30-34l-8-19z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="52" cy="88" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.7" />
      <circle cx="52" cy="88" r="2.6" fill="currentColor" fillOpacity="0.8" />
    </g>
  );

  return (
    <g>
      {wing(false)}
      {wing(true)}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <path d="M100 76v72" />
        <path d="M100 76c-6-12-14-18-22-22" />
        <path d="M100 76c6-12 14-18 22-22" />
      </g>
      {core(4, 0.9)}
      <ellipse
        cx="100"
        cy="110"
        rx="5"
        ry="26"
        fill="currentColor"
        fillOpacity="0.5"
      />
    </g>
  );
}

/**
 * MERAK: kipas ekor dengan tujuh bulu, masing-masing berujung mata.
 *
 * BULU HARUS LEBAR DI PANGKAL, LANCIP DI UJUNG — kebalikannya.
 *
 * Versi pertama menggambar bulu sebagai dua garis lurus yang bertemu di ujung
 * (lebar 0 di pangkal, 0 di ujung, hanya sedikit melebar di tengah). Hasilnya
 * sepasang lolipop, bukan bulu merak — dan yang membedakan keduanya adalah
 * luasnya: bulu merak lebar di pangkal dan menyempit ke arah mata di ujung.
 *
 * Mata di ujung bulu juga diperkecil (r 3,5 dari 8). Versi pertama memakai
 * ellipse 8x11 yang hanya diberi titik di tengah, dan pada ukuran 250px
 * ellips itulah yang jadi bentuk utama — matanya sendiri menghilang di dalam
 * isian gelap. Dua lingkaran berjejal (cincin luar + titik dalam) terbaca
 * sebagai "mata" di ukuran apa pun.
 */
function MerakGrand(): JSX.Element {
  const angles = [-56, -38, -19, 0, 19, 38, 56];

  return (
    <g>
      {angles.map((a) => (
        <g key={a} transform={`rotate(${a} ${C} 152)`}>
          {/* Bulu: lebar 26 di pangkal, menyempit ke ujung di y 44. Isiannya 0,22 —
              bukan 0,13 seperti versi pertama: pada garis tepi setipis itu
              badan bulu nyaris tak terlihat, dan yang tersisa hanyalah
              lingkaran mata — sepasang lolipop. */}
          <path
            d="M87 152c-4-30 1-58 6-76 3-11 5-20 7-32 2 12 4 21 7 32 5 18 10 46 6 76z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle
            cx="100"
            cy="42"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeOpacity="0.85"
          />
          <circle cx="100" cy="42" r="2.4" fill="currentColor" fillOpacity="0.9" />
        </g>
      ))}
      {/* Badan merak: leher dan kaki menjulang ke bawah dari pangkal kipas. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M100 152v26c0 8-4 14-10 18" />
        <path d="M100 160c-12 4-20 12-22 24" />
      </g>
      <ellipse
        cx="100"
        cy="156"
        rx="12"
        ry="9"
        fill="currentColor"
        fillOpacity="0.25"
      />
      {core(4, 0.9)}
    </g>
  );
}

/**
 * MERPATI: burung terbang dengan sayap terlentang dan ranting zaitun.
 *
 * YANG MEMBUATNYA TERBACA MERPATI BUKAN BADANNYA, TAPI LEHERNYA.
 *
 * Versi pertama memakai satu path tertutup untuk badan, leher, dan kepala —
 * dan setelah dirender, bentuknya terbaca sebagai angsa: lehernya pendek dan
 * tebal, kepala menyatu ke badan tanpa lekukan. Pada merpati, berapa pun
 * dipotong, selalu ada lekukan antara kepala dan badan; lekukan itulah yang
 * membedakannya dari semua burung lain, dan itulah yang hilang saat keduanya
 * digambar sebagai satu siluet.
 *
 * Karena itu badan, leher, dan kepala digambar sebagai tiga bagian terpisah
 * yang saling menyentuh di ujungnya — persis seperti cara gambar merpati
 * biasa bekerja.
 */
function MerpatiGrand(): JSX.Element {
  return (
    <g>
      {/* Badan: bulat lonjong, miring ke kiri bawah. */}
      <path
        d="M56 150c-16-6-26-24-24-44 3-26 28-46 60-46 24 0 44 10 54 28l-30 16c-8 14-24 22-42 22-8 0-14 4-18 24z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Badan + sayap terlentang, ujungnya runcing ke kiri bawah. */}
        <path d="M56 150c-16-6-26-24-24-44 3-26 28-46 60-46 24 0 44 10 54 28" />
        <path d="M96 84c22 2 42 18 48 40-22 8-46 4-58-12" />
        {/* Ekor: tiga bulu memanjang ke kiri bawah. */}
        <path d="M60 142L24 164M64 154L36 186M72 162L54 194" />
        {/* Leher S dan kepala, dengan lekukan di antara keduanya. */}
        <path d="M140 64c10 4 18 16 16 28-2 12-12 20-24 20" />
        <circle cx="136" cy="58" r="15" />
        {/* Paruh ke kanan. */}
        <path d="M150 52l20 6-19 8" />
      </g>
      <circle cx="141" cy="54" r="2.4" fill="currentColor" fillOpacity="0.9" />
      {/* Ranting zaitun kecil di kaki — atribut merpatinya. */}
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.55">
        <path d="M96 176c16 6 26 16 30 30" />
        <ellipse cx="116" cy="192" rx="11" ry="5" transform="rotate(-30 116 192)" />
        <ellipse cx="132" cy="182" rx="9" ry="4.4" transform="rotate(-16 132 182)" />
      </g>
    </g>
  );
}
// ============================================
// Grand ornamen: luxury
// ============================================

/**
 * DAMASK: ogee bertingkat yang saling mengunci, dililingi kipas logam.
 *
 * Bentuk ogee (bentuk S yang ujungnya runcing) adalah tanda damask yang
 * paling bisa diidentifikasi. Yang membuat motif ini terbaca sebagai kain
 * dan bukan sebagai hiasan plain adalah PENUMPINGAN ogee di tiga tingkat:
 * satu ogee besar di luar, satu di tengah, satu di dalam — semuanya memakai
 * jalur yang sama persis, hanya berbeda skala.
 */
function DamaskGrand(): JSX.Element {
  // Ogee digambar sebagai SILUET TERTUTUP, bukan garis S tunggal. Versi
  // pertama hanya meng-stroke satu jalur sempit, dan hasilnya — setelah
  // dirender — terbaca sebagai NYALA LILIN, bukan damask: bagian tengahnya
  // setipis garis dan tidak ada badan yang bisa menahan bentuk.
  //
  // Bentuk yang dikenali sebagai damask justru berbadan: ujung atas runcing,
  // pinggang menyempit di tengah, dasar melebar kembali.
  const ogee = (scale: number, opacity: number, fill: number) => (
    <g
      key={scale}
      transform={`translate(${C} ${C}) scale(${scale}) translate(${-C} ${-C})`}
    >
      <path
        d="M100 14c26 30 50 54 50 80 0 20-14 32-33 36 15 8 22 23 18 39-4 15-19 25-35 33-16-8-31-18-35-33-4-16 3-31 18-39-19-4-33-16-33-36 0-26 24-50 50-80z"
        fill="currentColor"
        fillOpacity={fill}
        stroke="currentColor"
        strokeWidth={2 / scale}
        strokeLinejoin="round"
        strokeOpacity={opacity}
      />
    </g>
  );

  return (
    <g>
      <g className="inv-grand-spin-slow">{rays(28, 76, 96, 1.1, 0.26)}</g>
      {ogee(1, 0.9, 0.1)}
      {ogee(0.64, 0.6, 0.06)}
      {ogee(0.34, 0.5, 0)}
      {core(4, 0.85)}
    </g>
  );
}

/**
 * ART DECO: kipas langkah yang tersusun simetris, ikon era 1920-an.
 *
 * JARI KIPAS TIDAK BOLEH MEMBENTUK "BINTANG".
 *
 * Versi pertama menggambar tiap jari dari titik (100,100) sampai keliling luar.
 * Delapan jari yang semuanya bertemu di satu titik persis itu bukan kipas —
 * itu BINTANG DELAPAN, dan yang tampil di layar persis seperti bintang. Kipas
 * deco baru terbaca kalau jarinya BERHENTI di radius yang sama, sehingga yang
 * terlihat adalah bundar di tengah, bukan titik.
 *
 * Karena itu jarinya digambar dari r 30 ke r 78, dan "langkahnya" berupa tiga
 * bilah melintang yang makin lebar ke luar. Kipas yang hanya punya satu garis
 * per jari akan terbaca sebagai matahari biasa.
 */
function ArtDecoGrand(): JSX.Element {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`rotate(${45 * i} ${C} ${C})`}>
          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Jari kipas: berhenti di r 78, tidak menyeberang pusat. */}
            <path d={`M${C} ${C - 30}V${C - 78}`} strokeWidth="2.6" strokeOpacity="0.9" />
            {/* Tiga langkah melintang, makin lebar ke luar. */}
            <path d={`M${C - 8} ${C - 44}h16`} strokeWidth="1.8" strokeOpacity="0.65" />
            <path d={`M${C - 14} ${C - 58}h28`} strokeWidth="1.6" strokeOpacity="0.5" />
            <path d={`M${C - 20} ${C - 70}h40`} strokeWidth="1.4" strokeOpacity="0.35" />
          </g>
        </g>
      ))}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.7"
      >
        <circle cx={C} cy={C} r="30" />
        <circle cx={C} cy={C} r="78" strokeOpacity="0.35" />
        <circle cx={C} cy={C} r="88" strokeOpacity="0.2" strokeDasharray="2 8" />
      </g>
      {star(4, 16, 4, 0.8)}
      {core(3, 0.9)}
    </g>
  );
}

/**
 * RENDA: medali scallop berlubang, dikelilingi rumbai lace yang menjulang.
 *
 * Lubangnya sengaja dikecilkan (r 4-7) dan diberi jarak 12-14 unit. Lubang
 * yang lebih besar akan berhenti terbaca sebagai lubang dan berubah jadi
 * tambalan putih — dan itulah yang membuat renda versi pertama terbaca
 * sebagai piring, bukan kain.
 */
function RendaGrand(): JSX.Element {
  const holes = (r: number, count: number, size: number, opacity: number) =>
    Array.from({ length: count }, (_, i) => {
      const a = (360 / count) * i;
      const rad = (a * Math.PI) / 180;
      return (
        <circle
          key={i}
          cx={C + r * Math.cos(rad)}
          cy={C + r * Math.sin(rad)}
          r={size}
          fill="currentColor"
          fillOpacity={opacity}
        />
      );
    });

  return (
    <g>
      <path
        d={scallopRing(84, 16, -6)}
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.8"
      />
      <path
        d={scallopRing(62, 12, -5)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.55"
      />
      <path
        d={scallopRing(40, 10, -4)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeOpacity="0.45"
      />
      {holes(84, 16, 5, 0.35)}
      {holes(62, 12, 4, 0.3)}
      {holes(40, 10, 3.5, 0.28)}
      <g className="inv-grand-spin-slow">{ring(24, 1, 0.4, "1 5")}</g>
      {core(4, 0.75)}
    </g>
  );
}
// ============================================
// Peta motif → grand ornamen
// ============================================

/**
 * Peta motif ke komposisi besarnya.
 *
 * `Record<MotifId, …>` TANPA cadangan, sama seperti `TILES` dan `CRESTS` di
 * `Ornaments.tsx`. Motif baru yang belum digambar di sini akan langsung
 * menggagalkan `tsc`, dan `next build` selalu menjalankan `tsc`.
 *
 * Yang TIDAK tertangkapnya: dua id yang gambarnya tertukar. Bentuknya valid,
 * kompilasi hijau, dan yang salah baru terlihat saat admin memandangi
 * pratinjaunya — tidak ada cara murah mendeteksi itu di compile time.
 */
const GRAND: Record<MotifId, () => JSX.Element> = {
  kawung: KawungGrand,
  parang: ParangGrand,
  ceplok: CeplokGrand,
  jlamprang: JlamprangGrand,
  lasem: LasemGrand,
  gunungan: GununganGrand,
  "wayang-kulit": WayangKulitGrand,
  songket: SongketGrand,
  "patra-bali": PatraBaliGrand,
  girih: GirihGrand,
  mashrabiya: MashrabiyaGrand,
  sakura: SakuraGrand,
  melati: MelatiGrand,
  monstera: MonsteraGrand,
  anggrek: AnggrekGrand,
  kamboja: KambojaGrand,
  dedaunan: DedaunanGrand,
  "kupu-kupu": KupuKupuGrand,
  merak: MerakGrand,
  merpati: MerpatiGrand,
  damask: DamaskGrand,
  "art-deco": ArtDecoGrand,
  renda: RendaGrand,
};

// ============================================
// Komponen
// ============================================

/**
 * Grand ornamen sebuah motif, siap animasi.
 *
 * Dipakai di mana pun yang butuh motif tampil besar: puncak kartu sampul,
 * medali pembatas bagian, latar judul, dan pratinjau admin.
 *
 * `size` menyatakan lebar dalam piksel dan TIDAK mengubah viewBox — gambar
 * selalu diskalakan dari kanvas 200 yang sama. Itu yang membuat satu
 * satu komponen bisa dipakai di 90px dan 320px tanpa proporsi yang
 * berbeda; kalau viewBox ikut berubah per ukuran, motif yang sama akan punya
 * dua silhuet berbeda di dua tempat.
 *
 * Gerak dipasang lewat kelas, bukan JS:
 *   - `.inv-grand-sway` (induk) — goyangan ±1,6° selama 9 s.
 *   - `.inv-grand-spin` / `-spin-slow` — cincin dalam berputar 70 s / 140 s.
 *   - `.inv-grand-trace` — salinan garis emas yang menyusuri ornamen.
 *
 * Semuanya dimatikan di blok `prefers-reduced-motion` di `globals.css`.
 */
export function GrandMotif({
  motif,
  size = 180,
  className = "",
  color = "var(--theme-accent)",
  opacity = 1,
  /** Salinan garis emas yang menyusuri ornamen (hanya saat dekor tinggi). */
  shine = false,
  /** Beri animasi masuk saat elemen pertama kali tampil. */
  enter = false,
}: {
  motif: MotifId;
  /** Lebar gambar dalam piksel. */
  size?: number;
  className?: string;
  /** Warna motif; default mengikuti token aksen tema. */
  color?: string;
  opacity?: number;
  shine?: boolean;
  enter?: boolean;
}) {
  const Art = GRAND[motif];

  return (
    <span
      className={`inv-grand block ${enter ? "inv-grand--enter" : ""} ${className}`}
      style={{ width: size, height: size, color, opacity }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="inv-grand-sway h-full w-full"
        focusable="false"
      >
        <Art />
        {shine ? (
          <g className="inv-grand-trace">
            <Art />
          </g>
        ) : null}
      </svg>
    </span>
  );
}
/** Posisi sudut untuk `GrandSpray`. */
export type SprayCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Semprotan sudut: ranting panjang dari pojok kartu, dengan grand ornamen
 * sebagai kepalanya.
 *
 * INILAH YANG MEMBUAT HALAMAN TERBACA MEWAH
 *
 * Sendiri, `GrandMotif` hanya memamerkan satu bentuk di tengah. Yang
 * membuatnya terlihat seperti undangan yang dibuat desainer adalah
 * ELEMEYNYA SENDIRI DI POJOK: sepasang semprotan besar di dua sudut berhadapan
 * yang "menyerang" kartu dari luar, persis seperti bouquet di sudut sampul
 * invitations cetak.
 *
 * Semprotannya sendiri bukan gambar motif — ia generic (ranting + daun +
 * kuncup), dan kepalanya saja yang ikut motif. Jadi motif flora mendapat
 * bouquet bunga, motif batik mendapat bouquet dengan kepala batik, dan
 * custos tidak menggambar ranting baru untuk tiap motif.
 *
 * Posisi sudut TIDAK mengubah gambarnya, hanya memutar dan membaliknya lewat
 * `transform` di `globals.css`. Empat gambar terpisah untuk empat sudut
 * berarti empat kali Opportunity salah ketuk; empat transform lebih murah
 * dan hasilnya identik karena rantingnya simetris diagonal.
 */
export function GrandSpray({
  motif,
  corner = "top-right",
  size = 240,
  className = "",
  color = "var(--theme-accent)",
  opacity = 1,
}: {
  motif: MotifId;
  corner?: SprayCorner;
  size?: number;
  className?: string;
  color?: string;
  opacity?: number;
}) {
  const Art = GRAND[motif];

  return (
    <span
      className={`inv-grand inv-grand-spray--${corner} block ${className}`}
      style={{ width: size, height: size, color, opacity }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="inv-grand-sway h-full w-full"
        focusable="false"
      >
        {/* Ranting utama: keluar dari pojok dan melengkung ke arah dalam. */}
        <path
          d="M4 196C34 176 52 150 62 118 72 86 84 62 112 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        <path
          d="M4 196C18 174 22 152 18 128"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        {/* Daun di sepanjang ranting. */}
        {[
          { x: 44, y: 160, r: -58, len: 40, w: 15 },
          { x: 60, y: 128, r: 62, len: 34, w: 13 },
          { x: 74, y: 92, r: -46, len: 32, w: 12 },
          { x: 22, y: 140, r: -70, len: 26, w: 10 },
        ].map(({ x, y, r: rotate, len, w: wide }) => (
          <Leaf
            key={`${x}-${y}`}
            x={x}
            y={y}
            rotate={rotate}
            len={len}
            wide={wide}
            opacity={0.4}
          />
        ))}
        {/* Kepala: grand ornamen motif, dikecilkan supaya muat di ujung ranting.
            Angka posisi dan skala di bawah dihitung dari kotak pembatas
            hasil transform-nya: pada translate(108 64) scale(0.55) tepi
            atasnya jatuh di y=9. Versi sebelumnya, translate(104 36)
            scale(0.62), menempatkan tepi atas di y=-26 -- di luar viewBox --
            sehingga ujung motif terpotong garis. */}
        <g transform="translate(108 64) scale(0.55) translate(-100 -100)">
          <Art />
        </g>
        {/* Kuncup kecil di puncak ranting, pengisi ruang kosong. */}
        <g fill="currentColor" fillOpacity="0.3">
          <circle cx="150" cy="34" r="4" />
          <circle cx="164" cy="46" r="2.6" />
          <circle cx="88" cy="24" r="2.2" />
        </g>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.4"
          strokeLinecap="round"
        >
          <path d="M132 24c14 4 22 14 24 28" />
          <path d="M96 12c-12 6-18 18-18 32" />
        </g>
      </svg>
    </span>
  );
}

/**
 * Medali bulat: grand ornamen di dalam dua cincin emas.
 *
 * Dipakai di titik-titik pemisah yang punya ruang kosong di sekitarnya,
 * seperti pembatas antar bagian. Bukan karena sekadar dekoratif, tapi karena
 * di dalam cincin motif bisa tampil LEBIH BESAR daripada kalau berdiri
 * sendiri — ruanglah yang membuatnya terasa seperti medali.
 */
export function GrandMedallion({
  motif,
  size = 72,
  className = "",
  color = "var(--theme-accent)",
  shine = false,
}: {
  motif: MotifId;
  size?: number;
  className?: string;
  color?: string;
  shine?: boolean;
}) {
  const Art = GRAND[motif];

  return (
    <span
      className={`inv-grand relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size, color }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" width={size} height={size} focusable="false">
        {/* Cincin luar putus-putus berputar, cincin dalam tipis diam.
           Tidak ada `translate` di sini: `transform-box: fill-box` sudah
            membuat titik putar diambil dari kotak pembatas elemen tersebut,
            yaitu titik tengah lingkaran itu sendiri. Menambah
            `translate(100 100)` — seperti versi pertama — justru menggeser
            lingkaran ke pojok kanvas tepat saat ia mulai berputar. */}
        <g className="inv-grand-spin-slow">
          <circle
            r="97"
            cx="100"
            cy="100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeOpacity="0.5"
            strokeDasharray="3 9"
          />
        </g>
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.75"
        />
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeOpacity="0.35"
        />
        <g transform="translate(100 100) scale(0.68) translate(-100 -100)">
          <Art />
          {shine ? (
            <g className="inv-grand-trace">
              <Art />
            </g>
          ) : null}
        </g>
      </svg>
    </span>
  );
}
