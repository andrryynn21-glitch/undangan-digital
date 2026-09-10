/**
 * Akses data undangan dari Supabase.
 *
 * Semua query di sini berjalan di server (Server Component / Server Action)
 * memakai anon key, jadi Row Level Security tetap berlaku.
 *
 * SKEMA NYATA (dibaca langsung dari project Supabase, bukan asumsi):
 *
 *   invitations
 *     id            uuid        pk, default gen_random_uuid()
 *     slug          text        not null
 *     tier          text        not null   -- 'silver' | 'premium' | 'vip'
 *     theme_id      text        not null   -- id tema di config/themes/
 *     groom_data    jsonb       not null   -- Person
 *     bride_data    jsonb       not null   -- Person
 *     event_data    jsonb       not null   -- EventData { events, quote?, cover_photo_url?, gallery_urls? }
 *     payment_data  jsonb       default '{}'  -- PaymentData { accounts? }
 *     theme_config  jsonb       default '{}'
 *     music_url     text        null
 *     created_at    timestamptz default now()
 *
 *   wishes   id, invitation_id (uuid), sender_name not null, message, created_at
 *   rsvps    id, invitation_id (uuid), guest_name not null, status,
 *            headcount int default 1, created_at
 *   guests   id, invitation_id (uuid), name not null, created_at
 *
 * Perhatikan: `wishes`/`rsvps` merujuk undangan lewat `invitation_id` (UUID),
 * BUKAN slug — jadi id undangan harus sudah di tangan sebelum query keduanya.
 *
 * Tabel `invitations` tidak punya kolom `title`, `quote`, `published_at`,
 * maupun `updated_at`; `wishes` tidak punya kolom moderasi (`is_approved`).
 *
 * CATATAN RLS: Row Level Security sudah aktif di keempat tabel — lihat
 * `supabase/security_rls.sql`. Ringkasnya: anon key hanya boleh MEMBACA
 * `invitations` & `wishes` dan MENULIS `rsvps` & `wishes`. Semua penulisan ke
 * `invitations` wajib lewat service role, jadi `insertInvitation()` di bawah
 * memakai `getSupabaseAdmin()`.
 */

import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import type { InvitationRow, WishRow } from "@/types/invitation";

/**
 * Mengambil satu undangan berdasarkan slug.
 * Mengembalikan `null` bila slug tidak ada (dipakai untuk `notFound()`).
 */
export async function getInvitationBySlug(
  slug: string
): Promise<InvitationRow | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<InvitationRow>();

  if (error) {
    throw new Error(`Gagal mengambil undangan "${slug}": ${error.message}`);
  }

  return data;
}

/**
 * Mengambil ucapan untuk sebuah undangan.
 *
 * Kunci pencariannya `invitation_id` (UUID), bukan slug — nilainya diambil dari
 * baris undangan yang sudah di-fetch, jadi tidak ada query tambahan.
 * Kegagalan di sini tidak mematikan halaman — buku ucapan hanya tampil kosong.
 */
export async function getWishes(
  invitationId: string,
  limit = 50
): Promise<WishRow[]> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("wishes")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[wishes] Gagal mengambil ucapan:", error.message);
      return [];
    }

    return (data ?? []) as WishRow[];
  } catch (error) {
    console.error("[wishes] Supabase tidak tersedia:", error);
    return [];
  }
}

// ============================================
// Admin
// ============================================

/**
 * Menyaring daftar slug menjadi slug yang benar-benar ada di `invitations`.
 *
 * Dipakai halaman `/paket` untuk memutuskan apakah tombol "Lihat Contoh" boleh
 * tampil — tautan ke undangan contoh yang sudah dihapus akan berakhir 404 di
 * depan customer. Error tidak dilempar: tabel perbandingannya tetap berguna
 * walau tautan contohnya tidak bisa ditampilkan.
 */
export async function filterExistingSlugs(
  slugs: string[]
): Promise<Set<string>> {
  if (slugs.length === 0) return new Set();

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("invitations")
      .select("slug")
      .in("slug", slugs);

    if (error) {
      console.error("[invitations] Gagal memeriksa slug contoh:", error.message);
      return new Set();
    }

    return new Set((data ?? []).map((row) => row.slug as string));
  } catch (error) {
    console.error("[invitations] Supabase tidak tersedia:", error);
    return new Set();
  }
}
/** Kolom yang dibutuhkan untuk daftar undangan di dashboard admin. */
export type InvitationSummary = Pick<
  InvitationRow,
  "id" | "slug" | "theme_id" | "tier" | "groom_data" | "bride_data" | "created_at"
>;

/**
 * Daftar undangan terbaru untuk dashboard admin.
 * Error dikembalikan (bukan dilempar) agar form pembuatan undangan tetap
 * bisa dipakai walau query daftarnya gagal.
 */
export async function getInvitations(limit = 20): Promise<{
  data: InvitationSummary[];
  error: string | null;
}> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("invitations")
      .select("id, slug, theme_id, tier, groom_data, bride_data, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as InvitationSummary[], error: null };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "Supabase tidak tersedia.",
    };
  }
}

/** Kode error Postgres untuk pelanggaran unique constraint. */
const UNIQUE_VIOLATION = "23505";

/** Batas percobaan penomoran slug sebelum menyerah ke akhiran acak. */
const MAX_SLUG_ATTEMPTS = 100;

/**
 * Mengubah slug dasar menjadi slug yang belum terpakai.
 *
 * "budi-ani" → "budi-ani" bila belum ada, atau "budi-ani-1", "budi-ani-2", dan
 * seterusnya bila sudah.
 *
 * Semua kandidat diperiksa lewat SATU query `LIKE 'budi-ani%'`, bukan satu query
 * per kandidat. Selain jauh lebih hemat, ini juga menghindari 100 bolak-balik ke
 * database untuk nama yang kebetulan populer. Pola itu ikut menjaring slug lain
 * yang berawalan sama (mis. "budi-anita"), dan itu tidak masalah — yang dipakai
 * hanya keanggotaan himpunan untuk kandidat yang bentuknya persis.
 *
 * BUKAN pengganti unique constraint di database. Dua admin yang menyimpan nama
 * yang sama pada saat bersamaan tetap bisa lolos dari pemeriksaan ini (race
 * condition), dan constraint-lah yang menangkapnya — `insertInvitation()` sudah
 * menerjemahkan `23505` menjadi pesan yang bisa dibaca manusia.
 *
 * Memakai anon key: RLS mengizinkan SELECT publik di `invitations`, jadi tidak
 * perlu menaikkan hak akses hanya untuk membaca daftar slug.
 */
export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("invitations")
      .select("slug")
      .like("slug", `${baseSlug}%`);

    if (error) {
      console.error("[slug] Gagal memeriksa slug terpakai:", error.message);
      // Biarkan unique constraint yang menjadi penjaga terakhir.
      return baseSlug;
    }

    const taken = new Set((data ?? []).map((row) => row.slug as string));

    if (!taken.has(baseSlug)) return baseSlug;

    for (let index = 1; index <= MAX_SLUG_ATTEMPTS; index += 1) {
      const candidate = `${baseSlug}-${index}`;
      if (!taken.has(candidate)) return candidate;
    }

    // Lebih dari 100 undangan dengan nama yang sama persis. Akhiran waktu
    // menjaga slug tetap unik tanpa membuat loop-nya tumbuh tanpa batas.
    return `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  } catch (error) {
    console.error("[slug] Supabase tidak tersedia:", error);
    return baseSlug;
  }
}

/**
 * Menyimpan undangan baru.
 *
 * `theme_config` dikirim bila admin mengisi data budaya (tradisi & daerah);
 * bila tidak ada, kolom JSONB memakai default `{}` dari database. `payment_data`
 * ikut dikirim karena form admin sudah bisa mengisi rekening amplop digital.
 *
 * Memakai service role, satu-satunya jalan menulis ke `invitations` setelah RLS
 * aktif. Dulu ada fallback senyap ke anon key di sini; itu dihapus dengan
 * sengaja — sekarang kunci yang belum diisi menghasilkan pesan yang menyebut
 * nama env var-nya, bukan error RLS yang membingungkan.
 *
 * Mengembalikan pesan error yang sudah manusiawi, atau `null` bila berhasil.
 */
export async function insertInvitation(
  payload: Pick<
    InvitationRow,
    | "slug"
    | "tier"
    | "theme_id"
    | "groom_data"
    | "bride_data"
    | "event_data"
    | "payment_data"
    | "theme_config"
    | "music_url"
  >
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("invitations").insert(payload);

    if (!error) return { error: null };

    if (error.code === UNIQUE_VIOLATION) {
      return {
        error: `Slug "${payload.slug}" sudah dipakai. Gunakan slug lain.`,
      };
    }

    return { error: error.message };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Supabase tidak tersedia.",
    };
  }
}
