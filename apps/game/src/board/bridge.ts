import type { Level, SimStep } from "@robo/engine";
import type { AvatarColor } from "../state/persistence";

export type Emote = "heart" | "dizzy" | "question" | "padi";

/** Kontrak papan: dipenuhi papan 2D (BoardScene) dan papan isometrik (IsoBoardScene). */
export interface BoardLike {
  readonly ready: Promise<void>;
  setup(level: Level, avatar?: AvatarColor): void;
  resetRobot(): void;
  playStep(step: SimStep, durationMs: number): Promise<void>;
  celebrate(): Promise<void>;
  showEmote(kind: Emote, holdMs?: number): void;
}

/**
 * Penghubung antara UI React/pemutar program dan scene Phaser yang sedang tampil.
 * Hanya ada satu papan aktif pada satu waktu.
 */
let active: BoardLike | null = null;

export const board = {
  attach(scene: BoardLike): void {
    active = scene;
  },
  detach(scene: BoardLike): void {
    if (active === scene) active = null;
  },
  get(): BoardLike | null {
    return active;
  },
};
