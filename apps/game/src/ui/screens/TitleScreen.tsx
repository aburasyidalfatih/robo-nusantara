import { music, sfx } from "../../audio/sound";
import { t } from "../../copy/id";
import { nextPlayableIndex, useGame } from "../../state/store";
import { BimaFace } from "../Bima";
import { Icon } from "../icons";
import { Scenery } from "../Scenery";

export function TitleScreen() {
  const profile = useGame((s) => s.profile);

  const start = () => {
    music.start();
    sfx.click();
    const game = useGame.getState();
    if (!game.profile) {
      game.goTo("profile");
      return;
    }
    game.openLevel(game.progress.tutorialDone ? nextPlayableIndex(game) : 0);
  };

  return (
    <section className="screen" aria-label="Layar judul">
      <Scenery />
      <header className="hud hud-title-screen">
        <span className="spacer" />
        <button type="button" className="round" aria-label={t.teacherPanel} onClick={() => useGame.getState().setTeacherOpen(true)}>
          {Icon.gear()}
        </button>
      </header>
      <div className="title-wrap">
        <BimaFace mood="happy" avatar={profile?.avatar ?? "biru"} className="hero-bima" />
        <h1 className="logo">
          {t.appName}
          <span>{t.jenjang1}</span>
        </h1>
        <p className="tagline">{t.tagline}</p>
        <div className="title-actions">
          <button type="button" className="big" onClick={start}>
            {Icon.play()}
            {profile ? t.continueAs(profile.name) : t.play}
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
        {profile && (
          <button type="button" className="link" onClick={() => useGame.getState().goTo("profile")}>
            {t.changePlayer}
          </button>
        )}
      </div>
      <p className="title-foot">{t.titleFoot}</p>
    </section>
  );
}
