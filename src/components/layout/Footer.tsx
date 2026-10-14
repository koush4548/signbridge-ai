import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { SignBridgeLogo } from '../common/SignBridgeLogo';

export const Footer: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <footer
      id="app-footer"
      className="border-t py-6 mt-10 text-[10px] uppercase tracking-[0.2em] transition-colors"
      style={{
        borderColor: currentTheme.borderColor,
        color: currentTheme.textMuted,
        backgroundColor: currentTheme.bgSurface,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SignBridgeLogo variant="horizontal" size="sm" showTagline={true} />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Vision Core Active
          </span>
          <span>126-D Feature Scaler</span>
          <span>MediaPipe 21-Landmark Mesh</span>
          <span style={{ color: currentTheme.accentTertiary }}>SignBridge v2.5</span>
        </div>
        <div style={{ color: currentTheme.textMuted }}>
          © 2026 SignBridge AI • Bridging Hands. Connecting Minds.
        </div>
      </div>
    </footer>
  );
};

