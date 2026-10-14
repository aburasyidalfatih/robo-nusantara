import { sfx } from "../../audio/sound";
import { BADGES } from "../../copy/badges";
import { t } from "../../copy/id";
import { LEVELS, totalStars, useGame } from "../../state/store";
import { BimaFace } from "../Bima";
import { BadgeIcon } from "../Badge";
import { Icon, Star } from "../icons";
import { Scenery } from "../Scenery";

/** Koleksi lencana konsep yang sudah diraih anak. */
export function CollectionScreen() {
  const progress = useGame((s) => s.progress);
  const profile = useGame((s) => s.profile);

  return (
    <section className="screen" aria-label={t.collection}>
      <Scenery />
      <header className="hud">
        <button
          type="button"
          className="round"
          aria-label="Kembali ke peta"
          onClick={() => {
            sfx.click();
            useGame.getState().goTo("map");
          }}
        >
          {Icon.map()}
        </button>
        <div className="hud-title">
          <b>{t.collection}</b>
          <small>{profile?.name ?? ""}</small>
        </div>
        <span className="pill">
          <Star on />
          {totalStars({ progress })} / {LEVELS.length * 3}
        </span>
      </header>
      <div className="collection">
        <div className="collection-hero">
          <BimaFace mood="happy" avatar={profile?.avatar ?? "biru"} className="collection-bima" />
          <p>{t.collectionIntro}</p>
        </div>
        <ul className="badges">
          {BADGES.map((b) => {
            const earned = progress.badges.includes(b.id);
            return (
              <li key={b.id} className={`badge-card ${earned ? "is-earned" : ""}`}>
                <BadgeIcon badge={b} earned={earned} />
                <b>{b.name}</b>
                <small>{earned ? b.description : t.badgeLocked}</small>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
