/**
 * Seed undangan contoh untuk halaman perbandingan paket (`/paket`).
 *
 * Membuat tiga undangan dengan DATA, FOTO, DAN TEMA YANG SAMA — hanya paketnya
 * berbeda — supaya saat ditunjukkan ke customer, satu-satunya yang berubah
 * adalah tingkat kemewahan dan fitur paketnya:
 *
 *   /paket-silver    Silver   · minimal-gold
 *   /paket-premium   Premium  · minimal-gold
 *   /paket-vip       VIP      · minimal-gold
 *
 * Jumlah foto galeri sengaja dibedakan (5 / 12 / 20) karena kuota foto memang
 * bagian dari perbedaan paket.
 *
 * CARA PAKAI:  node scripts/seed-demo-paket.mjs
 *
 * Butuh `SUPABASE_SERVICE_ROLE_KEY` di `.env.local` — menulis ke `invitations`
 * hanya bisa lewat service role sejak RLS aktif (`supabase/security_rls.sql`).
 *
 * Aman dijalankan berulang: baris dengan slug yang sama dihapus lebih dulu.
 * Foto memakai picsum.photos agar contohnya berisi foto sungguhan; ganti ke URL
 * foto Anda sendiri (atau hasil unggah di /admin) bila ingin contoh yang nyata.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readEnv() {
  const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
  const env = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL tidak ada di .env.local");
  }

  // Dulu ada fallback ke NEXT_PUBLIC_SUPABASE_ANON_KEY di sini. Setelah RLS
  // aktif (supabase/security_rls.sql), anon key tidak lagi bisa INSERT/DELETE di
  // `invitations` — jadi fallback itu hanya menghasilkan error RLS yang
  // membingungkan di tengah jalan. Lebih baik berhenti sekarang, dengan nama env
  // var-nya disebut.
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tidak ada di .env.local.\n" +
        "Skrip ini menulis ke tabel `invitations`, dan sejak RLS aktif hanya service role yang boleh.\n" +
        "Ambil di Supabase → Project Settings → API → service_role (secret), lalu tambahkan:\n" +
        "  SUPABASE_SERVICE_ROLE_KEY=eyJ...   # JANGAN diberi awalan NEXT_PUBLIC_"
    );
  }

  return { url, key };
}

const { url: SUPABASE_URL, key: SUPABASE_KEY } = readEnv();

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// ============================================
// Isi undangan — sama untuk ketiga paket
// ============================================

const GROOM = {
  fullName: "Arya Dwi Nugraha",
  nickName: "Arya",
  childOf: "Putra pertama dari Bapak Suryana & Ibu Ratna Dewi",
  instagram: "arya.nugraha",
  photo_url: "https://picsum.photos/seed/paket-groom/600/600",
};

const BRIDE = {
  fullName: "Kirana Ayu Lestari",
  nickName: "Kirana",
  childOf: "Putri kedua dari Bapak Bambang Prasetyo & Ibu Sulastri",
  instagram: "kirana.ayu",
  photo_url: "https://picsum.photos/seed/paket-bride/600/600",
};

const EVENTS = [
  {
    name: "akad",
    label: "Akad Nikah",
    date: "2027-05-15",
    startTime: "08.00 WIB",
    endTime: "10.00 WIB",
    venueName: "Masjid Raya Al-Hikmah",
    address: "Jl. Diponegoro No. 24, Yogyakarta",
    mapsUrl: "https://maps.google.com/?q=Masjid+Raya+Al-Hikmah+Yogyakarta",
  },
  {
    name: "resepsi",
    label: "Resepsi",
    date: "2027-05-15",
    startTime: "11.00 WIB",
    endTime: "15.00 WIB",
    venueName: "Pendopo Kencana",
    address: "Jl. Malioboro No. 101, Yogyakarta",
    mapsUrl: "https://maps.google.com/?q=Pendopo+Kencana+Yogyakarta",
  },
];

// Jamnya sengaja menyambung dengan `EVENTS` di atas: akad 08.00 dan resepsi
// 11.00 muncul juga di sini sebagai dua baris, supaya demo memperlihatkan
// hubungan "Detail Acara" (di mana) dengan "Susunan Acara" (pukul berapa).
const RUNDOWN = [
  { time: "07.30 WIB", title: "Kedatangan Tamu", note: "Registrasi di pintu utama" },
  { time: "08.00 WIB", title: "Akad Nikah", note: "Khusus keluarga inti" },
  { time: "09.30 WIB", title: "Sesi Foto Keluarga" },
  { time: "11.00 WIB", title: "Resepsi Dimulai" },
  { time: "12.30 WIB", title: "Hiburan & Ramah Tamah" },
  { time: "15.00 WIB", title: "Penutupan" },
];

const QUOTE =
  "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu dapat ketenangan hati. (QS. Ar-Rum: 21)";

const ACCOUNTS = [
  { bank: "BCA", number: "2870159463", holder: "Arya Dwi Nugraha" },
  { bank: "Mandiri", number: "1370008812345", holder: "Kirana Ayu Lestari" },
  { bank: "GoPay", number: "081298765432", holder: "Arya Dwi Nugraha" },
];

/** Foto galeri; potret & lanskap dicampur agar grid-nya tidak monoton. */
function galleryUrls(count) {
  return Array.from({ length: count }, (_, index) => {
    const landscape = index % 3 === 0;
    const size = landscape ? "1200/900" : "900/1200";
    return `https://picsum.photos/seed/paket-galeri-${index + 1}/${size}`;
  });
}

/**
 * Ketiga paket memakai tema yang sama (`minimal-gold`) supaya perbedaan yang
 * terlihat murni berasal dari paket. Silver memang hanya bisa memakai tema ini,
 * jadi menyamakannya sekaligus membuat perbandingannya adil.
 */
const DEMOS = [
  { slug: "paket-silver", tier: "silver", photos: 5 },
  { slug: "paket-premium", tier: "premium", photos: 12 },
  { slug: "paket-vip", tier: "vip", photos: 20 },
];

function buildRow({ slug, tier, photos }) {
  return {
    slug,
    tier,
    theme_id: "minimal-gold",
    groom_data: GROOM,
    bride_data: BRIDE,
    event_data: {
      events: EVENTS,
      quote: QUOTE,
      rundown: RUNDOWN,
      cover_photo_url: "https://picsum.photos/seed/paket-cover/1400/1800",
      gallery_urls: galleryUrls(photos),
    },
    payment_data: { accounts: ACCOUNTS },
    music_url: null,
  };
}

// ============================================
// Jalankan
// ============================================

async function request(path, init) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} → ${response.status} ${await response.text()}`);
  }

  return response;
}

const slugList = DEMOS.map((demo) => demo.slug);

// Dihapus dulu agar skrip ini bisa dijalankan berulang tanpa bentrok slug unik.
await request(`invitations?slug=in.(${slugList.join(",")})`, { method: "DELETE" });
console.log(`Baris lama dibersihkan: ${slugList.join(", ")}`);

await request("invitations", {
  method: "POST",
  body: JSON.stringify(DEMOS.map(buildRow)),
});

for (const demo of DEMOS) {
  console.log(`  /${demo.slug.padEnd(15)} ${demo.tier.padEnd(8)} ${demo.photos} foto galeri`);
}

console.log("\nSelesai. Buka /paket untuk melihat perbandingannya.");
