export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface BoundingBox {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  width: number;
  height: number;
}

export interface DetectedHand {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right' | 'Unknown';
  score: number;
  boundingBox?: BoundingBox;
}

export interface TopPrediction {
  label: string;
  confidence: number;
  percentage: number;
}

export type RecognitionMode = 'alphabet' | 'word' | 'assisted';

export type RecognitionState =
  | 'WAITING'
  | 'DETECTING'
  | 'CONFIRMING'
  | 'ACCEPTED'
  | 'RELEASE_REQUIRED'
  | 'UNCERTAIN';

export type RejectionReason =
  | 'LOW_CONFIDENCE'
  | 'RELEASE_REQUIRED'
  | 'MODE_MISMATCH'
  | 'UNSTABLE_MOTION'
  | 'UNKNOWN_SIGN'
  | 'AMBIGUOUS';

export type SignLifecyclePhase = 'IDLE' | 'DETECTION' | 'HOLD_CONFIRM' | 'COMMITTED';

export type ClassifierMode = 'REST' | 'DYNAMIC_LEXICAL' | 'STATIC_FINGERSPELLED' | string;

export interface FingerStates {
  thumb: string;
  index: string;
  middle: string;
  ring: string;
  pinky: string;
}

export interface ClassificationResult {
  prediction: string;
  confidence: number;
  probability: number;
  topPredictions: TopPrediction[];
  isUnknown: boolean;
  mode: ClassifierMode;
  motionEnergy: number;
  fingerStates: FingerStates;
  boundingBox?: BoundingBox;
  phase?: SignLifecyclePhase;
  isWord?: boolean;
  needsDisambiguation?: boolean;
  disambiguationOptions?: {
    alphabetCandidate?: string;
    wordCandidate?: string;
  };
}

export interface ValidatedPrediction {
  label: string;
  confidence: number;
  mode: 'ALPHABET' | 'WORD';
  isWord: boolean;
  state: RecognitionState;
  rejectionReason?: RejectionReason | null;
  alternatives: TopPrediction[];
  needsDisambiguation?: boolean;
  disambiguationOptions?: {
    alphabetCandidate?: string;
    wordCandidate?: string;
  };
  timestamp: number;
}

export interface SentenceManagerState {
  tokens: string[];
  currentWordBuffer: string;
  assembledSentence: string;
  lastCommittedToken: string | null;
  lastCommittedMode: 'ALPHABET' | 'WORD' | null;
  canUndo: boolean;
  history: Array<{ tokens: string[]; currentWordBuffer: string }>;
}

export interface SentenceState {
  tokens: string[];
  rawText: string;
  constructedSentence: string;
  polishedSentence?: string;
  targetTranslation?: string;
  lastUpdated: number;
}

export interface GrammarPolishResult {
  originalTokens: string[];
  polishedSentence: string;
  targetTranslation?: string;
  confidence: number;
  model: string;
}

export interface SignBridgeUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

export interface PredictionHistoryItem {
  id: string;
  userId?: string;
  prediction: string;
  confidence: number;
  sentence?: string;
  hands_detected?: number;
  timestamp: string;
  source?: 'webcam' | 'upload' | 'practice';
  image_snapshot?: string;
}

export type HistoryItem = PredictionHistoryItem;

export interface Theme {
  id: string;
  name: string;
  bgMain: string;
  bgCard: string;
  bgSurface: string;
  bgHeader?: string;
  borderColor: string;
  borderHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentTertiary?: string;
  badgeBg: string;
  accentGradient: string;
  glowColor: string;
}

export interface SignItem {
  name: string;
  emoji: string;
  meaning: string;
  category: string;
  description?: string;
  tips?: string[];
  palmOrientation?: string;
  difficulty?: string;
  commonMistakes?: string[];
}

export interface ASLAlphabetEntry {
  letter: string;
  name: string;
  category: string;
  fingerPositions?: any;
  palmOrientation?: string;
  difficulty?: string;
  commonMistakes?: string[];
  meaning?: string;
  description?: string;
  tips?: string[] | string;
}

export interface AppSettings {
  mirrorWebcam: boolean;
  showLandmarksOverlay: boolean;
  showBoundingBox: boolean;
  confidenceThreshold: number;
  holdConfirmDurationMs: number;
  ttsLanguage: string;
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
  soundEffects: boolean;
}

export type WebcamSettings = AppSettings;

export interface AudioSignBreakdownItem {
  sign?: string;
  word?: string;
  english?: string;
  aslType?: string;
  gloss?: string;
  tamilMeaning?: string;
  instruction?: string;
  translation?: string;
  confidence?: number;
  category?: string;
}

export interface AudioTranscriptionResult {
  id: string;
  transcription: string;
  confidence: number;
  timestamp?: string;
  constructedSentence?: string;
  aslGloss?: string;
  targetLanguage?: string;
  targetTranslation?: string;
  language?: string;
  modelUsed?: string;
  tamilTranslation?: string;
  multilingualTranslations?: {
    language: string;
    flag: string;
    translation: string;
  }[];
  summary?: string;
  signBreakdown?: AudioSignBreakdownItem[];
}

export interface SupportedLanguage {
  code: string;
  key: string;
  name: string;
  flag: string;
  tamilName: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en-US', key: 'en', name: 'English (US)', flag: '🇺🇸', tamilName: 'ஆங்கிலம்', nativeName: 'English (US)' },
  { code: 'ta-IN', key: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳', tamilName: 'தமிழ்', nativeName: 'தமிழ்' },
  { code: 'hi-IN', key: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳', tamilName: 'இந்தி', nativeName: 'हिन्दी' },
  { code: 'es-ES', key: 'es', name: 'Spanish (Español)', flag: '🇪🇸', tamilName: 'ஸ்பானிஷ்', nativeName: 'Español' },
  { code: 'fr-FR', key: 'fr', name: 'French (Français)', flag: '🇫🇷', tamilName: 'பிரெஞ்சு', nativeName: 'Français' },
  { code: 'de-DE', key: 'de', name: 'German (Deutsch)', flag: '🇩🇪', tamilName: 'ஜெர்மன்', nativeName: 'Deutsch' },
];

export interface AnalyticsStats {
  totalPredictions: number;
  averageConfidence: number;
  totalSentences: number;
  gestureCounts: Record<string, number>;
  dailyActivity: {
    date: string;
    count: number;
    accuracy: number;
  }[];
  totalPracticeTimeMinutes: number;
}
