import { HandLandmark } from '../types';

export interface TemporalFrame {
  landmarks: HandLandmark[];
  timestamp: number;
  wrist: HandLandmark;
  indexTip: HandLandmark;
  middleTip: HandLandmark;
  thumbTip: HandLandmark;
}

export interface TemporalSequenceFeatures {
  frameCount: number;
  durationMs: number;
  averageSpeed: number;
  maxSpeed: number;
  currentSpeed: number;
  netDisplacementX: number;
  netDisplacementY: number;
  netDisplacementZ: number;
  pathLength: number;
  oscillationsX: number; // e.g. Waving side-to-side for HELLO, WHAT, WHERE
  oscillationsY: number; // e.g. Nodding up-down for YES
  isPinchingMotion: boolean; // e.g. Quick pinch closing for NO
  isUpwardStroke: boolean; // e.g. Raising hand for HELP
  isDownwardStroke: boolean; // e.g. Chin to downward for THANK_YOU
  isCircularMotion: boolean; // e.g. PLEASE, SORRY
  isTShaking: boolean; // e.g. BATHROOM T-shake
  isJSwoop: boolean; // e.g. J swoop motion
  isZStroke: boolean; // e.g. Z zig-zag stroke
  isMotionSteady: boolean;
  isRestingNeutral: boolean;
}

export class TemporalGestureTracker {
  private windowSize: number;
  private frames: TemporalFrame[] = [];

  constructor(windowSize = 24) {
    this.windowSize = windowSize;
  }

  reset(): void {
    this.frames = [];
  }

  addFrame(landmarks: HandLandmark[] | null, timestamp = performance.now()): TemporalSequenceFeatures {
    if (!landmarks || landmarks.length !== 21) {
      // Missing hand clears buffer or marks neutral
      if (this.frames.length > 0) {
        this.frames.shift();
      }
      return this.computeFeatures();
    }

    const frame: TemporalFrame = {
      landmarks: landmarks.map((pt) => ({ ...pt })),
      timestamp,
      wrist: { ...landmarks[0] },
      indexTip: { ...landmarks[8] },
      middleTip: { ...landmarks[12] },
      thumbTip: { ...landmarks[4] },
    };

    this.frames.push(frame);
    if (this.frames.length > this.windowSize) {
      this.frames.shift();
    }

    return this.computeFeatures();
  }

  computeFeatures(): TemporalSequenceFeatures {
    const count = this.frames.length;
    if (count < 3) {
      return {
        frameCount: count,
        durationMs: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        currentSpeed: 0,
        netDisplacementX: 0,
        netDisplacementY: 0,
        netDisplacementZ: 0,
        pathLength: 0,
        oscillationsX: 0,
        oscillationsY: 0,
        isPinchingMotion: false,
        isUpwardStroke: false,
        isDownwardStroke: false,
        isCircularMotion: false,
        isTShaking: false,
        isJSwoop: false,
        isZStroke: false,
        isMotionSteady: false,
        isRestingNeutral: count === 0,
      };
    }

    const first = this.frames[0];
    const latest = this.frames[count - 1];
    const durationMs = Math.max(1, latest.timestamp - first.timestamp);

    let pathLength = 0;
    const speeds: number[] = [];
    const vxList: number[] = [];
    const vyList: number[] = [];

    for (let i = 1; i < count; i++) {
      const pPrev = this.frames[i - 1].wrist;
      const pCurr = this.frames[i].wrist;
      const dt = Math.max(1, this.frames[i].timestamp - this.frames[i - 1].timestamp);

      const dx = pCurr.x - pPrev.x;
      const dy = pCurr.y - pPrev.y;
      const dz = (pCurr.z || 0) - (pPrev.z || 0);
      const stepDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      pathLength += stepDist;

      const speed = (stepDist / dt) * 1000;
      speeds.push(speed);
      vxList.push((dx / dt) * 1000);
      vyList.push((dy / dt) * 1000);
    }

    const averageSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds, 0);
    const currentSpeed = speeds[speeds.length - 1] || 0;

    const netDisplacementX = latest.wrist.x - first.wrist.x;
    const netDisplacementY = latest.wrist.y - first.wrist.y;
    const netDisplacementZ = (latest.wrist.z || 0) - (first.wrist.z || 0);

    // Direction oscillation count (sign changes across smoothed velocity)
    let oscillationsX = 0;
    for (let i = 1; i < vxList.length; i++) {
      if (Math.abs(vxList[i]) > 0.08 && Math.abs(vxList[i - 1]) > 0.08) {
        if (Math.sign(vxList[i]) !== Math.sign(vxList[i - 1])) {
          oscillationsX++;
        }
      }
    }

    let oscillationsY = 0;
    for (let i = 1; i < vyList.length; i++) {
      if (Math.abs(vyList[i]) > 0.08 && Math.abs(vyList[i - 1]) > 0.08) {
        if (Math.sign(vyList[i]) !== Math.sign(vyList[i - 1])) {
          oscillationsY++;
        }
      }
    }

    // Pinch closure measurement (distance thumb to index/middle across time)
    const firstPinchDist = Math.hypot(
      first.thumbTip.x - first.indexTip.x,
      first.thumbTip.y - first.indexTip.y
    );
    const latestPinchDist = Math.hypot(
      latest.thumbTip.x - latest.indexTip.x,
      latest.thumbTip.y - latest.indexTip.y
    );
    const isPinchingMotion =
      firstPinchDist > 0.12 && latestPinchDist < 0.06 && firstPinchDist - latestPinchDist > 0.06;

    // Upward / Downward stroke
    const isDownwardStroke = netDisplacementY > 0.12 && Math.abs(netDisplacementX) < 0.14;
    const isUpwardStroke = netDisplacementY < -0.12 && Math.abs(netDisplacementX) < 0.14;

    // Circular motion: high path length relative to net displacement
    const netDist = Math.hypot(netDisplacementX, netDisplacementY);
    const isCircularMotion =
      pathLength > 0.35 && netDist < 0.15 && oscillationsX >= 2 && oscillationsY >= 2;

    // T-shaking: small horizontal vibration
    const isTShaking = oscillationsX >= 3 && Math.abs(netDisplacementX) < 0.12 && averageSpeed > 0.1;

    // Dynamic alphabet motions
    const isJSwoop = (averageSpeed > 0.12 || currentSpeed > 0.12) && (oscillationsX >= 1 || netDisplacementY > 0.05);
    const isZStroke = (averageSpeed > 0.12 || currentSpeed > 0.12) && (oscillationsX >= 1 || Math.abs(netDisplacementX) > 0.08);

    // Resting neutral check on the latest frame
    const isRestingNeutral = this.checkRestingNeutral(latest.landmarks);
    const isMotionSteady = averageSpeed < 0.08;

    return {
      frameCount: count,
      durationMs,
      averageSpeed,
      maxSpeed,
      currentSpeed,
      netDisplacementX,
      netDisplacementY,
      netDisplacementZ,
      pathLength,
      oscillationsX,
      oscillationsY,
      isPinchingMotion,
      isUpwardStroke,
      isDownwardStroke,
      isCircularMotion,
      isTShaking,
      isJSwoop,
      isZStroke,
      isMotionSteady,
      isRestingNeutral,
    };
  }

  /**
   * Evaluates whether hand is in a relaxed/neutral release pose:
   * 1. Hand dropped below active chest/face signing zone (y > 0.78)
   * 2. All fingers relaxed at rest (half-curled, PIP angles 100°-145°, no clear ASL sign posture)
   */
  checkRestingNeutral(landmarks: HandLandmark[]): boolean {
    if (!landmarks || landmarks.length !== 21) return true;

    // Wrist dropped low (out of active signing frame)
    if (landmarks[0].y > 0.78) return true;

    // Check finger semi-curl (natural resting hand pose)
    const angles = [
      this.calculateAngle(landmarks[5], landmarks[6], landmarks[7]), // Index
      this.calculateAngle(landmarks[9], landmarks[10], landmarks[11]), // Middle
      this.calculateAngle(landmarks[13], landmarks[14], landmarks[15]), // Ring
      this.calculateAngle(landmarks[17], landmarks[18], landmarks[19]), // Pinky
    ];

    const allPartiallyCurled = angles.every((deg) => deg >= 100 && deg <= 150);
    const thumbResting = Math.hypot(landmarks[4].x - landmarks[5].x, landmarks[4].y - landmarks[5].y) > 0.08;

    return allPartiallyCurled && thumbResting;
  }

  private calculateAngle(a: HandLandmark, b: HandLandmark, c: HandLandmark): number {
    const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
    const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    if (m1 * m2 === 0) return 180;
    const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
    return (Math.acos(cos) * 180) / Math.PI;
  }
}
