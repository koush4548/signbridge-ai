import React, { useEffect, useState } from 'react';
import { History, Trash2, Volume2, Search, Clock, CheckCircle2 } from 'lucide-react';
import { SignBridgeAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { playTTS } from '../utils/ttsPlayer';
import { HistoryItem } from '../types';

export const HistoryPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    SignBridgeAPI.getHistory().then((items) => {
      setHistoryItems(items);
      setIsLoading(false);
    });
  }, []);

  const handleClearHistory = async () => {
    const confirmed = window.confirm('Are you sure you want to clear your translation log history?');
    if (!confirmed) return;
    const ok = await SignBridgeAPI.clearHistory();
    if (ok) {
      setHistoryItems([]);
    }
  };

  const handleSpeak = (text: string) => {
    playTTS(text);
  };

  const filteredItems = historyItems.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.prediction.toLowerCase().includes(term) ||
      (item.sentence && item.sentence.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              Session Activity Archive
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            Translation Logs & Practice History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review past recognition events, captured phrases, and recorded timestamps.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div
        className="p-4 rounded-2xl border flex items-center gap-3 shadow-md"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by gesture name or sentence..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/60 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          Total Logs: <strong className="text-white">{filteredItems.length}</strong>
        </span>
      </div>

      {/* Log Entries List */}
      <div
        className="rounded-2xl border overflow-hidden shadow-xl"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            {isLoading ? 'Loading translation logs...' : 'No historical gesture logs found in persistent disk storage.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                      {item.prediction}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      {Math.round(item.confidence * 100)}%
                    </span>
                    <span className="text-slate-500 text-xs font-mono">•</span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {item.sentence && (
                    <p className="text-xs sm:text-sm text-white font-medium pl-1">
                      {item.sentence}
                    </p>
                  )}
                </div>

                {item.sentence && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(item.sentence!)}
                    className="self-end sm:self-center p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                    title="Speak text"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
