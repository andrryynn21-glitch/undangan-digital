"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getAdminPassword,
  verifyPassword,
} from "@/lib/auth";
import type { LoginFormState } from "@/lib/form-state";

/**
 * Server Action login & logout admin.
 *
 * Bentuk state form ada di `lib/form-state.ts`, bukan di sini: berkas bertanda
 * `"use server"` hanya boleh mengekspor fungsi async.
 */

/**
 * Opsi cookie sesi.
 *
 * `secure` dikondisikan pada NODE_ENV dengan sengaja: cookie `Secure` tidak
 * pernah dikirim browser lewat http, sehingga login di `http://localhost:3000`
 * akan berputar-putar tanpa pernah masuk kalau flag itu dipasang saat dev.
 * `sameSite: "lax"` membuat cookie ikut terkirim pada navigasi setelah redirect.
 */
function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function login(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const value = formData.get("password");
  const password = typeof value === "string" ? value : "";

  if (!password) {
    return { status: "error", message: "Password wajib diisi." };
  }

  // Hanya mungkin terjadi di produksi tanpa ADMIN_PASSWORD. Dibedakan dari
  // "password salah" supaya pengelola tahu ini soal konfigurasi server.
  if (getAdminPassword() === null) {
    return {
      status: "error",
      message:
        "ADMIN_PASSWORD belum diset di server, jadi login tidak bisa diproses.",
    };
  }

  if (!verifyPassword(password)) {
    return { status: "error", message: "Password salah." };
  }

  const token = createSessionToken();

  if (!token) {
    return { status: "error", message: "Gagal membuat sesi. Coba lagi." };
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());

  // Selalu ke /admin, tanpa membaca tujuan dari URL — menutup celah
  // open-redirect, dan /admin memang satu-satunya tujuan yang masuk akal.
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);

  redirect("/admin/login");
}
