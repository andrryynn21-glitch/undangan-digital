import type { Metadata } from "next";
import Link from "next/link";

import {
  ALL_EXAMPLE_SLUGS,
  COMPARISON_GROUPS,
  HAS_UNSET_PRICE,
  TIER_ORDER,
  TIER_PRESENTATIONS,
  THEME_SHOWCASES,
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

const HEADING_FONT = { fontFamily: "var(--font-playfair-display)" };

/** Centang untuk fitur yang termasuk, garis untuk yang tidak. */
function CellMark({ cell }: { cell: FeatureCell }) {
  return (
    <span className="flex items-start gap-2">
      {cell.available ? (
        <svg
          viewBox="0 0 20 20"
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        >
          <path
            d="M4 10.5l4 4 8-9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 20 20"
          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-600"
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
      )}
      <span className={cell.available ? "" : "text-zinc-500 dark:text-zinc-500"}>
        <span className="sr-only">
          {cell.available ? "Termasuk: " : "Tidak termasuk: "}
        </span>
        {cell.text}
      </span>
    </span>
  );
}

export default async function PaketPage() {
  const existingDemos = await filterExistingSlugs(ALL_EXAMPLE_SLUGS);
  const showcases = THEME_SHOWCASES.filter((showcase) =>
    existingDemos.has(showcase.slug)
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Undangan Digital
        </p>
        <h1
          className="mt-3 text-3xl leading-tight tracking-tight sm:text-4xl"
          style={HEADING_FONT}
        >
          Tiga Paket, Satu Undangan yang Pas
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Ketiga contoh di bawah memakai <strong>data dan foto yang sama</strong>{" "}
          serta tema yang sama, sehingga yang berbeda benar-benar hanya paketnya.
          Buka ketiganya berdampingan untuk menunjukkan bedanya ke customer.
        </p>
      </header>

      {/* Kartu paket */}
      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        {TIER_ORDER.map((tier) => {
          const paket = TIER_PRESENTATIONS[tier];
          const demoReady = existingDemos.has(paket.demoSlug);

          return (
            <article
              key={tier}
              className="flex flex-col rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl" style={HEADING_FONT}>
                  {paket.name}
                </h2>
                {paket.badge ? (
                  <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {paket.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {paket.tagline}
              </p>

              <p className="mt-5 text-2xl font-semibold tracking-tight">
                {paket.price ?? (
                  <span className="text-base font-medium text-zinc-500">
                    Hubungi kami
                  </span>
                )}
              </p>

              <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                {paket.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <svg
                      viewBox="0 0 20 20"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 10.5l4 4 8-9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {highlight}
                  </li>
                ))}
              </ul>

              {demoReady ? (
                <Link
                  href={`/${paket.demoSlug}`}
                  className="mt-6 rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Lihat Contoh {paket.name}
                </Link>
              ) : (
                <p className="mt-6 rounded-lg border border-dashed border-zinc-300 px-4 py-2.5 text-center text-xs text-zinc-500 dark:border-zinc-700">
                  Contoh <code>/{paket.demoSlug}</code> belum dibuat — jalankan{" "}
                  <code>node scripts/seed-demo-paket.mjs</code>
                </p>
              )}
            </article>
          );
        })}
      </section>

      {/* Contoh tema lain — hanya tampil bila undangannya masih ada */}
      {showcases.length > 0 ? (
        <section className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-dashed border-zinc-300 px-5 py-4 text-sm dark:border-zinc-700">
          <span className="text-zinc-600 dark:text-zinc-400">
            Ingin menunjukkan tema yang lain?
          </span>
          {showcases.map((showcase) => (
            <Link
              key={showcase.slug}
              href={`/${showcase.slug}`}
              className="font-medium underline underline-offset-4 hover:opacity-70"
            >
              Tema {showcase.themeName} (paket{" "}
              {TIER_PRESENTATIONS[showcase.minTier].name} ke atas)
            </Link>
          ))}
        </section>
      ) : null}

      {/* Tabel perbandingan */}
      <section className="mt-14">
        <h2 className="text-2xl tracking-tight" style={HEADING_FONT}>
          Perbandingan Rinci
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Semua angka di tabel ini dibaca langsung dari batasan yang berlaku di
          aplikasi, bukan ditulis manual.
        </p>

        {/* Empat kolom tidak muat di layar HP, jadi tabelnya digulir sendiri. */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Perbandingan fitur paket Silver, Premium, dan VIP
            </caption>

            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th scope="col" className="w-[26%] px-5 py-4 font-medium">
                  Fitur
                </th>
                {TIER_ORDER.map((tier) => (
                  <th
                    key={tier}
                    scope="col"
                    className="px-5 py-4 text-base font-medium"
                    style={HEADING_FONT}
                  >
                    {TIER_PRESENTATIONS[tier].name}
                  </th>
                ))}
              </tr>
            </thead>

            {COMPARISON_GROUPS.map((group) => (
              <tbody key={group.title}>
                <tr className="bg-zinc-50 dark:bg-zinc-900/60">
                  <th
                    scope="colgroup"
                    colSpan={TIER_ORDER.length + 1}
                    className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500"
                  >
                    {group.title}
                  </th>
                </tr>

                {group.rows.map((row) => (
                  <tr
                    key={row.label}
                    className={`border-t border-zinc-100 dark:border-zinc-800/70 ${
                      isRowUnavailable(row) ? "opacity-60" : ""
                    }`}
                  >
                    <th scope="row" className="px-5 py-3.5 align-top font-normal">
                      {row.label}
                      {row.note ? (
                        <span className="mt-0.5 block text-xs text-zinc-500">
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

      <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <Link
          href="/admin"
          className="font-medium underline underline-offset-4 hover:opacity-70"
        >
          Buat undangan baru
        </Link>
        {HAS_UNSET_PRICE ? (
          <span className="text-zinc-500">
            Masih ada harga yang kosong — atur di <code>config/tiers.ts</code>{" "}
            pada field <code>price</code>.
          </span>
        ) : null}
      </footer>
    </main>
  );
}
