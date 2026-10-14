import { sfx } from "../../audio/sound";
import { t } from "../../copy/id";
import { resetBoard, runProgram, stepProgram } from "../../game/runner";
import { useGame } from "../../state/store";
import { Icon } from "../icons";

/** Tombol untuk anak: sedikit, besar, dan jelas. Pengaturan lain ada di Panel guru. */
export function Controls() {
  const running = useGame((s) => s.phase === "running");
  const canUndo = useGame((s) => s.history.length > 0);

  return (
    <div className="controls">
      <ControlButton label={t.undo} icon={Icon.undo()} disabled={running || !canUndo} onClick={() => useGame.getState().undo()} />
      <ControlButton
        label={t.hint}
        icon={Icon.lamp()}
        className="hint"
        disabled={running}
        onClick={() => {
          sfx.click();
          useGame.getState().requestHint();
        }}
      />
      <ControlButton label={t.step} icon={Icon.step()} disabled={running} onClick={() => void stepProgram()} />
      <ControlButton
        label={t.reset}
        icon={Icon.reset()}
        disabled={running}
        onClick={() => {
          sfx.click();
          resetBoard();
        }}
      />
      <span className="spacer" />
      <button
        type="button"
        className={`go ${running ? "is-stop" : ""}`}
        data-run
        aria-label={running ? "Hentikan program" : "Jalankan program"}
        onClick={() => void runProgram()}
      >
        {running ? Icon.stop() : Icon.play()}
        {running ? t.stop : t.run}
      </button>
    </div>
  );
}

function ControlButton(props: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button type="button" className={`ctl ${props.className ?? ""}`} disabled={props.disabled} onClick={props.onClick}>
      <span className="r">{props.icon}</span>
      <small>{props.label}</small>
    </button>
  );
}
