-- ============================================================
-- Penyiapan Supabase Storage untuk foto undangan
-- ============================================================
-- Jalankan di Supabase → SQL Editor, lalu klik "Run".
-- Aman dijalankan berulang (idempoten).
--
-- Bila berkas ini pernah dijalankan versi sebelumnya, JALANKAN ULANG: bagian 3
-- di bawah membuang policy unggah publik yang dulu dibuat di sini.
-- Aturan akses untuk tabel database ada di berkas terpisah,
-- `supabase/security_rls.sql`.
--
-- Bucket & policy tidak bisa dibuat lewat anon key dari aplikasi, jadi langkah
-- ini memang harus dilakukan manual dari dashboard.

-- 1. Bucket publik: hanya gambar, maksimal 5 MB per berkas.
--    Batasan jenis & ukuran dipegang di level bucket, sehingga tetap berlaku
--    meski ada yang memanggil Storage API langsung.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-photos',
  'invitation-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Baca publik — undangan dibuka tamu tanpa login, jadi foto harus bisa
--    diakses siapa saja.
drop policy if exists "Baca publik foto undangan" on storage.objects;

create policy "Baca publik foto undangan" on storage.objects
  for select
  using (bucket_id = 'invitation-photos');

-- 3. Unggah: TIDAK ADA policy INSERT untuk publik — dan itu memang benar.
--
--    Dulu di sini ada policy `"Unggah publik foto undangan"` yang mengizinkan
--    siapa pun dengan anon key (yang terlihat di browser) mengunggah ke bucket
--    ini. Policy itu sekarang dibuang.
--
--    Sejak /admin punya password, unggahan berjalan lewat SIGNED UPLOAD URL:
--
--      1. Browser memanggil Server Action `createPhotoUploadTicket`
--         (lib/photo-actions.ts) — di sanalah sesi admin diverifikasi.
--      2. Server menyusun path-nya SENDIRI, lalu meminta token sekali-pakai
--         berumur pendek dengan service role (`createSignedUploadUrl`).
--      3. Browser mengunggah memakai token itu (`uploadToSignedUrl`).
--
--    Token itu sendiri yang menjadi izinnya, jadi anon TIDAK BUTUH izin INSERT
--    sama sekali. Tanpa sesi admin yang sah, tidak ada token — dan tanpa token,
--    tidak ada jalan menulis ke bucket ini.
--
--    Catatan: nasihat lama di berkas ini (perketat jadi `for insert to
--    authenticated`) JUSTRU AKAN MERUSAK unggahan. Sesi admin kita berupa cookie
--    password, bukan JWT Supabase, jadi browser tidak pernah menjadi
--    `authenticated` di mata Supabase.
drop policy if exists "Unggah publik foto undangan" on storage.objects;
drop policy if exists "Unggah foto undangan" on storage.objects;
