import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  isDark?: boolean;
}

export function Logo({ size = 48, className = '', isDark = true, ...props }: LogoProps) {
  const maskId = React.useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <defs>
        {/* Negative space fold notch mask ensuring clean rendering on any background */}
        <mask id={maskId}>
          <rect width="512" height="512" fill="#FFFFFF" />
          <polygon points="216,236 272,256 216,276" fill="#000000" />
        </mask>
      </defs>

      <g fill={isDark ? '#FFFFFF' : '#0D0D0D'} mask={`url(#${maskId})`}>
        {/* Left Vertical Stem */}
        <rect x="136" y="112" width="52" height="288" rx="10" />

        {/* Upper Folded Ribbon Arm */}
        <path d="M 216,220 L 328,116 C 342,103 364,113 364,132 L 364,180 C 364,192 357,203 347,210 L 256,276 Z" />

        {/* Lower Folded Ribbon Arm */}
        <path
          d="M 216,252 L 347,368 C 357,377 364,388 364,401 C 364,420 341,430 327,416 L 216,308 Z"
          opacity="0.9"
        />

        {/* Focal Dot Accent */}
        <circle cx="340" cy="256" r="14" opacity="0.95" />
      </g>
    </svg>
  );
}

export function LogoBadge({
  size = 48,
  isDark = true,
  className = '',
}: {
  size?: number;
  isDark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl transition-colors shadow-lg ${
        isDark
          ? 'bg-[#202020] border border-white/10 shadow-black/40'
          : 'bg-white border border-gray-200/80 shadow-gray-200/60'
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <Logo size={size * 0.65} isDark={isDark} />
    </div>
  );
}

export default Logo;
