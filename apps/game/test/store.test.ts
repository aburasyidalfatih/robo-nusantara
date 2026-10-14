import { toTokens } from "@robo/engine";
import { beforeEach, describe, expect, it } from "vitest";
import { isUnlocked, LEVELS, tutorialStep, useGame } from "../src/state/store";

const game = () => useGame.getState();

describe("status permainan", () => {
  beforeEach(() => {
    useGame.setState({ progress: { stars: {}, tutorialDone: false } });
    game().openLevel(3); // Panen Berjajar: semua kartu tersedia
  });

  it("menambah kartu dengan ketukan ke akhir program", () => {
    game().addCard("maju");
    game().addCard("kiri");
    expect(toTokens(game().program)).toEqual(["M", "L"]);
  });

  it("kartu yang diketuk setelah Ulangi masuk ke dalam blok Ulangi", () => {
    game().addCard("ulangi");
    game().addCard("maju");
    game().changeLoopCount(game().program[0]!.id, 1);
    expect(toTokens(game().program)).toEqual([{ rep: 3, body: ["M"] }]);
  });

  it("Batal mengembalikan program sebelumnya", () => {
    game().addCard("maju");
    game().addCard("kanan");
    game().undo();
    expect(toTokens(game().program)).toEqual(["M"]);
  });

  it("menolak kartu yang tidak ada di palet level", () => {
    game().openLevel(0); // hanya kartu Maju
    game().addCard("kiri");
    expect(game().program).toHaveLength(0);
  });

  it("petunjuk naik bertahap dan dihitung", () => {
    game().requestHint();
    game().requestHint();
    game().requestHint();
    game().requestHint();
    expect(game().hintTier).toBe(3);
    expect(game().hintsUsed).toBe(4);
    expect(game().say.preview?.tokens).toEqual([{ rep: 6, body: ["M"] }]);
  });

  it("menyelesaikan level menyimpan bintang terbaik dan membuka level berikutnya", () => {
    game().addCard("ulangi");
    game().addCard("maju");
    for (let i = 0; i < 4; i++) game().changeLoopCount(game().program[0]!.id, 1);
    game().completeLevel();
    expect(game().result?.score.stars).toBe(3);
    expect(game().progress.stars[LEVELS[3]!.id]).toBe(3);
    expect(isUnlocked(game(), 4)).toBe(true);
  });

  it("level debugging dimulai dengan program berisi bug", () => {
    game().openLevel(4);
    expect(game().program.length).toBe(13);
    expect(game().say.kind).toBe("bug");
  });

  it("tutorial memandu dari seret kartu sampai tombol Jalankan", () => {
    game().openLevel(0);
    expect(tutorialStep(game())).toBe(1);
    game().addCard("maju");
    expect(tutorialStep(game())).toBe(2);
    game().addCard("maju");
    game().addCard("maju");
    expect(tutorialStep(game())).toBe(3);
  });
});
