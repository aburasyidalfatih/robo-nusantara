import { useEffect, useRef, useState } from "react";
import { music } from "../../audio/sound";
import { t } from "../../copy/id";
import type { Settings } from "../../state/persistence";
import { useGame } from "../../state/store";

type ToggleKey = "narration" | "music" | "sfx" | "unlockAll";

/** Pengaturan untuk guru dan orang tua, terpisah dari kontrol anak. */
export function TeacherPanel() {
  const open = useGame((s) => s.teacherOpen);
  const settings = useGame((s) => s.settings);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else setConfirmWipe(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && useGame.getState().setTeacherOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  const update = (patch: Partial<Settings>) => useGame.getState().updateSettings(patch);
  const close = () => useGame.getState().setTeacherOpen(false);

  const toggles: { key: ToggleKey; label: string; note?: string }[] = [
    { key: "narration", label: t.narration, note: t.narrationNote },
    { key: "music", label: t.music },
    { key: "sfx", label: t.sfx },
    { key: "unlockAll", label: t.unlockAll, note: t.unlockAllNote },
  ];

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="sheet teacher" role="dialog" aria-modal="true" aria-labelledby="teacher-title">
        <p className="eyebrow">{t.teacherEyebrow}</p>
        <h2 id="teacher-title">{t.teacherPanel}</h2>
        <p className="intro">{t.teacherIntro}</p>

        <div className="row">
          <span>{t.speed}</span>
          <span className="seg" role="group" aria-label={t.speed}>
            {t.speedOptions.map((o) => (
              <button key={o.value} type="button" aria-pressed={settings.speedMs === o.value} onClick={() => update({ speedMs: o.value })}>
                {o.label}
              </button>
            ))}
          </span>
        </div>

        <div className="row">
          <span>
            {t.boardStyle}
            <small>{t.boardStyleNote}</small>
          </span>
          <span className="seg" role="group" aria-label={t.boardStyle}>
            <button type="button" aria-pressed={settings.boardIso} onClick={() => update({ boardIso: true })}>
              {t.boardIso}
            </button>
            <button type="button" aria-pressed={!settings.boardIso} onClick={() => update({ boardIso: false })}>
              {t.boardFlat}
            </button>
          </span>
        </div>

        {toggles.map((row) => (
          <div className="row" key={row.key}>
            <span>
              {row.label}
              {row.note && <small>{row.note}</small>}
            </span>
            <button
              type="button"
              role="switch"
              className="switch"
              aria-checked={settings[row.key]}
              aria-label={row.label}
              onClick={() => {
                const value = !settings[row.key];
                update({ [row.key]: value });
                if (row.key === "music") value ? music.start() : music.stop();
              }}
            />
          </div>
        ))}

        <div className="row">
          <span>
            {t.wipe}
            <small>{t.wipeNote}</small>
          </span>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (!confirmWipe) return setConfirmWipe(true);
              useGame.getState().wipeProgress();
              setConfirmWipe(false);
            }}
          >
            {confirmWipe ? t.wipeConfirm : t.wipeButton}
          </button>
        </div>

        <button ref={closeRef} type="button" className="btn primary sheet-close" onClick={close}>
          {t.done}
        </button>
      </div>
    </div>
  );
}
