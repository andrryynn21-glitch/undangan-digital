import Image from "next/image";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import CountdownTimer from "@/components/invitation/CountdownTimer";
import CoupleProfile from "@/components/invitation/CoupleProfile";
import CoverGate from "@/components/invitation/CoverGate";
import DigitalGift from "@/components/invitation/DigitalGift";
import EventDetails from "@/components/invitation/EventDetails";
import PhotoGallery from "@/components/invitation/PhotoGallery";
import RsvpForm from "@/components/invitation/RsvpForm";
import { Section } from "@/components/invitation/Section";
import WishBook from "@/components/invitation/WishBook";
import {
  Backdrop,
  Divider,
  ThemedHeading,
  getDecorLevel,
} from "@/components/invitation/decor";
import {
  getThemeConfig,
  getThemeCssVars,
  getTierFeatures,
} from "@/config/themes";
import { WISH_DISPLAY_LIMIT } from "@/config/tiers";
import { formatEventDate, getCountdownEvent } from "@/lib/date";
import { getInvitationBySlug, getWishes } from "@/lib/invitation";

/** Tabel `invitations` tidak punya kolom judul, jadi teksnya tetap di sini. */
const INVITATION_TITLE = "Undangan Pernikahan";

export default async function InvitationPage({
  params,
}: PageProps<"/[slug]">) {
  const { slug } = await params;

  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    notFound();
  }

  const theme = getThemeConfig(invitation.theme_id);
  const features = getTierFeatures(invitation.tier);

  // Banyaknya ornamen ditentukan paket, bentuk & warnanya ditentukan tema.
  const level = getDecorLevel(invitation.tier);
  const frameStyle = theme.frameStyle;

  // Ucapan dicari lewat `invitation_id`, bukan slug. Batas jumlahnya dibagi
  // dengan tabel perbandingan di /paket agar keduanya tidak pernah beda angka.
  const wishes = await getWishes(
    invitation.id,
    WISH_DISPLAY_LIMIT[invitation.tier]
  );

  const groom = invitation.groom_data;
  const bride = invitation.bride_data;
  const events = invitation.event_data?.events ?? [];
  const quote = invitation.event_data?.quote;
  const coverPhotoUrl = invitation.event_data?.cover_photo_url;
  const galleryUrls = invitation.event_data?.gallery_urls ?? [];
  const accounts = invitation.payment_data?.accounts ?? [];
  const countdown = getCountdownEvent(events);

  // Tanggal untuk sampul diformat di server supaya hasilnya sama di browser.
  const mainEvent = events[0];
  const coverDateText = mainEvent?.date
    ? formatEventDate(mainEvent.date)
    : undefined;

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
      <Backdrop frameStyle={frameStyle} level={level} />

      <CoverGate
        groomName={groom.nickName}
        brideName={bride.nickName}
        eyebrow={INVITATION_TITLE}
        dateText={coverDateText}
        coverPhotoUrl={coverPhotoUrl}
        frameStyle={frameStyle}
        level={level}
      >
        {/* Pembuka */}
        <Section frameStyle={frameStyle} level={level}>
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

            <Divider frameStyle={frameStyle} level={level} />

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
              <p className="inv-glass inv-sheen max-w-md rounded-3xl px-7 py-6 text-sm leading-relaxed italic opacity-85">
                {quote}
              </p>
            ) : null}
          </div>
        </Section>

        {/* Profil mempelai */}
        <Section
          id="mempelai"
          frameStyle={frameStyle}
          level={level}
          eyebrow="Bismillahirrahmanirrahim"
          title="Kedua Mempelai"
          subtitle="Dengan memohon rahmat dan ridho Allah, kami bermaksud menyelenggarakan pernikahan putra-putri kami."
          width="wide"
        >
          <CoupleProfile
            groom={groom}
            bride={bride}
            frameStyle={frameStyle}
            level={level}
          />
        </Section>

        {/* Hitung mundur */}
        {countdown ? (
          <Section
            frameStyle={frameStyle}
            level={level}
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

        {/* Detail acara */}
        <Section
          id="acara"
          frameStyle={frameStyle}
          level={level}
          eyebrow="Rangkaian Acara"
          title="Detail Acara"
          subtitle="Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu berkenan hadir."
        >
          <EventDetails
            events={events}
            frameStyle={frameStyle}
            level={level}
          />
        </Section>

        {/* Galeri kenangan */}
        {galleryUrls.length > 0 ? (
          <Section
            id="galeri"
            frameStyle={frameStyle}
            level={level}
            eyebrow="Our Moments"
            title="Galeri Kenangan"
            subtitle="Sekilas perjalanan kami. Ketuk foto untuk melihat lebih dekat."
            width="wide"
          >
            <PhotoGallery
              urls={galleryUrls}
              frameStyle={frameStyle}
              level={level}
            />
          </Section>
        ) : null}

        {/* Konfirmasi kehadiran */}
        <Section
          id="rsvp"
          frameStyle={frameStyle}
          level={level}
          eyebrow="RSVP"
          title="Konfirmasi Kehadiran"
          subtitle="Mohon konfirmasi kehadiran Anda untuk membantu kami mempersiapkan acara."
        >
          <RsvpForm
            slug={slug}
            enabled={features.rsvpToDb}
            frameStyle={frameStyle}
            level={level}
          />
        </Section>

        {/* Amplop digital */}
        {accounts.length > 0 ? (
          <Section
            id="hadiah"
            frameStyle={frameStyle}
            level={level}
            eyebrow="Wedding Gift"
            title="Amplop Digital"
            subtitle="Tanpa mengurangi rasa hormat, bagi Bapak/Ibu yang ingin mengirimkan tanda kasih, dapat melalui rekening berikut."
          >
            <DigitalGift
              accounts={accounts}
              frameStyle={frameStyle}
              level={level}
            />
          </Section>
        ) : null}

        {/* Buku ucapan */}
        <Section
          id="ucapan"
          frameStyle={frameStyle}
          level={level}
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
        <footer className="relative px-5 pb-20 text-center">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
            <Divider frameStyle={frameStyle} level={level} />

            <p className="max-w-sm text-sm leading-relaxed opacity-75">
              Atas kehadiran dan doa restunya, kami mengucapkan terima kasih.
            </p>

            <ThemedHeading level={level} className="text-3xl sm:text-4xl">
              {groom.nickName} &amp; {bride.nickName}
            </ThemedHeading>
          </div>
        </footer>
      </CoverGate>
    </main>
  );
}
