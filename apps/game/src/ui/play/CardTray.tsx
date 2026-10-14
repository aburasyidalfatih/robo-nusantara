import type { CardType } from "@robo/engine";
import { sfx } from "../../audio/sound";
import { CARD_LABEL, t } from "../../copy/id";
import { currentLevel, useGame } from "../../state/store";
import { beginDrag, useDrag, wasDragging } from "../dnd/drag";
import { CardIcon, Icon } from "../icons";

const ORDER: CardType[] = ["maju", "kiri", "kanan", "ulangi"];

/** Rak kartu perintah. Kartu bisa diseret ke jalur program atau cukup diketuk. */
export function CardTray() {
  const palette = useGame((s) => currentLevel(s).palette);
  const running = useGame((s) => s.phase === "running");
  const draggingProgramCard = useDrag((s) => s.payload?.kind === "move");
  const overTrash = useDrag((s) => s.overTrash);

  return (
    <div className="tray">
      <div className="palette">
        {ORDER.filter((type) => palette.includes(type)).map((type) => (
          <button
            key={type}
            type="button"
            className="pcard"
            data-card-type={type}
            disabled={running}
            aria-label={`Kartu ${CARD_LABEL[type]}. Seret ke jalur program atau ketuk untuk menambahkan.`}
            onPointerDown={(e) => beginDrag(e, { kind: "new", type })}
            onClick={() => {
              if (wasDragging()) return;
              useGame.getState().addCard(type);
              sfx.drop();
            }}
          >
            <span className={`face k-${type}`}>
              <CardIcon type={type} />
            </span>
            <small>{CARD_LABEL[type]}</small>
          </button>
        ))}
      </div>
      {draggingProgramCard && (
        <div className={`trash ${overTrash ? "is-over" : ""}`} data-drop-trash>
          {Icon.trash()}
          {t.trash}
        </div>
      )}
    </div>
  );
}
