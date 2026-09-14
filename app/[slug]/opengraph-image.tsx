import { ImageResponse } from "next/og";
import sharp from "sharp";

import { formatEventDate } from "@/lib/date";
import { getInvitationBySlug } from "@/lib/invitation";

/**
 * Gambar pratinjau undangan untuk WhatsApp, Telegram, Facebook, dan DM Instagram.
 *
 * KENAPA TIDAK LANGSUNG MEMAKAI FOTO SAMPULNYA
 *
 * Sebelumnya `og:image` menunjuk foto sampul di Supabase apa adanya. Itu tampak
 * benar, tapi hampir selalu gagal di WhatsApp karena tiga hal sekaligus:
 *
 *  1. UKURAN. Foto dari HP bisa 3-5 MB (batas unggah kita 5 MB). WhatsApp hanya
 *     mengambil gambar pratinjau yang kecil — lewat dari itu tautannya tampil
 *     sebagai teks polos, tanpa pesan kesalahan apa pun.
 *  2. FORMAT. Admin boleh mengunggah WebP dan AVIF (lihat `ACCEPTED_PHOTO_TYPES`).
 *     Perayap tautan tidak menampilkan keduanya dengan andal.
 *  3. UKURAN BIDANG. Foto potret dari HP membuat pratinjau terpotong aneh, dan
 *     tanpa `og:image:width`/`height` sebagian aplikasi memilih thumbnail kecil.
 *
 * Rute ini menyelesaikan ketiganya: apa pun yang diunggah admin dikeluarkan
 * kembali sebagai JPEG 1200x630 berukuran ratusan KB. Memakai konvensi berkas
 * `opengraph-image`, jadi Next sendiri yang menuliskan `og:image`,
 * `og:image:type`, `og:image:width`, dan `og:image:height` — tidak ada tag yang
 * bisa lupa disetel.
 */

/** Ukuran baku Open Graph (1.91:1) — rasio yang dipakai kartu besar WhatsApp. */
export const size = { width: 1200, height: 630 };

/**
 * Selalu JPEG, termasuk untuk kartu cadangan yang dibuat `ImageResponse` (yang
 * aslinya PNG). Nilai ini menjadi `og:image:type`, dan hanya boleh ada satu —
 * jadi kedua jalur di bawah wajib menghasilkan format yang sama.
 */
export const contentType = "image/jpeg";

export const alt = "Undangan Pernikahan";

/**
 * Mutu JPEG. 82 adalah titik ketika foto pernikahan masih terlihat bersih di
 * layar HP, sementara berkasnya tetap jauh di bawah batas aman perayap.
 */
const JPEG_QUALITY = 82;

/** Waktu unduh foto dibatasi agar perayap tidak menunggu terlalu lama. */
const FETCH_TIMEOUT_MS = 5000;

/** Warna kartu cadangan — netral, tidak mengikat tema mana pun. */
const FALLBACK_BACKGROUND = "#1c1917";
const FALLBACK_ACCENT = "#d6c39a";

/** Rasio bidang Open Graph yang dituju. */
const TARGET_RATIO = size.width / size.height;

/**
 * Seberapa mirip rasio foto dengan bidang Open Graph sebelum foto itu boleh
 * dipotong. 0,75 berarti: potong hanya bila sesudahnya masih tersisa tiga
 * perempat bidang foto.
 *
 * Angka ini yang memisahkan dua perlakuan di bawah. Foto 3:2 dan 16:9 dari
 * kamera (79%-93%) dipotong tipis dan mengisi penuh bidangnya. Foto tegak dari
 * HP — dan foto sampul biasanya begitu, karena bentuk sampul undangan memang
 * tegak — hanya menyisakan 30%, jadi memotongnya akan membuang wajah kedua
 * mempelai. Yang seperti itu ditampilkan utuh.
 */
const MIN_COVER_COVERAGE = 0.75;

/** Kepekatan blur latar; cukup kuat agar detailnya tidak bersaing dengan foto. */
const BACKDROP_BLUR = 28;

/** Latar digelapkan supaya foto di depannya yang menonjol. */
const BACKDROP_BRIGHTNESS = 0.55;

/**
 * Nilai EXIF orientation yang menukar sisi panjang dan lebar.
 *
 * 5-8 berarti foto disimpan miring 90° dan baru ditegakkan saat ditampilkan.
 * Foto dari HP hampir selalu begitu: sensornya tidak ikut berputar, jadi arah
 * yang benar hanya dicatat sebagai penanda.
 */
const EXIF_SWAPS_SIDES = new Set([5, 6, 7, 8]);

/**
 * Menyalin hasil sharp ke `ArrayBuffer` polos.
 *
 * `Buffer` Node memakai memori bersama yang bisa lebih besar dari isinya, jadi
 * potongannya diambil tepat sepanjang data — bukan seluruh kolamnya.
 */
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

/**
 * Menyusun foto menjadi JPEG 1200x630, dengan dua perlakuan berbeda.
 *
 * Foto yang rasionya sudah mendekati bidang Open Graph dipotong sedikit lalu
 * mengisi penuh. Foto tegak ditampilkan utuh di tengah, dengan salinan dirinya
 * sendiri yang diblur sebagai latar — jadi tidak ada bidang kosong, tidak ada
 * wajah yang terpotong, dan tidak ada warna asing yang ditebak.
 *
 * SETIAP pipeline diawali `.rotate()` tanpa argumen, yang menerapkan penanda
 * EXIF. Tanpa itu foto dari HP keluar dalam keadaan miring — dan salahnya tidak
 * akan terlihat saat memeriksa undangannya sendiri, karena browser menghormati
 * penanda EXIF sementara berkas hasil olahan ini tidak lagi memilikinya.
 *
 * Hasilnya `ArrayBuffer`, bukan `Buffer`: `BodyInit` hanya menerima
 * `ArrayBufferView<ArrayBuffer>` atau `ArrayBuffer`, sementara `Buffer` Node
 * bertipe `ArrayBufferLike` yang lebih longgar.
 */
async function renderPhotoCard(photoUrl: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(photoUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `[og] Foto sampul tidak bisa diambil (${response.status}):`,
        photoUrl
      );
      return null;
    }

    const source = Buffer.from(await response.arrayBuffer());
    const { width, height, orientation } = await sharp(source).metadata();

    // Ukuran yang dibaca dari berkas adalah ukuran tersimpan, bukan ukuran
    // tampil. Keduanya ditukar dulu bila EXIF memintanya, supaya rasio yang
    // menentukan pilihan cabang di bawah benar-benar rasio yang dilihat orang.
    const upright =
      orientation && EXIF_SWAPS_SIDES.has(orientation)
        ? { width: height, height: width }
        : { width, height };

    const ratio =
      upright.width && upright.height
        ? upright.width / upright.height
        : TARGET_RATIO;
    const coverage =
      Math.min(ratio, TARGET_RATIO) / Math.max(ratio, TARGET_RATIO);

    if (coverage >= MIN_COVER_COVERAGE) {
      // Potongannya tipis. `center`, bukan `attention`: strategi attention
      // mengejar bagian paling berkontras — pada foto pernikahan itu sering
      // berarti dinding atau langit, bukan mempelainya.
      const filled = await sharp(source)
        .rotate()
        .resize(size.width, size.height, { fit: "cover", position: "center" })
        .jpeg({ quality: JPEG_QUALITY, progressive: true })
        .toBuffer();

      return toArrayBuffer(filled);
    }

    const [backdrop, foreground] = await Promise.all([
      sharp(source)
        .rotate()
        .resize(size.width, size.height, { fit: "cover", position: "center" })
        .blur(BACKDROP_BLUR)
        .modulate({ brightness: BACKDROP_BRIGHTNESS })
        .toBuffer(),
      sharp(source)
        .rotate()
        .resize(size.width, size.height, { fit: "inside" })
        .toBuffer(),
    ]);

    const composed = await sharp(backdrop)
      .composite([{ input: foreground, gravity: "center" }])
      .jpeg({ quality: JPEG_QUALITY, progressive: true })
      .toBuffer();

    return toArrayBuffer(composed);
  } catch (error) {
    // Foto hilang, host lambat, atau berkasnya rusak. Bukan alasan untuk
    // menggagalkan pratinjau — pemanggil beralih ke kartu teks. Tetap dicatat:
    // tanpa ini, undangan yang jatuh ke kartu teks terlihat seperti undangan
    // yang memang tidak punya foto sampul, dan penyebabnya tidak terlacak.
    console.error("[og] Gagal menyiapkan foto sampul:", error);
    return null;
  }
}

/**
 * Kartu teks untuk undangan yang belum punya foto sampul.
 *
 * `ImageResponse` mengeluarkan PNG, jadi hasilnya dilewatkan sharp supaya
 * cocok dengan `contentType` di atas.
 */
async function renderTextCard(
  couple: string,
  dateText: string
): Promise<ArrayBuffer> {
  const card = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: FALLBACK_BACKGROUND,
          color: "#faf9f7",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: FALLBACK_ACCENT,
          }}
        >
          Undangan Pernikahan
        </div>

        <div
          style={{
            fontSize: 84,
            textAlign: "center",
            padding: "0 80px",
            lineHeight: 1.15,
          }}
        >
          {couple}
        </div>

        {dateText ? (
          <div style={{ fontSize: 32, opacity: 0.75 }}>{dateText}</div>
        ) : null}
      </div>
    ),
    size
  );

  const jpeg = await sharp(Buffer.from(await card.arrayBuffer()))
    .jpeg({ quality: JPEG_QUALITY, progressive: true })
    .toBuffer();

  return toArrayBuffer(jpeg);
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invitation = await getInvitationBySlug(slug).catch(() => null);

  if (!invitation) {
    // Slug tak dikenal tetap harus menjawab dengan gambar, bukan 404: perayap
    // yang menerima galat kadang menandai seluruh domain sebagai bermasalah.
    return new Response(await renderTextCard("Undangan Pernikahan", ""), {
      headers: { "Content-Type": contentType },
    });
  }

  const couple = `${invitation.groom_data.nickName} & ${invitation.bride_data.nickName}`;
  const mainEvent = invitation.event_data?.events?.[0];
  const dateText = mainEvent?.date ? formatEventDate(mainEvent.date) : "";
  const coverPhotoUrl = invitation.event_data?.cover_photo_url;

  const body =
    (coverPhotoUrl ? await renderPhotoCard(coverPhotoUrl) : null) ??
    (await renderTextCard(couple, dateText));

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      // Perayap WhatsApp mengambil gambar ini berulang kali untuk setiap tamu
      // yang menerima tautan. Satu jam cukup lama untuk melayani satu gelombang
      // sebaran, tapi masih cukup singkat agar foto yang diganti admin tidak
      // tertahan lama di pratinjau.
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
