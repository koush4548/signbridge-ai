import React from 'react';
import {
  TrendingUp,
  Plus,
  HelpCircle,
  Delete,
  Space,
  Check,
  AlertCircle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useTranslator } from '../../context/TranslatorContext';
import { useTheme } from '../../context/ThemeContext';
import { ALL_ASL_REFERENCE } from '../../utils/aslReference';
import { EASY_SIGN_INFO } from '../../utils/aslClassifier';

interface PredictionPanelProps {
  onOpenGuideForLetter?: (letter: string) => void;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({ onOpenGuideForLetter }) => {
  const { currentTheme } = useTheme();
  const {
    currentPrediction,
    confidence,
    topPredictions,
    handsDetected,
    latencyMs,
    isUnknown,
    isLocked,
    recognitionMode,
    setRecognitionMode,
    sentenceFormationMode,
    setSentenceFormationMode,
    spellingBuffer,
    addLetterToSpelling,
    commitSpellingWord,
    backspaceSpelling,
    addWordToSentence,
    appendToken,
    disambiguationState,
    resolveDisambiguation,
    dismissDisambiguation,
  } = useTranslator();

  const easyInfo = currentPrediction ? EASY_SIGN_INFO[currentPrediction] : null;

  return (
    <div
      id="prediction-panel-card"
      className="rounded-3xl border shadow-xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 space-y-4"
      style={{
        backgroundColor: currentTheme.bgCard,
        borderColor: currentTheme.borderColor,
      }}
    >
      {/* Header: Recognition Mode Isolator & Auto/Manual Selector */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4"
        style={{ borderColor: currentTheme.borderColor }}
      >
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono"
            style={{ color: currentTheme.accentPrimary }}
          >
            Recognition Pipeline
          </div>
          <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
            <span>Real-Time Output</span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider"
              style={{
                backgroundColor: currentTheme.badgeBg,
                borderColor: currentTheme.borderHover,
                color: currentTheme.accentPrimary,
              }}
            >
              {recognitionMode === 'alphabet'
                ? 'Alphabet Mode'
                : recognitionMode === 'word'
                ? 'Word Mode'
                : 'Assisted Mode'}
            </span>
          </h2>
        </div>

        {/* Mode Selector Radio Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div
            className="flex items-center p-1 rounded-xl border bg-slate-950/70"
            style={{ borderColor: currentTheme.borderColor }}
          >
            <button
              type="button"
              onClick={() => setRecognitionMode('alphabet')}
              title="Alphabet Mode: Accepts ONLY A-Z letters, perfect for letter-by-letter fingerspelling"
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                recognitionMode === 'alphabet'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Letters (A-Z)
            </button>
            <button
              type="button"
              onClick={() => setRecognitionMode('word')}
              title="Word Mode: Accepts ONLY whole conversational ASL words (e.g. HELLO, THANK_YOU, YES, NO)"
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                recognitionMode === 'word'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Words
            </button>
            <button
              type="button"
              onClick={() => setRecognitionMode('assisted')}
              title="Assisted Mode: Combined letters and words with motion segmentation & disambiguation"
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                recognitionMode === 'assisted'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Assisted
            </button>
          </div>

          {/* Auto vs Manual Toggle */}
          <div
            className="flex items-center p-1 rounded-xl border bg-slate-950/70"
            style={{ borderColor: currentTheme.borderColor }}
          >
            <button
              type="button"
              onClick={() => setSentenceFormationMode('auto')}
              title="Auto Mode: Signs are accumulated once upon stable hold"
              className={`px-2 py-1 text-[11px] font-mono font-semibold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                sentenceFormationMode === 'auto'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setSentenceFormationMode('manual')}
              title="Manual Mode: Tap Add to commit signs"
              className={`px-2 py-1 text-[11px] font-mono font-semibold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                sentenceFormationMode === 'manual'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual
            </button>
          </div>
        </div>
      </div>

      {/* Disambiguation Prompt (Assisted Mode) */}
      {disambiguationState?.isOpen && (
        <div
          className="p-3.5 rounded-2xl border bg-amber-950/40 border-amber-500/50 text-amber-200 space-y-2 animate-in fade-in"
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Sign Disambiguation Required
            </span>
            <button
              type="button"
              onClick={dismissDisambiguation}
              className="text-slate-400 hover:text-white text-xs"
            >
              &times; Dismiss
            </button>
          </div>
          <p className="text-xs text-amber-300/90">
            Similar handshape detected. Please confirm which sign you intended:
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => resolveDisambiguation(disambiguationState.alphabetCandidate)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md"
            >
              Letter &ldquo;{disambiguationState.alphabetCandidate}&rdquo;
            </button>
            <button
              type="button"
              onClick={() => resolveDisambiguation(disambiguationState.wordCandidate)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-md"
            >
              Word &ldquo;{disambiguationState.wordCandidate.replace(/_/g, ' ')}&rdquo;
            </button>
          </div>
        </div>
      )}

      {/* Main Gesture Card */}
      <div
        className="flex flex-col items-center justify-center p-6 rounded-2xl border relative overflow-hidden text-center transition-all"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
        }}
      >
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: `${currentTheme.accentPrimary}20` }}
        />

        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold"
            style={{ color: currentTheme.textMuted }}
          >
            Confirmed ASL Sign
          </span>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
              isLocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isLocked ? 'Locked (1x)' : 'Scanning'}
          </span>
        </div>

        {/* Large Visual Sign Container */}
        <div
          className="min-w-[140px] px-6 h-28 rounded-2xl border flex items-center justify-center shadow-inner mb-3 transition-transform duration-200"
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.borderHover,
            boxShadow: `0 8px 30px -10px ${currentTheme.glowColor}`,
          }}
        >
          {isUnknown ? (
            <HelpCircle className="w-12 h-12 stroke-[1.5]" style={{ color: currentTheme.textMuted }} />
          ) : (
            <div className="flex items-center gap-3 justify-center">
              {easyInfo?.emoji && <span className="text-4xl select-none">{easyInfo.emoji}</span>}
              <span
                className={`font-black font-mono tracking-tight ${
                  currentPrediction.length > 5 ? 'text-2xl' : 'text-4xl sm:text-5xl'
                }`}
                style={{ color: currentTheme.accentPrimary }}
              >
                {currentPrediction.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Meaning & Status */}
        <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
          <span
            className="text-xs font-mono font-semibold px-3 py-1 rounded-full uppercase border flex items-center gap-1.5"
            style={{
              backgroundColor:
                handsDetected === 0
                  ? currentTheme.bgSurface
                  : isUnknown
                  ? 'rgba(245, 158, 11, 0.12)'
                  : currentTheme.badgeBg,
              borderColor:
                handsDetected === 0
                  ? currentTheme.borderColor
                  : isUnknown
                  ? 'rgba(245, 158, 11, 0.3)'
                  : currentTheme.borderHover,
              color:
                handsDetected === 0
                  ? currentTheme.textMuted
                  : isUnknown
                  ? '#d97706'
                  : currentTheme.accentPrimary,
            }}
          >
            {handsDetected === 0 ? (
              'Awaiting Hand Gesture'
            ) : isUnknown ? (
              'Scanning Gesture...'
            ) : easyInfo ? (
              <span>{easyInfo.meaning}</span>
            ) : (
              <span>Active: {currentPrediction}</span>
            )}
          </span>

          {!isUnknown && (
            <button
              id="btn-append-sign-direct"
              onClick={() => appendToken(currentPrediction)}
              title={
                recognitionMode === 'alphabet'
                  ? `Add letter "${currentPrediction}" to spelling`
                  : `Add word "${currentPrediction}" to sentence`
              }
              className="px-3.5 py-1 rounded-full text-white text-xs font-bold uppercase transition-all flex items-center gap-1 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
              style={{ background: currentTheme.accentGradient }}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{recognitionMode === 'alphabet' ? `Add '${currentPrediction}'` : 'Add Word'}</span>
            </button>
          )}
        </div>

        {/* Manual Commit Button if in manual mode */}
        {sentenceFormationMode === 'manual' && !isUnknown && (
          <button
            onClick={() => appendToken(currentPrediction)}
            className="mt-3 w-full max-w-xs py-2 px-4 rounded-xl text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: currentTheme.accentGradient,
              boxShadow: `0 0 20px -5px ${currentTheme.glowColor}`,
            }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Commit Sign to Sentence</span>
          </button>
        )}
      </div>

      {/* Alphabet Mode Active Spelling Ribbon */}
      {recognitionMode === 'alphabet' && (
        <div
          className="p-3.5 rounded-2xl border space-y-2 bg-slate-950/60"
          style={{ borderColor: currentTheme.borderColor }}
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Active Fingerspelling Buffer:
            </span>
            <span className="text-[11px] text-slate-400">
              {spellingBuffer.length} {spellingBuffer.length === 1 ? 'letter' : 'letters'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap min-h-[38px] p-2 rounded-xl bg-slate-900 border border-slate-800">
            {spellingBuffer.length === 0 ? (
              <span className="text-xs font-mono text-slate-500 italic">
                Hold alphabet handshapes to spell letters here.
              </span>
            ) : (
              spellingBuffer.split('').map((char, i) => (
                <span
                  key={`${char}-${i}`}
                  className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-200 font-mono font-bold text-sm flex items-center justify-center shadow-sm"
                >
                  {char}
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={commitSpellingWord}
              disabled={spellingBuffer.length === 0}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Space className="w-3.5 h-3.5" />
              <span>Space / Next Word</span>
            </button>

            <button
              type="button"
              onClick={backspaceSpelling}
              disabled={spellingBuffer.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>Backspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Confidence & Latency Stats */}
      <div
        className="p-4 rounded-2xl border"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
        }}
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <span
            className="text-[11px] uppercase font-mono tracking-wider font-semibold flex items-center gap-1.5"
            style={{ color: currentTheme.textSecondary }}
          >
            <TrendingUp className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
            Landmark Confidence
          </span>
          <span className="font-bold font-mono text-sm" style={{ color: currentTheme.textPrimary }}>
            {Math.round(confidence * 100)}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: currentTheme.borderColor }}>
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.max(4, Math.round(confidence * 100))}%`,
              background: currentTheme.accentGradient,
            }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono mt-2" style={{ color: currentTheme.textMuted }}>
          <span>Latency: {latencyMs}ms</span>
          <span>Hysteresis: {isLocked ? 'Confirmed & Stabilized' : 'Acquiring Steady Hand'}</span>
        </div>
      </div>

      {/* Candidate Softmax Distribution */}
      <div>
        <div
          className="flex items-center justify-between text-[11px] uppercase font-mono tracking-wider font-bold mb-2.5"
          style={{ color: currentTheme.textSecondary }}
        >
          <span>Top Candidates ({recognitionMode.toUpperCase()})</span>
          <span style={{ color: currentTheme.textMuted }} className="font-normal text-[10px]">
            {sentenceFormationMode === 'manual' ? 'Tap to Commit' : 'Distribution'}
          </span>
        </div>

        <div className="space-y-1.5">
          {topPredictions && topPredictions.length > 0 ? (
            topPredictions.slice(0, 3).map((item, idx) => (
              <button
                key={`${item.label}-${idx}`}
                onClick={() => appendToken(item.label)}
                title={`Click to commit "${item.label}"`}
                className="w-full flex items-center gap-3 text-xs p-2 rounded-xl transition-all group text-left cursor-pointer hover:bg-sky-500/10"
                style={{ backgroundColor: idx === 0 ? currentTheme.bgSurface : 'transparent' }}
              >
                <span
                  className="w-28 truncate font-mono font-bold flex items-center gap-1.5"
                  style={{ color: currentTheme.textPrimary }}
                >
                  <span className="text-[10px] opacity-60" style={{ color: currentTheme.accentPrimary }}>+</span>
                  {item.label.replace(/_/g, ' ')}
                </span>

                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: currentTheme.borderColor }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(4, item.percentage)}%`,
                      background: idx === 0 ? currentTheme.accentGradient : currentTheme.accentPrimary,
                      opacity: idx === 0 ? 1 : 0.4,
                    }}
                  />
                </div>

                <span className="w-10 text-right font-mono text-[11px] font-medium" style={{ color: currentTheme.textSecondary }}>
                  {item.percentage}%
                </span>
              </button>
            ))
          ) : (
            <div className="py-2 text-center text-xs font-mono" style={{ color: currentTheme.textMuted }}>
              Awaiting hand gesture in {recognitionMode} mode
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
