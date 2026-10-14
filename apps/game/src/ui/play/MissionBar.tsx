import { narratorAvailable, speak } from "../../audio/narrator";
import { currentLevel, useGame } from "../../state/store";
import { RaraFace } from "../Bima";
import { Icon } from "../icons";

/** Misi dari Prof. Rara, selalu terlihat di atas papan (disembunyikan di layar sempit). */
export function MissionBar() {
  const mission = useGame((s) => currentLevel(s).mission);
  return (
    <div className="mission">
      <RaraFace className="rara" />
      <p>{mission}</p>
      {narratorAvailable && (
        <button type="button" className="speak" aria-label="Dengarkan misi" onClick={() => speak(mission)}>
          {Icon.speak()}
        </button>
      )}
    </div>
  );
}
