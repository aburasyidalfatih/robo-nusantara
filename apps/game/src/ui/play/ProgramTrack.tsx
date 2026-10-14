import { numberCards, type CommandNode, type ListKey, type LoopNode, type ProgramNode } from "@robo/engine";
import { useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { sfx } from "../../audio/sound";
import { CARD_LABEL, t } from "../../copy/id";
import { useGame } from "../../state/store";
import { beginDrag, useDrag, wasDragging } from "../dnd/drag";
import { CardIcon, Icon } from "../icons";

/** Jalur program: tempat anak menyusun, menyisipkan, dan mengurutkan kartu. */
export function ProgramTrack() {
  const program = useGame((s) => s.program);
  const tapTarget = useGame((s) => s.tapTarget);
  const payload = useDrag((s) => s.payload);
  const drop = useDrag((s) => s.drop);
  const numbers = useMemo(() => numberCards(program), [program]);
  const draggedId = payload?.kind === "move" ? payload.id : null;
  const hasLoop = program.some((n) => n.type === "ulangi");

  /** Render daftar kartu, menyisipkan penanda posisi lepas bila sedang diseret. */
  const renderList = (nodes: ProgramNode[], listKey: ListKey, render: (n: ProgramNode) => ReactNode) => {
    const out: ReactNode[] = [];
    const slotHere = drop && drop.listKey === listKey ? drop.index : -1;
    let visible = 0;
    for (const n of nodes) {
      if (n.id !== draggedId && visible === slotHere) out.push(<span key="slot" className="slot" aria-hidden="true" />);
      out.push(render(n));
      if (n.id !== draggedId) visible++;
    }
    if (slotHere >= visible) out.push(<span key="slot" className="slot" aria-hidden="true" />);
    return out;
  };

  const onBackground = () => {
    if (wasDragging()) return;
    const game = useGame.getState();
    game.select(null);
    game.setTapTarget("main");
  };

  return (
    <div
      className={`track ${tapTarget === "main" && hasLoop ? "is-target" : ""}`}
      data-list-key="main"
      aria-label={t.programTitle}
      onClick={onBackground}
    >
      {program.length === 0 && !drop && (
        <span className="empty">
          {Icon.drag()}
          {t.dropHere}
        </span>
      )}
      {renderList(program, "main", (n) =>
        n.type === "ulangi" ? (
          <LoopBlock key={n.id} node={n} numbers={numbers} renderList={renderList} />
        ) : (
          <Card key={n.id} node={n} num={numbers.get(n.id) ?? 0} />
        ),
      )}
    </div>
  );
}

function useCardState(id: string) {
  const selected = useGame((s) => s.selectedId === id);
  const running = useGame((s) => s.activeStep?.nodeId === id);
  const bug = useGame((s) => s.bugNodeId === id);
  const hint = useGame((s) => s.hintNodeId === id);
  const dragging = useDrag((s) => s.payload?.kind === "move" && s.payload.id === id);
  return { selected, running, bug, hint, dragging };
}

function Card({ node, num }: { node: CommandNode; num: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { selected, running, bug, hint, dragging } = useCardState(node.id);

  useEffect(() => {
    if (running) ref.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [running]);

  const toggle = () => {
    const game = useGame.getState();
    if (game.phase === "running") return;
    game.select(selected ? null : node.id);
    sfx.click();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      useGame.getState().removeCard(node.id);
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  const cls = [
    "card",
    selected && "is-selected",
    running && "is-running",
    bug && "is-bug",
    hint && "is-hint",
    dragging && "is-dragsrc",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={cls}
      data-node-id={node.id}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Kartu ${num}: ${CARD_LABEL[node.type]}. Seret untuk memindah, ketuk untuk memilih.`}
      onPointerDown={(e) => beginDrag(e, { kind: "move", id: node.id, type: node.type })}
      onClick={(e) => {
        e.stopPropagation();
        if (!wasDragging()) toggle();
      }}
      onKeyDown={onKey}
    >
      <span className="num">{num}</span>
      <span className={`face k-${node.type}`}>
        <CardIcon type={node.type} />
      </span>
      {selected && <DeleteButton id={node.id} label={`Buang kartu ${num}`} />}
    </div>
  );
}

function DeleteButton({ id, label }: { id: string; label: string }) {
  return (
    <button
      type="button"
      className="del"
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        useGame.getState().removeCard(id);
        sfx.remove();
      }}
    >
      {Icon.close()}
    </button>
  );
}

function LoopBlock({
  node,
  numbers,
  renderList,
}: {
  node: LoopNode;
  numbers: Map<string, number>;
  renderList: (nodes: ProgramNode[], listKey: ListKey, render: (n: ProgramNode) => ReactNode) => ReactNode[];
}) {
  const listKey: ListKey = `loop:${node.id}`;
  const { selected, dragging } = useCardState(node.id);
  const isTarget = useGame((s) => s.tapTarget === listKey);
  const iteration = useGame((s) => (s.activeStep?.loop?.id === node.id ? s.activeStep.loop : null));
  const num = numbers.get(node.id) ?? 0;

  const stop = (e: { stopPropagation(): void }) => e.stopPropagation();
  const count = (delta: 1 | -1) => (e: MouseEvent) => {
    e.stopPropagation();
    useGame.getState().changeLoopCount(node.id, delta);
    sfx.click();
  };

  const cls = ["loop", selected && "is-selected", isTarget && "is-target", iteration && "is-running", dragging && "is-dragsrc"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} data-node-id={node.id}>
      <div
        className="loop-head"
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`Kartu ${num}: blok Ulangi ${node.count} kali. Seret untuk memindah, ketuk untuk memilih.`}
        onPointerDown={(e) => beginDrag(e, { kind: "move", id: node.id, type: "ulangi" })}
        onClick={(e) => {
          e.stopPropagation();
          if (wasDragging()) return;
          const game = useGame.getState();
          if (game.phase === "running") return;
          game.select(selected ? null : node.id);
          game.setTapTarget(listKey);
        }}
        onKeyDown={(e) => {
          if (e.key === "Delete" || e.key === "Backspace") useGame.getState().removeCard(node.id);
        }}
      >
        <span className="loop-tag">
          <span className="num">{num}</span>
          {Icon.ulangi()}
          {CARD_LABEL.ulangi}
        </span>
        <span className="stepper" onPointerDown={stop}>
          <button type="button" aria-label="Kurangi pengulangan" onClick={count(-1)}>
            −
          </button>
          <span className="times">×{node.count}</span>
          <button type="button" aria-label="Tambah pengulangan" onClick={count(1)}>
            +
          </button>
        </span>
        {iteration && <span className="iter">{t.loopIteration(iteration.iteration, iteration.count)}</span>}
      </div>
      {selected && <DeleteButton id={node.id} label="Buang blok Ulangi" />}
      <div
        className="loop-body"
        data-list-key={listKey}
        onClick={(e) => {
          e.stopPropagation();
          if (wasDragging()) return;
          const game = useGame.getState();
          game.select(null);
          game.setTapTarget(listKey);
          game.talk("info", t.loopTapTarget);
        }}
      >
        {node.children.length === 0 && <span className="placeholder">{t.loopPlaceholder}</span>}
        {renderList(node.children, listKey, (c) => (
          <Card key={c.id} node={c as CommandNode} num={numbers.get(c.id) ?? 0} />
        ))}
      </div>
    </div>
  );
}
