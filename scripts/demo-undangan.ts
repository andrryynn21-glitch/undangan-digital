/**
 * Membuat satu undangan baru untuk memeriksa hasil perubahan visual.
 *
 * Dijalankan dengan service-role key, jadi menulis ke database yang sama
 * dengan production (keduanya project Supabase yang sama).
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SLUG = "demo-batik-emas";
const BACKGROUND_URL =
  "https://vxjrxoeapsdbktphcmpl.supabase.co/storage/v1/object/public/invitation-photos/rehan-zajila/background-916cda36-c25d-4e35-bc66-eb44462813b6.jpg";

/**
 * Palet dibaca dari `rehan-zajila-1`, yang memakai gambar acuan yang PERSIS
 * SAMA dengan `BACKGROUND_URL` di atas. Jadi nilainya bukan tebakan: itu
 * hasil pembacaan piksel yang sama oleh `lib/palette-extract.ts`.
 *
 * Menjalankan `derivePalette()` langsung dari skrip tidak praktis karena
 * berkas itu memakai alias `@/` yang hanya dipahami bundler Next, bukan
 * Node mentah. Mengambil palet yang sudah tersimpan untuk gambar yang sama
 * memberi hasil yang identik tanpa menggandakan algoritmanya di sini.
 */
const PALETTE = {
  primary: "#492518",
  accent: "#492518",
  luminance: 0.072,
};

async function main() {
  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    console.log(`Slug "${SLUG}" sudah ada (id ${existing.id}).`);
    console.log("Hapus dulu bila ingin dibuat ulang.");
    return;
  }

  const row = {
    id: randomUUID(),
    slug: SLUG,
    tier: "vip",
    theme_id: "minimal-gold",
    // "modern" berarti override adat tidak menimpa, jadi kanvas gelap dari
    // gambar acuan yang terlihat — persis kasus yang sebelumnya salah.
    theme_config: {
      tradition: "modern",
      region: "Yogyakarta",
      backgroundUrl: BACKGROUND_URL,
      palette: PALETTE,
    },
    groom_data: {
      fullName: "Bagus Pratama, S.T.",
      nickName: "Bagus",
      childOf: "Putra pertama dari Bapak Sutrisno & Ibu Wardah",
      instagram: "bagus.pratama",
      photo_url:
        "https://picsum.photos/seed/demo-groom/600/600",
    },
    bride_data: {
      fullName: "Sekar Ayu Lestari, S.Pd.",
      nickName: "Sekar",
      childOf: "Putri kedua dari Bapak Bambang & Ibu Sulastri",
      instagram: "sekar.ayu",
      photo_url:
        "https://picsum.photos/seed/demo-bride/600/600",
    },
    event_data: {
      quote:
        "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu dapat ketenangan hati. (QS. Ar-Rum: 21)",
      events: [
        {
          name: "akad",
          label: "Akad Nikah",
          date: "2027-02-14",
          startTime: "08.00 WIB",
          endTime: "10.00 WIB",
          venueName: "Masjid Agung Al-Falah",
          address: "Jl. Merdeka No. 10, Yogyakarta",
          mapsUrl: "https://maps.google.com/?q=Masjid+Agung+Al-Falah",
        },
        {
          name: "resepsi",
          label: "Resepsi",
          date: "2027-02-14",
          startTime: "11.00 WIB",
          endTime: "14.00 WIB",
          venueName: "Gedung Serbaguna Melati",
          address: "Jl. Asia Afrika No. 88, Yogyakarta",
          mapsUrl: "https://maps.google.com/?q=Gedung+Serbaguna+Melati",
        },
      ],
      gallery_urls: [
        "https://picsum.photos/seed/demo-gal-1/1200/900",
        "https://picsum.photos/seed/demo-gal-2/900/1200",
        "https://picsum.photos/seed/demo-gal-3/900/1200",
        "https://picsum.photos/seed/demo-gal-4/1200/900",
      ],
      cover_photo_url: "https://picsum.photos/seed/demo-cover/1200/1600",
    },
    payment_data: { accounts: [] },
  };

  const { error } = await supabase.from("invitations").insert(row);

  if (error) {
    console.error("Gagal membuat:", error.message);
    process.exit(1);
  }

  console.log(`\nBerhasil membuat undangan "${SLUG}".`);
}

main();
