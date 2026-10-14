import type { Level } from "../src";

/** Level kecil untuk tes: Bima di kiri, dua padi, rangkiang di kanan atas. */
export const sampleLevel: Level = {
  id: "test-01",
  jenjang: 1,
  order: 1,
  name: "Uji",
  modul: "Tes",
  map: [
    "~..L", //
    "#.p.",
    "Bp..",
  ],
  startDir: "E",
  target: 7,
  palette: ["maju", "kiri", "kanan", "ulangi"],
  mission: "Uji",
  hint: "Uji",
  bridge: "Uji",
  // maju (panen), maju (2,2), kiri, maju (2,1 panen), maju (2,0), kanan, maju (3,0)
  solution: ["M", "M", "L", "M", "M", "R", "M"],
};
