/**
 * Jenis acara yang didukung form admin.
 * Dipakai bersama oleh form (untuk pilihan select) dan Server Action
 * (untuk memetakan kembali nama acara ke labelnya).
 */

import type { EventName } from "@/types/invitation";

export interface EventOption {
  name: EventName;
  label: string;
}

export const EVENT_OPTIONS: EventOption[] = [
  { name: "akad", label: "Akad Nikah" },
  { name: "resepsi", label: "Resepsi" },
  { name: "ngunduh_mantu", label: "Ngunduh Mantu" },
];

/** Label tampilan untuk sebuah jenis acara, atau `undefined` bila tak dikenal. */
export function getEventLabel(name: string): string | undefined {
  return EVENT_OPTIONS.find((option) => option.name === name)?.label;
}
