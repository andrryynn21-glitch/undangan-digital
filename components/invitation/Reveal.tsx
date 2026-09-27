"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /**
   * Kelas tambahan untuk elemen pembungkusnya. Komponen ini merender `<div>`
   * sendiri, jadi pembungkus yang sudah ada (mis. kontainer `max-w-xl` di
   * `Section`) digantikan olehnya — bukan ditambah satu lapis lagi.
   */
  className?: string;
  /** Jeda animasi dalam milidetik, untuk membuat urutan yang bertingkat. */
  delay?: number;
}

/**
 * Pembungkus yang memunculkan isinya saat mencapai layar.
 *
 * CARA KERJANYA, DAN KENAPA BEGITU
 *
 * Isi undangan sudah dirender di server sejak awal (supaya terbaca perayap
 * tautan dan tetap muncul walau JavaScript gagal dimuat). Karena itu kelas
 * penyembunyian TIDAK BOLEH dipasang saat render pertama — kalau dipasang,
 * undangan menjadi kosong bagi siapa pun yang skripnya tidak jalan.
 *
 * Jadi urutannya dibalik: elemen tampil apa adanya lebih dulu, lalu setelah
 * ter-mount posisinya diamati.
 *
 *  - Sudah terlihat di layar (yakni yang berada di balik sampul) → dibiarkan.
 *    Yang ini memang sedang dianimasikan masuk oleh sampul, dan menganimasikan
 *    ulang isinya hanya membuat gambar bergerak dua kali.
 *  - Berada jauh di bawah layar → baru disembunyikan, lalu dimunculkan dengan
 *    animasi ketika tamu menggulir sampai ke sana.
 *
 * `rootMargin` bawah yang diberi kelonggaran 200 px disengaja: elemen yang baru
 * sedikit melewati tepi layar sudah dihitung "terlihat", sehingga tamu yang
 * menggulir cepat tidak sempat menangkapnya dalam keadaan setengah transparan.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: RevealProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  /** Elemen ini berada di luar layar saat pengamatan pertama. */
  const [armed, setArmed] = useState(false);
  /** Elemen sudah mencapai layar dan boleh tampil. */
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;

    // Tanpa IntersectionObserver (browser lama / lingkungan uji), isi undangan
    // lebih penting daripada animasinya: biarkan semuanya tampil.
    if (!node || typeof IntersectionObserver === "undefined") return;

    let firstCallback = true;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
            return;
          }

          if (firstCallback) setArmed(true);
        }

        firstCallback = false;
      },
      { rootMargin: "0px 0px 200px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const revealClass = armed
    ? `inv-scroll-reveal${shown ? " inv-scroll-reveal--shown" : ""}`
    : "";

  return (
    <div
      ref={nodeRef}
      className={`${revealClass} ${className}`.trim()}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
