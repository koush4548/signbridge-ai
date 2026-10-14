import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClassificationResult, RecognitionMode, TopPrediction, WebcamSettings } from '../types';
import { playTTS } from '../utils/ttsPlayer';
import { SentenceAssembler } from '../utils/sentenceBuilder';

interface DisambiguationData {
  isOpen: boolean;
  alphabetCandidate: string;
  wordCandidate: string;
}

interface TranslatorContextType {
  activePrediction: ClassificationResult | null;
  setActivePrediction: (pred: ClassificationResult | null) => void;

  // Recognition Mode: 'alphabet' (A-Z only), 'word' (words only), 'assisted' (hybrid with disambiguation)
  recognitionMode: RecognitionMode;
  setRecognitionMode: (mode: RecognitionMode) => void;
  // Backwards compatibility alias for components using recognitionFocus
  recognitionFocus: 'all' | 'alphabets' | 'words';
  setRecognitionFocus: (focus: 'all' | 'alphabets' | 'words') => void;

  // Sentence and Spelling Construction
  sentenceWords: string[];
  setSentenceWords: React.Dispatch<React.SetStateAction<string[]>>;
  spellingBuffer: string;
  addLetterToSpelling: (letter: string) => void;
  commitSpellingWord: () => void;
  backspaceSpelling: () => void;
  addWordToSentence: (word: string) => void;
  clearSentence: () => void;
  removeLastWord: () => void;
  appendToken: (token: string) => void;

  // Assembled string representation
  sentenceState: string;
  setSentence: (str: string) => void;
  speakSentence: (customText?: string, lang?: string) => void;

  // Disambiguation State for Assisted Mode
  disambiguationState: DisambiguationData | null;
  setDisambiguationState: (state: DisambiguationData | null) => void;
  resolveDisambiguation: (choice: string) => void;
  dismissDisambiguation: () => void;

  // Camera & Telemetry
  webcamSettings: WebcamSettings;
  updateWebcamSettings: (newSettings: Partial<WebcamSettings>) => void;
  isTranslating: boolean;
  setIsTranslating: (val: boolean) => void;
  handsDetected: number;
  setHandsDetected: (count: number) => void;
  latencyMs: number;
  setLatencyMs: (ms: number) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  sentenceFormationMode: 'auto' | 'manual';
  setSentenceFormationMode: (mode: 'auto' | 'manual') => void;

  // Computed prediction values
  currentPrediction: string;
  confidence: number;
  topPredictions: TopPrediction[];
  isUnknown: boolean;
}

const DEFAULT_SETTINGS: WebcamSettings = {
  mirrorWebcam: true,
  showLandmarksOverlay: true,
  showBoundingBox: true,
  confidenceThreshold: 0.65,
  holdConfirmDurationMs: 600,
  ttsLanguage: 'en-US',
  ttsVoice: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
  soundEffects: true,
};

const TranslatorContext = createContext<TranslatorContextType | undefined>(undefined);

export const TranslatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePrediction, setActivePrediction] = useState<ClassificationResult | null>(null);

  // Recognition Mode: 'alphabet' | 'word' | 'assisted'
  const [recognitionMode, setRecognitionModeState] = useState<RecognitionMode>(() => {
    try {
      const saved = localStorage.getItem('sb_recognition_mode');
      if (saved === 'alphabet' || saved === 'word' || saved === 'assisted') {
        return saved;
      }
    } catch {}
    return 'alphabet'; // Clean default: start in Alphabet mode
  });

  const [recognitionFocus, setRecognitionFocusState] = useState<'all' | 'alphabets' | 'words'>('alphabets');

  // Sync recognitionMode and recognitionFocus
  const setRecognitionMode = (mode: RecognitionMode) => {
    setRecognitionModeState(mode);
    setActivePrediction(null);
    setDisambiguationState(null);
    setIsLocked(false);
    try {
      localStorage.setItem('sb_recognition_mode', mode);
    } catch {}
    if (mode === 'alphabet') setRecognitionFocusState('alphabets');
    else if (mode === 'word') setRecognitionFocusState('words');
    else setRecognitionFocusState('all');
  };

  const setRecognitionFocus = (focus: 'all' | 'alphabets' | 'words') => {
    setRecognitionFocusState(focus);
    setActivePrediction(null);
    setDisambiguationState(null);
    setIsLocked(false);
    if (focus === 'alphabets') {
      setRecognitionModeState('alphabet');
      try { localStorage.setItem('sb_recognition_mode', 'alphabet'); } catch {}
    } else if (focus === 'words') {
      setRecognitionModeState('word');
      try { localStorage.setItem('sb_recognition_mode', 'word'); } catch {}
    } else {
      setRecognitionModeState('assisted');
      try { localStorage.setItem('sb_recognition_mode', 'assisted'); } catch {}
    }
  };

  // Sentence and Spelling Assembler
  const [assembler] = useState(() => new SentenceAssembler());
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [spellingBuffer, setSpellingBuffer] = useState<string>('');
  const [sentenceState, setSentence] = useState<string>('');

  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [handsDetected, setHandsDetected] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(18);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [sentenceFormationMode, setSentenceFormationMode] = useState<'auto' | 'manual'>('auto');

  // Disambiguation popup state
  const [disambiguationState, setDisambiguationState] = useState<DisambiguationData | null>(null);

  const [webcamSettings, setWebcamSettings] = useState<WebcamSettings>(() => {
    try {
      const saved = localStorage.getItem('sb_webcam_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateWebcamSettings = (newSettings: Partial<WebcamSettings>) => {
    setWebcamSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('sb_webcam_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper to sync assembler state to React state
  const syncAssemblerState = () => {
    const tokens = assembler.getTokens();
    const buffer = assembler.getSpellingBuffer();
    const assembled = assembler.getAssembledSentence();
    setSentenceWords(tokens);
    setSpellingBuffer(buffer);
    setSentence(assembled);
  };

  /**
   * Add a letter to in-progress spelling (Alphabet Mode)
   */
  const addLetterToSpelling = (letter: string) => {
    if (!letter || letter === 'UNKNOWN') return;
    assembler.addLetter(letter);
    syncAssemblerState();
  };

  /**
   * Space / Commit current spelling buffer into words
   */
  const commitSpellingWord = () => {
    assembler.commitSpellingBuffer();
    syncAssemblerState();
  };

  /**
   * Backspace: removes last letter or last word
   */
  const backspaceSpelling = () => {
    assembler.backspace();
    syncAssemblerState();
  };

  /**
   * Add a confirmed word token directly (Word Mode)
   */
  const addWordToSentence = (word: string) => {
    if (!word || word === 'UNKNOWN') return;
    assembler.addWordToken(word);
    syncAssemblerState();
  };

  /**
   * Clear all words and letters
   */
  const clearSentence = () => {
    assembler.clear();
    syncAssemblerState();
  };

  /**
   * Remove last word
   */
  const removeLastWord = () => {
    assembler.backspace();
    syncAssemblerState();
  };

  /**
   * Smart Append Token:
   * Depending on active mode and token length:
   * - In Alphabet Mode: appends letter to spelling buffer
   * - In Word Mode: appends word token exactly once
   * - In Assisted Mode: routes according to length
   */
  const appendToken = (token: string) => {
    if (!token || token === 'UNKNOWN') return;
    const clean = token.toUpperCase().trim();

    if (recognitionMode === 'alphabet') {
      if (clean.length === 1 && /^[A-Z]$/.test(clean)) {
        addLetterToSpelling(clean);
      }
    } else if (recognitionMode === 'word') {
      if (clean.length > 1) {
        addWordToSentence(clean);
      }
    } else {
      // Assisted Mode
      if (clean.length === 1) {
        addLetterToSpelling(clean);
      } else {
        addWordToSentence(clean);
      }
    }
  };

  /**
   * Resolve disambiguation choice
   */
  const resolveDisambiguation = (choice: string) => {
    setDisambiguationState(null);
    appendToken(choice);
  };

  const dismissDisambiguation = () => {
    setDisambiguationState(null);
  };

  const speakSentence = (customText?: string, lang?: string) => {
    const textToSpeak = customText || sentenceState || sentenceWords.join(' ');
    if (textToSpeak) {
      playTTS(textToSpeak, {
        language: lang || webcamSettings.ttsLanguage,
        voiceName: webcamSettings.ttsVoice,
        rate: webcamSettings.ttsRate,
        pitch: webcamSettings.ttsPitch,
      });
    }
  };

  const currentPrediction = activePrediction?.prediction || 'UNKNOWN';
  const confidence = activePrediction?.confidence || 0;
  const topPredictions = activePrediction?.topPredictions || [];
  const isUnknown = activePrediction ? activePrediction.isUnknown : true;

  return (
    <TranslatorContext.Provider
      value={{
        activePrediction,
        setActivePrediction,
        recognitionMode,
        setRecognitionMode,
        recognitionFocus,
        setRecognitionFocus,
        sentenceWords,
        setSentenceWords,
        spellingBuffer,
        addLetterToSpelling,
        commitSpellingWord,
        backspaceSpelling,
        addWordToSentence,
        clearSentence,
        removeLastWord,
        appendToken,
        sentenceState,
        setSentence,
        speakSentence,
        disambiguationState,
        setDisambiguationState,
        resolveDisambiguation,
        dismissDisambiguation,
        webcamSettings,
        updateWebcamSettings,
        isTranslating,
        setIsTranslating,
        handsDetected,
        setHandsDetected,
        latencyMs,
        setLatencyMs,
        isLocked,
        setIsLocked,
        sentenceFormationMode,
        setSentenceFormationMode,
        currentPrediction,
        confidence,
        topPredictions,
        isUnknown,
      }}
    >
      {children}
    </TranslatorContext.Provider>
  );
};

export function useTranslator(): TranslatorContextType {
  const context = useContext(TranslatorContext);
  if (!context) {
    throw new Error('useTranslator must be used within a TranslatorProvider');
  }
  return context;
}
