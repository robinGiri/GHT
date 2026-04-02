/**
 * Inline SVG Nepali cultural motifs.
 * Each icon is a lightweight, accessible, decorative element.
 * Usage: <Mandala />, <Lotus />, <Stupa />, <PrayerWheel />, <EndlessKnot />, <Dorje />
 */

export function Mandala({ size = 64, className = "" }) {
  return (
    <svg
      className={`nepali-icon nepali-mandala ${className}`}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="6" fill="currentColor" opacity="0.15" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={50 + 6 * Math.cos(rad)}
            y1={50 + 6 * Math.sin(rad)}
            x2={50 + 47 * Math.cos(rad)}
            y2={50 + 47 * Math.sin(rad)}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.4"
          />
        );
      })}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={50 + 33 * Math.cos(rad)}
            cy={50 + 33 * Math.sin(rad)}
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          />
        );
      })}
    </svg>
  );
}

export function Lotus({ size = 48, className = "" }) {
  return (
    <svg
      className={`nepali-icon nepali-lotus ${className}`}
      viewBox="0 0 80 50"
      width={size}
      height={size * 0.625}
      aria-hidden="true"
      focusable="false"
    >
      {/* Center petal */}
      <path d="M40 5 Q45 20 40 40 Q35 20 40 5Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="0.8" />
      {/* Left petals */}
      <path d="M40 40 Q25 25 15 10 Q30 18 40 40Z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="0.8" />
      <path d="M40 40 Q18 30 5 20 Q22 25 40 40Z" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="0.8" />
      {/* Right petals */}
      <path d="M40 40 Q55 25 65 10 Q50 18 40 40Z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="0.8" />
      <path d="M40 40 Q62 30 75 20 Q58 25 40 40Z" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="0.8" />
      {/* Base */}
      <ellipse cx="40" cy="43" rx="12" ry="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export function Stupa({ size = 48, className = "" }) {
  return (
    <svg
      className={`nepali-icon nepali-stupa ${className}`}
      viewBox="0 0 60 80"
      width={size * 0.75}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {/* Pinnacle */}
      <line x1="30" y1="2" x2="30" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="30" cy="4" r="2" fill="currentColor" opacity="0.3" />
      {/* Harmika (cube with eyes) */}
      <rect x="22" y="14" width="16" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="27" cy="20" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="33" cy="20" r="1.5" fill="currentColor" opacity="0.4" />
      {/* Dome */}
      <path d="M12 42 Q12 26 30 26 Q48 26 48 42Z" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.2" />
      {/* Base tiers */}
      <rect x="8" y="42" width="44" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="5" y="48" width="50" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="2" y="54" width="56" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Ground */}
      <line x1="0" y1="60" x2="60" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

export function PrayerWheel({ size = 48, className = "" }) {
  return (
    <svg
      className={`nepali-icon nepali-prayer-wheel ${className}`}
      viewBox="0 0 50 70"
      width={size * 0.714}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {/* Handle */}
      <line x1="25" y1="50" x2="25" y2="68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Cylinder body */}
      <rect x="10" y="10" width="30" height="40" rx="4" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="1.2" />
      {/* Mantra lines */}
      <line x1="15" y1="18" x2="35" y2="18" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <line x1="15" y1="23" x2="35" y2="23" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <line x1="15" y1="28" x2="35" y2="28" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <line x1="15" y1="33" x2="35" y2="33" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <line x1="15" y1="38" x2="35" y2="38" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <line x1="15" y1="43" x2="35" y2="43" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Top and bottom caps */}
      <ellipse cx="25" cy="10" rx="15" ry="3" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="25" cy="50" rx="15" ry="3" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Center emblem */}
      <circle cx="25" cy="30" r="5" fill="none" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export function EndlessKnot({ size = 48, className = "" }) {
  return (
    <svg
      className={`nepali-icon nepali-endless-knot ${className}`}
      viewBox="0 0 60 60"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M15 15 L30 5 L45 15 L45 30 L55 30 L45 45 L30 55 L15 45 L5 30 L15 30Z
           M15 15 L15 30 M45 15 L45 30 M15 45 L30 55 M45 45 L30 55
           M30 5 L30 20 M5 30 L20 30 M55 30 L40 30 M30 40 L30 55"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <rect x="20" y="20" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

export function Dorje({ size = 48, className = "" }) {
  return (
    <svg
      className={`nepali-icon nepali-dorje ${className}`}
      viewBox="0 0 80 30"
      width={size}
      height={size * 0.375}
      aria-hidden="true"
      focusable="false"
    >
      {/* Center sphere */}
      <circle cx="40" cy="15" r="5" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1" />
      {/* Left prongs */}
      <path d="M35 15 Q25 8 8 5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M35 15 Q25 15 8 15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M35 15 Q25 22 8 25" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Right prongs */}
      <path d="M45 15 Q55 8 72 5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M45 15 Q55 15 72 15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M45 15 Q55 22 72 25" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Left lotus base */}
      <ellipse cx="32" cy="15" rx="3" ry="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
      {/* Right lotus base */}
      <ellipse cx="48" cy="15" rx="3" ry="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export function MountainRange({ className = "" }) {
  return (
    <svg
      className={`nepali-icon nepali-mountains ${className}`}
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0,60 L20,35 L35,42 L55,18 L70,30 L85,12 L100,28 L115,8 L130,25 L145,15 L160,32 L175,22 L190,38 L200,30 L200,60Z"
        fill="currentColor"
        opacity="0.06"
      />
      <path
        d="M0,60 L20,35 L35,42 L55,18 L70,30 L85,12 L100,28 L115,8 L130,25 L145,15 L160,32 L175,22 L190,38 L200,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
      />
    </svg>
  );
}
