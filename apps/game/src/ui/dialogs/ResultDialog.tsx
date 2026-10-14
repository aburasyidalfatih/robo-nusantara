import { useEffect, useRef } from "react";
import { speak } from "../../audio/narrator";
import { t } from "../../copy/id";
import { resetBoard } from "../../game/runner";
import { LEVELS, useGame } from "../../state/store";
import { BimaFace } from "../Bima";
import { Star } from "../icons";

/** Layar hasil: bintang, kriteria, dan tugas Jembatan Dunia Nyata. */
export function ResultDialog() {
  const result = useGame((s) => s.result);
  const levelIndex = useGame((s) => s.levelIndex);
  const narration = useGame((s) => s.settings.narration);
  const primary = useRef<HTMLButtonElement>(null);
  const level = LEVELS[levelIndex];

  useEffect(() => {
    if (!result) return;
    primary.current?.focus();
    if (narration) speak(t.resultSpeech(t.resultTitle(result.score.stars), result.score.stars));
  }, [result, narration]);

  if (!result || !level) return null;
  const { score } = result;
  const hasNext = levelIndex + 1 < LEVELS.length;
  const criteria = [
    { on: score.criteria.completed, text: t.critCompleted },
    { on: score.criteria.efficient, text: t.critEfficient(score.cards, score.target) },
    { on: score.criteria.independent, text: t.critIndependent },
  ];

  const game = useGame.getState;
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && game().closeResult()}>
      <div className="sheet result" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <BimaFace mood="happy" className="result-bima" />
        <p className="eyebrow">
          Level {level.order} · {level.name}
        </p>
        <h2 id="result-title">{t.resultTitle(score.stars)}</h2>
        <div className="result-stars">
          {criteria.map((c, i) => (
            <span key={i} className={c.on ? "pop" : ""} style={{ animationDelay: `${i * 0.18}s` }}>
              <Star on={c.on} />
            </span>
          ))}
        </div>
        <ul className="criteria">
          {criteria.map((c, i) => (
            <li key={i} className={c.on ? "" : "off"}>
              <Star on={c.on} />
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
        <div className="bridge">
          <h3>{t.bridgeTitle}</h3>
          <p>{level.bridge}</p>
        </div>
        <div className="result-actions">
          {score.stars < 3 && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                game().retryLevel();
                resetBoard();
                game().talk("info", t.retryPrompt, { speak: true });
              }}
            >
              {t.retry}
            </button>
          )}
          {hasNext ? (
            <button ref={primary} type="button" className="btn primary" onClick={() => game().openLevel(levelIndex + 1)}>
              {t.nextLevel}
            </button>
          ) : (
            <button
              ref={primary}
              type="button"
              className="btn primary"
              onClick={() => {
                game().closeResult();
                game().goTo("map");
              }}
            >
              {t.backToMap}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
