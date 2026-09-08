import type { ReactNode } from "react";

import {
  CornerFrame,
  ThemedHeading,
  getDecorProfile,
} from "@/components/invitation/decor";
import type { DecorLevel } from "@/components/invitation/decor";
import type { FrameStyle } from "@/config/themes";
import { formatEventDate, formatEventTime } from "@/lib/date";
import type { WeddingEvent } from "@/types/invitation";

function CalendarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Satu baris info dengan ikon, dipakai untuk tanggal & waktu. */
function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="inv-inset flex flex-col items-center gap-1.5 rounded-2xl px-4 py-4 text-center">
      <span
        className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.24em] opacity-70"
        style={{ color: "var(--theme-accent)" }}
      >
        {icon}
        {label}
      </span>
      <p className="text-sm leading-snug font-medium">{value}</p>
    </div>
  );
}

interface EventDetailsProps {
  events: WeddingEvent[];
  frameStyle: FrameStyle;
  level: DecorLevel;
}

/**
 * Daftar acara (akad, resepsi, dsb.) beserta tautan Google Maps.
 * Server Component: isinya statis, tidak butuh interaksi di browser.
 */
export default function EventDetails({
  events,
  frameStyle,
  level,
}: EventDetailsProps) {
  if (events.length === 0) {
    return (
      <div className="inv-glass inv-sheen rounded-3xl px-7 py-9 text-center">
        <p className="text-sm opacity-75">
          Detail acara akan diumumkan menyusul.
        </p>
      </div>
    );
  }

  const profile = getDecorProfile(level);

  return (
    <div className="flex flex-col gap-6">
      {events.map((event, index) => (
        <article
          key={`${event.name}-${event.date}-${index}`}
          className={`inv-sheen relative flex flex-col items-center gap-5 rounded-[2rem] px-6 py-10 text-center sm:px-9 sm:py-12 ${
            profile.strongGlass ? "inv-glass inv-glass-strong" : "inv-glass"
          }`}
        >
          <CornerFrame
            frameStyle={frameStyle}
            level={level}
            size="h-10 w-10 sm:h-12 sm:w-12"
          />

          <ThemedHeading
            as="h3"
            level={level}
            className="relative text-2xl sm:text-3xl"
          >
            {event.label}
          </ThemedHeading>

          <div className="relative grid w-full gap-3 sm:grid-cols-2">
            <InfoTile
              icon={<CalendarIcon />}
              label="Tanggal"
              value={formatEventDate(event.date)}
            />
            {formatEventTime(event) ? (
              <InfoTile
                icon={<ClockIcon />}
                label="Waktu"
                value={formatEventTime(event)}
              />
            ) : null}
          </div>

          <div className="relative flex flex-col gap-1.5">
            <p
              className="text-lg"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {event.venueName}
            </p>
            <p className="text-sm leading-relaxed opacity-75">
              {event.address}
            </p>
          </div>

          {event.mapsUrl ? (
            <a
              href={event.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inv-btn relative mt-1 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium tracking-[0.04em]"
            >
              <PinIcon />
              Lihat Lokasi
            </a>
          ) : null}
        </article>
      ))}
    </div>
  );
}
