/**
 * Pengambilan gambar acuan tema dan pembacaan pikselnya di server.
 *
 * HANYA UNTUK SERVER, dan hanya dipanggil saat admin menyimpan undangan —
 * bukan saat tamu membukanya. Hasilnya disimpan ke `theme_config`, jadi biaya
 * unduh + proses gambar dibayar sekali, bukan setiap kunjungan tamu.
 *
 * Berkas ini sengaja tipis: tugasnya hanya mengubah URL menjadi deretan piksel.
 * Algoritma warnanya ada di `lib/palette.ts` yang bebas `sharp`, dan dipakai
 * bersama oleh jalur ini dan pratinjau di browser — supaya warna yang
 * dijanjikan form sama dengan yang akhirnya tersimpan.
 */

import sharp from "sharp";

import type { DerivedPalette } from "@/lib/palette";
import { SAMPLE_SIZE, derivePaletteFromPixels } from "@/lib/palette";

/** Unduhan dibatasi agar admin tidak menunggu lama saat menyimpan. */
const FETCH_TIMEOUT_MS = 5000;

/**
 * Membaca palet dari sebuah URL gambar.
 *
 * `null` berarti temanya tidak usah diubah — entah gambarnya tidak bisa
 * diambil, tidak bisa dibaca, atau warnanya terlalu pucat untuk jadi acuan.
 * Ketiganya bukan galat yang perlu menggagalkan penyimpanan undangan.
 */
export async function derivePalette(
  imageUrl: string
): Promise<DerivedPalette | null> {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `[palette] Gambar acuan tidak bisa diambil (${response.status}):`,
        imageUrl
      );
      return null;
    }

    const source = Buffer.from(await response.arrayBuffer());

    const { data, info } = await sharp(source)
      // Sama seperti di `opengraph-image.tsx`: EXIF diterapkan lebih dulu.
      // Tidak mengubah sebaran warna, tapi menjaga perilaku kedua jalur sama.
      .rotate()
      // `withoutEnlargement` menyamakan jalur ini dengan pratinjau di browser,
      // yang tidak pernah memperbesar gambar. Memperbesar juga tidak ada
      // gunanya: tidak ada warna baru yang muncul dari interpolasi.
      .resize(SAMPLE_SIZE, SAMPLE_SIZE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      // `ensureAlpha()`, BUKAN `removeAlpha()`: kanvas di browser selalu
      // menyerahkan RGBA, dan piksel nyaris transparan harus dilewati di kedua
      // jalur. `removeAlpha()` hanya membuang kanalnya tanpa mencampur, jadi
      // PNG berlatar transparan akan menyumbang warna yang tak pernah terlihat.
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return derivePaletteFromPixels(data, info.channels);
  } catch (error) {
    console.error("[palette] Gagal membaca gambar acuan:", error);
    return null;
  }
}
