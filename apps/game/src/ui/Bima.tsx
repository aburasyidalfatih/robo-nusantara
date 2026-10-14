import type { CSSProperties } from "react";
import type { AvatarColor } from "../state/persistence";
import type { Mood } from "../state/store";

/** Palet tubuh Bima per warna avatar: badan gelap, badan terang, garis antena. */
export const AVATAR_PALETTE: Record<AvatarColor, { dark: string; light: string; line: string }> = {
  biru: { dark: "#2463b5", light: "#5f9ce4", line: "#17427c" },
  hijau: { dark: "#2b8452", light: "#5fbf86", line: "#1b5c38" },
  jingga: { dark: "#c4531a", light: "#ef8a4c", line: "#8a3a10" },
  ungu: { dark: "#7b3fa8", light: "#aa75d6", line: "#54287a" },
};

/** Bima tampak depan, dengan ekspresi sesuai suasana hati dan warna avatar anak. */
export function BimaFace({
  mood = "normal",
  avatar = "biru",
  className,
  style,
}: {
  mood?: Mood;
  avatar?: AvatarColor;
  className?: string;
  style?: CSSProperties;
}) {
  const c = AVATAR_PALETTE[avatar];
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`bima-face ${className ?? ""}`} data-mood={mood} style={style}>
      <line x1="32" y1="5" x2="32" y2="13" stroke={c.line} strokeWidth="2.5" />
      <circle className="lamp-glow" cx="32" cy="5" r="3.6" fill="#ffc93c" />
      <rect x="5" y="40" width="9" height="15" rx="4.5" fill={c.light} />
      <rect className="arm-r" x="50" y="40" width="9" height="15" rx="4.5" fill={c.light} />
      <rect x="14" y="54" width="36" height="8" rx="4" fill="#1d2933" />
      <rect x="16" y="40" width="32" height="17" rx="7" fill={c.light} />
      <circle cx="32" cy="48.5" r="3.2" fill="#ffc93c" />
      <rect x="10" y="12" width="44" height="31" rx="13" fill={c.dark} />
      <rect x="15" y="17" width="34" height="21" rx="9" fill="#13304f" />
      {mood === "normal" && (
        <g>
          <g className="blink">
            <circle cx="25" cy="26" r="4" fill="#d9f6ff" />
            <circle cx="39" cy="26" r="4" fill="#d9f6ff" />
          </g>
          <path d="M27.5 32.5q4.5 3 9 0" stroke="#d9f6ff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
      {mood === "happy" && (
        <g>
          <path d="M20.5 27.5q4.5-6 9 0M34.5 27.5q4.5-6 9 0" stroke="#d9f6ff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M26 31.5q6 5.5 12 0z" fill="#d9f6ff" />
        </g>
      )}
      {mood === "dizzy" && (
        <g>
          <path d="M21.5 22.5l7 7M28.5 22.5l-7 7M35.5 22.5l7 7M42.5 22.5l-7 7" stroke="#ffb3a6" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M26 34q2-2 4 0t4 0t4 0" stroke="#ffb3a6" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
      {mood === "think" && (
        <g>
          <circle cx="25" cy="26" r="4" fill="#d9f6ff" />
          <path d="M35 26h8" stroke="#d9f6ff" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M28 33h8" stroke="#d9f6ff" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/** Prof. Rara, insinyur pemberi misi. */
export function RaraFace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="24" fill="#d8ecdf" />
      <path d="M6 48q18-20 36 0z" fill="#2b8452" />
      <circle cx="24" cy="23" r="14" fill="#2b8452" />
      <ellipse cx="24" cy="24" rx="8.5" ry="9.5" fill="#c98e64" />
      <path d="M15 22q9-13 18 0q-1-9-9-10q-8 1-9 10z" fill="#2b8452" />
      <circle cx="20.6" cy="24" r="2.9" fill="none" stroke="#1c2a1f" strokeWidth="1.2" />
      <circle cx="27.4" cy="24" r="2.9" fill="none" stroke="#1c2a1f" strokeWidth="1.2" />
      <line x1="23.5" y1="24" x2="24.5" y2="24" stroke="#1c2a1f" strokeWidth="1.2" />
      <path d="M21.5 28.5q2.5 2 5 0" stroke="#7a3f22" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
