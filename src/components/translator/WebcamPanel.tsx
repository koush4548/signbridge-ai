import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Play,
  Upload,
  AlertCircle,
  HelpCircle,
  Video,
  Sparkles,
  Radio,
  Search,
  CheckCircle2,
  FlipHorizontal,
  Sliders,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { useTranslator } from '../../context/TranslatorContext';
import { useTheme } from '../../context/ThemeContext';
import { getHandLandmarker, detectHandLandmarks } from '../../utils/handTracker';
import { classifyASLLandmarks } from '../../utils/aslClassifier';
import { ClassificationResult, HandLandmark } from '../../types';
import { TemporalConfidenceFilter } from '../../utils/confidenceFilter';
import { TemporalGestureTracker } from '../../utils/temporalGestureTracker';
import { playChime } from '../../utils/audioChime';

interface WebcamPanelProps {
  onCapturePrediction?: (result: ClassificationResult) => void;
  className?: string;
}

// Canonical synthetic landmark templates for virtual simulation mode
const SYNTHETIC_LANDMARK_TEMPLATES: Record<string, HandLandmark[]> = {
  A: Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + (i % 5 - 2) * 0.02,
    y: 0.5 + Math.floor(i / 5) * 0.04,
    z: 0,
  })),
  B: Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + (i % 4 - 1.5) * 0.02,
    y: 0.35 + (i > 4 ? (i % 4) * 0.06 : 0.08),
    z: 0,
  })),
  C: Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + Math.cos((i / 21) * Math.PI) * 0.12,
    y: 0.5 + Math.sin((i / 21) * Math.PI) * 0.12,
    z: 0,
  })),
  L: Array.from({ length: 21 }, (_, i) => ({
    x: i <= 4 ? 0.38 + i * 0.025 : 0.5,
    y: i > 4 && i <= 8 ? 0.25 + (i - 5) * 0.05 : 0.55,
    z: 0,
  })),
  V: Array.from({ length: 21 }, (_, i) => ({
    x: i > 4 && i <= 8 ? 0.44 : i > 8 && i <= 12 ? 0.56 : 0.5,
    y: i > 4 && i <= 12 ? 0.28 + (i % 4) * 0.05 : 0.6,
    z: 0,
  })),
  Y: Array.from({ length: 21 }, (_, i) => ({
    x: i <= 4 ? 0.35 : i >= 17 ? 0.65 : 0.5,
    y: i <= 4 || i >= 17 ? 0.35 : 0.55,
    z: 0,
  })),
  HELLO: Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + (i % 5 - 2) * 0.03,
    y: 0.3 + Math.floor(i / 5) * 0.05,
    z: 0,
  })),
  I_LOVE_YOU: Array.from({ length: 21 }, (_, i) => ({
    x: i <= 4 ? 0.35 : i > 4 && i <= 8 ? 0.48 : i >= 17 ? 0.65 : 0.5,
    y: i <= 4 || (i > 4 && i <= 8) || i >= 17 ? 0.3 : 0.6,
    z: 0,
  })),
};

export const WebcamPanel: React.FC<WebcamPanelProps> = ({ onCapturePrediction, className = '' }) => {
  const { currentTheme } = useTheme();
  const {
    activePrediction,
    setActivePrediction,
    webcamSettings,
    updateWebcamSettings,
    isTranslating,
    setIsTranslating,
    recognitionMode,
    recognitionFocus,
    sentenceFormationMode,
    addLetterToSpelling,
    addWordToSentence,
    setDisambiguationState,
    setIsLocked,
    setHandsDetected,
    setLatencyMs,
  } = useTranslator();

  const confidenceFilterRef = useRef<TemporalConfidenceFilter>(
    new TemporalConfidenceFilter({
      minConfidenceThreshold: webcamSettings.confidenceThreshold || 0.68,
      requiredHoldFrames: 4,
      commitCooldownMs: 700,
    })
  );
  const temporalTrackerRef = useRef<TemporalGestureTracker>(new TemporalGestureTracker(24));

  useEffect(() => {
    confidenceFilterRef.current = new TemporalConfidenceFilter({
      minConfidenceThreshold: webcamSettings.confidenceThreshold || 0.68,
      requiredHoldFrames: 4,
      commitCooldownMs: 700,
    });
  }, [webcamSettings.confidenceThreshold]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const virtualCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const virtualAnimId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<{ type: string; message: string } | null>(null);
  const [fps, setFps] = useState<number>(30);
  const [detectedHandsCount, setDetectedHandsCount] = useState<number>(0);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [isVirtualMode, setIsVirtualMode] = useState<boolean>(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isScanningDevices, setIsScanningDevices] = useState<boolean>(false);
  const [deviceScanMessage, setDeviceScanMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Discover and enumerate video devices
  const discoverDevices = useCallback(async (requestPermissionFirst = false) => {
    setIsScanningDevices(true);
    setDeviceScanMessage(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setDeviceScanMessage('MediaDevices not supported in this browser environment');
      setIsScanningDevices(false);
      return;
    }

    try {
      // If requested or if labels are blank, prompt getUserMedia briefly so browser releases device labels
      if (requestPermissionFirst) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          tempStream.getTracks().forEach((t) => t.stop());
        } catch {
          // Continue enumeration even if permission prompt was dismissed
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);

      if (videoInputs.length > 0) {
        setDeviceScanMessage(`Found ${videoInputs.length} camera ${videoInputs.length === 1 ? 'device' : 'devices'}`);
        // If current selection is default or not found, update
        if (!selectedDeviceId || selectedDeviceId === 'default') {
          setSelectedDeviceId(videoInputs[0].deviceId || 'default');
        }
      } else {
        setDeviceScanMessage('No hardware cameras detected. Virtual stream is ready.');
      }
    } catch (err) {
      console.warn('Device enumeration error:', err);
      setDeviceScanMessage('Could not enumerate cameras');
    } finally {
      setIsScanningDevices(false);
      setTimeout(() => setDeviceScanMessage(null), 4000);
    }
  }, [selectedDeviceId]);

  // Robust multi-tier camera starter
  const startCamera = useCallback(
    async (targetDeviceId?: string, targetFacing?: 'user' | 'environment') => {
      setCameraError(null);
      setIsVirtualMode(false);

      if (virtualAnimId.current) {
        cancelAnimationFrame(virtualAnimId.current);
        virtualAnimId.current = null;
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError({
          type: 'UNSUPPORTED',
          message: 'Webcam API is unavailable in this environment. You can use the Virtual Demo Stream below.',
        });
        setIsTranslating(false);
        return;
      }

      // Stop previous tracks cleanly
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      const devId = targetDeviceId ?? selectedDeviceId;
      const faceMode = targetFacing ?? facingMode;

      // Define multi-tier constraint fallbacks for maximum cross-browser compatibility
      const constraintTiers: MediaStreamConstraints[] = [];

      // Tier 1: Target specific device if valid ID provided (using ideal, NOT exact, to prevent OverconstrainedError)
      if (devId && devId !== 'default' && devId !== 'virtual' && devId !== 'upload') {
        constraintTiers.push({
          video: {
            deviceId: { ideal: devId },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      }

      // Tier 2: Selected facing mode with 640x480 resolution
      constraintTiers.push({
        video: {
          facingMode: faceMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      // Tier 3: Any video with ideal standard resolution
      constraintTiers.push({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      // Tier 4: Minimal bare-metal video constraint
      constraintTiers.push({
        video: true,
        audio: false,
      });

      let acquiredStream: MediaStream | null = null;
      let lastCaughtErr: any = null;

      for (const constraints of constraintTiers) {
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (acquiredStream) break;
        } catch (tierErr: any) {
          lastCaughtErr = tierErr;
          if (tierErr.name === 'NotAllowedError' || tierErr.name === 'PermissionDeniedError') {
            break;
          }
        }
      }

      if (acquiredStream) {
        setStream(acquiredStream);
        setCameraError(null);
        setIsTranslating(true);

        const video = videoRef.current;
        if (video) {
          video.srcObject = acquiredStream;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('muted', 'true');
          video.muted = true;
          video.onloadedmetadata = async () => {
            try {
              await video.play();
            } catch (playErr) {
              console.warn('Video auto-play handled:', playErr);
            }
          };
          try {
            await video.play();
          } catch {
            // Handled by onloadedmetadata
          }
        }

        // Discover and refresh hardware labels now that permission is granted
        discoverDevices(false);
      } else {
        const errName = lastCaughtErr?.name || 'UnknownError';
        let friendlyMessage = 'Camera access was not granted or hardware is unavailable.';

        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          friendlyMessage =
            'Camera permission was blocked by the browser. Click the lock/camera icon in your address bar to Allow, or use the Simulated Demo Stream.';
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          friendlyMessage =
            'No physical webcam detected on this device. Switch to the Simulated Demo Stream below!';
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          friendlyMessage =
            'Camera is in use by another application (Zoom, Teams, or another tab). Close the other app and retry.';
        } else if (errName === 'OverconstrainedError') {
          friendlyMessage = 'Webcam could not satisfy standard resolution constraints. Trying basic fallback...';
        }

        setCameraError({
          type: errName,
          message: friendlyMessage,
        });
        setIsTranslating(false);
      }
    },
    [stream, selectedDeviceId, facingMode, setIsTranslating, discoverDevices]
  );

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (virtualAnimId.current) {
      cancelAnimationFrame(virtualAnimId.current);
      virtualAnimId.current = null;
    }
    setIsTranslating(false);
    setActivePrediction(null);
    setDetectedHandsCount(0);
  }, [stream, setIsTranslating, setActivePrediction]);

  // Flip facing mode between front and back
  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(undefined, nextMode);
  }, [facingMode, startCamera]);

  // Launch Simulated Virtual ASL Feed (Guarantees zero-dependency functionality!)
  const launchVirtualDemoFeed = useCallback(() => {
    setCameraError(null);
    setIsVirtualMode(true);
    setIsTranslating(true);
    setSelectedDeviceId('virtual');

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    const vCanvas = virtualCanvasRef.current || document.createElement('canvas');
    virtualCanvasRef.current = vCanvas;
    vCanvas.width = 640;
    vCanvas.height = 480;
    const vCtx = vCanvas.getContext('2d');
    if (!vCtx) return;

    let frame = 0;
    const signs = ['HELLO', 'A', 'B', 'C', 'L', 'V', 'Y', 'I_LOVE_YOU'];

    const renderVirtualFrame = () => {
      frame++;
      const signIndex = Math.floor(frame / 90) % signs.length;
      const currentSign = signs[signIndex];
      const cycleProgress = (frame % 90) / 90;

      // Dark background with gradient
      vCtx.fillStyle = '#070b16';
      vCtx.fillRect(0, 0, 640, 480);

      // Subtle tech grid lines
      vCtx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
      vCtx.lineWidth = 1;
      for (let x = 0; x < 640; x += 32) {
        vCtx.beginPath();
        vCtx.moveTo(x, 0);
        vCtx.lineTo(x, 480);
        vCtx.stroke();
      }
      for (let y = 0; y < 480; y += 32) {
        vCtx.beginPath();
        vCtx.moveTo(0, y);
        vCtx.lineTo(640, y);
        vCtx.stroke();
      }

      // Render realistic animated ASL hand silhouette
      const cx = 320 + Math.sin(frame * 0.05) * 6;
      const cy = 250 + Math.cos(frame * 0.04) * 4;

      vCtx.save();
      // Palm
      vCtx.fillStyle = 'rgba(251, 207, 180, 0.95)';
      vCtx.beginPath();
      vCtx.ellipse(cx, cy, 62, 75, 0, 0, Math.PI * 2);
      vCtx.fill();

      // Wrist
      vCtx.fillRect(cx - 42, cy + 50, 84, 90);

      // Fingers
      const drawFinger = (angle: number, length: number, isCurled = false) => {
        vCtx.save();
        vCtx.translate(cx, cy - 35);
        vCtx.rotate(angle);
        vCtx.beginPath();
        const effectiveLength = isCurled ? length * 0.45 : length;
        vCtx.roundRect(-11, -effectiveLength, 22, effectiveLength, 11);
        vCtx.fillStyle = isCurled ? 'rgba(224, 175, 145, 0.95)' : 'rgba(251, 207, 180, 0.95)';
        vCtx.fill();
        vCtx.restore();
      };

      const fl = 70;
      if (currentSign === 'B') {
        drawFinger(-0.25, fl, false);
        drawFinger(-0.08, fl + 10, false);
        drawFinger(0.08, fl + 6, false);
        drawFinger(0.25, fl - 6, false);
      } else if (currentSign === 'L') {
        drawFinger(-0.1, fl + 12, false);
        drawFinger(0.1, fl * 0.4, true);
        drawFinger(0.25, fl * 0.4, true);
      } else if (currentSign === 'V') {
        drawFinger(-0.22, fl + 10, false);
        drawFinger(0.22, fl + 8, false);
        drawFinger(0.35, fl * 0.4, true);
      } else if (currentSign === 'Y') {
        drawFinger(-0.1, fl * 0.4, true);
        drawFinger(0.1, fl * 0.4, true);
        drawFinger(0.35, fl - 5, false);
      } else {
        drawFinger(-0.25, fl, false);
        drawFinger(-0.08, fl + 10, false);
        drawFinger(0.08, fl + 6, false);
        drawFinger(0.25, fl - 6, false);
      }
      vCtx.restore();

      // Telemetry badge
      vCtx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      vCtx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      vCtx.lineWidth = 1.5;
      vCtx.beginPath();
      vCtx.roundRect(16, 16, 280, 52, 12);
      vCtx.fill();
      vCtx.stroke();

      vCtx.fillStyle = '#06b6d4';
      vCtx.font = 'bold 13px monospace';
      vCtx.fillText(`[DEMO STREAM] Sign: ${currentSign}`, 28, 38);
      vCtx.fillStyle = '#94a3b8';
      vCtx.font = '10px monospace';
      vCtx.fillText(`Cycle: ${Math.round(cycleProgress * 100)}% | 30 FPS Simulated`, 28, 56);

      // Supply realistic synthetic classification for the simulation
      const templateLandmarks = SYNTHETIC_LANDMARK_TEMPLATES[currentSign] || SYNTHETIC_LANDMARK_TEMPLATES.HELLO;
      const syntheticResult: ClassificationResult = {
        prediction: currentSign,
        confidence: 0.96,
        probability: 0.96,
        isUnknown: false,
        mode: currentSign.length === 1 ? 'STATIC_FINGERSPELLED' : 'DYNAMIC_LEXICAL',
        motionEnergy: 0.05,
        fingerStates: {
          thumb: 'EXTENDED',
          index: 'EXTENDED',
          middle: 'EXTENDED',
          ring: 'CURL',
          pinky: 'CURL',
        },
        topPredictions: [
          { label: currentSign, confidence: 0.96, percentage: 96 },
          { label: currentSign === 'A' ? 'HELLO' : 'A', confidence: 0.02, percentage: 2 },
          { label: currentSign === 'B' ? 'THANK_YOU' : 'B', confidence: 0.01, percentage: 1 },
        ],
        phase: 'HOLD_CONFIRM',
      };

      setActivePrediction(syntheticResult);
      setDetectedHandsCount(1);
      if (onCapturePrediction) {
        onCapturePrediction(syntheticResult);
      }

      virtualAnimId.current = requestAnimationFrame(renderVirtualFrame);
    };

    renderVirtualFrame();

    try {
      const virtualStream = (vCanvas as any).captureStream ? (vCanvas as any).captureStream(30) : null;
      if (virtualStream) {
        setStream(virtualStream);
        if (videoRef.current) {
          videoRef.current.srcObject = virtualStream;
          videoRef.current.play().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Canvas stream capture error:', e);
    }
  }, [stream, setIsTranslating, setActivePrediction, onCapturePrediction]);

  // Handle local video/image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setIsVirtualMode(false);
    setSelectedDeviceId('upload');

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    const fileUrl = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = fileUrl;
      videoRef.current.loop = true;
      videoRef.current.play().catch(() => {});
      setIsTranslating(true);
    }
  };

  // Mount effect: bootstrap model and enumerate devices
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      // 1. Initial device discovery
      await discoverDevices(false);

      // 2. Initialize MediaPipe landmarker
      const landmarker = await getHandLandmarker();
      if (isMounted) {
        setModelLoaded(!!landmarker);
      }

      // 3. Start camera or launch demo
      await startCamera();
    }

    bootstrap();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (virtualAnimId.current) {
        cancelAnimationFrame(virtualAnimId.current);
      }
    };
  }, []);

  // Frame processing loop for hardware webcam
  useEffect(() => {
    let isMounted = true;

    async function setupLoop() {
      const landmarker = await getHandLandmarker();

      const processFrame = () => {
        if (!isMounted) return;

        const now = performance.now();
        frameCountRef.current++;
        if (now - lastFrameTimeRef.current >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current)));
          frameCountRef.current = 0;
          lastFrameTimeRef.current = now;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Run detection loop only for live hardware stream (virtual mode renders its own frames)
        if (!isVirtualMode && video && canvas && video.readyState >= 2 && isTranslating) {
          try {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (landmarker) {
                const startTime = performance.now();
                const detection = detectHandLandmarks(landmarker, video, now);
                const latency = Math.round(performance.now() - startTime);
                setLatencyMs(latency);

                if (detection && detection.landmarks.length > 0) {
                  setDetectedHandsCount(detection.landmarks.length);
                  setHandsDetected(detection.landmarks.length);
                  const rawHand = detection.landmarks[0];
                  const handedness =
                    detection.handednesses && detection.handednesses[0] && detection.handednesses[0][0]
                      ? detection.handednesses[0][0].categoryName
                      : 'Right';

                  // 1. Temporal sequence extraction
                  const temporalFeatures = temporalTrackerRef.current.addFrame(rawHand, now);

                  // 2. Landmark EMA smoothing
                  const smoothedHand = confidenceFilterRef.current.smoothLandmarks(rawHand);

                  // 3. Render landmark overlay
                  if (webcamSettings.showLandmarksOverlay) {
                    drawLandmarks(ctx, smoothedHand, canvas.width, canvas.height, webcamSettings.mirrorWebcam);
                  }

                  // 4. Mode-isolated classification
                  const rawResult = classifyASLLandmarks(smoothedHand, undefined, {
                    recognitionMode,
                    temporalFeatures,
                    handedness,
                  });

                  // 5. Temporal hysteresis & one-shot commit latch
                  const { filteredResult, phase, shouldCommit } = confidenceFilterRef.current.process(
                    rawResult,
                    recognitionMode
                  );

                  if (filteredResult) {
                    setActivePrediction(filteredResult);
                    setIsLocked(phase === 'HOLD_CONFIRM' || phase === 'COMMITTED');

                    if (onCapturePrediction) {
                      onCapturePrediction(filteredResult);
                    }

                    // 6. Handle one-shot automatic commit
                    if (shouldCommit && sentenceFormationMode === 'auto') {
                      if (recognitionMode === 'alphabet') {
                        if (filteredResult.prediction && filteredResult.prediction.length === 1) {
                          addLetterToSpelling(filteredResult.prediction);
                          if (webcamSettings.soundEffects) playChime('click');
                        }
                      } else if (recognitionMode === 'word') {
                        if (filteredResult.isWord && filteredResult.prediction.length > 1) {
                          addWordToSentence(filteredResult.prediction);
                          if (webcamSettings.soundEffects) playChime('success');
                        }
                      } else {
                        // Assisted Mode
                        if (filteredResult.needsDisambiguation && filteredResult.disambiguationOptions) {
                          setDisambiguationState({
                            isOpen: true,
                            alphabetCandidate: filteredResult.disambiguationOptions.alphabetCandidate || '',
                            wordCandidate: filteredResult.disambiguationOptions.wordCandidate || '',
                          });
                        } else if (filteredResult.isWord) {
                          addWordToSentence(filteredResult.prediction);
                          if (webcamSettings.soundEffects) playChime('success');
                        } else if (filteredResult.prediction.length === 1) {
                          addLetterToSpelling(filteredResult.prediction);
                          if (webcamSettings.soundEffects) playChime('click');
                        }
                      }
                    }
                  } else {
                    setActivePrediction(null);
                    setIsLocked(false);
                  }
                } else {
                  // Hand is absent/released -> inform tracker & confidence filter
                  temporalTrackerRef.current.addFrame(null, now);
                  confidenceFilterRef.current.process(null, recognitionMode);
                  setDetectedHandsCount(0);
                  setHandsDetected(0);
                  setActivePrediction(null);
                  setIsLocked(false);
                }
              }
            }
          } catch (frameError) {
            console.warn('[WebcamPanel] Resilient frame pass guard:', frameError);
          }
        }

        animationFrameId.current = requestAnimationFrame(processFrame);
      };

      animationFrameId.current = requestAnimationFrame(processFrame);
    }

    setupLoop();

    return () => {
      isMounted = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [
    isTranslating,
    isVirtualMode,
    webcamSettings,
    recognitionMode,
    sentenceFormationMode,
    addLetterToSpelling,
    addWordToSentence,
    setDisambiguationState,
    setIsLocked,
    setHandsDetected,
    setLatencyMs,
    onCapturePrediction,
    setActivePrediction,
  ]);

  // Landmark Drawing Helper
  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: HandLandmark[],
    width: number,
    height: number,
    mirror: boolean
  ) => {
    ctx.save();
    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17], // Palm base
    ];

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    });

    landmarks.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, idx === 4 || idx === 8 ? 5.5 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = idx === 4 || idx === 8 ? '#f43f5e' : '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.restore();
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border shadow-xl flex flex-col ${className}`}
      style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* TOP HEADER STATUS BAR */}
      <div
        className="flex flex-wrap items-center justify-between px-4 py-3 border-b text-xs font-mono gap-2"
        style={{ borderColor: currentTheme.borderColor, backgroundColor: currentTheme.bgSurface }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isVirtualMode
                ? 'bg-amber-400'
                : stream && isTranslating && !cameraError
                ? 'bg-emerald-400 animate-pulse'
                : isTranslating && !cameraError
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="font-bold text-white tracking-wide">
            {isVirtualMode
              ? 'SIMULATED DEMO STREAM'
              : stream && isTranslating && !cameraError
              ? 'LIVE VISION SENSOR ONLINE'
              : cameraError
              ? 'CAMERA ACCESS BLOCKED'
              : isTranslating
              ? 'STARTING SENSOR...'
              : 'CAMERA PAUSED'}
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-cyan-400">{fps} FPS</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {modelLoaded ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MediaPipe</span> Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting Engine...</span>
            </span>
          )}

          {/* Toggle Landmarks Overlay */}
          <button
            type="button"
            onClick={() => updateWebcamSettings({ showLandmarksOverlay: !webcamSettings.showLandmarksOverlay })}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              webcamSettings.showLandmarksOverlay
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'text-slate-400 border-slate-700 bg-slate-800'
            }`}
            title="Toggle Landmarks Overlay"
          >
            {webcamSettings.showLandmarksOverlay ? (
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden md:inline font-mono text-[11px]">Mesh</span>
          </button>

          {/* Flip / Mirror Video */}
          <button
            type="button"
            onClick={() => updateWebcamSettings({ mirrorWebcam: !webcamSettings.mirrorWebcam })}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              webcamSettings.mirrorWebcam
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'text-slate-400 border-slate-700 bg-slate-800'
            }`}
            title="Mirror Video Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono text-[11px]">Mirror</span>
          </button>

          {/* Upload sample clip */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
            title="Upload Video / Image Sample"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono text-[11px]">Upload</span>
          </button>

          {/* Play / Pause Stream Toggle */}
          {stream && isTranslating ? (
            <button
              type="button"
              onClick={stopCamera}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              title="Pause Video Stream"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCamera()}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              title="Start Video Stream"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Start</span>
            </button>
          )}
        </div>
      </div>

      {/* PROMINENT VIDEO DEVICE & INPUT MANAGER BAR (RESPONSIVE NO-COLLISION LAYOUT) */}
      <div
        className="px-4 py-2.5 border-b text-xs font-mono"
        style={{
          backgroundColor: currentTheme.bgCard,
          borderColor: currentTheme.borderColor,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
          {/* Left: Device Dropdown & Label */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1.5 text-xs">
              <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap">Camera Input:</span>
            </span>

            <div className="relative min-w-0 flex-1 max-w-full lg:max-w-md">
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDeviceId(val);
                  if (val === 'virtual') {
                    launchVirtualDemoFeed();
                  } else if (val === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    startCamera(val);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-white rounded-xl pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:border-cyan-500 shadow-sm cursor-pointer truncate appearance-none transition-colors"
              >
                {/* Real discovered hardware devices */}
                {availableDevices.map((d, idx) => (
                  <option key={`${d.deviceId || 'cam'}-${idx}`} value={d.deviceId}>
                    {d.label ? `📷 ${d.label}` : `📷 Hardware Camera ${idx + 1}`}
                  </option>
                ))}

                {/* Standard fallback presets if list is unpopulated */}
                {availableDevices.length === 0 && (
                  <>
                    <option value="default">📷 Default Hardware Camera (Front/User)</option>
                    <option value="environment">📷 Environment Camera (Rear/Back)</option>
                  </>
                )}

                {/* Simulated Demo Feed Option */}
                <option value="virtual">✨ Simulated ASL Demo Stream (Always Ready)</option>
                <option value="upload">📁 Upload Video / Image File...</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Right: Device Control Actions (Completely separated, never overlapping) */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-start lg:justify-end">
            {/* DISCOVER DEVICES BUTTON */}
            <button
              type="button"
              onClick={() => discoverDevices(true)}
              disabled={isScanningDevices}
              className="px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-cyan-500/20 active:scale-95 text-xs whitespace-nowrap"
              title="Scan for connected webcams and USB video capture devices"
            >
              <Search className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${isScanningDevices ? 'animate-spin' : ''}`} />
              <span className="font-bold">Discover Devices</span>
            </button>

            {/* Switch Facing (Front/Back) */}
            <button
              type="button"
              onClick={toggleFacingMode}
              className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs whitespace-nowrap"
              title={`Switch to ${facingMode === 'user' ? 'Rear' : 'Front'} Camera`}
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="capitalize">{facingMode}</span>
            </button>

            {/* Virtual Demo Stream Direct Toggle */}
            {!isVirtualMode ? (
              <button
                type="button"
                onClick={launchVirtualDemoFeed}
                className="px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 transition-colors cursor-pointer flex items-center gap-1 text-xs whitespace-nowrap"
                title="Launch virtual animated ASL test stream"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Demo Feed</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer flex items-center gap-1 text-xs whitespace-nowrap"
                title="Switch back to physical webcam"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Use Webcam</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discovery Feedback Toast Notification */}
      {deviceScanMessage && (
        <div className="px-4 py-1.5 bg-cyan-950/80 border-b border-cyan-500/30 text-cyan-300 text-[11px] font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{deviceScanMessage}</span>
        </div>
      )}

      {/* VIDEO VIEWPORT CONTAINER */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-6 text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <CameraOff className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Camera Access Needed
              </h3>
              <p className="text-xs text-rose-300/90 font-mono leading-relaxed">
                {cameraError.message}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Retry Webcam Access</span>
              </button>

              <button
                type="button"
                onClick={launchVirtualDemoFeed}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Demo Feed</span>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to enable camera in browser</span>
              </button>
            </div>
          </div>
        ) : !isTranslating ? (
          /* Offline / Paused Stream Placeholder */
          <div className="p-6 text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <CameraOff className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Camera Stream Paused
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Click Start Webcam to resume live ASL translation, or use the Demo Stream.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Start Webcam</span>
              </button>

              <button
                type="button"
                onClick={launchVirtualDemoFeed}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Demo Feed</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover ${webcamSettings.mirrorWebcam ? '-scale-x-100' : ''}`}
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Bounding Overlay Badge */}
            {detectedHandsCount > 0 && activePrediction && !activePrediction.isUnknown && (
              <div className="absolute top-4 left-4 bg-slate-950/85 border border-cyan-500/50 backdrop-blur-md px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-2xl animate-fadeIn">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-sm font-mono font-black text-white tracking-tight">
                  {activePrediction.prediction.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30 font-bold">
                  {Math.round(activePrediction.confidence * 100)}%
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER DIAGNOSTICS & TELEMETRY */}
      <div
        className="px-4 py-2.5 border-t flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono"
        style={{ borderColor: currentTheme.borderColor, backgroundColor: currentTheme.bgSurface }}
      >
        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            Detected Hands:{' '}
            <strong className={detectedHandsCount > 0 ? 'text-emerald-400' : 'text-slate-500'}>
              {detectedHandsCount}
            </strong>
          </span>

          <span className="text-slate-600">|</span>

          <span className="text-slate-400">
            Mode:{' '}
            <strong className="text-cyan-400 uppercase">
              {activePrediction?.mode || 'REALTIME'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            Focus: <strong className="text-white uppercase">{recognitionFocus}</strong>
          </span>

          <span className="text-slate-600 hidden sm:inline">|</span>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {availableDevices.length} camera {availableDevices.length === 1 ? 'detected' : 'detected'}
          </span>
        </div>
      </div>

      {/* Camera Permission Guidance Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="max-w-md w-full rounded-3xl border p-6 space-y-4 shadow-2xl relative"
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: currentTheme.borderColor }}>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold font-mono text-white">How to Enable Webcam</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <ol className="space-y-3 text-xs text-slate-300 font-sans list-decimal list-inside leading-relaxed">
              <li>
                Click the <strong>Lock (🔒)</strong> or <strong>Camera (🎥)</strong> icon next to the address URL.
              </li>
              <li>
                Select <strong>Camera permissions</strong> and choose <strong>Allow</strong>.
              </li>
              <li>
                Click <strong>Discover Devices</strong> or <strong>Retry Webcam Access</strong> below.
              </li>
              <li>
                If you do not have a physical webcam attached, you can use the <strong>Simulated Demo Stream</strong> anytime!
              </li>
            </ol>

            <div className="pt-2 flex items-center justify-end gap-2 border-t" style={{ borderColor: currentTheme.borderColor }}>
              <button
                type="button"
                onClick={() => {
                  setShowHelpModal(false);
                  launchVirtualDemoFeed();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              >
                Use Demo Stream
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHelpModal(false);
                  startCamera();
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
              >
                Retry Camera Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamPanel;
