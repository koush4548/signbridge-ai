import React from 'react';
import { AudioTranscriberPanel } from '../components/translator/AudioTranscriberPanel';
import { Mic, Sparkles, BookOpen, Volume2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AudioTranscriberPageProps {
  onOpenAlphabetGuide?: (letter?: string) => void;
}

export const AudioTranscriberPage: React.FC<AudioTranscriberPageProps> = ({ onOpenAlphabetGuide }) => {
  const { currentTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className="p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{
                backgroundColor: currentTheme.badgeBg,
                color: currentTheme.accentPrimary,
                borderColor: currentTheme.borderHover,
              }}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice AI & ASL Gloss Engine</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Multimodal v3.0</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            Speech & Audio-to-Sign Transcriber Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time vocal microphone recording, audio file transcription, bilingual translation, and step-by-step ASL gloss breakdown.
          </p>
        </div>

        {onOpenAlphabetGuide && (
          <button
            type="button"
            onClick={() => onOpenAlphabetGuide()}
            className="px-4 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Alphabet Guide</span>
          </button>
        )}
      </div>

      {/* Main Full-Width Transcriber Component */}
      <AudioTranscriberPanel onOpenGuideForLetter={onOpenAlphabetGuide} />
    </div>
  );
};

export default AudioTranscriberPage;
