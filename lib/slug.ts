/**
 * Penyusun slug undangan dari nama mempelai.
 *
 * Modul ini sengaja MURNI (tanpa impor Supabase atau `next/*`) supaya bisa
 * dipakai dua sisi sekaligus: form admin memakainya untuk menampilkan pratinjau
 * tautan sambil admin mengetik, dan Server Action memakainya untuk menyusun
 * slug yang benar-benar disimpan. Dengan begitu keduanya tidak pernah berbeda
 * aturan — pratinjau yang meleset dari hasil akhir lebih membingungkan daripada
 * tidak ada pratinjau sama sekali.
 *
 * Pengecekan tabrakan slug BUKAN di sini karena butuh database; lihat
 * `ensureUniqueSlug()` di `lib/invitation.ts`.
 */

/** Slug cadangan bila nama sama sekali tidak menyisakan huruf Latin. */
export const FALLBACK_SLUG = "undangan";

/** Panjang maksimal potongan nama, agar slug tidak menjadi sangat panjang. */
const MAX_NAME_PART = 20;

/**
 * Menyaring satu kata menjadi huruf kecil + angka saja.
 * Diakritik diuraikan lebih dulu (`é` → `e`), lalu sisa tanda baca dibuang —
 * jadi "Nur'azizah" menjadi "nurazizah", bukan "nur-azizah".
 */
function toAscii(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Mengambil nama panggilan dari sebuah nama lengkap, lalu menyaringnya.
 *
 * Kata pertama dipakai lebih dulu ("Arya Dwi" → "arya"). Bila kata pertama tidak
 * menyisakan satu pun huruf Latin (mis. ditulis dengan aksara lain), seluruh
 * nama dicoba sebagai cadangan sebelum menyerah.
 */
function slugifyName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";

  const firstWord = toAscii(trimmed.split(/\s+/)[0] ?? "");
  if (firstWord) return firstWord.slice(0, MAX_NAME_PART);

  return toAscii(trimmed).slice(0, MAX_NAME_PART);
}

/**
 * Menyusun slug dasar dari nama kedua mempelai.
 *
 * Contoh: "Arya Dwi" + "Kirana Ayu" → "arya-kirana".
 *
 * Hasilnya selalu cocok dengan pola slug yang divalidasi Server Action
 * (huruf kecil, angka, tanda hubung; minimal 3 karakter). Bila kedua nama masih
 * kosong — form baru dibuka — hasilnya string kosong, dan pemanggil yang
 * memutuskan apa artinya (form memakai folder `draft/` untuk foto).
 */
export function generateSlugFromNames(
  groomName: string,
  brideName: string
): string {
  const parts = [slugifyName(groomName), slugifyName(brideName)].filter(Boolean);

  if (parts.length === 0) return "";

  const joined = parts.join("-");

  // Nama yang sangat pendek ("Li" + "Wu" → "li-wu") tetap lolos; yang tidak
  // lolos hanya nama tunggal berhuruf sedikit, mis. "Li" → "li" (2 karakter).
  return joined.length >= 3 ? joined : FALLBACK_SLUG;
}
