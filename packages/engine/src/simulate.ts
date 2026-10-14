import { ahead, findTiles, pointKey, startPoint, tileAt, turn } from "./grid";
import { flatten } from "./program";
import type { Level, Obstacle, Point, Program, SimResult, SimStep } from "./types";

/**
 * Jalankan program di atas peta level dan kembalikan seluruh langkahnya.
 *
 * Simulasi bersifat deterministik dan selesai seketika; game lalu
 * memutar ulang `steps` satu per satu sebagai animasi.
 */
export function simulate(level: Level, program: Program): SimResult {
  const start = startPoint(level);
  const padiTotal = findTiles(level, "p").length;
  const commands = flatten(program);

  let at: Point = start;
  let dir = level.startDir;
  const harvested = new Set<string>();
  const steps: SimStep[] = [];

  const result = (outcome: SimResult["outcome"], extra: Partial<SimResult> = {}): SimResult => ({
    outcome,
    steps,
    start,
    startDir: level.startDir,
    end: at,
    endDir: dir,
    padiTotal,
    padiHarvested: harvested.size,
    ...extra,
  });

  if (commands.length === 0) return result("empty");

  for (const cmd of commands) {
    if (cmd.type === "kiri" || cmd.type === "kanan") {
      const delta = cmd.type === "kanan" ? 1 : -1;
      dir = turn(dir, delta);
      steps.push({ ...cmd, kind: "turn", delta, at, dir });
      continue;
    }

    const next = ahead(at, dir);
    const tile = tileAt(level, next);
    const obstacle: Obstacle | null =
      tile === null ? "tepi" : tile === "#" ? "pohon" : tile === "~" ? "air" : null;

    if (obstacle) {
      steps.push({ ...cmd, kind: "bump", at, dir, blockedAt: next, obstacle });
      return result("bump", { bumpNodeId: cmd.nodeId, obstacle });
    }

    const from = at;
    at = next;
    let gathered: Point | undefined;
    if (tile === "p" && !harvested.has(pointKey(at))) {
      harvested.add(pointKey(at));
      gathered = at;
    }
    steps.push({ ...cmd, kind: "move", from, at, dir, ...(gathered ? { harvested: gathered } : {}) });
  }

  if (tileAt(level, at) !== "L") return result("not-at-goal");
  return result(harvested.size === padiTotal ? "win" : "padi-left");
}
