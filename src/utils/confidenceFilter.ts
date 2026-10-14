import { ClassificationResult, HandLandmark, SignLifecyclePhase, RecognitionMode } from '../types';

export interface DebouncerConfig {
  requiredHoldFrames?: number;
  minConfidenceThreshold?: number;
  commitCooldownMs?: number;
  scoreMarginThreshold?: number;
  exitHysteresisFrames?: number;
  motionSuppressionThreshold?: number;
  emaAlphaMin?: number;
  emaAlphaMax?: number;
  historyWindowSize?: number;
}

/**
 * Multi-Stage Temporal Stabilization and Hysteresis Engine
 * 1. Adaptive Landmark EMA Smoothing (eliminates sub-pixel jitter)
 * 2. Sliding Window Score Buffer with Margin Verification
 * 3. Hysteresis Lock-In & Transition Motion Suppression
 * 4. STRICT ONE-SHOT COMMIT LATCH: Prevents duplicate repetition until hand release or gesture change
 * 5. MODE ISOLATION FILTER: Rejects words in alphabet mode, and rejects letters in word mode
 */
export class TemporalConfidenceFilter {
  // Landmark EMA state
  private prevSmoothedLandmarks: HandLandmark[] | null = null;
  private prevRawWrist: HandLandmark | null = null;

  // Configuration
  private requiredHoldFrames: number;
  private minConfidence: number;
  private commitCooldownMs: number;
  private scoreMargin: number;
  private exitHysteresisFrames: number;
  private motionThreshold: number;
  private emaAlphaMin: number;
  private emaAlphaMax: number;
  private historyWindowSize: number;

  // Running temporal buffers
  private recentPredictions: string[] = [];
  private recentScores: number[] = [];
  private candidate: string | null = null;
  private candidateFrames = 0;
  private lockedSign: string | null = null;
  private exitCandidate: string | null = null;
  private exitCandidateFrames = 0;

  // One-Shot Commit Latch: commits exactly once per confirmed sign hold
  private hasCommittedCurrentSign = false;
  private lastCommitTime = -100000;
  private phase: SignLifecyclePhase = 'IDLE';

  // Release tracking: consecutive frames with no valid sign
  private consecutiveEmptyFrames = 0;

  constructor(config: DebouncerConfig = {}) {
    this.requiredHoldFrames = config.requiredHoldFrames ?? 4;
    this.minConfidence = config.minConfidenceThreshold ?? 0.70;
    this.commitCooldownMs = config.commitCooldownMs ?? 600;
    this.scoreMargin = config.scoreMarginThreshold ?? 0.12;
    this.exitHysteresisFrames = config.exitHysteresisFrames ?? 3;
    this.motionThreshold = config.motionSuppressionThreshold ?? 0.22;
    this.emaAlphaMin = config.emaAlphaMin ?? 0.65;
    this.emaAlphaMax = config.emaAlphaMax ?? 0.85;
    this.historyWindowSize = config.historyWindowSize ?? 6;
  }

  /**
   * Adaptive Exponential Moving Average (EMA) Landmark Smoothing
   * Smooths coordinate jitter while tracking quick gestures without lag.
   */
  smoothLandmarks(rawLandmarks: HandLandmark[]): HandLandmark[] {
    if (!rawLandmarks || rawLandmarks.length !== 21) {
      this.prevSmoothedLandmarks = null;
      this.prevRawWrist = null;
      return rawLandmarks;
    }

    if (!this.prevSmoothedLandmarks || this.prevSmoothedLandmarks.length !== 21) {
      this.prevSmoothedLandmarks = rawLandmarks.map((p) => ({ ...p }));
      this.prevRawWrist = { ...rawLandmarks[0] };
      return rawLandmarks;
    }

    // Measure instantaneous velocity of wrist (anchor point)
    const currentWrist = rawLandmarks[0];
    const dx = currentWrist.x - (this.prevRawWrist?.x || currentWrist.x);
    const dy = currentWrist.y - (this.prevRawWrist?.y || currentWrist.y);
    const dz = (currentWrist.z || 0) - (this.prevRawWrist?.z || 0);
    const velocity = Math.sqrt(dx * dx + dy * dy + dz * dz);
    this.prevRawWrist = { ...currentWrist };

    // Adaptive alpha: higher during fast movement (responsiveness), lower when still (anti-jitter)
    const normVelocity = Math.min(1, velocity / 0.08);
    const alpha = this.emaAlphaMin + normVelocity * (this.emaAlphaMax - this.emaAlphaMin);

    const smoothed: HandLandmark[] = rawLandmarks.map((pt, i) => {
      const prev = this.prevSmoothedLandmarks![i];
      return {
        x: alpha * pt.x + (1 - alpha) * prev.x,
        y: alpha * pt.y + (1 - alpha) * prev.y,
        z: alpha * (pt.z || 0) + (1 - alpha) * (prev.z || 0),
      };
    });

    this.prevSmoothedLandmarks = smoothed;
    return smoothed;
  }

  /**
   * Main Temporal Hysteresis & Mode-Isolation Process
   */
  process(
    raw: ClassificationResult | null,
    activeMode: RecognitionMode = 'alphabet'
  ): {
    filteredResult: ClassificationResult | null;
    phase: SignLifecyclePhase;
    shouldCommit: boolean;
  } {
    const now = performance.now();

    // 1. Check for missing or unknown input
    if (
      !raw ||
      raw.isUnknown ||
      raw.confidence < this.minConfidence ||
      raw.prediction === 'UNKNOWN'
    ) {
      this.consecutiveEmptyFrames++;

      // After 3 frames of no hand or empty gesture, unlatch to allow repeating the same sign
      if (this.consecutiveEmptyFrames >= 3) {
        this.hasCommittedCurrentSign = false;
        this.lockedSign = null;
        this.candidate = null;
        this.candidateFrames = 0;
        this.exitCandidate = null;
        this.exitCandidateFrames = 0;
        this.lastCommitTime = -100000;
        this.phase = 'IDLE';
      }

      return { filteredResult: null, phase: this.phase, shouldCommit: false };
    }

    // Hand is present and producing predictions -> reset empty frame counter
    this.consecutiveEmptyFrames = 0;

    // 2. Strict Mode Isolation Guard
    if (activeMode === 'alphabet') {
      // In Alphabet Mode, reject any word signs
      if (raw.isWord || raw.prediction.length > 1) {
        return { filteredResult: null, phase: 'IDLE', shouldCommit: false };
      }
    } else if (activeMode === 'word') {
      // In Word Mode, reject single-letter alphabet signs
      if (!raw.isWord || raw.prediction.length === 1) {
        return { filteredResult: null, phase: 'IDLE', shouldCommit: false };
      }
    }

    const currentPrediction = raw.prediction;
    const currentScore = raw.confidence;
    const motionEnergy = raw.motionEnergy || 0;

    // 3. Kinetic motion energy suppression
    // Hand is moving too quickly (transition phase between signs) -> suppress flipping
    if (motionEnergy > this.motionThreshold && activeMode === 'alphabet') {
      return {
        filteredResult: {
          ...raw,
          prediction: this.lockedSign || currentPrediction,
          phase: 'DETECTION',
        },
        phase: 'DETECTION',
        shouldCommit: false,
      };
    }

    // 4. Score margin check (must beat runner-up by threshold margin to prevent edge-flipping)
    let marginValid = true;
    if (raw.topPredictions && raw.topPredictions.length >= 2) {
      const topScore = raw.topPredictions[0].confidence;
      const runnerUpScore = raw.topPredictions[1].confidence;
      if (topScore - runnerUpScore < this.scoreMargin) {
        marginValid = false;
      }
    }

    // 5. Update sliding window buffer
    this.recentPredictions.push(currentPrediction);
    this.recentScores.push(currentScore);
    if (this.recentPredictions.length > this.historyWindowSize) {
      this.recentPredictions.shift();
      this.recentScores.shift();
    }

    // 6. Hysteresis Lock-In State Machine
    if (this.lockedSign) {
      // Hand is currently locked on a confirmed sign
      if (currentPrediction === this.lockedSign) {
        // Reinforcing locked sign
        this.exitCandidate = null;
        this.exitCandidateFrames = 0;
        this.phase = 'HOLD_CONFIRM';

        // STRICT ONE-SHOT COMMIT: Commit exactly ONCE per confirmed gesture hold!
        let shouldCommit = false;
        if (!this.hasCommittedCurrentSign && now - this.lastCommitTime >= this.commitCooldownMs) {
          this.lastCommitTime = now;
          this.hasCommittedCurrentSign = true;
          this.phase = 'COMMITTED';
          shouldCommit = true;
        }

        return {
          filteredResult: {
            ...raw,
            prediction: this.lockedSign,
            phase: this.phase,
          },
          phase: this.phase,
          shouldCommit,
        };
      } else {
        // Distinct new candidate attempting to exit the lock
        if (this.exitCandidate === currentPrediction && marginValid) {
          this.exitCandidateFrames++;
        } else {
          this.exitCandidate = currentPrediction;
          this.exitCandidateFrames = 1;
        }

        // Require exit threshold before breaking lock
        if (this.exitCandidateFrames >= this.exitHysteresisFrames) {
          this.lockedSign = this.exitCandidate;
          this.candidate = this.exitCandidate;
          this.candidateFrames = this.exitCandidateFrames;
          this.exitCandidate = null;
          this.exitCandidateFrames = 0;
          this.phase = 'HOLD_CONFIRM';
          // Unlatch for the NEW sign!
          this.hasCommittedCurrentSign = false;

          let shouldCommit = false;
          if (now - this.lastCommitTime >= this.commitCooldownMs) {
            this.lastCommitTime = now;
            this.hasCommittedCurrentSign = true;
            this.phase = 'COMMITTED';
            shouldCommit = true;
          }

          return {
            filteredResult: {
              ...raw,
              prediction: this.lockedSign,
              phase: this.phase,
            },
            phase: this.phase,
            shouldCommit,
          };
        } else {
          // Still protected by hysteresis lock
          return {
            filteredResult: {
              ...raw,
              prediction: this.lockedSign,
              phase: 'HOLD_CONFIRM',
            },
            phase: 'HOLD_CONFIRM',
            shouldCommit: false,
          };
        }
      }
    }

    // 7. Non-locked state: Candidate qualification
    if (this.candidate === currentPrediction) {
      this.candidateFrames++;
    } else {
      this.candidate = currentPrediction;
      this.candidateFrames = 1;
      this.phase = 'DETECTION';
    }

    // Candidate must be held for required consecutive frames and satisfy score margin
    if (this.candidateFrames >= this.requiredHoldFrames && marginValid) {
      this.lockedSign = this.candidate;
      this.phase = 'HOLD_CONFIRM';

      let shouldCommit = false;
      if (!this.hasCommittedCurrentSign && now - this.lastCommitTime >= this.commitCooldownMs) {
        this.lastCommitTime = now;
        this.hasCommittedCurrentSign = true;
        this.phase = 'COMMITTED';
        shouldCommit = true;
      }

      return {
        filteredResult: {
          ...raw,
          prediction: this.candidate,
          phase: this.phase,
        },
        phase: this.phase,
        shouldCommit,
      };
    }

    return {
      filteredResult: {
        ...raw,
        prediction: this.candidate || currentPrediction,
        phase: this.phase,
      },
      phase: this.phase,
      shouldCommit: false,
    };
  }

  /**
   * Resets all internal buffers, latch, and lock state
   */
  reset() {
    this.prevSmoothedLandmarks = null;
    this.prevRawWrist = null;
    this.recentPredictions = [];
    this.recentScores = [];
    this.candidate = null;
    this.candidateFrames = 0;
    this.lockedSign = null;
    this.exitCandidate = null;
    this.exitCandidateFrames = 0;
    this.hasCommittedCurrentSign = false;
    this.consecutiveEmptyFrames = 0;
    this.phase = 'IDLE';
  }

  /**
   * Manually releases the commit latch (e.g. after user action)
   */
  releaseLatch() {
    this.hasCommittedCurrentSign = false;
  }
}
