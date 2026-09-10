/**
 * Tautan undangan personal per tamu.
 *
 * Bentuknya: `/{slug}?to=bapak-andi-wijaya.a1b2c3`
 *
 * Dipilih begini karena tiga alasan sekaligus:
 *
 *  - Terbaca penerimanya. Tamu yang melihat tautannya di WhatsApp tahu itu
 *    memang ditujukan untuknya, bukan tautan acak.
 *  - Tetap tepat walau ada dua tamu bernama sama. Akhiran `.a1b2c3` adalah
 *    potongan awal UUID baris `guests`, jadi "Bapak Andi" yang satu tidak
 *    tertukar dengan "Bapak Andi" yang lain.
 *  - Tidak butuh kolom baru di database. Tabel `guests` sudah ada apa adanya
 *    (`id`, `invitation_id`, `name`, `created_at`) dan tetap cukup.
 *
 * Modul ini MURNI — tanpa impor Supabase atau `next/*` — supaya panel admin di
 * browser bisa menyusun tautan yang sama persis dengan yang dibaca server.
 * Pencarian tamunya sendiri ada di `lib/invitation.ts`, karena butuh database.
 */

import { slugifyFullName } from "@/lib/slug";

/** Banyak karakter awal UUID yang dipakai sebagai pembeda di tautan. */
export const GUEST_ID_PREFIX_LENGTH = 6;

/** Batas panjang nama tamu yang ditampilkan, sebagai penjaga tata letak. */
const MAX_DISPLAY_NAME = 60;

/** Menormalkan UUID agar perbandingan awalannya tidak terganggu tanda hubung. */
function normalizeId(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

/** Potongan UUID yang mewakili satu tamu di dalam tautan. */
export function guestIdPrefix(id: string): string {
  return normalizeId(id).slice(0, GUEST_ID_PREFIX_LENGTH);
}

/**
 * Menyusun nilai `?to=` untuk seorang tamu.
 * Nama yang tidak menyisakan huruf Latin sama sekali menyisakan potongan UUID
 * saja — tautannya jadi kurang cantik, tapi tetap menunjuk tamu yang benar.
 */
export function buildGuestToken(name: string, id: string): string {
  const slug = slugifyFullName(name);
  const prefix = guestIdPrefix(id);

  return slug ? `${slug}.${prefix}` : prefix;
}

/**
 * Memisahkan nilai `?to=` menjadi bagian nama dan potongan UUID.
 *
 * Titik dicari dari belakang agar nama yang kebetulan mengandung titik tidak
 * merusak pembacaan. Potongan yang bentuknya bukan heksadesimal sepanjang
 * `GUEST_ID_PREFIX_LENGTH` dianggap bagian dari nama, bukan penunjuk tamu —
 * dengan begitu `?to=Dr. Andi` yang diketik manual tetap terbaca utuh.
 */
export function splitGuestToken(raw: string): {
  nameHint: string;
  idPrefix: string | null;
} {
  const dot = raw.lastIndexOf(".");

  if (dot > 0) {
    const candidate = raw.slice(dot + 1).toLowerCase();

    if (new RegExp(`^[0-9a-f]{${GUEST_ID_PREFIX_LENGTH}}$`).test(candidate)) {
      return { nameHint: raw.slice(0, dot), idPrefix: candidate };
    }
  }

  return { nameHint: raw, idPrefix: null };
}

/** Huruf pertama tiap kata dibesarkan: "andi wijaya" → "Andi Wijaya". */
function titleCase(value: string): string {
  return value.replace(/(^|\s)(\p{L})/gu, (_, lead, letter: string) =>
    `${lead}${letter.toLocaleUpperCase("id-ID")}`
  );
}

/**
 * Mengubah nilai `?to=` menjadi nama yang layak ditampilkan, TANPA database.
 *
 * Dipakai sebagai cadangan: tamu yang barisnya sudah dihapus, atau tautan yang
 * diketik sendiri oleh pemilik acara (`?to=Bapak%20Andi`) tetap menyapa dengan
 * benar. Nilai ini datang dari URL — artinya bisa diisi siapa saja — jadi
 * panjangnya dibatasi dan karakter kontrolnya dibuang. Untuk pencegahan XSS
 * tidak ada yang perlu dilakukan di sini: React meng-escape teks yang dirender.
 */
export function guestNameFromToken(raw: string): string {
  const { nameHint } = splitGuestToken(raw);

  const cleaned = nameHint
    // Karakter kontrol dijadikan spasi lebih dulu supaya tidak menyisakan
    // sambungan kata yang aneh, lalu spasi berlebihnya dirapatkan.
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DISPLAY_NAME);

  if (!cleaned) return "";

  // Bentuk slug ("bapak-andi-wijaya") dikembalikan menjadi kalimat biasa.
  // Nama yang diketik manual sudah mengandung spasi, jadi dibiarkan apa adanya
  // supaya kapitalisasi pilihan pemilik acara tidak ikut diubah.
  if (!cleaned.includes(" ") && cleaned.includes("-")) {
    return titleCase(cleaned.replace(/-+/g, " "));
  }

  return cleaned;
}

/**
 * Memecah tempelan daftar nama dari panel admin menjadi daftar nama bersih.
 *
 * Menerima satu nama per baris, juga memaklumi pemisah koma karena daftar tamu
 * sering disalin dari spreadsheet. Duplikat dibuang dengan pembandingan tanpa
 * memperhatikan besar-kecil huruf, tapi ejaan yang ditulis admin dipertahankan.
 */
export function parseGuestNames(raw: string, limit: number): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const line of raw.split(/[\r\n,]+/)) {
    const name = line.replace(/\s+/g, " ").trim().slice(0, MAX_DISPLAY_NAME);

    if (name.length < 2) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    names.push(name);

    if (names.length >= limit) break;
  }

  return names;
}
