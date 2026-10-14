import type { Direction, Level, Point, TileCode } from "./types";

export const DIRECTIONS: readonly Direction[] = ["N", "E", "S", "W"];

const DELTA: Record<Direction, Point> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

/** Putar arah: +1 = kanan (searah jarum jam), -1 = kiri. */
export function turn(dir: Direction, delta: 1 | -1): Direction {
  const i = DIRECTIONS.indexOf(dir);
  return DIRECTIONS[(i + delta + 4) % 4] as Direction;
}

export function ahead(p: Point, dir: Direction): Point {
  const d = DELTA[dir];
  return { x: p.x + d.x, y: p.y + d.y };
}

/** Sudut tampilan dalam derajat (utara = 0). */
export function directionAngle(dir: Direction): number {
  return DIRECTIONS.indexOf(dir) * 90;
}

export function gridSize(level: Pick<Level, "map">): { cols: number; rows: number } {
  return { cols: level.map[0]?.length ?? 0, rows: level.map.length };
}

/** Isi petak, atau null bila di luar peta. */
export function tileAt(level: Pick<Level, "map">, p: Point): TileCode | null {
  const row = level.map[p.y];
  if (p.x < 0 || p.y < 0 || row === undefined || p.x >= row.length) return null;
  return row[p.x] as TileCode;
}

export function findTiles(level: Pick<Level, "map">, code: TileCode): Point[] {
  const out: Point[] = [];
  level.map.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === code) out.push({ x, y });
    });
  });
  return out;
}

/** Posisi awal Bima (petak "B"). */
export function startPoint(level: Pick<Level, "map">): Point {
  const found = findTiles(level, "B")[0];
  if (!found) throw new Error("Peta tidak punya petak awal B");
  return found;
}

export const pointKey = (p: Point): string => `${p.x},${p.y}`;
