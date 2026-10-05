import React from 'react';

interface HostedLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const HostedLogo: React.FC<HostedLogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
  showSubtitle = true,
}) => {
  const isLight = variant === 'light';
  const isGold = variant === 'gold';

  const strokeColor = isGold ? '#D97706' : isLight ? '#FFFFFF' : '#18181B';
  const textColor = isGold ? 'text-amber-500' : isLight ? 'text-white' : 'text-stone-900';
  const dividerColor = isGold ? 'bg-amber-500' : isLight ? 'bg-amber-400' : 'bg-stone-800';
  const subtextColor = isGold ? 'text-amber-200/80' : isLight ? 'text-stone-300' : 'text-stone-500';

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-base tracking-wider',
    md: 'text-xl tracking-wider',
    lg: 'text-2xl tracking-widest',
    xl: 'text-3xl tracking-widest',
  };

  const subSizes = {
    sm: 'text-[7px] tracking-[0.2em]',
    md: 'text-[9px] tracking-[0.25em]',
    lg: 'text-[11px] tracking-[0.28em]',
    xl: 'text-[13px] tracking-[0.3em]',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Structural Hanger + HT Monogram Vector */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <path
            d="M 50 14 C 54 14 57 17 57 21 C 57 25 53 28 50 31 L 50 35"
            stroke={strokeColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 22 50 L 50 35 L 78 50"
            stroke={strokeColor}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 26 50 L 26 84"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="square"
          />
          <path
            d="M 26 66 L 46 66"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="square"
          />
          <path
            d="M 46 50 L 46 84"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="square"
          />
          <path
            d="M 42 50 L 76 50"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="square"
          />
          <path
            d="M 59 50 L 59 84"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="square"
          />
          <path
            d="M 46 84 L 59 84"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography: HOS|TED Hosting Nations */}
      <div className="flex flex-col justify-center">
        <div className={`font-serif font-bold uppercase leading-none flex items-center ${titleSizes[size]} ${textColor}`}>
          <span>HOS</span>
          <span className={`inline-block mx-0.5 w-[2px] h-[0.9em] rounded-full self-center ${dividerColor}`} />
          <span>TED</span>
        </div>
        {showSubtitle && (
          <span className={`font-sans font-medium uppercase mt-1 ${subSizes[size]} ${subtextColor}`}>
            Hosting Nations
          </span>
        )}
      </div>
    </div>
  );
};
