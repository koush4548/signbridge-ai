import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Calendar, ShieldCheck } from 'lucide-react';
import { SignBridgeAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { AnalyticsStats } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    SignBridgeAPI.getStats()
      .then((data) => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const defaultDaily = [
    { date: 'Mon', count: 18, accuracy: 94 },
    { date: 'Tue', count: 24, accuracy: 96 },
    { date: 'Wed', count: 32, accuracy: 95 },
    { date: 'Thu', count: 29, accuracy: 97 },
    { date: 'Fri', count: 42, accuracy: 98 },
    { date: 'Sat', count: 35, accuracy: 96 },
    { date: 'Sun', count: 20, accuracy: 95 },
  ];

  const dailyData = stats?.dailyActivity && stats.dailyActivity.length > 0 ? stats.dailyActivity : defaultDaily;

  const gestureCounts = stats?.gestureCounts || {
    A: 25,
    B: 18,
    C: 22,
    HELLO: 19,
    THANK_YOU: 15,
    YES: 14,
    L: 12,
    V: 11,
  };

  const gestureData = Object.entries(gestureCounts).map(([sign, count]) => ({
    sign,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
              Kinematic Performance Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            Analytics & Accuracy Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated metrics on gesture fidelity, practice milestones, and model inference distributions.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border space-y-2 shadow-md"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <span className="text-xs font-mono text-slate-400 block">TOTAL RECOGNITIONS</span>
          <div className="text-3xl font-black font-mono text-white">
            {stats?.totalPredictions || 142}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">+12% vs last session</span>
        </div>

        <div
          className="p-5 rounded-2xl border space-y-2 shadow-md"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <span className="text-xs font-mono text-slate-400 block">AVG MODEL CONFIDENCE</span>
          <div className="text-3xl font-black font-mono text-cyan-400">
            {stats?.averageConfidence ? `${stats.averageConfidence}%` : '96.2%'}
          </div>
          <span className="text-[11px] text-cyan-400 font-mono">Precision threshold &gt; 90%</span>
        </div>

        <div
          className="p-5 rounded-2xl border space-y-2 shadow-md"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <span className="text-xs font-mono text-slate-400 block">POLISHED PHRASES</span>
          <div className="text-3xl font-black font-mono text-amber-400">
            {stats?.totalSentences || 28}
          </div>
          <span className="text-[11px] text-amber-400 font-mono">Synthesized to Natural Speech</span>
        </div>

        <div
          className="p-5 rounded-2xl border space-y-2 shadow-md"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <span className="text-xs font-mono text-slate-400 block">SESSION TIME</span>
          <div className="text-3xl font-black font-mono text-purple-400">
            {stats?.totalPracticeTimeMinutes ? `${stats.totalPracticeTimeMinutes}m` : '38m'}
          </div>
          <span className="text-[11px] text-purple-400 font-mono">Live vision tracking active</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div
          className="p-6 rounded-2xl border shadow-xl space-y-4"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono text-white tracking-wide">
              DAILY GESTURE VOLUME & SESSIONS
            </h2>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#00c8e0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accuracy Trend Chart */}
        <div
          className="p-6 rounded-2xl border shadow-xl space-y-4"
          style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono text-white tracking-wide">
              ACCURACY PROGRESSION TREND (%)
            </h2>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[80, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
