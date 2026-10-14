import type { Level } from "@robo/engine";

/**
 * Lencana konsep: satu per modul kurikulum.
 * Diberikan saat level terakhir modul itu selesai.
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  /** Warna lencana, memakai token warna kartu agar konsisten. */
  color: string;
  /** Id level yang memberi lencana ini. */
  levelId: string;
}

export const BADGES: Badge[] = [
  { id: "urutan", name: "Lencana Urutan", description: "Menyusun perintah langkah demi langkah", color: "var(--c-maju)", levelId: "j1-01" },
  { id: "belok", name: "Lencana Belok", description: "Mengerti kiri dan kanan dari sudut pandang robot", color: "var(--c-kanan)", levelId: "j1-03" },
  { id: "ulangi", name: "Lencana Ulangi", description: "Mengenali pola dan memakai perulangan", color: "var(--c-ulangi)", levelId: "j1-04" },
  { id: "galat", name: "Lencana Pemburu Galat", description: "Menemukan dan memperbaiki bug", color: "var(--danger)", levelId: "j1-05" },
  { id: "panen", name: "Lencana Festival Panen", description: "Menyelesaikan proyek akhir Jenjang 1", color: "var(--lamp)", levelId: "j1-06" },
];

export function badgeForLevel(level: Pick<Level, "id">): string | null {
  return BADGES.find((b) => b.levelId === level.id)?.id ?? null;
}

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}
