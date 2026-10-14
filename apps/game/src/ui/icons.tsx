import type { CardType } from "@robo/engine";
import type { ReactNode } from "react";

const svg = (children: ReactNode, viewBox = "0 0 24 24") => (
  <svg viewBox={viewBox} aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const Icon = {
  maju: () => svg(<path d="M12 3.5l7.5 8.5h-4.7v8.5H9.2V12H4.5z" fill="currentColor" />),
  kiri: () => svg(<path d="M17.5 21v-7.5a4.5 4.5 0 0 0-4.5-4.5H9.5V4.5L2.5 10.5l7 6V12H13a1.5 1.5 0 0 1 1.5 1.5V21z" fill="currentColor" />),
  kanan: () => svg(<path d="M6.5 21v-7.5A4.5 4.5 0 0 1 11 9h3.5V4.5l7 6-7 6V12H11a1.5 1.5 0 0 0-1.5 1.5V21z" fill="currentColor" />),
  ulangi: () =>
    svg(
      <path
        d="M17 2.5l4 4-4 4V7.7H8.5A3.5 3.5 0 0 0 5 11.2V12H3v-.8a5.5 5.5 0 0 1 5.5-5.5H17zM7 21.5l-4-4 4-4v2.8h8.5a3.5 3.5 0 0 0 3.5-3.5V12h2v.8a5.5 5.5 0 0 1-5.5 5.5H7z"
        fill="currentColor"
      />,
    ),
  play: () => svg(<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />),
  stop: () => svg(<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />),
  step: () => svg(<path d="M5 5v14l9-7zM16 5h3v14h-3z" fill="currentColor" />),
  reset: () => svg(<path d="M12 5a7 7 0 1 1-6.7 9h2.1A5 5 0 1 0 12 7v3L7.5 6 12 2z" fill="currentColor" />),
  undo: () => svg(<path d="M9 5L3.5 10.5 9 16v-3.5h5.5a4 4 0 0 1 0 8H11V23h3.5a6.5 6.5 0 0 0 0-13H9z" fill="currentColor" />),
  trash: () => svg(<path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7z" fill="currentColor" />),
  close: () => svg(<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />),
  lamp: () =>
    svg(
      <path
        d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 19h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 20.5z"
        fill="#e3ac1b"
      />,
    ),
  music: () => svg(<path d="M9 18.5a3 3 0 1 1-2-2.8V5l12-2.5v12a3 3 0 1 1-2-2.8V7.3L9 9z" fill="currentColor" />),
  sound: () =>
    svg(
      <>
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>,
    ),
  speak: () =>
    svg(
      <>
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        <path d="M16 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>,
    ),
  gear: () =>
    svg(
      <path
        d="M10.5 2h3l.5 2.6 2 .9 2.2-1.5 2.1 2.1-1.5 2.2.9 2 2.6.5v3l-2.6.5-.9 2 1.5 2.2-2.1 2.1-2.2-1.5-2 .9-.5 2.6h-3l-.5-2.6-2-.9-2.2 1.5-2.1-2.1 1.5-2.2-.9-2L2 13.5v-3l2.6-.5.9-2L4 5.8l2.1-2.1 2.2 1.5 2-.9zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"
        fill="currentColor"
      />,
    ),
  map: () =>
    svg(<path d="M3 6l6-2.5 6 2.5 6-2.5v14.5L15 20.5 9 18l-6 2.5zM9 4.5V18M15 6v14.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />),
  home: () => svg(<path d="M3 11l9-7.5 9 7.5v10h-6v-6H9v6H3z" fill="currentColor" />),
  lock: () => svg(<path d="M7 10V8a5 5 0 0 1 10 0v2h1v11H6V10zm2 0h6V8a3 3 0 0 0-6 0z" fill="currentColor" />),
  badge: () =>
    svg(
      <>
        <circle cx="12" cy="9" r="7" fill="currentColor" />
        <path d="M8 14l-2 8 6-3 6 3-2-8" fill="currentColor" opacity=".7" />
        <circle cx="12" cy="9" r="3" fill="#fff" />
      </>,
    ),
  drag: () =>
    svg(<path d="M12 3l3 3h-2v5h5V9l3 3-3 3v-2h-5v5h2l-3 3-3-3h2v-5H6v2l-3-3 3-3v2h5V6H9z" fill="currentColor" />),
};

export function CardIcon({ type }: { type: CardType }) {
  return Icon[type]();
}

export function Star({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={on ? "star on" : "star"}>
      <path
        d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6L2.5 9.3l6.6-.8z"
        fill={on ? "#f2b81c" : "#dfe7da"}
        stroke={on ? "#b9860c" : "#c4d1bd"}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="stars">
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} on={i < count} />
      ))}
    </span>
  );
}
