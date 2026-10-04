"use client";

import { useState } from "react";

import {
  MOTIF_CATEGORIES,
  MOTIF_CATEGORY_LABELS,
  MOTIFS,
  MOTIF_IDS,
} from "@/config/motifs";
import type { MotifCategory, MotifId } from "@/config/motifs";
import { MotifCrest } from "@/components/invitation/Ornaments";
import { GrandMotif } from "@/components/invitation/GrandOrnament";

/**
 * Pemilih motif ornamen untuk form admin.
 *
 * Motif ditampilkan sebagai kotak yang benar-benar berisi motifnya, bukan
 * teks saja. Ini bukan hiasan: admin harus bisa melihat persis apa yang akan
 * muncul di undangan sebelum penyimpanan selesai, karena itulah inti dari
 * fitur "imajinasi".
 *
 * Setiap kotak memakai `MotifCrest` — komponen yang SAMA persis dengan yang
 * dirender di halaman undangan. Kalau picker ini menggambar ulang motifnya
 * sendiri, yang tampil di form bisa berbeda dari yang terkirim, dan admin
 * akan ditipu dua kali.
 */
export function MotifPicker({
  name,
  value,
  defaultMotif,
  onChange,
}: {
  name: string;
  value: MotifId | "";
  defaultMotif: MotifId;
  onChange: (next: MotifId | "") => void;
}) {
  // Kategori yang ditampilkan mengikuti filter yang dipakai admin terakhir.
  // Kalau tidak ada filter aktif, semua kategori ditampilkan sekaligus — motif
  // memang tidak banyak, jadi menyembunyikan sebagian tanpa alasan hanya
  // menambah klik.
  const [filter, setFilter] = useState<MotifCategory | "all">("all");

  const visible = MOTIF_IDS.filter(
    (id) => filter === "all" || MOTIFS[id].category === filter,
  );

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={value} />

      {/* Pratinjau besar: motif terpilih dalam ukuran yang benar-benar dipakai
          di sampul. Kisi kecil di bawah memakai crest, padahal yang akan dilihat
          tamu di halaman adalah grand board — jadi tanpa pratinjau ini admin
          menilai motif dari gambar yang tidak akan pernah muncul di hadapan
          tamu. */}
      {value ? (
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <GrandMotif motif={value} size={92} shine color="#8d721b" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{MOTIFS[value].label}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {MOTIFS[value].note} Tampil sebesar ini di sampul.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Semua
        </FilterChip>
        {MOTIF_CATEGORIES.map((category) => (
          <FilterChip
            key={category}
            active={filter === category}
            onClick={() => setFilter(category)}
          >
            {MOTIF_CATEGORY_LABELS[category]}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {visible.map((id) => {
          const motif = MOTIFS[id];
          const selected = value === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={selected}
              title={motif.note}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition ${
                selected
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
              }`}
            >
              {/* Motifnya mewarisi `color` dari tombol, jadi yang terpilih
                  ikut menyala hijau lewat kelas di atas tanpa style tambahan. */}
              <span className="flex h-12 items-center justify-center">
                <MotifCrest motif={id} width={30} />
              </span>
              <span className="text-[0.7rem] font-medium leading-tight">
                {motif.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            value === ""
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700"
          }`}
        >
          Ikuti tema ({MOTIFS[defaultMotif].label})
        </button>

        {/* `value` dijaga hanya berisi id yang sah oleh state form, tapi tetap
            dicek di sini supaya komponen ini aman dipakai dari mana pun tanpa
            perlu prekondisi tambahan. */}
        {value ? (
          <p className="text-xs text-zinc-500">{MOTIFS[value].note}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Tombol filter kategori di atas daftar motif. */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}
