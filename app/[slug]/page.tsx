import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";

import CountdownTimer from "@/components/invitation/CountdownTimer";
import CoupleProfile from "@/components/invitation/CoupleProfile";
import CoverGate from "@/components/invitation/CoverGate";
import DigitalGift from "@/components/invitation/DigitalGift";
import EventDetails from "@/components/invitation/EventDetails";
import LoveStory from "@/components/invitation/LoveStory";
import PhotoGallery from "@/components/invitation/PhotoGallery";
import RsvpForm from "@/components/invitation/RsvpForm";
import Rundown from "@/components/invitation/Rundown";
import { Section } from "@/components/invitation/Section";
import ShareBar from "@/components/invitation/ShareBar";
import WishBook from "@/components/invitation/WishBook";
import {
  Backdrop,
  Divider,
  PetalLayer,
  ThemedHeading,
  getDecorLevel,
} from "@/components/invitation/decor";
import type { Design } from "@/components/invitation/decor";
import { resolveMotifId } from "@/config/motifs";
import {
  getThemeConfig,
  getThemeCssVars,
  getTierFeatures,
} from "@/config/themes";
import type { ThemeConfig } from "@/config/themes";
import type { NavItem } from "@/components/invitation/NavDock";
import {
  applyCulturalOverride,
  applyCustomColorOverride,
  applyPaletteOverride,
  ensureReadableTheme,
  parseCulturalData,
  parseMotifSelection,
  parseThemeImageData,
} from "@/lib/culture-theme";
import { parseCustomColors } from "@/lib/palette";
import { WISH_DISPLAY_LIMIT } from "@/config/tiers";
import { formatEventDate, getCalendarRange, getCountdownEvent } from "@/lib/date";
import {
  getInvitationBySlug,
  getWishes,
  resolveGuestName,
} from "@/lib/invitation";
import type { InvitationRow } from "@/types/invitation";

/** Tabel `invitations` tidak punya kolom judul, jadi teksnya tetap di sini. */
const INVITATION_TITLE = "Undangan Pernikahan";

/**
 * Halaman ini membaca `?to=` untuk menyapa tamu dengan namanya.
 *
 * `force-dynamic` karena itu WAJIB, bukan sekadar kehati-hatian: tanpa ini Next
 * boleh menyajikan hasil render yang sama untuk semua pengunjung, dan tamu
 * kedua akan melihat "Kepada Yth." atas nama tamu pertama.
 */
export const dynamic = "force-dynamic";

/** Mengambil nilai `?to=` dari searchParams yang bisa berupa array. */
function readGuestToken(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Metadata per undangan — inilah yang dilihat orang saat tautannya dibagikan.
 *
 * Sebelum ini halaman undangan mewarisi metadata root, sehingga setiap tautan
 * yang dikirim ke WhatsApp tampil sebagai URL polos tanpa nama, tanggal, maupun
 * foto. Untuk produk yang distribusinya lewat WhatsApp, itu kerugian nyata.
 *
 * `getInvitationBySlug()` sudah dibungkus `cache()`, jadi pemanggilan di sini
 * dan di komponen halaman berbagi satu query yang sama.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  // Kegagalan Supabase tidak boleh menggagalkan seluruh halaman hanya karena
  // judulnya tidak bisa disusun; komponen halaman yang menentukan nasibnya.
  const invitation = await getInvitationBySlug(slug).catch(() => null);

  if (!invitation) {
    return { title: "Undangan tidak ditemukan" };
  }

  const groom = invitation.groom_data;
  const bride = invitation.bride_data;
  const couple = `${groom.nickName} & ${bride.nickName}`;
  const mainEvent = invitation.event_data?.events?.[0];

  const description = mainEvent
    ? `${formatEventDate(mainEvent.date)} · ${mainEvent.venueName}. Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu berkenan hadir.`
    : `Undangan pernikahan ${groom.fullName} & ${bride.fullName}.`;

  // Gambar pratinjaunya TIDAK disebut di sini. Itu tugas
  // `app/[slug]/opengraph-image.tsx`: Next menuliskan sendiri `og:image`
  // beserta `type`, `width`, dan `height`-nya. Menyebutkan `images` di sini
  // justru menghasilkan dua `og:image` yang saling bersaing.
  return {
    title: couple,
    description,
    // Undangan bersifat privat — tidak pantas muncul di hasil pencarian.
    // Ini tidak mempengaruhi pratinjau WhatsApp: perayapnya mengambil tag
    // Open Graph tanpa menghiraukan `robots`.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: "Undangan Digital",
      url: `/${slug}`,
      title: `${couple} — ${INVITATION_TITLE}`,
      description,
    },
    twitter: {
      // Selalu kartu besar: rute `opengraph-image` menjamin selalu ada gambar
      // 1200x630, baik dari foto sampul maupun kartu teks cadangan.
      card: "summary_large_image",
      title: `${couple} — ${INVITATION_TITLE}`,
      description,
    },
  };
}

/**
 * Tema akhir sebuah undangan: tema dasar → warna dari gambar acuan → override adat.
 *
 * Dipakai halaman ini DAN `generateViewport` di bawah, jadi urutan override-nya
 * hanya ada di satu tempat. Kalau disalin, warna bilah peramban di HP bisa
 * berbeda dari warna undangannya sendiri begitu salah satu salinan disesuaikan.
 */
function resolveTheme(invitation: InvitationRow): ThemeConfig {
  const baseTheme = getThemeConfig(invitation.theme_id);

  // Empat lapis, dan URUTANNYA DISENGAJA:
  // 1. warna gambar acuan (gambar gelap → kanvas gelap),
  // 2. override adat (menang atas gambar karena alasan budaya),
  // 3. warna manual yang dipilih admin (menang atas semua, karena itu pilihan
  //    paling eksplisit),
  // 4. koreksi kontras terakhir untuk SEMUA warna yang muncul di 1-3.
  //
  // Lapis 3 duduk SETELAH 1 dan 2, bukan sebelumnya, supaya pilihan admin
  // benar-benar yang terakhir. Sebaliknya, admin yang memilih "Jade" akan kaget
  // melihat warna hijaunya ditimpa hijau muda budayanya.
  //
  // Lapis 4 harus paling akhir: override adat menimpa `primary`/`accent` dengan
  // warna budayanya sendiri, dan warna-warna itu belum pernah diuji kontrasnya.
  // Tanpa lapis 4, tema dasar "Minimal Gold" bahkan keluar dengan emas di krem
  // pada rasio 2,38:1 — heading nyaris tak terbaca. Warna pilihan admin punya
  // risiko yang persis sama: admin bebas mengetik apa saja, termasuk warna
  // yang membuat teksnya hilang.
  //
  // Undangan lama yang `theme_config`-nya `{}` melewati 1-3 tanpa perubahan, tapi
  // tetap mendapat manfaat lapis 4.
  return ensureReadableTheme(
    applyCustomColorOverride(
      applyCulturalOverride(
        applyPaletteOverride(
          baseTheme,
          parseThemeImageData(invitation.theme_config).palette
        ),
        parseCulturalData(invitation.theme_config)
      ),
      parseCustomColors(invitation.theme_config?.customColors)
    )
  );
}

/**
 * Warna bilah alamat peramban di HP.
 *
 * Ini detail kecil yang terasa besar di perangkat seluler: saat tamu menggulir
 * sampai ujung, atau saat ia membuka daftar tab, warna bilahnya ikut warna
 * undangan dan bukan abu-abu bawaan. Nilainya dibaca dari tema undangan, jadi
 * tidak perlu diatur per undangan.
 */
export async function generateViewport({
  params,
}: PageProps<"/[slug]">): Promise<Viewport> {
  const { slug } = await params;
  const invitation = await getInvitationBySlug(slug).catch(() => null);

  return {
    width: "device-width",
    initialScale: 1,
    // Tamu boleh mencubit untuk memperbesar foto; mengunci skala akan
    // menyulitkannya membaca, dan itu pelanggaran aksesibilitas.
    maximumScale: 5,
    colorScheme: "light",
    themeColor: invitation
      ? resolveTheme(invitation).colors.background
      : undefined,
  };
}

export default async function InvitationPage({
  params,
  searchParams,
}: PageProps<"/[slug]">) {
  const { slug } = await params;

  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    notFound();
  }

  const features = getTierFeatures(invitation.tier);
  const theme = resolveTheme(invitation);
  const themeImage = parseThemeImageData(invitation.theme_config);

  // Banyaknya ornamen ditentukan paket; bentuk, motif, dan warnanya oleh tema
  // dan pilihan admin.
  const level = getDecorLevel(invitation.tier);

  /**
   * Motif yang benar-benar dipakai untuk undangan ini.
   *
   * Urutannya: pilihan admin di form → motif bawaan tema → motif bawaan
   * menurut bentuk bingkai. Baris lama yang `theme_config`-nya belum punya
   * `motif` tetap dapat hasil yang masuk akal, dan tema yang `defaultMotif`-nya
   * belum diisi tidak pernah membuat halaman kosong.
   */
  const motif = resolveMotifId(
    parseMotifSelection(invitation.theme_config),
    theme.defaultMotif
  );

  // Satu objek untuk semua komponen, supaya motif baru tidak perlu di-drill
  // ke sebelas call site.
  const design: Design = {
    frameStyle: theme.frameStyle,
    level,
    motif,
  };
  const frameStyle = design.frameStyle;

  // Ucapan dicari lewat `invitation_id`, bukan slug. Batas jumlahnya dibagi
  // dengan tabel perbandingan di /paket agar keduanya tidak pernah beda angka.
  const wishes = await getWishes(
    invitation.id,
    WISH_DISPLAY_LIMIT[invitation.tier]
  );

  // Sapaan personal. Tautan tanpa `?to=` menghasilkan string kosong, dan
  // undangan tampil persis seperti sebelum fitur ini ada.
  const guestName = await resolveGuestName(
    invitation.id,
    readGuestToken((await searchParams).to)
  );

  const groom = invitation.groom_data;
  const bride = invitation.bride_data;
  const events = invitation.event_data?.events ?? [];
  const quote = invitation.event_data?.quote;
  const coverPhotoUrl = invitation.event_data?.cover_photo_url;
  const story = invitation.event_data?.story ?? [];
  const rundown = invitation.event_data?.rundown ?? [];
  const galleryUrls = invitation.event_data?.gallery_urls ?? [];
  const accounts = invitation.payment_data?.accounts ?? [];
  const countdown = getCountdownEvent(events);

  /**
   * Bagian yang benar-benar ada di undangan ini, berurutan dari atas — inilah
   * yang menjadi tombol navigasi mengambang.
   *
   * Daftarnya disusun di sini, bukan di dalam komponen navigasi, karena hanya
   * halaman ini yang tahu bagian mana yang jadi dirender: galeri hanya muncul
   * bila ada fotonya, amplop digital hanya bila ada rekeningnya, dan kisah
   * hanya bila pasangan mengisinya. Tombol yang menunjuk bagian kosong lebih
   * buruk daripada tidak ada tombol sama sekali.
   */
  const navItems: NavItem[] = [
    { id: "pembuka", label: "Awal", icon: "home" },
    { id: "mempelai", label: "Mempelai", icon: "couple" },
    ...(story.length > 0
      ? [{ id: "kisah", label: "Kisah", icon: "story" as const }]
      : []),
    { id: "acara", label: "Acara", icon: "event" },
    ...(rundown.length > 0
      ? [{ id: "susunan", label: "Susunan", icon: "rundown" as const }]
      : []),
    ...(galleryUrls.length > 0
      ? [{ id: "galeri", label: "Galeri", icon: "gallery" as const }]
      : []),
    { id: "rsvp", label: "RSVP", icon: "rsvp" },
    ...(accounts.length > 0
      ? [{ id: "hadiah", label: "Hadiah", icon: "gift" as const }]
      : []),
    { id: "ucapan", label: "Ucapan", icon: "wish" },
  ];

  // Tanggal untuk sampul diformat di server supaya hasilnya sama di browser.
  const mainEvent = events[0];
  const coverDateText = mainEvent?.date
    ? formatEventDate(mainEvent.date)
    : undefined;

  // Rentang waktu untuk tombol "tambah ke kalender" di penutup undangan.
  const calendarRange = mainEvent ? getCalendarRange(mainEvent) : null;

  // Foto sampul dipakai ulang sebagai foto hero; bentuknya mengikuti tema.
  const heroFrameClass =
    frameStyle === "arch"
      ? "rounded-t-[13rem] rounded-b-[2rem]"
      : frameStyle === "floral"
        ? "rounded-[2.5rem]"
        : "rounded-[1.25rem]";

  return (
    <main
      className="inv-page min-h-screen w-full"
      // Mode kanvas dibaca CSS untuk menyetel permukaan, border, dan kaca.
      // Nilai ini dihitung di `lib/palette.ts` dari terang/gelapnya gambar
      // acuan, jadi tidak pernah bertentangan dengan warna yang terpasang.
      data-theme-canvas={theme.colors.canvas?.mode ?? "light"}
      style={
        {
          ...getThemeCssVars(theme),
          backgroundColor: "var(--theme-background)",
          color: "var(--theme-text)",
          fontFamily: "var(--theme-font-body)",
        } as CSSProperties
      }
    >
      {/* Latar berlapis: gradasi tema + pola motif + tekstur kertas */}
      <Backdrop
        design={design}
        backgroundUrl={themeImage.backgroundUrl}
      />

      {/* Serpih motif yang jatuh DI DEPAN semuanya — satu-satunya lapisan
          dekorasi yang tidak di belakang teks. Ditaruh di sini, sebagai
          saudara `CoverGate` dan bukan di dalamnya, karena posisinya `fixed`
          dan harus tetap melintas saat sampul sudah dibuka. */}
      <PetalLayer design={design} />

      <CoverGate
        groomName={groom.nickName}
        brideName={bride.nickName}
        eyebrow={INVITATION_TITLE}
        dateText={coverDateText}
        coverPhotoUrl={coverPhotoUrl}
        backgroundUrl={themeImage.backgroundUrl}
        coverLuminance={themeImage.palette?.luminance}
        guestName={guestName}
        // Musik hanya untuk paket yang memang menjanjikannya.
        musicUrl={features.customMusic ? invitation.music_url : null}
        sections={navItems}
        design={design}
      >
        {/* Pembuka */}
        <Section id="pembuka" design={design}>
          <div className="flex flex-col items-center gap-7 text-center">
            <p className="text-[0.68rem] tracking-[0.35em] uppercase opacity-65">
              {INVITATION_TITLE}
            </p>

            <ThemedHeading
              as="h1"
              level={level}
              className="text-4xl leading-tight sm:text-5xl"
            >
              {groom.fullName}
              <span
                className="my-2 block text-2xl opacity-60"
                style={{ color: "var(--theme-accent)" }}
              >
                &amp;
              </span>
              {bride.fullName}
            </ThemedHeading>

            <Divider design={design} />

            {coverPhotoUrl ? (
              <span
                className={`inv-sheen relative block w-full max-w-sm overflow-hidden ${heroFrameClass}`}
                style={{
                  aspectRatio: frameStyle === "arch" ? "3 / 4" : "4 / 3",
                  boxShadow:
                    "0 42px 70px -40px color-mix(in srgb, var(--theme-text) 80%, transparent)",
                }}
              >
                <Image
                  src={coverPhotoUrl}
                  alt={`${groom.nickName} & ${bride.nickName}`}
                  fill
                  sizes="(min-width: 640px) 24rem, 100vw"
                  // URL diisi bebas oleh admin — optimasi gambar dilewati agar
                  // host baru tidak perlu didaftarkan di `images.remotePatterns`.
                  unoptimized
                  className="object-cover"
                />
              </span>
            ) : null}

            {quote ? (
              // Kutipan pembuka (ayat / kata mutiara). Tanda petiknya digambar
              // besar dan pudar di sudut supaya terbaca sebagai kutipan, bukan
              // sebagai paragraf biasa yang kebetulan miring.
              <figure className="inv-glass inv-sheen relative max-w-md rounded-3xl px-7 py-8">
                <span
                  className="pointer-events-none absolute top-2 left-4 text-5xl leading-none opacity-20"
                  style={{
                    fontFamily: "var(--theme-font-heading)",
                    color: "var(--theme-primary)",
                  }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                <blockquote className="relative text-sm leading-relaxed italic opacity-85">
                  {quote}
                </blockquote>
              </figure>
            ) : null}
          </div>
        </Section>

        {/* Profil mempelai */}
        <Section
          id="mempelai"
          design={design}
          eyebrow="Bismillahirrahmanirrahim"
          title="Kedua Mempelai"
          subtitle="Dengan memohon rahmat dan ridho Allah, kami bermaksud menyelenggarakan pernikahan putra-putri kami."
          width="wide"
        >
          <CoupleProfile
            groom={groom}
            bride={bride}
            design={design}
          />
        </Section>

        {/* Hitung mundur */}
        {countdown ? (
          <Section
            design={design}
            eyebrow="Save The Date"
            title="Menuju Hari Bahagia"
            subtitle={`Hitung mundur menuju ${countdown.event.label}`}
          >
            <CountdownTimer
              targetIso={countdown.startsAt.toISOString()}
              eventLabel={countdown.event.label}
              level={level}
            />
          </Section>
        ) : null}

        {/* Kisah kami — hanya muncul bila pasangan mengisinya */}
        {story.length > 0 ? (
          <Section
            id="kisah"
            design={design}
            eyebrow="Our Story"
            title="Kisah Kami"
            subtitle="Perjalanan yang membawa kami sampai di hari ini."
          >
            <LoveStory items={story} design={design} />
          </Section>
        ) : null}

        {/* Detail acara */}
        <Section
          id="acara"
          design={design}
          eyebrow="Rangkaian Acara"
          title="Detail Acara"
          subtitle="Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu berkenan hadir."
        >
          <EventDetails
            events={events}
            design={design}
          />
        </Section>

        {/* Susunan acara — hanya muncul bila pasangan mengisinya.
            Ditaruh SETELAH "Detail Acara" karena rundown menjelaskan isi hari
            yang tempat dan tanggalnya baru saja disebut di atasnya; dibaca
            lebih dulu, daftar jamnya menggantung tanpa konteks. */}
        {rundown.length > 0 ? (
          <Section
            id="susunan"
            design={design}
            eyebrow="Rundown"
            title="Susunan Acara"
            subtitle="Rangkaian kegiatan pada hari bahagia kami."
          >
            <Rundown items={rundown} design={design} />
          </Section>
        ) : null}

        {/* Galeri kenangan */}
        {galleryUrls.length > 0 ? (
          <Section
            id="galeri"
            design={design}
            eyebrow="Our Moments"
            title="Galeri Kenangan"
            subtitle="Sekilas perjalanan kami. Ketuk foto untuk melihat lebih dekat."
            width="wide"
          >
            <PhotoGallery
              urls={galleryUrls}
              design={design}
            />
          </Section>
        ) : null}

        {/* Konfirmasi kehadiran */}
        <Section
          id="rsvp"
          design={design}
          eyebrow="RSVP"
          title="Konfirmasi Kehadiran"
          subtitle="Mohon konfirmasi kehadiran Anda untuk membantu kami mempersiapkan acara."
        >
          <RsvpForm
            slug={slug}
            enabled={features.rsvpToDb}
            defaultName={guestName}
            design={design}
          />
        </Section>

        {/* Amplop digital */}
        {accounts.length > 0 ? (
          <Section
            id="hadiah"
            design={design}
            eyebrow="Wedding Gift"
            title="Amplop Digital"
            subtitle="Tanpa mengurangi rasa hormat, bagi Bapak/Ibu yang ingin mengirimkan tanda kasih, dapat melalui rekening berikut."
          >
            <DigitalGift
              accounts={accounts}
              design={design}
            />
          </Section>
        ) : null}

        {/* Buku ucapan */}
        <Section
          id="ucapan"
          design={design}
          eyebrow="Guest Book"
          title="Ucapan & Doa"
          subtitle="Doa restu dari Bapak/Ibu/Saudara/i sangat berarti bagi kami."
        >
          <WishBook
            invitationId={invitation.id}
            initialWishes={wishes}
            realtime={features.wishbookRealtime}
          />
        </Section>

        {/* Penutup */}
        {/* Padding bawah dilebihkan agar kalimat terakhir tidak pernah tertutup
            tombol navigasi mengambang di paket apa pun. */}
        <footer className="relative px-5 pb-32 text-center sm:pb-28">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
            <Divider design={design} />

            <p className="max-w-sm text-sm leading-relaxed opacity-75">
              Atas kehadiran dan doa restunya, kami mengucapkan terima kasih.
            </p>

            <ThemedHeading level={level} className="text-3xl sm:text-4xl">
              {groom.nickName} &amp; {bride.nickName}
            </ThemedHeading>

            <ShareBar
              coupleNames={`${groom.nickName} & ${bride.nickName}`}
              eventLabel={mainEvent?.label ?? INVITATION_TITLE}
              location={
                mainEvent
                  ? `${mainEvent.venueName}, ${mainEvent.address}`
                  : ""
              }
              startIso={calendarRange?.startIso ?? null}
              endIso={calendarRange?.endIso ?? null}
            />
          </div>
        </footer>
      </CoverGate>
    </main>
  );
}
