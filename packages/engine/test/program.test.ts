import { describe, expect, it } from "vitest";
import {
  countCards,
  createIdFactory,
  createNode,
  flatten,
  fromTokens,
  insertNode,
  LIMITS,
  moveNode,
  numberCards,
  removeNode,
  setLoopCount,
  toTokens,
  type Program,
  type Token,
} from "../src";

const ids = () => createIdFactory("t");

describe("token dan hitungan kartu", () => {
  it("bolak-balik token ke program tanpa kehilangan isi", () => {
    const tokens: Token[] = ["M", { rep: 3, body: ["M", "L"] }, "R"];
    const program = fromTokens(tokens, ids());
    expect(toTokens(program)).toEqual(tokens);
  });

  it("blok Ulangi dihitung satu kartu ditambah isinya", () => {
    const program = fromTokens(["M", { rep: 5, body: ["M", "R"] }], ids());
    expect(countCards(program)).toBe(4);
  });

  it("menomori kartu sesuai urutan tampil", () => {
    const program = fromTokens(["M", { rep: 2, body: ["L", "R"] }, "M"], ids());
    const nums = numberCards(program);
    expect([...nums.values()]).toEqual([1, 2, 3, 4, 5]);
  });

  it("membuka blok Ulangi menjadi perintah berurutan dengan info putaran", () => {
    const program = fromTokens([{ rep: 3, body: ["M"] }, "L"], ids());
    const flat = flatten(program);
    expect(flat.map((f) => f.type)).toEqual(["maju", "maju", "maju", "kiri"]);
    expect(flat[2]?.loop).toMatchObject({ iteration: 3, count: 3 });
    expect(flat[3]?.loop).toBeUndefined();
  });

  it("menolak blok Ulangi bersarang di token", () => {
    expect(() => fromTokens([{ rep: 2, body: [{ rep: 2, body: ["M"] }] }], ids())).toThrow();
  });
});

describe("menyunting program", () => {
  const next = ids();
  const base = (): Program => fromTokens(["M", "L", { rep: 2, body: ["M"] }], next);

  it("menyisipkan kartu di tengah program", () => {
    const p = base();
    const r = insertNode(p, "main", 1, createNode("kanan", next));
    expect(r.ok && toTokens(r.program)).toEqual(["M", "R", "L", { rep: 2, body: ["M"] }]);
    expect(toTokens(p)).toEqual(["M", "L", { rep: 2, body: ["M"] }]);
  });

  it("menyisipkan kartu ke dalam blok Ulangi", () => {
    const p = base();
    const loopId = p[2]!.id;
    const r = insertNode(p, `loop:${loopId}`, 0, createNode("kiri", next));
    expect(r.ok && toTokens(r.program)[2]).toEqual({ rep: 2, body: ["L", "M"] });
  });

  it("menolak blok Ulangi di dalam blok Ulangi", () => {
    const p = base();
    const r = insertNode(p, `loop:${p[2]!.id}`, 0, createNode("ulangi", next));
    expect(r).toEqual({ ok: false, error: "loop-in-loop" });
  });

  it("menolak isi blok Ulangi yang melebihi batas", () => {
    const p = fromTokens([{ rep: 2, body: ["M", "M", "M", "M", "M", "M"] }], next);
    const r = insertNode(p, `loop:${p[0]!.id}`, 0, createNode("maju", next));
    expect(r).toEqual({ ok: false, error: "loop-full" });
  });

  it("menolak program yang terlalu panjang", () => {
    const p = fromTokens(Array.from({ length: LIMITS.maxCards }, () => "M" as const), next);
    expect(insertNode(p, "main", 0, createNode("maju", next))).toEqual({
      ok: false,
      error: "too-many-cards",
    });
  });

  it("memindahkan kartu dari program utama ke dalam blok Ulangi", () => {
    const p = base();
    const r = moveNode(p, p[1]!.id, `loop:${p[2]!.id}`, 1);
    expect(r.ok && toTokens(r.program)).toEqual(["M", { rep: 2, body: ["M", "L"] }]);
  });

  it("memindahkan kartu ke posisi lain di daftar yang sama", () => {
    const p = fromTokens(["M", "L", "R"], next);
    const r = moveNode(p, p[0]!.id, "main", 2);
    expect(r.ok && toTokens(r.program)).toEqual(["L", "R", "M"]);
  });

  it("menghapus kartu di dalam blok Ulangi", () => {
    const p = fromTokens([{ rep: 2, body: ["M", "L"] }], next);
    const loop = p[0]!;
    const child = loop.type === "ulangi" ? loop.children[1]! : loop;
    const r = removeNode(p, child.id);
    expect(r.ok && toTokens(r.program)).toEqual([{ rep: 2, body: ["M"] }]);
  });

  it("membatasi jumlah ulangan pada 2–9", () => {
    const p = base();
    const id = p[2]!.id;
    const hi = setLoopCount(p, id, 40);
    const lo = setLoopCount(p, id, 0);
    expect(hi.ok && toTokens(hi.program)[2]).toEqual({ rep: 9, body: ["M"] });
    expect(lo.ok && toTokens(lo.program)[2]).toEqual({ rep: 2, body: ["M"] });
  });
});
