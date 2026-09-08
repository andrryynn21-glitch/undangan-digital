import Image from "next/image";

import { CornerFrame, Monogram } from "@/components/invitation/decor";
import type { DecorLevel } from "@/components/invitation/decor";
import type { FrameStyle } from "@/config/themes";
import type { Person } from "@/types/invitation";

function InstagramIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Avatar mempelai.
 * Bila `photo_url` belum diisi admin, monogram inisial dipakai sebagai
 * pengganti agar tata letak kartu tidak berubah.
 */
function Avatar({
  person,
  fallbackInitial,
}: {
  person: Person;
  fallbackInitial: string;
}) {
  if (!person.photo_url) {
    return (
      <Monogram
        initials={fallbackInitial}
        className="h-24 w-24 sm:h-28 sm:w-28"
        textClass="text-3xl"
      />
    );
  }

  return (
    <span
      className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-full sm:h-28 sm:w-28"
      style={{
        border: "2px solid color-mix(in srgb, var(--theme-primary) 55%, transparent)",
        boxShadow:
          "0 18px 34px -18px color-mix(in srgb, var(--theme-text) 70%, transparent), inset 0 0 0 4px color-mix(in srgb, #fff 55%, transparent)",
      }}
    >
      <Image
        src={person.photo_url}
        alt={person.fullName}
        fill
        sizes="112px"
        // URL foto diisi bebas oleh admin, jadi optimasi gambar dilewati agar
        // host baru tidak perlu didaftarkan di `images.remotePatterns`.
        unoptimized
        className="object-cover"
      />
    </span>
  );
}

function PersonCard({
  person,
  fallbackInitial,
  frameStyle,
  level,
}: {
  person: Person;
  fallbackInitial: string;
  frameStyle: FrameStyle;
  level: DecorLevel;
}) {
  return (
    <article className="inv-glass inv-sheen relative flex w-full max-w-[16rem] flex-col items-center gap-4 rounded-[1.9rem] px-6 py-9 text-center">
      <CornerFrame frameStyle={frameStyle} level={level} size="h-9 w-9" />

      <span className="relative">
        <Avatar person={person} fallbackInitial={fallbackInitial} />
      </span>

      <h3
        className="relative text-xl leading-snug sm:text-2xl"
        style={{
          fontFamily: "var(--theme-font-heading)",
          color: "var(--theme-primary)",
        }}
      >
        {person.fullName}
      </h3>

      {person.childOf ? (
        <p className="relative text-xs leading-relaxed opacity-70">
          {person.childOf}
        </p>
      ) : null}

      {person.instagram ? (
        <a
          href={`https://instagram.com/${person.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inv-inset relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-opacity hover:opacity-75"
          style={{ color: "var(--theme-accent)" }}
        >
          <InstagramIcon />@{person.instagram}
        </a>
      ) : null}
    </article>
  );
}

interface CoupleProfileProps {
  groom: Person;
  bride: Person;
  frameStyle: FrameStyle;
  level: DecorLevel;
}

/** Kartu profil kedua mempelai dengan foto avatar. */
export default function CoupleProfile({
  groom,
  bride,
  frameStyle,
  level,
}: CoupleProfileProps) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-center sm:gap-5">
      <PersonCard
        person={groom}
        fallbackInitial={groom.nickName.charAt(0)}
        frameStyle={frameStyle}
        level={level}
      />

      <div className="flex items-center justify-center">
        <span
          className="text-3xl opacity-70"
          style={{
            fontFamily: "var(--theme-font-heading)",
            color: "var(--theme-primary)",
          }}
          aria-hidden="true"
        >
          &amp;
        </span>
      </div>

      <PersonCard
        person={bride}
        fallbackInitial={bride.nickName.charAt(0)}
        frameStyle={frameStyle}
        level={level}
      />
    </div>
  );
}
