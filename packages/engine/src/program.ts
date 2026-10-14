/**
 * Model program: struktur kartu yang disusun anak, plus operasi
 * sisip, pindah, hapus, dan ubah jumlah ulangan.
 *
 * Semua operasi murni (tidak mengubah input) supaya mudah diuji
 * dan supaya fitur Batal cukup menyimpan program lama.
 */
import type {
  CardType,
  CommandNode,
  CommandType,
  FlatCommand,
  ListKey,
  LoopNode,
  Program,
  ProgramNode,
  Token,
} from "./types";

export const LIMITS = {
  /** Total kartu dalam satu program (blok Ulangi dihitung satu kartu). */
  maxCards: 24,
  /** Isi maksimal satu blok Ulangi. */
  maxLoopChildren: 6,
  minLoopCount: 2,
  maxLoopCount: 9,
} as const;

export type IdFactory = () => string;

/** Pembuat id berurutan. Di game cukup satu per sesi. */
export function createIdFactory(prefix = "k"): IdFactory {
  let n = 0;
  return () => `${prefix}${++n}`;
}

export function createNode(type: CommandType, nextId: IdFactory): CommandNode;
export function createNode(type: "ulangi", nextId: IdFactory): LoopNode;
export function createNode(type: CardType, nextId: IdFactory): ProgramNode;
export function createNode(type: CardType, nextId: IdFactory): ProgramNode {
  if (type === "ulangi") return { id: nextId(), type, count: LIMITS.minLoopCount, children: [] };
  return { id: nextId(), type };
}

const TOKEN_TO_TYPE = { M: "maju", L: "kiri", R: "kanan" } as const;
const TYPE_TO_TOKEN = { maju: "M", kiri: "L", kanan: "R" } as const;

export function fromTokens(tokens: Token[], nextId: IdFactory): Program {
  return tokens.map((t): ProgramNode => {
    if (typeof t === "string") return { id: nextId(), type: TOKEN_TO_TYPE[t] };
    const children = t.body.map((b): CommandNode => {
      if (typeof b !== "string") throw new Error("Blok Ulangi tidak boleh bersarang");
      return { id: nextId(), type: TOKEN_TO_TYPE[b] };
    });
    return { id: nextId(), type: "ulangi", count: t.rep, children };
  });
}

export function toTokens(program: Program): Token[] {
  return program.map((n): Token =>
    n.type === "ulangi"
      ? { rep: n.count, body: n.children.map((c) => TYPE_TO_TOKEN[c.type]) }
      : TYPE_TO_TOKEN[n.type],
  );
}

/** Jumlah kartu yang dipakai anak (blok Ulangi dihitung satu). */
export function countCards(program: Program): number {
  return program.reduce((sum, n) => sum + 1 + (n.type === "ulangi" ? n.children.length : 0), 0);
}

/** Nomor kartu sesuai urutan tampil, dimulai dari 1. */
export function numberCards(program: Program): Map<string, number> {
  const out = new Map<string, number>();
  let k = 0;
  for (const n of program) {
    out.set(n.id, ++k);
    if (n.type === "ulangi") for (const c of n.children) out.set(c.id, ++k);
  }
  return out;
}

/** Buka semua blok Ulangi menjadi urutan perintah tunggal. */
export function flatten(program: Program): FlatCommand[] {
  const out: FlatCommand[] = [];
  for (const n of program) {
    if (n.type !== "ulangi") {
      out.push({ type: n.type, nodeId: n.id });
      continue;
    }
    for (let i = 1; i <= n.count; i++) {
      for (const c of n.children) {
        out.push({ type: c.type, nodeId: c.id, loop: { id: n.id, iteration: i, count: n.count } });
      }
    }
  }
  return out;
}

export interface FoundNode {
  node: ProgramNode;
  listKey: ListKey;
  index: number;
  parent?: LoopNode;
}

export function findNode(program: Program, id: string): FoundNode | null {
  for (let i = 0; i < program.length; i++) {
    const n = program[i] as ProgramNode;
    if (n.id === id) return { node: n, listKey: "main", index: i };
    if (n.type === "ulangi") {
      const j = n.children.findIndex((c) => c.id === id);
      if (j >= 0) {
        return { node: n.children[j] as CommandNode, listKey: `loop:${n.id}`, index: j, parent: n };
      }
    }
  }
  return null;
}

export const loopIdOf = (key: ListKey): string | null =>
  key === "main" ? null : key.slice("loop:".length);

export type EditError = "loop-in-loop" | "loop-full" | "too-many-cards" | "not-found";
export type EditResult = { ok: true; program: Program } | { ok: false; error: EditError };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Sisipkan kartu baru atau kartu yang dipindah ke posisi tertentu. */
export function insertNode(
  program: Program,
  listKey: ListKey,
  index: number,
  node: ProgramNode,
): EditResult {
  const added = 1 + (node.type === "ulangi" ? node.children.length : 0);
  if (countCards(program) + added > LIMITS.maxCards) return { ok: false, error: "too-many-cards" };
  return placeNode(program, listKey, index, node);
}

function placeNode(program: Program, listKey: ListKey, index: number, node: ProgramNode): EditResult {
  const loopId = loopIdOf(listKey);
  if (loopId === null) {
    const next = program.slice();
    next.splice(clamp(index, 0, next.length), 0, node);
    return { ok: true, program: next };
  }
  if (node.type === "ulangi") return { ok: false, error: "loop-in-loop" };
  let error: EditError | null = "not-found";
  const next = program.map((n) => {
    if (n.id !== loopId || n.type !== "ulangi") return n;
    if (n.children.length >= LIMITS.maxLoopChildren) {
      error = "loop-full";
      return n;
    }
    error = null;
    const children = n.children.slice();
    children.splice(clamp(index, 0, children.length), 0, node);
    return { ...n, children };
  });
  return error ? { ok: false, error } : { ok: true, program: next };
}

export function removeNode(program: Program, id: string): EditResult {
  const found = findNode(program, id);
  if (!found) return { ok: false, error: "not-found" };
  if (!found.parent) return { ok: true, program: program.filter((n) => n.id !== id) };
  const loopId = found.parent.id;
  return {
    ok: true,
    program: program.map((n) =>
      n.id === loopId && n.type === "ulangi"
        ? { ...n, children: n.children.filter((c) => c.id !== id) }
        : n,
    ),
  };
}

/**
 * Pindahkan kartu. `index` dihitung pada daftar tujuan SETELAH kartu
 * diangkat dari tempat asalnya (seperti yang dilihat anak saat menyeret).
 */
export function moveNode(program: Program, id: string, listKey: ListKey, index: number): EditResult {
  const found = findNode(program, id);
  if (!found) return { ok: false, error: "not-found" };
  if (found.node.type === "ulangi" && listKey !== "main") return { ok: false, error: "loop-in-loop" };
  const removed = removeNode(program, id);
  if (!removed.ok) return removed;
  return placeNode(removed.program, listKey, index, found.node);
}

export function setLoopCount(program: Program, id: string, count: number): EditResult {
  const found = findNode(program, id);
  if (!found || found.node.type !== "ulangi") return { ok: false, error: "not-found" };
  const c = clamp(Math.round(count), LIMITS.minLoopCount, LIMITS.maxLoopCount);
  return { ok: true, program: program.map((n) => (n.id === id ? { ...n, count: c } as LoopNode : n)) };
}

export function listOf(program: Program, listKey: ListKey): ProgramNode[] | null {
  const loopId = loopIdOf(listKey);
  if (loopId === null) return program;
  const loop = program.find((n) => n.id === loopId);
  return loop && loop.type === "ulangi" ? loop.children : null;
}
