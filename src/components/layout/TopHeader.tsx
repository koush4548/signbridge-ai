import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Maximize,
  Minimize,
  User as UserIcon,
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface TopHeaderProps {
  activeTab: ActiveTab;
  onOpenMobileSidebar: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onNavigate,
}) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic Page titles and descriptions based on active tab
  const tabMeta: Record<ActiveTab, { title: string; subtitle: string; badge: string }> = {
    dashboard: {
      title: 'SignBridge AI Overview Dashboard',
      subtitle: 'Real-time telemetry, model metrics & gesture recognition telemetry.',
      badge: 'Vision Neural Core Connected',
    },
    translator: {
      title: 'Live ASL Vision Translator',
      subtitle: 'Multi-modal webcam gesture recognition, continuous sentence synthesis & speech output.',
      badge: 'MediaPipe 21-Landmark Core Live',
    },
    transcriber: {
      title: 'Speech & Audio Transcriber Studio',
      subtitle: 'Speech-to-text audio synthesis, bilingual translation & ASL Gloss sign breakdown.',
      badge: 'Multimodal Audio AI Live',
    },
    practice: {
      title: 'Interactive ASL Practice Tutor',
      subtitle: 'Dynamic fingerspelling drills, realtime feedback & learning streaks.',
      badge: 'AI Interactive Evaluation',
    },
    guide: {
      title: 'ASL Alphabet & Landmark Reference Guide',
      subtitle: 'Interactive 3D hand landmarks, articulation angles & fingerspelling dictionary.',
      badge: '26 Calibrated ASL Classes',
    },
    analytics: {
      title: 'Neural Engine & Data Science Hub',
      subtitle: 'Confusion matrix, landmark spatial variance, class confidence & latency traces.',
      badge: '126-D StandardScaler Synced',
    },
    history: {
      title: 'Session History & Transcripts Log',
      subtitle: 'Review logged predictions, synthesized phrases, and export ASL transcripts.',
      badge: 'Persistent Local Store',
    },
    settings: {
      title: 'System Settings & Profile Calibration',
      subtitle: 'Confidence thresholds, inference rates, camera feeds, speech TTS, and profile calibration.',
      badge: 'Constant White & Blue',
    },
  };

  const currentMeta = tabMeta[activeTab] || tabMeta.dashboard;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 border-b backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 transition-colors duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
      style={{
        backgroundColor: currentTheme.bgHeader,
        borderColor: currentTheme.borderColor,
        color: currentTheme.textSecondary,
      }}
    >
      {/* Left: Mobile Toggle + Page Heading */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="mobile-sidebar-toggle-btn"
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl border lg:hidden text-slate-500 hover:text-slate-900 transition-colors shrink-0"
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.borderColor,
          }}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate" style={{ color: currentTheme.textPrimary }}>
              {currentMeta.title}
            </h1>
          </div>
          <p className="text-xs truncate hidden sm:block mt-0.5" style={{ color: currentTheme.textMuted }}>
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: User Profile, AI Connected Pill & Fullscreen */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap justify-end">
        {/* User Profile Pill in Upper Right */}
        <button
          id="top-user-profile-btn"
          onClick={() => onNavigate && onNavigate('settings')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-left group cursor-pointer hover:shadow-sm"
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.borderColor,
          }}
          title="View & Edit User Profile"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
            style={{ background: currentTheme.accentGradient }}
          >
            <UserIcon className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-[9px] uppercase font-mono tracking-wider font-bold leading-none flex items-center gap-1" style={{ color: currentTheme.accentTertiary }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>User Profile</span>
            </div>
            <div className="text-xs font-semibold group-hover:text-[#0284c7] transition-colors truncate max-w-[120px]" style={{ color: currentTheme.textPrimary }}>
              {user ? user.name : 'Koushik'}
            </div>
          </div>
        </button>

        {/* AI Advisor Connected Badge */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all"
          style={{
            backgroundColor: currentTheme.badgeBg,
            borderColor: currentTheme.borderHover,
            color: currentTheme.accentPrimary,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
          <span className="truncate max-w-[180px] sm:max-w-none">{currentMeta.badge}</span>
        </div>

        {/* Fullscreen Button */}
        <button
          id="top-fullscreen-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          className="p-2 rounded-xl border transition-colors cursor-pointer"
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.borderColor,
            color: currentTheme.textSecondary,
          }}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

