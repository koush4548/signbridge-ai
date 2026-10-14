import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmark } from '../types';

let handLandmarkerInstance: HandLandmarker | null = null;
let lastVideoTimestamp = -1;
let isInitializing = false;

export async function getHandLandmarker(): Promise<HandLandmarker | null> {
  if (handLandmarkerInstance) {
    return handLandmarkerInstance;
  }
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return handLandmarkerInstance;
  }

  isInitializing = true;
  try {
    let visionWasm: any;
    try {
      visionWasm = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    } catch (localWasmErr) {
      console.warn('[HandTracker] Local WASM path failed, trying CDN fallback:', localWasmErr);
      visionWasm = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
    }

    const modelPaths = [
      '/mediapipe/hand_landmarker.task',
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    ];

    for (const modelPath of modelPaths) {
      try {
        // Try GPU first
        try {
          handLandmarkerInstance = await HandLandmarker.createFromOptions(visionWasm, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          if (handLandmarkerInstance) break;
        } catch (gpuError) {
          console.warn(`[HandTracker] GPU delegate failed for ${modelPath}, trying CPU:`, gpuError);
          handLandmarkerInstance = await HandLandmarker.createFromOptions(visionWasm, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          if (handLandmarkerInstance) break;
        }
      } catch (pathErr) {
        console.warn(`[HandTracker] Failed loading model from ${modelPath}:`, pathErr);
      }
    }

    return handLandmarkerInstance;
  } catch (err) {
    console.error('[HandTracker] Failed to initialize MediaPipe HandLandmarker:', err);
    return null;
  } finally {
    isInitializing = false;
  }
}

export function detectHandLandmarks(
  landmarker: HandLandmarker,
  videoElement: HTMLVideoElement,
  timestampMs: number
): { landmarks: HandLandmark[][]; handednesses: any[] } | null {
  if (!videoElement || videoElement.readyState < 2) {
    return null;
  }

  // Ensure strictly monotonic timestamp to prevent WASM abort error
  const safeTimestamp = timestampMs > lastVideoTimestamp ? timestampMs : lastVideoTimestamp + 1;
  lastVideoTimestamp = safeTimestamp;

  try {
    const results = landmarker.detectForVideo(videoElement, safeTimestamp);
    return {
      landmarks: results.landmarks as HandLandmark[][],
      handednesses: results.handednesses || [],
    };
  } catch (err) {
    console.warn('[HandTracker] detectForVideo frame skipped:', err);
    return null;
  }
}
