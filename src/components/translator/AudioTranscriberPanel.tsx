import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Upload,
  Sparkles,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  Languages,
  Layers,
  FileAudio,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { SignBridgeAPI } from '../../services/api';
import { AudioTranscriptionResult, AudioSignBreakdownItem, SUPPORTED_LANGUAGES } from '../../types';
import { useTranslator } from '../../context/TranslatorContext';
import { useTheme } from '../../context/ThemeContext';
import { playTTS } from '../../utils/ttsPlayer';

interface AudioTranscriberPanelProps {
  onOpenGuideForLetter?: (letter: string) => void;
}

const SAMPLE_SPEECH_PROMPTS = [
  'Hello! How are you doing today?',
  'வணக்கம்! நீங்கள் எப்படி இருக்கிறீர்கள்?',
  'Hola, ¿cómo estás hoy?',
  'Bonjour, comment allez-vous?',
  'Hallo, wie geht es dir?',
  'नमस्ते, आप कैसे हैं?',
  'My name is Alex and I need help.',
  'மிக்க நன்றி, நல்ல நாளாக அமையட்டும்!',
  'Please call the doctor right now.',
  'உங்களை சந்தித்ததில் மிக்க மகிழ்ச்சி.',
];

export const AudioTranscriberPanel: React.FC<AudioTranscriberPanelProps> = ({
  onOpenGuideForLetter,
}) => {
  const { setSentence, sentenceState, speakSentence } = useTranslator();
  const { currentTheme } = useTheme();

  // Selected Target Language
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('ta-IN');
  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguageCode) || SUPPORTED_LANGUAGES[1];

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Transcription State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<AudioTranscriptionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcriptionHistory, setTranscriptionHistory] = useState<AudioTranscriptionResult[]>([]);

  // UI helpers
  const [copiedText, setCopiedText] = useState(false);
  const [copiedGloss, setCopiedGloss] = useState(false);
  const [selectedWordToSpell, setSelectedWordToSpell] = useState<string | null>(null);

  // Audio Context & Visualizer Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Draw Audio Waveform on Canvas
  const drawWaveform = () => {
    if (!analyserRef.current || !visualizerCanvasRef.current) return;
    const canvas = visualizerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = currentTheme.bgSurface;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / (bufferLength / 2)) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength / 2; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Gradient color for visualizer
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, currentTheme.accentPrimary);
        gradient.addColorStop(1, currentTheme.accentSecondary);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    render();
  };

  // Start Microphone Recording
  const startRecording = async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];
    setRecordDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup Web Audio API for visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      drawWaveform();

      // Find supported mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav',
      ];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: selectedMimeType || 'audio/webm',
        });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        stopRecordingCleanup();
      };

      recorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);

      // Start duration counter
      const startTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please grant microphone access in your browser settings to record audio.'
          : `Failed to access microphone: ${err.message || err}`
      );
      stopRecordingCleanup();
    }
  };

  // Stop Microphone Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  // Pause / Resume Recording
  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // Reset Audio & State
  const resetAudio = () => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordDuration(0);
    setErrorMessage(null);
  };

  // Handle Audio File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetAudio();
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Read duration if possible
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setRecordDuration(Math.round(tempAudio.duration));
    };
  };

  // Transcribe Audio with Gemini 3.5 Flash
  const handleTranscribe = async () => {
    if (!audioBlob) {
      setErrorMessage('Please record audio or upload an audio file first.');
      return;
    }

    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      // Convert Blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64DataUrl = await base64Promise;

      const mimeType = audioBlob.type || 'audio/webm';
      const result = await SignBridgeAPI.transcribeAudio(
        base64DataUrl,
        mimeType,
        recordDuration,
        selectedLanguageCode
      );

      setTranscriptionResult(result);
      setTranscriptionHistory((prev) => [result, ...prev.slice(0, 9)]);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(
        err.message || 'Failed to transcribe audio with Gemini 3.5 Flash. Please try again.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Copy Transcribed Text
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Copy ASL Gloss
  const handleCopyGloss = (gloss: string) => {
    navigator.clipboard.writeText(gloss);
    setCopiedGloss(true);
    setTimeout(() => setCopiedGloss(false), 2000);
  };

  // Transfer text into Sentence Builder
  const handleInsertIntoSentence = (text: string) => {
    const current = typeof sentenceState === 'string' ? sentenceState : (sentenceState as any)?.constructedSentence || '';
    const nextSentence = current ? `${current} ${text}` : text;
    setSentence(nextSentence);
  };

  // Test and demonstrate transcription on a sample prompt
  const handleSelectSamplePrompt = (prompt: string) => {
    const words = prompt.split(/\s+/).filter(Boolean);
    const breakdown: AudioSignBreakdownItem[] = words.map((w) => {
      const clean = w.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return {
        word: w,
        aslType: 'LEXICAL_SIGN',
        gloss: clean,
        instruction: `Perform or fingerspell the gesture for "${clean}" in ASL`,
        translation: w,
      };
    });

    const sampleResult: AudioTranscriptionResult = {
      id: `sample_${Date.now()}`,
      transcription: prompt,
      language: 'English (US)',
      confidence: 0.98,
      aslGloss: words.map((w) => w.toUpperCase().replace(/[^A-Z0-9]/g, '')).join(' '),
      signBreakdown: breakdown,
      summary: `Sample utterance demonstrated: "${prompt}"`,
      modelUsed: 'SignBridge Speech Core',
      timestamp: new Date().toISOString(),
    };

    setTranscriptionResult(sampleResult);
    setTranscriptionHistory((prev) => [sampleResult, ...prev.slice(0, 8)]);
    playTTS(prompt, { lang: 'en-US' });
  };

  // Format Duration seconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Play / Pause Audio Player
  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <div id="audio-transcriber-container" className="space-y-6 animate-fadeIn">
      {/* Header Bento Card */}
      <div
        className="rounded-2xl border shadow-lg p-5 relative overflow-hidden transition-colors"
        style={{
          backgroundColor: currentTheme.bgCard,
          borderColor: currentTheme.borderColor,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: currentTheme.borderColor }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: currentTheme.badgeBg,
                borderColor: currentTheme.borderHover,
                color: currentTheme.accentPrimary,
              }}
            >
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: currentTheme.badgeBg,
                    borderColor: currentTheme.borderHover,
                    color: currentTheme.accentPrimary,
                  }}
                >
                  Multimodal Speech-To-Text
                </span>
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1"
                  style={{
                    backgroundColor: currentTheme.bgSurface,
                    borderColor: currentTheme.borderColor,
                    color: currentTheme.accentSecondary,
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini AI
                </span>
              </div>
              <h1 className="text-lg font-bold mt-0.5" style={{ color: currentTheme.textPrimary }}>
                Microphone Audio Transcription & ASL Bridge
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Target Language Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: currentTheme.bgSurface, borderColor: currentTheme.borderColor }}>
              <Languages className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
              <select
                value={selectedLanguageCode}
                onChange={(e) => setSelectedLanguageCode(e.target.value)}
                className="text-xs font-mono font-bold bg-transparent border-none cursor-pointer focus:outline-none"
                style={{ color: currentTheme.textPrimary }}
                title="Select Translation Target Language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.textPrimary }}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*,.mp3,.wav,.webm,.ogg,.m4a,.aac"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
              style={{
                backgroundColor: currentTheme.bgSurface,
                borderColor: currentTheme.borderColor,
                color: currentTheme.textPrimary,
              }}
            >
              <Upload className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
              <span>Upload Audio</span>
            </button>
          </div>
        </div>

        {/* Main Recorder & Visualizer Box */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-5">
          {/* Left: Waveform Canvas & Live Recording Controls (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div
              className="rounded-xl border p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]"
              style={{
                backgroundColor: currentTheme.bgSurface,
                borderColor: currentTheme.borderColor,
              }}
            >
              {/* Waveform visualizer canvas */}
              <canvas
                ref={visualizerCanvasRef}
                width={400}
                height={100}
                className={`w-full h-24 rounded-lg transition-opacity ${
                  isRecording ? 'opacity-100' : 'opacity-20'
                }`}
              />

              {/* Status Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                {isRecording ? (
                  <div className="flex flex-col items-center gap-1 bg-white/90 dark:bg-slate-900/90 px-4 py-2 rounded-xl border border-rose-500/30 backdrop-blur-sm shadow-lg">
                    <div className="flex items-center gap-2 text-rose-500 font-mono text-xs font-bold uppercase tracking-wider">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>{isPaused ? 'Recording Paused' : 'Listening & Recording'}</span>
                    </div>
                    <div className="font-mono text-lg font-black tracking-widest" style={{ color: currentTheme.textPrimary }}>
                      {formatTime(recordDuration)}
                    </div>
                  </div>
                ) : audioBlob ? (
                  <div
                    className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl border backdrop-blur-sm shadow-lg pointer-events-auto"
                    style={{
                      backgroundColor: currentTheme.bgCard,
                      borderColor: currentTheme.borderHover,
                    }}
                  >
                    <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider" style={{ color: currentTheme.accentPrimary }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Audio Clip Ready ({formatTime(recordDuration)})</span>
                    </div>
                    {audioUrl && (
                      <div className="flex items-center gap-2 mt-1">
                        <audio
                          ref={audioPlayerRef}
                          src={audioUrl}
                          onEnded={() => setIsPlayingAudio(false)}
                          className="hidden"
                        />
                        <button
                          onClick={togglePlayAudio}
                          className="px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border cursor-pointer hover:scale-105 transition-all"
                          style={{
                            backgroundColor: currentTheme.badgeBg,
                            borderColor: currentTheme.borderHover,
                            color: currentTheme.accentPrimary,
                          }}
                        >
                          {isPlayingAudio ? (
                            <>
                              <Pause className="w-3 h-3" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" /> Listen Back
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-1" style={{ color: currentTheme.textMuted }}>
                    <Mic className="w-6 h-6 mx-auto mb-1 opacity-60" style={{ color: currentTheme.accentPrimary }} />
                    <p className="text-xs font-mono">Press Record to capture speech with your microphone</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recorder Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <button
                    id="btn-record-audio"
                    onClick={startRecording}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-105"
                    style={{ background: currentTheme.accentGradient }}
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <>
                    <button
                      id="btn-stop-record-audio"
                      onClick={stopRecording}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Recording</span>
                    </button>

                    <button
                      onClick={togglePauseRecording}
                      className="px-3.5 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                      style={{
                        backgroundColor: currentTheme.bgSurface,
                        borderColor: currentTheme.borderColor,
                        color: currentTheme.textPrimary,
                      }}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                  </>
                )}

                {(audioBlob || isRecording) && (
                  <button
                    onClick={resetAudio}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Clear recorded audio"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Transcribe Trigger Button */}
              <button
                id="btn-transcribe-gemini"
                onClick={handleTranscribe}
                disabled={!audioBlob || isRecording || isTranscribing}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer hover:scale-105"
                style={{ background: currentTheme.accentGradient }}
              >
                <Sparkles className={`w-4 h-4 ${isTranscribing ? 'animate-spin' : ''}`} />
                <span>{isTranscribing ? 'Transcribing Audio...' : 'Transcribe with Gemini'}</span>
              </button>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}
          </div>

          {/* Right: Quick Sample Prompts & Model Info (5 cols) */}
          <div
            className="md:col-span-5 rounded-xl border p-4 flex flex-col justify-between space-y-3"
            style={{
              backgroundColor: currentTheme.bgSurface,
              borderColor: currentTheme.borderColor,
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold flex items-center gap-1" style={{ color: currentTheme.accentPrimary }}>
                  <BookOpen className="w-3 h-3" />
                  Try Speaking Sample Phrases:
                </span>
              </div>
              <p className="text-[11px] mb-2.5 leading-relaxed" style={{ color: currentTheme.textSecondary }}>
                Click a sample phrase to read aloud into your microphone and test ASL speech translation:
              </p>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {SAMPLE_SPEECH_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSamplePrompt(prompt)}
                    className="w-full p-2.5 rounded-xl text-xs border flex items-center justify-between text-left transition-all hover:scale-[1.01] hover:shadow-sm cursor-pointer group"
                    style={{
                      backgroundColor: currentTheme.bgCard,
                      borderColor: currentTheme.borderColor,
                      color: currentTheme.textPrimary,
                    }}
                    title="Click to test transcription & hear audio"
                  >
                    <span className="font-sans line-clamp-1">"{prompt}"</span>
                    <Volume2 className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-sky-500 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-[10px] font-mono" style={{ borderColor: currentTheme.borderColor, color: currentTheme.textMuted }}>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" style={{ color: currentTheme.accentPrimary }} />
                <span>Model: Gemini Flash</span>
              </span>
              <span>Audio Sampling: 16-48 kHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcription Output Card */}
      {transcriptionResult && (
        <div
          id="transcription-result-card"
          className="rounded-2xl border shadow-xl p-5 space-y-5 animate-fadeIn"
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.borderHover,
          }}
        >
          {/* Output Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4" style={{ borderColor: currentTheme.borderColor }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl border flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.badgeBg,
                  borderColor: currentTheme.borderHover,
                  color: currentTheme.accentPrimary,
                }}
              >
                <FileAudio className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: currentTheme.accentPrimary }}>
                  Gemini Transcription Output
                </span>
                <h3 className="text-base font-bold" style={{ color: currentTheme.textPrimary }}>Transcribed Speech & ASL Synthesis</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5"
                style={{
                  backgroundColor: currentTheme.bgSurface,
                  borderColor: currentTheme.borderColor,
                  color: currentTheme.textPrimary,
                }}
              >
                <Languages className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                <span>{transcriptionResult.language}</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                {Math.round(transcriptionResult.confidence * 100)}% Confidence
              </span>

              <span
                className="px-2.5 py-1 rounded-lg border text-xs font-mono"
                style={{
                  backgroundColor: currentTheme.badgeBg,
                  borderColor: currentTheme.borderHover,
                  color: currentTheme.accentPrimary,
                }}
              >
                {transcriptionResult.modelUsed}
              </span>
            </div>
          </div>

          {/* Verbatim Transcription Text Box */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              backgroundColor: currentTheme.bgSurface,
              borderColor: currentTheme.borderColor,
            }}
          >
            <div className="flex items-center justify-between text-xs" style={{ color: currentTheme.textSecondary }}>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: currentTheme.textMuted }}>
                Spoken English (Verbatim)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyText(transcriptionResult.transcription)}
                  className="px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: currentTheme.bgCard,
                    borderColor: currentTheme.borderColor,
                    color: currentTheme.textPrimary,
                  }}
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => {
                    playTTS(transcriptionResult.transcription, {
                      lang: selectedLanguageCode,
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: currentTheme.bgCard,
                    borderColor: currentTheme.borderColor,
                    color: currentTheme.textPrimary,
                  }}
                  title="Read aloud"
                >
                  <Volume2 className="w-3 h-3" style={{ color: currentTheme.accentPrimary }} />
                  <span>Speak</span>
                </button>

                <button
                  onClick={() => handleInsertIntoSentence(transcriptionResult.transcription)}
                  className="px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: currentTheme.badgeBg,
                    borderColor: currentTheme.borderHover,
                    color: currentTheme.accentPrimary,
                  }}
                  title="Append to Sentence Builder"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Insert to Builder</span>
                </button>
              </div>
            </div>

            <div className="text-lg font-medium leading-relaxed font-sans" style={{ color: currentTheme.textPrimary }}>
              "{transcriptionResult.transcription}"
            </div>

            {/* Target Language Translation Block */}
            {(transcriptionResult.targetTranslation || transcriptionResult.tamilTranslation) && (
              <div
                className="p-3.5 rounded-xl border space-y-2 mt-2"
                style={{
                  backgroundColor: currentTheme.bgCard,
                  borderColor: currentTheme.borderColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5" style={{ color: currentTheme.accentSecondary }}>
                    <Languages className="w-3.5 h-3.5" />
                    {selectedLangObj.nativeName} ({selectedLangObj.name} Translation)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyText(transcriptionResult.targetTranslation || transcriptionResult.tamilTranslation || '')}
                      className="px-2 py-0.5 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: currentTheme.bgSurface,
                        borderColor: currentTheme.borderColor,
                        color: currentTheme.textPrimary,
                      }}
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => speakSentence(transcriptionResult.targetTranslation || transcriptionResult.tamilTranslation || '', selectedLangObj.code)}
                      className="px-2 py-0.5 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: currentTheme.badgeBg,
                        borderColor: currentTheme.borderHover,
                        color: currentTheme.accentSecondary,
                      }}
                      title={`Speak ${selectedLangObj.name} audio`}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{selectedLangObj.nativeName}</span>
                    </button>
                  </div>
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {transcriptionResult.targetTranslation || transcriptionResult.tamilTranslation}
                </div>
              </div>
            )}

            {/* Multilingual Translation Matrix (All 16+ Languages) */}
            {transcriptionResult.multilingualTranslations && Object.keys(transcriptionResult.multilingualTranslations).length > 0 && (
              <div className="pt-2.5 border-t space-y-2 mt-2" style={{ borderColor: currentTheme.borderColor }}>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold block" style={{ color: currentTheme.accentPrimary }}>
                  🌐 All Available Language Translations ({SUPPORTED_LANGUAGES.length} Languages):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {SUPPORTED_LANGUAGES.filter((l: any) => l.code !== 'en-US').map((lang: any) => {
                    const transObj = (transcriptionResult.multilingualTranslations as any)?.[lang.code] ||
                      (transcriptionResult.multilingualTranslations as any)?.[lang.key];
                    const transText: string = typeof transObj === 'string' ? transObj : transObj?.translation || '';
                    if (!transText) return null;
                    return (
                      <div
                        key={lang.code}
                        className="p-2 rounded-lg border text-xs flex items-center justify-between gap-1.5"
                        style={{
                          backgroundColor: currentTheme.bgSurface,
                          borderColor: currentTheme.borderColor,
                        }}
                      >
                        <div className="min-w-0 pr-1">
                          <span className="text-[9px] font-mono font-bold block truncate" style={{ color: currentTheme.textMuted }}>
                            {lang.nativeName || lang.name}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
                            {transText}
                          </span>
                        </div>
                        <button
                          onClick={() => speakSentence(transText, lang.code)}
                          className="p-1 rounded border hover:opacity-80 transition-all cursor-pointer shrink-0"
                          style={{
                            backgroundColor: currentTheme.badgeBg,
                            borderColor: currentTheme.borderHover,
                            color: currentTheme.accentPrimary,
                          }}
                          title={`Speak ${lang.name}`}
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {transcriptionResult.summary && (
              <p className="text-xs italic pt-2 border-t" style={{ borderColor: currentTheme.borderColor, color: currentTheme.textSecondary }}>
                {transcriptionResult.summary}
              </p>
            )}
          </div>

          {/* ASL Gloss Notation & Sign Breakdown */}
          {transcriptionResult.aslGloss && (
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: currentTheme.bgSurface,
                borderColor: currentTheme.borderHover,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5" style={{ color: currentTheme.accentPrimary }}>
                  <Layers className="w-3.5 h-3.5" />
                  ASL Gloss Translation Notation
                </span>
                <button
                  onClick={() => handleCopyGloss(transcriptionResult.aslGloss || '')}
                  className="px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: currentTheme.bgCard,
                    borderColor: currentTheme.borderColor,
                    color: currentTheme.textPrimary,
                  }}
                >
                  {copiedGloss ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedGloss ? 'Copied' : 'Copy Gloss'}</span>
                </button>
              </div>

              <div className="text-base font-mono font-bold tracking-wider" style={{ color: currentTheme.accentPrimary }}>
                {transcriptionResult.aslGloss}
              </div>
            </div>
          )}

          {/* Word-by-Word Sign Language Gesture Breakdown */}
          {transcriptionResult.signBreakdown && transcriptionResult.signBreakdown.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5" style={{ color: currentTheme.textPrimary }}>
                  <BookOpen className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                  Sign-by-Sign Gesture Instructions ({transcriptionResult.signBreakdown.length} Signs)
                </h4>
                <span className="text-[11px] font-mono" style={{ color: currentTheme.textMuted }}>
                  Click any letter to open reference tutorial
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {transcriptionResult.signBreakdown.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border space-y-2 flex flex-col justify-between transition-all"
                    style={{
                      backgroundColor: currentTheme.bgSurface,
                      borderColor: currentTheme.borderColor,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold font-sans" style={{ color: currentTheme.textPrimary }}>{item.word}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border"
                          style={{
                            backgroundColor: currentTheme.badgeBg,
                            borderColor: currentTheme.borderHover,
                            color: currentTheme.accentPrimary,
                          }}
                        >
                          {item.aslType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs font-mono font-semibold mt-1 flex items-center justify-between" style={{ color: currentTheme.accentPrimary }}>
                        <span>[{item.gloss}]</span>
                        {item.tamilMeaning && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                            தமிழ்: {item.tamilMeaning}
                          </span>
                        )}
                      </div>

                      {item.instruction && (
                        <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: currentTheme.textSecondary }}>
                          {item.instruction}
                        </p>
                      )}
                    </div>

                    {/* Quick fingerspelling clickable letters */}
                    <div className="pt-2 border-t flex items-center gap-1 flex-wrap" style={{ borderColor: currentTheme.borderColor }}>
                      <span className="text-[9px] font-mono uppercase" style={{ color: currentTheme.textMuted }}>Spell:</span>
                      {item.word
                        .toUpperCase()
                        .replace(/[^A-Z]/g, '')
                        .split('')
                        .map((char, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => onOpenGuideForLetter && onOpenGuideForLetter(char)}
                            title={`View ASL guide for letter ${char}`}
                            className="w-5 h-5 rounded border text-[10px] font-mono font-bold transition-colors flex items-center justify-center cursor-pointer hover:scale-110"
                            style={{
                              backgroundColor: currentTheme.bgCard,
                              borderColor: currentTheme.borderColor,
                              color: currentTheme.textPrimary,
                            }}
                          >
                            {char}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transcription Session History */}
      {transcriptionHistory.length > 1 && (
        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.borderColor,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5" style={{ color: currentTheme.textSecondary }}>
              <Clock className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
              Recent Audio Transcriptions in Session ({transcriptionHistory.length})
            </span>
          </div>

          <div className="space-y-2">
            {transcriptionHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setTranscriptionResult(item)}
                className="p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3"
                style={{
                  backgroundColor: transcriptionResult?.id === item.id ? currentTheme.badgeBg : currentTheme.bgSurface,
                  borderColor: transcriptionResult?.id === item.id ? currentTheme.borderHover : currentTheme.borderColor,
                }}
              >
                <div className="truncate flex-1">
                  <div className="text-xs font-medium font-sans truncate" style={{ color: currentTheme.textPrimary }}>"{item.transcription}"</div>
                  <div className="text-[10px] font-mono flex items-center gap-2 mt-0.5" style={{ color: currentTheme.textMuted }}>
                    <span>{item.language}</span>
                    <span>•</span>
                    <span>{Math.round(item.confidence * 100)}% accuracy</span>
                    <span>•</span>
                    <span style={{ color: currentTheme.accentPrimary }}>{item.modelUsed}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInsertIntoSentence(item.transcription);
                  }}
                  className="px-2 py-1 rounded border text-[10px] font-mono font-bold whitespace-nowrap cursor-pointer"
                  style={{
                    backgroundColor: currentTheme.bgCard,
                    borderColor: currentTheme.borderHover,
                    color: currentTheme.accentPrimary,
                  }}
                >
                  Insert
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
