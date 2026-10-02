import { CornerFrame, ThemedHeading } from "@/components/invitation/decor";
import type { Design } from "@/components/invitation/decor";
import Reveal from "@/components/invitation/Reveal";
import type { StoryItem } from "@/types/invitation";

interface LoveStoryProps {
  items: StoryItem[];
  design: Design;
}

/**
 * Perjalanan pasangan sebagai timeline.
 *
 * Dua hal yang membuat bagian ini terasa hidup, dan keduanya disengaja:
 *
 *  - Garis penghubungnya digambar memanjang di belakang seluruh tahap, bukan
 *    per kartu. Jadi mata tamu mengikuti satu jalur dari atas ke bawah.
 *  - Tiap tahap muncul sendiri-sendiri saat digulir, dengan jeda yang bertambah
 *    untuk lima kartu pertama. Efeknya berurutan seperti dibacakan, bukan
 *    sederet kartu yang sudah menunggu di layar.
 */
export default function LoveStory({
  items,
  design,
}: LoveStoryProps) {
  if (items.length === 0) return null;

  return (
    <ol className="relative flex flex-col gap-5 sm:gap-6">
      {/* Garis timeline. `left-[0.6rem]` menaruhnya tepat di tengah bulatan
          penanda tiap tahap (lihat `left-0` + `h-5 w-5` di bawah). */}
      <span
        className="inv-story-line absolute top-4 bottom-4 left-[0.6rem] w-px"
        aria-hidden="true"
      />

      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="relative pl-9 sm:pl-11">
          {/* Bulatan penanda tahap. Cincin luar memakai warna latar halaman
              supaya garis timeline tampak terpotong rapi di belakangnya. */}
          <span
            className="absolute top-6 left-0 flex h-5 w-5 items-center justify-center rounded-full"
            style={{
              backgroundColor: "var(--theme-background)",
              border:
                "1px solid color-mix(in srgb, var(--theme-accent) 70%, transparent)",
            }}
            aria-hidden="true"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--theme-primary)" }}
            />
          </span>

          <Reveal delay={Math.min(index, 4) * 90}>
            <article className="inv-glass inv-sheen relative rounded-[1.6rem] px-6 py-6 sm:px-7">
              <CornerFrame design={design} size="h-8 w-8" />

              <div className="relative flex flex-col gap-2">
                {item.date ? (
                  <p
                    className="text-[0.62rem] tracking-[0.26em] uppercase"
                    style={{ color: "var(--theme-accent)" }}
                  >
                    {item.date}
                  </p>
                ) : null}

                {/* 24 px di semua lebar, bukan `text-xl sm:text-2xl`. Pada
                    paket VIP judul ini berkilau, dan kilau itu menurunkan
                    kontras `primary` dari 4,5:1 ke sekitar 3,0:1 — masih sah
                    untuk teks besar, tapi 20 px berbobot 400 bukan teks besar,
                    sehingga judul ini dulu satu-satunya heading di aplikasi
                    yang melanggar ambang kontrasnya sendiri di layar HP.
                    Alasan lengkapnya ada di `.inv-shimmer` (`app/globals.css`). */}
                <ThemedHeading as="h3" level={design.level} className="text-2xl">
                  {item.title}
                </ThemedHeading>

                <p className="text-sm leading-relaxed opacity-80">
                  {item.text}
                </p>
              </div>
            </article>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
