import { CornerFrame, ThemedHeading } from "@/components/invitation/decor";
import type { Design } from "@/components/invitation/decor";
import Reveal from "@/components/invitation/Reveal";
import type { RundownItem } from "@/types/invitation";

interface RundownProps {
  items: RundownItem[];
  design: Design;
}

/**
 * Susunan acara: daftar kegiatan beserta jamnya.
 *
 * SENGAJA TIDAK MIRIP "Kisah Kami", meski keduanya sama-sama daftar bertitik
 * dan bergaris. Kisah adalah cerita yang dibaca satu per satu, jadi tiap
 * tahapnya berdiri sebagai kartu kaca sendiri dan muncul berurutan saat
 * digulir. Rundown adalah TABEL yang dibaca sekilas — tamu mencari satu jam,
 * bukan membaca seluruhnya — jadi bentuknya satu panel utuh berisi baris-baris
 * rapat, dengan jam di kolom tetap di kiri. Kalau keduanya dibuat serupa,
 * undangan terasa mengulang bagian yang sama dua kali dengan isi berbeda.
 *
 * Jamnya diberi kolom BERLEBAR TETAP supaya semua angka rata kanan dan terbaca
 * sebagai kolom waktu. Dibiarkan mengikuti lebar isinya, "08.00 WIB" dan
 * "Setelah Isya" akan menggeser judul kegiatan masing-masing baris ke tempat
 * yang berbeda, dan deretnya berhenti terbaca sebagai jadwal.
 *
 * Garis penghubungnya digambar DI DALAM tiap baris, bukan sekali untuk seluruh
 * daftar. Satu garis panjang harus diletakkan dengan angka tetap dari tepi
 * kiri, padahal kolom jamnya melebar di `sm:` — jadi garis seperti itu pasti
 * meleset dari titiknya di salah satu dari dua lebar layar. Baris terakhir
 * tidak menggambar garis, supaya tidak ada potongan menggantung di bawah titik
 * terakhir.
 */
export default function Rundown({ items, design }: RundownProps) {
  if (items.length === 0) return null;

  return (
    <Reveal>
      <div className="inv-glass inv-sheen relative rounded-[1.6rem] px-5 py-7 sm:px-8">
        <CornerFrame design={design} size="h-8 w-8" />

        <ol className="relative flex flex-col">
          {items.map((item, index) => (
            <li
              key={`${item.time}-${item.title}-${index}`}
              className="relative flex gap-4 sm:gap-5"
            >
              <p
                className="w-[4.5rem] shrink-0 pt-[0.15rem] text-right text-[0.66rem] leading-5 tracking-[0.16em] uppercase sm:w-24 sm:text-[0.7rem]"
                style={{ color: "var(--theme-accent)" }}
              >
                {item.time}
              </p>

              <div className="relative flex-1 pb-6 pl-5 last:pb-0">
                {/* Garis ke titik berikutnya; lihat catatan di atas soal
                    kenapa ia per baris. */}
                {index < items.length - 1 ? (
                  <span
                    className="inv-story-line absolute top-4 bottom-0 left-0 w-px -translate-x-1/2"
                    aria-hidden="true"
                  />
                ) : null}

                {/* Titik penanda. Cincin luar sewarna latar halaman supaya
                    garis tampak terpotong rapi di belakangnya. */}
                <span
                  className="absolute top-[0.3rem] left-0 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "var(--theme-background)",
                    border:
                      "1px solid color-mix(in srgb, var(--theme-accent) 70%, transparent)",
                  }}
                  aria-hidden="true"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: "var(--theme-primary)" }}
                  />
                </span>

                <ThemedHeading
                  as="h3"
                  level={design.level}
                  className="text-base sm:text-lg"
                >
                  {item.title}
                </ThemedHeading>

                {item.note ? (
                  <p className="mt-1 text-sm leading-relaxed opacity-75">
                    {item.note}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
