import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Copy,
  Trash2,
  Check,
  CornerDownLeft,
  Space,
  Delete,
} from 'lucide-react';
import { useTranslator } from '../../context/TranslatorContext';
import { useTheme } from '../../context/ThemeContext';
import { SignBridgeAPI } from '../../services/api';
import { playTTS } from '../../utils/ttsPlayer';

export const SentenceBuilderPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { currentTheme } = useTheme();
  const {
    sentenceWords,
    spellingBuffer,
    commitSpellingWord,
    backspaceSpelling,
    addWordToSentence,
    appendToken,
    clearSentence,
    removeLastWord,
    activePrediction,
    webcamSettings,
    recognitionMode,
    sentenceState,
  } = useTranslator();

  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [polishedSentence, setPolishedSentence] = useState<string>('');
  const [targetTranslation, setTargetTranslation] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCommitCurrentSign = () => {
    if (activePrediction && !activePrediction.isUnknown && activePrediction.prediction) {
      appendToken(activePrediction.prediction);
    }
  };

  const handlePolishSentence = async () => {
    const tokensToPolish = [...sentenceWords];
    if (spellingBuffer) {
      tokensToPolish.push(spellingBuffer);
    }
    if (tokensToPolish.length === 0) return;

    setIsPolishing(true);
    try {
      const res = await SignBridgeAPI.polishSentence(tokensToPolish, webcamSettings.ttsLanguage);
      setPolishedSentence(res.polishedSentence);
      if (res.targetTranslation) {
        setTargetTranslation(res.targetTranslation);
      }
    } catch (err) {
      console.error('Error polishing sentence:', err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!text) return;
    playTTS(text, {
      language: webcamSettings.ttsLanguage,
      voiceName: webcamSettings.ttsVoice,
      rate: webcamSettings.ttsRate,
      pitch: webcamSettings.ttsPitch,
    });
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawSentenceText = sentenceState || sentenceWords.join(' ');
  const displayText = polishedSentence || rawSentenceText;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-xl space-y-4 flex flex-col ${className}`}
      style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
    >
      {/* Title Header with Mode Badge */}
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: currentTheme.borderColor }}>
        <div className="flex items-center gap-2">
          <CornerDownLeft className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wide text-white uppercase">
            Sentence Construction &amp; Neural Translation
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-slate-900 border-slate-700 text-cyan-300">
            {recognitionMode === 'alphabet' ? 'Alphabet Mode' : recognitionMode === 'word' ? 'Word Mode' : 'Assisted Mode'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activePrediction && !activePrediction.isUnknown && (
            <button
              type="button"
              onClick={handleCommitCurrentSign}
              className="px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>+ Add &ldquo;{activePrediction.prediction.replace(/_/g, ' ')}&rdquo;</span>
            </button>
          )}

          {(sentenceWords.length > 0 || spellingBuffer.length > 0) && (
            <button
              type="button"
              onClick={clearSentence}
              className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40 transition-colors cursor-pointer"
              title="Clear all tokens"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Word Tokens Stream & In-Progress Spelling Buffer */}
      <div
        className="min-h-[64px] p-3 rounded-xl border flex flex-wrap items-center gap-2 bg-slate-950/50"
        style={{ borderColor: currentTheme.borderColor }}
      >
        {sentenceWords.length === 0 && spellingBuffer.length === 0 ? (
          <span className="text-xs font-mono text-slate-500 italic">
            Recognized sign tokens will accumulate here without repetition. Hold signs to form phrases.
          </span>
        ) : (
          <>
            {sentenceWords.map((word, idx) => (
              <span
                key={`${word}-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 shadow-sm"
              >
                <span>{word}</span>
                {idx === sentenceWords.length - 1 && spellingBuffer.length === 0 && (
                  <button
                    type="button"
                    onClick={removeLastWord}
                    className="text-slate-400 hover:text-rose-400 ml-1 text-xs cursor-pointer"
                    title="Remove last token"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}

            {/* In-progress spelling buffer tag */}
            {spellingBuffer.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-950/80 border border-indigo-400 text-indigo-200 shadow-sm animate-pulse">
                <span>{spellingBuffer}</span>
                <span className="text-[10px] opacity-70 underline ml-1">(spelling)</span>
              </span>
            )}
          </>
        )}
      </div>

      {/* Spelling Buffer Controls (in Alphabet or Assisted Mode) */}
      {(recognitionMode === 'alphabet' || spellingBuffer.length > 0) && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex-wrap gap-2">
          <span className="text-slate-300">
            Current Word Spelling: <strong className="text-cyan-300 font-mono text-sm">{spellingBuffer || '(empty)'}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={commitSpellingWord}
              disabled={spellingBuffer.length === 0}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Space className="w-3.5 h-3.5" />
              <span>Space / Next Word</span>
            </button>
            <button
              type="button"
              onClick={backspaceSpelling}
              disabled={spellingBuffer.length === 0 && sentenceWords.length === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>Backspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Output / Polished Sentence Preview */}
      {displayText && (
        <div
          className="p-4 rounded-xl border space-y-2 relative"
          style={{ backgroundColor: currentTheme.bgSurface, borderColor: currentTheme.borderColor }}
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{polishedSentence ? 'AI Polished Expression:' : 'Raw ASL Sentence:'}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSpeak(displayText)}
                className="p-1 rounded text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Synthesize Voice Audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCopy(displayText)}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-base sm:text-lg font-mono font-semibold text-white tracking-wide">
            &ldquo;{displayText}&rdquo;
          </p>

          {targetTranslation && (
            <div className="pt-2 border-t border-slate-800 text-xs font-mono text-cyan-300/90">
              Translation: {targetTranslation}
            </div>
          )}
        </div>
      )}

      {/* Polish Action Trigger */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        <span className="text-[11px] font-mono text-slate-400">
          {sentenceWords.length} {sentenceWords.length === 1 ? 'Word Token' : 'Word Tokens'}
        </span>

        <button
          type="button"
          onClick={handlePolishSentence}
          disabled={isPolishing || (sentenceWords.length === 0 && spellingBuffer.length === 0)}
          className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isPolishing ? 'Refining Grammar...' : 'Polish Sentence (AI)'}</span>
        </button>
      </div>
    </div>
  );
};
