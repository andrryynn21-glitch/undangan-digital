"use client";

import { useState } from "react";

/**
 * Waktu untuk Google Calendar & .ics: `20261120T010000Z`.
 * Keduanya memakai bentuk UTC dasar (tanpa tanda hubung dan titik dua).
 */
function toCalendarStamp(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Karakter yang punya arti khusus di berkas .ics harus di-escape. */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function ShareIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.9-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 18v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}

const BUTTON_CLASS =
  "inv-glass inv-sheen flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-3 text-sm transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none";

interface ShareBarProps {
  /** "Budi & Ani" — dipakai pada teks WhatsApp dan judul entri kalender. */
  coupleNames: string;
  /** Label acara utama, mis. "Resepsi". */
  eventLabel: string;
  /** Alamat lengkap acara, untuk kolom lokasi di kalender. */
  location: string;
  /** Rentang waktu ISO dari `getCalendarRange()`; `null` bila tanggal tak terbaca. */
  startIso: string | null;
  endIso: string | null;
}

/**
 * Alat bagi tamu: sebarkan undangannya, dan simpan tanggalnya.
 *
 * Semuanya di sisi klien karena butuh dua hal yang hanya ada di browser —
 * alamat halaman yang sedang dibuka dan clipboard. Alamatnya dibaca saat
 * diklik, bukan dikirim sebagai prop dari server, agar tautan yang dibagikan
 * selalu memakai domain yang benar-benar sedang dipakai tamu.
 *
 * Nilai `?to=` sengaja DIBUANG dari tautan yang dibagikan: tamu yang meneruskan
 * undangan ke orang lain tidak boleh ikut mengirimkan sapaan atas namanya
 * sendiri.
 */
export default function ShareBar({
  coupleNames,
  eventLabel,
  location,
  startIso,
  endIso,
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  function shareUrl(): string {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  function shareText(): string {
    return `Undangan pernikahan ${coupleNames}. Kami mengundang Anda untuk hadir dan memberikan doa restu:\n${shareUrl()}`;
  }

  function openWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText())}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyLink() {
    try {
      // `navigator.clipboard` hanya ada di konteks aman (HTTPS/localhost),
      // jadi keberadaannya diperiksa dulu — bukan sekadar dibungkus try/catch.
      if (!navigator.clipboard) throw new Error("clipboard tidak tersedia");

      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Salin gagal (izin ditolak / konteks tidak aman). Tamu masih bisa
      // menyalin dari bilah alamat, jadi tidak perlu pesan error yang keras.
      window.prompt("Salin tautan undangan ini:", shareUrl());
    }
  }

  function openGoogleCalendar() {
    if (!startIso || !endIso) return;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${eventLabel} — ${coupleNames}`,
      dates: `${toCalendarStamp(startIso)}/${toCalendarStamp(endIso)}`,
      details: shareText(),
      location,
    });

    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadIcs() {
    if (!startIso || !endIso) return;

    // Dirakit sendiri, tanpa pustaka: berkas .ics untuk satu acara hanya
    // sepanjang ini, dan proyek ini tidak punya dependensi tambahan.
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Undangan Digital//ID",
      "BEGIN:VEVENT",
      `UID:${toCalendarStamp(startIso)}-${Math.random().toString(36).slice(2)}@undangan`,
      `DTSTAMP:${toCalendarStamp(new Date().toISOString())}`,
      `DTSTART:${toCalendarStamp(startIso)}`,
      `DTEND:${toCalendarStamp(endIso)}`,
      `SUMMARY:${escapeIcs(`${eventLabel} — ${coupleNames}`)}`,
      `LOCATION:${escapeIcs(location)}`,
      `DESCRIPTION:${escapeIcs(shareText())}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];

    // Spesifikasi iCalendar mensyaratkan CRLF sebagai pemisah baris.
    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `undangan-${coupleNames.replace(/\s+/g, "-").toLowerCase()}.ics`;

    // Anchor-nya HARUS masuk ke dokumen dulu, dan blob URL-nya baru boleh
    // dicabut setelah peramban sempat membacanya.
    //
    // Firefox mengabaikan `click()` pada anchor yang tidak terpasang di DOM,
    // jadi tanpa `appendChild` tombol "Simpan ke kalender" tidak melakukan
    // apa pun di sana. `revokeObjectURL()` yang langsung dipanggil setelah
    // `click()` juga terlalu cepat: unduhan dimulai asinkron, dan mencabut
    // URL-nya di baris yang sama bisa membatalkan unduhan sebelum berkasnya
    // terbaca. `setTimeout` melepasnya setelah tugas saat ini selesai —
    // tetap dilepas, jadi blob-nya tidak bocor.
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const hasSchedule = Boolean(startIso && endIso);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button type="button" onClick={openWhatsApp} className={BUTTON_CLASS}>
          <ShareIcon />
          Bagikan ke WhatsApp
        </button>

        <button type="button" onClick={copyLink} className={BUTTON_CLASS}>
          <LinkIcon />
          {copied ? "Tautan tersalin" : "Salin tautan"}
        </button>
      </div>

      {hasSchedule ? (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={openGoogleCalendar}
            className={BUTTON_CLASS}
          >
            <CalendarIcon />
            Google Calendar
          </button>

          <button type="button" onClick={downloadIcs} className={BUTTON_CLASS}>
            <DownloadIcon />
            Simpan ke kalender
          </button>
        </div>
      ) : null}
    </div>
  );
}
