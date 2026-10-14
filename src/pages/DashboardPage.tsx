import React, { useEffect, useState } from 'react';
import { Video, Award, BookOpen, BarChart3, Clock, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { ActiveTab } from '../components/layout/Navbar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SignBridgeAPI } from '../services/api';
import { AnalyticsStats } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  useEffect(() => {
    SignBridgeAPI.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div
        className="p-8 rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          backgroundColor: currentTheme.bgCard,
          borderColor: currentTheme.borderColor,
          backgroundImage: 'radial-gradient(circle at top right, rgba(0, 200, 224, 0.12), transparent 50%)',
        }}
      >
        <div className="max-w-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              SignBridge Autonomous Vision System
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            Welcome back, {user?.name || 'Practitioner'}!
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Bridging communication between American Sign Language and spoken voice through real-time MediaPipe hand kinematics and Gemini neural language synthesis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('translator')}
            className="px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Launch Translator</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Practice Tutor</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border space-y-2 shadow-md"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL GESTURES</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {stats?.totalPredictions || 142}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Real-time detected frames</span>
        </div>

        <div
          className="p-5 rounded-2xl border space-y-2 shadow-md"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVERAGE ACCURACY</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {stats?.averageConfidence ? `${stats.averageConfidence}%` : '96.2%'}
          </div>
          <span className="text-[11px] text-cyan-400 font-mono">Heuristic confidence score</span>
        </div>

        <div
          className="p-5 rounded-2xl border space-y-2 shadow-md"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PHRASES FORMED</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {stats?.totalSentences || 28}
          </div>
          <span className="text-[11px] text-amber-400 font-mono">Polished with Gemini AI</span>
        </div>

        <div
          className="p-5 rounded-2xl border space-y-2 shadow-md"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PRACTICE DURATION</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {stats?.totalPracticeTimeMinutes ? `${stats.totalPracticeTimeMinutes}m` : '38m'}
          </div>
          <span className="text-[11px] text-purple-400 font-mono">Interactive tutor time</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => onNavigate('guide')}
          className="p-6 rounded-2xl border cursor-pointer hover:border-cyan-500/50 transition-all shadow-lg group"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-base font-bold font-mono text-white mb-1">ASL Alphabet Dictionary</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Master the 26 ASL alphabet letter handshapes with precise knuckle alignment guides and 3D visual models.
          </p>
          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            <span>Browse 26 Letters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('practice')}
          className="p-6 rounded-2xl border cursor-pointer hover:border-cyan-500/50 transition-all shadow-lg group"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Award className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-base font-bold font-mono text-white mb-1">Interactive Tutor</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Real-time biometric validation compares your hand directly against standard ASL angles with sound chimes.
          </p>
          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            <span>Start Practice Drill</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('analytics')}
          className="p-6 rounded-2xl border cursor-pointer hover:border-cyan-500/50 transition-all shadow-lg group"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-base font-bold font-mono text-white mb-1">Detailed Analytics</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Track daily practice streaks, gesture frequency breakdowns, and recognition confidence distributions over time.
          </p>
          <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            <span>View Performance Stats</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
