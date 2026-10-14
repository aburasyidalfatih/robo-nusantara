import { CardIcon } from "../icons";
import { useDrag } from "./drag";

/** Kartu yang mengikuti jari saat diseret. */
export function DragGhost() {
  const payload = useDrag((s) => s.payload);
  const x = useDrag((s) => s.x);
  const y = useDrag((s) => s.y);
  if (!payload) return null;
  return (
    <div className="drag-ghost" style={{ left: x, top: y }} aria-hidden="true">
      <span className={`face k-${payload.type}`}>
        <CardIcon type={payload.type} />
      </span>
    </div>
  );
}
