"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import MusicUpload from "@/components/admin/MusicUpload";
import {
  PhotoUpload,
  PhotoUploadMulti,
} from "@/components/admin/PhotoUpload";
import ThemePalettePreview from "@/components/admin/ThemePalettePreview";
import { MotifPicker } from "@/components/admin/MotifPicker";
import { EVENT_OPTIONS } from "@/config/events";
import { isMotifId } from "@/config/motifs";
import type { MotifId } from "@/config/motifs";
import { CUSTOM_COLOR_FIELDS, parseCustomColors } from "@/lib/palette";
import type { CustomColorOverride } from "@/lib/palette";
import {
  TIERS,
  getAllThemes,
  getTierFeatures,
  isTierAllowed,
} from "@/config/themes";
import type { TierType } from "@/config/themes";
import { TRADITION_LIST } from "@/config/cultures";
import { createInvitation, updateInvitation } from "@/lib/actions";
import { generateSlugFromNames } from "@/lib/slug";
import {
  CREATE_INVITATION_INITIAL_STATE,
  MAX_PAYMENT_ACCOUNTS,
  MAX_QUOTE_LENGTH,
  MAX_STORY_ITEMS,
  MAX_STORY_TEXT_LENGTH,
  MAX_STORY_TITLE_LENGTH,
} from "@/lib/form-state";
import type {
  InvitationRow,
  PaymentAccount,
  StoryItem,
} from "@/types/invitation";

const TIER_LABELS: Record<TierType, string> = {
  silver: "Silver",
  premium: "Premium",
  vip: "VIP",
};

const THEMES = getAllThemes();

// `w-full min-w-0` mencegah input melebar keluar grid pada layar sempit.
const fieldClass =
  "w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

/**
 * Mengubah jam tersimpan ("19.00 WIB") menjadi nilai `<input type="time">`
 * ("19:00").
 *
 * Bentuk simpanannya sengaja berbeda dari bentuk input: yang tersimpan adalah
 * teks yang langsung ditampilkan ke tamu, lengkap dengan zona waktu.
 */
function toTimeInput(startTime: string | undefined): string {
  const match = /(\d{1,2})[.:](\d{2})/.exec(startTime ?? "");

  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
}

/** Baris rekening di form; `id` hanya untuk `key` React, tidak ikut dikirim. */
interface AccountRow extends PaymentAccount {
  id: number;
}

function toAccountRows(accounts: PaymentAccount[]): AccountRow[] {
  if (accounts.length === 0) {
    return [{ id: 0, bank: "", number: "", holder: "" }];
  }

  return accounts.map((account, index) => ({ id: index, ...account }));
}

/** Baris "Kisah Kami" di form; `id` hanya untuk `key` React, tidak ikut dikirim. */
interface StoryRow extends StoryItem {
  id: number;
}

/**
 * Kisah TIDAK dimulai dengan satu baris kosong seperti rekening.
 *
 * Amplop digital hampir selalu dipakai sehingga baris pertamanya menghemat satu
 * klik, sedangkan kisah lebih sering tidak ada; memulai dengan baris kosong
 * berarti setiap undangan menampilkan bagian "Kisah Kami" yang harus dihapus
 * lebih dulu.
 */
function toStoryRows(items: StoryItem[] | undefined): StoryRow[] {
  return (items ?? []).map((item, index) => ({ id: index, ...item }));
}

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

interface InvitationFormProps {
  /**
   * Undangan yang sedang diubah. Bila kosong, form bekerja seperti semula:
   * membuat undangan baru.
   */
  initial?: InvitationRow;
}

/**
 * Form undangan — dipakai untuk membuat maupun mengubah.
 *
 * Satu komponen untuk dua keperluan, bukan dua komponen kembar: aturan paket,
 * kuota foto, dan daftar tema di sini cukup rumit sehingga dua salinan akan
 * berbeda perilaku begitu salah satunya disesuaikan.
 */
export default function InvitationForm({ initial }: InvitationFormProps) {
  const isEdit = Boolean(initial);

  const [state, formAction, pending] = useActionState(
    isEdit ? updateInvitation : createInvitation,
    CREATE_INVITATION_INITIAL_STATE
  );

  const firstEvent = initial?.event_data?.events?.[0];

  // Tier dipantau di klien supaya daftar tema langsung menyesuaikan.
  const [tier, setTier] = useState<TierType>(initial?.tier ?? "silver");

  /**
   * Nama mempelai dipantau karena slug diturunkan darinya — pratinjau tautan
   * ikut berubah sambil admin mengetik, dan slug itu juga dipakai sebagai nama
   * folder foto di Storage. Selama masih kosong, foto masuk ke folder `draft/`.
   */
  const [groomName, setGroomName] = useState(
    initial?.groom_data.fullName ?? ""
  );
  const [brideName, setBrideName] = useState(
    initial?.bride_data.fullName ?? ""
  );

  const previewSlug = generateSlugFromNames(groomName, brideName);

  /**
   * Folder penyimpanan foto. Saat mengubah undangan, slug-nya sudah pasti dan
   * tidak ikut berubah walau nama mempelai diperbaiki — jadi foto baru tetap
   * masuk ke folder yang sama dengan foto lama undangan ini.
   */
  const uploadSlug = initial ? initial.slug : previewSlug;

  /**
   * Baris rekening dilacak lewat id, bukan sekadar jumlah — dengan key yang
   * stabil, menghapus satu baris tidak menggeser nilai input baris lain (semua
   * input di sini tak terkendali / uncontrolled).
   */
  const [accountRows, setAccountRows] = useState<AccountRow[]>(() =>
    toAccountRows(initial?.payment_data?.accounts ?? [])
  );
  const nextRowId = useRef(accountRows.length);

  /**
   * Baris kisah, dilacak lewat id dengan alasan yang sama seperti baris
   * rekening: input di sini tak terkendali, jadi `key` yang stabil membuat
   * menghapus satu tahap tidak menggeser isi tahap berikutnya.
   */
  const [storyRows, setStoryRows] = useState<StoryRow[]>(() =>
    toStoryRows(initial?.event_data?.story)
  );
  const nextStoryId = useRef(storyRows.length);

  // Dipantau untuk menampilkan hint daerah yang sesuai tradisi terpilih.
  const [tradition, setTradition] = useState(
    typeof initial?.theme_config?.tradition === "string"
      ? initial.theme_config.tradition
      : "modern"
  );
  const traditionEntry = TRADITION_LIST.find((t) => t.key === tradition) ?? TRADITION_LIST[0];

  /**
   * Gambar acuan tema, dipantau supaya pratinjau warnanya bisa ikut berubah
   * begitu gambarnya terunggah — tanpa menunggu undangan disimpan.
   */
  const [backgroundUrl, setBackgroundUrl] = useState(
    typeof initial?.theme_config?.backgroundUrl === "string"
      ? initial.theme_config.backgroundUrl
      : ""
  );

  /**
   * Motif yang dipilih admin. String kosong berarti "biarkan tema yang
   * menentukan" — nilainya tetap terkirim sebagai `""` supaya Server Action
   * bisa membedakannya dari "admin benar-benar memilih motif bawaan tema itu".
   */
  const [motif, setMotif] = useState<MotifId | "">(() => {
    const saved = initial?.theme_config?.motif;
    return isMotifId(saved) ? saved : "";
  });

  /**
   * Motif bawaan tema yang sedang dipilih, untuk tombol "Ikuti tema".
   *
   * Dihitung ulang setiap render, bukan disimpan di state: kalau admin berganti
   * tema, tombol ini harus langsung menawarkan motif tema yang baru. Nilai
   * lama yang disimpan di state akan membuat tombol proposes motif yang sudah
   * tidak berlaku.
   */
  const themeDefaultMotif =
    getAllThemes().find((t) => t.id === themeId)?.defaultMotif ?? "kawung";

  /**
   * Warna manual yang menimpa tema. Object kosong berarti "semua dari tema".
   * Dikendalikan lewat input native `type="color"` supaya admin tidak perlu
   * mengetik hex, dan hex tetap bisa diketik manual untuk nilai yang tidak ada
   * di roda warna.
   */
  const [customColors, setCustomColors] = useState<CustomColorOverride>(() => {
    const saved = initial?.theme_config?.customColors;
    const parsed = parseCustomColors(saved);
    return parsed ?? {};
  });

  const availableThemes = THEMES.filter((theme) =>
    isTierAllowed(tier, theme.tierRequirement)
  );

  /**
   * Tema jadi input terkendali supaya pindah paket tidak meninggalkan pilihan
   * yang sudah terkunci. Tanpa ini, memilih tema VIP lalu menurunkan paket akan
   * tetap mengirim tema VIP dan ditolak Server Action dengan pesan yang
   * membingungkan — padahal daftarnya di layar sudah tidak memuat tema itu.
   */
  const [themeId, setThemeId] = useState(
    initial?.theme_id ?? availableThemes[0].id
  );

  if (!availableThemes.some((theme) => theme.id === themeId)) {
    setThemeId(availableThemes[0].id);
  }

  const lockedThemes = THEMES.length - availableThemes.length;
  const features = getTierFeatures(tier);
  const maxPhotos = features.maxPhotos;

  /**
   * Dipakai sebagai `key` grup pemilih berkas. Pada mode buat, nilainya naik
   * setiap kali undangan berhasil disimpan sehingga React membuang pratinjau
   * lama. Pada mode ubah nilainya tetap: memasang ulang komponennya justru akan
   * mengembalikan foto ke nilai props lama yang belum tentu sudah diperbarui.
   */
  const resetKey = isEdit
    ? "edit"
    : state.status === "success"
      ? state.slug
      : "form";

  /**
   * Nama mempelai kini input terkendali, jadi React tidak lagi mengosongkannya
   * sendiri setelah action selesai — pengosongan itu harus dilakukan di sini.
   * Tanpa ini, nama undangan yang baru tersimpan akan tertinggal di form dan
   * ikut terbawa ke undangan berikutnya.
   *
   * Dilakukan saat render (bukan di `useEffect`) mengikuti pola "menyesuaikan
   * state ketika sesuatu berubah" di dokumentasi React: React langsung mengulang
   * render dengan nilai baru sebelum apa pun tampil di layar, jadi tidak ada
   * render berantai seperti pada effect.
   *
   * Hanya berlaku pada mode buat. Pada mode ubah, isi form memang harus tetap
   * berdiri setelah disimpan.
   */
  const [handledState, setHandledState] = useState(state);

  if (state !== handledState) {
    setHandledState(state);

    if (!isEdit && state.status === "success") {
      setGroomName("");
      setBrideName("");
      // Ikut dikosongkan karena nilainya dipegang di sini, bukan di dalam
      // `PhotoUpload`: tanpa ini gambar acuan undangan yang baru tersimpan akan
      // terbawa ke undangan berikutnya, tidak seperti foto-foto lain yang ikut
      // terhapus oleh penggantian `resetKey`.
      setBackgroundUrl("");
      // Baris kisah juga dipegang di sini, jadi harus dikosongkan sendiri —
      // komponennya tidak ikut di-reset oleh `resetKey`.
      setStoryRows([]);
    }
  }

  function addAccountRow() {
    setAccountRows((rows) =>
      rows.length >= MAX_PAYMENT_ACCOUNTS
        ? rows
        : [
            ...rows,
            { id: nextRowId.current++, bank: "", number: "", holder: "" },
          ]
    );
  }

  function removeAccountRow(id: number) {
    setAccountRows((rows) =>
      rows.length <= 1 ? rows : rows.filter((row) => row.id !== id)
    );
  }

  function addStoryRow() {
    setStoryRows((rows) =>
      rows.length >= MAX_STORY_ITEMS
        ? rows
        : [...rows, { id: nextStoryId.current++, title: "", date: "", text: "" }]
    );
  }

  function removeStoryRow(id: number) {
    setStoryRows((rows) => rows.filter((row) => row.id !== id));
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Penanda undangan yang diubah. Slug-nya tidak pernah ikut berubah —
          Server Action memakainya hanya untuk mencari barisnya. */}
      {initial ? (
        <input type="hidden" name="slug" value={initial.slug} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
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
          <select
            name="themeId"
            required
            value={themeId}
            onChange={(event) => setThemeId(event.target.value)}
            className={fieldClass}
          >
            {availableThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jenis Acara">
          <select
            name="eventName"
            required
            defaultValue={firstEvent?.name}
            className={fieldClass}
          >
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
            value={groomName}
            onChange={(event) => setGroomName(event.target.value)}
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
            value={brideName}
            onChange={(event) => setBrideName(event.target.value)}
            placeholder="Ani Rahmawati"
            className={fieldClass}
          />
        </Field>

        {/*
          Dua kolom di bawah ini sudah lama dibaca halaman undangan
          (`CoupleProfile` menampilkan "Putra pertama dari …" dan tautan
          Instagram), tetapi form-nya tidak pernah menyediakannya — jadi
          fiturnya tidak bisa dipakai siapa pun. Sekarang bisa diisi.
        */}
        <Field
          label="Keterangan Mempelai Pria"
          hint="mis. Putra pertama dari Bapak … & Ibu …"
        >
          <input
            type="text"
            name="groomChildOf"
            maxLength={120}
            defaultValue={initial?.groom_data.childOf}
            placeholder="Putra pertama dari Bapak Ahmad & Ibu Siti"
            className={fieldClass}
          />
        </Field>

        <Field
          label="Keterangan Mempelai Wanita"
          hint="mis. Putri kedua dari Bapak … & Ibu …"
        >
          <input
            type="text"
            name="brideChildOf"
            maxLength={120}
            defaultValue={initial?.bride_data.childOf}
            placeholder="Putri kedua dari Bapak Rahman & Ibu Dewi"
            className={fieldClass}
          />
        </Field>

        <Field label="Instagram Mempelai Pria" hint="opsional, tanpa @">
          <input
            type="text"
            name="groomInstagram"
            maxLength={120}
            defaultValue={initial?.groom_data.instagram}
            placeholder="budi.santoso"
            className={fieldClass}
          />
        </Field>

        <Field label="Instagram Mempelai Wanita" hint="opsional, tanpa @">
          <input
            type="text"
            name="brideInstagram"
            maxLength={120}
            defaultValue={initial?.bride_data.instagram}
            placeholder="ani.rahmawati"
            className={fieldClass}
          />
        </Field>

        <Field label="Tanggal Acara">
          <input
            type="date"
            name="eventDate"
            required
            defaultValue={firstEvent?.date}
            className={fieldClass}
          />
        </Field>

        <Field label="Waktu Acara" hint="WIB">
          <input
            type="time"
            name="eventTime"
            required
            defaultValue={toTimeInput(firstEvent?.startTime)}
            className={fieldClass}
          />
        </Field>
      </div>

      {/* Pratinjau tautan. Memakai fungsi yang sama dengan Server Action, jadi
          yang tampil di sini persis yang akan tersimpan — kecuali nomor urut,
          yang baru ditambahkan bila slug-nya ternyata sudah dipakai. */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-xs font-medium text-zinc-500">Tautan undangan</p>

        {initial ? (
          <>
            <p className="mt-1 truncate font-mono text-sm">/{initial.slug}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Tautan tidak ikut berubah walau nama mempelai diperbaiki. Ini
              disengaja: tautan yang sudah dikirim ke tamu harus tetap hidup.
            </p>
          </>
        ) : previewSlug ? (
          <>
            <p className="mt-1 truncate font-mono text-sm">/{previewSlug}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Dibuat otomatis dari nama mempelai. Bila sudah dipakai, nomor urut
              ditambahkan sendiri (mis. <code>{previewSlug}-1</code>).
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">
            Isi nama kedua mempelai untuk melihat tautannya.
          </p>
        )}
      </div>

      <Field label="Nama Tempat">
        <input
          type="text"
          name="venueName"
          required
          minLength={2}
          defaultValue={firstEvent?.venueName}
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
          defaultValue={firstEvent?.address}
          placeholder="Jl. Merdeka No. 10, Bandung"
          className={`${fieldClass} resize-none`}
        />
      </Field>

      <Field label="Link Google Maps" hint="opsional">
        <input
          type="url"
          name="mapsUrl"
          defaultValue={firstEvent?.mapsUrl}
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
              slug={uploadSlug}
              initialUrl={initial?.groom_data.photo_url}
            />

            <PhotoUpload
              name="bridePhotoUrl"
              label="Foto Mempelai Wanita"
              kind="bride"
              slug={uploadSlug}
              initialUrl={initial?.bride_data.photo_url}
            />
          </div>

          <PhotoUpload
            name="coverPhotoUrl"
            label="Foto Sampul / Hero"
            hint="tampil di balik nama mempelai"
            kind="cover"
            slug={uploadSlug}
            initialUrl={initial?.event_data?.cover_photo_url}
          />

          <PhotoUploadMulti
            name="galleryUrls"
            label={`Foto Galeri — paket ${TIER_LABELS[tier]}`}
            maxPhotos={maxPhotos}
            slug={uploadSlug}
            initialUrls={initial?.event_data?.gallery_urls}
          />
        </div>
      </Group>

      {/* Musik hanya ada di paket VIP. Ketika paketnya diturunkan, field ini
          hilang dan Server Action ikut mengosongkan `music_url` — jadi tidak ada
          undangan non-VIP yang diam-diam tetap memutar lagu. */}
      {features.customMusic ? (
        <Group
          title="Musik Latar"
          hint="mulai berbunyi saat tamu menekan “Buka Undangan”"
        >
          <div key={resetKey}>
            <MusicUpload
              name="musicUrl"
              slug={uploadSlug}
              initialUrl={initial?.music_url ?? ""}
            />
          </div>
        </Group>
      ) : null}

      {/*
        Kutipan pembuka. Halaman undangan sudah membacanya sejak lama
        (`event_data.quote`), tetapi tidak ada satu pun cara mengisinya dari
        sini — kotak kutipannya selalu kosong di semua undangan.
      */}
      <Group
        title="Kutipan Pembuka"
        hint="opsional — ayat suci atau kata mutiara yang tampil di bawah nama mempelai"
      >
        <Field
          label="Kutipan"
          labelHidden
        >
          <textarea
            name="quote"
            rows={3}
            maxLength={MAX_QUOTE_LENGTH}
            defaultValue={initial?.event_data?.quote}
            placeholder="Dan di antara tanda-tanda kekuasaan-Nya, Dia menciptakan untukmu pasangan dari jenismu sendiri…"
            className={`${fieldClass} resize-none`}
          />
        </Field>
        <p className="text-xs text-zinc-500">
          Maksimal {MAX_QUOTE_LENGTH} karakter. Bagian ini tidak tampil bila
          dikosongkan.
        </p>
      </Group>

      <Group
        title="Kisah Kami"
        hint={`opsional, maksimal ${MAX_STORY_ITEMS} tahap — tampil sebagai timeline di undangan`}
      >
        {storyRows.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Belum ada tahap kisah. Tambahkan bila ingin menceritakan perjalanan
            kalian berdua.
          </p>
        ) : null}

        {storyRows.map((row, index) => (
          <div
            key={row.id}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-3.5 py-3.5 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-zinc-500">
                Tahap {index + 1}
              </p>

              <button
                type="button"
                onClick={() => removeStoryRow(row.id)}
                aria-label={`Hapus tahap kisah ke-${index + 1}`}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Hapus
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <Field label="Judul Tahap" labelHidden={index > 0}>
                <input
                  type="text"
                  name="storyTitle"
                  defaultValue={row.title}
                  maxLength={MAX_STORY_TITLE_LENGTH}
                  placeholder="Pertemuan Pertama"
                  className={fieldClass}
                />
              </Field>

              <Field label="Waktu" labelHidden={index > 0}>
                <input
                  type="text"
                  name="storyDate"
                  defaultValue={row.date}
                  maxLength={40}
                  placeholder="Maret 2019"
                  className={fieldClass}
                />
              </Field>
            </div>

            <Field label="Cerita" labelHidden={index > 0}>
              <textarea
                name="storyText"
                defaultValue={row.text}
                rows={3}
                maxLength={MAX_STORY_TEXT_LENGTH}
                placeholder="Kami dipertemukan di bangku kuliah, dan sejak itu…"
                className={`${fieldClass} resize-none`}
              />
            </Field>
          </div>
        ))}

        <button
          type="button"
          onClick={addStoryRow}
          disabled={storyRows.length >= MAX_STORY_ITEMS}
          className="self-start rounded-lg border border-dashed border-zinc-400 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          + Tambah Tahap Kisah
        </button>
      </Group>

      <Group
        title="Desain Budaya"
        hint="pilih tradisi untuk mengubah palet warna & motif ornamen undangan"
      >
        <div key={resetKey} className="flex flex-col gap-3">
          <PhotoUpload
            name="backgroundUrl"
            label="Gambar acuan tema"
            hint="(opsional) — warna undangan diambil otomatis dari gambar ini"
            kind="background"
            slug={uploadSlug}
            initialUrl={backgroundUrl}
            onUrlChange={setBackgroundUrl}
          />

          <p className="text-xs text-zinc-500">
            Gambar ini menjadi latar sampul undangan, dan warnanya dipakai untuk
            judul, panel, serta ornamen. Foto sampul tetap tampil utuh di bagian
            pembuka dan di pratinjau WhatsApp.
          </p>

          <ThemePalettePreview
            imageUrl={backgroundUrl}
            themeId={themeId}
            tradition={tradition}
            customColors={customColors}
          />
        </div>

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
              defaultValue={
                typeof initial?.theme_config?.region === "string"
                  ? initial.theme_config.region
                  : undefined
              }
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
        title="Motif Ornamen"
        hint="pilih imajinasi yang akan dipakai di seluruh halaman — semua motif terbuka untuk semua paket"
      >
        <MotifPicker
          name="motif"
          value={motif}
          defaultMotif={themeDefaultMotif}
          onChange={setMotif}
        />

        <p className="text-xs text-zinc-500">
          Motif dipakai di tiga tempat sekaligus: pola latar, ornamen pembatas
          antar bagian, dan titik tengah tiap sudut bingkai. Kalau dibiarkan
          kosong, motif bawaan tema yang menentukan —{" "}
          <strong>{themeDefaultMotif}</strong> untuk tema saat ini.
        </p>
      </Group>

      <Group
        title="Warna Manual"
        hint="opsional — isi hanya warna yang mau diganti; sisanya tetap mengikuti tema, adat, dan gambar acuan"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {CUSTOM_COLOR_FIELDS.map(({ key, label, hint }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={label}
                  value={
                    customColors[key] ??
                    getAllThemes()
                      .find((t) => t.id === themeId)
                      ?.colors[key] ??
                    "#000000"
                  }
                  onChange={(e) =>
                    setCustomColors((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-zinc-300 bg-transparent dark:border-zinc-700"
                />
                <input
                  type="text"
                  name={`color_${key}`}
                  value={customColors[key] ?? ""}
                  placeholder="dari tema"
                  onChange={(e) => {
                    const next = e.target.value.trim();
                    setCustomColors((prev) => {
                      const copy = { ...prev };
                      if (next) copy[key] = next;
                      else delete copy[key];
                      return copy;
                    });
                  }}
                  className={`${fieldClass} font-mono`}
                />
              </div>
              <span className="text-xs text-zinc-500">{hint}</span>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCustomColors({})}
          disabled={Object.keys(customColors).length === 0}
          className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
        >
          Kembalikan semua ke tema
        </button>

        <p className="text-xs text-zinc-500">
          Teks dan latar tetap dijamin terbaca oleh sistem: kalau pilihan membuat
          kontrasnya di bawah ambang aman, terang warnanya otomatis digeser —
          rona pilihanmu tetap dipertahankan.
        </p>
      </Group>

      <Group
        title="Amplop Digital"
        hint={`rekening & e-wallet, maksimal ${MAX_PAYMENT_ACCOUNTS} — biarkan kosong bila tidak dipakai`}
      >
        {accountRows.map((row, index) => (
          <div
            key={row.id}
            className="flex flex-col gap-3 sm:grid sm:items-end sm:grid-cols-[1fr_1.2fr_1.2fr_auto]"
          >
            <Field label="Bank / E-Wallet" labelHidden={index > 0}>
              <input
                type="text"
                name="bankName"
                defaultValue={row.bank}
                placeholder="BCA"
                className={fieldClass}
              />
            </Field>

            <Field label="Nomor Rekening / HP" labelHidden={index > 0}>
              <input
                type="text"
                name="accountNumber"
                inputMode="numeric"
                defaultValue={row.number}
                placeholder="1234567890"
                className={fieldClass}
              />
            </Field>

            <Field label="Atas Nama" labelHidden={index > 0}>
              <input
                type="text"
                name="accountHolder"
                defaultValue={row.holder}
                placeholder="Budi Santoso"
                className={fieldClass}
              />
            </Field>

            <button
              type="button"
              onClick={() => removeAccountRow(row.id)}
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
        {pending
          ? "Menyimpan..."
          : isEdit
            ? "Simpan Perubahan"
            : "Simpan Undangan"}
      </button>
    </form>
  );
}
