/**
 * Papan sawah isometrik (2.5D).
 *
 * Petak digambar sebagai balok bersudut 2:1 dengan sisi yang terlihat,
 * dan barisan belakang lebih tinggi daripada barisan depan sehingga
 * membentuk terasering. Logika permainan tetap di @robo/engine; scene ini
 * hanya memutar langkah simulasi, sama seperti BoardScene (papan datar).
 */
import Phaser from "phaser";
import { directionAngle, gridSize, pointKey, startPoint, tileAt, type Level, type Point, type SimStep } from "@robo/engine";
import type { AvatarColor } from "../state/persistence";
import batuUrl from "../assets/sprites/batu.svg";
import bebekUrl from "../assets/sprites/bebek.svg";
import bimaUrl from "../assets/sprites/bima-top.svg";
import bungaUrl from "../assets/sprites/bunga.svg";
import emoteDizzyUrl from "../assets/sprites/emote-dizzy.svg";
import emoteHeartUrl from "../assets/sprites/emote-heart.svg";
import emotePadiUrl from "../assets/sprites/emote-padi.svg";
import emoteQuestionUrl from "../assets/sprites/emote-question.svg";
import padiStubUrl from "../assets/sprites/padi-stub.svg";
import padiUrl from "../assets/sprites/padi.svg";
import pohonUrl from "../assets/sprites/pohon.svg";
import rangkiangUrl from "../assets/sprites/rangkiang.svg";
import rumputUrl from "../assets/sprites/rumput.svg";
import sayapUrl from "../assets/sprites/sayap.svg";
import type { BoardLike, Emote } from "./bridge";

/** Lebar dan tinggi belah ketupat satu petak (perbandingan 2:1). */
const TW = 128;
const TH = 64;
/** Beda tinggi antar barisan (terasering). */
const STEP = 14;
/** Tebal sisi balok yang terlihat di bawah petak terdepan. */
const SIDE = 22;
const PAD_X = 24;
const PAD_TOP = 70;
const PAD_BOTTOM = 36;
/** Petak air lebih rendah dari sawah di sekitarnya. */
const WATER_DROP = 9;
/** Sprite berdiri dipipihkan sedikit agar seolah berdiri di lantai miring. */
const ROBOT_SQUASH = 0.72;

const BASE_BODY = { dark: "#2463b5", light: "#5f9ce4" };
const AVATAR_BODY: Record<AvatarColor, { dark: string; light: string }> = {
  biru: { dark: "#2463b5", light: "#5f9ce4" },
  hijau: { dark: "#2b8452", light: "#5fbf86" },
  jingga: { dark: "#c4531a", light: "#ef8a4c" },
  ungu: { dark: "#7b3fa8", light: "#aa75d6" },
};

const C = {
  sawahTop: [0x7db349, 0x79ae45, 0x82b84d],
  sawahStripe: [0x6aa03b, 0x679c38, 0x6ea53e],
  sawahLeft: 0x9b7f4a,
  sawahRight: 0xb8995a,
  waterTop: 0x62b0c6,
  waterLeft: 0x3c7f94,
  waterRight: 0x4b94aa,
  edge: 0x5a4a2a,
  danger: 0xe2455a,
};

export function isoPixelSize(level: Pick<Level, "map">): { width: number; height: number } {
  const { cols, rows } = gridSize(level);
  const width = ((cols + rows) * TW) / 2 + PAD_X * 2;
  const height = ((cols + rows) * TH) / 2 + (rows - 1) * STEP + SIDE + PAD_TOP + PAD_BOTTOM;
  return { width, height };
}

function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

interface PadiSprite {
  image: Phaser.GameObjects.Image;
  sway: Phaser.Tweens.Tween | null;
}

export class IsoBoardScene extends Phaser.Scene implements BoardLike {
  readonly ready: Promise<void>;
  private resolveReady!: () => void;
  private created = false;
  private pending: { level: Level; avatar: AvatarColor } | null = null;
  private level: Level | null = null;
  private avatar: AvatarColor = "biru";
  private reducedMotion = false;
  private rows = 0;
  private originX = 0;
  private originY = 0;

  private layer: Phaser.GameObjects.Container | null = null;
  private robot: Phaser.GameObjects.Container | null = null;
  private robotImg: Phaser.GameObjects.Image | null = null;
  private shadow: Phaser.GameObjects.Ellipse | null = null;
  private heading = 0;
  private robotCell: Point = { x: 0, y: 0 };
  private emote: Phaser.GameObjects.Image | null = null;
  private padi = new Map<string, PadiSprite>();
  private harvested = new Set<string>();

  constructor() {
    super("iso-board");
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  preload(): void {
    const big = { width: 256, height: 256 };
    const small = { width: 96, height: 96 };
    this.load.text("bima-src", bimaUrl);
    this.load.svg("padi", padiUrl, big);
    this.load.svg("padi-stub", padiStubUrl, big);
    this.load.svg("pohon", pohonUrl, big);
    this.load.svg("rangkiang", rangkiangUrl, big);
    this.load.svg("bebek", bebekUrl, big);
    this.load.svg("sayap", sayapUrl, { width: 48, height: 64 });
    this.load.svg("bunga", bungaUrl, small);
    this.load.svg("rumput", rumputUrl, small);
    this.load.svg("batu", batuUrl, small);
    this.load.svg("emote-heart", emoteHeartUrl, small);
    this.load.svg("emote-dizzy", emoteDizzyUrl, small);
    this.load.svg("emote-question", emoteQuestionUrl, small);
    this.load.svg("emote-padi", emotePadiUrl, small);
  }

  create(): void {
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const src = this.cache.text.get("bima-src") as string | undefined;
    for (const [name, body] of Object.entries(AVATAR_BODY) as [AvatarColor, { dark: string; light: string }][]) {
      const svg = (src ?? "").split(BASE_BODY.dark).join(body.dark).split(BASE_BODY.light).join(body.light);
      if (src) this.load.svg(`bima-${name}`, `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`, { width: 256, height: 256 });
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.created = true;
      this.resolveReady();
      if (this.pending) this.setup(this.pending.level, this.pending.avatar);
    });
    this.load.start();
  }

  override update(): void {
    if (this.robot) {
      this.robot.setDepth(this.robot.y + 2);
      if (this.shadow) this.shadow.setPosition(this.robot.x, this.robot.y + 4).setDepth(this.robot.y + 1);
      if (this.emote) this.emote.setPosition(this.robot.x, this.robot.y - TH * 1.25).setDepth(100000);
    }
  }

  /* ---------- proyeksi ---------- */

  /** Tinggi lantai petak (barisan belakang lebih tinggi). */
  private elevation(p: Point): number {
    const base = (this.rows - 1 - p.y) * STEP;
    return tileAt(this.level as Level, p) === "~" ? base - WATER_DROP : base;
  }

  /** Titik tengah permukaan petak di layar. */
  private project(p: Point, elevated = true): { x: number; y: number } {
    return {
      x: this.originX + ((p.x - p.y) * TW) / 2,
      y: this.originY + ((p.x + p.y) * TH) / 2 - (elevated ? this.elevation(p) : 0),
    };
  }

  /** Posisi sembarang (pecahan) di antara dua petak, untuk animasi gerak. */
  private projectFloat(x: number, y: number): { x: number; y: number } {
    const ax = Math.floor(x);
    const ay = Math.floor(y);
    const bx = Math.ceil(x);
    const by = Math.ceil(y);
    const a = this.project({ x: ax, y: ay });
    const b = this.project({ x: bx, y: by });
    const t = ax === bx && ay === by ? 0 : Math.max(x - ax, y - ay);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  /* ---------- membangun papan ---------- */

  setup(level: Level, avatar: AvatarColor = "biru"): void {
    if (!this.created) {
      this.pending = { level, avatar };
      return;
    }
    this.pending = null;
    this.level = level;
    this.avatar = avatar;
    const { cols, rows } = gridSize(level);
    this.rows = rows;
    const { width, height } = isoPixelSize(level);
    this.scale.setGameSize(width, height);
    this.cameras.main.setSize(width, height);
    this.originX = PAD_X + (rows * TW) / 2;
    this.originY = PAD_TOP + (rows - 1) * STEP + TH / 2;

    this.tweens.killAll();
    this.layer?.destroy(true);
    this.padi.clear();
    this.harvested.clear();
    this.emote = null;
    this.robot = null;

    const layer = this.add.container(0, 0);
    this.layer = layer;
    const rnd = seeded(level.id);
    const water: Point[] = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = { x, y };
        const code = level.map[y]?.[x] ?? ".";
        const c = this.project(p);
        const variant = Math.floor(rnd() * 3);
        layer.add(this.drawBlock(c.x, c.y, code === "~", variant, p));
        if (code === "~") {
          water.push(p);
          this.addWaterGlint(c.x, c.y, x + y);
        }
        if (code === "." || code === "B") this.decorate(c, rnd);
        if (code === "#") {
          const tree = this.add.image(c.x, c.y + 6, "pohon").setOrigin(0.5, 0.9).setDisplaySize(TW * 0.78, TW * 0.78).setDepth(c.y + 1);
          layer.add(tree);
          if (!this.reducedMotion) {
            tree.setAngle(-1.5);
            this.tweens.add({ targets: tree, angle: 1.5, duration: 2600 + rnd() * 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: rnd() * 1500 });
          }
        }
        if (code === "L") layer.add(this.add.image(c.x, c.y + 8, "rangkiang").setOrigin(0.5, 0.92).setDisplaySize(TW * 0.8, TW * 0.8).setDepth(c.y + 1));
        if (code === "p") {
          const img = this.add.image(c.x, c.y + 8, "padi").setOrigin(0.5, 0.92).setDisplaySize(TW * 0.7, TW * 0.7).setDepth(c.y + 1);
          layer.add(img);
          this.padi.set(pointKey(p), { image: img, sway: this.addSway(img, x + y) });
        }
      }
    }

    const shadow = this.add.ellipse(0, 0, TW * 0.5, TH * 0.5, 0x000000, 0.22);
    layer.add(shadow);
    this.shadow = shadow;
    const robotImg = this.add.image(0, 0, `bima-${this.avatar}`).setDisplaySize(TW * 0.62, TW * 0.62);
    const robot = this.add.container(0, 0, [robotImg]);
    robot.setScale(1, ROBOT_SQUASH);
    layer.add(robot);
    this.robot = robot;
    this.robotImg = robotImg;
    this.resetRobot();

    this.addDuck(water, rnd);
    this.addButterfly(width, height, rnd);
  }

  /** Satu balok petak: permukaan belah ketupat + dua sisi yang terlihat. */
  private drawBlock(cx: number, cy: number, isWater: boolean, variant: number, p: Point): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const hw = TW / 2;
    const hh = TH / 2;
    const left = { x: cx - hw, y: cy };
    const top = { x: cx, y: cy - hh };
    const right = { x: cx + hw, y: cy };
    const bottom = { x: cx, y: cy + hh };
    // Sisi sampai ke dasar petak depan: tinggi sendiri ditambah selisih ke tetangga depan.
    const depth = SIDE + (this.rows - 1 - p.y > 0 ? STEP : 0) + (isWater ? 0 : 0);

    g.fillStyle(isWater ? C.waterLeft : C.sawahLeft, 1);
    g.fillPoints([left, bottom, { x: bottom.x, y: bottom.y + depth }, { x: left.x, y: left.y + depth }], true);
    g.fillStyle(isWater ? C.waterRight : C.sawahRight, 1);
    g.fillPoints([bottom, right, { x: right.x, y: right.y + depth }, { x: bottom.x, y: bottom.y + depth }], true);

    g.fillStyle(isWater ? C.waterTop : (C.sawahTop[variant] ?? 0x7db349), 1);
    g.fillPoints([top, right, bottom, left], true);

    if (!isWater) {
      // Alur tanam sejajar sisi kanan-atas belah ketupat.
      g.lineStyle(5, C.sawahStripe[variant] ?? 0x6aa03b, 1);
      for (let k = 1; k < 6; k++) {
        const t = k / 6;
        const a = { x: left.x + (top.x - left.x) * t, y: left.y + (top.y - left.y) * t };
        const b = { x: bottom.x + (right.x - bottom.x) * t, y: bottom.y + (right.y - bottom.y) * t };
        g.lineBetween(a.x + 3, a.y, b.x - 3, b.y);
      }
    } else {
      g.lineStyle(2, 0xffffff, 0.25);
      for (let k = 1; k < 4; k++) {
        const t = k / 4;
        const a = { x: left.x + (top.x - left.x) * t, y: left.y + (top.y - left.y) * t };
        const b = { x: bottom.x + (right.x - bottom.x) * t, y: bottom.y + (right.y - bottom.y) * t };
        g.lineBetween(a.x + 10, a.y + 2, b.x - 10, b.y + 2);
      }
    }
    // Garis pematang tipis di tepi permukaan.
    g.lineStyle(2, C.edge, 0.35);
    g.strokePoints([top, right, bottom, left, top], false);
    g.setDepth(cy - 0.5);
    return g;
  }

  /* ---------- robot ---------- */

  resetRobot(): void {
    const level = this.level;
    const robot = this.robot;
    if (!level || !robot || !this.robotImg) return;
    this.tweens.killTweensOf(robot);
    this.tweens.killTweensOf(this.robotImg);
    const start = startPoint(level);
    this.robotCell = start;
    const c = this.project(start);
    this.heading = directionAngle(level.startDir) + 45;
    robot.setPosition(c.x, c.y).setScale(1, ROBOT_SQUASH);
    this.robotImg.setAngle(this.heading).setDisplaySize(TW * 0.62, TW * 0.62);
    for (const key of this.harvested) {
      const sprite = this.padi.get(key);
      if (!sprite) continue;
      sprite.image.setTexture("padi").setAngle(0).setDisplaySize(TW * 0.7, TW * 0.7);
      const [x, y] = key.split(",").map(Number);
      sprite.sway = this.addSway(sprite.image, (x ?? 0) + (y ?? 0));
    }
    this.harvested.clear();
    this.clearEmote();
  }

  playStep(step: SimStep, durationMs: number): Promise<void> {
    const robot = this.robot;
    const img = this.robotImg;
    if (!robot || !img) return Promise.resolve();
    const dur = this.reducedMotion ? Math.min(durationMs, 120) : durationMs;

    if (step.kind === "turn") {
      const from = this.heading;
      this.heading += step.delta * 90;
      return this.tween({ targets: img, angle: { from, to: this.heading }, duration: dur * 0.85, ease: "Back.easeOut" });
    }

    if (step.kind === "move") {
      const from = this.robotCell;
      const to = step.at;
      this.robotCell = to;
      if (step.harvested) {
        const where = step.harvested;
        this.time.delayedCall(dur * 0.55, () => this.harvest(where));
      }
      this.dust(robot.x, robot.y);
      const hop = { v: 0 };
      // Lompatan kecil mengikuti perubahan tinggi terasering.
      void this.tween({ targets: hop, v: 1, duration: dur, ease: "Sine.easeInOut", onUpdate: () => {
        const x = from.x + (to.x - from.x) * hop.v;
        const y = from.y + (to.y - from.y) * hop.v;
        const pos = this.projectFloat(x, y);
        robot.setPosition(pos.x, pos.y - Math.sin(hop.v * Math.PI) * 10);
      } });
      return new Promise((resolve) => this.time.delayedCall(dur, () => resolve()));
    }

    const from = this.project(step.at);
    const blocked = this.project(step.blockedAt, false);
    const nudge = { x: from.x + (blocked.x - from.x) * 0.22, y: from.y + (blocked.y - from.y) * 0.22 };
    this.flashTile(step.blockedAt);
    this.showEmote("dizzy");
    this.cameras.main.shake(180, 0.004);
    return this.tween({ targets: robot, x: nudge.x, y: nudge.y, duration: dur * 0.35, ease: "Quad.easeOut", yoyo: true }).then(() =>
      this.tween({ targets: robot, x: from.x + 6, duration: 50, yoyo: true, repeat: 2 }).then(() => {
        robot.setPosition(from.x, from.y);
      }),
    );
  }

  celebrate(): Promise<void> {
    const robot = this.robot;
    const img = this.robotImg;
    if (!robot || !img) return Promise.resolve();
    this.showEmote("heart", 1600);
    this.sparkle(robot.x, robot.y - 10);
    if (this.reducedMotion) return Promise.resolve();
    const spin = this.tween({ targets: img, angle: "+=360", duration: 900, ease: "Cubic.easeInOut" });
    void this.tween({ targets: robot, y: robot.y - 26, duration: 300, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
    return spin.then(() => {
      this.heading += 360;
    });
  }

  showEmote(kind: Emote, holdMs = 900): void {
    if (!this.robot || !this.layer) return;
    this.clearEmote();
    const img = this.add.image(this.robot.x, this.robot.y - TH * 1.25, `emote-${kind}`).setDisplaySize(TW * 0.42, TW * 0.42).setDepth(100000);
    this.layer.add(img);
    this.emote = img;
    const s = img.scaleX;
    img.setScale(s * 0.4).setAlpha(0);
    this.tweens.add({ targets: img, scaleX: s, scaleY: s, alpha: 1, duration: 180, ease: "Back.easeOut" });
    this.tweens.add({
      targets: img,
      alpha: 0,
      delay: holdMs,
      duration: 220,
      onComplete: () => {
        if (this.emote === img) this.emote = null;
        img.destroy();
      },
    });
  }

  /* ---------- bantuan ---------- */

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({ ...config, onComplete: () => resolve(), onStop: () => resolve() });
    });
  }

  private clearEmote(): void {
    if (!this.emote) return;
    this.tweens.killTweensOf(this.emote);
    this.emote.destroy();
    this.emote = null;
  }

  private decorate(c: { x: number; y: number }, rnd: () => number): void {
    const roll = rnd();
    if (roll > 0.42 || !this.layer) return;
    const key = roll < 0.2 ? "rumput" : roll < 0.34 ? "bunga" : "batu";
    const size = key === "batu" ? TW * 0.2 : TW * 0.24;
    const ox = (rnd() - 0.5) * TW * 0.45;
    const oy = (rnd() - 0.5) * TH * 0.45;
    const img = this.add.image(c.x + ox, c.y + oy, key).setOrigin(0.5, 0.95).setDisplaySize(size, size).setDepth(c.y + oy + 0.5);
    this.layer.add(img);
    if (key === "rumput" && !this.reducedMotion) {
      img.setAngle(-6);
      this.tweens.add({ targets: img, angle: 6, duration: 1800 + rnd() * 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: rnd() * 1200 });
    }
  }

  private addDuck(water: Point[], rnd: () => number): void {
    if (!water.length || !this.layer) return;
    const spot = water[Math.floor(rnd() * water.length)] as Point;
    const c = this.project(spot);
    const duck = this.add.image(c.x - TW * 0.14, c.y - 2, "bebek").setDisplaySize(TW * 0.36, TW * 0.36).setDepth(c.y + 0.6);
    this.layer.add(duck);
    if (this.reducedMotion) return;
    this.tweens.add({
      targets: duck,
      x: c.x + TW * 0.14,
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onYoyo: () => duck.setFlipX(true),
      onRepeat: () => duck.setFlipX(false),
    });
    this.tweens.add({ targets: duck, y: c.y + 1, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private addButterfly(width: number, height: number, rnd: () => number): void {
    if (this.reducedMotion || !this.layer) return;
    const body = this.add.container(0, 0).setDepth(99999);
    const left = this.add.image(-2, 0, "sayap").setOrigin(1, 0.5).setDisplaySize(TW * 0.13, TW * 0.17);
    const right = this.add.image(2, 0, "sayap").setOrigin(0, 0.5).setDisplaySize(TW * 0.13, TW * 0.17).setFlipX(true);
    body.add([left, right, this.add.ellipse(0, 0, 4, 16, 0x2b1d1a)]);
    this.layer.add(body);
    const sx = left.scaleX;
    this.tweens.add({ targets: [left, right], scaleX: sx * 0.25, duration: 140, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const fly = () => {
      if (!body.scene) return;
      const fromLeft = rnd() > 0.5;
      const y0 = PAD_TOP + rnd() * (height - PAD_TOP - PAD_BOTTOM);
      const y1 = PAD_TOP + rnd() * (height - PAD_TOP - PAD_BOTTOM);
      body.setPosition(fromLeft ? -30 : width + 30, y0).setVisible(true);
      this.tweens.add({
        targets: body,
        x: fromLeft ? width + 30 : -30,
        y: y1,
        duration: 7000 + rnd() * 4000,
        ease: "Sine.easeInOut",
        onComplete: () => {
          body.setVisible(false);
          this.time.delayedCall(4000 + rnd() * 8000, fly);
        },
      });
      this.tweens.add({ targets: body, y: "+=18", duration: 600, yoyo: true, repeat: 12, ease: "Sine.easeInOut" });
    };
    body.setVisible(false);
    this.time.delayedCall(1500 + rnd() * 3000, fly);
  }

  private dust(x: number, y: number): void {
    if (this.reducedMotion || !this.layer) return;
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(x + (Math.random() - 0.5) * 18, y + 6, 4 + Math.random() * 3, 0xffffff, 0.55).setDepth(y + 1.5);
      this.layer.add(dot);
      this.tweens.add({ targets: dot, alpha: 0, scale: 0.2, y: dot.y + 6, duration: 420, onComplete: () => dot.destroy() });
    }
  }

  private harvest(p: Point): void {
    const key = pointKey(p);
    const sprite = this.padi.get(key);
    if (!sprite || this.harvested.has(key)) return;
    this.harvested.add(key);
    sprite.sway?.stop();
    sprite.sway = null;
    sprite.image.setTexture("padi-stub").setAngle(0).setDisplaySize(TW * 0.7, TW * 0.7);
    this.showEmote("padi", 600);
    const c = this.project(p);
    const label = this.add
      .text(c.x, c.y - TH * 0.8, "+1 padi", {
        fontFamily: "Fredoka, 'Baloo 2', sans-serif",
        fontSize: "28px",
        fontStyle: "700",
        color: "#ffffff",
        backgroundColor: "#d99a0b",
        padding: { x: 12, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(100001);
    this.layer?.add(label);
    this.tweens.add({ targets: label, y: c.y - TH * 1.5, alpha: 0, duration: 850, ease: "Cubic.easeOut", onComplete: () => label.destroy() });
  }

  private flashTile(p: Point): void {
    if (!this.level || tileAt(this.level, p) === null || !this.layer) return;
    const c = this.project(p);
    const g = this.add.graphics().setDepth(c.y + 0.4);
    g.fillStyle(C.danger, 0.55);
    g.fillPoints([{ x: c.x, y: c.y - TH / 2 }, { x: c.x + TW / 2, y: c.y }, { x: c.x, y: c.y + TH / 2 }, { x: c.x - TW / 2, y: c.y }], true);
    this.layer.add(g);
    this.tweens.add({ targets: g, alpha: 0, duration: 220, yoyo: true, repeat: 1, onComplete: () => g.destroy() });
  }

  private sparkle(x: number, y: number): void {
    if (!this.layer) return;
    const colors = [0xffc93c, 0xffffff, 0xe3ac1b, 0x5f9ce4];
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const dot = this.add.circle(x, y, 7 + (i % 3) * 2, colors[i % colors.length]).setDepth(100000);
      this.layer.add(dot);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * TW * 0.8,
        y: y + Math.sin(angle) * TH * 0.9,
        alpha: 0,
        scale: 0.3,
        duration: 900,
        ease: "Cubic.easeOut",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private addSway(img: Phaser.GameObjects.Image, seed: number): Phaser.Tweens.Tween | null {
    if (this.reducedMotion) return null;
    img.setAngle(-3);
    return this.tweens.add({ targets: img, angle: 3, duration: 1600, ease: "Sine.easeInOut", yoyo: true, repeat: -1, delay: (seed * 230) % 1600 });
  }

  private addWaterGlint(x: number, y: number, seed: number): void {
    if (!this.layer) return;
    const glint = this.add.ellipse(x - TW * 0.15, y - TH * 0.12, 34, 7, 0xffffff, 0.5).setDepth(y + 0.2);
    this.layer.add(glint);
    if (this.reducedMotion) return;
    this.tweens.add({
      targets: glint,
      x: x + TW * 0.12,
      y: y + TH * 0.1,
      alpha: 0.15,
      duration: 2600 + (seed % 4) * 300,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: (seed * 310) % 2000,
    });
  }
}
