import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { themeFontVariables } from "@/config/fonts";
import { getSiteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  /**
   * Wajib ada sebelum apa pun yang memakai gambar Open Graph. Gambar sampul
   * undangan disimpan di Supabase Storage (URL-nya sudah absolut), tapi
   * `metadataBase` tetap dibutuhkan agar `openGraph.url` dan aset relatif lain
   * ikut diselesaikan menjadi alamat penuh.
   */
  metadataBase: new URL(getSiteUrl()),

  title: {
    // Judul halaman yang tidak mengatur judulnya sendiri.
    default: "Undangan Digital — Undangan Pernikahan Online",
    // Judul halaman yang mengaturnya, mis. "Budi & Ani" → "Budi & Ani · Undangan Digital"
    template: "%s · Undangan Digital",
  },
  description:
    "Undangan pernikahan digital yang bisa dibagikan lewat WhatsApp: hitung mundur, galeri foto, konfirmasi kehadiran, buku ucapan, dan amplop digital.",
  applicationName: "Undangan Digital",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${themeFontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
