import type { Level } from "@robo/engine";
import l01 from "./jenjang-1/01-lurus-ke-rangkiang.json";
import l02 from "./jenjang-1/02-belok-pertama.json";
import l03 from "./jenjang-1/03-pematang-berkelok.json";
import l04 from "./jenjang-1/04-panen-berjajar.json";
import l05 from "./jenjang-1/05-tangkap-kumbang-galat.json";
import l06 from "./jenjang-1/06-festival-panen.json";

/**
 * JSON tidak membawa tipe literal (mis. "E" terbaca sebagai string),
 * jadi data dikonversi di sini. Kebenaran isinya dijaga oleh
 * tes `levels.test.ts` yang memanggil validateLevel untuk setiap level.
 */
const asLevel = ({ $schema: _schema, ...raw }: Record<string, unknown>): Level => raw as unknown as Level;

export interface Region {
  jenjang: number;
  name: string;
  levels: Level[];
}

export const jenjang1: Region = {
  jenjang: 1,
  name: "Desa Sawah Berundak",
  levels: [l01, l02, l03, l04, l05, l06].map(asLevel).sort((a, b) => a.order - b.order),
};

export const regions: Region[] = [jenjang1];

export function findLevel(id: string): Level | undefined {
  for (const r of regions) {
    const found = r.levels.find((l) => l.id === id);
    if (found) return found;
  }
  return undefined;
}
