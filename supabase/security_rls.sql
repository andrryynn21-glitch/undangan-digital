-- ============================================================
-- Row Level Security untuk semua tabel undangan
-- ============================================================
-- Jalankan di Supabase → SQL Editor, lalu klik "Run".
-- Aman dijalankan berulang (idempoten).
--
-- PRASYARAT: `SUPABASE_SERVICE_ROLE_KEY` sudah ada di `.env.local`. Setelah
-- skrip ini jalan, satu-satunya jalan menulis ke `invitations` adalah service
-- role — tanpa kunci itu, tombol "Buat Undangan" di /admin akan gagal.
--
-- ------------------------------------------------------------
-- PRINSIP YANG DIPAKAI
-- ------------------------------------------------------------
-- 1. `service_role` MELEWATI RLS sepenuhnya, jadi ia tidak butuh policy.
--    Karena itu "hanya service_role yang boleh INSERT/UPDATE/DELETE" diwujudkan
--    dengan TIDAK membuat policy sama sekali untuk operasi tersebut. Menulis
--    `create policy ... to service_role` hanya menyesatkan pembaca berikutnya,
--    seolah policy itulah yang memberi izin.
--
-- 2. Policy bersifat OR: satu policy permisif yang tertinggal sudah cukup untuk
--    membuat pintu tetap terbuka, dan `enable row level security` tidak
--    menyentuh policy yang sudah ada. Karena itu bagian 0 membuang semua policy
--    lama lebih dulu. Yang dihapus hanya ATURAN AKSES — tidak ada satu baris
--    data pun tersentuh.
--
-- 3. Batas panjang di dalam `with check` mengikuti angka yang sudah dijanjikan
--    aplikasi: `MAX_HEADCOUNT = 20` di lib/actions.ts, serta `maxLength` 80
--    (nama) dan 500 (ucapan) di components/invitation/RsvpForm.tsx. Server
--    Action bisa dilewati dengan POST langsung ke PostgREST, jadi database ikut
--    menegakkannya.

-- ============================================================
-- 0. Buang semua policy lama di keempat tabel
-- ============================================================
-- Nama policy yang ada sekarang tidak diketahui (dibuat lewat dashboard), jadi
-- dibaca dari katalog. Nama yang dibuang dicetak sebagai NOTICE — perhatikan
-- panel Results/Messages setelah Run.
do $$
declare
  pol record;
  jumlah int := 0;
begin
  for pol in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('invitations', 'wishes', 'rsvps', 'guests')
  loop
    raise notice 'Membuang policy lama: %.% -> %', 'public', pol.tablename, pol.policyname;
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
    jumlah := jumlah + 1;
  end loop;

  raise notice 'Total policy lama yang dibuang: %', jumlah;
end $$;

alter table public.invitations enable row level security;
alter table public.wishes      enable row level security;
alter table public.rsvps       enable row level security;
alter table public.guests      enable row level security;

-- ============================================================
-- 1. invitations — publik boleh BACA, menulis hanya service_role
-- ============================================================
-- Soal "SELECT berdasarkan slug": RLS memfilter BARIS, bukan query. Tamu tidak
-- login dan setiap undangan harus terbaca oleh tamunya masing-masing, jadi
-- `using (true)` adalah satu-satunya ekspresi yang bisa bekerja di sini.
-- Penyaringan "berdasarkan slug" dilakukan aplikasi lewat `.eq("slug", slug)`.
--
-- Konsekuensi yang diterima: pemegang anon key bisa mendaftar semua undangan.
-- Ini sifat bawaan undangan yang dibuka lewat tautan tanpa login, dan tidak
-- menambah kebocoran — isinya sama dengan yang memang ditampilkan ke tamu.
create policy "invitations_select_publik" on public.invitations
  for select
  to anon, authenticated
  using (true);

-- INSERT / UPDATE / DELETE: sengaja tanpa policy → hanya service_role.

-- ============================================================
-- 2. wishes — tamu boleh membaca & mengirim ucapan
-- ============================================================
-- SELECT dibutuhkan sungguhan: buku ucapan (`getWishes` di lib/invitation.ts)
-- membaca tabel ini dengan anon key.
create policy "wishes_select_publik" on public.wishes
  for select
  to anon, authenticated
  using (true);

create policy "wishes_insert_publik" on public.wishes
  for insert
  to anon, authenticated
  with check (
    char_length(sender_name) between 2 and 80
    and char_length(message) between 1 and 500
  );

-- UPDATE / DELETE: sengaja tanpa policy → hanya service_role.

-- ============================================================
-- 3. rsvps — tamu boleh MENGIRIM, tapi tidak boleh MEMBACA
-- ============================================================
-- SELECT sengaja TIDAK dibuka. Tidak ada satu pun tempat di aplikasi yang
-- membaca tabel ini dengan anon key (buku ucapan membaca `wishes`), sementara
-- membukanya berarti siapa pun pemegang anon key bisa mengunduh daftar tamu
-- beserta status kehadiran SELURUH pernikahan.
--
-- `submitRsvp` memakai `.insert()` tanpa `.select()`, sehingga supabase-js
-- mengirim `Prefer: return=minimal` dan tidak butuh izin baca. Kalau suatu saat
-- ada `.select()` dirantaikan setelah insert di tabel ini, ia akan gagal —
-- itu disengaja, supaya keputusan membuka akses baca diambil secara sadar.
create policy "rsvps_insert_publik" on public.rsvps
  for insert
  to anon, authenticated
  with check (
    char_length(guest_name) between 2 and 80
    and headcount between 1 and 20
  );

-- SELECT / UPDATE / DELETE: sengaja tanpa policy → hanya service_role.

-- ============================================================
-- 4. guests — tertutup rapat
-- ============================================================
-- Tabel ini tidak disentuh kode mana pun; hanya disebut di komentar skema
-- lib/invitation.ts dan tipe di types/invitation.ts. Karena tidak ada yang
-- membutuhkannya dari sisi publik, ia tidak diberi policy sama sekali.

-- ============================================================
-- 5. Lapis kedua: cabut GRANT yang tidak diperlukan
-- ============================================================
-- RLS di atas sudah menutup semuanya. Bagian ini pengaman kalau suatu hari ada
-- policy permisif tertambah tanpa sengaja: izin di level tabel pun sudah tidak
-- ada, sehingga PostgREST menolak lebih awal dengan "permission denied".
revoke insert, update, delete on public.invitations from anon, authenticated;
revoke update, delete         on public.wishes      from anon, authenticated;
revoke select, update, delete on public.rsvps       from anon, authenticated;
revoke all                    on public.guests      from anon, authenticated;

-- ============================================================
-- 6. Periksa hasilnya
-- ============================================================
-- Jalankan dua query di bawah (boleh disorot lalu Run terpisah) untuk melihat
-- keadaan akhir. Yang diharapkan:
--
--   invitations : rowsecurity = true, 1 policy  (select)
--   wishes      : rowsecurity = true, 2 policy  (select, insert)
--   rsvps       : rowsecurity = true, 1 policy  (insert)
--   guests      : rowsecurity = true, 0 policy
select
  c.relname as tabel,
  c.relrowsecurity as rls_aktif,
  count(p.policyname) as jumlah_policy
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in ('invitations', 'wishes', 'rsvps', 'guests')
group by c.relname, c.relrowsecurity
order by c.relname;

select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('invitations', 'wishes', 'rsvps', 'guests')
order by tablename, cmd;
