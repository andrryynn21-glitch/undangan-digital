"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import {
  PhotoUpload,
  PhotoUploadMulti,
} from "@/components/admin/PhotoUpload";
import { EVENT_OPTIONS } from "@/config/events";
import {
  TIERS,
  getAllThemes,
  getTierFeatures,
  isTierAllowed,
} from "@/config/themes";
import type { TierType } from "@/config/themes";
import { TRADITION_LIST } from "@/config/cultures";
import { createInvitation } from "@/lib/actions";
import {
  CREATE_INVITATION_INITIAL_STATE,
  MAX_PAYMENT_ACCOUNTS,
} from "@/lib/form-state";

const TIER_LABELS: Record<TierType, string> = {
  silver: "Silver",
  premium: "Premium",
  vip: "VIP",
};

const THEMES = getAllThemes();

// `w-full min-w-0` mencegah input melebar keluar grid pada layar sempit.
const fieldClass =
  "w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function Field({
  label,
  hint,
  /** Sembunyikan label secara visual tapi tetap terbaca screen reader. */
  labelHidden = false,
  children,
}: {
  label: string;
  hint?: string;
  labelHidden?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className={
          labelHidden ? "sr-only" : "text-sm font-medium"
        }
      >
        {label}
        {hint ? (
          <span className="ml-1 font-normal text-zinc-500">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

/** Kelompok field bertajuk, supaya form panjang tetap mudah dibaca. */
function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex min-w-0 w-full flex-col gap-4 overflow-hidden rounded-xl border border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <legend className="px-1.5 text-sm font-semibold">
        {title}
        {hint ? (
          <span className="ml-1.5 font-normal text-zinc-500">{hint}</span>
        ) : null}
      </legend>
      {children}
    </fieldset>
  );
}

/** Form pembuatan undangan baru. */
export default function InvitationForm() {
  const [state, formAction, pending] = useActionState(
    createInvitation,
    CREATE_INVITATION_INITIAL_STATE
  );

  // Tier dipantau di klien supaya daftar tema langsung menyesuaikan.
  const [tier, setTier] = useState<TierType>("silver");

  /**
   * Slug dipantau juga karena dipakai sebagai nama folder foto di Storage.
   * Selama masih kosong, foto masuk ke folder `draft/`.
   */
  const [slug, setSlug] = useState("");

  /**
   * Baris rekening dilacak lewat id, bukan sekadar jumlah — dengan key yang
   * stabil, menghapus satu baris tidak menggeser nilai input baris lain (semua
   * input di sini tak terkendali / uncontrolled).
   */
  const [accountRows, setAccountRows] = useState<number[]>([0]);
  const nextRowId = useRef(1);

  // Dipantau untuk menampilkan hint daerah yang sesuai tradisi terpilih.
  const [tradition, setTradition] = useState("modern");
  const traditionEntry = TRADITION_LIST.find((t) => t.key === tradition) ?? TRADITION_LIST[0];

  const availableThemes = THEMES.filter((theme) =>
    isTierAllowed(tier, theme.tierRequirement)
  );

  const lockedThemes = THEMES.length - availableThemes.length;
  const maxPhotos = getTierFeatures(tier).maxPhotos;

  /**
   * Dipakai sebagai `key` grup pemilih foto. Naik setiap kali ada undangan
   * berhasil disimpan, sehingga React membuang state pratinjau lama.
   */
  const resetKey = state.status === "success" ? state.slug : "form";

  function addAccountRow() {
    setAccountRows((rows) =>
      rows.length >= MAX_PAYMENT_ACCOUNTS
        ? rows
        : [...rows, nextRowId.current++]
    );
  }

  function removeAccountRow(id: number) {
    setAccountRows((rows) =>
      rows.length <= 1 ? rows : rows.filter((row) => row !== id)
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" hint="dipakai di URL undangan">
          <input
            type="text"
            name="slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="budi-ani"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Huruf kecil, angka, dan tanda hubung"
            className={fieldClass}
          />
        </Field>

        <Field label="Paket">
          <select
            name="tier"
            value={tier}
            onChange={(event) => setTier(event.target.value as TierType)}
            className={fieldClass}
          >
            {TIERS.map((value) => (
              <option key={value} value={value}>
                {TIER_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Tema"
          hint={
            lockedThemes > 0
              ? `${lockedThemes} tema terkunci di paket ini`
              : undefined
          }
        >
          <select name="themeId" required className={fieldClass}>
            {availableThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jenis Acara">
          <select name="eventName" required className={fieldClass}>
            {EVENT_OPTIONS.map((option) => (
              <option key={option.name} value={option.name}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nama Mempelai Pria">
          <input
            type="text"
            name="groomName"
            required
            minLength={2}
            placeholder="Budi Santoso"
            className={fieldClass}
          />
        </Field>

        <Field label="Nama Mempelai Wanita">
          <input
            type="text"
            name="brideName"
            required
            minLength={2}
            placeholder="Ani Rahmawati"
            className={fieldClass}
          />
        </Field>

        <Field label="Tanggal Acara">
          <input type="date" name="eventDate" required className={fieldClass} />
        </Field>

        <Field label="Waktu Acara" hint="WIB">
          <input type="time" name="eventTime" required className={fieldClass} />
        </Field>
      </div>

      <Field label="Nama Tempat">
        <input
          type="text"
          name="venueName"
          required
          minLength={2}
          placeholder="Gedung Serbaguna Melati"
          className={fieldClass}
        />
      </Field>

      <Field label="Alamat Lengkap">
        <textarea
          name="address"
          required
          minLength={5}
          rows={2}
          placeholder="Jl. Merdeka No. 10, Bandung"
          className={`${fieldClass} resize-none`}
        />
      </Field>

      <Field label="Link Google Maps" hint="opsional">
        <input
          type="url"
          name="mapsUrl"
          placeholder="https://maps.google.com/..."
          className={fieldClass}
        />
      </Field>

      <Group
        title="Foto Mempelai & Galeri"
        hint="semua opsional, pilih dari galeri atau file manager"
      >
        {/* `key` diganti setelah submit sukses supaya semua pratinjau & URL
            tersimpan ikut dikosongkan — `useActionState` tidak mereset state
            komponen anak. */}
        <div key={resetKey} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <PhotoUpload
              name="groomPhotoUrl"
              label="Foto Mempelai Pria"
              kind="groom"
              slug={slug}
            />

            <PhotoUpload
              name="bridePhotoUrl"
              label="Foto Mempelai Wanita"
              kind="bride"
              slug={slug}
            />
          </div>

          <PhotoUpload
            name="coverPhotoUrl"
            label="Foto Sampul / Hero"
            hint="tampil di balik nama mempelai"
            kind="cover"
            slug={slug}
          />

          <PhotoUploadMulti
            name="galleryUrls"
            label={`Foto Galeri — paket ${TIER_LABELS[tier]}`}
            maxPhotos={maxPhotos}
            slug={slug}
          />
        </div>
      </Group>

      <Group
        title="Desain Budaya"
        hint="pilih tradisi untuk mengubah palet warna & motif ornamen undangan"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adat / Tradisi">
            <select
              name="tradition"
              value={tradition}
              onChange={(e) => setTradition(e.target.value)}
              className={fieldClass}
            >
              {TRADITION_LIST.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Daerah Asal"
            hint="mis. Yogyakarta, Bandung"
          >
            <input
              type="text"
              name="region"
              placeholder={traditionEntry.regionHint}
              maxLength={80}
              className={fieldClass}
            />
          </Field>
        </div>

        {tradition !== "modern" ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Warna, motif, dan gaya bingkai undangan akan menyesuaikan adat{" "}
            <strong>{traditionEntry.label}</strong>. Tema dasar yang dipilih tetap
            menjadi fondasi tipografi dan elemen lainnya.
          </p>
        ) : null}
      </Group>

      <Group
        title="Amplop Digital"
        hint={`rekening & e-wallet, maksimal ${MAX_PAYMENT_ACCOUNTS} — biarkan kosong bila tidak dipakai`}
      >
        {accountRows.map((rowId, index) => (
          <div
            key={rowId}
            className="flex flex-col gap-3 sm:grid sm:items-end sm:grid-cols-[1fr_1.2fr_1.2fr_auto]"
          >
            <Field label="Bank / E-Wallet" labelHidden={index > 0}>
              <input
                type="text"
                name="bankName"
                placeholder="BCA"
                className={fieldClass}
              />
            </Field>

            <Field label="Nomor Rekening / HP" labelHidden={index > 0}>
              <input
                type="text"
                name="accountNumber"
                inputMode="numeric"
                placeholder="1234567890"
                className={fieldClass}
              />
            </Field>

            <Field label="Atas Nama" labelHidden={index > 0}>
              <input
                type="text"
                name="accountHolder"
                placeholder="Budi Santoso"
                className={fieldClass}
              />
            </Field>

            <button
              type="button"
              onClick={() => removeAccountRow(rowId)}
              disabled={accountRows.length <= 1}
              aria-label={`Hapus rekening ke-${index + 1}`}
              className="h-[38px] rounded-lg border border-zinc-300 px-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Hapus
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addAccountRow}
          disabled={accountRows.length >= MAX_PAYMENT_ACCOUNTS}
          className="self-start rounded-lg border border-dashed border-zinc-400 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          + Tambah Rekening
        </button>
      </Group>

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          {state.message}
          {state.slug ? (
            <Link
              href={`/${state.slug}`}
              className="font-medium underline underline-offset-2"
            >
              Lihat Undangan
            </Link>
          ) : null}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Menyimpan..." : "Simpan Undangan"}
      </button>
    </form>
  );
}
