/**
 * Alamat asal situs untuk hal-hal yang tidak bisa memakai URL relatif.
 *
 * Pemakai utamanya `metadataBase` di `app/layout.tsx`. Tanpa alamat absolut,
 * URL gambar Open Graph dikirim apa adanya sebagai path relatif, dan WhatsApp
 * tidak bisa mengambilnya — preview undangan yang dibagikan jadi kosong. Next
 * bahkan menggagalkan build bila ada field metadata relatif tanpa `metadataBase`.
 *
 * HANYA UNTUK SERVER. `VERCEL_PROJECT_PRODUCTION_URL` tidak berawalan
 * `NEXT_PUBLIC_`, jadi nilainya tidak ikut ke browser. Komponen klien yang
 * butuh alamat situs membaca `window.location.origin` saja — lihat
 * `components/admin/CopyLinkButton.tsx`. Cara itu malah lebih tepat di sana,
 * karena tautannya jadi mengikuti domain yang sedang dibuka admin.
 */

const DEV_URL = "http://localhost:3000";

/**
 * Urutan sumbernya disengaja:
 *
 *  1. `NEXT_PUBLIC_SITE_URL` — domain sungguhan bila sudah dipasang sendiri.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — diisi Vercel tanpa perlu dikonfigurasi,
 *     jadi deployment produksi tetap benar walau langkah (1) terlupa. Nilainya
 *     tanpa protokol (mis. `undangan.vercel.app`), jadi `https://` ditambahkan.
 *  3. `localhost:3000` saat mengembangkan.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (vercel) {
    return `https://${vercel.replace(/\/+$/, "")}`;
  }

  return DEV_URL;
}

/** Alamat lengkap sebuah undangan, mis. `https://situs.com/budi-ani`. */
export function getInvitationUrl(slug: string): string {
  return `${getSiteUrl()}/${slug}`;
}
