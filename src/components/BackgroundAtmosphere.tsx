"use client";

/**
 * Low-contrast decorative SVG mesh / escrow geometry for landing & auth.
 * GPU-friendly: opacity + transform only. Honors prefers-reduced-motion via CSS.
 */
export function BackgroundAtmosphere({
  variant = "landing",
}: {
  variant?: "landing" | "auth";
}) {
  return (
    <div
      className={`bg-atmosphere bg-atmosphere--${variant}`}
      aria-hidden="true"
    >
      <svg
        className="bg-atmosphere__mesh"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="meshA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.14" />
            <stop offset="55%" stopColor="#0f766e" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#e2a93b" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="meshB" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10231f" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id="orbTeal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.22" />
            <stop offset="70%" stopColor="#0f766e" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orbGold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2a93b" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#e2a93b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse
          className="bg-atmosphere__drift bg-atmosphere__drift--a"
          cx="980"
          cy="120"
          rx="280"
          ry="260"
          fill="url(#orbTeal)"
        />
        <ellipse
          className="bg-atmosphere__drift bg-atmosphere__drift--b"
          cx="160"
          cy="620"
          rx="240"
          ry="220"
          fill="url(#orbGold)"
        />
        <ellipse
          className="bg-atmosphere__drift bg-atmosphere__drift--c"
          cx="640"
          cy="380"
          rx="320"
          ry="180"
          fill="url(#meshA)"
        />

        <g
          className="bg-atmosphere__geometry"
          fill="none"
          stroke="#0f766e"
          strokeWidth="1.25"
          strokeOpacity="0.12"
        >
          <circle cx="200" cy="180" r="72" />
          <circle cx="200" cy="180" r="48" />
          <path d="M128 180h144M200 108v144" />
          <rect
            x="860"
            y="480"
            width="140"
            height="140"
            rx="28"
            transform="rotate(-12 930 550)"
          />
          <path
            d="M920 520c40 8 68 36 72 72"
            strokeOpacity="0.16"
            strokeWidth="1.5"
          />
          <path d="M400 700c80-40 160-40 240 0" strokeOpacity="0.1" />
          <path d="M480 120l40 70h-80z" strokeOpacity="0.09" />
        </g>

        <g
          className="bg-atmosphere__grid"
          stroke="#10231f"
          strokeWidth="0.75"
          strokeOpacity="0.045"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={150 + i * 130}
              y1="40"
              x2={150 + i * 130}
              y2="760"
            />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="40"
              y1={120 + i * 140}
              x2="1160"
              y2={120 + i * 140}
            />
          ))}
        </g>

        <rect width="1200" height="800" fill="url(#meshB)" opacity="0.35" />
      </svg>
    </div>
  );
}

/** Compact escrow ring motif for the hero stage panel */
export function HeroStagePattern() {
  return (
    <svg
      className="hero-stage-pattern"
      viewBox="0 0 400 420"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="stageOrb" cx="70%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="90" r="120" fill="url(#stageOrb)" />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        strokeOpacity="0.12"
        className="hero-stage-rings"
      >
        <circle cx="80" cy="340" r="54" />
        <circle cx="80" cy="340" r="34" />
        <path d="M26 340h108M80 286v108" strokeOpacity="0.1" />
        <path
          d="M220 280c48 12 84 48 90 96"
          strokeOpacity="0.14"
          strokeWidth="1.25"
        />
      </g>
    </svg>
  );
}
