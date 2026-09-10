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

/**
 * Nilai env var dibersihkan dari spasi/baris baru di ujung sebelum dipakai.
 *
 * Kunci Supabase dikirim sebagai header HTTP. Bila nilainya mengandung baris
 * baru — kasus paling sering: dua env var tidak sengaja ditempel jadi satu nilai
 * di dashboard hosting — `fetch` menolaknya dengan "invalid header value" dan
 * ISI KUNCINYA ikut tercetak di pesan error. Karena itu bentuknya diperiksa
 * lebih dulu di sini, dan pesan yang dilempar hanya menyebut NAMA env var-nya.
 */
function readKey(name: string, raw: string | undefined): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;

  if (/\s/.test(value)) {
    throw new Error(
      `Nilai ${name} tidak valid: ada spasi atau baris baru di dalamnya. ` +
        `Biasanya ini karena dua env var tertempel jadi satu nilai. ` +
        `Setiap env var harus punya baris/entri sendiri. ` +
        `(Isi nilainya sengaja tidak ditampilkan.)`
    );
  }

  return value;
}

const supabaseUrl = readKey(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);
const supabaseAnonKey = readKey(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
  const serviceRoleKey = readKey(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

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
