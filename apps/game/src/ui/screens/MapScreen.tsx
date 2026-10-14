import { useEffect, useState, type CSSProperties } from "react";
import { sfx } from "../../audio/sound";
import { t } from "../../copy/id";
import { badgeCount, isUnlocked, LEVELS, nextPlayableIndex, REGION_NAME, totalStars, useGame } from "../../state/store";
import rangkiangUrl from "../../assets/sprites/rangkiang.svg";
import { BimaFace } from "../Bima";
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

/** Dekorasi desa di sekitar jalur (persen), berbeda untuk mendatar dan tegak. */
const DECOR_WIDE = [
  { kind: "rumah", x: 20, y: 86, s: 1.1 },
  { kind: "rumah", x: 50, y: 90, s: 0.9 },
  { kind: "sawah", x: 36, y: 28, s: 1 },
  { kind: "sawah", x: 68, y: 86, s: 1 },
  { kind: "sawah", x: 8, y: 32, s: 0.8 },
  { kind: "pohon", x: 15, y: 56, s: 0.8 },
  { kind: "pohon", x: 52, y: 58, s: 0.9 },
  { kind: "pohon", x: 80, y: 48, s: 0.8 },
  { kind: "pohon", x: 93, y: 60, s: 1 },
] as const;
const DECOR_TALL = [
  { kind: "rumah", x: 12, y: 78, s: 0.9 },
  { kind: "rumah", x: 86, y: 90, s: 0.9 },
  { kind: "sawah", x: 14, y: 46, s: 0.8 },
  { kind: "sawah", x: 84, y: 60, s: 0.8 },
  { kind: "pohon", x: 50, y: 70, s: 0.8 },
  { kind: "pohon", x: 50, y: 40, s: 0.8 },
  { kind: "pohon", x: 12, y: 20, s: 0.8 },
] as const;

export function MapScreen() {
  const progress = useGame((s) => s.progress);
  const settings = useGame((s) => s.settings);
  const profile = useGame((s) => s.profile);
  const tall = useTall();
  const layout = tall ? TALL : WIDE;
  const vw = 1000;
  const vh = vw / layout.ratio;
  const sx = vw / 100;
  const sy = vh / 100;
  const state = { progress, settings };
  const next = nextPlayableIndex(state);
  const badges = badgeCount(state);

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
  const decor = tall ? DECOR_TALL : DECOR_WIDE;
  const nextPos = layout.nodes[next] ?? [50, 50];

  return (
    <section className="screen" aria-label="Peta level">
      <Scenery />
      <header className="hud">
        <button type="button" className="round" aria-label="Kembali ke layar judul" onClick={() => useGame.getState().goTo("title")}>
          {Icon.home()}
        </button>
        <div className="hud-title">
          <b>{REGION_NAME}</b>
          <small>{profile ? `${profile.name} · ${t.regionLabel}` : t.regionLabel}</small>
        </div>
        <span className="pill">
          <Star on />
          {totalStars(state)} / {LEVELS.length * 3}
        </span>
        <button
          type="button"
          className="pill pill-btn"
          aria-label={t.collection}
          onClick={() => {
            sfx.click();
            useGame.getState().goTo("collection");
          }}
        >
          {Icon.badge()}
          {badges.earned} / {badges.total}
        </button>
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
          {decor.map((o, i) => (
            <MapDecor key={i} kind={o.kind} style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.s * 90}px` }} />
          ))}
          <img className="map-goal" src={rangkiangUrl} alt="" style={{ left: `${layout.goal[0]}%`, top: `${layout.goal[1]}%` }} />
          {LEVELS.map((level, i) => {
            const open = isUnlocked(state, i);
            const stars = progress.stars[level.id] ?? 0;
            const [x, y] = layout.nodes[i] ?? [50, 50];
            return (
              <button
                key={level.id}
                type="button"
                className={`node ${i === next && open ? "is-next" : ""} ${stars > 0 ? "is-done" : ""}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                disabled={!open}
                aria-label={`Level ${level.order}: ${level.name}${open ? "" : `, ${t.locked}`}`}
                onClick={() => {
                  sfx.click();
                  useGame.getState().openLevel(i);
                }}
              >
                {stars > 0 && (
                  <svg className="flag" viewBox="0 0 24 32" aria-hidden="true">
                    <path d="M4 2v30" stroke="#5a4328" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M5 3h15l-4 6 4 6H5z" fill="#e2455a" />
                  </svg>
                )}
                <span className="disc">{open ? level.order : Icon.lock()}</span>
                <span className="nm">{level.name}</span>
                <Stars count={stars} />
              </button>
            );
          })}
          <BimaFace mood="happy" avatar={profile?.avatar ?? "biru"} className="map-bima" style={{ left: `${nextPos[0]}%`, top: `${nextPos[1]}%` }} />
        </div>
      </div>
    </section>
  );
}

function MapDecor({ kind, style }: { kind: "rumah" | "sawah" | "pohon" | "sungai"; style: CSSProperties }) {
  return (
    <svg className={`map-decor decor-${kind}`} viewBox="0 0 100 70" aria-hidden="true" style={style}>
      {kind === "rumah" && (
        <g>
          <ellipse cx="50" cy="66" rx="34" ry="4" fill="#000" opacity=".12" />
          <rect x="30" y="48" width="4" height="16" fill="#6b3e1f" />
          <rect x="66" y="48" width="4" height="16" fill="#6b3e1f" />
          <path d="M24 36h52l-4 20H28z" fill="#b5651d" />
          <rect x="44" y="42" width="12" height="14" rx="2" fill="#5a2e10" />
          <path d="M6 10q22 26 44 20q22 6 44-20q-4 26-12 29H18q-8-3-12-29z" fill="#2f2723" />
          <circle cx="6.5" cy="10" r="3" fill="#f1c453" />
          <circle cx="93.5" cy="10" r="3" fill="#f1c453" />
        </g>
      )}
      {kind === "sawah" && (
        <g>
          <path d="M10 60L30 20h40l20 40z" fill="#8cc062" />
          <g stroke="#6aa03b" strokeWidth="2.5" fill="none">
            <path d="M22 50h56M26 42h48M30 34h40M34 27h32" />
          </g>
          <path d="M10 60L30 20h40l20 40z" fill="none" stroke="#a8915a" strokeWidth="3" />
        </g>
      )}
      {kind === "pohon" && (
        <g>
          <ellipse cx="50" cy="66" rx="22" ry="4" fill="#000" opacity=".12" />
          <rect x="46" y="40" width="8" height="24" rx="3" fill="#7a4a24" />
          <circle cx="50" cy="30" r="22" fill="#3e7a2a" />
          <circle cx="40" cy="24" r="12" fill="#4f9134" />
          <circle cx="60" cy="34" r="11" fill="#4f9134" />
          <circle cx="52" cy="18" r="8" fill="#64a842" />
        </g>
      )}
      {kind === "sungai" && (
        <g>
          <path d="M0 40q20-30 50-20t50-20v14q-30 2-50 20T0 54z" fill="#7dc0d1" />
          <path d="M8 44q18-22 44-16t44-14" stroke="#fff" strokeOpacity=".5" strokeWidth="2.5" fill="none" />
        </g>
      )}
    </svg>
  );
}
