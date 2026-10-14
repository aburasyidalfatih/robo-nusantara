import { music, sfx } from "../../audio/sound";
import { t } from "../../copy/id";
import { nextPlayableIndex, useGame } from "../../state/store";
import { BimaFace } from "../Bima";
import { Icon } from "../icons";
import { Scenery } from "../Scenery";

export function TitleScreen() {
  const start = () => {
    music.start();
    sfx.click();
    const game = useGame.getState();
    game.openLevel(game.progress.tutorialDone ? nextPlayableIndex(game) : 0);
  };

  return (
    <section className="screen" aria-label="Layar judul">
      <Scenery />
      <div className="title-wrap">
        <BimaFace mood="happy" className="hero-bima" />
        <h1 className="logo">
          {t.appName}
          <span>{t.jenjang1}</span>
        </h1>
        <p className="tagline">{t.tagline}</p>
        <div className="title-actions">
          <button type="button" className="big" onClick={start}>
            {Icon.play()}
            {t.play}
          </button>
          <button
            type="button"
            className="big alt"
            onClick={() => {
              music.start();
              sfx.click();
              useGame.getState().goTo("map");
            }}
          >
            {Icon.map()}
            {t.chooseLevel}
          </button>
        </div>
        <button type="button" className="link" onClick={() => useGame.getState().setTeacherOpen(true)}>
          {t.teacherPanel}
        </button>
      </div>
      <p className="title-foot">{t.titleFoot}</p>
    </section>
  );
}
