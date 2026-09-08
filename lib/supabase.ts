import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper Supabase Client
 *
 * - `getSupabase()`  : client browser/client-side (anon key, menghormati RLS)
 * - `getSupabaseAdmin()`: client server-side dengan service role (HATI-HATI, bypass RLS)
 *
 * Environment variables (lihat .env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (opsional, hanya untuk server)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Mengembalikan instance Supabase client (anon).
 * Aman digunakan di Client Components maupun Server Components.
 * Menghormati Row Level Security (RLS) Supabase.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Konfigurasi Supabase tidak ditemukan. Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diisi di .env.local"
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Instance Supabase client (anon) yang dibuat sekali (singleton) untuk browser.
 * Gunakan ini di Client Components agar tidak membuat client baru pada tiap render.
 *
 * Contoh:
 *   const supabase = getSupabaseBrowserClient();
 *   const { data } = await supabase.from("invitations").select("*");
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = getSupabase();
  }
  return browserClient;
}

/**
 * Supabase client dengan service role key (server-side only, misal di Route Handlers / Server Actions).
 * BYPASS Row Level Security — jangan pernah expose ke browser.
 * Memerlukan SUPABASE_SERVICE_ROLE_KEY di .env.local
 */
export function getSupabaseAdmin(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. Tambahkan ke .env.local (hanya untuk server, jangan commit!)"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Tidak ada session user di server; matikan auto-refresh agar aman
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
