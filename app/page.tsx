import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import Reveal from "@/components/invitation/Reveal";
import { MotifCrest } from "@/components/invitation/Ornaments";
import {
  CornerFrame,
  Divider,
  Monogram,
  ThemedHeading,
} from "@/components/invitation/decor";
import {
  CheckIcon,
  HOUSE_DESIGN,
  HOUSE_THEME,
  MarketingMain,
  SectionHeading,
  mutedText,
} from "@/components/marketing/shell";
import {
  MOTIF_CATEGORIES,
  MOTIF_CATEGORY_LABELS,
  getMotifsByCategory,
} from "@/config/motifs";
import { getAllThemes, getThemeCssVars } from "@/config/themes";
import { ensureReadableTheme } from "@/lib/culture-theme";
import {
  TIER_ORDER,
  TIER_PRESENTATIONS,
  UNIVERSAL_HIGHLIGHTS,
} from "@/config/tiers";

/**
 * Halaman depan memakai judul & deskripsi bawaan dari `app/layout.tsx`, jadi di
 * sini hanya `openGraph` yang perlu ditambahkan — agar tautannya tampil sebagai
 * kartu, bukan URL polos, ketika dibagikan ke calon klien.
 */
export const metadata: Metadata = {
  openGraph: {
    title: "Undangan Digital — Undangan Pernikahan Online",
    description:
      "Undangan pernikahan digital yang bisa dibagikan lewat WhatsApp: hitung mundur, galeri foto, konfirmasi kehadiran, buku ucapan, dan amplop digital.",
    type: "website",
    locale: "id_ID",
    url: "/",
  },
  twitter: { card: "summary" },
};

/**
 * HALAMAN DEPAN MEMAKAI MESIN DEKORASI UNDANGANNYA SENDIRI
 *
 * Sebelumnya berkas ini masih berisi boilerplate `create-next-app` — logo
 * Next.js, kalimat "To get started, edit the page.tsx file", dan tombol
 * "Deploy Now" ke Vercel — di halaman depan publik sebuah usaha undangan
 * pernikahan.
 *
 * Penggantinya sengaja TIDAK memakai ilustrasi atau aset dari luar. Produk ini
 * sudah punya lima belas motif batik, wayang, flora, fauna, dan ornamen mewah
 * (`Ornaments.tsx`), latar berlapis, kaca, serta kilau emas — semuanya
 * terpasang rapi tapi selama ini hanya terlihat di halaman undangan, tidak
 * pernah di halaman yang justru dilihat calon pembeli lebih dulu.
 *
 * Dengan memakai komponen yang sama persis (`Backdrop`, `CornerFrame`,
 * `Divider`, `MotifCrest`, `Monogram`), halaman ini bukan sekadar menceritakan
 * kemewahannya, melainkan MENUNJUKKAN keluaran asli mesinnya. Konsekuensinya
 * juga menyenangkan: menambah motif atau tema baru otomatis muncul di sini
 * tanpa ada yang perlu diperbarui manual.
 */

/** Fitur unggulan di hero, diringkas agar tidak menyaingi daftar lengkap. */
const HERO_POINTS = [
  "Dibagikan lewat WhatsApp",
  "Tanpa aplikasi tambahan",
  "Siap dalam hitungan menit",
];

export default function Home() {
  // Bagian tema di bawah berjudul "Warna yang Dijamin Terbaca", jadi warna yang
  // dipamerkan harus benar-benar warna yang dijamin itu. Warna mentah di
  // `config/themes/*.json` belum diuji kontrasnya; yang dipasang undangan adalah
  // hasil koreksi di lapis terakhir `app/[slug]/page.tsx`. Memakai koreksi yang
  // sama di sini membuat contoh warna dan kotak swatch cocok dengan yang nanti
  // dilihat tamu — bukan sekadar mengklaimnya.
  const themes = getAllThemes().map(ensureReadableTheme);

  return (
    <MarketingMain>

      {/* ============================================
          Hero
          ============================================ */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-16 sm:pt-28">
        <div className="inv-reveal flex flex-col items-center text-center">
          <span className="inv-cover-crest">
            <MotifCrest motif={HOUSE_DESIGN.motif} width={56} />
          </span>

          <p
            className="mt-6 text-[0.7rem] font-medium uppercase tracking-[0.24em]"
            style={{ color: "var(--theme-accent)" }}
          >
            Undangan Digital
          </p>

          <ThemedHeading
            as="h1"
            level={HOUSE_DESIGN.level}
            className="mt-4 max-w-3xl text-4xl leading-[1.15] tracking-tight sm:text-5xl md:text-6xl"
          >
            Undangan Pernikahan yang Pantas Dibanggakan
          </ThemedHeading>

          <p
            className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: mutedText(80) }}
          >
            Batik, wayang, sakura, atau merak — undangan Anda dirancang dari
            motif yang benar-benar berarti, lalu dikirim cukup lewat sebuah
            tautan WhatsApp.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/paket"
              className="inv-btn inv-pulse rounded-full px-8 py-3.5 text-sm font-medium tracking-wide"
            >
              Lihat Paket &amp; Contoh
            </Link>

            <Link
              href="/admin"
              className="inv-glass rounded-full px-8 py-3.5 text-sm font-medium tracking-wide transition-opacity hover:opacity-80"
              style={{ color: "var(--theme-text)" }}
            >
              Buat Undangan
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs">
            {HERO_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-1.5">
                <CheckIcon />
                <span
                  style={{
                    color: mutedText(75),
                  }}
                >
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================
          Pratinjau kartu undangan
          ============================================ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <Reveal className="mx-auto max-w-md">
          {/* Kartu ini dirakit dari komponen undangan yang sebenarnya, jadi
              yang dilihat calon pembeli di sini benar-benar sama dengan yang
              akan diterima tamunya. */}
          <article className="inv-glass inv-glass-strong inv-sheen relative overflow-hidden rounded-[2rem] px-8 py-12 text-center">
            <CornerFrame design={HOUSE_DESIGN} />

            <p
              className="text-[0.65rem] uppercase tracking-[0.3em]"
              style={{ color: "var(--theme-accent)" }}
            >
              The Wedding Of
            </p>

            <ThemedHeading
              level={HOUSE_DESIGN.level}
              className="mt-5 text-3xl leading-tight tracking-tight sm:text-4xl"
            >
              Bagas &amp; Anindya
            </ThemedHeading>

            <Divider design={HOUSE_DESIGN} className="mt-6" />

            <div className="mt-6 flex items-center justify-center">
              <Monogram initials="B&A" className="inv-float h-20 w-20" textClass="text-xl" />
            </div>

            <p
              className="mt-7 text-sm tracking-[0.18em] uppercase"
              style={{ color: "var(--theme-text)" }}
            >
              Sabtu, 12 Desember
            </p>

            <p
              className="mt-2 text-xs"
              style={{ color: mutedText(68) }}
            >
              Pendopo Agung · Yogyakarta
            </p>
          </article>
        </Reveal>

        <p
          className="mt-6 text-center text-xs"
          style={{ color: mutedText(62) }}
        >
          Contoh tampilan paket VIP dengan tema {HOUSE_THEME.name}.
        </p>
      </section>

      {/* ============================================
          Galeri motif
          ============================================ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <Reveal>
          <SectionHeading
            eyebrow="Imajinasi"
            title="Lima Belas Motif, Bukan Sekadar Template"
            lead="Setiap motif digambar sebagai vektor, bukan gambar yang diunduh — jadi tetap tajam di layar mana pun dan warnanya ikut tema yang Anda pilih. Motif ini muncul di latar, pembatas antar bagian, dan sudut bingkai undangan."
          />
        </Reveal>

        <div className="mt-12 flex flex-col gap-10">
          {MOTIF_CATEGORIES.map((category) => (
            <Reveal key={category}>
              <div>
                <h3
                  className="text-[0.7rem] font-medium uppercase tracking-[0.2em]"
                  style={{ color: "var(--theme-accent)" }}
                >
                  {MOTIF_CATEGORY_LABELS[category]}
                </h3>

                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {getMotifsByCategory(category).map((motif) => (
                    <li key={motif.id}>
                      <div
                        className="inv-jewel flex h-full flex-col items-center gap-3 rounded-2xl px-3 py-6 text-center"
                        title={motif.note}
                      >
                        <span style={{ color: "var(--theme-primary)" }}>
                          <MotifCrest motif={motif.id} width={38} />
                        </span>

                        <span
                          className="text-[0.72rem] font-medium leading-tight"
                          style={{ color: "var(--theme-text)" }}
                        >
                          {motif.label}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================
          Tema
          ============================================ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <Reveal>
          <SectionHeading
            eyebrow="Tema"
            title="Warna yang Dijamin Terbaca"
            lead="Punya foto acuan? Warnanya diambil langsung dari foto itu, lalu setiap warna diperiksa kontrasnya terhadap standar WCAG sebelum dipasang — sehingga undangan tetap terbaca di layar HP mana pun, bukan sekadar terlihat cantik di layar perancangnya."
          />
        </Reveal>

        <Reveal>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2">
            {themes.map((theme) => (
              <li key={theme.id}>
                <article
                  className="inv-glass inv-sheen relative overflow-hidden rounded-2xl p-6"
                  style={getThemeCssVars(theme) as CSSProperties}
                >
                  <CornerFrame
                    design={{
                      frameStyle: theme.frameStyle,
                      level: "rich",
                      motif: theme.defaultMotif,
                      layout: theme.layout,
                    }}
                    size="h-10 w-10"
                  />

                  <div className="flex items-center gap-4">
                    <span style={{ color: "var(--theme-primary)" }}>
                      <MotifCrest motif={theme.defaultMotif} width={34} />
                    </span>

                    <div>
                      <h3
                        className="text-lg tracking-tight"
                        style={{
                          fontFamily: "var(--theme-font-heading)",
                          color: "var(--theme-primary)",
                        }}
                      >
                        {theme.name}
                      </h3>

                      <p
                        className="mt-0.5 text-xs"
                        style={{
                          color:
                            mutedText(68),
                        }}
                      >
                        Paket {TIER_PRESENTATIONS[theme.tierRequirement].name} ke
                        atas
                      </p>
                    </div>
                  </div>

                  {/* Contoh warna tema, dibaca langsung dari definisinya. */}
                  <div className="mt-5 flex gap-2">
                    {(
                      [
                        ["primary", "Utama"],
                        ["secondary", "Pendukung"],
                        ["accent", "Aksen"],
                        ["text", "Teks"],
                      ] as const
                    ).map(([key, label]) => (
                      <span
                        key={key}
                        className="h-8 flex-1 rounded-lg"
                        style={{
                          backgroundColor: theme.colors[key],
                          border:
                            `1px solid ${mutedText(14)}`,
                        }}
                        title={`${label}: ${theme.colors[key]}`}
                      />
                    ))}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ============================================
          Yang termasuk di semua paket
          ============================================ */}
      {UNIVERSAL_HIGHLIGHTS.length > 0 ? (
        <section className="mx-auto w-full max-w-5xl px-6 pb-20">
          <Reveal>
            <SectionHeading
              eyebrow="Isi Undangan"
              title="Termasuk di Semua Paket"
              lead="Daftar ini dibaca langsung dari tabel perbandingan paket, jadi tidak mungkin berbeda dengan yang benar-benar Anda terima."
            />
          </Reveal>

          <Reveal>
            <ul className="mt-12 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {UNIVERSAL_HIGHLIGHTS.map((label) => (
                <li key={label} className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span
                    style={{
                      color: mutedText(85),
                    }}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : null}

      {/* ============================================
          Ringkasan paket
          ============================================ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <Reveal>
          <SectionHeading
            eyebrow="Paket"
            title="Tiga Paket, Satu Undangan yang Pas"
          />
        </Reveal>

        <Reveal>
          <ul className="mt-12 grid gap-5 lg:grid-cols-3">
            {TIER_ORDER.map((tier) => {
              const paket = TIER_PRESENTATIONS[tier];

              return (
                <li key={tier} className="flex">
                  <article className="inv-glass inv-sheen relative flex w-full flex-col overflow-hidden rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className="text-xl tracking-tight"
                        style={{
                          fontFamily: "var(--theme-font-heading)",
                          color: "var(--theme-primary)",
                        }}
                      >
                        {paket.name}
                      </h3>

                      {paket.badge ? (
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            backgroundColor: "var(--theme-primary)",
                            color: "var(--theme-on-primary)",
                          }}
                        >
                          {paket.badge}
                        </span>
                      ) : null}
                    </div>

                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{
                        color: mutedText(72),
                      }}
                    >
                      {paket.tagline}
                    </p>

                    <p className="mt-5 text-2xl font-semibold tracking-tight">
                      {paket.price ?? (
                        <span
                          className="text-base font-medium"
                          style={{
                            color:
                              mutedText(60),
                          }}
                        >
                          Hubungi kami
                        </span>
                      )}
                    </p>

                    <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                      {paket.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2">
                          <CheckIcon />
                          <span
                            style={{
                              color:
                                mutedText(85),
                            }}
                          >
                            {highlight}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal>
          <p className="mt-8 text-center">
            <Link
              href="/paket"
              className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
              style={{ color: "var(--theme-primary)" }}
            >
              Lihat perbandingan rinci &amp; contoh undangannya
            </Link>
          </p>
        </Reveal>
      </section>

      {/* ============================================
          Penutup
          ============================================ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <Reveal>
          <div className="inv-glass inv-glass-strong inv-sheen relative overflow-hidden rounded-[2rem] px-8 py-14 text-center">
            <CornerFrame design={HOUSE_DESIGN} />

            <span className="inv-float inline-block" style={{ color: "var(--theme-gold)" }}>
              <MotifCrest motif={HOUSE_DESIGN.motif} width={44} />
            </span>

            <ThemedHeading
              level={HOUSE_DESIGN.level}
              className="mt-5 text-2xl leading-tight tracking-tight sm:text-3xl"
            >
              Siap Membagikan Kabar Bahagia Anda?
            </ThemedHeading>

            <p
              className="mx-auto mt-4 max-w-md text-sm leading-relaxed"
              style={{ color: mutedText(78) }}
            >
              Undangannya bisa dibuat sekarang, dan tautannya langsung siap
              dikirim ke grup keluarga.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/admin"
                className="inv-btn rounded-full px-8 py-3.5 text-sm font-medium tracking-wide"
              >
                Mulai Buat Undangan
              </Link>

              <Link
                href="/paket"
                className="rounded-full px-6 py-3.5 text-sm font-medium tracking-wide underline underline-offset-4 transition-opacity hover:opacity-70"
                style={{ color: "var(--theme-primary)" }}
              >
                Bandingkan paket dulu
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingMain>
  );
}
