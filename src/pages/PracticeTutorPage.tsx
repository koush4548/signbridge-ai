import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, ChevronRight, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import { WebcamPanel } from '../components/translator/WebcamPanel';
import { FingerAlignmentGuide } from '../components/common/FingerAlignmentGuide';
import { ALL_ASL_REFERENCE, ALPHABETS_LIST } from '../utils/aslReference';
import { useTranslator } from '../context/TranslatorContext';
import { useTheme } from '../context/ThemeContext';
import { soundService } from '../utils/audioChime';
import { playTTS } from '../utils/ttsPlayer';
import { ClassificationResult } from '../types';

interface PracticeTutorPageProps {
  initialSign?: string | null;
}

export const PracticeTutorPage: React.FC<PracticeTutorPageProps> = ({ initialSign }) => {
  const { currentTheme } = useTheme();
  const { activePrediction, setRecognitionFocus } = useTranslator();

  const [currentTarget, setCurrentTarget] = useState<string>(initialSign || 'A');
  const [matchScore, setMatchScore] = useState<number>(0);
  const [hasSucceeded, setHasSucceeded] = useState<boolean>(false);
  const [successStreak, setSuccessStreak] = useState<number>(0);

  useEffect(() => {
    setRecognitionFocus('alphabets');
    return () => setRecognitionFocus('all');
  }, [setRecognitionFocus]);

  useEffect(() => {
    if (initialSign) {
      setCurrentTarget(initialSign);
      setMatchScore(0);
      setHasSucceeded(false);
    }
  }, [initialSign]);

  // Monitor live prediction against current target
  useEffect(() => {
    if (activePrediction && !activePrediction.isUnknown) {
      if (activePrediction.prediction === currentTarget) {
        const score = Math.round(activePrediction.confidence * 100);
        setMatchScore(score);

        if (score >= 90 && !hasSucceeded) {
          setHasSucceeded(true);
          setSuccessStreak((s) => s + 1);
          soundService.playSuccess();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      } else {
        setMatchScore(0);
      }
    } else {
      setMatchScore(0);
    }
  }, [activePrediction, currentTarget, hasSucceeded]);

  const targetInfo = ALL_ASL_REFERENCE[currentTarget] || ALL_ASL_REFERENCE['A'];

  const handleNextLetter = () => {
    const idx = ALPHABETS_LIST.indexOf(currentTarget);
    const nextIdx = (idx + 1) % ALPHABETS_LIST.length;
    setCurrentTarget(ALPHABETS_LIST[nextIdx]);
    setMatchScore(0);
    setHasSucceeded(false);
  };

  const handleSelectSign = (sign: string) => {
    setCurrentTarget(sign);
    setMatchScore(0);
    setHasSucceeded(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              Biometric ASL Tutor Drill
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            Target Practice: Letter &ldquo;{currentTarget}&rdquo;
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mirror the reference handshape to achieve biometric alignment and positive verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-700/60 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Streak:</span>
            <span className="text-base font-black font-mono text-emerald-400">{successStreak}</span>
          </div>

          <button
            type="button"
            onClick={handleNextLetter}
            className="px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>Next Letter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Selector Carousel Bar */}
      <div
        className="p-3 rounded-2xl border overflow-x-auto flex items-center gap-2 scrollbar-thin"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        {ALPHABETS_LIST.map((letter) => {
          const isSelected = letter === currentTarget;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => handleSelectSign(letter)}
              className={`min-w-[40px] h-10 rounded-xl font-mono font-bold text-sm flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-cyan-500 text-black shadow-lg scale-105'
                  : 'bg-slate-900/60 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-500'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Main Practice Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Webcam Stream */}
        <div className="lg:col-span-7 space-y-4">
          <WebcamPanel />

          {/* Real-time Matching Score Progress Card */}
          <div
            className="p-5 rounded-2xl border space-y-3 shadow-lg"
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                Target Alignment Precision:
              </span>
              <span
                className={`font-black text-sm ${
                  matchScore >= 90 ? 'text-emerald-400' : matchScore >= 70 ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                {matchScore}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-700/50">
              <div
                className={`h-full transition-all duration-200 ${
                  matchScore >= 90 ? 'bg-emerald-400' : matchScore >= 70 ? 'bg-cyan-400' : 'bg-slate-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Threshold for success: 90%</span>
              {hasSucceeded && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Success Verified!</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Reference & Knuckle Biomechanical Guide */}
        <div className="lg:col-span-5 space-y-6">
          <FingerAlignmentGuide sign={currentTarget} />

          {/* Quick Tips Box */}
          <div
            className="p-5 rounded-2xl border space-y-3 shadow-lg"
            style={{ backgroundColor: currentTheme.bgSurface, borderColor: currentTheme.borderColor }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.borderColor }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                  Biomechanical Description
                </h2>
              </div>
              <button
                type="button"
                onClick={() => playTTS(`Letter ${currentTarget}. ${targetInfo.description || ''}`)}
                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                title="Speak description"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {targetInfo.description || targetInfo.meaning}
            </p>

            {targetInfo.tips && targetInfo.tips.length > 0 && (
              <ul className="space-y-1.5 pt-2">
                {targetInfo.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeTutorPage;
