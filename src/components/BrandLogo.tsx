import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'stacked' | 'icon' | 'watermark';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  taglineClassName?: string;
  lightModeForce?: boolean; // If true, forces dark text/lines regardless of system/class
  darkModeForce?: boolean;  // If true, forces white text/lines
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  className = '',
  iconClassName = 'w-10 h-10',
  textClassName = '',
  taglineClassName = '',
  lightModeForce = false,
  darkModeForce = false,
}) => {
  // Determine color scheme classes
  const colorClass = lightModeForce
    ? 'text-[#111111] stroke-[#111111] fill-none'
    : darkModeForce
    ? 'text-white stroke-white fill-none'
    : 'text-[#111111] dark:text-white stroke-[#111111] dark:stroke-white fill-none';

  const fillClass = lightModeForce
    ? 'fill-[#111111]'
    : darkModeForce
    ? 'fill-white'
    : 'fill-[#111111] dark:fill-white';

  const textContrastClass = lightModeForce
    ? 'text-[#111111]'
    : darkModeForce
    ? 'text-white'
    : 'text-[#111111] dark:text-white';

  // The premium interlocking N-F monogram emblem
  const renderEmblem = () => (
    <svg
      viewBox="0 0 100 100"
      className={`${iconClassName} ${colorClass} transition-colors duration-300`}
      aria-hidden="true"
    >
      {/* Outer elegant delicate circle */}
      <circle
        cx="50"
        cy="50"
        r="44"
        strokeWidth="1"
        className="opacity-70"
      />
      {/* Inner thin accent circle */}
      <circle
        cx="50"
        cy="50"
        r="40"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        className="opacity-40"
      />
      
      {/* Interlocking Monogram N and F */}
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* Letter N */}
        {/* Left vertical stem with serif caps */}
        <path d="M36 32h6M39 32v36M36 68h6" strokeWidth="1.5" />
        {/* Right vertical stem with serif caps */}
        <path d="M58 32h6M61 32v36M58 68h6" strokeWidth="1.5" />
        {/* Diagonal connection (slightly offset for interlocking effect) */}
        <path d="M39 34l22 32" strokeWidth="2" />
        
        {/* Letter F (Interlocking with N) */}
        {/* F vertical stem (shares space, positioned slightly left of center/overlay) */}
        <path d="M47 38h4M49 38v24M47 62h4" strokeWidth="1.5" className="opacity-90" />
        {/* F top horizontal bar with serif end */}
        <path d="M49 42h14v-3" strokeWidth="1.5" />
        {/* F middle horizontal bar with serif end */}
        <path d="M49 49h10v-3" strokeWidth="1.5" />
      </g>
      
      {/* Small luxury diamond accents at the bottom */}
      <path
        d="M50 82 l3-3 l-3-3 l-3 3 z"
        className={fillClass}
        stroke="none"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} id="brand-logo-icon">
        {renderEmblem()}
      </div>
    );
  }

  if (variant === 'watermark') {
    return (
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-[0.03] dark:opacity-[0.02] ${className}`}
        id="brand-logo-watermark"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full max-w-[400px] aspect-square stroke-[#111111] dark:stroke-white fill-none"
        >
          <circle cx="50" cy="50" r="44" strokeWidth="0.5" />
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M36 32h6M39 32v36M36 68h6" strokeWidth="1" />
            <path d="M58 32h6M61 32v36M58 68h6" strokeWidth="1" />
            <path d="M39 34l22 32" strokeWidth="1.5" />
            <path d="M47 38h4M49 38v24M47 62h4" strokeWidth="1" />
            <path d="M49 42h14v-3" strokeWidth="1" />
            <path d="M49 49h10v-3" strokeWidth="1" />
          </g>
        </svg>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center space-y-4 ${className}`} id="brand-logo-stacked">
        {renderEmblem()}
        <div className="space-y-1">
          <h1
            className={`font-sans text-xl sm:text-2xl font-semibold tracking-[0.25em] uppercase leading-none ${textContrastClass} ${textClassName}`}
          >
            NAYAB <span className="font-light">FIT</span>
          </h1>
          <p
            className={`font-mono text-[9px] tracking-[0.3em] text-neutral-400 dark:text-neutral-500 uppercase ${taglineClassName}`}
          >
            Elegance in Every Stitch
          </p>
        </div>
      </div>
    );
  }

  // Variant === 'full'
  return (
    <div className={`inline-flex items-center space-x-3 ${className}`} id="brand-logo-full">
      {renderEmblem()}
      <div className="flex flex-col justify-center text-left leading-none">
        <span
          className={`font-sans text-lg sm:text-xl font-semibold tracking-[0.18em] uppercase ${textContrastClass} ${textClassName}`}
        >
          NAYAB <span className="font-light">FIT</span>
        </span>
        <span
          className={`font-mono text-[8px] tracking-[0.22em] text-neutral-400 dark:text-neutral-500 uppercase mt-1 ${taglineClassName}`}
        >
          Elegance in Every Stitch
        </span>
      </div>
    </div>
  );
};
