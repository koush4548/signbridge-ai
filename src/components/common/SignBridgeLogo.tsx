import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface SignBridgeLogoProps {
  variant?: 'mark' | 'horizontal' | 'stacked' | 'badge' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showTagline?: boolean;
}

export const SignBridgeLogo: React.FC<SignBridgeLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  let themeContext: ReturnType<typeof useTheme> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    themeContext = useTheme();
  } catch {
    // Graceful fallback if used outside ThemeProvider
  }

  const currentTheme = themeContext?.currentTheme;

  // Dimension calculation
  const getDimensions = () => {
    if (typeof size === 'number') {
      return { markSize: size, height: size, textClass: 'text-xl', badgeClass: 'text-xs px-2 py-0.5' };
    }
    switch (size) {
      case 'sm':
        return { markSize: 28, textClass: 'text-sm sm:text-base', badgeClass: 'text-[9px] px-1 py-0.2' };
      case 'lg':
        return { markSize: 52, textClass: 'text-2xl', badgeClass: 'text-xs px-2 py-0.5' };
      case 'xl':
        return { markSize: 84, textClass: 'text-3xl sm:text-4xl', badgeClass: 'text-sm px-2.5 py-1' };
      case 'md':
      default:
        return { markSize: 42, textClass: 'text-lg sm:text-xl', badgeClass: 'text-[10px] px-1.5 py-0.5' };
    }
  };

  const dims = getDimensions();

  // Vector Logo Icon Component: Hand-crafted exact replica of the user-provided emblem
  const LogoMark = ({ width = dims.markSize, height = dims.markSize }: { width?: number; height?: number }) => (
    <div
      className="relative shrink-0 flex items-center justify-center select-none"
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(2,132,199,0.35)] transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Upper Vibrant Cyan/Azure Gradient */}
          <linearGradient id="sbTealGrad" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="35%" stopColor="#0284c7" />
            <stop offset="75%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          {/* Lower Deep Navy/Cobalt Gradient */}
          <linearGradient id="sbNavyGrad" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="45%" stopColor="#1e3a8a" />
            <stop offset="85%" stopColor="#172554" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Central Bridge Accent Glow */}
          <linearGradient id="sbBridgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        <g transform="translate(250, 245)">
          {/* 1. LOWER DEEP NAVY HAND (Bottom Arch of the 'S') */}
          <path
            d="M 50 20
               C 120 40, 160 85, 140 145
               C 118 208, 30 228, -60 215
               C -130 205, -170 150, -165 95
               C -160 48, -135 15, -95 -2
               C -88 -5, -80 5, -84 12
               C -112 50, -120 115, -70 152
               C -25 186, 60 176, 95 130
               C 118 100, 110 55, 45 32
               Z"
            fill="url(#sbNavyGrad)"
          />

          {/* Lower Hand Palm & Gesture Fingers cupping upward */}
          <circle cx="-68" cy="118" r="13.5" fill="#1e3a8a" />

          <path
            d="M -132 58
               C -132 40, -114 42, -110 60
               C -98 108, -65 142, -18 142
               C -5 142, -5 160, -18 160
               C -80 160, -122 110, -132 58
               Z"
            fill="url(#sbNavyGrad)"
          />

          <path
            d="M -152 35
               C -152 18, -134 20, -130 38
               C -120 85, -92 120, -42 124
               C -30 125, -30 140, -42 140
               C -102 136, -138 92, -152 35
               Z"
            fill="url(#sbNavyGrad)"
          />

          <path
            d="M -168 15
               C -168 -2, -152 0, -148 16
               C -140 55, -122 92, -75 102
               C -64 104, -64 118, -75 118
               C -128 112, -158 68, -168 15
               Z"
            fill="url(#sbNavyGrad)"
          />

          {/* 2. SUSPENSION BRIDGE (Central Crossing) */}
          <g transform="translate(-10, -12)">
            <path
              d="M -80 14 Q 10 10, 100 14"
              stroke="#0284c7"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <line x1="10" y1="-56" x2="10" y2="14" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
            <polygon points="10,-65 4,-54 16,-54" fill="#0284c7" />
            <path
              d="M -75 12 Q 10 -52, 10 -56 Q 10 -52, 95 12"
              stroke="#38bdf8"
              strokeWidth="3"
              fill="none"
            />
            <line x1="-58" y1="5" x2="-58" y2="14" stroke="#0284c7" strokeWidth="1.8" />
            <line x1="-40" y1="-8" x2="-40" y2="14" stroke="#0284c7" strokeWidth="1.8" />
            <line x1="-22" y1="-24" x2="-22" y2="14" stroke="#0284c7" strokeWidth="1.8" />
            <line x1="-6" y1="-44" x2="-6" y2="14" stroke="#0284c7" strokeWidth="1.8" />
            <line x1="26" y1="-44" x2="26" y2="14" stroke="#0284c7" strokeWidth="1.8" />
            <line x1="42" y1="-24" x2="42" y2="14" stroke="#0284c7" strokeWidth="1.8" />
            <line x1="60" y1="-8" x2="60" y2="14" stroke="#0284c7" strokeWidth="1.8" />
            <line x1="78" y1="5" x2="78" y2="14" stroke="#0284c7" strokeWidth="1.8" />
          </g>

          {/* 3. UPPER VIBRANT CYAN/AZURE HAND (Top Arch of the 'S') */}
          <path
            d="M -10 10
               C -75 -10, -145 -60, -125 -135
               C -105 -205, -20 -230, 60 -215
               C 125 -202, 155 -152, 150 -105
               C 145 -55, 110 -20, 45 -5
               C 38 -3, 34 -15, 42 -18
               C 88 -38, 108 -80, 95 -125
               C 80 -178, -10 -185, -60 -148
               C -98 -118, -80 -65, -15 -40
               Z"
            fill="url(#sbTealGrad)"
          />

          <circle cx="82" cy="-210" r="13.5" fill="#38bdf8" />

          <path
            d="M 92 -190
               C 95 -208, 115 -205, 115 -188
               C 112 -135, 78 -85, 25 -72
               C 12 -69, 12 -84, 24 -87
               C 65 -98, 90 -142, 92 -190
               Z"
            fill="url(#sbTealGrad)"
          />

          <path
            d="M 115 -170
               C 120 -186, 138 -180, 135 -164
               C 130 -120, 102 -75, 52 -62
               C 40 -59, 40 -74, 50 -76
               C 90 -88, 112 -126, 115 -170
               Z"
            fill="url(#sbTealGrad)"
          />

          <path
            d="M 136 -146
               C 144 -160, 160 -150, 154 -136
               C 145 -100, 125 -65, 78 -52
               C 68 -50, 68 -64, 76 -66
               C 114 -76, 132 -108, 136 -146
               Z"
            fill="url(#sbTealGrad)"
          />
        </g>
      </svg>
    </div>
  );

  // Variant: Mark only
  if (variant === 'mark') {
    return <LogoMark />;
  }

  // Variant: Stacked (Exact arrangement matching the provided visual branding)
  if (variant === 'stacked' || variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <LogoMark width={dims.markSize * 1.8} height={dims.markSize * 1.8} />
        
        {/* SignBridge AI Typographic Wordmark */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{ color: currentTheme?.textPrimary || '#0f172a' }}
          >
            Sign<span style={{ color: currentTheme?.accentPrimary || '#0284c7' }}>Bridge</span>
          </span>
          <span
            className="px-2.5 py-1 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md font-mono tracking-wider"
            style={{ background: currentTheme?.accentGradient || 'linear-gradient(135deg, #0284c7, #2563eb)' }}
          >
            AI
          </span>
        </div>

        {/* Motto / Subtitle */}
        <div
          className="text-[10px] sm:text-xs uppercase tracking-[0.26em] font-semibold mt-2 font-mono"
          style={{ color: currentTheme?.textSecondary || '#64748b' }}
        >
          BRIDGING HANDS. CONNECTING MINDS.
        </div>

        {/* Aesthetic Minimalist Glow Bar */}
        <div className="mt-3 flex items-center justify-center">
          <div
            className="w-32 h-1 rounded-full relative overflow-hidden"
            style={{ backgroundColor: currentTheme?.borderColor || '#e2e8f0' }}
          >
            <div
              className="absolute left-6 top-0 bottom-0 w-8 rounded-full"
              style={{ backgroundColor: currentTheme?.accentPrimary || '#0284c7' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Variant: Badge style (Pill container)
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border shadow-sm ${className}`}
        style={{
          backgroundColor: currentTheme?.bgCard || '#ffffff',
          borderColor: currentTheme?.borderColor || '#e2e8f0',
        }}
      >
        <LogoMark width={26} height={26} />
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: currentTheme?.textPrimary || '#0f172a' }}
        >
          Sign<span style={{ color: currentTheme?.accentPrimary || '#0284c7' }}>Bridge</span>{' '}
          <span
            className="font-mono text-xs font-bold"
            style={{ color: currentTheme?.accentPrimary || '#0284c7' }}
          >
            AI
          </span>
        </span>
      </div>
    );
  }

  // Default Variant: Horizontal Brand Banner (Ideal for Navbar & Headers)
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <LogoMark />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 leading-none">
          <span
            className={`font-extrabold tracking-tight ${dims.textClass}`}
            style={{ color: currentTheme?.textPrimary || '#0f172a' }}
          >
            Sign<span style={{ color: currentTheme?.accentPrimary || '#0284c7' }}>Bridge</span>
          </span>
          <span
            className={`rounded-lg text-white font-black font-mono shadow-sm tracking-wider ${dims.badgeClass}`}
            style={{ background: currentTheme?.accentGradient || 'linear-gradient(135deg, #0284c7, #2563eb)' }}
          >
            AI
          </span>
        </div>
        {showTagline && (
          <span
            className="text-[9px] uppercase tracking-[0.22em] font-semibold leading-none mt-1.5 font-mono"
            style={{ color: currentTheme?.textSecondary || '#64748b' }}
          >
            BRIDGING HANDS. CONNECTING MINDS.
          </span>
        )}
      </div>
    </div>
  );
};
