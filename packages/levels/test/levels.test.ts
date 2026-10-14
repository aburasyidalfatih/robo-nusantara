import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createIdFactory, fromTokens, simulate, validateLevel } from "@robo/engine";
import { jenjang1, regions } from "../src";

const LEVEL_DIR = fileURLToPath(new URL("../src/jenjang-1", import.meta.url));

describe("level Jenjang 1", () => {
  it("memuat enam level berurutan", () => {
    expect(jenjang1.levels.map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("semua id level unik", () => {
    const ids = regions.flatMap((r) => r.levels.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("semua file JSON di folder terdaftar di index", () => {
    const dir = LEVEL_DIR;
    expect(readdirSync(dir).filter((f) => f.endsWith(".json")).length).toBe(jenjang1.levels.length);
  });

  it("semua file merujuk skema yang benar", () => {
    const dir = LEVEL_DIR;
    for (const f of readdirSync(dir)) {
      const json = JSON.parse(readFileSync(join(dir, f), "utf8"));
      expect(json.$schema, f).toBe("../../schema/level.schema.json");
    }
  });

  for (const level of jenjang1.levels) {
    describe(`${level.id} · ${level.name}`, () => {
      it("lolos validasi dan solusinya menang", () => {
        expect(validateLevel(level)).toEqual([]);
      });

      it("target hemat sama dengan solusi resmi", () => {
        const program = fromTokens(level.solution, createIdFactory());
        const cards = program.reduce((s, n) => s + 1 + (n.type === "ulangi" ? n.children.length : 0), 0);
        expect(cards).toBe(level.target);
      });

      if (level.prefill) {
        it("program awal berisi bug yang membuat Bima menabrak", () => {
          const sim = simulate(level, fromTokens(level.prefill!, createIdFactory()));
          expect(sim.outcome).toBe("bump");
        });
      }
    });
  }
});
