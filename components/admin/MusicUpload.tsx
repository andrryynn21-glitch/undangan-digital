"use client";

import { useRef, useState } from "react";

import { MAX_AUDIO_BYTES, uploadMusic } from "@/lib/storage";

/**
 * Pemilih musik latar untuk form admin (paket VIP).
 *
 * Alurnya sama dengan `PhotoUpload`: berkas diunggah langsung dari browser ke
 * Supabase Storage lewat tiket bertanda tangan, lalu URL publiknya dititipkan
 * ke `<input type="hidden">` — jadi Server Action tetap hanya menerima string.
 *
 * Pratinjaunya memakai `<audio controls>` supaya admin bisa mendengarkan dulu
 * sebelum menyimpan; salah unggah lagu baru ketahuan saat undangan dibuka tamu
 * kalau tidak bisa dicoba di sini.
 */

const ACCEPT = "audio/mpeg,audio/mp4,audio/ogg";

const MAX_MB = Math.round(MAX_AUDIO_BYTES / (1024 * 1024));

interface MusicUploadProps {
  /** Nama field yang dibaca Server Action, mis. "musicUrl". */
  name: string;
  /** Slug undangan; menentukan folder penyimpanan di bucket. */
  slug: string;
  /** URL musik yang sudah tersimpan, saat form dipakai untuk mengubah. */
  initialUrl?: string;
}

export default function MusicUpload({
  name,
  slug,
  initialUrl = "",
}: MusicUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handlePick(file: File) {
    setError("");
    setBusy(true);

    const result = await uploadMusic(file, slug);

    if (result.error) setError(result.error);
    else if (result.url) setUrl(result.url);

    setBusy(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <input type="hidden" name={name} value={url} />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Direset supaya memilih berkas yang sama dua kali tetap memicu
          // `change`.
          event.target.value = "";
          if (file) handlePick(file);
        }}
      />

      {url ? (
        // Musik instrumental: tidak ada ucapan untuk ditranskripsi, jadi
        // memang tidak ada trek teks yang bisa disertakan.
        <audio src={url} controls preload="none" className="w-full" />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-dashed border-zinc-400 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 disabled:hover:bg-transparent dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {busy ? "Mengunggah..." : url ? "Ganti Musik" : "Pilih Musik"}
        </button>

        {url ? (
          <button
            type="button"
            onClick={() => {
              setUrl("");
              setError("");
            }}
            className="text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Hapus
          </button>
        ) : null}

        <span className="text-xs text-zinc-500">
          MP3 / M4A / OGG, maks {MAX_MB} MB
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
