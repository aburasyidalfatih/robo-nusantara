/**
 * Seret-dan-lepas kartu dengan Pointer Events, sehingga sama-sama
 * berjalan dengan mouse, layar sentuh, dan pena.
 *
 * Status seret disimpan di store kecil terpisah agar gerakan jari
 * tidak membuat seluruh layar dirender ulang.
 */
import type { CardType, ListKey } from "@robo/engine";
import type { PointerEvent as ReactPointerEvent } from "react";
import { create } from "zustand";
import { sfx } from "../../audio/sound";
import { useGame } from "../../state/store";

export type DragPayload = { kind: "new"; type: CardType } | { kind: "move"; id: string; type: CardType };

export interface DropTarget {
  listKey: ListKey;
  /** Posisi sisip pada daftar tujuan, tidak menghitung kartu yang sedang diseret. */
  index: number;
}

interface DragState {
  payload: DragPayload | null;
  x: number;
  y: number;
  drop: DropTarget | null;
  overTrash: boolean;
}

export const useDrag = create<DragState>()(() => ({ payload: null, x: 0, y: 0, drop: null, overTrash: false }));

const THRESHOLD = 8;
let justDragged = false;

/** Klik yang terjadi tepat setelah seret harus diabaikan. */
export const wasDragging = () => justDragged;

function locateDrop(x: number, y: number, payload: DragPayload): { drop: DropTarget | null; overTrash: boolean } {
  const el = document.elementFromPoint(x, y);
  if (!el) return { drop: null, overTrash: false };
  if (el.closest("[data-drop-trash]")) return { drop: null, overTrash: payload.kind === "move" };

  let list = el.closest<HTMLElement>("[data-list-key]");
  // Blok Ulangi tidak boleh masuk ke blok Ulangi: arahkan ke program utama.
  if (list && payload.type === "ulangi" && list.dataset.listKey !== "main") {
    list = document.querySelector<HTMLElement>('[data-list-key="main"]');
  }
  if (!list) return { drop: null, overTrash: false };

  const draggedId = payload.kind === "move" ? payload.id : null;
  const items = [...list.querySelectorAll<HTMLElement>(":scope > [data-node-id]")].filter(
    (item) => item.dataset.nodeId !== draggedId,
  );
  let index = items.length;
  for (let i = 0; i < items.length; i++) {
    const r = (items[i] as HTMLElement).getBoundingClientRect();
    if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) {
      index = i;
      break;
    }
  }
  return { drop: { listKey: list.dataset.listKey as ListKey, index }, overTrash: false };
}

/**
 * Mulai memantau pointer. Seret baru aktif setelah jari bergeser
 * beberapa piksel; ketukan biasa tetap menjadi klik.
 */
export function beginDrag(event: ReactPointerEvent, payload: DragPayload): void {
  if (event.button > 0) return;
  if (useGame.getState().phase === "running") return;
  const x0 = event.clientX;
  const y0 = event.clientY;
  let active = false;

  const move = (e: PointerEvent) => {
    if (!active) {
      if (Math.hypot(e.clientX - x0, e.clientY - y0) < THRESHOLD) return;
      active = true;
      justDragged = true;
      useGame.getState().select(null);
      sfx.pick();
    }
    e.preventDefault();
    const located = locateDrop(e.clientX, e.clientY, payload);
    useDrag.setState({ payload, x: e.clientX, y: e.clientY, ...located });
  };

  const end = (commit: boolean) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    const { drop, overTrash } = useDrag.getState();
    useDrag.setState({ payload: null, drop: null, overTrash: false });
    window.setTimeout(() => {
      justDragged = false;
    }, 0);
    if (!active || !commit) return;

    const game = useGame.getState();
    if (payload.kind === "move" && overTrash) {
      game.removeCard(payload.id);
      sfx.remove();
      return;
    }
    if (!drop) return;
    if (payload.kind === "new") game.addCard(payload.type, drop.listKey, drop.index);
    else game.moveCard(payload.id, drop.listKey, drop.index);
    sfx.drop();
  };
  const up = () => end(true);
  const cancel = () => end(false);

  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel);
}
