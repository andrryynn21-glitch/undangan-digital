"use server";

import { revalidatePath } from "next/cache";

import { getEventLabel } from "@/config/events";
import { TIERS, canUseTheme, getTierFeatures } from "@/config/themes";
import type { TierType } from "@/config/themes";
import { requireAdmin } from "@/lib/auth-session";
import type {
  CreateInvitationState,
  RsvpFormState,
} from "@/lib/form-state";
import { MAX_PAYMENT_ACCOUNTS } from "@/lib/form-state";
import { getInvitationBySlug, insertInvitation } from "@/lib/invitation";
import { getSupabase } from "@/lib/supabase";
import type {
  PaymentAccount,
  PaymentData,
  RsvpStatus,
  WeddingEvent,
} from "@/types/invitation";

const RSVP_STATUSES: RsvpStatus[] = ["attending", "declined"];

const MAX_HEADCOUNT = 20;

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Membaca field yang muncul berkali-kali dengan nama sama (baris rekening di
 * form admin). Panjang array-nya mengikuti jumlah input yang dikirim browser.
 */
function readStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""));
}

/**
 * Menyimpan RSVP tamu ke tabel `rsvps`.
 *
 * Tabel `rsvps` hanya menyediakan kolom `guest_name`, `status`, dan `headcount`,
 * jadi hanya itu yang dikirim. Relasinya lewat `invitation_id`, sehingga
 * undangan diambil dulu berdasarkan slug.
 *
 * Server Action bisa dipanggil langsung lewat POST tanpa melewati UI, jadi
 * paket undangan diverifikasi ulang dari database di sini — bukan dipercaya
 * dari props komponen klien.
 */
export async function submitRsvp(
  _prevState: RsvpFormState,
  formData: FormData
): Promise<RsvpFormState> {
  const slug = readString(formData, "slug");
  const guestName = readString(formData, "guestName");
  const status = readString(formData, "status") as RsvpStatus;
  const headcount = Number(readString(formData, "headcount") || "1");
  const message = readString(formData, "message");

  if (!slug) {
    return { status: "error", message: "Undangan tidak dikenali." };
  }

  if (guestName.length < 2) {
    return { status: "error", message: "Nama tamu wajib diisi." };
  }

  if (!RSVP_STATUSES.includes(status)) {
    return { status: "error", message: "Pilih konfirmasi kehadiran." };
  }

  if (!Number.isInteger(headcount) || headcount < 1 || headcount > MAX_HEADCOUNT) {
    return {
      status: "error",
      message: `Jumlah tamu harus antara 1 sampai ${MAX_HEADCOUNT} orang.`,
    };
  }

  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    return { status: "error", message: "Undangan tidak ditemukan." };
  }

  // Gerbang paket: Silver tidak menyimpan RSVP ke database.
  if (!getTierFeatures(invitation.tier).rsvpToDb) {
    return {
      status: "error",
      message: "Fitur RSVP tidak tersedia pada paket undangan ini.",
    };
  }

  const supabase = getSupabase();

  const { error } = await supabase.from("rsvps").insert({
    invitation_id: invitation.id,
    guest_name: guestName,
    status,
    headcount,
  });

  if (error) {
    console.error("[rsvp] Gagal menyimpan:", error.message);
    return {
      status: "error",
      message: "Gagal menyimpan konfirmasi. Silakan coba lagi.",
    };
  }

  // Ucapan disimpan di tabel terpisah (`wishes`) karena `rsvps` tidak punya
  // kolom pesan. Kegagalan di sini tidak membatalkan RSVP yang sudah tersimpan.
  if (message) {
    const { error: wishError } = await supabase.from("wishes").insert({
      invitation_id: invitation.id,
      sender_name: guestName,
      message,
    });

    if (wishError) {
      console.error("[rsvp] Ucapan gagal disimpan:", wishError.message);
    }
  }

  revalidatePath(`/${slug}`);

  return {
    status: "success",
    message: "Terima kasih, konfirmasi kehadiran Anda sudah kami terima.",
  };
}

// ============================================
// Admin: membuat undangan baru
// ============================================

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/;

/** Nomor rekening / nomor HP e-wallet: angka dengan pemisah opsional. */
const ACCOUNT_NUMBER_PATTERN = /^\+?[\d][\d\s.-]{3,29}$/;

/** Nama panggilan diambil dari kata pertama nama lengkap. */
function toNickName(fullName: string): string {
  return fullName.split(/\s+/)[0];
}

/**
 * Memvalidasi URL foto opsional.
 * Mengembalikan `undefined` bila kosong (field tidak akan ditulis ke JSONB),
 * atau pesan error bila formatnya bukan http/https.
 */
function validatePhotoUrl(
  value: string,
  label: string
): { url?: string; error?: string } {
  if (!value) return {};

  if (!HTTP_URL_PATTERN.test(value)) {
    return {
      error: `${label} harus berupa URL yang dimulai dengan http:// atau https://`,
    };
  }

  return { url: value };
}

/**
 * Memvalidasi URL foto galeri yang dikirim form admin.
 *
 * Form mengirim satu field `galleryUrls` per foto (hasil unggah ke Supabase
 * Storage), jadi di sini cukup memeriksa bentuk URL-nya. Validasi tetap
 * dijalankan meski URL-nya dibuat sendiri oleh aplikasi, karena Server Action
 * bisa dipanggil dengan POST langsung tanpa melewati UI.
 */
function parseGalleryUrls(
  raw: string[],
  maxPhotos: number
): { urls: string[]; error?: string } {
  const urls = raw.map((url) => url.trim()).filter((url) => url.length > 0);

  const invalid = urls.find((url) => !HTTP_URL_PATTERN.test(url));

  if (invalid) {
    return {
      urls: [],
      error: `URL galeri tidak valid: "${invalid}". Gunakan URL http:// atau https://`,
    };
  }

  if (urls.length > maxPhotos) {
    return {
      urls: [],
      error: `Paket ini hanya mengizinkan ${maxPhotos} foto galeri, sedangkan Anda mengirim ${urls.length}.`,
    };
  }

  return { urls };
}

/**
 * Menyusun daftar rekening dari baris-baris form admin.
 *
 * Baris yang ketiga kolomnya kosong dianggap baris kosong dan dilewati (agar
 * admin bisa menyisakan baris tambahan tanpa error). Baris yang terisi
 * sebagian ditolak supaya tidak ada rekening setengah jadi tersimpan.
 */
function parsePaymentAccounts(
  formData: FormData
): { accounts: PaymentAccount[]; error?: string } {
  const banks = readStringList(formData, "bankName");
  const numbers = readStringList(formData, "accountNumber");
  const holders = readStringList(formData, "accountHolder");

  const rowCount = Math.max(banks.length, numbers.length, holders.length);
  const accounts: PaymentAccount[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const bank = banks[index] ?? "";
    const number = numbers[index] ?? "";
    const holder = holders[index] ?? "";

    if (!bank && !number && !holder) continue;

    if (!bank || !number || !holder) {
      return {
        accounts: [],
        error: `Rekening ke-${index + 1} belum lengkap. Isi nama bank/e-wallet, nomor, dan nama pemilik.`,
      };
    }

    if (!ACCOUNT_NUMBER_PATTERN.test(number)) {
      return {
        accounts: [],
        error: `Nomor rekening ke-${index + 1} tidak valid. Gunakan angka (boleh dengan spasi atau tanda hubung).`,
      };
    }

    accounts.push({ bank, number, holder });
  }

  if (accounts.length > MAX_PAYMENT_ACCOUNTS) {
    return {
      accounts: [],
      error: `Maksimal ${MAX_PAYMENT_ACCOUNTS} rekening per undangan.`,
    };
  }

  return { accounts };
}

/**
 * Membuat undangan baru di tabel `invitations`.
 *
 * KEAMANAN: `requireAdmin()` dipanggil di baris pertama, bukan hanya diandalkan
 * pada `proxy.ts`. Dokumentasi Next menegaskan proxy bukan lapis otorisasi —
 * "Always verify authentication and authorization inside each Server Function"
 * — karena Server Action bisa dipanggil lewat POST langsung tanpa melewati UI,
 * dan cakupan proxy bisa hilang bila matcher-nya diubah. Penulisan barisnya
 * sendiri memakai service role, sementara RLS menutup jalur anon key.
 */
export async function createInvitation(
  _prevState: CreateInvitationState,
  formData: FormData
): Promise<CreateInvitationState> {
  await requireAdmin();

  const slug = readString(formData, "slug").toLowerCase();
  const tier = readString(formData, "tier") as TierType;
  const themeId = readString(formData, "themeId");
  const groomName = readString(formData, "groomName");
  const brideName = readString(formData, "brideName");
  const eventName = readString(formData, "eventName");
  const eventDate = readString(formData, "eventDate");
  const eventTime = readString(formData, "eventTime");
  const venueName = readString(formData, "venueName");
  const address = readString(formData, "address");
  const mapsUrl = readString(formData, "mapsUrl");
  const groomPhotoUrl = readString(formData, "groomPhotoUrl");
  const bridePhotoUrl = readString(formData, "bridePhotoUrl");
  const coverPhotoUrl = readString(formData, "coverPhotoUrl");
  const galleryUrlsRaw = readStringList(formData, "galleryUrls");

  if (!SLUG_PATTERN.test(slug) || slug.length < 3 || slug.length > 60) {
    return {
      status: "error",
      message:
        "Slug hanya boleh huruf kecil, angka, dan tanda hubung. Contoh: budi-ani",
    };
  }

  if (!TIERS.includes(tier)) {
    return { status: "error", message: "Paket tidak valid." };
  }

  // Gerbang paket: tema Premium/VIP tidak boleh dipasang di undangan Silver.
  if (!canUseTheme(tier, themeId)) {
    return {
      status: "error",
      message: `Tema "${themeId}" tidak tersedia untuk paket ${tier}.`,
    };
  }

  if (groomName.length < 2 || brideName.length < 2) {
    return {
      status: "error",
      message: "Nama kedua mempelai wajib diisi.",
    };
  }

  const eventLabel = getEventLabel(eventName);

  if (!eventLabel) {
    return { status: "error", message: "Jenis acara tidak valid." };
  }

  if (!DATE_PATTERN.test(eventDate)) {
    return { status: "error", message: "Tanggal acara wajib diisi." };
  }

  if (!TIME_PATTERN.test(eventTime)) {
    return { status: "error", message: "Waktu acara wajib diisi." };
  }

  if (venueName.length < 2 || address.length < 5) {
    return {
      status: "error",
      message: "Nama tempat dan alamat acara wajib diisi.",
    };
  }

  if (mapsUrl && !/^https?:\/\//.test(mapsUrl)) {
    return {
      status: "error",
      message: "Link Maps harus dimulai dengan http:// atau https://",
    };
  }

  const groomPhoto = validatePhotoUrl(groomPhotoUrl, "Foto mempelai pria");
  if (groomPhoto.error) {
    return { status: "error", message: groomPhoto.error };
  }

  const bridePhoto = validatePhotoUrl(bridePhotoUrl, "Foto mempelai wanita");
  if (bridePhoto.error) {
    return { status: "error", message: bridePhoto.error };
  }

  const coverPhoto = validatePhotoUrl(coverPhotoUrl, "Foto sampul");
  if (coverPhoto.error) {
    return { status: "error", message: coverPhoto.error };
  }

  // Kuota foto galeri ditentukan paket, bukan form — jadi dibaca dari config.
  const gallery = parseGalleryUrls(
    galleryUrlsRaw,
    getTierFeatures(tier).maxPhotos
  );
  if (gallery.error) {
    return { status: "error", message: gallery.error };
  }

  const payment = parsePaymentAccounts(formData);
  if (payment.error) {
    return { status: "error", message: payment.error };
  }

  const event: WeddingEvent = {
    name: eventName,
    label: eventLabel,
    date: eventDate,
    // Disimpan dengan gaya penulisan Indonesia + zona waktu eksplisit,
    // sesuai yang diharapkan `parseEventStart()`.
    startTime: `${eventTime.replace(":", ".")} WIB`,
    venueName,
    address,
    ...(mapsUrl ? { mapsUrl } : {}),
  };

  const paymentData: PaymentData =
    payment.accounts.length > 0 ? { accounts: payment.accounts } : {};

  const { error } = await insertInvitation({
    slug,
    tier,
    theme_id: themeId,
    groom_data: {
      fullName: groomName,
      nickName: toNickName(groomName),
      ...(groomPhoto.url ? { photo_url: groomPhoto.url } : {}),
    },
    bride_data: {
      fullName: brideName,
      nickName: toNickName(brideName),
      ...(bridePhoto.url ? { photo_url: bridePhoto.url } : {}),
    },
    event_data: {
      events: [event],
      ...(coverPhoto.url ? { cover_photo_url: coverPhoto.url } : {}),
      ...(gallery.urls.length > 0 ? { gallery_urls: gallery.urls } : {}),
    },
    payment_data: paymentData,
    music_url: null,
  });

  if (error) {
    return { status: "error", message: error };
  }

  revalidatePath("/admin");
  revalidatePath(`/${slug}`);

  return {
    status: "success",
    message: `Undangan "${slug}" berhasil dibuat.`,
    slug,
  };
}
