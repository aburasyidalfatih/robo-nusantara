/**
 * Papan sawah yang digambar dengan Phaser.
 *
 * Scene ini hanya mengurus tampilan: membangun petak dari data level,
 * lalu memutar animasi untuk setiap langkah simulasi. Logika permainan
 * tetap di @robo/engine, sehingga papan bisa diganti (mis. 3D di jenjang 4)
 * tanpa mengubah aturan main.
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

export type Emote = "heart" | "dizzy" | "question" | "padi";

/** Ukuran satu petak dalam piksel dunia game (ditampilkan diperkecil sesuai layar). */
const CELL = 128;
const PAD = 14;
const SHADOW = 12;
const INSET = 4;

const COLORS = {
  pematang: 0xa8915a,
  pematangDark: 0x7f6a3b,
  pematangShadow: 0xc4b27d,
  danger: 0xe2455a,
};

/** Warna tubuh Bima di sprite tampak atas, diganti sesuai avatar anak. */
const BASE_BODY = { dark: "#2463b5", light: "#5f9ce4" };
const AVATAR_BODY: Record<AvatarColor, { dark: string; light: string }> = {
  biru: { dark: "#2463b5", light: "#5f9ce4" },
  hijau: { dark: "#2b8452", light: "#5fbf86" },
  jingga: { dark: "#c4531a", light: "#ef8a4c" },
  ungu: { dark: "#7b3fa8", light: "#aa75d6" },
};

export function boardPixelSize(level: Pick<Level, "map">): { width: number; height: number } {
  const { cols, rows } = gridSize(level);
  return { width: cols * CELL + PAD * 2, height: rows * CELL + PAD * 2 + SHADOW };
}

const center = (p: Point) => ({ x: PAD + p.x * CELL + CELL / 2, y: PAD + p.y * CELL + CELL / 2 });

/** Pembangkit angka acak deterministik, supaya dekorasi tiap level selalu sama. */
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

export class BoardScene extends Phaser.Scene {
  readonly ready: Promise<void>;
  private resolveReady!: () => void;
  private created = false;
  private pending: { level: Level; avatar: AvatarColor } | null = null;
  private level: Level | null = null;
  private avatar: AvatarColor = "biru";
  private reducedMotion = false;

  private layer: Phaser.GameObjects.Container | null = null;
  private ambient: Phaser.GameObjects.Container | null = null;
  private robot: Phaser.GameObjects.Image | null = null;
  private heading = 0;
  private emote: Phaser.GameObjects.Image | null = null;
  private padi = new Map<string, PadiSprite>();
  private harvested = new Set<string>();

  constructor() {
    super("board");
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
    this.makeTileTextures();

    // Sprite Bima dibuat per warna avatar dari satu SVG sumber.
    const src = this.cache.text.get("bima-src") as string | undefined;
    for (const [name, body] of Object.entries(AVATAR_BODY) as [AvatarColor, { dark: string; light: string }][]) {
      const svg = (src ?? "").split(BASE_BODY.dark).join(body.dark).split(BASE_BODY.light).join(body.light);
      const uri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      if (src) this.load.svg(`bima-${name}`, uri, { width: 256, height: 256 });
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.created = true;
      this.resolveReady();
      if (this.pending) this.setup(this.pending.level, this.pending.avatar);
    });
    this.load.start();
  }

  override update(): void {
    if (this.emote && this.robot) this.emote.setPosition(this.robot.x, this.robot.y - CELL * 0.62);
  }

  /** Bangun ulang papan untuk level baru. Aman dipanggil sebelum scene siap. */
  setup(level: Level, avatar: AvatarColor = "biru"): void {
    if (!this.created) {
      this.pending = { level, avatar };
      return;
    }
    this.pending = null;
    this.level = level;
    this.avatar = avatar;
    const { width, height } = boardPixelSize(level);
    this.scale.setGameSize(width, height);
    this.cameras.main.setSize(width, height);

    this.tweens.killAll();
    this.layer?.destroy(true);
    this.ambient?.destroy(true);
    this.padi.clear();
    this.harvested.clear();
    this.emote = null;

    const layer = this.add.container(0, 0);
    this.layer = layer;
    const rnd = seeded(level.id);

    const base = this.add.graphics();
    base.fillStyle(COLORS.pematangShadow, 1).fillRoundedRect(0, SHADOW, width, height - SHADOW, 24);
    base.fillStyle(COLORS.pematangDark, 1).fillRoundedRect(0, SHADOW / 2, width, height - SHADOW, 24);
    base.fillStyle(COLORS.pematang, 1).fillRoundedRect(0, 0, width, height - SHADOW, 24);
    layer.add(base);

    const water: Point[] = [];
    level.map.forEach((row, y) => {
      [...row].forEach((code, x) => {
        const c = center({ x, y });
        const variant = Math.floor(rnd() * 3);
        const ground = code === "~" ? "tile-air" : `tile-sawah-${variant}`;
        layer.add(this.add.image(c.x, c.y, ground));
        if (code === "~") {
          this.addWaterGlint(layer, c.x, c.y, x + y);
          water.push({ x, y });
        }
        if (code === "." || code === "B") this.decorate(layer, c, rnd);
        if (code === "#") {
          const tree = this.add.image(c.x, c.y + CELL * 0.36, "pohon").setOrigin(0.5, 0.86).setDisplaySize(CELL * 0.9, CELL * 0.9);
          layer.add(tree);
          if (!this.reducedMotion) {
            tree.setAngle(-1.5);
            this.tweens.add({ targets: tree, angle: 1.5, duration: 2600 + rnd() * 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: rnd() * 1500 });
          }
        }
        if (code === "L") layer.add(this.add.image(c.x, c.y, "rangkiang").setDisplaySize(CELL * 0.9, CELL * 0.9));
        if (code === "p") {
          const img = this.add
            .image(c.x, c.y + CELL * 0.38, "padi")
            .setOrigin(0.5, 0.92)
            .setDisplaySize(CELL * 0.86, CELL * 0.86);
          layer.add(img);
          this.padi.set(pointKey({ x, y }), { image: img, sway: this.addSway(img, x + y) });
        }
      });
    });

    const robot = this.add.image(0, 0, `bima-${this.avatar}`).setDisplaySize(CELL * 0.82, CELL * 0.82);
    layer.add(robot);
    this.robot = robot;
    this.resetRobot();

    this.ambient = this.add.container(0, 0);
    this.addDuck(water, rnd);
    this.addButterfly(width, height, rnd);
  }

  /** Kembalikan Bima ke titik awal dan pulihkan padi yang sudah dipanen. */
  resetRobot(): void {
    const level = this.level;
    const robot = this.robot;
    if (!level || !robot) return;
    this.tweens.killTweensOf(robot);
    const start = center(startPoint(level));
    this.heading = directionAngle(level.startDir);
    robot.setPosition(start.x, start.y).setAngle(this.heading).setDisplaySize(CELL * 0.82, CELL * 0.82);
    for (const key of this.harvested) {
      const p = this.padi.get(key);
      if (!p) continue;
      p.image.setTexture("padi").setAngle(0).setAlpha(1).setDisplaySize(CELL * 0.86, CELL * 0.86);
      p.sway = this.addSway(p.image, Number(key.split(",")[0]) + Number(key.split(",")[1]));
    }
    this.harvested.clear();
    this.clearEmote();
  }

  /** Animasikan satu langkah simulasi. Selesai ketika animasinya selesai. */
  playStep(step: SimStep, durationMs: number): Promise<void> {
    const robot = this.robot;
    if (!robot) return Promise.resolve();
    const dur = this.reducedMotion ? Math.min(durationMs, 120) : durationMs;

    if (step.kind === "turn") {
      const from = this.heading;
      this.heading += step.delta * 90;
      return this.tween({ targets: robot, angle: { from, to: this.heading }, duration: dur * 0.85, ease: "Back.easeOut" });
    }

    if (step.kind === "move") {
      const to = center(step.at);
      if (step.harvested) {
        const where = step.harvested;
        this.time.delayedCall(dur * 0.55, () => this.harvest(where));
      }
      this.dust(robot.x, robot.y);
      return this.tween({ targets: robot, x: to.x, y: to.y, duration: dur, ease: "Sine.easeInOut" });
    }

    // Menabrak: maju sedikit, terpental kembali, lalu bergetar.
    const from = center(step.at);
    const blocked = center(step.blockedAt);
    const nudge = { x: from.x + (blocked.x - from.x) * 0.3, y: from.y + (blocked.y - from.y) * 0.3 };
    this.flashTile(step.blockedAt);
    this.showEmote("dizzy");
    this.cameras.main.shake(180, 0.004);
    return this.tween({ targets: robot, x: nudge.x, y: nudge.y, duration: dur * 0.35, ease: "Quad.easeOut", yoyo: true }).then(() =>
      this.tween({ targets: robot, x: from.x + 6, duration: 50, yoyo: true, repeat: 2 }).then(() => {
        robot.setPosition(from.x, from.y);
      }),
    );
  }

  /** Perayaan saat level selesai. */
  celebrate(): Promise<void> {
    const robot = this.robot;
    if (!robot) return Promise.resolve();
    this.showEmote("heart", 1600);
    this.sparkle(robot.x, robot.y);
    if (this.reducedMotion) return Promise.resolve();
    const baseScale = robot.scaleX;
    const spin = this.tween({ targets: robot, angle: `+=360`, duration: 900, ease: "Cubic.easeInOut" });
    void this.tween({ targets: robot, scaleX: baseScale * 1.18, scaleY: baseScale * 1.18, duration: 450, yoyo: true, ease: "Sine.easeInOut" });
    return spin.then(() => {
      this.heading += 360;
    });
  }

  showEmote(kind: Emote, holdMs = 900): void {
    if (!this.robot || !this.layer) return;
    this.clearEmote();
    const img = this.add.image(this.robot.x, this.robot.y - CELL * 0.62, `emote-${kind}`).setDisplaySize(CELL * 0.48, CELL * 0.48);
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

  /* ---------- bantuan internal ---------- */

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

  /** Hiasan kecil di petak sawah kosong: rumput, bunga, batu. */
  private decorate(layer: Phaser.GameObjects.Container, c: { x: number; y: number }, rnd: () => number): void {
    const roll = rnd();
    if (roll > 0.42) return;
    const key = roll < 0.2 ? "rumput" : roll < 0.34 ? "bunga" : "batu";
    const size = key === "batu" ? CELL * 0.22 : CELL * 0.26;
    const ox = (rnd() - 0.5) * CELL * 0.5;
    const oy = (rnd() - 0.5) * CELL * 0.5;
    const img = this.add.image(c.x + ox, c.y + oy, key).setDisplaySize(size, size).setAlpha(0.95);
    layer.add(img);
    if (key === "rumput" && !this.reducedMotion) {
      img.setOrigin(0.5, 0.95).setAngle(-6);
      this.tweens.add({ targets: img, angle: 6, duration: 1800 + rnd() * 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: rnd() * 1200 });
    }
  }

  /** Seekor bebek berenang bolak-balik di salah satu petak air. */
  private addDuck(water: Point[], rnd: () => number): void {
    if (!water.length || !this.ambient) return;
    const spot = water[Math.floor(rnd() * water.length)] as Point;
    const c = center(spot);
    const duck = this.add.image(c.x - CELL * 0.16, c.y + CELL * 0.08, "bebek").setDisplaySize(CELL * 0.42, CELL * 0.42);
    this.ambient.add(duck);
    if (this.reducedMotion) return;
    this.tweens.add({
      targets: duck,
      x: c.x + CELL * 0.16,
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onYoyo: () => duck.setFlipX(true),
      onRepeat: () => duck.setFlipX(false),
    });
    this.tweens.add({ targets: duck, y: c.y + CELL * 0.11, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  /** Kupu-kupu yang sesekali melintasi papan. */
  private addButterfly(width: number, height: number, rnd: () => number): void {
    if (this.reducedMotion || !this.ambient) return;
    const body = this.add.container(0, 0);
    const left = this.add.image(-2, 0, "sayap").setOrigin(1, 0.5).setDisplaySize(CELL * 0.14, CELL * 0.19);
    const right = this.add.image(2, 0, "sayap").setOrigin(1, 0.5).setDisplaySize(CELL * 0.14, CELL * 0.19).setFlipX(true);
    right.setOrigin(0, 0.5);
    body.add([left, right, this.add.ellipse(0, 0, 4, 18, 0x2b1d1a)]);
    this.ambient.add(body);
    const sx = left.scaleX;
    this.tweens.add({ targets: [left, right], scaleX: sx * 0.25, duration: 140, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const fly = () => {
      if (!body.scene) return;
      const fromLeft = rnd() > 0.5;
      const y0 = PAD + rnd() * (height - SHADOW - PAD * 2);
      const y1 = PAD + rnd() * (height - SHADOW - PAD * 2);
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
      this.tweens.add({ targets: body, y: `+=${18}`, duration: 600, yoyo: true, repeat: 12, ease: "Sine.easeInOut" });
    };
    body.setVisible(false);
    this.time.delayedCall(1500 + rnd() * 3000, fly);
  }

  private dust(x: number, y: number): void {
    if (this.reducedMotion || !this.layer) return;
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(x + (Math.random() - 0.5) * 20, y + CELL * 0.3, 5 + Math.random() * 4, 0xffffff, 0.55);
      this.layer.add(dot);
      this.tweens.add({ targets: dot, alpha: 0, scale: 0.2, y: dot.y + 10, duration: 420, onComplete: () => dot.destroy() });
    }
  }

  private harvest(p: Point): void {
    const key = pointKey(p);
    const sprite = this.padi.get(key);
    if (!sprite || this.harvested.has(key)) return;
    this.harvested.add(key);
    sprite.sway?.stop();
    sprite.sway = null;
    sprite.image.setTexture("padi-stub").setAngle(0).setDisplaySize(CELL * 0.86, CELL * 0.86);
    this.showEmote("padi", 600);

    const c = center(p);
    const label = this.add
      .text(c.x, c.y - CELL * 0.1, "+1 padi", {
        fontFamily: "Fredoka, 'Baloo 2', sans-serif",
        fontSize: "30px",
        fontStyle: "700",
        color: "#ffffff",
        backgroundColor: "#d99a0b",
        padding: { x: 12, y: 3 },
      })
      .setOrigin(0.5);
    this.layer?.add(label);
    this.tweens.add({ targets: label, y: c.y - CELL * 0.55, alpha: 0, duration: 850, ease: "Cubic.easeOut", onComplete: () => label.destroy() });
  }

  private flashTile(p: Point): void {
    if (!this.level || tileAt(this.level, p) === null || !this.layer) return;
    const c = center(p);
    const rect = this.add.rectangle(c.x, c.y, CELL - INSET * 2, CELL - INSET * 2, COLORS.danger, 0.55);
    this.layer.add(rect);
    this.tweens.add({ targets: rect, alpha: 0, duration: 220, yoyo: true, repeat: 1, onComplete: () => rect.destroy() });
  }

  private sparkle(x: number, y: number): void {
    if (!this.layer) return;
    const colors = [0xffc93c, 0xffffff, 0xe3ac1b, 0x5f9ce4];
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const dot = this.add.circle(x, y, 7 + (i % 3) * 2, colors[i % colors.length]);
      this.layer.add(dot);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * CELL * 0.95,
        y: y + Math.sin(angle) * CELL * 0.95,
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

  private addWaterGlint(layer: Phaser.GameObjects.Container, x: number, y: number, seed: number): void {
    const glint = this.add.image(x - CELL * 0.18, y - CELL * 0.16, "water-glint").setAlpha(0.55);
    layer.add(glint);
    if (this.reducedMotion) return;
    this.tweens.add({
      targets: glint,
      x: x + CELL * 0.12,
      y: y + CELL * 0.1,
      alpha: 0.15,
      duration: 2600 + (seed % 4) * 300,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: (seed * 310) % 2000,
    });
  }

  /** Tekstur petak dibuat sekali dengan Canvas 2D (sudut membulat + pola). */
  private makeTileTextures(): void {
    const size = CELL - INSET * 2;
    const rounded = (ctx: CanvasRenderingContext2D, r: number) => {
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(size, 0, size, size, r);
      ctx.arcTo(size, size, 0, size, r);
      ctx.arcTo(0, size, 0, 0, r);
      ctx.arcTo(0, 0, size, 0, r);
      ctx.closePath();
    };

    // Tiga variasi sawah: fase garis dan kecerahan sedikit berbeda agar tidak monoton.
    const variants = [
      { base: "#6aa03b", stripe: "#7db349", phase: 0 },
      { base: "#689d3a", stripe: "#7fb64c", phase: 6 },
      { base: "#6ca43e", stripe: "#7bb147", phase: 12 },
    ];
    variants.forEach((v, i) => {
      const key = `tile-sawah-${i}`;
      if (this.textures.exists(key)) return;
      const tex = this.textures.createCanvas(key, size, size);
      const ctx = tex?.getContext();
      if (!tex || !ctx) return;
      rounded(ctx, 16);
      ctx.save();
      ctx.clip();
      ctx.fillStyle = v.base;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = v.stripe;
      for (let x = -18 + v.phase; x < size; x += 18) ctx.fillRect(x, 0, 13, size);
      // guratan tanah tipis supaya ada tekstur
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 2;
      for (let y = 14; y < size; y += 22) {
        ctx.beginPath();
        ctx.moveTo(4, y);
        ctx.quadraticCurveTo(size / 2, y + 4, size - 4, y);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(0, 0, size, 5);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, size - 5, size, 5);
      ctx.restore();
      tex.refresh();
    });

    if (!this.textures.exists("tile-air")) {
      const tex = this.textures.createCanvas("tile-air", size, size);
      const ctx = tex?.getContext();
      if (tex && ctx) {
        rounded(ctx, 16);
        ctx.save();
        ctx.clip();
        const grad = ctx.createLinearGradient(0, 0, 0, size);
        grad.addColorStop(0, "#7dc0d1");
        grad.addColorStop(1, "#4c9cb2");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 2;
        for (let y = 24; y < size; y += 28) {
          ctx.beginPath();
          ctx.moveTo(10, y);
          ctx.bezierCurveTo(size * 0.3, y - 6, size * 0.6, y + 6, size - 10, y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(0, 0, size, 6);
        ctx.restore();
        tex.refresh();
      }
    }

    if (!this.textures.exists("water-glint")) {
      const w = 60;
      const h = 16;
      const tex = this.textures.createCanvas("water-glint", w, h);
      const ctx = tex?.getContext();
      if (tex && ctx) {
        ctx.save();
        ctx.scale(1, h / w);
        const grad = ctx.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2);
        grad.addColorStop(0, "rgba(255,255,255,0.9)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        tex.refresh();
      }
    }
  }
}
