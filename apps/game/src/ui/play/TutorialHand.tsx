import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { t } from "../../copy/id";
import { tutorialStep, useGame } from "../../state/store";
import { useDrag } from "../dnd/drag";

interface Pose {
  mode: "drag" | "tap";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const HALF = 27;
const centerOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
};

/** Tangan penunjuk yang memandu anak di level pertama. */
export function TutorialHand() {
  const step = useGame(tutorialStep);
  const count = useGame((s) => s.program.length);
  const dragging = useDrag((s) => s.payload !== null);
  const [pose, setPose] = useState<Pose | null>(null);

  // Bima mengucapkan instruksi saat anak pertama kali mencapai tahap baru.
  // Tahap yang sudah pernah dicapai tidak diulang, supaya umpan balik
  // setelah program dijalankan (mis. "aku menabrak") tidak tertimpa.
  const reached = useRef(0);
  const levelIndex = useGame((s) => s.levelIndex);
  useEffect(() => {
    reached.current = 0;
  }, [levelIndex]);
  useEffect(() => {
    if (step <= reached.current) return;
    reached.current = step;
    if (step === 2) useGame.getState().talk("info", t.tutorialMore, { speak: true, mood: "happy" });
    if (step === 3) useGame.getState().talk("info", t.tutorialRun, { speak: true, mood: "happy" });
  }, [step]);

  useLayoutEffect(() => {
    if (step === 0) {
      setPose(null);
      return;
    }
    const measure = () => {
      if (step === 3) {
        const run = document.querySelector("[data-run]");
        if (!run) return setPose(null);
        const c = centerOf(run);
        setPose({ mode: "tap", x1: c.x, y1: c.y, x2: c.x, y2: c.y });
        return;
      }
      const src = document.querySelector('[data-card-type="maju"]');
      const dst = document.querySelector('[data-list-key="main"]');
      if (!src || !dst) return setPose(null);
      const a = centerOf(src);
      const b = dst.getBoundingClientRect();
      setPose({ mode: "drag", x1: a.x, y1: a.y, x2: b.left + Math.min(b.width - 40, 50 + count * 70), y2: b.top + 42 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [step, count]);

  if (!pose || dragging) return null;
  const style = {
    "--x1": `${pose.x1 - HALF + 12}px`,
    "--y1": `${pose.y1 - HALF + 16}px`,
    "--x2": `${pose.x2 - HALF + 12}px`,
    "--y2": `${pose.y2 - HALF + 16}px`,
  } as CSSProperties;

  return (
    <svg className={`hand ${pose.mode}`} style={style} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M18 6a3.5 3.5 0 0 1 7 0v13l1.5-.8a3.5 3.5 0 0 1 4 .5l1.2-.4a3.5 3.5 0 0 1 4.3 2l.6-.1A3.5 3.5 0 0 1 41 23.6V33c0 7-5 12-12 12h-3.5c-3.6 0-6.8-1.9-8.6-5L9.6 28.6a3.3 3.3 0 0 1 5.4-3.8L18 28.5z"
        fill="#fff"
        stroke="#1c2a1f"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
