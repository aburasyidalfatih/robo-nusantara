import type { BoardScene } from "./BoardScene";

/**
 * Penghubung antara UI React/pemutar program dan scene Phaser yang sedang tampil.
 * Hanya ada satu papan aktif pada satu waktu.
 */
let active: BoardScene | null = null;

export const board = {
  attach(scene: BoardScene): void {
    active = scene;
  },
  detach(scene: BoardScene): void {
    if (active === scene) active = null;
  },
  get(): BoardScene | null {
    return active;
  },
};
