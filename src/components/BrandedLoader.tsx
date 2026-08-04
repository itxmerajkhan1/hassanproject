import React from 'react';
import { BrandLogo } from './BrandLogo';

interface BrandedLoaderProps {
  variant?: 'full' | 'inline' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  lightModeForce?: boolean;
}

export const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  variant = 'inline',
  size = 'md',
  className = '',
  lightModeForce = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const textContrastClass = lightModeForce
    ? 'text-[#111111]'
    : 'text-[#111111] dark:text-white';

  if (variant === 'full') {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#0A0A0A] transition-colors duration-500 ${className}`}>
        {/* Pulsing & Fading Monogram Backdrop */}
        <div className="relative flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            {/* Spinning accent outer ring */}
            <div className="absolute inset-0 rounded-full border border-neutral-100 dark:border-neutral-900 border-t-neutral-800 dark:border-t-white animate-spin duration-1000 w-[72px] h-[72px] -m-1" />
            
            <div className="w-16 h-16 animate-pulse duration-1000">
              <BrandLogo
                variant="icon"
                iconClassName="w-16 h-16"
                lightModeForce={lightModeForce}
              />
            </div>
          </div>
          
          <div className="text-center space-y-1.5 animate-pulse duration-1000 delay-300">
            <h2 className={`font-sans text-xs font-semibold tracking-[0.3em] uppercase ${textContrastClass}`}>
              NAYAB FIT
            </h2>
            <p className="font-mono text-[8px] tracking-[0.25em] text-neutral-400 uppercase">
              Bespoke Couture Atelier
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <span className={`inline-flex items-center justify-center gap-2 ${className}`}>
        {/* Minimal elegant rotating micro icon */}
        <span className="animate-spin duration-1000 inline-block w-4 h-4">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-current fill-none" strokeWidth="12">
            <circle cx="50" cy="50" r="40" className="opacity-30" />
            <path d="M50 10 a40 40 0 0 1 40 40" strokeLinecap="round" />
          </svg>
        </span>
        <span className="font-mono text-[10px] tracking-widest uppercase">Securing...</span>
      </span>
    );
  }

  // Variant === 'inline'
  return (
    <div className={`flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
      <div className="relative animate-pulse">
        <div className="absolute inset-0 rounded-full border border-neutral-100 dark:border-neutral-900 border-t-neutral-800 dark:border-t-white animate-spin duration-1000 w-[44px] h-[44px] -m-0.5" />
        <BrandLogo
          variant="icon"
          iconClassName={sizeClasses[size]}
          lightModeForce={lightModeForce}
        />
      </div>
      <span className="font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase animate-pulse">
        Loading Atelier...
      </span>
    </div>
  );
};
