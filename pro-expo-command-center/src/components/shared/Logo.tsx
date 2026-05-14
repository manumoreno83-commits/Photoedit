import { cn } from '@/lib/cn';

interface LogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}

/**
 * Pro Expo isometric cube logo.
 * Geometry: edge 16, three visible faces in isometric projection (30 degrees).
 * Faces match the brand spec: top teal, left blue, front-right magenta to purple.
 */
export function Logo({ size = 32, className, withWordmark = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Pro Expo"
        className="shrink-0"
      >
        <defs>
          {/* Front (right) face: magenta to purple */}
          <linearGradient id="pe-front" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF4DB8" />
            <stop offset="100%" stopColor="#6B3FD4" />
          </linearGradient>
          {/* Left face: blue */}
          <linearGradient id="pe-left" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A6BD4" />
            <stop offset="100%" stopColor="#1E4FB8" />
          </linearGradient>
          {/* Top face: teal */}
          <linearGradient id="pe-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#3FD4C6" />
          </linearGradient>
          {/* Right edge highlight: teal sliver hinting the 4th face */}
          <linearGradient id="pe-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3FD4C6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2ba89e" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Front-right face: A(20,4) B(34,12) C(34,28) G(20,20) -> diamond going down-right */}
        <polygon points="20,20 34,12 34,28 20,36" fill="url(#pe-front)" />
        {/* Left face: F(6,12) G(20,20) D(20,36) E(6,28) */}
        <polygon points="6,12 20,20 20,36 6,28" fill="url(#pe-left)" />
        {/* Top face: A(20,4) F(6,12) G(20,20) B(34,12) */}
        <polygon points="20,4 6,12 20,20 34,12" fill="url(#pe-top)" />

        {/* Subtle right-edge teal sliver, the 4th teal hint */}
        <polygon points="34,12 34,28 36,27 36,13" fill="url(#pe-edge)" />

        {/* Inner edge lines for crisp isometric definition */}
        <g stroke="#0a1224" strokeWidth="0.6" strokeLinejoin="round" fill="none" opacity="0.55">
          <polyline points="20,4 6,12 6,28 20,36 34,28 34,12 20,4" />
          <polyline points="20,4 20,20 6,12" />
          <polyline points="20,20 34,12" />
          <polyline points="20,20 20,36" />
        </g>
      </svg>

      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-sm font-semibold tracking-tight text-text">Pro Expo</span>
          <span className="text-2xs font-medium text-mute">Operations Center</span>
        </span>
      )}
    </span>
  );
}
