/**
 * Tipe dasar Robo Nusantara.
 *
 * Engine tidak bergantung pada DOM, Phaser, atau React, sehingga bisa dipakai
 * di game, editor level, server penilaian, maupun unit test.
 */

/** Arah hadap robot: utara, timur, selatan, barat (searah jarum jam). */
export type Direction = "N" | "E" | "S" | "W";

/** Kartu perintah tunggal. Nilainya dipakai juga sebagai kunci teks di UI. */
export type CommandType = "maju" | "kiri" | "kanan";

/** Semua jenis kartu, termasuk blok perulangan. */
export type CardType = CommandType | "ulangi";

/**
 * Isi petak di peta level.
 *  .  sawah (bisa dilewati)
 *  #  pohon (menghalangi)
 *  ~  petak berair (menghalangi)
 *  p  padi (bisa dilewati, dipanen saat dilewati)
 *  L  rangkiang / lumbung (tujuan)
 *  B  posisi awal Bima (dianggap sawah)
 */
export type TileCode = "." | "#" | "~" | "p" | "L" | "B";

/**
 * Bentuk ringkas program, dipakai di file level (solusi, program awal)
 * dan untuk menyimpan riwayat Batal.
 *  M = maju, L = belok kiri, R = belok kanan, { rep, body } = blok Ulangi
 */
export type Token = "M" | "L" | "R" | { rep: number; body: Token[] };

export interface Level {
  /** Penanda unik dan stabil, mis. "j1-01". Dipakai untuk menyimpan kemajuan. */
  id: string;
  jenjang: number;
  /** Urutan di peta wilayah, mulai dari 1. */
  order: number;
  name: string;
  /** Modul kurikulum, mis. "Modul 2 · Urutan". */
  modul: string;
  /** Baris peta dari atas ke bawah; semua baris sama panjang. */
  map: string[];
  startDir: Direction;
  /** Jumlah kartu paling hemat; syarat bintang kedua. */
  target: number;
  /** Kartu yang boleh dipakai di level ini. */
  palette: CardType[];
  mission: string;
  /** Petunjuk tingkat 1 (pertanyaan penuntun). */
  hint: string;
  /** Tugas Jembatan Dunia Nyata setelah level selesai. */
  bridge: string;
  /** Satu solusi resmi. Dipakai untuk validasi dan petunjuk tingkat 3. */
  solution: Token[];
  /** Program awal (mis. level debugging berisi bug). */
  prefill?: Token[];
  /** Level ini memakai tutorial tangan penunjuk. */
  tutorial?: boolean;
  /** Tokoh tambahan yang muncul di level, mis. "kumbang-galat". */
  feature?: "kumbang-galat";
}

export interface CommandNode {
  id: string;
  type: CommandType;
}

export interface LoopNode {
  id: string;
  type: "ulangi";
  count: number;
  children: CommandNode[];
}

export type ProgramNode = CommandNode | LoopNode;
export type Program = ProgramNode[];

/** Alamat daftar kartu: program utama atau isi sebuah blok Ulangi. */
export type ListKey = "main" | `loop:${string}`;

export interface Point {
  x: number;
  y: number;
}

/** Satu perintah yang sudah "dibuka" dari blok Ulangi. */
export interface FlatCommand {
  type: CommandType;
  nodeId: string;
  /** Diisi bila perintah berasal dari dalam blok Ulangi. */
  loop?: { id: string; iteration: number; count: number };
}

export type SimStep =
  | (FlatCommand & { kind: "turn"; delta: 1 | -1; at: Point; dir: Direction })
  | (FlatCommand & { kind: "move"; from: Point; at: Point; dir: Direction; harvested?: Point })
  | (FlatCommand & {
      kind: "bump";
      at: Point;
      dir: Direction;
      blockedAt: Point;
      obstacle: Obstacle;
    });

export type Obstacle = "pohon" | "air" | "tepi";

export type SimOutcome =
  /** Sampai di rangkiang dan semua padi terpanen. */
  | "win"
  /** Menabrak sesuatu; langkah terakhir adalah "bump". */
  | "bump"
  /** Sampai di rangkiang tetapi ada padi yang tertinggal. */
  | "padi-left"
  /** Program habis sebelum sampai di rangkiang. */
  | "not-at-goal"
  /** Program kosong atau blok Ulangi tanpa isi. */
  | "empty";

export interface SimResult {
  outcome: SimOutcome;
  steps: SimStep[];
  start: Point;
  startDir: Direction;
  end: Point;
  endDir: Direction;
  padiTotal: number;
  padiHarvested: number;
  /** Kartu yang membuat robot menabrak (bila outcome "bump"). */
  bumpNodeId?: string;
  obstacle?: Obstacle;
}
