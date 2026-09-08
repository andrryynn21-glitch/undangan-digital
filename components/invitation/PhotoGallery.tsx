"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { CornerFrame } from "@/components/invitation/decor";
import type { DecorLevel } from "@/components/invitation/decor";
import type { FrameStyle } from "@/config/themes";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={direction === "left" ? "-scale-x-100" : ""}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

interface PhotoGalleryProps {
  /** URL foto dari `event_data.gallery_urls` */
  urls: string[];
  frameStyle: FrameStyle;
  level: DecorLevel;
}

/**
 * Galeri kenangan mempelai dengan pratinjau layar penuh (lightbox).
 *
 * Foto pertama dibuat lebih besar agar susunan grid tidak terasa monoton.
 * Navigasi lightbox bisa lewat tombol maupun tombol panah keyboard.
 */
export default function PhotoGallery({
  urls,
  frameStyle,
  level,
}: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isOpen = activeIndex !== null;

  // Kunci scroll halaman & pindahkan fokus ke tombol tutup selama lightbox
  // terbuka, lalu kembalikan gulir seperti semula saat ditutup.
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Escape menutup, panah kiri/kanan berpindah foto.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null ? null : (current + 1) % urls.length
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? null : (current - 1 + urls.length) % urls.length
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, urls.length]);

  if (urls.length === 0) return null;

  const step = (delta: number) =>
    setActiveIndex((current) =>
      current === null ? null : (current + delta + urls.length) % urls.length
    );

  return (
    <>
      <div className="relative">
        <CornerFrame
          frameStyle={frameStyle}
          level={level}
          size="h-12 w-12 sm:h-16 sm:w-16"
        />

        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {urls.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Perbesar foto ${index + 1} dari ${urls.length}`}
              className={`inv-sheen group relative cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 ${
                index === 0 && urls.length > 2
                  ? "col-span-2 aspect-4/3"
                  : "aspect-4/5"
              }`}
              style={{
                outlineColor: "var(--theme-primary)",
                boxShadow:
                  "0 20px 40px -26px color-mix(in srgb, var(--theme-text) 75%, transparent)",
              }}
            >
              <Image
                src={url}
                alt={`Foto kenangan ${index + 1}`}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                // URL diisi bebas oleh admin — optimasi gambar dilewati supaya
                // host baru tidak perlu didaftarkan di `images.remotePatterns`.
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-[1.06] motion-reduce:transition-none"
              />
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 45%, color-mix(in srgb, var(--theme-text) 55%, transparent))",
                }}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>

      {activeIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto"
          className="fixed inset-0 z-60 flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(12,10,9,0.88)" }}
          onClick={() => setActiveIndex(null)}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="Tutup pratinjau"
            className="absolute top-5 right-5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <CloseIcon />
          </button>

          {urls.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                aria-label="Foto sebelumnya"
                className="absolute left-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-6"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <ChevronIcon direction="left" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                aria-label="Foto berikutnya"
                className="absolute right-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <ChevronIcon direction="right" />
              </button>
            </>
          ) : null}

          {/* Klik pada gambar tidak menutup lightbox, hanya klik latarnya. */}
          <figure
            className="relative flex max-h-full w-full max-w-3xl flex-col items-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="relative block max-h-[78vh] w-full">
              <Image
                src={urls[activeIndex]}
                alt={`Foto kenangan ${activeIndex + 1}`}
                width={1600}
                height={1200}
                sizes="100vw"
                unoptimized
                className="mx-auto h-auto max-h-[78vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
            </span>

            <figcaption className="text-xs tracking-[0.2em] text-white/70">
              {activeIndex + 1} / {urls.length}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
