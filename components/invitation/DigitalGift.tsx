"use client";

import { useEffect, useRef, useState } from "react";

import { CornerFrame, getDecorProfile } from "@/components/invitation/decor";
import type { DecorLevel } from "@/components/invitation/decor";
import type { FrameStyle } from "@/config/themes";
import type { PaymentAccount } from "@/types/invitation";

/**
 * Menyalin teks ke clipboard.
 *
 * `navigator.clipboard` hanya tersedia di secure context (https / localhost),
 * jadi disediakan jalur cadangan lewat elemen sementara + `execCommand` agar
 * tombol tetap berfungsi saat undangan dibuka lewat http di jaringan lokal.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Lanjut ke jalur cadangan di bawah.
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(field);
    return copied;
  } catch {
    return false;
  }
}

function WalletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="5.5" width="19" height="14" rx="3" />
      <path d="M2.5 10h19" />
      <path d="M17.5 15h1.5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H5.5A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

interface DigitalGiftProps {
  accounts: PaymentAccount[];
  frameStyle: FrameStyle;
  level: DecorLevel;
}

/**
 * Amplop digital: daftar rekening bank & e-wallet dengan tombol salin.
 *
 * Nomor yang disalin dibersihkan dari spasi/tanda hubung supaya bisa langsung
 * ditempel di aplikasi m-banking, sementara yang tampil tetap versi yang mudah
 * dibaca sesuai yang diisi admin.
 */
export default function DigitalGift({
  accounts,
  frameStyle,
  level,
}: DigitalGiftProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [failedIndex, setFailedIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kaca tebal + elevasi hanya untuk paket yang memang menjanjikannya.
  const glassClass = getDecorProfile(level).strongGlass
    ? "inv-glass inv-glass-strong"
    : "inv-glass";

  // Timer status "Tersalin" dibersihkan saat komponen dilepas agar tidak
  // memanggil setState pada komponen yang sudah tidak ada.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy(index: number, rawNumber: string) {
    const plainNumber = rawNumber.replace(/[\s.-]/g, "");
    const copied = await copyText(plainNumber);

    setCopiedIndex(copied ? index : null);
    setFailedIndex(copied ? null : index);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopiedIndex(null);
      setFailedIndex(null);
    }, 2400);
  }

  if (accounts.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {accounts.map((account, index) => {
        const isCopied = copiedIndex === index;
        const isFailed = failedIndex === index;

        return (
          <article
            key={`${account.bank}-${account.number}-${index}`}
            className={`${glassClass} inv-sheen relative overflow-hidden rounded-[1.75rem] px-6 py-7 sm:px-8`}
          >
            <CornerFrame frameStyle={frameStyle} level={level} size="h-9 w-9" />

            {/* Pita cahaya diagonal, memberi kesan kartu logam */}
            <span
              className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rotate-12 rounded-full"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--theme-primary) 28%, transparent), transparent 70%)",
              }}
              aria-hidden="true"
            />

            <div className="relative flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="inv-inset flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: "var(--theme-accent)" }}
                >
                  <WalletIcon />
                  {account.bank}
                </span>

                <span className="text-[0.6rem] tracking-[0.22em] uppercase opacity-55">
                  Amplop Digital
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <p
                  className="font-mono text-xl tracking-[0.14em] tabular-nums sm:text-2xl"
                  style={{ color: "var(--theme-primary)" }}
                >
                  {account.number}
                </p>
                <p className="text-xs tracking-[0.08em] uppercase opacity-70">
                  a.n. {account.holder}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(index, account.number)}
                aria-live="polite"
                className={`inv-btn inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-full px-6 py-2.5 text-sm font-medium tracking-[0.04em] ${
                  isCopied ? "pointer-events-none" : ""
                }`}
              >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
                {isCopied
                  ? "Tersalin!"
                  : isFailed
                    ? "Gagal menyalin — salin manual"
                    : "Salin Nomor Rekening"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
