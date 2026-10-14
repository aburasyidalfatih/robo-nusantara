/**
 * Kemajuan dan pengaturan disimpan di perangkat (localStorage).
 * Semua akses dibungkus try/catch: mode privat atau penyimpanan
 * yang diblokir tidak boleh membuat game gagal dimuat.
 * Sinkronisasi ke akun sekolah menyusul bersama backend.
 */
export interface Progress {
  /** Bintang terbaik per id level. */
  stars: Record<string, number>;
  tutorialDone: boolean;
}

export interface Settings {
  speedMs: number;
  narration: boolean;
  music: boolean;
  sfx: boolean;
  unlockAll: boolean;
}

export interface SaveData {
  version: 1;
  progress: Progress;
  settings: Settings;
}

const KEY = "robo-nusantara/save";

export const DEFAULT_SETTINGS: Settings = {
  speedMs: 420,
  narration: true,
  music: true,
  sfx: true,
  unlockAll: false,
};

export const EMPTY_PROGRESS: Progress = { stars: {}, tutorialDone: false };

export function loadSave(): SaveData {
  const fallback: SaveData = { version: 1, progress: { ...EMPTY_PROGRESS }, settings: { ...DEFAULT_SETTINGS } };
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      version: 1,
      progress: { ...EMPTY_PROGRESS, ...parsed.progress, stars: { ...parsed.progress?.stars } },
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return fallback;
  }
}

export function writeSave(data: Omit<SaveData, "version">): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify({ version: 1, ...data }));
  } catch {
    /* penyimpanan tidak tersedia: game tetap jalan tanpa menyimpan */
  }
}
