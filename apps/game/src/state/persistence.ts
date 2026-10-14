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
  /** Lencana konsep yang sudah diraih (id lencana). */
  badges: string[];
}

/** Warna Bima yang dipilih anak sebagai avatar. */
export type AvatarColor = "biru" | "hijau" | "jingga" | "ungu";

export interface Profile {
  name: string;
  avatar: AvatarColor;
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
  profile: Profile | null;
}

const KEY = "robo-nusantara/save";

export const DEFAULT_SETTINGS: Settings = {
  speedMs: 420,
  narration: true,
  music: true,
  sfx: true,
  unlockAll: false,
};

export const EMPTY_PROGRESS: Progress = { stars: {}, tutorialDone: false, badges: [] };

export function loadSave(): SaveData {
  const fallback: SaveData = {
    version: 1,
    progress: { ...EMPTY_PROGRESS, stars: {}, badges: [] },
    settings: { ...DEFAULT_SETTINGS },
    profile: null,
  };
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const profile = parsed.profile;
    return {
      version: 1,
      progress: {
        ...EMPTY_PROGRESS,
        ...parsed.progress,
        stars: { ...parsed.progress?.stars },
        badges: Array.isArray(parsed.progress?.badges) ? parsed.progress.badges : [],
      },
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      profile: profile && typeof profile.name === "string" ? { name: profile.name, avatar: profile.avatar ?? "biru" } : null,
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
