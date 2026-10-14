import React, { useState } from 'react';
import { WebcamPanel } from '../components/translator/WebcamPanel';
import { PredictionPanel } from '../components/translator/PredictionPanel';
import { SentenceBuilderPanel } from '../components/translator/SentenceBuilderPanel';
import { AudioTranscriberPanel } from '../components/translator/AudioTranscriberPanel';
import { SigningInstructionBreakdown } from '../components/translator/SigningInstructionBreakdown';
import { PredictionTimeline } from '../components/translator/PredictionTimeline';
import {
  BookOpen,
  Camera,
  Mic,
  ListOrdered,
  Clock,
  LayoutGrid,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useTranslator } from '../context/TranslatorContext';
import { useTheme } from '../context/ThemeContext';

interface TranslatorPageProps {
  onOpenAlphabetGuide?: (letter?: string) => void;
  onNavigateToTranscriber?: () => void;
}

export type TranslatorFeatureSubTab = 'translation' | 'speech' | 'breakdown' | 'timeline' | 'all';

export const TranslatorPage: React.FC<TranslatorPageProps> = ({
  onOpenAlphabetGuide,
  onNavigateToTranscriber,
}) => {
  const { currentTheme } = useTheme();
  const { recognitionMode, setRecognitionMode, sentenceWords } = useTranslator();
  const [activeFeatureTab, setActiveFeatureTab] = useState<TranslatorFeatureSubTab>('translation');

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Controls */}
      <div
        className="p-4 sm:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl transition-all"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{
                backgroundColor: currentTheme.badgeBg,
                color: currentTheme.accentPrimary,
                borderColor: currentTheme.borderHover,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {recognitionMode === 'alphabet'
                  ? 'Alphabet Mode Active (Letters Only)'
                  : recognitionMode === 'word'
                  ? 'Word Mode Active (Signs Only)'
                  : 'Assisted Mode Active (Hybrid)'}
              </span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {sentenceWords.length} {sentenceWords.length === 1 ? 'token' : 'tokens'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {recognitionMode === 'alphabet'
              ? 'ASL Alphabet Fingerspelling'
              : recognitionMode === 'word'
              ? 'ASL Conversational Word Recognition'
              : 'ASL Assisted Hybrid Translation'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {recognitionMode === 'alphabet'
              ? 'Letter-by-letter fingerspelling. Accepts only A-Z. Words are strictly isolated out.'
              : recognitionMode === 'word'
              ? 'Conversational ASL gesture recognition. One-shot commit per sign. Letters are strictly isolated out.'
              : 'Combined recognition workflow with temporal motion segmentation and disambiguation.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Strict Recognition Mode Isolator */}
          <div
            className="flex items-center rounded-xl p-1 border bg-slate-950/60 shadow-inner"
            style={{ borderColor: currentTheme.borderColor }}
          >
            <button
              type="button"
              onClick={() => setRecognitionMode('alphabet')}
              title="Alphabet Mode: Accepts ONLY A-Z letters without word confusion"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
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
              title="Word Mode: Accepts ONLY whole conversational words without alphabet confusion"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
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
              title="Assisted Mode: Combined letters and words with motion segmentation and disambiguation"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                recognitionMode === 'assisted'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Assisted
            </button>
          </div>

          {onOpenAlphabetGuide && (
            <button
              type="button"
              onClick={() => onOpenAlphabetGuide()}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Alphabet Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Feature Sub-Navigation Tabs Bar */}
      <div
        className="p-1.5 sm:p-2 rounded-2xl border flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none shadow-md"
        style={{ backgroundColor: currentTheme.bgSurface, borderColor: currentTheme.borderColor }}
      >
        <button
          type="button"
          onClick={() => setActiveFeatureTab('translation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeFeatureTab === 'translation'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Translation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFeatureTab('speech')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeFeatureTab === 'speech'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Mic className="w-4 h-4 text-amber-400" />
          <span>Speech & Audio Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFeatureTab('breakdown')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeFeatureTab === 'breakdown'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <ListOrdered className="w-4 h-4 text-emerald-400" />
          <span>Signing Breakdown</span>
          {sentenceWords.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFeatureTab === 'breakdown' ? 'bg-black text-cyan-400' : 'bg-emerald-950 text-emerald-400'
              }`}
            >
              {sentenceWords.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFeatureTab('timeline')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeFeatureTab === 'timeline'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-4 h-4 text-sky-400" />
          <span>Stream Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFeatureTab('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ml-auto ${
            activeFeatureTab === 'all'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
          title="View all feature panels on one page"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Combined Grid</span>
        </button>
      </div>

      {/* TAB 1: Live Translation & Sentence Builder (Clean, Focused, Responsive) */}
      {activeFeatureTab === 'translation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Webcam Feed */}
          <div className="lg:col-span-7 space-y-6">
            <WebcamPanel />
          </div>

          {/* Right Column: Prediction Details & Sentence Builder */}
          <div className="lg:col-span-5 space-y-6">
            <PredictionPanel onOpenGuideForLetter={onOpenAlphabetGuide} />
            <SentenceBuilderPanel />

            {/* Quick Teaser / Switcher to Audio Studio */}
            <div
              className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md"
              style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                    Speech-to-Sign Studio
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Transcribe spoken voice to ASL Gloss and signs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFeatureTab('speech')}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Dedicated Speech & Audio Studio */}
      {activeFeatureTab === 'speech' && (
        <div className="space-y-4">
          <AudioTranscriberPanel onOpenGuideForLetter={onOpenAlphabetGuide} />
        </div>
      )}

      {/* TAB 3: Signing Instruction Breakdown */}
      {activeFeatureTab === 'breakdown' && (
        <div className="space-y-6">
          <div
            className="p-5 rounded-2xl border flex items-center justify-between gap-4"
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
          >
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Step-by-Step Signing Instruction Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed biomechanical articulatory guidance and finger posture for each token in your sentence.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveFeatureTab('translation')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all cursor-pointer"
            >
              Back to Camera
            </button>
          </div>

          {sentenceWords.length === 0 ? (
            <div
              className="p-10 rounded-3xl border text-center space-y-3"
              style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <ListOrdered className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white font-mono">No Signs in Sentence Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sign in front of the camera or use the Sentence Builder to add tokens. Once added, detailed sign breakdowns and anatomical guides will appear here.
              </p>
              <button
                type="button"
                onClick={() => setActiveFeatureTab('translation')}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Start Signing Now</span>
              </button>
            </div>
          ) : (
            <SigningInstructionBreakdown
              tokens={sentenceWords}
              onSelectSign={(letter) => onOpenAlphabetGuide && onOpenAlphabetGuide(letter)}
            />
          )}
        </div>
      )}

      {/* TAB 4: Prediction Stream Timeline */}
      {activeFeatureTab === 'timeline' && (
        <div className="space-y-6">
          <div
            className="p-5 rounded-2xl border flex items-center justify-between gap-4"
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
          >
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Temporal Prediction Stream & Confidence Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time chronological frame history, stabilization status, and transition logs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveFeatureTab('translation')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all cursor-pointer"
            >
              Back to Camera
            </button>
          </div>

          <PredictionTimeline onSelectPrediction={(letter) => onOpenAlphabetGuide && onOpenAlphabetGuide(letter)} />
        </div>
      )}

      {/* TAB 5: Combined All-in-One Grid */}
      {activeFeatureTab === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <WebcamPanel />
            <PredictionTimeline onSelectPrediction={(letter) => onOpenAlphabetGuide && onOpenAlphabetGuide(letter)} />
            <SentenceBuilderPanel />
            <SigningInstructionBreakdown
              tokens={sentenceWords}
              onSelectSign={(letter) => onOpenAlphabetGuide && onOpenAlphabetGuide(letter)}
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <PredictionPanel onOpenGuideForLetter={onOpenAlphabetGuide} />
            <AudioTranscriberPanel onOpenGuideForLetter={onOpenAlphabetGuide} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslatorPage;
