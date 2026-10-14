import { describe, expect, it } from "vitest";
import {
  createIdFactory,
  diagnose,
  fromTokens,
  getHint,
  scoreRun,
  simulate,
  validateLevel,
  type Token,
} from "../src";
import { sampleLevel } from "./fixtures";

const run = (tokens: Token[]) => simulate(sampleLevel, fromTokens(tokens, createIdFactory()));

describe("simulasi", () => {
  it("menyelesaikan level dengan solusi resmi dan memanen semua padi", () => {
    const r = run(sampleLevel.solution);
    expect(r.outcome).toBe("win");
    expect(r.padiHarvested).toBe(2);
    expect(r.end).toEqual({ x: 3, y: 0 });
  });

  it("berhenti di langkah pertama yang menabrak pohon", () => {
    const r = run(["M", "L", "L", "M"]);
    // dari (1,2) menghadap timur, belok kiri dua kali menghadap barat, (0,2) aman
    expect(r.outcome).toBe("not-at-goal");
    const r2 = run(["M", "L", "M", "L", "M"]);
    expect(r2.outcome).toBe("bump");
    expect(r2.obstacle).toBe("pohon");
    expect(r2.steps.at(-1)?.kind).toBe("bump");
  });

  it("mengenali tepi peta dan petak berair sebagai rintangan", () => {
    expect(run(["L", "L", "M"]).obstacle).toBe("tepi");
    const water = run(["M", "L", "M", "M", "L", "M"]);
    expect(water.outcome).toBe("bump");
    expect(water.obstacle).toBe("air");
  });

  it("tidak menghitung padi yang dilewati dua kali", () => {
    const r = run(["M", "L", "L", "M", "L", "L", "M", "M", "L", "M", "M", "R", "M"]);
    expect(r.outcome).toBe("win");
    expect(r.padiHarvested).toBe(2);
  });

  it("melaporkan padi yang tertinggal", () => {
    const r = run(["L", "M", "M", "R", "M", "M", "M"]);
    // (0,2) -> (0,1) pohon! jalur ini harus menabrak
    expect(r.outcome).toBe("bump");
    const r2 = run(["M", "M", "M", "L", "M", "M"]);
    expect(r2.outcome).toBe("padi-left");
    expect(r2.padiHarvested).toBe(1);
  });

  it("program kosong menghasilkan outcome empty", () => {
    expect(run([]).outcome).toBe("empty");
    expect(run([{ rep: 3, body: [] }]).outcome).toBe("empty");
  });

  it("menjalankan blok Ulangi sesuai jumlah putarannya", () => {
    const r = run([{ rep: 2, body: ["M"] }, "L", { rep: 2, body: ["M"] }, "R", "M"]);
    expect(r.outcome).toBe("win");
    expect(r.steps.filter((s) => s.loop).length).toBe(4);
  });
});

describe("petunjuk dan penilaian", () => {
  it("diagnosis menunjuk kartu yang menabrak", () => {
    const program = fromTokens(["M", "L", "M", "L", "M"], createIdFactory());
    const d = diagnose(sampleLevel, program);
    expect(d).toEqual({ kind: "bump", nodeId: program[4]!.id });
  });

  it("petunjuk tingkat 3 hanya memperlihatkan awal solusi", () => {
    const h = getHint(sampleLevel, [], 3);
    expect(h.tier === 3 && h.preview).toEqual(["M", "M", "L"]);
    expect(h.tier === 3 && h.truncated).toBe(true);
  });

  it("memberi tiga bintang untuk solusi hemat tanpa petunjuk", () => {
    const program = fromTokens(sampleLevel.solution, createIdFactory());
    expect(scoreRun(sampleLevel, program, { won: true, hintsUsed: 0 }).stars).toBe(3);
    expect(scoreRun(sampleLevel, program, { won: true, hintsUsed: 1 }).stars).toBe(2);
    expect(scoreRun({ ...sampleLevel, target: 4 }, program, { won: true, hintsUsed: 0 }).stars).toBe(2);
    expect(scoreRun(sampleLevel, program, { won: false, hintsUsed: 0 }).stars).toBe(0);
  });
});

describe("validasi level", () => {
  it("menerima level yang sehat", () => {
    expect(validateLevel(sampleLevel)).toEqual([]);
  });

  it("menolak solusi yang tidak menyelesaikan level", () => {
    const errs = validateLevel({ ...sampleLevel, target: 7, solution: ["M", "M"] });
    expect(errs.join(" ")).toMatch(/tidak menyelesaikan/);
  });

  it("menolak peta yang barisnya tidak sama panjang", () => {
    expect(validateLevel({ ...sampleLevel, map: ["B..", "..L."] })).toContain(
      "semua baris peta harus sama panjang",
    );
  });

  it("menolak solusi yang memakai kartu di luar palet", () => {
    const errs = validateLevel({ ...sampleLevel, target: 7, palette: ["maju"] });
    expect(errs.join(" ")).toMatch(/tidak ada di palet/);
  });
});
