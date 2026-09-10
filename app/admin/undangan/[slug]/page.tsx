import Link from "next/link";
import { notFound } from "next/navigation";

import CopyLinkButton from "@/components/admin/CopyLinkButton";
import CopyTextButton from "@/components/admin/CopyTextButton";
import DeleteInvitation from "@/components/admin/DeleteInvitation";
import GuestManager from "@/components/admin/GuestManager";
import InvitationForm from "@/components/admin/InvitationForm";
import { getThemeConfig, getTierFeatures } from "@/config/themes";
import { requireAdmin } from "@/lib/auth-session";
import { formatDateTime } from "@/lib/date";
import {
  MAX_GUESTS_PER_INVITATION,
  getGuests,
  getInvitationBySlug,
  getRsvps,
  getWishesAdmin,
} from "@/lib/invitation";
import type { RsvpRow, RsvpStatus } from "@/types/invitation";

/**
 * Panel pengelola satu undangan: rekap RSVP, ucapan, dan daftar tamu.
 *
 * Sebelum halaman ini ada, RSVP yang dikirim tamu tersimpan di database dan
 * tidak pernah terbaca siapa pun — tidak ada satu pun query SELECT ke tabel
 * `rsvps` di seluruh aplikasi. Halaman inilah yang menebus janji "RSVP tamu
 * tersimpan otomatis" di halaman paket.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Undangan — Admin",
};

/** Ambang tampilan agar kolom ucapan tidak menjadi dinding teks. */
const WISH_PREVIEW_LIMIT = 200;

function statusLabel(status: RsvpStatus): string {
  return status === "attending" ? "Hadir" : "Tidak hadir";
}

/**
 * Menyusun rekap siap tempel ke WhatsApp keluarga.
 *
 * Disusun di server karena seluruh isinya sudah ada di sini — tidak ada bagian
 * yang membutuhkan browser — sehingga tombol salinnya cukup menerima teks jadi.
 */
function buildRecap(
  couple: string,
  rows: RsvpRow[],
  summary: { attending: number; declined: number; headcount: number },
  pending: number
): string {
  const attending = rows.filter((row) => row.status === "attending");
  const declined = rows.filter((row) => row.status === "declined");

  const lines = [
    `Rekap kehadiran — ${couple}`,
    `Hadir: ${summary.attending} konfirmasi (${summary.headcount} orang)`,
    `Tidak hadir: ${summary.declined}`,
  ];

  if (pending > 0) {
    lines.push(`Belum menjawab: ${pending}`);
  }

  if (attending.length > 0) {
    lines.push("", "HADIR");
    for (const row of attending) {
      lines.push(`- ${row.guest_name} (${row.headcount ?? 1})`);
    }
  }

  if (declined.length > 0) {
    lines.push("", "TIDAK HADIR");
    for (const row of declined) {
      lines.push(`- ${row.guest_name}`);
    }
  }

  return lines.join("\n");
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export default async function ManageInvitationPage({
  params,
}: PageProps<"/admin/undangan/[slug]">) {
  // Pemeriksaan izin sungguhan, sama seperti `/admin`: proxy hanya pengalih.
  await requireAdmin();

  const { slug } = await params;
  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    notFound();
  }

  const features = getTierFeatures(invitation.tier);
  const couple = `${invitation.groom_data.nickName} & ${invitation.bride_data.nickName}`;

  // Ketiganya saling bebas, jadi dijalankan berbarengan.
  const [rsvp, wishes, guests] = await Promise.all([
    getRsvps(invitation.id),
    getWishesAdmin(invitation.id),
    getGuests(invitation.id),
  ]);

  /**
   * Status RSVP per nama, huruf kecil sebagai kunci.
   *
   * Daftarnya sudah terurut dari yang terbaru, jadi entri pertama untuk sebuah
   * nama adalah jawaban terakhirnya — tamu yang berubah pikiran dan mengisi
   * ulang form tidak akan tercatat memakai jawaban lamanya.
   */
  const rsvpByName: Record<string, RsvpStatus> = {};

  for (const row of rsvp.data) {
    const key = row.guest_name.trim().toLowerCase();
    if (!(key in rsvpByName)) rsvpByName[key] = row.status;
  }

  const pending = guests.filter(
    (guest) => !(guest.name.trim().toLowerCase() in rsvpByName)
  ).length;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <Link
          href="/admin"
          className="text-sm text-zinc-500 underline underline-offset-4 hover:opacity-70"
        >
          &larr; Kembali ke daftar undangan
        </Link>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{couple}</h1>

        <p className="mt-1 truncate text-sm text-zinc-500">
          /{invitation.slug} · {getThemeConfig(invitation.theme_id).name} ·{" "}
          {invitation.tier.toUpperCase()} ·{" "}
          {formatDateTime(invitation.created_at)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/${invitation.slug}`}
            className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Lihat undangan
          </Link>
          <CopyLinkButton slug={invitation.slug} />
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-medium">Konfirmasi Kehadiran</h2>

        {!features.rsvpToDb ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Paket {invitation.tier.toUpperCase()} tidak menyimpan RSVP.
            </p>
            <p className="mt-1.5">
              Form konfirmasi di halaman undangan sengaja dinonaktifkan, jadi
              tabel ini akan selalu kosong. Naikkan paket ke Premium atau VIP
              bila pemilik acara membutuhkan pendataan kehadiran.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Konfirmasi hadir" value={rsvp.summary.attending} />
              <StatCard label="Total orang" value={rsvp.summary.headcount} />
              <StatCard label="Tidak hadir" value={rsvp.summary.declined} />
              <StatCard label="Belum menjawab" value={pending} />
            </div>

            {rsvp.error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <p className="font-medium">Gagal memuat data RSVP.</p>
                <p className="mt-1 opacity-90">{rsvp.error}</p>
              </div>
            ) : rsvp.data.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                Belum ada tamu yang mengonfirmasi kehadiran.
              </p>
            ) : (
              <>
                <div className="mt-4 flex justify-end">
                  <CopyTextButton
                    label="Salin rekap"
                    text={buildRecap(couple, rsvp.data, rsvp.summary, pending)}
                  />
                </div>

                {/* Tabel dibungkus wadah yang bisa digeser sendiri supaya
                    halaman ini tidak ikut melebar di layar HP. */}
                <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Nama</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium">Jumlah</th>
                        <th className="px-4 py-2.5 font-medium">Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rsvp.data.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                        >
                          <td className="px-4 py-2.5">{row.guest_name}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={
                                row.status === "attending"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-zinc-500"
                              }
                            >
                              {statusLabel(row.status)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums">
                            {row.status === "attending"
                              ? (row.headcount ?? 1)
                              : "—"}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500">
                            {formatDateTime(row.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-medium">
          Daftar Tamu &amp; Link Personal
        </h2>

        <p className="mb-4 text-sm text-zinc-500">
          Setiap tamu mendapat tautan berisi namanya, sehingga undangan menyapa
          &ldquo;Kepada Yth.&rdquo; dengan benar dan form konfirmasi terisi
          otomatis.
        </p>

        <GuestManager
          slug={invitation.slug}
          coupleNames={couple}
          guests={guests}
          rsvpByName={rsvpByName}
          remaining={MAX_GUESTS_PER_INVITATION - guests.length}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">
          Ucapan &amp; Doa
          {wishes.length > 0 ? (
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {wishes.length}
            </span>
          ) : null}
        </h2>

        {wishes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Belum ada ucapan yang masuk.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{wish.sender_name}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(wish.created_at)}
                  </p>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {wish.message.length > WISH_PREVIEW_LIMIT
                    ? `${wish.message.slice(0, WISH_PREVIEW_LIMIT)}…`
                    : wish.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Form ubah disembunyikan di balik `<details>`: yang dibuka sehari-hari
          di halaman ini adalah rekap tamu, sedangkan data undangan biasanya
          hanya disentuh sekali. Ditutup pula agar tidak terlalu mudah mengubah
          undangan yang sudah tersebar. */}
      <details className="mt-10 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <summary className="cursor-pointer text-lg font-medium">
          Ubah Data Undangan
        </summary>

        <p className="mt-2 mb-5 text-sm text-zinc-500">
          Perubahan langsung terlihat oleh tamu yang membuka tautannya. Tautan
          dan seluruh link tamu tetap sama.
        </p>

        <InvitationForm initial={invitation} />
      </details>

      <section className="mt-10">
        <DeleteInvitation slug={invitation.slug} />
      </section>
    </main>
  );
}
