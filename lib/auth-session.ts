/**
 * Data Access Layer sesi admin — tempat pemeriksaan izin yang SUNGGUHAN.
 *
 * `proxy.ts` hanya pengalih cepat. Dokumentasi Next 16 yang ikut terkirim di
 * `node_modules/next/dist/docs/` menegaskan proxy bukan solusi otorisasi:
 * "Always verify authentication and authorization inside each Server Function
 * rather than relying on Proxy alone" — sebab perubahan matcher atau pemindahan
 * Server Function ke rute lain bisa menghilangkan cakupan proxy tanpa suara.
 *
 * Pemeriksaan juga TIDAK diletakkan di layout: dokumentasi yang sama menyebut
 * pola itu tidak dianjurkan, karena segmen rute tetap dieksekusi dan ikut masuk
 * RSC Payload walau layout mengembalikan `null`.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Apakah request ini membawa cookie sesi admin yang sah.
 *
 * Dibungkus `cache` mengikuti contoh DAL di dokumentasi, supaya beberapa
 * pemanggil dalam satu render hanya memverifikasi tanda tangan sekali.
 */
export const verifyAdminSession = cache(async (): Promise<boolean> => {
  const store = await cookies();

  return verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
});

/**
 * Menghentikan eksekusi bila pemanggil bukan admin.
 *
 * Dipakai di awal Server Component `/admin` dan di dalam Server Action yang
 * menulis data. Pemanggil yang butuh pesan error alih-alih pengalihan halaman
 * (misalnya widget unggah foto) sebaiknya memakai `verifyAdminSession()`.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await verifyAdminSession())) redirect("/admin/login");
}
