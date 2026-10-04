"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { CornerFrame, Divider, Monogram, ThemedHeading, getDecorProfile } from "@/components/invitation/decor";
import type { Design } from "@/components/invitation/decor";
import { GrandMotif, GrandSpray } from "@/components/invitation/GrandOrnament";
import MusicPlayer from "@/components/invitation/MusicPlayer";
import NavDock from "@/components/invitation/NavDock";
import type { NavItem } from "@/components/invitation/NavDock";

interface CoverGateProps {
  /** Nama panggilan mempelai pria */
  groomName: string;
  /** Nama panggilan mempelai wanita */
  brideName: string;
  /** Teks kecil di atas nama, misal "Undangan Pernikahan" */
  eyebrow?: string;
  /** Tanggal acara yang sudah diformat di server, misal "Jumat, 20 November 2026" */
  dateText?: string;
  /** Foto sampul dari `event_data.cover_photo_url` */
  coverPhotoUrl?: string;
  /**
   * Gambar acuan tema dari `theme_config.backgroundUrl`.
   *
   * Bila ada, gambar inilah yang menjadi latar sampul — bukan foto mempelai.
   * Itu memang niatnya: gambar acuan dipilih khusus sebagai latar, sedangkan
   * foto sampul tetap tampil utuh di bagian pembuka dan di pratinjau WhatsApp.
   */
  backgroundUrl?: string | null;
  /**
   * Rata-rata terang gambar acuan (0-1) dari hasil pembacaan warna.
   * Menentukan kekuatan peredup: gambar terang perlu peredup lebih tebal agar
   * nama mempelai yang berwarna putih tetap terbaca di atasnya.
   */
  coverLuminance?: number;
  /**
   * Nama tamu dari tautan personal (`?to=`). Bila ada, sampul menyapa tamunya
   * dengan "Kepada Yth."; bila tidak, sampul tampil seperti undangan biasa.
   */
  guestName?: string;
  /**
   * Musik latar (paket VIP). Diserahkan ke sini, bukan dirender halaman,
   * karena pemutarannya harus dimulai oleh ketukan "Buka Undangan" — browser
   * menolak audio yang berbunyi sendiri tanpa gestur pengguna.
   */
  musicUrl?: string | null;
  /**
   * Bagian yang ada di undangan ini, untuk tombol navigasi mengambang.
   * Disusun halaman (bukan komponen ini) karena hanya halaman yang tahu bagian
   * mana yang benar-benar dirender — galeri dan amplop digital bisa tidak ada.
   */
  sections?: NavItem[];
  design: Design;
  /** Isi undangan yang tersembunyi sampai sampul dibuka */
  children: ReactNode;
}

/**
 * Sampul undangan (gerbang pembuka).
 *
 * Isi undangan tetap dirender di server (baik untuk SEO & preview link),
 * hanya ditutupi lapisan sampul sampai tamu menekan "Buka Undangan". Saat
 * dibuka, lapisan sampul memudar & membesar sedikit, lalu isi undangan naik
 * berurutan lewat kelas `.inv-reveal`.
 */
export default function CoverGate({
  groomName,
  brideName,
  eyebrow = "Undangan Pernikahan",
  dateText,
  coverPhotoUrl,
  backgroundUrl,
  coverLuminance,
  guestName,
  musicUrl,
  sections = [],
  design,
  children,
}: CoverGateProps) {
  const [opened, setOpened] = useState(false);

  // Kunci scroll halaman selama sampul masih tertutup.
  useEffect(() => {
    if (opened) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [opened]);

  // Gambar acuan tema menang atas foto sampul sebagai latar — lihat komentar
  // pada prop `backgroundUrl`. Tanpa gambar acuan, perilakunya sama persis
  // seperti sebelum fitur ini ada.
  const coverImageUrl = backgroundUrl ?? coverPhotoUrl;

  // Di atas foto, warna tema tidak lagi menjamin kontras — teks dibuat putih
  // dengan bayangan halus dan kartu memakai kaca gelap.
  const onPhoto = Boolean(coverImageUrl);

  const textStyle: CSSProperties = onPhoto
    ? { color: "#fff", textShadow: "0 1px 12px rgba(0,0,0,0.45)" }
    : { color: "var(--theme-text)" };

  const headingStyle: CSSProperties = {
    fontFamily: "var(--theme-font-heading)",
    ...(onPhoto
      ? { color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }
      : { color: "var(--theme-primary)" }),
  };

  const frameClass =
    design.frameStyle === "arch"
      ? "rounded-t-[11rem] rounded-b-[2rem]"
      : design.frameStyle === "floral"
        ? "rounded-[2.75rem]"
        : "rounded-[1.25rem]";

  // Peredup gradien tiga titik. Angka dasarnya sudah terbukti enak dilihat di
  // atas foto mempelai, jadi tanpa data terang gambar nilainya tidak diubah
  // sedikit pun — `lift` bernilai 0 dan hasilnya identik dengan sebelumnya.
  //
  // Bila terang gambar diketahui, peredup digeser: gambar terang (latar bunga
  // pastel dari Pinterest) mendapat peredup lebih tebal supaya nama mempelai
  // yang putih tidak lenyap, gambar gelap mendapat peredup lebih ringan supaya
  // sampulnya tidak jadi hitam pekat. Batasnya dijaga agar tidak ada nilai yang
  // keluar dari rentang yang masih terlihat wajar.
  const lift =
    coverLuminance === undefined
      ? 0
      : Math.max(-0.12, Math.min(0.2, (coverLuminance - 0.35) * 0.55));

  const scrim = (base: number) =>
    Math.max(0.12, Math.min(0.85, base + lift)).toFixed(2);

  const scrimGradient = `linear-gradient(180deg, rgba(0,0,0,${scrim(
    0.45
  )}) 0%, rgba(0,0,0,${scrim(0.25)}) 40%, rgba(0,0,0,${scrim(0.6)}) 100%)`;

  return (
    <>
      <div className={opened ? "inv-reveal" : ""}>{children}</div>

      {/* Musik menyusul ketukan "Buka Undangan", satu-satunya gestur yang
          dijamin ada sebelum tamu melihat isi undangan. */}
      <MusicPlayer src={musicUrl} active={opened} />

      {/* Navigasi bagian. Diletakkan DI LUAR pembungkus `inv-reveal` dengan
          alasan yang sama seperti pemutar musik: pembungkus itu memasang
          animasi `transform`, dan elemen ber-transform menjadi acuan posisi
          bagi keturunan `position: fixed` — tombolnya akan ikut tergeser
          bersama bagian undangan alih-alih menempel di layar. */}
      <NavDock active={opened} items={sections} />

      <div
        aria-hidden={opened}
        inert={opened}
        className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-5 py-8 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          opened
            ? "pointer-events-none scale-[1.06] opacity-0 blur-[6px]"
            : "scale-100 opacity-100 blur-0"
        }`}
        style={{ backgroundColor: "var(--theme-background)" }}
      >
        {/* Ornamen puncak dipakai ulang oleh ketiga varian sampul — TIDAK
            boleh diulang dengan menulis ulang gambarnya di tiap varian, supaya
            perubahan ukuran selalu konsisten.

            UKURANNYA IKUT PAKET, bukan tema: Silver tetap 40px (janji
            "tampil bersih"), Premium 96px, VIP 150px. Sebelumnya 40px untuk
            semua paket, sehingga sampul tidak pernah menampilkan motifnya
            sebagai gambar — hanya sebagai ikon kecil di atas monogram. */}
        {design.layout.cover === "veil" ? (
          <CoverVeil
            groomName={groomName}
            brideName={brideName}
            dateText={dateText}
            coverPhotoUrl={coverImageUrl}
            coverLuminance={coverLuminance}
            guestName={guestName}
            onOpen={() => setOpened(true)}
            coverCrest={<CoverOrnament design={design} onPhoto />}
            coverSprays={<CoverSprays design={design} mode="screen" />}
          />
        ) : design.layout.cover === "arch" ? (
          <CoverArch
            groomName={groomName}
            brideName={brideName}
            dateText={dateText}
            coverPhotoUrl={coverImageUrl}
            coverLuminance={coverLuminance}
            guestName={guestName}
            onOpen={() => setOpened(true)}
            coverCrest={<CoverOrnament design={design} onPhoto />}
            coverSprays={<CoverSprays design={design} mode="screen" />}
          />
        ) : (
          <CoverClassic
            groomName={groomName}
            brideName={brideName}
            eyebrow={eyebrow}
            dateText={dateText}
            coverImageUrl={coverImageUrl}
            scrimGradient={scrimGradient}
            frameClass={frameClass}
            onPhoto={onPhoto}
            textStyle={textStyle}
            headingStyle={headingStyle}
            design={design}
            guestName={guestName}
            onOpen={() => setOpened(true)}
          />
        )}
      </div>
    </>
  );
}

/**
 * Sampul klasik: KARTU KACA DI TENGAH LAYAR.
 *
 * Ini isi komponen `CoverGate` yang lama, dipindahkan apa adanya ke fungsi
 * sendiri supaya cabang `veil`/`arch` tidak menduplikasi dua ratus baris di
 * atas. Satu-satunya tambahan di sini adalah sapaan script "The Wedding Of",
 * yang memakai `ThemedHeading variant="script"` — huruf tangan mungil sebelum
 * nama mempelai yang langsung memberi tahu tamu bahwa ini undangan, bukan
 * halaman web biasa.
 */
/**
 * Ornamen puncak sampul, satu-satunya di semua varian sampul.
 *
 * UKURAN IKUT PAKET, BUKAN TEMA
 *
 * Silver 40px (crest lama, apa adanya), Premium 96px, VIP 150px. Ini yang
 * membuat "pilih motif sendiri" menjadi sesuatu yang benar-benar terlihat:
 * motif pilihan klien ada di halaman sampul sebagai gambar besar yang
 * bergerak, bukan sebagai ikon 40px di atas monogram.
 *
 * Kilau garis (`shine`) hanya untuk VIP. Pada dua paket di bawahnya, garis
 * emas yang menyusuri ornamen akan terlihat ramai di ukuran sekecil itu.
 *
 * `color` mengikuti keadaan sampul: di atas foto, ornamen memakai putih
 * semi-transparan supaya tidak mengalahkan peredup; tanpa foto, warnanya
 * ikut token tema seperti elemen lain.
 */
function CoverOrnament({
  design,
  onPhoto = false,
}: {
  design: Design;
  onPhoto?: boolean;
}) {
  const size = design.level === "simple" ? 40 : design.level === "rich" ? 96 : 150;

  return (
    <GrandMotif
      motif={design.motif}
      size={size}
      shine={design.level === "lavish"}
      enter
      className="inv-cover-crest"
      color={
        onPhoto ? "rgba(255,255,255,0.82)" : "var(--theme-accent)"
      }
    />
  );
}

/**
 * Dua semprotan sudut pada sampul.
 *
 * POSISI DI LUAR KARTU, BUKAN DI DALAMNYA
 *
 * Semprotan sengaja dijahit di pojok dan SENGAJA meluber keluar dari tepinya.
 * Yang terlihat sebagai bouquet di sampul undangan cetak memang begitu:
 * rantingnya memotong garis bingkai, bukan berhenti rapi di dalamnya.
 * Semprotan yang dipotong rapi akan terbaca sebagai gambar dekoratif yang
 * dibuat-buat, bukan seperti karangan bunga.
 *
 * Dua mode, karena ada dua bentuk sampul:
 *
 *   - `card` — dijahit di pojok kartu kaca (sampul klasik).
 *   - `screen` — dijahit di pojok layar (sampul veil & arch, yang tidak punya
 *     kartu; di sana satu-satunya "bingkai" adalah tepi layar).
 *
 * `pointer-events: none` dan `aria-hidden` tetap dipasang: ornamen tidak boleh
 * pernah menelan ketukan tombol "Buka Undangan" yang berdiri dekatnya.
 */
function CoverSprays({
  design,
  mode = "card",
}: {
  design: Design;
  mode?: "card" | "screen";
}) {
  const profile = getDecorProfile(design.level);

  if (!profile.grandWatermarkSize) return null;

  const size = design.level === "lavish" ? 210 : 160;
  const color =
    mode === "screen" ? "rgba(255,255,255,0.55)" : "var(--theme-accent)";
  const opacity = design.level === "lavish" ? 0.9 : 0.75;

  return (
    <span
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      <span
        className={`absolute ${
          mode === "card" ? "-top-10 -left-10" : "-top-8 -left-8"
        }`}
        style={{ opacity }}
      >
        <GrandSpray motif={design.motif} corner="top-left" size={size} color={color} />
      </span>
      <span
        className={`absolute ${
          mode === "card" ? "-right-10 -bottom-10" : "-right-8 -bottom-8"
        }`}
        style={{ opacity }}
      >
        <GrandSpray
          motif={design.motif}
          corner="bottom-right"
          size={size}
          color={color}
        />
      </span>
    </span>
  );
}

function CoverClassic({
  groomName,
  brideName,
  eyebrow,
  dateText,
  coverImageUrl,
  scrimGradient,
  frameClass,
  onPhoto,
  textStyle,
  headingStyle,
  design,
  guestName,
  onOpen,
}: {
  groomName: string;
  brideName: string;
  eyebrow: string;
  dateText?: string;
  coverImageUrl?: string;
  scrimGradient: string;
  frameClass: string;
  onPhoto: boolean;
  textStyle: CSSProperties;
  headingStyle: CSSProperties;
  design: Design;
  guestName?: string;
  onOpen: () => void;
}) {
  return (
    <>
      {/* Lapisan foto sampul + peredup agar teks tetap terbaca */}
      {coverImageUrl ? (
        <>
          <Image
            src={coverImageUrl}
            alt=""
            fill
            sizes="100vw"
            // Foto diisi admin dari URL bebas, jadi optimasi gambar Next
            // dilewati — tanpa ini setiap host baru harus didaftarkan dulu
            // di `images.remotePatterns`.
            unoptimized
            priority
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: scrimGradient }}
          />
        </>
      ) : (
        <div
          className={`absolute inset-0 inv-grain inv-surface--${design.level}`}
        />
      )}

        <div
          className={`relative flex w-full max-w-sm flex-col items-center gap-6 px-8 py-14 text-center ${frameClass} ${
            onPhoto ? "inv-sheen inv-cover-panel" : "inv-glass inv-sheen"
          }`}
          style={
            onPhoto
              ? {
                  backgroundColor: "rgba(20,16,14,0.32)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  boxShadow: "0 40px 80px -40px rgba(0,0,0,0.7)",
                }
              : undefined
          }
        >
          <CornerFrame
            design={design}
            size="h-11 w-11 sm:h-14 sm:w-14"
          />

          <p
            className="text-[0.68rem] uppercase tracking-[0.42em] opacity-80"
            style={textStyle}
          >
            {eyebrow}
          </p>

          {/* Ornamen puncak kartu. Semula selalu gunungan, sekarang mengikuti
              motif yang dipilih — supaya sampul ikut berubah bersama seluruh
              halaman, dan gunungan jadi pilihan admin, bukan keputusan
              yang tertanam di komponen ini.

              Hierarki vertikalnya tetap sama: mata tamu turun dari ornamen
              ke monogram ke nama. */}
          <CoverOrnament design={design} onPhoto={onPhoto} />

          {/* Semprotan sudut: dua ranting besar di pojok berhadapan yang
              "menyerang" kartu dari luar. Inilah yang bikin sampul terasa
              seperti undangan cetak, bukan kartu nama — dan hanya dipasang
              pada paket Premium & VIP, karena Silver harus tetap bersih. */}
          <CoverSprays design={design} />

          <Monogram
            initials={`${groomName.charAt(0)}${brideName.charAt(0)}`}
            className="inv-float h-16 w-16"
            textClass="text-lg"
          />

          {/* Sapaan tangan sebelum nama: "The Wedding Of" dalam font script.
              Bukan sekadar hiasan — undangan cetak selalu punya satu baris
              seperti ini, dan kehadirannya yang membedakan sampul undangan
              dari kartu nama biasa. */}
          <ThemedHeading
            as="h2"
            level={design.level}
            variant="script"
            className="inv-cover-script text-2xl leading-none opacity-95"
          >
            The Wedding Of
          </ThemedHeading>

          <h1 className="text-[2.6rem] leading-[1.1]" style={headingStyle}>
            {groomName}
            <span className="my-1 block text-xl opacity-70">&amp;</span>
            {brideName}
          </h1>

          <Divider design={design} />

          {dateText ? (
            <p
              className="text-sm tracking-[0.12em] opacity-90"
              style={textStyle}
            >
              {dateText}
            </p>
          ) : null}

          {/* Sapaan personal. Hanya muncul bila undangan dibuka lewat tautan
              per tamu — tanpa itu, sampul tidak berubah sedikit pun. */}
          {guestName ? (
            <div className="flex flex-col items-center gap-1" style={textStyle}>
              <p className="text-[0.66rem] uppercase tracking-[0.32em] opacity-75">
                Kepada Yth.
              </p>
              {/*
                Nama tamu ditulis dengan font script tema — titik kecil yang
                membuat sampul langsung terasa personal dan berkelas. Huruf
                pertama dibesarkan karena huruf script yang disambungkan
                terlihat buntung lengkung awalnya tanpa huruf kapital di depan.
              */}
              <p
                className="inv-cover-guestname max-w-[16rem] text-3xl leading-snug break-words"
                style={{
                  fontFamily: "var(--theme-font-script)",
                  textShadow: "0 2px 18px rgba(0,0,0,0.55)",
                }}
              >
                {guestName.charAt(0).toUpperCase() + guestName.slice(1)}
              </p>
              <p className="text-[0.7rem] tracking-[0.14em] opacity-70">
                di tempat
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onOpen}
            className="inv-btn inv-pulse mt-2 cursor-pointer rounded-full px-9 py-3.5 text-sm font-medium tracking-[0.08em] focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ outlineColor: "var(--theme-accent)" }}
          >
            Buka Undangan
          </button>
        </div>
    </>
  );
}

/**
 * Sampul varian "veil": satu panel setinggi layar, tanpa kartu kaca.
 *
 * Ini varian tampilan, BUKAN komponen baru yang berdiri sendiri — semua yang
 * dibaca teknologi bantu dan semua gestur browser dijaga identik dengan
 * `CoverGate`: struktur heading yang sama, tombol yang sama, dan efek yang sama
 * saat membesar-memudar. Yang berubah hanyalah susunan visualnya: ornamen di
 * atas, nama di tengah, sapaan & tombol di bawah, sehingga foto sampul terlihat
 * penuh tanpa tertutup kartu.
 */
export function CoverVeil({
  groomName,
  brideName,
  dateText,
  coverPhotoUrl,
  coverLuminance,
  guestName,
  onOpen,
  coverCrest,
  coverSprays,
}: {
  groomName: string;
  brideName: string;
  dateText?: string;
  coverPhotoUrl?: string;
  coverLuminance?: number;
  guestName?: string;
  onOpen: () => void;
  coverCrest: ReactNode;
  /** Semprotan sudut di pojok layar; dipasang pemanggil, bukan digambar ulang
   *  di sini, supaya ukurannya ikut aturan paket yang sama dengan sampul klasik. */
  coverSprays?: ReactNode;
}) {
  return (
    <div className="inv-cover-veil relative flex min-h-dvh w-full flex-col items-center justify-between gap-6 overflow-hidden px-6 py-10 text-center text-white">
      {coverPhotoUrl ? (
        <Image
          src={coverPhotoUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          // Foto diisi admin dari URL bebas — optimasi dilewati agar host
          // baru tidak perlu didaftarkan di `images.remotePatterns`.
          unoptimized
          className="object-cover"
        />
      ) : null}

      {/* Kerudung gradasi: foto asli di tengah, gelap di tepi atas-bawah tempat
          teks berdiri. Opasitasnya tetap mengikuti terang-gelapnya foto, sama
          seperti lapisan peredup pada sampul klasik. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom,
            rgba(10,8,6,${0.62 - (coverLuminance ?? 0.5) * 0.24}) 0%,
            rgba(10,8,6,0.12) 34%,
            rgba(10,8,6,0.10) 62%,
            rgba(10,8,6,${0.66 - (coverLuminance ?? 0.5) * 0.24}) 100%)`,
        }}
        aria-hidden="true"
      />

      {/* Semprotan pojok layar, DI ATAS kerudung: di dalam kerudung gradasinya
          masih terlihat sebagai kabut, sedangkan di atas kerudung rantingnya
          terbaca utuh. */}
      {coverSprays}

      <div className="relative flex flex-col items-center gap-3 pt-4">
        <p className="text-[0.66rem] tracking-[0.45em] uppercase opacity-85">
          Undangan Pernikahan
        </p>
        {coverCrest}
      </div>

      <div className="relative flex flex-col items-center gap-3">
        <p
          className="text-2xl opacity-90"
          style={{ fontFamily: "var(--theme-font-script)" }}
        >
          The Wedding Of
        </p>
        <h1
          className="text-5xl leading-[1.08] sm:text-6xl"
          style={{
            fontFamily: "var(--theme-font-heading)",
            textShadow: "0 2px 24px rgba(0,0,0,0.5)",
          }}
        >
          {groomName}
          <span className="my-1 block text-2xl opacity-80">&amp;</span>
          {brideName}
        </h1>
        {dateText ? (
          <p className="text-sm tracking-[0.18em] opacity-90">{dateText}</p>
        ) : null}
      </div>

      <div className="relative flex w-full max-w-xs flex-col items-center gap-4">
        {guestName ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-[0.66rem] tracking-[0.32em] uppercase opacity-75">
              Kepada Yth.
            </p>
            <p
              className="max-w-[16rem] text-3xl leading-snug break-words"
              style={{
                fontFamily: "var(--theme-font-script)",
                textShadow: "0 2px 18px rgba(0,0,0,0.55)",
              }}
            >
              {guestName.charAt(0).toUpperCase() + guestName.slice(1)}
            </p>
            <p className="text-[0.7rem] tracking-[0.14em] opacity-70">
              di tempat
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpen}
          className="inv-btn inv-pulse cursor-pointer rounded-full px-9 py-3.5 text-sm font-medium tracking-[0.08em] focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ outlineColor: "var(--theme-accent)" }}
        >
          Buka Undangan
        </button>
      </div>
    </div>
  );
}

/**
 * Sampul varian "arch": kartu kaca berbentuk gapura.
 *
 * Bentuknya mengikuti bahasa bingkai `arch` yang sudah dipakai `CornerFrame`,
 * hanya diperbesar ke skala kartu: sisi tegak dengan lengkung penuh di atas.
 * Bila suatu tema tidak punya foto sampul — atau gambar acuannya rusak —
 * varian ini tetap berdiri sendiri karena yang membingkai nama adalah bentuk
 * gapuranya, bukan foto di belakangnya.
 */
export function CoverArch({
  groomName,
  brideName,
  dateText,
  coverPhotoUrl,
  coverLuminance,
  guestName,
  onOpen,
  coverCrest,
  coverSprays,
}: {
  groomName: string;
  brideName: string;
  dateText?: string;
  coverPhotoUrl?: string;
  coverLuminance?: number;
  guestName?: string;
  onOpen: () => void;
  coverCrest: ReactNode;
  /** Semprotan sudut di pojok layar; dipasang pemanggil, bukan digambar ulang
   *  di sini, supaya ukurannya ikut aturan paket yang sama dengan sampul klasik. */
  coverSprays?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-6 py-10">
      {coverPhotoUrl ? (
        <Image
          src={coverPhotoUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          // Foto diisi admin dari URL bebas — optimasi dilewati agar host
          // baru tidak perlu didaftarkan di `images.remotePatterns`.
          unoptimized
          className="object-cover"
        />
      ) : null}

      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: 0.72 - (coverLuminance ?? 0.5) * 0.33 }}
        aria-hidden="true"
      />

      {/* Semprotan pojok layar, DI ATAS peredup hitam — di bawahnya rantingnya
          ikut digelapkan dan membaur dengan foto. */}
      {coverSprays}

      <div className="inv-cover-arch relative flex w-full max-w-sm flex-col items-center gap-4 bg-[rgba(20,16,14,0.34)] px-8 pt-14 pb-12 text-center text-white backdrop-blur-md">
        <div className="inv-cover-arch__frame" aria-hidden="true" />

        <p className="text-[0.66rem] tracking-[0.42em] uppercase opacity-80">
          Undangan Pernikahan
        </p>

        {coverCrest}

        <p
          className="text-2xl opacity-90"
          style={{ fontFamily: "var(--theme-font-script)" }}
        >
          The Wedding Of
        </p>

        <h1
          className="text-4xl leading-[1.12]"
          style={{ fontFamily: "var(--theme-font-heading)" }}
        >
          {groomName}
          <span className="my-1 block text-xl opacity-70">&amp;</span>
          {brideName}
        </h1>

        {dateText ? (
          <p className="text-sm tracking-[0.14em] opacity-90">{dateText}</p>
        ) : null}

        {guestName ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-[0.66rem] tracking-[0.32em] uppercase opacity-75">
              Kepada Yth.
            </p>
            <p
              className="max-w-[16rem] text-3xl leading-snug break-words"
              style={{
                fontFamily: "var(--theme-font-script)",
                textShadow: "0 2px 18px rgba(0,0,0,0.55)",
              }}
            >
              {guestName.charAt(0).toUpperCase() + guestName.slice(1)}
            </p>
            <p className="text-[0.7rem] tracking-[0.14em] opacity-70">
              di tempat
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpen}
          className="inv-btn inv-pulse mt-1 cursor-pointer rounded-full px-9 py-3.5 text-sm font-medium tracking-[0.08em] focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ outlineColor: "var(--theme-accent)" }}
        >
          Buka Undangan
        </button>
      </div>
    </div>
  );
}
