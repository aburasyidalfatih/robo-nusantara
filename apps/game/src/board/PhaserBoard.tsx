import Phaser from "phaser";
import { useEffect, useRef } from "react";
import { currentLevel, useGame } from "../state/store";
import { BoardScene, boardPixelSize } from "./BoardScene";
import { board } from "./bridge";
import { IsoBoardScene, isoPixelSize } from "./IsoBoardScene";

/**
 * Wadah React untuk papan Phaser. Papan menyesuaikan ukuran wadahnya (Scale.FIT).
 * `iso` memilih papan isometrik (2.5D) atau papan datar yang lebih ringan.
 */
export function PhaserBoard({ iso }: { iso: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    const level = currentLevel(useGame.getState());
    const { width, height } = iso ? isoPixelSize(level) : boardPixelSize(level);
    const scene = iso ? new IsoBoardScene() : new BoardScene();

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width,
      height,
      transparent: true,
      banner: false,
      disableContextMenu: true,
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true },
      scene: [scene],
    });

    board.attach(scene);
    scene.setup(level, useGame.getState().profile?.avatar ?? "biru");

    const unsubscribe = useGame.subscribe((s, prev) => {
      if (s.levelIndex !== prev.levelIndex) scene.setup(currentLevel(s), s.profile?.avatar ?? "biru");
    });

    return () => {
      unsubscribe();
      board.detach(scene);
      game.destroy(true);
    };
  }, [iso]);

  return <div className="board-host" ref={host} aria-label="Papan sawah" role="img" />;
}
