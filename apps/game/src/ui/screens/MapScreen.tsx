import { useEffect, useState } from "react";
import { sfx } from "../../audio/sound";
import { t } from "../../copy/id";
import { isUnlocked, LEVELS, nextPlayableIndex, REGION_NAME, totalStars, useGame } from "../../state/store";
import rangkiangUrl from "../../assets/sprites/rangkiang.svg";
import { Icon, Star, Stars } from "../icons";
import { Scenery } from "../Scenery";

/** Posisi titik level di peta, dalam persen (mendatar dan tegak). */
const WIDE = { nodes: [[10, 74], [27, 48], [43, 70], [59, 42], [74, 64], [86, 30]], goal: [95, 16], ratio: 16 / 9 };
const TALL = { nodes: [[28, 88], [70, 75], [32, 61], [70, 47], [30, 33], [68, 19]], goal: [34, 6], ratio: 9 / 14 };

function useTall() {
  const get = () => window.innerHeight > window.innerWidth * 1.05;
  const [tall, setTall] = useState(get);
  useEffect(() => {
    const on = () => setTall(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return tall;
}

export function MapScreen() {
  const progress = useGame((s) => s.progress);
  const settings = useGame((s) => s.settings);
  const tall = useTall();
  const layout = tall ? TALL : WIDE;
  const vw = 1000;
  const vh = vw / layout.ratio;
  const sx = vw / 100;
  const sy = vh / 100;
  const state = { progress, settings };
  const next = nextPlayableIndex(state);

  const pts = [...layout.nodes, layout.goal] as [number, number][];
  let d = `M${pts[0]![0] * sx} ${pts[0]![1] * sy}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    if (tall) {
      const my = ((y0 + y1) / 2) * sy;
      d += ` C${x0 * sx} ${my} ${x1 * sx} ${my} ${x1 * sx} ${y1 * sy}`;
    } else {
      const mx = ((x0 + x1) / 2) * sx;
      d += ` C${mx} ${y0 * sy} ${mx} ${y1 * sy} ${x1 * sx} ${y1 * sy}`;
    }
  }

  return (
    <section className="screen" aria-label="Peta level">
      <Scenery />
      <header className="hud">
        <button type="button" className="round" aria-label="Kembali ke layar judul" onClick={() => useGame.getState().goTo("title")}>
          {Icon.home()}
        </button>
        <div className="hud-title">
          <b>{REGION_NAME}</b>
          <small>{t.regionLabel}</small>
        </div>
        <span className="pill">
          <Star on />
          {totalStars(state)} / {LEVELS.length * 3}
        </span>
        <button type="button" className="round" aria-label={t.teacherPanel} onClick={() => useGame.getState().setTeacherOpen(true)}>
          {Icon.gear()}
        </button>
      </header>
      <div className="map-wrap">
        <div className="mapbox" style={{ aspectRatio: tall ? "9 / 14" : "16 / 9", width: tall ? "min(100%, 460px)" : "min(100%, 980px)" }}>
          <svg className="path" viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={d} fill="none" stroke="#c9b37a" strokeWidth="26" strokeLinecap="round" />
            <path d={d} fill="none" stroke="#efe2b5" strokeWidth="16" strokeLinecap="round" strokeDasharray="2 26" />
          </svg>
          <img className="map-goal" src={rangkiangUrl} alt="" style={{ left: `${layout.goal[0]}%`, top: `${layout.goal[1]}%` }} />
          {LEVELS.map((level, i) => {
            const open = isUnlocked(state, i);
            const stars = progress.stars[level.id] ?? 0;
            const [x, y] = layout.nodes[i] ?? [50, 50];
            return (
              <button
                key={level.id}
                type="button"
                className={`node ${i === next && open ? "is-next" : ""}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                disabled={!open}
                aria-label={`Level ${level.order}: ${level.name}${open ? "" : `, ${t.locked}`}`}
                onClick={() => {
                  sfx.click();
                  useGame.getState().openLevel(i);
                }}
              >
                <span className="disc">{open ? level.order : Icon.lock()}</span>
                <span className="nm">{level.name}</span>
                <Stars count={stars} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
