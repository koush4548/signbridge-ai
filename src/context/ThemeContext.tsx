import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '../types';

export const THEMES: Record<string, Theme> = {
  cyberDark: {
    id: 'cyberDark',
    name: 'Cyberpunk Dark',
    bgMain: '#040714',
    bgCard: '#090e1f',
    bgSurface: '#0f172a',
    bgHeader: '#060a18',
    borderColor: '#1e294b',
    borderHover: '#00f0ff',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accentPrimary: '#00f0ff',
    accentSecondary: '#38bdf8',
    accentTertiary: '#a855f7',
    badgeBg: 'rgba(0, 240, 255, 0.12)',
    accentGradient: 'linear-gradient(135deg, #00f0ff 0%, #0ea5e9 50%, #8b5cf6 100%)',
    glowColor: 'rgba(0, 240, 255, 0.45)',
  },
  deepMidnight: {
    id: 'deepMidnight',
    name: 'Deep Midnight',
    bgMain: '#030712',
    bgCard: '#0f172a',
    bgSurface: '#1e293b',
    bgHeader: '#0b1120',
    borderColor: '#334155',
    borderHover: '#38bdf8',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    accentPrimary: '#38bdf8',
    accentSecondary: '#818cf8',
    accentTertiary: '#a855f7',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    accentGradient: 'linear-gradient(135deg, #38bdf8, #818cf8)',
    glowColor: 'rgba(56, 189, 248, 0.4)',
  },
  emeraldTech: {
    id: 'emeraldTech',
    name: 'Emerald Terminal',
    bgMain: '#02120b',
    bgCard: '#062417',
    bgSurface: '#0b3824',
    bgHeader: '#041c11',
    borderColor: '#134e32',
    borderHover: '#10b981',
    textPrimary: '#ecfdf5',
    textSecondary: '#a7f3d0',
    textMuted: '#6ee7b7',
    accentPrimary: '#10b981',
    accentSecondary: '#34d399',
    accentTertiary: '#059669',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    accentGradient: 'linear-gradient(135deg, #10b981, #34d399)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  themeId: string;
  setTheme: (id: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always lock onto Cyberpunk Dark UI and clear any legacy emerald/green themes
  const [themeId, setThemeId] = useState<string>(() => {
    try {
      localStorage.setItem('sb_theme', 'cyberDark');
    } catch {}
    return 'cyberDark';
  });

  const currentTheme = THEMES.cyberDark;

  const setTheme = (id: string) => {
    if (THEMES[id]) {
      setThemeId(id);
      try {
        localStorage.setItem('sb_theme', id);
      } catch {}
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('sb_theme', 'cyberDark');
    } catch {}
    document.documentElement.style.backgroundColor = currentTheme.bgMain;
  }, [currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeId: 'cyberDark',
        setTheme,
        availableThemes: Object.values(THEMES),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
