import React, { useState } from 'react';
import { BookOpen, Volume2, Award, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { FingerAlignmentGuide } from '../components/common/FingerAlignmentGuide';
import { ALPHABETS_LIST, ALL_ASL_REFERENCE } from '../utils/aslReference';
import { useTheme } from '../context/ThemeContext';
import { playTTS } from '../utils/ttsPlayer';

interface AlphabetGuidePageProps {
  initialLetter?: string | null;
  onPracticeLetter?: (letter: string) => void;
}

export const AlphabetGuidePage: React.FC<AlphabetGuidePageProps> = ({
  initialLetter,
  onPracticeLetter,
}) => {
  const { currentTheme } = useTheme();
  const [selectedLetter, setSelectedLetter] = useState<string>(initialLetter || 'A');

  const selectedInfo = ALL_ASL_REFERENCE[selectedLetter] || ALL_ASL_REFERENCE['A'];

  const handleSpeak = (text: string) => {
    playTTS(text);
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
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              Interactive ASL Fingerspelling Reference
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            American Sign Language Alphabet Chart (A–Z)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore standard handshapes, kinematics, and anatomical cues for all 26 manual letters.
          </p>
        </div>

        {onPracticeLetter && (
          <button
            type="button"
            onClick={() => onPracticeLetter(selectedLetter)}
            className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Practice Letter &ldquo;{selectedLetter}&rdquo;</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 26 Letters Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="p-6 rounded-2xl border shadow-xl"
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
          >
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4">
              Select Any Letter to View Biomechanics
            </h2>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3">
              {ALPHABETS_LIST.map((letter) => {
                const isSelected = letter === selectedLetter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setSelectedLetter(letter)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg scale-105'
                        : 'bg-slate-900/60 border-slate-700/60 text-white hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl font-black font-mono leading-none">{letter}</span>
                    <span className={`text-[10px] font-mono mt-1 ${isSelected ? 'text-black/80' : 'text-slate-400'}`}>
                      {ALL_ASL_REFERENCE[letter]?.emoji || '✋'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Biomechanical Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <FingerAlignmentGuide sign={selectedLetter} />

          {/* Letter Info Card */}
          <div
            className="p-6 rounded-2xl border space-y-4 shadow-xl"
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: currentTheme.borderColor }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black font-mono text-cyan-400">{selectedLetter}</span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedInfo.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400">{selectedInfo.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSpeak(`Letter ${selectedLetter}. ${selectedInfo.description || ''}`)}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Speak Letter Description"
                >
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                </button>

                {onPracticeLetter && (
                  <button
                    type="button"
                    onClick={() => onPracticeLetter(selectedLetter)}
                    className="p-2 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
                    title="Launch Practice Drill"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-400 block">
                Form Guidance
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedInfo.description || selectedInfo.meaning}
              </p>
            </div>

            {selectedInfo.tips && selectedInfo.tips.length > 0 && (
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: currentTheme.borderColor }}>
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400 block">
                  Pro Posture Cues
                </span>
                <ul className="space-y-1.5">
                  {selectedInfo.tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlphabetGuidePage;
