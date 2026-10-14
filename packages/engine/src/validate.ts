import { findTiles } from "./grid";
import { countCards, createIdFactory, fromTokens, LIMITS } from "./program";
import { simulate } from "./simulate";
import type { CardType, Level, Token } from "./types";

const TILES = new Set([".", "#", "~", "p", "L", "B"]);
const CARDS: CardType[] = ["maju", "kiri", "kanan", "ulangi"];

function cardsUsed(tokens: Token[], acc = new Set<CardType>()): Set<CardType> {
  for (const t of tokens) {
    if (t === "M") acc.add("maju");
    else if (t === "L") acc.add("kiri");
    else if (t === "R") acc.add("kanan");
    else {
      acc.add("ulangi");
      if (t.rep < LIMITS.minLoopCount || t.rep > LIMITS.maxLoopCount) acc.add("__bad-rep" as CardType);
      cardsUsed(t.body, acc);
    }
  }
  return acc;
}

/**
 * Periksa level sebelum dipakai: bentuk peta, isi palet,
 * dan yang terpenting, solusi resminya benar-benar menyelesaikan level.
 * Mengembalikan daftar masalah; kosong berarti level sehat.
 */
export function validateLevel(level: Level): string[] {
  const errors: string[] = [];
  const cols = level.map[0]?.length ?? 0;

  if (level.map.length < 2 || cols < 2) errors.push("peta minimal 2×2 petak");
  if (level.map.some((r) => r.length !== cols)) errors.push("semua baris peta harus sama panjang");
  for (const row of level.map) {
    for (const c of row) if (!TILES.has(c)) errors.push(`kode petak tidak dikenal: "${c}"`);
  }
  if (findTiles(level, "B").length !== 1) errors.push("harus ada tepat satu petak awal B");
  if (findTiles(level, "L").length < 1) errors.push("harus ada minimal satu rangkiang L");
  if (!["N", "E", "S", "W"].includes(level.startDir)) errors.push("startDir harus N, E, S, atau W");
  if (level.palette.length === 0) errors.push("palet kartu kosong");
  for (const c of level.palette) if (!CARDS.includes(c)) errors.push(`kartu tidak dikenal: ${c}`);
  if (level.target < 1) errors.push("target hemat minimal 1");
  if (errors.length) return errors;

  const used = cardsUsed(level.solution);
  if (used.has("__bad-rep" as CardType)) errors.push("jumlah ulangan di solusi di luar batas 2–9");
  for (const c of used) {
    if (c !== ("__bad-rep" as CardType) && !level.palette.includes(c)) {
      errors.push(`solusi memakai kartu "${c}" yang tidak ada di palet`);
    }
  }

  let program;
  try {
    program = fromTokens(level.solution, createIdFactory());
  } catch (e) {
    return [...errors, `solusi tidak valid: ${(e as Error).message}`];
  }
  const sim = simulate(level, program);
  if (sim.outcome !== "win") errors.push(`solusi resmi tidak menyelesaikan level (hasil: ${sim.outcome})`);
  const n = countCards(program);
  if (n > level.target) errors.push(`solusi resmi (${n} kartu) lebih boros dari target ${level.target}`);
  if (n > LIMITS.maxCards) errors.push(`solusi melebihi batas ${LIMITS.maxCards} kartu`);

  if (level.prefill) {
    const pre = simulate(level, fromTokens(level.prefill, createIdFactory()));
    if (level.feature === "kumbang-galat" && pre.outcome === "win") {
      errors.push("program awal level debugging seharusnya mengandung bug");
    }
  }
  return errors;
}
