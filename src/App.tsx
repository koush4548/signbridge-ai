import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TranslatorProvider } from './context/TranslatorContext';
import { ActiveTab } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Footer } from './components/layout/Footer';
import { TranslatorPage } from './pages/TranslatorPage';
import { PracticeTutorPage } from './pages/PracticeTutorPage';
import { AlphabetGuidePage } from './pages/AlphabetGuidePage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AudioTranscriberPage } from './pages/AudioTranscriberPage';

function AppContent() {
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [guideInitialLetter, setGuideInitialLetter] = useState<string | null>(null);
  const [practiceTargetSign, setPracticeTargetSign] = useState<string | null>(null);

  const handleOpenGuideWithLetter = (letter?: string) => {
    if (letter) setGuideInitialLetter(letter);
    setActiveTab('guide');
  };

  const handlePracticeSpecificLetter = (letter: string) => {
    setPracticeTargetSign(letter);
    setActiveTab('practice');
  };

  return (
    <div
      id="app-root"
      className="min-h-screen flex font-sans transition-colors duration-300 selection:bg-[#00c8e0] selection:text-black relative overflow-x-hidden"
      style={{
        backgroundColor: currentTheme.bgMain,
        color: currentTheme.textSecondary,
      }}
    >
      {/* 1. Vertical Sidebar Navigation (Left) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* 2. Main Layout Area (Right) */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={setActiveTab}
        />

        {/* Dynamic Page Views */}
        <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
          {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}

          {activeTab === 'translator' && (
            <TranslatorPage
              onOpenAlphabetGuide={handleOpenGuideWithLetter}
              onNavigateToTranscriber={() => setActiveTab('transcriber')}
            />
          )}

          {activeTab === 'transcriber' && (
            <AudioTranscriberPage onOpenAlphabetGuide={handleOpenGuideWithLetter} />
          )}

          {activeTab === 'practice' && <PracticeTutorPage initialSign={practiceTargetSign} />}

          {activeTab === 'guide' && (
            <AlphabetGuidePage
              initialLetter={guideInitialLetter}
              onPracticeLetter={handlePracticeSpecificLetter}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'history' && <HistoryPage />}

          {activeTab === 'settings' && <SettingsPage />}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TranslatorProvider>
          <AppContent />
        </TranslatorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
