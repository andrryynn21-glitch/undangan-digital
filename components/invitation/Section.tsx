import type { ReactNode } from "react";

import type { FrameStyle } from "@/config/themes";
import {
  CornerFrame,
  Divider,
  ThemedHeading,
  getDecorProfile,
} from "@/components/invitation/decor";
import type { DecorLevel } from "@/components/invitation/decor";
import Reveal from "@/components/invitation/Reveal";

interface SectionProps {
  title?: string;
  /** Teks kecil di atas judul, misal "Save The Date" */
  eyebrow?: string;
  subtitle?: string;
  frameStyle: FrameStyle;
  /** Tingkat dekorasi dari paket undangan (`getDecorLevel(tier)`) */
  level: DecorLevel;
  children: ReactNode;
  id?: string;
  /** Lebar maksimum isi; dilonggarkan untuk galeri foto */
  width?: "narrow" | "wide";
}

/**
 * Pembungkus standar tiap bagian undangan.
 *
 * Selain menjaga spasi & tipografi tetap konsisten, komponen ini:
 *  - memasang bingkai sudut dekoratif — hanya pada paket Premium & VIP, sesuai
 *    `getDecorProfile(tier).corners`;
 *  - membungkus isinya dengan `Reveal`, sehingga tiap bagian punya animasi
 *    masuknya sendiri saat mencapai layar;
 *  - memasang `id` bersama `scroll-mt`, target tombol navigasi mengambang.
 */
export function Section({
  title,
  eyebrow,
  subtitle,
  frameStyle,
  level,
  children,
  id,
  width = "narrow",
}: SectionProps) {
  const profile = getDecorProfile(level);

  return (
    <section
      id={id}
      // Jarak aman saat bagian ini dilompati tombol navigasi bawah.
      className="relative scroll-mt-3 px-5 py-16 sm:py-24"
    >
      <Reveal
        className={`relative mx-auto w-full ${
          width === "wide" ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <CornerFrame
          frameStyle={frameStyle}
          level={level}
          size="h-14 w-14 sm:h-20 sm:w-20"
        />

        {/* Padding ekstra hanya saat ada bingkai sudut, supaya ornamen tidak
            bertumpuk dengan teks. */}
        <div className={profile.corners ? "px-3 py-5 sm:px-9 sm:py-8" : ""}>
          {title ? (
            <header className="mb-9 flex flex-col items-center gap-4 text-center">
              {eyebrow ? (
                <p className="text-[0.68rem] uppercase tracking-[0.35em] opacity-65">
                  {eyebrow}
                </p>
              ) : null}

              <ThemedHeading
                level={level}
                className="text-3xl leading-tight sm:text-[2.6rem]"
              >
                {title}
              </ThemedHeading>

              {subtitle ? (
                <p className="max-w-md text-sm leading-relaxed opacity-75">
                  {subtitle}
                </p>
              ) : null}

              <Divider frameStyle={frameStyle} level={level} className="mt-1" />
            </header>
          ) : null}

          {children}
        </div>
      </Reveal>
    </section>
  );
}

