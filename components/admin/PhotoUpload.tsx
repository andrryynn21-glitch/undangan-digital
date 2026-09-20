"use client";

import { useRef, useState } from "react";

import { MAX_PHOTO_BYTES, uploadPhoto } from "@/lib/storage";
import type { PhotoKind } from "@/lib/storage";

/**
 * Pemilih foto untuk form admin.
 *
 * Foto diunggah ke Supabase Storage langsung dari browser, lalu URL publiknya
 * dititipkan ke `<input type="hidden">`. Dengan begitu Server Action tetap
 * menerima string URL — sama seperti ketika field ini masih berupa input URL —
 * dan tidak ada file yang melewati batas body Server Action.
 *
 * `accept="image/*"` yang membuat HP menawarkan pilihan Galeri/Kamera, dan
 * membuat file manager desktop menyaring hanya gambar.
 */

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

const MAX_MB = Math.round(MAX_PHOTO_BYTES / (1024 * 1024));

/** Tombol pemicu dialog berkas; tampilannya sama untuk foto tunggal & galeri. */
function PickerButton({
  onPick,
  busy,
  label,
  multiple = false,
}: {
  onPick: (files: File[]) => void;
  busy: boolean;
  label: string;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          // Direset supaya memilih berkas yang sama dua kali tetap memicu
          // `change` (nilainya tidak berubah kalau tidak dikosongkan).
          event.target.value = "";
          if (files.length > 0) onPick(files);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-lg border border-dashed border-zinc-400 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 disabled:hover:bg-transparent dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        {busy ? "Mengunggah..." : label}
      </button>
    </>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <p role="alert" className="text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

interface PhotoUploadProps {
  /** Nama field yang dibaca Server Action, mis. "groomPhotoUrl" */
  name: string;
  label: string;
  hint?: string;
  kind: PhotoKind;
  /** Slug undangan; menentukan folder penyimpanan di bucket */
  slug: string;
  /** Foto yang sudah tersimpan, saat form dipakai untuk mengubah undangan */
  initialUrl?: string;
  /**
   * Dipanggil setiap URL-nya berubah, termasuk saat dikosongkan.
   *
   * Ada supaya form bisa menanggapi fotonya — dipakai gambar acuan tema untuk
   * menampilkan pratinjau warna. Opsional: pemakai lain tidak perlu tahu.
   */
  onUrlChange?: (url: string) => void;
}

/** Pemilih satu foto (mempelai pria/wanita, atau sampul). */
export function PhotoUpload({
  name,
  label,
  hint,
  kind,
  slug,
  initialUrl = "",
  onUrlChange,
}: PhotoUploadProps) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function applyUrl(next: string) {
    setUrl(next);
    onUrlChange?.(next);
  }

  async function handlePick(files: File[]) {
    setError("");
    setBusy(true);

    const result = await uploadPhoto(files[0], kind, slug);

    if (result.error) setError(result.error);
    else if (result.url) applyUrl(result.url);

    setBusy(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-medium">
        {label}
        {hint ? (
          <span className="ml-1 font-normal text-zinc-500">{hint}</span>
        ) : null}
      </span>

      {/* Nilai yang benar-benar dikirim ke Server Action. */}
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-center gap-3">
        {url ? (
          // Pratinjau memakai <img> biasa, bukan next/image: sumbernya URL
          // Storage yang baru dibuat dan ini halaman admin internal, jadi
          // optimasi gambar tidak memberi manfaat berarti.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : null}

        <PickerButton
          onPick={handlePick}
          busy={busy}
          label={url ? "Ganti Foto" : "Pilih Foto"}
        />

        {url ? (
          <button
            type="button"
            onClick={() => {
              applyUrl("");
              setError("");
            }}
            className="text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Hapus
          </button>
        ) : null}
      </div>

      {error ? <ErrorText message={error} /> : null}
    </div>
  );
}

interface PhotoUploadMultiProps {
  /** Nama field; dikirim berulang, satu hidden input per foto */
  name: string;
  label: string;
  /** Kuota foto paket terpilih (`getTierFeatures(tier).maxPhotos`) */
  maxPhotos: number;
  slug: string;
  /** Galeri yang sudah tersimpan, saat form dipakai untuk mengubah undangan */
  initialUrls?: string[];
}

/** Pemilih banyak foto untuk galeri kenangan. */
export function PhotoUploadMulti({
  name,
  label,
  maxPhotos,
  slug,
  initialUrls,
}: PhotoUploadMultiProps) {
  const [urls, setUrls] = useState<string[]>(initialUrls ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remaining = maxPhotos - urls.length;

  async function handlePick(files: File[]) {
    setError("");

    if (files.length > remaining) {
      setError(
        `Sisa kuota ${remaining} foto, sedangkan Anda memilih ${files.length}. Paket ini maksimal ${maxPhotos} foto galeri.`
      );
      return;
    }

    setBusy(true);

    // Diunggah paralel supaya memilih banyak foto tidak terasa lambat.
    const results = await Promise.all(
      files.map((file) => uploadPhoto(file, "gallery", slug))
    );

    const uploaded = results
      .map((result) => result.url)
      .filter((value): value is string => Boolean(value));

    // Foto yang berhasil tetap dipertahankan meski ada yang gagal, agar admin
    // tidak perlu mengulang semuanya dari awal.
    if (uploaded.length > 0) setUrls((current) => [...current, ...uploaded]);

    const failed = results
      .map((result) => result.error)
      .filter((value): value is string => Boolean(value));

    if (failed.length > 0) setError(failed[0]);

    setBusy(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-medium">
        {label}
        <span className="ml-1 font-normal text-zinc-500">
          {urls.length} / {maxPhotos} foto
        </span>
      </span>

      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      {urls.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {urls.map((url, index) => (
            <li key={url} className="relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setUrls((current) => current.filter((item) => item !== url))
                }
                aria-label={`Hapus foto galeri ${index + 1}`}
                className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs text-white shadow-md transition-opacity hover:opacity-80 dark:bg-zinc-100 dark:text-zinc-900"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <PickerButton
          onPick={handlePick}
          busy={busy}
          multiple
          label={urls.length > 0 ? "Tambah Foto" : "Pilih Foto Galeri"}
        />

        <span className="text-xs text-zinc-500">
          Bisa pilih beberapa sekaligus, maks {MAX_MB} MB per foto
        </span>
      </div>

      {error ? <ErrorText message={error} /> : null}
    </div>
  );
}
