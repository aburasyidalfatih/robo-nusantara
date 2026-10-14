import { useEffect, useRef } from "react";
import { useGame } from "../state/store";

const COLORS = ["#2463b5", "#e3ac1b", "#2b8452", "#c4531a", "#7b3fa8", "#e2455a"];

/** Hujan konfeti saat level selesai. Dilewati bila pengguna memilih gerak minimal. */
export function Confetti() {
  const nonce = useGame((s) => s.celebrateNonce);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!nonce || !canvas) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const g = canvas.getContext("2d");
    if (!g) return;
    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);
    canvas.hidden = false;
    const parts = Array.from({ length: 140 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.4,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3.5,
      r: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      c: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#e3ac1b",
    }));
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      g.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.r += p.vr;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.r);
        g.fillStyle = p.c;
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        g.restore();
      }
      if (now - t0 < 2800) raf = requestAnimationFrame(frame);
      else {
        g.clearRect(0, 0, W, H);
        canvas.hidden = true;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      g.clearRect(0, 0, W, H);
      canvas.hidden = true;
    };
  }, [nonce]);

  return <canvas ref={ref} className="confetti" hidden aria-hidden="true" />;
}
