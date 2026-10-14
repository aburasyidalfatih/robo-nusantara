/**
 * Pemutar program: menjalankan simulasi engine sekali, lalu memutar
 * langkah-langkahnya di papan Phaser satu per satu (Jalankan) atau
 * selangkah demi selangkah (Langkah).
 */
import { numberCards, simulate, type SimResult, type SimStep } from "@robo/engine";
import { sfx } from "../audio/sound";
import { board } from "../board/bridge";
import type { BoardScene } from "../board/BoardScene";
import { t } from "../copy/id";
import { currentLevel, useGame } from "../state/store";

interface Session {
  sim: SimResult;
  index: number;
  token: number;
  done: boolean;
}

let session: Session | null = null;
/** Bertambah setiap kali pemutaran dibatalkan; pemutaran lama berhenti sendiri. */
let token = 0;
let stepping = false;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const game = () => useGame.getState();

// Begitu program diubah setelah dijalankan, Bima kembali ke titik awal.
useGame.subscribe((s, prev) => {
  if (s.levelIndex !== prev.levelIndex || (s.screen !== "play" && prev.screen === "play")) {
    token++;
    session = null;
    return;
  }
  if (s.program !== prev.program && session) {
    token++;
    session = null;
    board.get()?.resetRobot();
  }
});

async function scene(): Promise<BoardScene | null> {
  const s = board.get();
  if (!s) return null;
  await s.ready;
  return s;
}

function timing() {
  const speed = game().settings.speedMs;
  return { anim: Math.round(speed * 0.78), gap: Math.round(speed * 0.22) };
}

async function playOne(step: SimStep, s: BoardScene): Promise<void> {
  game().setActiveStep({ nodeId: step.nodeId, ...(step.loop ? { loop: step.loop } : {}) });
  if (step.kind === "turn") sfx.turn();
  else if (step.kind === "bump") sfx.bump();
  else if (step.harvested) window.setTimeout(() => sfx.harvest(), timing().anim * 0.5);
  else sfx.step();
  await s.playStep(step, timing().anim);
}

/** Siapkan sesi baru, atau kembalikan null bila program belum bisa dijalankan. */
function prepare(): SimResult | null {
  const store = game();
  if (store.program.length === 0) {
    store.talk("warn", t.emptyProgram, { speak: true });
    sfx.miss();
    return null;
  }
  const sim = simulate(currentLevel(store), store.program);
  if (sim.outcome === "empty") {
    store.talk("warn", t.emptyLoop, { speak: true });
    sfx.miss();
    return null;
  }
  return sim;
}

async function finish(sim: SimResult, s: BoardScene, my: number): Promise<void> {
  if (session) session.done = true;
  const store = game();
  store.setActiveStep(null);

  if (sim.outcome === "win") {
    useGame.setState({ phase: "running" });
    store.talk("ok", store.profile ? t.winNamed(store.profile.name) : t.win, { speak: true });
    sfx.win();
    useGame.setState((st) => ({ celebrateNonce: st.celebrateNonce + 1 }));
    await s.celebrate();
    await wait(450);
    if (token === my) game().completeLevel();
    return;
  }

  store.setPhase("edit");
  if (sim.outcome === "bump" && sim.bumpNodeId && sim.obstacle) {
    const num = numberCards(store.program).get(sim.bumpNodeId) ?? 0;
    store.markBug(sim.bumpNodeId);
    store.talk("bug", t.bump(num, sim.obstacle), { speak: true });
    return;
  }
  sfx.miss();
  s.showEmote("question");
  if (sim.outcome === "padi-left") store.talk("warn", t.padiLeft(sim.padiHarvested, sim.padiTotal), { speak: true });
  else store.talk("warn", t.notAtGoal, { speak: true });
}

export async function runProgram(): Promise<void> {
  if (game().phase === "running") {
    stopProgram();
    return;
  }
  const sim = prepare();
  if (!sim) return;
  const s = await scene();
  if (!s) return;

  const my = ++token;
  s.resetRobot();
  session = { sim, index: 0, token: my, done: false };
  useGame.setState({ phase: "running", bugNodeId: null, hintNodeId: null, selectedId: null });
  game().talk("info", t.running, { mood: "happy" });
  await wait(150);

  while (token === my && session && session.index < sim.steps.length) {
    const step = sim.steps[session.index++] as SimStep;
    await playOne(step, s);
    if (token !== my) return;
    await wait(timing().gap);
  }
  if (token === my) await finish(sim, s, my);
}

export function stopProgram(): void {
  token++;
  if (session) session.done = true;
  const store = game();
  store.setPhase("edit");
  store.talk("info", t.stopped);
}

/** Jalankan satu langkah saja, supaya anak bisa mencari letak bug. */
export async function stepProgram(): Promise<void> {
  if (stepping || game().phase === "running") return;
  stepping = true;
  try {
    const s = await scene();
    if (!s) return;
    if (!session || session.done) {
      const sim = prepare();
      if (!sim) return;
      s.resetRobot();
      session = { sim, index: 0, token: ++token, done: false };
    }
    const current = session;
    const step = current.sim.steps[current.index++] as SimStep;
    useGame.setState({ phase: "stepping", bugNodeId: null, hintNodeId: null, selectedId: null });
    const num = numberCards(game().program).get(step.nodeId) ?? 0;
    game().talk("info", t.stepInfo(current.index, current.sim.steps.length, num, step.type, step.loop));
    await playOne(step, s);
    if (session !== current) return;
    if (current.index >= current.sim.steps.length) await finish(current.sim, s, current.token);
  } finally {
    stepping = false;
  }
}

export function resetBoard(): void {
  token++;
  session = null;
  board.get()?.resetRobot();
  const store = game();
  store.setPhase("edit");
  store.markBug(null);
  store.talk("info", t.backToStart);
}
