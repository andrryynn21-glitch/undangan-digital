"use client";

import { useEffect, useRef, useState } from "react";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      {muted ? (
        <path d="M17 9l4 6M21 9l-4 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

interface MusicPlayerProps {
  /** URL musik latar. Tanpa nilai, komponen ini tidak merender apa pun. */
  src?: string | null;
  /** Menjadi `true` saat tamu menekan "Buka Undangan". */
  active: boolean;
}

/**
 * Musik latar undangan.
 *
 * Kuncinya ada pada kapan `play()` dipanggil. Browser modern menolak audio yang
 * berbunyi tanpa gestur pengguna — sebuah `autoplay` di sini akan gagal diam-
 * diam. Karena itu pemutarannya digantungkan pada `active`, yang baru bernilai
 * `true` setelah tamu menekan "Buka Undangan" di sampul: satu-satunya ketukan
 * yang pasti terjadi sebelum isi undangan terlihat.
 *
 * Penolakan tetap ditangani. Bila browser masih menolak (mis. mode hemat daya
 * iOS), tombolnya cukup berubah menjadi "nyalakan musik" alih-alih halaman
 * membisu tanpa penjelasan.
 */
export default function MusicPlayer({ src, active }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  /**
   * Kehendak tamu, dilacak terpisah dari `playing`. Musik yang dijeda karena
   * tab ditinggalkan harus menyala lagi saat tab kembali dibuka; musik yang
   * sengaja dibisukan tamu tidak boleh.
   */
  const wantsSound = useRef(false);

  // Mulai memutar begitu sampul dibuka.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active) return;

    let cancelled = false;
    audio.volume = 0.55;
    wantsSound.current = true;

    audio.play().then(
      () => {
        if (!cancelled) setPlaying(true);
      },
      () => {
        // Ditolak browser. Bukan error yang perlu dilaporkan — tamu tinggal
        // menekan tombolnya sendiri, dan gestur itu selalu diterima.
        if (!cancelled) setPlaying(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [active]);

  // Berhenti saat tab ditinggalkan, supaya musik tidak mengalun di latar
  // belakang tanpa ada yang menonton undangannya.
  useEffect(() => {
    if (!active) return;

    const onVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        audio.pause();
        return;
      }

      if (wantsSound.current) {
        audio.play().then(
          () => setPlaying(true),
          () => setPlaying(false)
        );
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [active]);

  if (!src) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      wantsSound.current = true;
      audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
      return;
    }

    wantsSound.current = false;
    audio.pause();
    setPlaying(false);
  }

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="none" />

      {/* Tombol baru muncul setelah sampul dibuka: sebelum itu tidak ada yang
          bisa dikendalikan, dan ia hanya akan menutupi sampul. */}
      {active ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Matikan musik" : "Nyalakan musik"}
          aria-pressed={playing}
          className="fixed top-4 right-4 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:top-6 sm:right-6"
          style={{
            backgroundColor: "var(--theme-primary)",
            color: "var(--theme-background)",
            outlineColor: "var(--theme-accent)",
            boxShadow:
              "0 14px 30px -12px color-mix(in srgb, var(--theme-text) 80%, transparent)",
          }}
        >
          <SpeakerIcon muted={!playing} />
        </button>
      ) : null}
    </>
  );
}
