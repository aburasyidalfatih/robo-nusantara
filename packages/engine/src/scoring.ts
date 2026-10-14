import { countCards } from "./program";
import type { Level, Program } from "./types";

export interface StarCriteria {
  /** Bintang 1: misi selesai. */
  completed: boolean;
  /** Bintang 2: jumlah kartu tidak melebihi target hemat. */
  efficient: boolean;
  /** Bintang 3: tanpa membuka petunjuk. */
  independent: boolean;
}

export interface Score {
  stars: 0 | 1 | 2 | 3;
  criteria: StarCriteria;
  cards: number;
  target: number;
}

/**
 * Hitung bintang untuk program yang SUDAH berhasil (outcome "win").
 * Bila misi belum selesai, bintangnya 0.
 */
export function scoreRun(level: Level, program: Program, opts: { won: boolean; hintsUsed: number }): Score {
  const cards = countCards(program);
  const criteria: StarCriteria = {
    completed: opts.won,
    efficient: opts.won && cards <= level.target,
    independent: opts.won && opts.hintsUsed === 0,
  };
  const stars = (Number(criteria.completed) + Number(criteria.efficient) + Number(criteria.independent)) as Score["stars"];
  return { stars, criteria, cards, target: level.target };
}
