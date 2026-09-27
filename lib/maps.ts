/**
 * Peta untuk detail acara: tautan yang dibuka tamu, dan sematan (embed) yang
 * bisa dilihat langsung di dalam undangan.
 *
 * KENAPA SEMATANNYA DIHITUNG, BUKAN DISALIN MENTAH DARI `mapsUrl`
 *
 * Alamat peta yang ditempel admin beragam bentuknya: tautan pendek
 * (`maps.app.goo.gl/...`), tautan lokasi dengan koordinat
 * (`google.com/maps/@-6.2,106.8,17z`), tautan pencarian (`?q=...`), atau tautan
 * tempat. Hanya sebagian di antaranya boleh dipasang di dalam `<iframe>`, dan
 * tautan pendek sama sekali tidak memuat keterangan lokasi di dalamnya.
 *
 * Karena itu yang dipakai sebagai sumber utama adalah NAMA TEMPAT + ALAMAT yang
 * sudah pasti ada di undangan — keduanya sudah wajib diisi di form admin.
 * Koordinat dari `mapsUrl` hanya dipakai bila memang ada, karena ia lebih tepat
 * daripada teks alamat. Dengan begitu peta selalu bisa tampil, bahkan ketika
 * admin lupa mengisi link Maps sama sekali.
 */

import type { WeddingEvent } from "@/types/invitation";

/** Host yang dianggap benar-benar milik Google Maps. */
const MAPS_HOST_PATTERN = /(^|\.)(google\.[a-z.]+|goo\.gl)$/i;

/** Sepasang angka berkoma: koordinat, mis. `-6.200000,106.816666`. */
const COORDINATES_PATTERN = /(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/;

/** Batas panjang kueri agar URL yang dihasilkan tetap wajar. */
const MAX_QUERY_LENGTH = 220;

function readUrl(value: string | undefined): URL | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    // Bukan URL yang bisa diurai. Nilainya tetap dipakai sebagai teks pencarian
    // (lihat `getMapsQuery`), karena admin memang boleh mengetik nama tempat.
    return null;
  }
}

/**
 * Menerjemahkan tautan Google Maps milik admin menjadi kueri pencarian.
 * Mengembalikan `null` bila tautannya tidak memuat keterangan apa pun — kasus
 * tautan pendek yang baru bisa diterjemahkan setelah dibuka.
 */
function queryFromMapsUrl(mapsUrl: string): string | null {
  const direct = mapsUrl.trim();
  const url = readUrl(direct);

  // Bukan URL, tapi tetap sesuatu yang bisa dicari: "Gedung Melati Bandung".
  if (!url) return direct.length > 0 ? direct : null;

  if (!MAPS_HOST_PATTERN.test(url.hostname)) return null;

  const fromParams =
    url.searchParams.get("q") ??
    url.searchParams.get("query") ??
    url.searchParams.get("destination");

  if (fromParams) return fromParams;

  const coordinates = `${url.pathname}${url.search}`.match(COORDINATES_PATTERN);
  if (coordinates) return `${coordinates[1]},${coordinates[2]}`;

  const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (place) return decodeURIComponent(place[1]).replace(/\+/g, " ");

  return null;
}

/**
 * Kueri pencarian peta untuk sebuah acara.
 * Selalu mengembalikan nilai: nama tempat + alamat adalah kolom wajib.
 */
export function getMapsQuery(event: WeddingEvent): string {
  const fromLink = event.mapsUrl ? queryFromMapsUrl(event.mapsUrl) : null;

  const query = (fromLink ?? `${event.venueName}, ${event.address}`)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);

  return query;
}

/** Tautan yang dibuka tamu saat menekan "Lihat Lokasi". */
export function getMapsLink(event: WeddingEvent): string {
  const url = readUrl(event.mapsUrl);

  if (url) return url.toString();

  // Tanpa link dari admin, tamu tetap diantar ke lokasi yang benar lewat
  // pencarian Google Maps.
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    getMapsQuery(event)
  )}`;
}

/**
 * Alamat sematan peta. Titiknya sendiri dipatok `q`, jadi tamu langsung melihat
 * pin lokasinya, bukan peta dunia.
 */
export function getMapsEmbedUrl(event: WeddingEvent): string {
  const params = new URLSearchParams({
    q: getMapsQuery(event),
    // `output=embed` adalah bentuk sematan tanpa kunci API yang dipakai
    // penerjemah peta biasa; `hl` menyetel bahasa antarmuka ke Indonesia.
    output: "embed",
    hl: "id",
    z: "16",
  });

  return `https://www.google.com/maps?${params.toString()}`;
}
