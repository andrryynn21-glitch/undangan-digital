"use client";

import { useEffect, useState } from "react";

interface CopyTextButtonProps {
  /** Teks yang disalin. Sudah disusun di server, jadi tidak ada logika di sini. */
  text: string;
  label?: string;
  className?: string;
}

/**
 * Penyalin teks apa pun ke clipboard.
 *
 * Berbeda dari `CopyLinkButton`, yang ini tidak tahu-menahu soal tautan: ia
 * menerima teks siap pakai. Dipakai untuk rekap RSVP, yang seluruhnya bisa
 * disusun di server karena tidak membutuhkan alamat domain.
 */
export default function CopyTextButton({
  text,
  label = "Salin",
  className,
}: CopyTextButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return;

    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      // Hanya tersedia di konteks aman (HTTPS / localhost); keberadaannya
      // diperiksa dulu, bukan sekadar dibungkus try/catch.
      if (!navigator.clipboard) throw new Error("clipboard tidak tersedia");

      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        "rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }
    >
      {status === "copied"
        ? "Tersalin!"
        : status === "error"
          ? "Gagal salin"
          : label}
    </button>
  );
}
