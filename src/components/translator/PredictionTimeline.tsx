import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useTranslator } from '../../context/TranslatorContext';
import { useTheme } from '../../context/ThemeContext';

interface PredictionTimelineProps {
  onSelectPrediction?: (prediction: string) => void;
  className?: string;
}

export const PredictionTimeline: React.FC<PredictionTimelineProps> = ({
  onSelectPrediction,
  className = '',
}) => {
  const { currentTheme } = useTheme();
  const { activePrediction, latencyMs } = useTranslator();

  return (
    <div
      className={`rounded-2xl border p-4 shadow-xl space-y-3 ${className}`}
      style={{
        backgroundColor: currentTheme.bgCard,
        borderColor: currentTheme.borderColor,
      }}
    >
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Live Telemetry Timeline
        </span>
        <span>Latency: {latencyMs}ms</span>
      </div>

      <div
        className="p-3 rounded-xl border flex items-center justify-between"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              activePrediction && !activePrediction.isUnknown ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <div>
            <span className="text-xs font-mono text-slate-400 block leading-tight">Current Target</span>
            <span className="text-sm font-bold font-mono text-white">
              {activePrediction && !activePrediction.isUnknown ? activePrediction.prediction : 'Awaiting Gesture'}
            </span>
          </div>
        </div>

        {activePrediction && !activePrediction.isUnknown && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
              {Math.round(activePrediction.confidence * 100)}%
            </span>
            {onSelectPrediction && activePrediction.prediction.length === 1 && (
              <button
                type="button"
                onClick={() => onSelectPrediction(activePrediction.prediction)}
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Inspect
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionTimeline;
