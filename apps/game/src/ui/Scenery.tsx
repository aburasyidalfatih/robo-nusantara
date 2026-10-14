/** Latar langit dan bukit sawah berundak yang bergerak pelan. */
export function Scenery() {
  return (
    <div className="scenery" aria-hidden="true">
      <div className="sun" />
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <svg className="bird" viewBox="0 0 18 8">
        <path d="M1 6q4-6 8 0q4-6 8 0" stroke="#3a4a57" strokeWidth="1.5" fill="none" />
      </svg>
      <svg className="hills" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M0 120 Q200 40 420 110 T820 90 T1200 70 V300 H0Z" fill="var(--hill-1)" />
        <g stroke="rgba(255,255,255,.35)" strokeWidth="3" fill="none">
          <path d="M0 150 Q200 80 420 140 T820 122 T1200 104" />
          <path d="M0 178 Q200 112 420 168 T820 152 T1200 136" />
        </g>
        <path d="M0 190 Q300 130 600 185 T1200 165 V300 H0Z" fill="var(--hill-2)" />
        <g stroke="rgba(255,255,255,.3)" strokeWidth="3" fill="none">
          <path d="M0 220 Q300 164 600 214 T1200 196" />
          <path d="M0 248 Q300 196 600 242 T1200 226" />
        </g>
        <path d="M0 255 Q350 215 700 250 T1200 240 V300 H0Z" fill="var(--hill-3)" />
      </svg>
    </div>
  );
}
