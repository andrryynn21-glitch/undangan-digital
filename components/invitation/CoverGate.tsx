"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { FrameStyle } from "@/config/themes";
import { CornerFrame, Divider, Monogram } from "@/components/invitation/decor";
import type { DecorLevel } from "@/components/invitation/decor";

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

  // Di atas foto, warna tema tidak lagi menjamin kontras — teks dibuat putih
  // dengan bayangan halus dan kartu memakai kaca gelap.
  const onPhoto = Boolean(coverPhotoUrl);

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

  return (
    <>
      <div className={opened ? "inv-reveal" : ""}>{children}</div>

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
        {coverPhotoUrl ? (
          <>
            <Image
              src={coverPhotoUrl}
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
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.6) 100%)",
              }}
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
