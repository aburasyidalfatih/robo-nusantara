import { simulate } from "./simulate";
import type { Level, Program, Token } from "./types";

/**
 * Petunjuk bertingkat:
 *  1. pertanyaan penuntun dari file level
 *  2. diagnosis program anak (kartu mana yang bermasalah)
 *  3. contoh awal solusi, tidak pernah solusi penuh
 *
 * Engine hanya mengembalikan data; teks untuk anak disusun di aplikasi.
 */
export type Hint =
  | { tier: 1; text: string }
  | { tier: 2; diagnosis: Diagnosis }
  | { tier: 3; preview: Token[]; truncated: boolean };

export type Diagnosis =
  | { kind: "empty" }
  | { kind: "already-correct" }
  | { kind: "bump"; nodeId: string }
  | { kind: "padi-left"; harvested: number; total: number }
  | { kind: "not-at-goal" };

export function diagnose(level: Level, program: Program): Diagnosis {
  const sim = simulate(level, program);
  switch (sim.outcome) {
    case "empty":
      return { kind: "empty" };
    case "win":
      return { kind: "already-correct" };
    case "bump":
      return { kind: "bump", nodeId: sim.bumpNodeId as string };
    case "padi-left":
      return { kind: "padi-left", harvested: sim.padiHarvested, total: sim.padiTotal };
    case "not-at-goal":
      return { kind: "not-at-goal" };
  }
}

/** Ambil awal solusi sampai sekitar `budget` kartu (blok Ulangi utuh). */
export function solutionPreview(level: Level, budget = 3): { preview: Token[]; truncated: boolean } {
  const preview: Token[] = [];
  let used = 0;
  for (const t of level.solution) {
    if (used >= budget) return { preview, truncated: true };
    preview.push(t);
    used += typeof t === "string" ? 1 : 1 + t.body.length;
  }
  return { preview, truncated: false };
}

export function getHint(level: Level, program: Program, tier: 1 | 2 | 3): Hint {
  if (tier === 1) return { tier, text: level.hint };
  if (tier === 2) return { tier, diagnosis: diagnose(level, program) };
  return { tier, ...solutionPreview(level) };
}
