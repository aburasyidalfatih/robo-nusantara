import { useState, type FormEvent } from "react";
import { music, sfx } from "../../audio/sound";
import { t } from "../../copy/id";
import type { AvatarColor } from "../../state/persistence";
import { nextPlayableIndex, useGame } from "../../state/store";
import { BimaFace } from "../Bima";
import { Scenery } from "../Scenery";

const AVATARS: AvatarColor[] = ["biru", "hijau", "jingga", "ungu"];

/** Layar profil: nama panggilan dan warna Bima. Muncul sekali di awal, bisa diubah dari layar judul. */
export function ProfileScreen() {
  const existing = useGame((s) => s.profile);
  const [name, setName] = useState(existing?.name ?? "");
  const [avatar, setAvatar] = useState<AvatarColor>(existing?.avatar ?? "biru");
  const valid = name.trim().length >= 2;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    music.start();
    sfx.drop();
    const game = useGame.getState();
    game.saveProfile({ name, avatar });
    game.openLevel(game.progress.tutorialDone ? nextPlayableIndex(game) : 0);
  };

  return (
    <section className="screen" aria-label={t.profileTitle}>
      <Scenery />
      <form className="profile" onSubmit={submit}>
        <BimaFace mood="happy" avatar={avatar} className="profile-bima" />
        <h1>{t.profileTitle}</h1>
        <p className="tagline">{t.profileIntro}</p>
        <label className="field">
          <span>{t.profileName}</span>
          <input
            id="profile-name"
            type="text"
            value={name}
            maxLength={20}
            autoComplete="off"
            autoFocus
            placeholder={t.profileNamePlaceholder}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <fieldset className="avatars">
          <legend>{t.profileAvatar}</legend>
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              className={`avatar ${avatar === a ? "is-on" : ""}`}
              aria-pressed={avatar === a}
              aria-label={t.avatarNames[a]}
              onClick={() => {
                setAvatar(a);
                sfx.click();
              }}
            >
              <BimaFace mood={avatar === a ? "happy" : "normal"} avatar={a} />
            </button>
          ))}
        </fieldset>
        <button type="submit" className="big" disabled={!valid}>
          {t.profileStart}
        </button>
      </form>
    </section>
  );
}
