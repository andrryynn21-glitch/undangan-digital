"use client";

import { useEffect, useState } from "react";

import type { DecorLevel } from "@/components/invitation/decor";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function getRemaining(targetMs: number): Remaining {
  const diff = targetMs - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: false,
  };
}

interface CountdownTimerProps {
  /** Waktu mulai acara dalam ISO 8601 lengkap dengan offset zona waktu */
  targetIso: string;
  /** Label acara yang dihitung mundur, misal "Resepsi" */
  eventLabel: string;
  /** Tingkat dekorasi dari paket undangan */
  level: DecorLevel;
}

/**
 * Hitung mundur menuju acara, ditampilkan sebagai empat kartu perhiasan.
 *
 * Angka baru dihitung setelah komponen ter-mount (bukan saat render server),
 * karena hasilnya bergantung pada waktu saat ini dan akan selalu berbeda
 * antara server dan browser.
 */
export default function CountdownTimer({
  targetIso,
  eventLabel,
  level,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const targetMs = new Date(targetIso).getTime();

    if (Number.isNaN(targetMs)) return;

    const tick = () => setRemaining(getRemaining(targetMs));

    tick();
    const intervalId = setInterval(tick, 1000);

    return () => clearInterval(intervalId);
  }, [targetIso]);

  if (remaining?.isPast) {
    return (
      <div className="inv-glass inv-sheen rounded-3xl px-7 py-8 text-center">
        <p className="text-sm leading-relaxed opacity-80">
          Acara {eventLabel} telah berlangsung. Terima kasih atas doa dan
          kehadirannya.
        </p>
      </div>
    );
  }

  const units = [
    { label: "Hari", value: remaining?.days },
    { label: "Jam", value: remaining?.hours },
    { label: "Menit", value: remaining?.minutes },
    { label: "Detik", value: remaining?.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
      {units.map((unit) => (
        <div
          key={unit.label}
          className={`inv-jewel flex flex-col items-center justify-center gap-1.5 rounded-[1.15rem] px-1.5 py-5 sm:py-7 ${
            level === "lavish" ? "inv-sheen" : ""
          }`}
        >
          {/* `relative` wajib: kilau spekular kartu digambar dengan
              pseudo-element absolut, jadi teks harus ikut diposisikan agar
              tetap berada di atasnya. */}
          <span
            className="relative text-3xl leading-none tabular-nums sm:text-[2.4rem]"
            style={{
              fontFamily: "var(--theme-font-heading)",
              color: "var(--theme-primary)",
            }}
          >
            {/* Placeholder sampai timer berjalan di browser */}
            {unit.value === undefined
              ? "--"
              : String(unit.value).padStart(2, "0")}
          </span>

          <span className="relative text-[0.58rem] uppercase tracking-[0.22em] opacity-65 sm:text-[0.65rem]">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
