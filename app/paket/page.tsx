import type { Metadata } from "next";
import Link from "next/link";

import { MotifCrest } from "@/components/invitation/Ornaments";
import { CornerFrame, ThemedHeading } from "@/components/invitation/decor";
import {
  CheckIcon,
  HOUSE_DESIGN,
  MarketingMain,
  SectionHeading,
  mutedText,
} from "@/components/marketing/shell";
import {
  ALL_EXAMPLE_SLUGS,
  COMPARISON_GROUPS,
  HAS_UNSET_PRICE,
  TIER_ORDER,
  TIER_PRESENTATIONS,
  THEME_SHOWCASES,
  UNIVERSAL_HIGHLIGHTS,
  isRowUnavailable,
} from "@/config/tiers";
import type { FeatureCell } from "@/config/tiers";
import { filterExistingSlugs } from "@/lib/invitation";

const TITLE = "Perbandingan Paket";

const DESCRIPTION =
  "Perbandingan lengkap paket Silver, Premium, dan VIP beserta contoh undangannya.";

/**
 * `openGraph` diisi supaya tautan halaman jualan pun tampil rapi saat dikirim
 * ke calon klien lewat WhatsApp — kanal yang sama dengan undangannya sendiri.
 * Tanpa ini yang muncul hanya URL polos.
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: `${TITLE} · Undangan Digital`,
    description: DESCRIPTION,
    type: "website",
    locale: "id_ID",
    url: "/paket",
  },
  twitter: { card: "summary" },
};

/**
 * Ketersediaan undangan contoh dibaca dari database setiap kali halaman dibuka,
 * supaya tombol "Lihat Contoh" tidak pernah menunjuk ke slug yang sudah dihapus.
 */
export const dynamic = "force-dynamic";

/**
 * Halaman ini memakai kerangka visual yang sama dengan halaman depan
 * (`components/marketing/shell.tsx`) — tema rumah, latar bermotif, kaca, dan
 * kilau emas. Sebelumnya isinya identik tapi seluruh warnanya abu-abu zinc
 * dengan varian `dark:`, sehingga pengunjung yang mengeklik "Lihat Paket" dari
 * halaman depan yang mewah langsung mendarat di halaman yang terasa dari situs
 * lain. Isi, tautan, dan logika datanya tidak berubah dari versi itu.
 */

/** Garis kecil untuk fitur yang TIDAK termasuk sebuah paket. */
function DashIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-0.5 h-4 w-4 shrink-0"
      style={{ color: mutedText(40) }}
      aria-hidden="true"
    >
      <path
        d="M5 10h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Centang untuk fitur yang termasuk, garis untuk yang tidak. */
function CellMark({ cell }: { cell: FeatureCell }) {
  return (
    <span className="flex items-start gap-2">
      {cell.available ? <CheckIcon /> : <DashIcon />}
      <span style={cell.available ? undefined : { color: mutedText(55) }}>
        <span className="sr-only">
          {cell.available ? "Termasuk: " : "Tidak termasuk: "}
        </span>
        {cell.text}
      </span>
    </span>
  );
}

/** `<code>` bergaya tema, agar nama berkas & perintah tetap terbaca. */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="rounded px-1.5 py-0.5 text-[0.85em]"
      style={{
        backgroundColor: "color-mix(in srgb, var(--theme-accent) 14%, transparent)",
        color: "var(--theme-text)",
      }}
    >
      {children}
    </code>
  );
}

/** Garis tabel, cukup terlihat tanpa memotong-motong tampilan. */
const HAIRLINE =
  "1px solid color-mix(in srgb, var(--theme-accent) 26%, transparent)";

export default async function PaketPage() {
  const existingDemos = await filterExistingSlugs(ALL_EXAMPLE_SLUGS);
  const showcases = THEME_SHOWCASES.filter((showcase) =>
    existingDemos.has(showcase.slug)
  );

  return (
    <MarketingMain>
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="inv-reveal">
          <SectionHeading
            eyebrow="Undangan Digital"
            title="Tiga Paket, Satu Undangan yang Pas"
            align="start"
            lead="Ketiga contoh di bawah memakai data dan foto yang sama serta tema yang sama, sehingga yang berbeda benar-benar hanya paketnya. Buka ketiganya berdampingan untuk menunjukkan bedanya ke customer."
          />
        </div>

        {/* Fitur yang sama di ketiga paket. Sengaja ditaruh sebelum kartu harga:
            tanpa ini, hal-hal terbaik produk ini justru tak terlihat, karena yang
            tidak membedakan paket tidak muncul sebagai poin jual di kartu mana
            pun. Labelnya diambil dari tabel perbandingan, bukan ditulis ulang. */}
        {UNIVERSAL_HIGHLIGHTS.length > 0 ? (
          <section className="inv-glass inv-sheen mt-10 rounded-2xl px-6 py-5">
            <h2
              className="text-[0.7rem] font-medium uppercase tracking-[0.2em]"
              style={{ color: "var(--theme-accent)" }}
            >
              Termasuk di semua paket
            </h2>

            <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-2.5 text-sm">
              {UNIVERSAL_HIGHLIGHTS.map((label) => (
                <li key={label} className="flex items-start gap-2">
                  <CheckIcon />
                  <span style={{ color: mutedText(85) }}>{label}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Kartu paket */}
        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          {TIER_ORDER.map((tier) => {
            const paket = TIER_PRESENTATIONS[tier];
            const demoReady = existingDemos.has(paket.demoSlug);

            return (
              <article
                key={tier}
                className="inv-glass inv-sheen relative flex flex-col overflow-hidden rounded-2xl p-6"
              >
                <CornerFrame design={HOUSE_DESIGN} size="h-10 w-10" />

                <div className="flex items-start justify-between gap-3">
                  <h2
                    className="text-xl tracking-tight"
                    style={{
                      fontFamily: "var(--theme-font-heading)",
                      color: "var(--theme-primary)",
                    }}
                  >
                    {paket.name}
                  </h2>

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
                  style={{ color: mutedText(72) }}
                >
                  {paket.tagline}
                </p>

                <p className="mt-5 text-2xl font-semibold tracking-tight">
                  {paket.price ?? (
                    <span
                      className="text-base font-medium"
                      style={{ color: mutedText(60) }}
                    >
                      Hubungi kami
                    </span>
                  )}
                </p>

                <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                  {paket.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <CheckIcon />
                      <span style={{ color: mutedText(85) }}>{highlight}</span>
                    </li>
                  ))}
                </ul>

                {demoReady ? (
                  <Link
                    href={`/${paket.demoSlug}`}
                    className="inv-btn mt-6 rounded-full px-4 py-2.5 text-center text-sm font-medium"
                  >
                    Lihat Contoh {paket.name}
                  </Link>
                ) : (
                  <p
                    className="mt-6 rounded-lg px-4 py-2.5 text-center text-xs"
                    style={{
                      border: `1px dashed ${mutedText(30)}`,
                      color: mutedText(62),
                    }}
                  >
                    Contoh <Code>/{paket.demoSlug}</Code> belum dibuat — jalankan{" "}
                    <Code>node scripts/seed-demo-paket.mjs</Code>
                  </p>
                )}
              </article>
            );
          })}
        </section>

        {/* Contoh tema lain — hanya tampil bila undangannya masih ada */}
        {showcases.length > 0 ? (
          <section
            className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-xl px-5 py-4 text-sm"
            style={{ border: `1px dashed ${mutedText(28)}` }}
          >
            <span className="flex items-center gap-2.5" style={{ color: mutedText(72) }}>
              <span style={{ color: "var(--theme-gold)" }}>
                <MotifCrest motif={HOUSE_DESIGN.motif} width={22} />
              </span>
              Ingin menunjukkan tema yang lain?
            </span>

            {showcases.map((showcase) => (
              <Link
                key={showcase.slug}
                href={`/${showcase.slug}`}
                className="font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
                style={{ color: "var(--theme-primary)" }}
              >
                Tema {showcase.themeName} (paket{" "}
                {TIER_PRESENTATIONS[showcase.minTier].name} ke atas)
              </Link>
            ))}
          </section>
        ) : null}

        {/* Tabel perbandingan */}
        <section className="mt-16">
          <SectionHeading
            eyebrow="Rincian"
            title="Perbandingan Rinci"
            lead="Semua angka di tabel ini dibaca langsung dari batasan yang berlaku di aplikasi, bukan ditulis manual."
          />

          {/* Empat kolom tidak muat di layar HP, jadi tabelnya digulir sendiri. */}
          <div className="inv-glass mt-8 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Perbandingan fitur paket Silver, Premium, dan VIP
              </caption>

              <thead>
                <tr style={{ borderBottom: HAIRLINE }}>
                  <th scope="col" className="w-[26%] px-5 py-4 font-medium">
                    Fitur
                  </th>
                  {TIER_ORDER.map((tier) => (
                    <th
                      key={tier}
                      scope="col"
                      className="px-5 py-4 text-base font-medium"
                      style={{
                        fontFamily: "var(--theme-font-heading)",
                        color: "var(--theme-primary)",
                      }}
                    >
                      {TIER_PRESENTATIONS[tier].name}
                    </th>
                  ))}
                </tr>
              </thead>

              {COMPARISON_GROUPS.map((group) => (
                <tbody key={group.title}>
                  <tr
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--theme-secondary) 62%, transparent)",
                    }}
                  >
                    <th
                      scope="colgroup"
                      colSpan={TIER_ORDER.length + 1}
                      className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--theme-accent)" }}
                    >
                      {group.title}
                    </th>
                  </tr>

                  {group.rows.map((row) => (
                    <tr
                      key={row.label}
                      className={isRowUnavailable(row) ? "opacity-60" : ""}
                      style={{ borderTop: HAIRLINE }}
                    >
                      <th
                        scope="row"
                        className="px-5 py-3.5 align-top font-normal"
                      >
                        {row.label}
                        {row.note ? (
                          <span
                            className="mt-0.5 block text-xs"
                            style={{ color: mutedText(60) }}
                          >
                            {row.note}
                          </span>
                        ) : null}
                      </th>

                      {TIER_ORDER.map((tier) => (
                        <td key={tier} className="px-5 py-3.5 align-top">
                          <CellMark cell={row.cells[tier]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </section>

        {/* Penutup */}
        <section className="mt-14">
          <div className="inv-glass inv-glass-strong inv-sheen relative overflow-hidden rounded-[2rem] px-8 py-12 text-center">
            <CornerFrame design={HOUSE_DESIGN} />

            <span className="inv-float inline-block" style={{ color: "var(--theme-gold)" }}>
              <MotifCrest motif={HOUSE_DESIGN.motif} width={40} />
            </span>

            <ThemedHeading
              level={HOUSE_DESIGN.level}
              className="mt-5 text-2xl leading-tight tracking-tight sm:text-3xl"
            >
              Sudah Menemukan Paket yang Pas?
            </ThemedHeading>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/admin"
                className="inv-btn rounded-full px-8 py-3.5 text-sm font-medium tracking-wide"
              >
                Buat Undangan Baru
              </Link>

              <Link
                href="/"
                className="rounded-full px-6 py-3.5 text-sm font-medium tracking-wide underline underline-offset-4 transition-opacity hover:opacity-70"
                style={{ color: "var(--theme-primary)" }}
              >
                Kembali ke halaman depan
              </Link>
            </div>

            {HAS_UNSET_PRICE ? (
              <p className="mt-7 text-xs" style={{ color: mutedText(60) }}>
                Masih ada harga yang kosong — atur di <Code>config/tiers.ts</Code>{" "}
                pada field <Code>price</Code>.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </MarketingMain>
  );
}
