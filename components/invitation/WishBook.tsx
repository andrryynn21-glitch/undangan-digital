"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDateTime } from "@/lib/date";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { WishRow } from "@/types/invitation";

interface WishBookProps {
  /** UUID undangan — kolom relasi di tabel `wishes` */
  invitationId: string;
  /** Ucapan yang sudah diambil di server (render pertama) */
  initialWishes: WishRow[];
  /** Dari `getTierFeatures(tier).wishbookRealtime` — khusus paket VIP */
  realtime: boolean;
}

/**
 * Buku ucapan tamu.
 *
 * Daftar awal datang dari server. Pada paket VIP, komponen ini juga berlangganan
 * Supabase Realtime sehingga ucapan baru muncul tanpa reload halaman.
 */
export default function WishBook({
  invitationId,
  initialWishes,
  realtime,
}: WishBookProps) {
  // Hanya ucapan yang masuk lewat Realtime yang disimpan di state. Daftar dari
  // server tetap jadi sumber kebenaran dan digabung saat render, sehingga tidak
  // perlu menyalin props ke state (yang akan basi setelah `revalidatePath`).
  const [liveWishes, setLiveWishes] = useState<WishRow[]>([]);

  const wishes = useMemo(() => {
    const fromServer = new Set(initialWishes.map((wish) => wish.id));
    return [
      ...liveWishes.filter((wish) => !fromServer.has(wish.id)),
      ...initialWishes,
    ];
  }, [initialWishes, liveWishes]);

  useEffect(() => {
    if (!realtime) return;

    let cleanup: (() => void) | undefined;

    try {
      const supabase = getSupabaseBrowserClient();

      const channel = supabase
        .channel(`wishes:${invitationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "wishes",
            filter: `invitation_id=eq.${invitationId}`,
          },
          (payload) => {
            const wish = payload.new as WishRow;

            setLiveWishes((current) =>
              current.some((item) => item.id === wish.id)
                ? current
                : [wish, ...current]
            );
          }
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      // Realtime bersifat penyempurna; kegagalan koneksi tidak boleh
      // membuat daftar ucapan ikut hilang.
      console.error("[wishbook] Realtime tidak aktif:", error);
    }

    return cleanup;
  }, [realtime, invitationId]);

  if (wishes.length === 0) {
    return (
      <div className="inv-glass inv-sheen rounded-[2rem] px-7 py-10 text-center">
        <p className="text-sm leading-relaxed opacity-75">
          Belum ada ucapan. Jadilah yang pertama mengirim doa untuk kedua
          mempelai.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {realtime ? (
        <p
          className="inv-inset mx-auto flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.22em] opacity-80"
          style={{ color: "var(--theme-accent)" }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-current"
            aria-hidden="true"
          />
          Diperbarui otomatis
        </p>
      ) : null}

      <ul className="inv-scroll flex max-h-[28rem] flex-col gap-3.5 overflow-y-auto pr-2">
        {wishes.map((wish) => (
          <li
            key={wish.id}
            className="inv-glass inv-sheen rounded-2xl px-6 py-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p
                className="text-base"
                style={{
                  fontFamily: "var(--theme-font-heading)",
                  color: "var(--theme-primary)",
                }}
              >
                {wish.sender_name}
              </p>
              <time
                dateTime={wish.created_at}
                className="shrink-0 text-[0.65rem] tracking-wide opacity-55"
              >
                {formatDateTime(wish.created_at)}
              </time>
            </div>
            <p className="mt-2 text-sm leading-relaxed opacity-85">
              {wish.message}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
