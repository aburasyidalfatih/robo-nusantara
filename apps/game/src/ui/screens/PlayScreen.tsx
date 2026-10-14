import { countCards } from "@robo/engine";
import { music, sfx } from "../../audio/sound";
import { PhaserBoard } from "../../board/PhaserBoard";
import { t } from "../../copy/id";
import { stopProgram } from "../../game/runner";
import { currentLevel, useGame } from "../../state/store";
import galatUrl from "../../assets/sprites/kumbang-galat.svg";
import { Icon, Star } from "../icons";
import { Scenery } from "../Scenery";
import { CardTray } from "../play/CardTray";
import { Controls } from "../play/Controls";
import { GuideBubble } from "../play/GuideBubble";
import { MissionBar } from "../play/MissionBar";
import { ProgramTrack } from "../play/ProgramTrack";
import { TutorialHand } from "../play/TutorialHand";

export function PlayScreen() {
  const level = useGame(currentLevel);
  const settings = useGame((s) => s.settings);
  const cards = useGame((s) => countCards(s.program));
  const galatFixed = useGame((s) => s.result !== null);

  const soundOn = settings.music || settings.sfx;
  const toggleSound = () => {
    const value = !soundOn;
    useGame.getState().updateSettings({ music: value, sfx: value });
    if (value) {
      music.start();
      sfx.click();
    } else music.stop();
  };

  return (
    <section className="screen" aria-label="Permainan">
      <Scenery />
      <header className="hud">
        <button
          type="button"
          className="round"
          aria-label="Kembali ke peta"
          onClick={() => {
            if (useGame.getState().phase === "running") stopProgram();
            sfx.click();
            useGame.getState().goTo("map");
          }}
        >
          {Icon.map()}
        </button>
        <div className="hud-title">
          <b>
            {level.order}. {level.name}
          </b>
          <small>{level.modul}</small>
        </div>
        <button type="button" className="round" aria-label={t.sound} aria-pressed={soundOn} onClick={toggleSound}>
          {Icon.sound()}
        </button>
        <button type="button" className="round" aria-label={t.teacherPanel} onClick={() => useGame.getState().setTeacherOpen(true)}>
          {Icon.gear()}
        </button>
      </header>

      <div className="play">
        <div className="board-area">
          <MissionBar />
          <div className="board-fit">
            <PhaserBoard key={settings.boardIso ? "iso" : "flat"} iso={settings.boardIso} />
          </div>
        </div>

        <div className="desk">
          <GuideBubble />
          <CardTray />
          <div className="trackbox">
            <div className="track-head">
              <b>{t.programTitle}</b>
              {level.feature === "kumbang-galat" && (
                <img className={`galat ${galatFixed ? "fly" : ""}`} src={galatUrl} alt="Kumbang Galat" title="Kumbang Galat" />
              )}
              <span className={`count ${cards === 0 ? "" : cards <= level.target ? "is-ok" : "is-over"}`}>
                <Star on={cards > 0 && cards <= level.target} />
                {t.cardsCount(cards, level.target)}
              </span>
            </div>
            <ProgramTrack />
          </div>
          <Controls />
        </div>
      </div>
      <TutorialHand />
    </section>
  );
}
