"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getEventLabel } from "@/config/events";
import { TIERS, canUseTheme, getTierFeatures } from "@/config/themes";
import type { TierType } from "@/config/themes";
import { requireAdmin } from "@/lib/auth-session";
import type {
  CreateInvitationState,
  RsvpFormState,
} from "@/lib/form-state";
import {
  MAX_CHILD_OF_LENGTH,
  MAX_PAYMENT_ACCOUNTS,
  MAX_QUOTE_LENGTH,
  MAX_STORY_ITEMS,
  MAX_STORY_TEXT_LENGTH,
  MAX_STORY_TITLE_LENGTH,
} from "@/lib/form-state";
import {
  deleteInvitationRow,
  ensureUniqueSlug,
  getInvitationBySlug,
  insertInvitation,
  updateInvitationRow,
} from "@/lib/invitation";
import { generateSlugFromNames } from "@/lib/slug";
import { derivePalette } from "@/lib/palette-extract";
import { parseDerivedPalette, parseCustomColors, CUSTOM_COLOR_FIELDS } from "@/lib/palette";
import type { CustomColorOverride } from "@/lib/palette";
import { isMotifId } from "@/config/motifs";
import { deleteInvitationFiles } from "@/lib/storage-admin";
import { getSupabase } from "@/lib/supabase";
import type {
  InvitationRow,
  PaymentAccount,
  PaymentData,
  RsvpStatus,
  StoryItem,
  WeddingEvent,
} from "@/types/invitation";

/**
 * Isi undangan yang berasal dari form admin — semua kolom kecuali `slug`.
 *
 * `slug` dikecualikan karena hanya dibuat sekali saat undangan lahir; setelah
 * itu ia adalah alamat yang sudah tersebar ke tamu dan tidak boleh ikut berubah.
 */
type InvitationPayload = Pick<
  InvitationRow,
  | "tier"
  | "theme_id"
  | "groom_data"
  | "bride_data"
  | "event_data"
  | "payment_data"
  | "theme_config"
  | "music_url"
>;

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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/;

/** Nomor rekening / nomor HP e-wallet: angka dengan pemisah opsional. */
const ACCOUNT_NUMBER_PATTERN = /^\+?[\d][\d\s.-]{3,29}$/;

/**
 * Nama pengguna Instagram: huruf, angka, titik, dan garis bawah.
 * Tidak menerima "@" di depan maupun URL penuh — keduanya bentuk yang paling
 * sering ditempel admin, dan menerimanya berarti menyimpan nilai yang tidak
 * bisa dipakai `https://instagram.com/<username>`.
 */
const INSTAGRAM_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

/** Nama pengguna Instagram yang ditulis dengan "@" atau URL penuh. */
function normalizeInstagram(raw: string): string | null {
  if (!raw) return null;

  return (
    raw
      .trim()
      // "https://www.instagram.com/budi.ani/?hl=id" -> "budi.ani"
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .split(/[/?#]/)[0]
  );
}

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
 * Menyusun "Kisah Kami" dari baris-baris form admin.
 *
 * Baris yang ketiga kolomnya kosong dilewati; baris yang terisi sebagian
 * ditolak, karena tahap tanpa judul atau tanpa cerita hanya akan tampil sebagai
 * kartu kosong di undangan. Urutannya mengikuti urutan baris di form — itulah
 * urutan yang dilihat admin saat menyusunnya.
 */
function parseStoryItems(
  formData: FormData
): { items: StoryItem[]; error?: string } {
  const titles = readStringList(formData, "storyTitle");
  const dates = readStringList(formData, "storyDate");
  const texts = readStringList(formData, "storyText");

  const rowCount = Math.max(titles.length, dates.length, texts.length);
  const items: StoryItem[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const title = titles[index] ?? "";
    const date = dates[index] ?? "";
    const text = texts[index] ?? "";

    if (!title && !date && !text) continue;

    if (!title || !text) {
      return {
        items: [],
        error: `Kisah ke-${index + 1} belum lengkap. Isi judul dan ceritanya (tanggal boleh dikosongkan).`,
      };
    }

    if (title.length > MAX_STORY_TITLE_LENGTH) {
      return {
        items: [],
        error: `Judul kisah ke-${index + 1} terlalu panjang (maksimal ${MAX_STORY_TITLE_LENGTH} karakter).`,
      };
    }

    if (text.length > MAX_STORY_TEXT_LENGTH) {
      return {
        items: [],
        error: `Cerita ke-${index + 1} terlalu panjang (maksimal ${MAX_STORY_TEXT_LENGTH} karakter).`,
      };
    }

    items.push({
      title,
      ...(date ? { date } : {}),
      text,
    });
  }

  if (items.length > MAX_STORY_ITEMS) {
    return {
      items: [],
      error: `Maksimal ${MAX_STORY_ITEMS} tahap kisah per undangan.`,
    };
  }

  return { items };
}

/**
 * Menyusun isi kolom `theme_config` dari data adat + gambar acuan tema.
 *
 * Warna gambar dibaca SEKALI di sini, saat admin menyimpan — bukan saat tamu
 * membuka undangan. Hasilnya selalu sama untuk gambar yang sama, jadi
 * mengulanginya tiap kunjungan hanya menambah waktu tunggu tamu tanpa manfaat.
 *
 * KEGAGALAN MEMBACA WARNA TIDAK MENGGAGALKAN PENYIMPANAN. Gambar yang 404,
 * servernya lambat, atau isinya terlalu pucat menghasilkan `palette: null` —
 * undangan tetap tersimpan dan tampil dengan warna tema dasar. Gambarnya sendiri
 * tetap dicatat karena masih layak jadi latar sampul meski warnanya tak terbaca.
 *
 * `previous` adalah `theme_config` baris yang sedang disunting, dan hanya diisi
 * saat memperbarui. Selama gambarnya tidak berganti, palet yang sudah tersimpan
 * DIPAKAI ULANG — tidak dibaca ulang. Dua alasannya, dan yang pertama soal
 * benar, bukan soal cepat:
 *
 * 1. Membaca ulang membuat palet yang sudah jadi bergantung pada keberhasilan
 *    unduhan yang tidak ada hubungannya dengan yang sedang disunting. Storage
 *    yang lambat sedetik saat admin membetulkan salah ketik nama akan menghapus
 *    warna undangan diam-diam — dan pesannya tetap "berhasil diperbarui", jadi
 *    tidak ada yang tahu sampai ada tamu yang membukanya.
 * 2. Hasilnya toh selalu sama untuk gambar yang sama.
 *
 * Bila palet tersimpan belum ada (gambarnya pucat, atau unduhan sebelumnya
 * gagal), pembacaan tetap diulang — menyimpan sekali lagi menjadi cara admin
 * mencoba ulang tanpa perlu mengunggah gambarnya kembali.
 */
async function buildThemeConfig(
  tradition: string,
  region: string,
  backgroundUrl: string | undefined,
  previous?: Record<string, unknown>,
  motif?: string,
  customColors?: CustomColorOverride | null
): Promise<Record<string, unknown>> {
  const unchanged =
    backgroundUrl !== undefined && previous?.backgroundUrl === backgroundUrl;

  const stored = unchanged ? parseDerivedPalette(previous?.palette) : null;

  const palette = backgroundUrl
    ? (stored ?? (await derivePalette(backgroundUrl)))
    : null;

  return {
    ...(tradition ? { tradition, region } : {}),
    ...(backgroundUrl ? { backgroundUrl } : {}),
    ...(palette ? { palette } : {}),
    // Motif hanya ditulis bila memang dipilih. Kalau tidak, field-nya dihilang
    // supaya halaman ikut memakai motif bawaan tema — dan admin yang mengosongkan
    // pilihannya benar-benar kembali ke bawaan, bukan tersangkut di nilai lama.
    ...(motif ? { motif } : {}),
    ...(customColors ? { customColors } : {}),
  };
}

/**
 * Baca input warna manual dari form.
 *
 * Nama field mengikuti `CUSTOM_COLOR_FIELDS` dengan awalan `color_`, jadi
 * `color_accent` milik `accent`. Yang dikembalikan HANYA field yang diisi admin:
 * kotak kosong berarti "biarkan milik tema", dan itulah yang membuat admin bisa
 * menimpa satu warna tanpa mengetik ulang kelimanya.
 *
 * Nilai yang tidak bisa dibaca DIABAIKAN, bukan ditolak. Warna custom adalah
 * lapisan yang paling baru dan paling sering diubah; menolak penyimpanan
 * karena satu kotak berisi `rgb(...)` jauh lebih merusak daripada menampiknya
 * dan menyimpan sisa pilihan yang valid. Kontras tetap dijaga nanti oleh
 * `ensureReadableColors()`, jadi warna unchecked ini tidak bisa membuat teks tak
 * terbaca.
 */
function parseCustomColorFields(formData: FormData): CustomColorOverride | null {
  const raw: Record<string, unknown> = {};

  for (const { key } of CUSTOM_COLOR_FIELDS) {
    const value = readString(formData, `color_${key}`);
    if (value) raw[key] = value;
  }

  return parseCustomColors(raw);
}

/**
 * Membaca & memvalidasi seluruh field form undangan.
 *
 * Dipakai bersama oleh `createInvitation()` dan `updateInvitation()`. Sengaja
 * satu fungsi: dua salinan aturan validasi pasti akan berbeda cepat atau lambat,
 * dan yang lebih longgar akan menjadi pintu masuk data yang tidak valid.
 *
 * Yang TIDAK dihasilkan di sini adalah `slug` — hanya dibuat saat undangan baru,
 * dan tidak pernah ikut berubah saat diperbarui.
 *
 * `async` karena gambar acuan tema perlu diunduh untuk dibaca warnanya. Gambar
 * itu diunggah browser langsung ke Supabase lewat signed URL, jadi server hanya
 * menerima URL-nya — byte-nya harus diambil balik di sini.
 *
 * `previousThemeConfig` hanya diisi saat memperbarui; lihat `buildThemeConfig()`
 * untuk alasan palet lama dipertahankan.
 */
async function parseInvitationForm(
  formData: FormData,
  previousThemeConfig?: Record<string, unknown>
): Promise<{ payload: InvitationPayload } | { error: string }> {
  const tier = readString(formData, "tier") as TierType;
  const themeId = readString(formData, "themeId");
  const groomName = readString(formData, "groomName");
  const brideName = readString(formData, "brideName");
  const groomChildOf = readString(formData, "groomChildOf");
  const brideChildOf = readString(formData, "brideChildOf");
  const groomInstagram = readString(formData, "groomInstagram");
  const brideInstagram = readString(formData, "brideInstagram");
  const quote = readString(formData, "quote");
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
  const musicUrl = readString(formData, "musicUrl");
  const tradition = readString(formData, "tradition");
  const region = readString(formData, "region");
  const backgroundUrl = readString(formData, "backgroundUrl");
  const motif = readString(formData, "motif");
  const customColors = parseCustomColorFields(formData);

  if (!TIERS.includes(tier)) {
    return { error: "Paket tidak valid." };
  }

  const features = getTierFeatures(tier);

  // Gerbang paket: tema Premium/VIP tidak boleh dipasang di undangan Silver.
  if (!canUseTheme(tier, themeId)) {
    return { error: `Tema "${themeId}" tidak tersedia untuk paket ${tier}.` };
  }

  // Motif yang tidak dikenal ditolak eksplisit, karena `motif` dikirim lewat
  // select berisi pilihan tetap — tidak mungkin tidak sengaja kosong atau basi
  // seperti pada input warna bebas. Menolak memberi tahu admin kalau formnya
  // rusak, alih-alih diam-diam menyimpan nilai yang tidak berlaku.
  if (motif && !isMotifId(motif)) {
    return { error: "Motif ornamen tidak dikenal." };
  }

  if (groomName.length < 2 || brideName.length < 2) {
    return { error: "Nama kedua mempelai wajib diisi." };
  }

  const eventLabel = getEventLabel(eventName);

  if (!eventLabel) {
    return { error: "Jenis acara tidak valid." };
  }

  if (!DATE_PATTERN.test(eventDate)) {
    return { error: "Tanggal acara wajib diisi." };
  }

  if (!TIME_PATTERN.test(eventTime)) {
    return { error: "Waktu acara wajib diisi." };
  }

  if (venueName.length < 2 || address.length < 5) {
    return { error: "Nama tempat dan alamat acara wajib diisi." };
  }

  if (mapsUrl && !/^https?:\/\//.test(mapsUrl)) {
    return { error: "Link Maps harus dimulai dengan http:// atau https://" };
  }

  const groomPhoto = validatePhotoUrl(groomPhotoUrl, "Foto mempelai pria");
  if (groomPhoto.error) return { error: groomPhoto.error };

  const bridePhoto = validatePhotoUrl(bridePhotoUrl, "Foto mempelai wanita");
  if (bridePhoto.error) return { error: bridePhoto.error };

  const coverPhoto = validatePhotoUrl(coverPhotoUrl, "Foto sampul");
  if (coverPhoto.error) return { error: coverPhoto.error };

  // Kuota foto galeri ditentukan paket, bukan form — jadi dibaca dari config.
  const gallery = parseGalleryUrls(galleryUrlsRaw, features.maxPhotos);
  if (gallery.error) return { error: gallery.error };

  const music = validatePhotoUrl(musicUrl, "Musik latar");
  if (music.error) return { error: music.error };

  const background = validatePhotoUrl(backgroundUrl, "Gambar acuan tema");
  if (background.error) return { error: background.error };

  const payment = parsePaymentAccounts(formData);
  if (payment.error) return { error: payment.error };

  /**
   * Nama pengguna Instagram dinormalkan lebih dulu ("@nama" dan URL penuh
   * diterima), lalu divalidasi. Mengembalikan `undefined` bila tidak cocok,
   * supaya yang tampil di undangan selalu nama pengguna yang benar-benar bisa
   * dibuka — bukan teks apa adanya yang berakhir jadi tautan rusak.
   */
  const groomIg = normalizeInstagram(groomInstagram);
  const brideIg = normalizeInstagram(brideInstagram);

  if (groomInstagram && (!groomIg || !INSTAGRAM_PATTERN.test(groomIg))) {
    return {
      error: `Instagram mempelai pria tidak valid: "${groomInstagram}". Isi nama pengguna saja (mis. budi.santoso).`,
    };
  }

  if (brideInstagram && (!brideIg || !INSTAGRAM_PATTERN.test(brideIg))) {
    return {
      error: `Instagram mempelai wanita tidak valid: "${brideInstagram}". Isi nama pengguna saja (mis. ani.r).`,
    };
  }

  if (groomChildOf.length > MAX_CHILD_OF_LENGTH) {
    return {
      error: `Keterangan orang tua mempelai pria terlalu panjang (maksimal ${MAX_CHILD_OF_LENGTH} karakter).`,
    };
  }

  if (brideChildOf.length > MAX_CHILD_OF_LENGTH) {
    return {
      error: `Keterangan orang tua mempelai wanita terlalu panjang (maksimal ${MAX_CHILD_OF_LENGTH} karakter).`,
    };
  }

  if (quote.length > MAX_QUOTE_LENGTH) {
    return {
      error: `Kutipan pembuka terlalu panjang (maksimal ${MAX_QUOTE_LENGTH} karakter).`,
    };
  }

  const story = parseStoryItems(formData);
  if (story.error) return { error: story.error };

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

  const themeConfig = await buildThemeConfig(
    tradition,
    region,
    background.url,
    previousThemeConfig,
    motif,
    customColors
  );

  return {
    payload: {
      tier,
      theme_id: themeId,
      groom_data: {
        fullName: groomName,
        nickName: toNickName(groomName),
        ...(groomChildOf ? { childOf: groomChildOf } : {}),
        ...(groomPhoto.url ? { photo_url: groomPhoto.url } : {}),
        ...(groomIg ? { instagram: groomIg } : {}),
      },
      bride_data: {
        fullName: brideName,
        nickName: toNickName(brideName),
        ...(brideChildOf ? { childOf: brideChildOf } : {}),
        ...(bridePhoto.url ? { photo_url: bridePhoto.url } : {}),
        ...(brideIg ? { instagram: brideIg } : {}),
      },
      event_data: {
        events: [event],
        ...(quote ? { quote } : {}),
        ...(story.items.length > 0 ? { story: story.items } : {}),
        ...(coverPhoto.url ? { cover_photo_url: coverPhoto.url } : {}),
        ...(gallery.urls.length > 0 ? { gallery_urls: gallery.urls } : {}),
      },
      payment_data: paymentData,
      theme_config: themeConfig,
      // Musik hanya milik paket VIP. Ditegakkan di sini, bukan hanya dengan
      // menyembunyikan field-nya di form: Server Action bisa dipanggil lewat
      // POST langsung, jadi field yang tidak tampil tetap bisa dikirim.
      music_url: features.customMusic ? music.url ?? null : null,
    },
  };
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

  const parsed = await parseInvitationForm(formData);

  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }

  // Slug tidak lagi diketik admin: disusun dari nama mempelai, lalu diberi
  // nomor urut bila sudah terpakai. Form menampilkan pratinjaunya memakai
  // `generateSlugFromNames()` yang sama, jadi yang tampil = yang tersimpan
  // (kecuali nomor urut, yang baru diketahui setelah dicek ke database).
  const slug = await ensureUniqueSlug(
    generateSlugFromNames(
      parsed.payload.groom_data.fullName,
      parsed.payload.bride_data.fullName
    )
  );

  const { error } = await insertInvitation({ slug, ...parsed.payload });

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

/**
 * Memperbarui undangan yang sudah ada.
 *
 * Aturan validasinya sama persis dengan `createInvitation()` karena keduanya
 * memakai `parseInvitationForm()` — itulah alasan bagian validasi diangkat ke
 * satu fungsi bersama. Dua salinan aturan akan berbeda cepat atau lambat, dan
 * yang longgar akan menjadi pintu masuk data yang tidak valid.
 *
 * `slug` TIDAK ikut berubah. Tautannya sudah tersebar ke tamu lewat WhatsApp
 * dan tidak ada pengalihan di aplikasi ini, jadi mengganti slug sama dengan
 * mematikan semua undangan yang terlanjur dikirim.
 */
export async function updateInvitation(
  _prevState: CreateInvitationState,
  formData: FormData
): Promise<CreateInvitationState> {
  await requireAdmin();

  const slug = readString(formData, "slug");
  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    return { status: "error", message: "Undangan tidak ditemukan." };
  }

  const parsed = await parseInvitationForm(formData, invitation.theme_config);

  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }

  /**
   * Form admin hanya memuat SATU acara, sedangkan sebuah undangan bisa punya
   * akad + resepsi bila datanya dibuat dari luar aplikasi ini. Acara pertama
   * ditimpa, sisanya dipertahankan — menyimpan hasil form apa adanya akan
   * menghapus acara kedua tanpa pernah menampilkannya lebih dulu.
   */
  const existingEvents = invitation.event_data?.events ?? [];

  const { error } = await updateInvitationRow(invitation.id, {
    ...parsed.payload,
    event_data: {
      ...parsed.payload.event_data,
      events: [
        parsed.payload.event_data.events[0],
        ...existingEvents.slice(1),
      ],
    },
  });

  if (error) {
    return { status: "error", message: error };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/undangan/${slug}`);
  revalidatePath(`/${slug}`);

  return {
    status: "success",
    message: `Undangan "${slug}" berhasil diperbarui.`,
    slug,
  };
}

/**
 * Menghapus undangan beserta seluruh data & fotonya.
 *
 * Konfirmasinya berupa ketik-ulang slug, bukan sekadar dialog "yakin?".
 * Penghapusan di sini tidak bisa dibatalkan dan ikut membawa RSVP, ucapan, dan
 * daftar tamu — sebuah salah klik seharusnya tidak cukup untuk memicunya.
 */
export async function deleteInvitation(
  _prevState: CreateInvitationState,
  formData: FormData
): Promise<CreateInvitationState> {
  await requireAdmin();

  const slug = readString(formData, "slug");
  const confirmSlug = readString(formData, "confirmSlug");

  if (confirmSlug !== slug) {
    return {
      status: "error",
      message: `Ketik "${slug}" persis untuk mengonfirmasi penghapusan.`,
    };
  }

  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    return { status: "error", message: "Undangan tidak ditemukan." };
  }

  const { error } = await deleteInvitationRow(invitation.id);

  if (error) {
    return { status: "error", message: error };
  }

  // Foto dibersihkan SETELAH barisnya hilang. Urutan ini disengaja: berkas yang
  // tertinggal hanya memakan ruang, sedangkan baris yang tertinggal berarti
  // undangan yang tetap bisa dibuka padahal fotonya sudah lenyap.
  const cleanup = await deleteInvitationFiles(slug);

  if (cleanup.error) {
    console.error("[invitation] Sisa berkas gagal dihapus:", cleanup.error);
  }

  revalidatePath("/admin");
  revalidatePath(`/${slug}`);

  // Halaman pengelola undangan ini sudah tidak ada isinya lagi.
  redirect("/admin");
}
