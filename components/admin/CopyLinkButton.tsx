"use client";

import { useEffect, useState } from "react";

/**
 * Tombol penyalin tautan undangan.
 *
 * Komponen klien karena butuh dua hal yang hanya ada di browser: alamat asal
 * situs (`window.location.origin`) dan clipboard. Alamatnya sengaja dibaca saat
 * diklik, bukan disimpan sebagai prop dari server — dengan begitu tautan yang
 * disalin selalu memakai domain yang sedang dibuka admin (localhost saat
 * mengembangkan, domain produksi saat dipakai sungguhan).
 */
export default function CopyLinkButton({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  // Label "Tersalin" dikembalikan ke semula setelah sebentar. Timer-nya
  // dibersihkan agar tidak menyentuh komponen yang sudah dilepas.
  useEffect(() => {
    if (status === "idle") return;

    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    const url = `${window.location.origin}/${slug}`;

    try {
      // `navigator.clipboard` hanya tersedia di konteks aman (HTTPS atau
      // localhost). Di luar itu bisa tidak ada sama sekali, jadi keberadaannya
      // diperiksa dulu — bukan hanya dibungkus try/catch.
      if (!navigator.clipboard) throw new Error("clipboard tidak tersedia");

      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Salin tautan undangan ${slug}`}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {status === "copied"
        ? "Tersalin!"
        : status === "error"
          ? "Gagal salin"
          : "Salin Link"}
    </button>
  );
}
