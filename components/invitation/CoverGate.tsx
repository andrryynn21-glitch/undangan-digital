"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { FrameStyle } from "@/config/themes";
import { CornerFrame, Divider, Monogram } from "@/components/invitation/decor";
import type { DecorLevel } from "@/components/invitation/decor";
import MusicPlayer from "@/components/invitation/MusicPlayer";
import NavDock from "@/components/invitation/NavDock";
import type { NavItem } from "@/components/invitation/NavDock";

interface CoverGateProps {
  /** Nama panggilan mempelai pria */
  groomName: string;
  /** Nama panggilan mempelai wanita */
  brideName: string;
  /** Teks kecil di atas nama, misal "Undangan Pernikahan" */
  eyebrow?: string;
  /** Tanggal acara yang sudah diformat di server, misal "Jumat, 20 November 2026" */
  dateText?: string;
  /** Foto sampul dari `event_data.cover_photo_url` */
  coverPhotoUrl?: string;
  /**
   * Gambar acuan tema dari `theme_config.backgroundUrl`.
   *
   * Bila ada, gambar inilah yang menjadi latar sampul — bukan foto mempelai.
   * Itu memang niatnya: gambar acuan dipilih khusus sebagai latar, sedangkan
   * foto sampul tetap tampil utuh di bagian pembuka dan di pratinjau WhatsApp.
   */
  backgroundUrl?: string | null;
  /**
   * Rata-rata terang gambar acuan (0-1) dari hasil pembacaan warna.
   * Menentukan kekuatan peredup: gambar terang perlu peredup lebih tebal agar
   * nama mempelai yang berwarna putih tetap terbaca di atasnya.
   */
  coverLuminance?: number;
  /**
   * Nama tamu dari tautan personal (`?to=`). Bila ada, sampul menyapa tamunya
   * dengan "Kepada Yth."; bila tidak, sampul tampil seperti undangan biasa.
   */
  guestName?: string;
  /**
   * Musik latar (paket VIP). Diserahkan ke sini, bukan dirender halaman,
   * karena pemutarannya harus dimulai oleh ketukan "Buka Undangan" — browser
   * menolak audio yang berbunyi sendiri tanpa gestur pengguna.
   */
  musicUrl?: string | null;
  /**
   * Bagian yang ada di undangan ini, untuk tombol navigasi mengambang.
   * Disusun halaman (bukan komponen ini) karena hanya halaman yang tahu bagian
   * mana yang benar-benar dirender — galeri dan amplop digital bisa tidak ada.
   */
  sections?: NavItem[];
  frameStyle: FrameStyle;
  level: DecorLevel;
  /** Isi undangan yang tersembunyi sampai sampul dibuka */
  children: ReactNode;
}

/**
 * Sampul undangan (gerbang pembuka).
 *
 * Isi undangan tetap dirender di server (baik untuk SEO & preview link),
 * hanya ditutupi lapisan sampul sampai tamu menekan "Buka Undangan". Saat
 * dibuka, lapisan sampul memudar & membesar sedikit, lalu isi undangan naik
 * berurutan lewat kelas `.inv-reveal`.
 */
export default function CoverGate({
  groomName,
  brideName,
  eyebrow = "Undangan Pernikahan",
  dateText,
  coverPhotoUrl,
  backgroundUrl,
  coverLuminance,
  guestName,
  musicUrl,
  sections = [],
  frameStyle,
  level,
  children,
}: CoverGateProps) {
  const [opened, setOpened] = useState(false);

  // Kunci scroll halaman selama sampul masih tertutup.
  useEffect(() => {
    if (opened) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [opened]);

  // Gambar acuan tema menang atas foto sampul sebagai latar — lihat komentar
  // pada prop `backgroundUrl`. Tanpa gambar acuan, perilakunya sama persis
  // seperti sebelum fitur ini ada.
  const coverImageUrl = backgroundUrl ?? coverPhotoUrl;

  // Di atas foto, warna tema tidak lagi menjamin kontras — teks dibuat putih
  // dengan bayangan halus dan kartu memakai kaca gelap.
  const onPhoto = Boolean(coverImageUrl);

  const textStyle: CSSProperties = onPhoto
    ? { color: "#fff", textShadow: "0 1px 12px rgba(0,0,0,0.45)" }
    : { color: "var(--theme-text)" };

  const headingStyle: CSSProperties = {
    fontFamily: "var(--theme-font-heading)",
    ...(onPhoto
      ? { color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }
      : { color: "var(--theme-primary)" }),
  };

  const frameClass =
    frameStyle === "arch"
      ? "rounded-t-[11rem] rounded-b-[2rem]"
      : frameStyle === "floral"
        ? "rounded-[2.75rem]"
        : "rounded-[1.25rem]";

  // Peredup gradien tiga titik. Angka dasarnya sudah terbukti enak dilihat di
  // atas foto mempelai, jadi tanpa data terang gambar nilainya tidak diubah
  // sedikit pun — `lift` bernilai 0 dan hasilnya identik dengan sebelumnya.
  //
  // Bila terang gambar diketahui, peredup digeser: gambar terang (latar bunga
  // pastel dari Pinterest) mendapat peredup lebih tebal supaya nama mempelai
  // yang putih tidak lenyap, gambar gelap mendapat peredup lebih ringan supaya
  // sampulnya tidak jadi hitam pekat. Batasnya dijaga agar tidak ada nilai yang
  // keluar dari rentang yang masih terlihat wajar.
  const lift =
    coverLuminance === undefined
      ? 0
      : Math.max(-0.12, Math.min(0.2, (coverLuminance - 0.35) * 0.55));

  const scrim = (base: number) =>
    Math.max(0.12, Math.min(0.85, base + lift)).toFixed(2);

  const scrimGradient = `linear-gradient(180deg, rgba(0,0,0,${scrim(
    0.45
  )}) 0%, rgba(0,0,0,${scrim(0.25)}) 40%, rgba(0,0,0,${scrim(0.6)}) 100%)`;

  return (
    <>
      <div className={opened ? "inv-reveal" : ""}>{children}</div>

      {/* Musik menyusul ketukan "Buka Undangan", satu-satunya gestur yang
          dijamin ada sebelum tamu melihat isi undangan. */}
      <MusicPlayer src={musicUrl} active={opened} />

      {/* Navigasi bagian. Diletakkan DI LUAR pembungkus `inv-reveal` dengan
          alasan yang sama seperti pemutar musik: pembungkus itu memasang
          animasi `transform`, dan elemen ber-transform menjadi acuan posisi
          bagi keturunan `position: fixed` — tombolnya akan ikut tergeser
          bersama bagian undangan alih-alih menempel di layar. */}
      <NavDock active={opened} items={sections} />

      <div
        aria-hidden={opened}
        inert={opened}
        className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-5 py-8 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          opened
            ? "pointer-events-none scale-[1.06] opacity-0 blur-[6px]"
            : "scale-100 opacity-100 blur-0"
        }`}
        style={{ backgroundColor: "var(--theme-background)" }}
      >
        {/* Lapisan foto sampul + peredup agar teks tetap terbaca */}
        {coverImageUrl ? (
          <>
            <Image
              src={coverImageUrl}
              alt=""
              fill
              sizes="100vw"
              // Foto diisi admin dari URL bebas, jadi optimasi gambar Next
              // dilewati — tanpa ini setiap host baru harus didaftarkan dulu
              // di `images.remotePatterns`.
              unoptimized
              priority
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: scrimGradient }}
            />
          </>
        ) : (
          <div className={`absolute inset-0 inv-grain inv-surface--${level}`} />
        )}

        <div
          className={`relative flex w-full max-w-sm flex-col items-center gap-6 px-8 py-14 text-center ${frameClass} ${
            onPhoto ? "inv-sheen" : "inv-glass inv-sheen"
          }`}
          style={
            onPhoto
              ? {
                  backgroundColor: "rgba(20,16,14,0.32)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  boxShadow: "0 40px 80px -40px rgba(0,0,0,0.7)",
                }
              : undefined
          }
        >
          <CornerFrame
            frameStyle={frameStyle}
            level={level}
            size="h-11 w-11 sm:h-14 sm:w-14"
          />

          <p
            className="text-[0.68rem] uppercase tracking-[0.42em] opacity-80"
            style={textStyle}
          >
            {eyebrow}
          </p>

          <Monogram
            initials={`${groomName.charAt(0)}${brideName.charAt(0)}`}
            className="inv-float h-16 w-16"
            textClass="text-lg"
          />

          <h1 className="text-[2.6rem] leading-[1.1]" style={headingStyle}>
            {groomName}
            <span className="my-1 block text-xl opacity-70">&amp;</span>
            {brideName}
          </h1>

          <Divider frameStyle={frameStyle} level={level} />

          {dateText ? (
            <p
              className="text-sm tracking-[0.12em] opacity-90"
              style={textStyle}
            >
              {dateText}
            </p>
          ) : null}

          {/* Sapaan personal. Hanya muncul bila undangan dibuka lewat tautan
              per tamu — tanpa itu, sampul tidak berubah sedikit pun. */}
          {guestName ? (
            <div className="flex flex-col items-center gap-1" style={textStyle}>
              <p className="text-[0.62rem] uppercase tracking-[0.32em] opacity-70">
                Kepada Yth.
              </p>
              <p
                className="max-w-[16rem] text-base leading-snug font-medium break-words"
                style={{ fontFamily: "var(--theme-font-heading)" }}
              >
                {guestName}
              </p>
              <p className="text-[0.66rem] tracking-[0.14em] opacity-65">
                di tempat
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setOpened(true)}
            className="inv-btn inv-pulse mt-2 cursor-pointer rounded-full px-9 py-3.5 text-sm font-medium tracking-[0.08em] focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ outlineColor: "var(--theme-accent)" }}
          >
            Buka Undangan
          </button>
        </div>
      </div>
    </>
  );
}
