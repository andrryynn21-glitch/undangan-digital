"use client";

import { useEffect, useState } from "react";

/** Ikon yang tersedia untuk tombol navigasi. */
export type NavIcon =
  | "home"
  | "couple"
  | "story"
  | "event"
  | "rundown"
  | "gallery"
  | "rsvp"
  | "gift"
  | "wish";

export interface NavItem {
  /** `id` elemen `<section>` yang dituju; harus sama dengan `id` di `Section`. */
  id: string;
  label: string;
  icon: NavIcon;
}

/** Jalur SVG tiap ikon, digambar dengan `currentColor` agar ikut warna tema. */
const ICON_PATHS: Record<NavIcon, string> = {
  home: "M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z",
  couple:
    "M12 20s-6.5-3.9-6.5-8.6A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 6.5 2.8C18.5 16.1 12 20 12 20z",
  story: "M12 6.5C10 5 7.5 4.5 4 5v13c3.5-.5 6 0 8 1.5 2-1.5 4.5-2 8-1.5V5c-3.5-.5-6 0-8 1.5zM12 6.5V19.5",
  event: "M4 7.5h16v12.5H4zM8 4v3.5M16 4v3.5M4 11.5h16",
  // JAM, bukan daftar bergaris. "Acara" di sebelahnya sudah memakai kalender,
  // dan dua ikon persegi bergaris berdampingan terbaca sebagai tombol kembar.
  // Jam juga yang paling tepat isinya: yang dicari tamu di bagian ini memang
  // pukul berapa, bukan daftarnya.
  rundown: "M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM12 8v4.3l2.8 1.7",
  gallery: "M4 5.5h16v13H4zM4 15l4.5-4.5 3.5 3.5 3-3L20 15",
  rsvp: "M5 4.5h14v15H5zM8.5 12l2.5 2.5 4.5-5",
  gift: "M4 10h16v9.5H4zM3 6.5h18V10H3zM12 6.5V20M12 6.5S10.5 3 8.5 3.6 8.7 6.5 12 6.5zM12 6.5s1.5-3.5 3.5-2.9S15.3 6.5 12 6.5z",
  wish: "M20 12.5a7.6 7.6 0 0 1-8 7.5 7.7 7.7 0 0 1-3.5-.8L4.5 20.5l1.4-4.2A7.5 7.5 0 0 1 12 5a7.6 7.6 0 0 1 8 7.5z",
};

/** Ikon yang digambar dengan isian, bukan garis. */
const FILLED_ICONS = new Set<NavIcon>(["couple"]);

function ItemIcon({ icon }: { icon: NavIcon }) {
  const filled = FILLED_ICONS.has(icon);

  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[icon]} />
    </svg>
  );
}

interface NavDockProps {
  /**
   * Dari sampul: `true` setelah tamu menekan "Buka Undangan". Sebelum itu
   * tombolnya tidak berguna — tidak ada yang bisa dituju, dan ia hanya akan
   * menutupi sampul.
   */
  active: boolean;
  /** Bagian yang benar-benar ada di undangan ini, berurutan dari atas. */
  items: NavItem[];
}

/**
 * Navigasi mengambang di bawah layar.
 *
 * Inilah yang membedakan undangan yang terasa "dibuat" dari undangan yang
 * terasa seperti halaman web biasa: tamu bisa melompat ke bagian yang ia cari
 * tanpa menggulir seluruh undangan, dan bagian yang sedang dibaca selalu
 * ditandai.
 *
 * Penanda bagian aktif dihitung dari posisi gulir, bukan dari
 * `IntersectionObserver`: yang diinginkan tamu adalah "bagian mana yang sedang
 * saya lihat", dan bagian yang panjang bisa memenuhi layar sambil tetap
 * terhitung sebagai satu irisan. Dengan garis baca di 38% tinggi layar,
 * jawabannya selalu bagian yang isinya sedang menutupi pandangan.
 */
export default function NavDock({ active, items }: NavDockProps) {
  const [currentId, setCurrentId] = useState(items[0]?.id ?? "");

  const idsKey = items.map((item) => item.id).join("|");

  useEffect(() => {
    if (!active || items.length === 0) return;

    let frame = 0;

    const measure = () => {
      frame = 0;

      // Garis baca: bagian yang tepi atasnya sudah melewati garis ini dianggap
      // sedang dibaca. Bagian pertama dipakai sebagai bawaan agar penanda tidak
      // kosong saat tamu masih berada di paling atas.
      const readingLine = window.innerHeight * 0.38;
      let next = items[0].id;

      for (const item of items) {
        const node = document.getElementById(item.id);
        if (!node) continue;

        if (node.getBoundingClientRect().top <= readingLine) next = item.id;
      }

      setCurrentId(next);
    };

    const onScroll = () => {
      // Satu perhitungan per frame: pendengar `scroll` bisa terpanggil puluhan
      // kali dalam satu detik, sedangkan tata letaknya tidak berubah di sela itu.
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // `idsKey` mewakili isi `items`; memakai array-nya langsung akan memasang
    // ulang pendengar setiap kali props diserialkan ulang dari server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, idsKey]);

  if (!active || items.length === 0) return null;

  function goTo(id: string) {
    // `behavior` sengaja tidak dipaksa: nilai "auto" mengikuti `scroll-behavior`
    // di CSS, yang sudah dimatikan saat tamu meminta "kurangi gerakan".
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }

  return (
    <nav
      aria-label="Navigasi undangan"
      className="inv-dock fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] print:hidden"
    >
      <ul className="inv-glass inv-sheen inv-scroll flex max-w-full items-stretch gap-0.5 overflow-x-auto rounded-full px-1.5 py-1.5">
        {items.map((item) => {
          const isCurrent = currentId === item.id;

          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(item.id)}
                aria-current={isCurrent}
                className="inv-dock__item relative flex w-[4.1rem] cursor-pointer flex-col items-center gap-1 rounded-full px-1 py-1.5 text-[0.58rem] tracking-[0.04em] opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:w-[4.6rem]"
                style={{
                  color: "var(--theme-text)",
                  outlineColor: "var(--theme-accent)",
                }}
              >
                <ItemIcon icon={item.icon} />
                <span className="whitespace-nowrap leading-none">
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
