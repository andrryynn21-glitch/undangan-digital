"use client";

import { useActionState } from "react";

import { CornerFrame, ThemedHeading, getDecorProfile } from "@/components/invitation/decor";
import type { DecorLevel } from "@/components/invitation/decor";
import type { FrameStyle } from "@/config/themes";
import { submitRsvp } from "@/lib/actions";
import { RSVP_INITIAL_STATE } from "@/lib/form-state";

/**
 * Nilai `value` mengikuti check constraint kolom `rsvps.status`, yang hanya
 * menerima "attending" dan "declined".
 */
const STATUS_OPTIONS = [
  { value: "attending", label: "Hadir" },
  { value: "declined", label: "Tidak Hadir" },
] as const;

const FIELD_CLASS =
  "inv-field rounded-xl px-4 py-3 text-sm outline-none";

interface RsvpFormProps {
  slug: string;
  /** Dari `getTierFeatures(tier).rsvpToDb` — paket Silver tidak menyimpan RSVP */
  enabled: boolean;
  frameStyle: FrameStyle;
  level: DecorLevel;
}

/**
 * Form konfirmasi kehadiran.
 * Hanya aktif bila paket undangan mengizinkan penyimpanan RSVP ke database.
 */
export default function RsvpForm({
  slug,
  enabled,
  frameStyle,
  level,
}: RsvpFormProps) {
  const [state, formAction, pending] = useActionState(
    submitRsvp,
    RSVP_INITIAL_STATE
  );

  // Kaca tebal + elevasi hanya untuk paket yang memang menjanjikannya.
  const glassClass = getDecorProfile(level).strongGlass
    ? "inv-glass inv-glass-strong"
    : "inv-glass";

  if (!enabled) {
    return (
      <div
        className="rounded-[2rem] border border-dashed px-7 py-10 text-center"
        style={{
          borderColor: "color-mix(in srgb, var(--theme-accent) 45%, transparent)",
          backgroundColor:
            "color-mix(in srgb, var(--theme-secondary) 40%, transparent)",
        }}
      >
        <p className="text-sm opacity-80">
          Konfirmasi kehadiran belum tersedia pada paket undangan ini.
        </p>
        <p className="mt-2 text-sm opacity-60">
          Silakan sampaikan konfirmasi Anda langsung kepada keluarga mempelai.
        </p>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div
        className={`${glassClass} inv-sheen relative rounded-[2rem] px-7 py-12 text-center`}
      >
        <CornerFrame
          frameStyle={frameStyle}
          level={level}
          size="h-10 w-10 sm:h-12 sm:w-12"
        />
        <ThemedHeading as="h3" level={level} className="relative text-2xl">
          Terima kasih
        </ThemedHeading>
        <p className="relative mt-3 text-sm leading-relaxed opacity-80">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className={`${glassClass} inv-sheen relative flex flex-col gap-5 rounded-[2rem] px-6 py-9 sm:px-9 sm:py-11`}
    >
      <CornerFrame
        frameStyle={frameStyle}
        level={level}
        size="h-10 w-10 sm:h-12 sm:w-12"
      />

      <input type="hidden" name="slug" value={slug} />

      <label className="relative flex flex-col gap-2 text-sm">
        <span className="text-[0.65rem] uppercase tracking-[0.22em] opacity-70">
          Nama
        </span>
        <input
          type="text"
          name="guestName"
          required
          minLength={2}
          maxLength={80}
          placeholder="Nama Anda"
          className={FIELD_CLASS}
        />
      </label>

      <fieldset className="relative flex flex-col gap-2">
        <legend className="mb-2 text-[0.65rem] uppercase tracking-[0.22em] opacity-70">
          Konfirmasi Kehadiran
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="inv-choice flex cursor-pointer items-center justify-center rounded-xl px-3 py-3 text-center text-sm has-checked:font-semibold"
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                required
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="relative flex flex-col gap-2 text-sm">
        <span className="text-[0.65rem] uppercase tracking-[0.22em] opacity-70">
          Jumlah Tamu
        </span>
        <input
          type="number"
          name="headcount"
          min={1}
          max={20}
          defaultValue={1}
          className={FIELD_CLASS}
        />
      </label>

      <label className="relative flex flex-col gap-2 text-sm">
        <span className="text-[0.65rem] uppercase tracking-[0.22em] opacity-70">
          Ucapan &amp; Doa <span className="opacity-60">(opsional)</span>
        </span>
        <textarea
          name="message"
          rows={3}
          maxLength={500}
          placeholder="Tulis ucapan untuk kedua mempelai"
          className={`${FIELD_CLASS} resize-none`}
        />
        <span className="text-xs opacity-60">
          Ucapan yang Anda tulis akan tampil di buku ucapan.
        </span>
      </label>

      {state.status === "error" ? (
        <p
          role="alert"
          className="relative rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(190,18,60,0.08)",
            color: "#9f1239",
          }}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inv-btn relative mt-1 cursor-pointer rounded-full px-8 py-3.5 text-sm font-medium tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim Konfirmasi"}
      </button>
    </form>
  );
}
