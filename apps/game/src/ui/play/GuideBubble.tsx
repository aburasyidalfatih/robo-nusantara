import type { Token } from "@robo/engine";
import { useEffect } from "react";
import { narratorAvailable, speak } from "../../audio/narrator";
import { useGame } from "../../state/store";
import { BimaFace } from "../Bima";
import { CardIcon, Icon } from "../icons";

const TOKEN_TYPE = { M: "maju", L: "kiri", R: "kanan" } as const;

/** Bima berbicara: semua pesan untuk anak muncul di sini dan bisa dibacakan. */
export function GuideBubble() {
  const say = useGame((s) => s.say);
  const narration = useGame((s) => s.settings.narration);
  const avatar = useGame((s) => s.profile?.avatar ?? "biru");

  useEffect(() => {
    if (say.speak && narration) speak(say.text);
  }, [say.id, say.speak, say.text, narration]);

  return (
    <div className="guide">
      <BimaFace mood={say.mood} avatar={avatar} className="guide-bima" />
      <div className={`say k-${say.kind}`} role="status" aria-live="polite">
        <div className="say-body">
          <p>{say.text}</p>
          {say.preview && <PreviewTokens tokens={say.preview.tokens} truncated={say.preview.truncated} />}
        </div>
        {narratorAvailable && (
          <button type="button" className="speak" aria-label="Dengarkan" onClick={() => speak(say.text)}>
            {Icon.speak()}
          </button>
        )}
      </div>
    </div>
  );
}

function PreviewTokens({ tokens, truncated }: { tokens: Token[]; truncated: boolean }) {
  return (
    <div className="ghost" aria-label="Contoh awal program">
      {tokens.map((tk, i) =>
        typeof tk === "string" ? (
          <span key={i} className={`face k-${TOKEN_TYPE[tk]}`}>
            <CardIcon type={TOKEN_TYPE[tk]} />
          </span>
        ) : (
          <span key={i} className="gl">
            <span className="face k-ulangi">
              <CardIcon type="ulangi" />
            </span>
            <b>×{tk.rep}</b>
            {tk.body.map((b, j) =>
              typeof b === "string" ? (
                <span key={j} className={`face k-${TOKEN_TYPE[b]}`}>
                  <CardIcon type={TOKEN_TYPE[b]} />
                </span>
              ) : null,
            )}
          </span>
        ),
      )}
      {truncated && <b className="more">…</b>}
    </div>
  );
}
