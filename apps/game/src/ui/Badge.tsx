import type { ReactElement } from "react";
import type { Badge } from "../copy/badges";

const GLYPH: Record<string, ReactElement> = {
  urutan: <path d="M12 4l6 6h-3.5v6h-5v-6H6z" fill="#fff" />,
  belok: <path d="M7 18v-6a4 4 0 0 1 4-4h3V5l5 4.5-5 4.5v-3h-3a1 1 0 0 0-1 1v6z" fill="#fff" />,
  ulangi: (
    <path
      d="M15.5 5l3 3-3 3V9H10a2.5 2.5 0 0 0-2.5 2.5V12h-2v-.5A4.5 4.5 0 0 1 10 7h5.5zM8.5 19l-3-3 3-3v2H14a2.5 2.5 0 0 0 2.5-2.5V12h2v.5A4.5 4.5 0 0 1 14 17H8.5z"
      fill="#fff"
    />
  ),
  galat: (
    <g fill="#fff">
      <ellipse cx="12" cy="14" rx="5" ry="6" />
      <circle cx="12" cy="7" r="2.6" />
      <path d="M7 12l-3-1M7 15H3.5M7.5 18l-2.5 2M17 12l3-1M17 15h3.5M16.5 18l2.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  panen: <path d="M12 3l2.4 5 5.5.7-4 3.8 1.1 5.5L12 15.4 7 18l1.1-5.5-4-3.8 5.5-.7z" fill="#fff" />,
};

/** Lencana berbentuk perisai bundar dengan pita. */
export function BadgeIcon({ badge, earned, className }: { badge: Badge; earned: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`badge-icon ${earned ? "is-earned" : "is-locked"} ${className ?? ""}`}>
      <path d="M22 40l-6 20 16-8 16 8-6-20z" fill={earned ? badge.color : "#c4cdbf"} opacity=".85" />
      <circle cx="32" cy="28" r="22" fill={earned ? badge.color : "#d7ded2"} />
      <circle cx="32" cy="28" r="17" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" strokeDasharray="4 3" />
      <g transform="translate(20 16)">{earned ? GLYPH[badge.id] : <path d="M8 11V8a4 4 0 0 1 8 0v3h1v9H7v-9zm2 0h4V8a2 2 0 0 0-4 0z" fill="#fff" />}</g>
    </svg>
  );
}
