/**
 * Status permainan (zustand). Berisi apa yang dilihat dan diubah anak:
 * layar aktif, level, program kartu, pesan Bima, petunjuk, hasil,
 * serta kemajuan dan pengaturan yang disimpan.
 *
 * Animasi papan dan pemutaran program ada di `game/runner.ts`.
 */
import {
  createIdFactory,
  createNode,
  findNode,
  fromTokens,
  getHint,
  insertNode,
  listOf,
  moveNode,
  numberCards,
  removeNode,
  scoreRun,
  setLoopCount,
  type CardType,
  type EditResult,
  type Level,
  type ListKey,
  type Program,
  type Score,
  type Token,
} from "@robo/engine";
import { jenjang1 } from "@robo/levels";
import { create } from "zustand";
import { t } from "../copy/id";
import { loadSave, writeSave, EMPTY_PROGRESS, type Progress, type Settings } from "./persistence";

export type Screen = "title" | "map" | "play";
export type SayKind = "info" | "ok" | "warn" | "bug" | "hint";
export type Mood = "normal" | "happy" | "think" | "dizzy";
export type Phase = "edit" | "running" | "stepping";

export interface Say {
  id: number;
  kind: SayKind;
  text: string;
  mood: Mood;
  /** Bacakan dengan narasi bila pengaturan narasi aktif. */
  speak: boolean;
  preview?: { tokens: Token[]; truncated: boolean };
}

export interface ActiveStep {
  nodeId: string;
  loop?: { id: string; iteration: number; count: number };
}

export interface LevelResult {
  levelId: string;
  score: Score;
}

export const LEVELS: Level[] = jenjang1.levels;
export const REGION_NAME = jenjang1.name;

const nextId = createIdFactory("k");
const HISTORY_LIMIT = 60;
const MOOD_FOR: Record<SayKind, Mood> = { info: "normal", ok: "happy", warn: "think", bug: "dizzy", hint: "think" };

interface GameState {
  screen: Screen;
  levelIndex: number;
  program: Program;
  history: Program[];
  selectedId: string | null;
  /** Ke mana kartu yang diketuk (bukan diseret) akan masuk. */
  tapTarget: ListKey;
  phase: Phase;
  activeStep: ActiveStep | null;
  bugNodeId: string | null;
  hintNodeId: string | null;
  hintTier: 0 | 1 | 2 | 3;
  hintsUsed: number;
  say: Say;
  result: LevelResult | null;
  teacherOpen: boolean;
  celebrateNonce: number;
  progress: Progress;
  settings: Settings;
}

interface GameActions {
  goTo(screen: Screen): void;
  openLevel(index: number, program?: Token[]): void;
  addCard(type: CardType, listKey?: ListKey, index?: number): void;
  moveCard(id: string, listKey: ListKey, index: number): void;
  removeCard(id: string): void;
  changeLoopCount(id: string, delta: 1 | -1): void;
  undo(): void;
  select(id: string | null): void;
  setTapTarget(key: ListKey): void;
  talk(kind: SayKind, text: string, opts?: { mood?: Mood; speak?: boolean; preview?: Say["preview"] }): void;
  requestHint(): void;
  setPhase(phase: Phase): void;
  setActiveStep(step: ActiveStep | null): void;
  markBug(nodeId: string | null): void;
  completeLevel(): void;
  closeResult(): void;
  retryLevel(): void;
  setTeacherOpen(open: boolean): void;
  updateSettings(patch: Partial<Settings>): void;
  wipeProgress(): void;
}

export type GameStore = GameState & GameActions;

const saved = loadSave();
let sayId = 0;
const makeSay = (kind: SayKind, text: string, opts: { mood?: Mood; speak?: boolean; preview?: Say["preview"] } = {}): Say => ({
  id: ++sayId,
  kind,
  text,
  mood: opts.mood ?? MOOD_FOR[kind],
  speak: opts.speak ?? false,
  ...(opts.preview ? { preview: opts.preview } : {}),
});

export const useGame = create<GameStore>()((set, get) => {
  const persist = () => {
    const { progress, settings } = get();
    writeSave({ progress, settings });
  };

  /** Terapkan hasil penyuntingan program, simpan riwayat untuk Batal. */
  const commit = (result: EditResult, after?: Partial<GameState>) => {
    if (!result.ok) {
      set({ say: makeSay("warn", t.editError[result.error], { speak: true }) });
      return false;
    }
    const { program, history } = get();
    set({
      program: result.program,
      history: [...history, program].slice(-HISTORY_LIMIT),
      bugNodeId: null,
      hintNodeId: null,
      activeStep: null,
      phase: "edit",
      ...after,
    });
    return true;
  };

  const canEdit = () => get().phase !== "running" && get().result === null;

  return {
    screen: "title",
    levelIndex: 0,
    program: [],
    history: [],
    selectedId: null,
    tapTarget: "main",
    phase: "edit",
    activeStep: null,
    bugNodeId: null,
    hintNodeId: null,
    hintTier: 0,
    hintsUsed: 0,
    say: makeSay("info", ""),
    result: null,
    teacherOpen: false,
    celebrateNonce: 0,
    progress: saved.progress,
    settings: saved.settings,

    goTo: (screen) => set({ screen, selectedId: null }),

    openLevel: (index, tokens) => {
      const level = LEVELS[index];
      if (!level) return;
      const program = fromTokens(tokens ?? level.prefill ?? [], nextId);
      const tutorialActive = Boolean(level.tutorial && !get().progress.tutorialDone);
      const intro =
        level.feature === "kumbang-galat"
          ? makeSay("bug", t.levelIntroGalat, { speak: true })
          : makeSay("info", tutorialActive ? t.tutorialDrag : level.mission, { speak: true, mood: tutorialActive ? "happy" : "normal" });
      set({
        screen: "play",
        levelIndex: index,
        program,
        history: [],
        selectedId: null,
        tapTarget: "main",
        phase: "edit",
        activeStep: null,
        bugNodeId: null,
        hintNodeId: null,
        hintTier: 0,
        hintsUsed: 0,
        result: null,
        say: intro,
      });
    },

    addCard: (type, listKey, index) => {
      if (!canEdit()) return;
      const level = currentLevel(get());
      if (!level.palette.includes(type)) return;
      const { program, tapTarget } = get();
      // Kartu Ulangi selalu masuk ke program utama.
      const target: ListKey = type === "ulangi" ? "main" : (listKey ?? tapTarget);
      const list = listOf(program, target) ?? program;
      const node = createNode(type, nextId);
      const ok = commit(insertNode(program, listOf(program, target) ? target : "main", index ?? list.length, node), {
        selectedId: null,
        ...(type === "ulangi" ? { tapTarget: `loop:${node.id}` as ListKey } : {}),
      });
      if (ok && type === "ulangi") set({ say: makeSay("info", t.loopReady, { speak: true }) });
    },

    moveCard: (id, listKey, index) => {
      if (!canEdit()) return;
      commit(moveNode(get().program, id, listKey, index), { selectedId: null });
    },

    removeCard: (id) => {
      if (!canEdit()) return;
      const { tapTarget } = get();
      commit(removeNode(get().program, id), {
        selectedId: null,
        ...(tapTarget === `loop:${id}` ? { tapTarget: "main" as ListKey } : {}),
      });
    },

    changeLoopCount: (id, delta) => {
      if (!canEdit()) return;
      const found = findNode(get().program, id);
      if (!found || found.node.type !== "ulangi") return;
      commit(setLoopCount(get().program, id, found.node.count + delta));
    },

    undo: () => {
      if (!canEdit()) return;
      const { history } = get();
      const prev = history.at(-1);
      if (!prev) return;
      set({
        program: prev,
        history: history.slice(0, -1),
        selectedId: null,
        tapTarget: "main",
        bugNodeId: null,
        hintNodeId: null,
        activeStep: null,
        phase: "edit",
        say: makeSay("info", t.undone),
      });
    },

    select: (id) => set({ selectedId: id }),
    setTapTarget: (key) => set({ tapTarget: key }),

    talk: (kind, text, opts) => set({ say: makeSay(kind, text, opts) }),

    requestHint: () => {
      if (!canEdit()) return;
      const { hintTier, hintsUsed, program } = get();
      const level = currentLevel(get());
      const tier = Math.min(hintTier + 1, 3) as 1 | 2 | 3;
      const hint = getHint(level, program, tier);
      let text = "";
      let hintNodeId: string | null = null;
      let preview: Say["preview"];
      if (hint.tier === 1) text = hint.text;
      if (hint.tier === 2) {
        const num = hint.diagnosis.kind === "bump" ? numberCards(program).get(hint.diagnosis.nodeId) : undefined;
        text = t.diagnosis(hint.diagnosis, num);
        if (hint.diagnosis.kind === "bump") hintNodeId = hint.diagnosis.nodeId;
      }
      if (hint.tier === 3) {
        text = t.hintPreview;
        preview = { tokens: hint.preview, truncated: hint.truncated };
      }
      set({
        hintTier: tier,
        hintsUsed: hintsUsed + 1,
        hintNodeId,
        say: makeSay("hint", `${t.hintTitle(tier)} ${text}`, { speak: true, ...(preview ? { preview } : {}) }),
      });
    },

    setPhase: (phase) => set({ phase, ...(phase === "edit" ? { activeStep: null } : {}) }),
    setActiveStep: (activeStep) => set({ activeStep }),
    markBug: (bugNodeId) => set({ bugNodeId }),

    completeLevel: () => {
      const state = get();
      const level = currentLevel(state);
      const score = scoreRun(level, state.program, { won: true, hintsUsed: state.hintsUsed });
      const best = Math.max(state.progress.stars[level.id] ?? 0, score.stars);
      set({
        result: { levelId: level.id, score },
        phase: "edit",
        activeStep: null,
        progress: {
          stars: { ...state.progress.stars, [level.id]: best },
          tutorialDone: state.progress.tutorialDone || Boolean(level.tutorial),
        },
      });
      persist();
    },

    closeResult: () => set({ result: null }),

    retryLevel: () =>
      set({ result: null, hintTier: 0, hintsUsed: 0, hintNodeId: null, say: makeSay("info", t.retryPrompt, { speak: true }) }),

    setTeacherOpen: (teacherOpen) => set({ teacherOpen }),

    updateSettings: (patch) => {
      set({ settings: { ...get().settings, ...patch } });
      persist();
    },

    wipeProgress: () => {
      set({ progress: { ...EMPTY_PROGRESS, stars: {} } });
      persist();
    },
  };
});

/* ---------- pemilih (selector) ---------- */

export function currentLevel(s: Pick<GameState, "levelIndex">): Level {
  return LEVELS[s.levelIndex] ?? (LEVELS[0] as Level);
}

export function isUnlocked(s: Pick<GameState, "progress" | "settings">, index: number): boolean {
  if (index === 0 || s.settings.unlockAll) return true;
  const prev = LEVELS[index - 1];
  return Boolean(prev && (s.progress.stars[prev.id] ?? 0) > 0);
}

/** Level berikutnya yang belum selesai (untuk tombol Mulai bermain). */
export function nextPlayableIndex(s: Pick<GameState, "progress" | "settings">): number {
  const i = LEVELS.findIndex((l, idx) => isUnlocked(s, idx) && !((s.progress.stars[l.id] ?? 0) > 0));
  return i < 0 ? LEVELS.length - 1 : i;
}

export function totalStars(s: Pick<GameState, "progress">): number {
  return LEVELS.reduce((sum, l) => sum + (s.progress.stars[l.id] ?? 0), 0);
}

/** Langkah tutorial level 1: 1 seret kartu, 2 tambah lagi, 3 tekan Jalankan, 0 tidak aktif. */
export function tutorialStep(s: GameState): 0 | 1 | 2 | 3 {
  const level = currentLevel(s);
  if (s.screen !== "play" || !level.tutorial || s.progress.tutorialDone || s.result) return 0;
  if (s.phase !== "edit") return 0;
  const n = s.program.length;
  if (n === 0) return 1;
  if (n < level.solution.length) return 2;
  return 3;
}
