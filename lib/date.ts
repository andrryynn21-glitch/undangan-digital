/**
 * Helper tanggal & waktu acara.
 *
 * Tujuan utamanya deterministik: nilai yang dihitung di server harus sama
 * persis dengan di browser, supaya tidak terjadi hydration mismatch. Karena
 * itu zona waktu selalu dieksplisitkan (tidak pernah bergantung pada zona
 * waktu mesin yang merender).
 */

import type { WeddingEvent } from "@/types/invitation";

/** Offset zona waktu Indonesia terhadap UTC. */
const TIMEZONE_OFFSETS: Record<string, string> = {
  WIB: "+07:00",
  WITA: "+08:00",
  WIT: "+09:00",
};

const DEFAULT_OFFSET = TIMEZONE_OFFSETS.WIB;

/** Mengambil offset dari teks jam, misal "08.00 WITA" -> "+08:00". */
function detectOffset(timeText: string | undefined): string {
  if (!timeText) return DEFAULT_OFFSET;

  const match = timeText.toUpperCase().match(/\b(WIB|WITA|WIT)\b/);
  if (!match) return DEFAULT_OFFSET;

  return TIMEZONE_OFFSETS[match[1]] ?? DEFAULT_OFFSET;
}

/** Mengambil jam & menit dari teks seperti "08.00 WIB" atau "19:30". */
function parseClock(timeText: string | undefined): {
  hours: number;
  minutes: number;
} {
  if (!timeText) return { hours: 0, minutes: 0 };

  const match = timeText.match(/(\d{1,2})[.:](\d{2})/);
  if (!match) return { hours: 0, minutes: 0 };

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return { hours: 0, minutes: 0 };

  return { hours, minutes };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Menggabungkan `date` + `startTime` sebuah acara menjadi `Date`.
 * Mengembalikan `null` bila tanggalnya tidak bisa diurai.
 */
export function parseEventStart(event: WeddingEvent): Date | null {
  if (!event.date) return null;

  // Sudah berupa ISO lengkap dengan jam
  if (event.date.includes("T")) {
    const full = new Date(event.date);
    return Number.isNaN(full.getTime()) ? null : full;
  }

  const { hours, minutes } = parseClock(event.startTime);
  const offset = detectOffset(event.startTime);
  const parsed = new Date(
    `${event.date}T${pad(hours)}:${pad(minutes)}:00${offset}`
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Acara yang dipakai untuk hitung mundur: acara terdekat yang belum lewat.
 * Bila semua acara sudah lewat, dikembalikan acara terakhir agar countdown
 * bisa menampilkan status "sudah berlangsung".
 */
export function getCountdownEvent(events: WeddingEvent[]): {
  event: WeddingEvent;
  startsAt: Date;
} | null {
  const dated = events
    .map((event) => ({ event, startsAt: parseEventStart(event) }))
    .filter((item): item is { event: WeddingEvent; startsAt: Date } =>
      item.startsAt !== null
    )
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  if (dated.length === 0) return null;

  const now = Date.now();
  return dated.find((item) => item.startsAt.getTime() > now) ?? dated[dated.length - 1];
}

/**
 * Format tanggal panjang berbahasa Indonesia, misal "Jumat, 20 November 2026".
 * Tanggal tanpa jam diperlakukan sebagai UTC agar hasilnya tidak bergeser
 * satu hari tergantung zona waktu server.
 */
export function formatEventDate(dateText: string): string {
  const iso = dateText.includes("T") ? dateText : `${dateText}T00:00:00Z`;
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return dateText;

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Format rentang waktu acara, misal "08.00 - 11.00 WIB".
 * Bila jam mulai dan selesai memakai zona waktu yang sama, zona waktu cukup
 * ditulis sekali di akhir.
 */
export function formatEventTime(event: WeddingEvent): string {
  if (!event.startTime) return "";
  if (!event.endTime) return event.startTime;

  const zonePattern = /\b(WIB|WITA|WIT)\b/i;
  const startZone = event.startTime.match(zonePattern)?.[1];
  const endZone = event.endTime.match(zonePattern)?.[1];

  if (startZone && endZone && startZone.toUpperCase() === endZone.toUpperCase()) {
    const start = event.startTime.replace(zonePattern, "").trim();
    return `${start} - ${event.endTime}`;
  }

  return `${event.startTime} - ${event.endTime}`;
}

/**
 * Format timestamp singkat untuk buku ucapan, misal "20 Nov 2026, 19.30".
 * Zona waktu dipatok ke Asia/Jakarta supaya hasil render server & browser sama.
 */
export function formatDateTime(isoText: string): string {
  const date = new Date(isoText);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/** Lama acara bila undangan tidak menyebutkan jam selesai. */
const DEFAULT_EVENT_HOURS = 3;

/**
 * Rentang waktu acara untuk keperluan kalender (Google Calendar / berkas .ics).
 *
 * Jam selesai sering tidak diisi — form admin memang hanya meminta jam mulai.
 * Entri kalender tetap butuh keduanya, jadi durasi {@link DEFAULT_EVENT_HOURS}
 * jam dipakai sebagai perkiraan. Ini asumsi yang disengaja: entri kalender yang
 * durasinya kira-kira jauh lebih berguna daripada tidak ada entri sama sekali,
 * dan tamu bisa menyesuaikannya sendiri setelah tersimpan.
 *
 * Keduanya dikembalikan sebagai ISO UTC agar aman dilewatkan dari server ke
 * komponen klien tanpa bergantung zona waktu mesin yang merender.
 */
export function getCalendarRange(
  event: WeddingEvent
): { startIso: string; endIso: string } | null {
  const start = parseEventStart(event);

  if (!start) return null;

  const end = event.endTime
    ? parseEventStart({ ...event, startTime: event.endTime })
    : null;

  // Jam selesai yang lebih awal dari jam mulai berarti acaranya melewati tengah
  // malam — atau datanya salah ketik. Keduanya lebih baik jatuh ke durasi
  // bawaan daripada menghasilkan entri kalender bermula setelah selesai.
  const usable = end && end.getTime() > start.getTime() ? end : null;

  return {
    startIso: start.toISOString(),
    endIso: (
      usable ??
      new Date(start.getTime() + DEFAULT_EVENT_HOURS * 60 * 60 * 1000)
    ).toISOString(),
  };
}
