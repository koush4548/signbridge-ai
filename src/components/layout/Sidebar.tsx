import React from 'react';
import {
  LayoutDashboard,
  Camera,
  Activity,
  BookOpen,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  Cpu,
  User as UserIcon,
  LogOut,
  Sparkles,
  Zap,
  Radio,
  Mic,
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SignBridgeLogo } from '../common/SignBridgeLogo';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();

  const navItems: {
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Overview Dashboard',
      description: 'Analytics & telemetry',
      icon: LayoutDashboard,
    },
    {
      id: 'translator',
      label: 'Live ASL Translator',
      description: 'Webcam & multi-modal',
      icon: Camera,
      badge: 'LIVE',
    },
    {
      id: 'transcriber',
      label: 'Speech & Audio Studio',
      description: 'Voice to ASL Gloss',
      icon: Mic,
      badge: 'AUDIO',
    },
    {
      id: 'practice',
      label: 'Practice Tutor',
      description: 'Interactive drills',
      icon: Activity,
    },
    {
      id: 'guide',
      label: 'ASL Alphabet Guide',
      description: '3D landmark dictionary',
      icon: BookOpen,
    },
    {
      id: 'analytics',
      label: 'Neural & Data Hub',
      description: 'Benchmarks & accuracy',
      icon: BarChart3,
    },
    {
      id: 'history',
      label: 'History & Logs',
      description: 'Saved signs & transcripts',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Settings & Profile',
      description: 'Calibration & parameters',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        id="app-vertical-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col justify-between border-r transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64 sm:w-72'}`}
        style={{
          backgroundColor: currentTheme.bgCard,
          borderColor: currentTheme.borderColor,
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Top Header & Brand */}
        <div
          className={`border-b transition-all duration-300 ${
            isCollapsed ? 'p-3 flex items-center justify-center' : 'p-4 flex items-center justify-between gap-2'
          }`}
          style={{ borderColor: currentTheme.borderColor }}
        >
          {isCollapsed ? (
            /* Minimized features bar: The arrow mark is removed and replaced with the website logo. Touching or clicking the logo maximizes the features bar */
            <button
              id="sidebar-logo-maximize-btn"
              type="button"
              onClick={() => setIsCollapsed(false)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setIsCollapsed(false);
              }}
              title="Touch or click logo to maximize features bar"
              aria-label="Maximize features bar"
              className="group relative flex items-center justify-center p-2 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:border-sky-500/60 active:scale-95 focus:outline-none"
              style={{
                backgroundColor: currentTheme.bgSurface,
                borderColor: currentTheme.borderColor,
              }}
            >
              <div className="transform transition-transform duration-300 group-hover:scale-110">
                <SignBridgeLogo variant="mark" size={38} />
              </div>

              {/* Gentle subtle pulse indicator ring showing it can be expanded */}
              <span
                className="absolute -top-1 -right-1 flex h-2.5 w-2.5"
                title="Tap to maximize"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
              </span>
            </button>
          ) : (
            /* Maximized features bar: Logo & Brand on left, Arrow mark on right to minimize */
            <>
              <div
                onClick={() => handleNavClick('dashboard')}
                className="flex items-center gap-3 cursor-pointer overflow-hidden group select-none"
                title="SignBridge AI - Go to Dashboard"
              >
                <div className="shrink-0 transition-transform group-hover:scale-105 duration-200">
                  <SignBridgeLogo variant="mark" size={38} />
                </div>
                <div className="flex flex-col justify-center min-w-0 transition-opacity duration-200">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-extrabold text-base tracking-tight truncate" style={{ color: currentTheme.textPrimary }}>
                      Sign<span className="text-[#0284c7]">Bridge</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-white font-bold text-[10px] font-mono shadow-sm" style={{ background: currentTheme.accentGradient }}>
                      AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shrink-0" />
                    <span className="text-[9px] uppercase tracking-wider font-semibold truncate font-mono" style={{ color: currentTheme.textMuted }}>
                      Neural Vision OS
                    </span>
                  </div>
                </div>
              </div>

              {/* Sidebar Collapse Toggle Button (Arrow mark to minimize) */}
              <button
                id="sidebar-toggle-btn"
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Minimize features bar"
                aria-label="Minimize features bar"
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 cursor-pointer shrink-0 hover:scale-105"
                style={{
                  backgroundColor: currentTheme.bgSurface,
                  borderColor: currentTheme.borderColor,
                  color: currentTheme.textSecondary,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Vertical Feature Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
          <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] font-mono ${isCollapsed ? 'text-center' : ''}`} style={{ color: currentTheme.textMuted }}>
            {isCollapsed ? '•••' : 'Main Features'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group relative"
                style={{
                  backgroundColor: isActive ? currentTheme.badgeBg : 'transparent',
                  border: isActive ? `1px solid ${currentTheme.borderHover}` : '1px solid transparent',
                  color: isActive ? currentTheme.accentPrimary : currentTheme.textSecondary,
                }}
              >
                {/* Feature Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: isActive ? `${currentTheme.accentPrimary}18` : currentTheme.bgSurface,
                    color: isActive ? currentTheme.accentPrimary : currentTheme.textMuted,
                    border: `1px solid ${isActive ? currentTheme.borderHover : currentTheme.borderColor}`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Text Label & Subtitle (when not collapsed) */}
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`truncate ${isActive ? 'font-bold' : 'font-medium'}`} style={{ color: isActive ? currentTheme.textPrimary : currentTheme.textSecondary }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded animate-pulse"
                          style={{
                            backgroundColor: `${currentTheme.accentPrimary}15`,
                            color: currentTheme.accentPrimary,
                            border: `1px solid ${currentTheme.accentPrimary}40`,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Active Dot Indicator */}
                {isActive && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <span
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{
                        backgroundColor: currentTheme.accentPrimary,
                        color: currentTheme.accentPrimary,
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Engine Status & User Profile */}
        <div className="p-3 border-t space-y-2.5" style={{ borderColor: currentTheme.borderColor }}>
          {/* Relational / Neural Engine Status Card */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            style={{
              backgroundColor: currentTheme.bgSurface,
              borderColor: currentTheme.borderColor,
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${currentTheme.accentPrimary}15`,
                border: `1px solid ${currentTheme.accentPrimary}30`,
                color: currentTheme.accentPrimary,
              }}
            >
              <Cpu className="w-3.5 h-3.5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-[9px] uppercase font-mono tracking-wider font-bold leading-none" style={{ color: currentTheme.textMuted }}>
                  NEURAL ENGINE
                </div>
                <div className="text-[11px] font-semibold truncate flex items-center gap-1 mt-0.5" style={{ color: currentTheme.accentPrimary }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: currentTheme.accentPrimary }} />
                  <span>MediaPipe + Gemini Synced</span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div
            onClick={() => handleNavClick('settings')}
            className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer group transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
            style={{
              backgroundColor: currentTheme.bgSurface,
              borderColor: currentTheme.borderColor,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
              style={{ background: currentTheme.accentGradient }}
            >
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-bold transition-colors truncate" style={{ color: currentTheme.textPrimary }}>
                  {user ? user.name : 'Koushik'}
                </div>
                <div className="text-[10px] font-mono truncate" style={{ color: currentTheme.textMuted }}>
                  {user ? user.email || 'koushigans7@gmail.com' : 'User Profile'}
                </div>
              </div>
            )}
            {!isCollapsed && (
              <Settings className="w-3.5 h-3.5 transition-colors shrink-0" style={{ color: currentTheme.textMuted }} />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
