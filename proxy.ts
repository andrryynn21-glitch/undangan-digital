/**
 * Proxy: pengalih cepat untuk rute `/admin`.
 *
 * Di Next 16 Middleware diganti nama menjadi Proxy — riwayat versi `v16.0.0`:
 * "Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js
 * runtime." Jadi berkas ini bernama `proxy.ts`, bukan `middleware.ts`.
 *
 * Perannya sengaja dibatasi pada pemeriksaan cookie yang optimistis: hanya
 * membaca cookie dan memverifikasi tanda tangannya, tanpa menyentuh database.
 * Izin yang sungguhan diperiksa ulang di `app/admin/page.tsx` dan di dalam
 * Server Action lewat `requireAdmin()` / `verifyAdminSession()`, sesuai
 * peringatan dokumentasi bahwa proxy bukan solusi otorisasi.
 */

import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const signedIn = verifySessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  );

  // Halaman login wajib tetap terbuka tanpa cookie; yang sudah masuk tidak
  // perlu melihatnya lagi.
  if (pathname === LOGIN_PATH) {
    return signedIn
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  if (!signedIn) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
