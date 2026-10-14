import {
  ClassificationResult,
  HandLandmark,
  TopPrediction,
  RecognitionMode,
} from '../types';
import { TemporalSequenceFeatures } from './temporalGestureTracker';

export const ALPHABET_CONFIDENCE_THRESHOLD = 0.70;
export const WORD_CONFIDENCE_THRESHOLD = 0.75;
export const CONFIDENCE_THRESHOLD = 0.70;

export function distance3D(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distance2D(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateJointAngle(
  a: HandLandmark,
  b: HandLandmark,
  c: HandLandmark
): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  if (m1 * m2 === 0) return 0;
  const cosine = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

/**
 * Normalizes left-hand landmarks so they mirror onto canonical right-hand coordinates.
 * Guarantees 100% parity for left-handed and right-handed signers.
 */
export function canonicalizeLandmarksForHandedness(
  landmarks: HandLandmark[],
  handedness?: 'Right' | 'Left' | string
): HandLandmark[] {
  if (!landmarks || landmarks.length !== 21) return landmarks;
  const isLeft = handedness && handedness.toLowerCase() === 'left';
  if (!isLeft) return landmarks;

  const wristX = landmarks[0].x;
  return landmarks.map((pt) => ({
    x: 2 * wristX - pt.x,
    y: pt.y,
    z: pt.z,
  }));
}

/**
 * Validates tracking quality before inference. Rejects incomplete, corrupt, or collapsed hands.
 */
export function validateLandmarkQuality(landmarks: HandLandmark[]): {
  isValid: boolean;
  reason?: string;
  palmScale: number;
} {
  if (!landmarks || landmarks.length !== 21) {
    return { isValid: false, reason: 'Incomplete landmarks: expected 21 points', palmScale: 0 };
  }
  for (let i = 0; i < 21; i++) {
    const pt = landmarks[i];
    if (typeof pt.x !== 'number' || typeof pt.y !== 'number' || isNaN(pt.x) || isNaN(pt.y)) {
      return { isValid: false, reason: 'Corrupt landmark coordinates (NaN/missing)', palmScale: 0 };
    }
  }

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const palmScale = distance3D(wrist, middleMcp);

  if (palmScale < 0.03) {
    return { isValid: false, reason: 'Hand scale too small or collapsed tracking', palmScale };
  }

  return { isValid: true, palmScale };
}

export const CORE_ASL_WORDS = [
  'HELLO',
  'MY_NAME_IS',
  'THANK_YOU',
  'YES',
  'NO',
  'HELP',
  'I_LOVE_YOU',
  'PLEASE',
  'SORRY',
  'STOP',
  'PAIN',
  'EAT',
  'DRINK',
  'MORE',
  'BATHROOM',
  'HOW',
  'WHAT',
  'WHERE',
  'WHEN',
];

export const RECOGNIZED_WORDS = CORE_ASL_WORDS;
export const RECOGNIZED_GESTURES = CORE_ASL_WORDS;

export const ALPHABET_SET = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
export const NUMBER_SET = new Set<string>();

export const EASY_SIGN_INFO: Record<
  string,
  { name: string; emoji: string; meaning: string; category: string }
> = {
  HELLO: { name: 'Hello', emoji: '👋', meaning: 'Friendly Greeting / Wave', category: 'Conversational Words' },
  MY_NAME_IS: { name: 'My Name Is', emoji: '🏷️', meaning: 'Self-Introduction / Name', category: 'Conversational Words' },
  THANK_YOU: { name: 'Thank You', emoji: '🙏', meaning: 'Gratitude / Thanks', category: 'Conversational Words' },
  YES: { name: 'Yes', emoji: '✊', meaning: 'Affirmative / Agree (Nodding Fist)', category: 'Conversational Words' },
  NO: { name: 'No', emoji: '🤏', meaning: 'Negative / Disagree (Snap Fingers)', category: 'Conversational Words' },
  HELP: { name: 'Help', emoji: '🆘', meaning: 'Assistance / Support', category: 'Conversational Words' },
  I_LOVE_YOU: { name: 'I Love You', emoji: '🤟', meaning: 'ASL ILY Sign / Love', category: 'Conversational Words' },
  PLEASE: { name: 'Please', emoji: '🤲', meaning: 'Polite Request (Chest Rub)', category: 'Conversational Words' },
  SORRY: { name: 'Sorry', emoji: '😔', meaning: 'Apology / Regret (Fist Circle)', category: 'Conversational Words' },
  STOP: { name: 'Stop', emoji: '🛑', meaning: 'Halt / Cease Action (Cut Palm)', category: 'Conversational Words' },
  PAIN: { name: 'Pain / Hurt', emoji: '⚡', meaning: 'Discomfort / Hurt (Index Twist)', category: 'Conversational Words' },
  EAT: { name: 'Eat / Food', emoji: '🍽️', meaning: 'Eating / Food (Fingertips to Mouth)', category: 'Conversational Words' },
  DRINK: { name: 'Drink', emoji: '🥤', meaning: 'Beverage / Drinking (C-Tilt)', category: 'Conversational Words' },
  MORE: { name: 'More', emoji: '👐', meaning: 'Additional / More (Tap Fingertips)', category: 'Conversational Words' },
  BATHROOM: { name: 'Bathroom', emoji: '🚻', meaning: 'Restroom / Toilet (T-Shake)', category: 'Conversational Words' },
  HOW: { name: 'How', emoji: '❓', meaning: 'Method / Manner (Roll Hands)', category: 'Conversational Words' },
  WHAT: { name: 'What', emoji: '🤷', meaning: 'Clarification (Open Palms Shake)', category: 'Conversational Words' },
  WHERE: { name: 'Where', emoji: '📍', meaning: 'Location Query (Index Wave)', category: 'Conversational Words' },
  WHEN: { name: 'When', emoji: '⏰', meaning: 'Time Query (Index Circle)', category: 'Conversational Words' },
  A: { name: 'Letter A', emoji: '🅰️', meaning: 'Fist with thumb upright along index side', category: 'Alphabets (A-Z)' },
  B: { name: 'Letter B', emoji: '🅱️', meaning: 'Flat upright palm, 4 fingers touching, thumb folded', category: 'Alphabets (A-Z)' },
  C: { name: 'Letter C', emoji: '🗜️', meaning: 'Curved open C cup aperture', category: 'Alphabets (A-Z)' },
  D: { name: 'Letter D', emoji: '☝️', meaning: 'Index straight up, thumb touching middle tip in circle', category: 'Alphabets (A-Z)' },
  E: { name: 'Letter E', emoji: '✊', meaning: 'Claw fist, 4 fingers resting on thumb shelf', category: 'Alphabets (A-Z)' },
  F: { name: 'Letter F', emoji: '👌', meaning: 'Thumb and index form circle, 3 fingers upright', category: 'Alphabets (A-Z)' },
  G: { name: 'Letter G', emoji: '👉', meaning: 'Index and thumb pointing horizontally parallel', category: 'Alphabets (A-Z)' },
  H: { name: 'Letter H', emoji: '✌️', meaning: 'Index and middle fingers extended horizontally together', category: 'Alphabets (A-Z)' },
  I: { name: 'Letter I', emoji: '🤙', meaning: 'Pinky extended upright, other fingers curled', category: 'Alphabets (A-Z)' },
  J: { name: 'Letter J', emoji: '⤴️', meaning: 'Pinky tracing a J swoop in air', category: 'Alphabets (A-Z)' },
  K: { name: 'Letter K', emoji: '✌️', meaning: 'Index and middle upright, thumb on middle knuckle', category: 'Alphabets (A-Z)' },
  L: { name: 'Letter L', emoji: '📐', meaning: 'Index upright and thumb extended at 90 degrees (L shape)', category: 'Alphabets (A-Z)' },
  M: { name: 'Letter M', emoji: '🤛', meaning: 'Fist with thumb tucked under 3 fingers', category: 'Alphabets (A-Z)' },
  N: { name: 'Letter N', emoji: '🤛', meaning: 'Fist with thumb tucked under 2 fingers', category: 'Alphabets (A-Z)' },
  O: { name: 'Letter O', emoji: '⭕', meaning: 'All 5 fingertips touching in a closed round O circle', category: 'Alphabets (A-Z)' },
  P: { name: 'Letter P', emoji: '👇', meaning: 'K handshape pointing downward', category: 'Alphabets (A-Z)' },
  Q: { name: 'Letter Q', emoji: '👇', meaning: 'G handshape pointing downward', category: 'Alphabets (A-Z)' },
  R: { name: 'Letter R', emoji: '🤞', meaning: 'Index and middle fingers crossed tightly', category: 'Alphabets (A-Z)' },
  S: { name: 'Letter S', emoji: '✊', meaning: 'Fist with thumb wrapped across front of fingers', category: 'Alphabets (A-Z)' },
  T: { name: 'Letter T', emoji: '🤜', meaning: 'Fist with thumb tucked under index finger', category: 'Alphabets (A-Z)' },
  U: { name: 'Letter U', emoji: '✌️', meaning: 'Index and middle fingers extended upright touching together', category: 'Alphabets (A-Z)' },
  V: { name: 'Letter V', emoji: '✌️', meaning: 'Index and middle fingers extended upright spread in a V', category: 'Alphabets (A-Z)' },
  W: { name: 'Letter W', emoji: '🖖', meaning: 'Index, middle, and ring fingers extended upright in a W', category: 'Alphabets (A-Z)' },
  X: { name: 'Letter X', emoji: '☝️', meaning: 'Index finger hooked into trigger shape', category: 'Alphabets (A-Z)' },
  Y: { name: 'Letter Y', emoji: '🤙', meaning: 'Thumb and pinky extended wide apart (shaka shape)', category: 'Alphabets (A-Z)' },
  Z: { name: 'Letter Z', emoji: '⚡', meaning: 'Index finger pointing and tracing Z in air', category: 'Alphabets (A-Z)' },
};

export interface ClassifyOptions {
  recognitionFocus?: 'all' | 'alphabets' | 'words';
  recognitionMode?: RecognitionMode;
  temporalFeatures?: TemporalSequenceFeatures;
  motionVelocity?: { vx: number; vy: number; vz: number; speed: number };
  handedness?: 'Right' | 'Left' | string;
}

/**
 * Common kinematic and posture feature extraction from 21 MediaPipe hand landmarks.
 */
function extractHandFeatures(landmarks: HandLandmark[]) {
  const wrist = landmarks[0];
  const thumbCmc = landmarks[1];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];
  const thumbTip = landmarks[4];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexDip = landmarks[7];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleDip = landmarks[11];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringDip = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyDip = landmarks[19];
  const pinkyTip = landmarks[20];

  const palmScale = Math.max(0.01, distance3D(wrist, middleMcp));

  const thumbAngle = calculateJointAngle(thumbMcp, thumbIp, thumbTip);
  const indexPipAngle = calculateJointAngle(indexMcp, indexPip, indexTip);
  const middlePipAngle = calculateJointAngle(middleMcp, middlePip, middleTip);
  const ringPipAngle = calculateJointAngle(ringMcp, ringPip, ringTip);
  const pinkyPipAngle = calculateJointAngle(pinkyMcp, pinkyPip, pinkyTip);

  const dIndexTipWrist = distance3D(indexTip, wrist);
  const dMiddleTipWrist = distance3D(middleTip, wrist);
  const dRingTipWrist = distance3D(ringTip, wrist);
  const dPinkyTipWrist = distance3D(pinkyTip, wrist);
  const dThumbTipWrist = distance3D(thumbTip, wrist);
  const dThumbMcpWrist = distance3D(thumbMcp, wrist);

  const dIndexTipMcp = distance3D(indexTip, indexMcp);
  const dMiddleTipMcp = distance3D(middleTip, middleMcp);
  const dRingTipMcp = distance3D(ringTip, ringMcp);
  const dPinkyTipMcp = distance3D(pinkyTip, pinkyMcp);

  // Direction indicators based on index finger line and middle MCP line
  const isHandUpright = indexTip.y < indexMcp.y - palmScale * 0.10;
  const isHandDownward = indexTip.y > indexMcp.y + palmScale * 0.10;
  const isHandHorizontal =
    !isHandDownward &&
    Math.abs(indexTip.x - indexMcp.x) > Math.abs(indexTip.y - indexMcp.y) * 0.65;

  // Extension status
  const indexExtended =
    indexPipAngle >= 128 && dIndexTipMcp > palmScale * 0.40;
  const middleExtended =
    middlePipAngle >= 128 && dMiddleTipMcp > palmScale * 0.40;
  const ringExtended =
    ringPipAngle >= 125 && dRingTipMcp > palmScale * 0.38;
  const pinkyExtended =
    pinkyPipAngle >= 120 && dPinkyTipMcp > palmScale * 0.36;

  // Curling status
  const middleCurled = middlePipAngle < 105 && dMiddleTipMcp < palmScale * 0.52;
  const ringCurled = ringPipAngle < 105 && dRingTipMcp < palmScale * 0.52;
  const pinkyCurled = pinkyPipAngle < 105 && dPinkyTipMcp < palmScale * 0.52;

  const indexHooked =
    !indexExtended &&
    indexPipAngle >= 65 &&
    indexPipAngle <= 135 &&
    indexPip.y < indexMcp.y - palmScale * 0.15 &&
    middleCurled &&
    ringCurled &&
    pinkyCurled;

  const indexCurled = !indexHooked && indexPipAngle < 105 && dIndexTipMcp < palmScale * 0.52;
  const allFingersCurled = indexCurled && middleCurled && ringCurled && pinkyCurled;

  const dThumbIndexMcp = distance3D(thumbTip, indexMcp);
  const dThumbMiddleMcp = distance3D(thumbTip, middleMcp);
  const dThumbRingMcp = distance3D(thumbTip, ringMcp);
  const dThumbIndexPip = distance3D(thumbTip, indexPip);
  const dThumbMiddlePip = distance3D(thumbTip, middlePip);
  const dThumbRingPip = distance3D(thumbTip, ringPip);

  const dThumbIndexTip = distance3D(thumbTip, indexTip);
  const dThumbMiddleTip = distance3D(thumbTip, middleTip);
  const dThumbRingTip = distance3D(thumbTip, ringTip);
  const dThumbPinkyTip = distance3D(thumbTip, pinkyTip);

  const thumbExtended =
    (thumbAngle > 120 && dThumbTipWrist > dThumbMcpWrist * 1.05) ||
    dThumbIndexMcp > palmScale * 0.48;
  const thumbExtendedWide = dThumbIndexMcp > palmScale * 0.58;

  const dist2DIndexMiddle = distance2D(indexTip, middleTip);
  const fingersCrossed =
    indexExtended &&
    middleExtended &&
    (indexTip.x - middleTip.x) * (indexMcp.x - middleMcp.x) < 0;

  // Vector across knuckles from index MCP to pinky MCP
  const kVec = {
    x: pinkyMcp.x - indexMcp.x,
    y: pinkyMcp.y - indexMcp.y,
    z: (pinkyMcp.z || 0) - (indexMcp.z || 0),
  };
  const kLenSq = Math.max(0.0001, kVec.x * kVec.x + kVec.y * kVec.y + kVec.z * kVec.z);
  const tVec = {
    x: thumbTip.x - indexMcp.x,
    y: thumbTip.y - indexMcp.y,
    z: (thumbTip.z || 0) - (indexMcp.z || 0),
  };
  const knuckleProjectionRatio = (tVec.x * kVec.x + tVec.y * kVec.y + tVec.z * kVec.z) / kLenSq;

  return {
    wrist,
    thumbTip,
    indexMcp,
    indexPip,
    indexTip,
    middleMcp,
    middlePip,
    middleTip,
    ringTip,
    pinkyTip,
    palmScale,
    dIndexTipMcp,
    dMiddleTipMcp,
    dRingTipMcp,
    dPinkyTipMcp,
    thumbAngle,
    indexPipAngle,
    middlePipAngle,
    ringPipAngle,
    pinkyPipAngle,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
    indexCurled,
    middleCurled,
    ringCurled,
    pinkyCurled,
    indexHooked,
    allFingersCurled,
    thumbExtended,
    thumbExtendedWide,
    dThumbIndexMcp,
    dThumbMiddleMcp,
    dThumbRingMcp,
    dThumbIndexPip,
    dThumbMiddlePip,
    dThumbRingPip,
    dThumbIndexTip,
    dThumbMiddleTip,
    dThumbRingTip,
    dThumbPinkyTip,
    dist2DIndexMiddle,
    fingersCrossed,
    isHandUpright,
    isHandDownward,
    isHandHorizontal,
    knuckleProjectionRatio,
  };
}

/**
 * 1. STRICT ALPHABET CLASSIFIER (A–Z ONLY)
 * Guaranteed: NEVER outputs any word from CORE_ASL_WORDS.
 * Includes dynamic recognition for motion-dependent letters J and Z.
 */
export function classifyAlphabet(
  landmarks: HandLandmark[],
  temporal?: TemporalSequenceFeatures,
  motionVelocity?: { vx: number; vy: number; vz: number; speed: number },
  handedness?: 'Right' | 'Left' | string
): ClassificationResult {
  const quality = validateLandmarkQuality(landmarks);
  if (!quality.isValid) {
    return createEmptyResult('STATIC_FINGERSPELLED');
  }

  // Canonicalize handedness to right-hand standard frame
  const canonical = canonicalizeLandmarksForHandedness(landmarks, handedness);
  const f = extractHandFeatures(canonical);

  const scores: Record<string, number> = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ltr) => {
    scores[ltr] = 0;
  });

  const speed = motionVelocity?.speed || temporal?.averageSpeed || temporal?.currentSpeed || 0;
  const isMoving = speed > 0.12 || (!!temporal && !temporal.isMotionSteady && temporal.averageSpeed > 0.10);

  // C: Intentional curved open cup with fingers curling down/forward toward thumb
  const isCOpenAperture =
    !f.isHandDownward &&
    !f.allFingersCurled &&
    f.indexPipAngle >= 70 &&
    f.indexPipAngle <= 145 &&
    f.middlePipAngle >= 70 &&
    f.middlePipAngle <= 145 &&
    f.indexTip.y >= f.indexPip.y - f.palmScale * 0.05 &&
    f.middleTip.y >= f.middlePip.y - f.palmScale * 0.05 &&
    f.dThumbIndexTip >= f.palmScale * 0.35 &&
    f.dThumbIndexTip <= f.palmScale * 1.15 &&
    f.dThumbMiddleTip >= f.palmScale * 0.35 &&
    f.dThumbMiddleTip <= f.palmScale * 1.15 &&
    !f.indexHooked &&
    !f.indexExtended;

  // O: Closed circular loop where fingertips meet thumb tip
  const isOClosedCircle =
    !isCOpenAperture &&
    !f.allFingersCurled &&
    !f.indexExtended &&
    !f.middleExtended &&
    !f.ringExtended &&
    !f.pinkyExtended &&
    f.dThumbIndexTip < f.palmScale * 0.36 &&
    f.dThumbMiddleTip < f.palmScale * 0.38 &&
    f.dThumbRingTip < f.palmScale * 0.46 &&
    f.indexPipAngle > 60 &&
    f.indexPipAngle < 145 &&
    !f.isHandDownward;

  if (isCOpenAperture) {
    scores['C'] = 0.96;
  }
  if (isOClosedCircle) {
    scores['O'] = 0.96;
  }

  // CLOSED FISTS (A, S, E, T, N, M)
  if (f.allFingersCurled && !isCOpenAperture && !isOClosedCircle && !f.indexHooked) {
    // E: Claw shelf where fingertips rest down on top of folded thumb
    const isEThumbShelf =
      f.dThumbIndexTip < f.palmScale * 0.45 &&
      f.dThumbMiddleTip < f.palmScale * 0.45 &&
      f.thumbTip.y >= f.indexTip.y - f.palmScale * 0.05 &&
      f.knuckleProjectionRatio < 0.55 &&
      f.dThumbIndexPip > f.palmScale * 0.25;

    // A: Thumb upright straight along lateral side of index finger
    const isAThumbSide =
      !isEThumbShelf &&
      f.thumbTip.y < f.indexMcp.y + f.palmScale * 0.18 &&
      f.knuckleProjectionRatio <= 0.20 &&
      f.dThumbIndexMcp < f.dThumbMiddleMcp * 0.96 &&
      f.thumbTip.x <= f.indexMcp.x + f.palmScale * 0.05;

    // S: Thumb wrapped across exterior front face of fingers
    const isSThumbFront =
      !isEThumbShelf &&
      !isAThumbSide &&
      f.thumbTip.z > 0.04 &&
      f.thumbTip.y >= f.indexMcp.y - f.palmScale * 0.05;

    // M: Thumb tucked under 3 fingers poking between ring and pinky
    const isMKnucklePoking =
      !isEThumbShelf &&
      !isAThumbSide &&
      !isSThumbFront &&
      f.knuckleProjectionRatio >= 0.70 &&
      f.knuckleProjectionRatio <= 1.25;

    // N: Thumb tucked under 2 fingers poking between middle and ring
    const isNKnucklePoking =
      !isEThumbShelf &&
      !isAThumbSide &&
      !isSThumbFront &&
      !isMKnucklePoking &&
      f.knuckleProjectionRatio >= 0.40 &&
      f.knuckleProjectionRatio < 0.70;

    // T: Thumb tucked between index and middle knuckles poking up
    const isTKnucklePoking =
      !isEThumbShelf &&
      !isAThumbSide &&
      !isSThumbFront &&
      !isMKnucklePoking &&
      !isNKnucklePoking &&
      f.knuckleProjectionRatio >= 0.12 &&
      f.knuckleProjectionRatio <= 0.42;

    if (isEThumbShelf) scores['E'] = 0.96;
    else if (isAThumbSide) scores['A'] = 0.96;
    else if (isSThumbFront) scores['S'] = 0.96;
    else if (isTKnucklePoking) scores['T'] = 0.95;
    else if (isMKnucklePoking) scores['M'] = 0.95;
    else if (isNKnucklePoking) scores['N'] = 0.95;
  }

  // TWO FINGERS EXTENDED (U, V, R, K, P, H)
  const twoFingersExtended =
    f.indexExtended &&
    f.middleExtended &&
    !f.ringExtended &&
    !f.pinkyExtended &&
    !isCOpenAperture &&
    !isOClosedCircle;

  if (twoFingersExtended) {
    const isPDownward = f.isHandDownward;
    const isHHorizontal =
      !isPDownward &&
      f.isHandHorizontal &&
      Math.abs(f.indexTip.x - f.indexMcp.x) > Math.abs(f.indexTip.y - f.indexMcp.y) * 0.60 &&
      f.dist2DIndexMiddle <= f.palmScale * 0.32;
    const isRCrossed = !isPDownward && !isHHorizontal && f.fingersCrossed;
    const isKHand =
      !isPDownward &&
      !isHHorizontal &&
      !isRCrossed &&
      (f.dThumbMiddlePip < f.palmScale * 0.48 || f.thumbTip.y < f.middleMcp.y + f.palmScale * 0.10) &&
      f.dist2DIndexMiddle > f.palmScale * 0.15;

    const notCrossed = (f.indexTip.x - f.middleTip.x) * (f.indexMcp.x - f.middleMcp.x) > 0;
    const isUTight = !isPDownward && !isHHorizontal && !isKHand && !isRCrossed && notCrossed && f.dist2DIndexMiddle < f.palmScale * 0.22;
    const isVSpread = !isPDownward && !isHHorizontal && !isKHand && !isRCrossed && notCrossed && f.dist2DIndexMiddle >= 0.22 * f.palmScale;

    if (isPDownward) scores['P'] = 0.96;
    else if (isHHorizontal) scores['H'] = 0.96;
    else if (isRCrossed) scores['R'] = 0.96;
    else if (isKHand) scores['K'] = 0.95;
    else if (isUTight) scores['U'] = 0.96;
    else if (isVSpread) scores['V'] = 0.96;
  }

  // SINGLE INDEX EXTENDED (D, L, G, Q, X, Z)
  const onlyIndexExtended =
    f.indexExtended &&
    !f.middleExtended &&
    !f.ringExtended &&
    !f.pinkyExtended &&
    !isCOpenAperture &&
    !isOClosedCircle;

  if (onlyIndexExtended) {
    const isQDownward = f.isHandDownward;
    const isGHorizontal =
      !isQDownward &&
      f.isHandHorizontal &&
      Math.abs(f.indexTip.x - f.indexMcp.x) > Math.abs(f.indexTip.y - f.indexMcp.y) * 0.60 &&
      f.dThumbIndexTip < f.palmScale * 0.50;
    const isLRightAngle =
      !isQDownward &&
      !isGHorizontal &&
      (f.thumbExtendedWide || (f.thumbExtended && f.dThumbIndexMcp > f.palmScale * 0.48)) &&
      f.dThumbIndexTip > f.palmScale * 0.48 &&
      distance3D(f.thumbTip, f.middleTip) > f.palmScale * 0.40;

    // Dynamic Z: Index finger tracing Z in air
    const isZDynamic = !isQDownward && !isGHorizontal && !isLRightAngle && isMoving;

    const isDTouchingMiddle =
      !isQDownward &&
      !isGHorizontal &&
      !isLRightAngle &&
      !isZDynamic &&
      (f.dThumbMiddleTip < f.palmScale * 0.48 || f.dThumbRingTip < f.palmScale * 0.48 || f.dThumbMiddleMcp < f.palmScale * 0.48);

    if (isQDownward) scores['Q'] = 0.96;
    else if (isGHorizontal) scores['G'] = 0.96;
    else if (isLRightAngle) scores['L'] = 0.96;
    else if (isZDynamic) scores['Z'] = 0.96;
    else if (isDTouchingMiddle) scores['D'] = 0.96;
    else if (f.isHandUpright) scores['D'] = 0.92;
  }

  // Hooked Index (X)
  if (f.indexHooked && !f.middleExtended && !f.ringExtended && !f.pinkyExtended) {
    scores['X'] = 0.96;
  }

  // ONLY PINKY EXTENDED (I, J, Y)
  const onlyPinkyExtended =
    f.pinkyExtended &&
    !f.indexExtended &&
    !f.middleExtended &&
    !f.ringExtended &&
    !isCOpenAperture &&
    !isOClosedCircle;

  if (onlyPinkyExtended) {
    const isYShaka =
      (f.thumbExtendedWide || (f.thumbExtended && f.dThumbPinkyTip > f.palmScale * 0.65)) &&
      f.dThumbIndexMcp > f.palmScale * 0.45;

    // Dynamic J: Pinky extended with dynamic swoop
    const isJDynamic = !isYShaka && isMoving;

    if (isYShaka) scores['Y'] = 0.96;
    else if (isJDynamic) scores['J'] = 0.96;
    else scores['I'] = 0.96;
  }

  // W (3 fingers)
  const threeFingersExtended =
    f.indexExtended &&
    f.middleExtended &&
    f.ringExtended &&
    !f.pinkyExtended &&
    !isCOpenAperture &&
    !isOClosedCircle;
  if (threeFingersExtended) {
    scores['W'] = 0.96;
  }

  // F (Thumb + Index pinch circle, 3 fingers up)
  const isFCircleThreeUp =
    !f.indexExtended &&
    f.middleExtended &&
    f.ringExtended &&
    f.pinkyExtended &&
    f.dThumbIndexTip < f.palmScale * 0.40;
  if (isFCircleThreeUp) {
    scores['F'] = 0.96;
  }

  // B (Flat 4 fingers upright, thumb folded across palm)
  const fourOrFiveExtended =
    f.indexExtended &&
    f.middleExtended &&
    f.ringExtended &&
    f.pinkyExtended &&
    !f.isHandDownward &&
    !isCOpenAperture &&
    f.indexPipAngle > 145 &&
    f.middlePipAngle > 145;

  if (fourOrFiveExtended) {
    const fingersFlatTogether =
      distance3D(f.indexTip, f.middleTip) < f.palmScale * 0.30 &&
      distance3D(f.middleTip, f.ringTip) < f.palmScale * 0.30;
    if (fingersFlatTogether) {
      scores['B'] = 0.96;
    }
  }

  return formatResult(scores, ALPHABET_CONFIDENCE_THRESHOLD, 'STATIC_FINGERSPELLED', f, false);
}

/**
 * 2. STRICT WORD CLASSIFIER (WORDS ONLY)
 * Guaranteed: NEVER outputs any letter from A–Z.
 * Uses temporal sequence features for dynamic gestures (HELLO, THANK_YOU, YES, NO, etc.)
 */
export function classifyWord(
  landmarks: HandLandmark[],
  temporal?: TemporalSequenceFeatures,
  handedness?: 'Right' | 'Left' | string
): ClassificationResult {
  const quality = validateLandmarkQuality(landmarks);
  if (!quality.isValid) {
    return createEmptyResult('DYNAMIC_LEXICAL');
  }

  const canonical = canonicalizeLandmarksForHandedness(landmarks, handedness);
  const f = extractHandFeatures(canonical);
  const scores: Record<string, number> = {};
  CORE_ASL_WORDS.forEach((w) => {
    scores[w] = 0;
  });

  const hasTemporal = !!temporal && temporal.frameCount >= 4;
  const isMoving = hasTemporal ? !temporal.isMotionSteady && temporal.averageSpeed > 0.08 : false;

  // Word 1: I_LOVE_YOU (Static or gentle outward: Thumb, Index, Pinky extended)
  if (
    f.indexExtended &&
    f.pinkyExtended &&
    !f.middleExtended &&
    !f.ringExtended &&
    (f.thumbExtended || f.thumbExtendedWide || f.dThumbMiddleTip > f.palmScale * 0.45)
  ) {
    scores['I_LOVE_YOU'] = 0.96;
  }

  // Word 2: HELLO (Open upright hand waving with horizontal oscillations)
  const isFlatUpright =
    f.indexExtended &&
    f.middleExtended &&
    f.ringExtended &&
    f.pinkyExtended &&
    !f.isHandDownward;

  if (isFlatUpright) {
    // Dynamic wave sequence requirement
    if (hasTemporal && (temporal.oscillationsX >= 2 || temporal.averageSpeed > 0.16)) {
      scores['HELLO'] = 0.95;
    } else if (hasTemporal && temporal.isDownwardStroke) {
      scores['THANK_YOU'] = 0.95;
    } else if (hasTemporal && temporal.isCircularMotion) {
      scores['PLEASE'] = 0.95;
    }
  }

  // Word 3: YES (Nodding fist vertically)
  if (f.allFingersCurled) {
    if (hasTemporal && (temporal.oscillationsY >= 1 || (temporal.isDownwardStroke && isMoving))) {
      scores['YES'] = 0.95;
    } else if (hasTemporal && temporal.isCircularMotion) {
      scores['SORRY'] = 0.95;
    } else if (hasTemporal && temporal.isTShaking) {
      scores['BATHROOM'] = 0.95;
    } else if (hasTemporal && temporal.isUpwardStroke && f.thumbExtended) {
      scores['HELP'] = 0.95;
    }
  }

  // Word 4: NO (Pinch snap of index + middle to thumb)
  if (f.indexExtended && f.middleExtended && !f.ringExtended && !f.pinkyExtended) {
    if (hasTemporal && (temporal.isPinchingMotion || (f.dThumbIndexTip < f.palmScale * 0.35 && isMoving))) {
      scores['NO'] = 0.95;
    }
  }

  // Word 5: WHERE (Index finger upright wagging left-right)
  if (f.indexExtended && !f.middleExtended && !f.ringExtended && !f.pinkyExtended) {
    if (hasTemporal && temporal.oscillationsX >= 2) {
      scores['WHERE'] = 0.95;
    }
  }

  // Word 6: WHAT (Horizontal open hands shaking outward)
  if (f.isHandHorizontal && isFlatUpright && hasTemporal && temporal.oscillationsX >= 2) {
    scores['WHAT'] = 0.95;
  }

  // Word 7: DRINK (C-hand tilting upward)
  const isCCup =
    f.dThumbIndexTip >= f.palmScale * 0.38 &&
    f.dThumbIndexTip <= f.palmScale * 1.15 &&
    f.indexPipAngle >= 70 &&
    f.indexPipAngle <= 145;
  if (isCCup && hasTemporal && (temporal.isUpwardStroke || temporal.netDisplacementY < -0.10)) {
    scores['DRINK'] = 0.95;
  }

  // Word 8: EAT / MORE (Flattened O hands tapping)
  const isFlattenedO =
    f.dThumbIndexTip < f.palmScale * 0.36 &&
    f.dThumbMiddleTip < f.palmScale * 0.36 &&
    f.dThumbRingTip < f.palmScale * 0.36 &&
    !f.allFingersCurled;
  if (isFlattenedO) {
    if (hasTemporal && (temporal.isUpwardStroke || temporal.oscillationsY >= 1)) {
      scores['EAT'] = 0.95;
    } else if (hasTemporal && temporal.oscillationsX >= 1) {
      scores['MORE'] = 0.95;
    }
  }

  // Word 9: STOP (Flat open palm cutting / halting motion)
  if (isFlatUpright && hasTemporal && temporal.isDownwardStroke && temporal.maxSpeed > 0.22) {
    scores['STOP'] = 0.95;
  }

  return formatResult(scores, WORD_CONFIDENCE_THRESHOLD, 'DYNAMIC_LEXICAL', f, true);
}

/**
 * 3. ASSISTED MODE CLASSIFIER
 * Runs isolated alphabet and word classifiers.
 * If ambiguous (e.g. flat hand that could be static 'B' vs dynamic 'HELLO'), marks needsDisambiguation.
 */
export function classifyAssisted(
  landmarks: HandLandmark[],
  temporal?: TemporalSequenceFeatures,
  motionVelocity?: { vx: number; vy: number; vz: number; speed: number },
  handedness?: 'Right' | 'Left' | string
): ClassificationResult {
  const alphabetRes = classifyAlphabet(landmarks, temporal, motionVelocity, handedness);
  const wordRes = classifyWord(landmarks, temporal, handedness);

  const hasAlphabet = !alphabetRes.isUnknown && alphabetRes.confidence >= ALPHABET_CONFIDENCE_THRESHOLD;
  const hasWord = !wordRes.isUnknown && wordRes.confidence >= WORD_CONFIDENCE_THRESHOLD;

  if (hasAlphabet && !hasWord) {
    return alphabetRes;
  }

  if (hasWord && !hasAlphabet) {
    return wordRes;
  }

  if (hasAlphabet && hasWord) {
    // Both triggered: Check if clearly separated by motion
    const isClearlyMoving = !!temporal && !temporal.isMotionSteady && temporal.averageSpeed > 0.14;
    const isClearlyStatic = !!temporal && temporal.isMotionSteady && temporal.averageSpeed < 0.05;

    if (isClearlyMoving && !isClearlyStatic) {
      return wordRes;
    }
    if (isClearlyStatic && !isClearlyMoving) {
      return alphabetRes;
    }

    // Truly ambiguous boundary (e.g. B vs HELLO or D vs WHERE) -> Flag for user confirmation
    return {
      prediction: wordRes.confidence >= alphabetRes.confidence ? wordRes.prediction : alphabetRes.prediction,
      confidence: Math.max(wordRes.confidence, alphabetRes.confidence),
      probability: Math.max(wordRes.probability, alphabetRes.probability),
      topPredictions: [
        wordRes.topPredictions[0] || { label: wordRes.prediction, confidence: wordRes.confidence, percentage: 95 },
        alphabetRes.topPredictions[0] || { label: alphabetRes.prediction, confidence: alphabetRes.confidence, percentage: 95 },
      ],
      isUnknown: false,
      mode: 'ASSISTED',
      motionEnergy: temporal?.averageSpeed || 0,
      fingerStates: alphabetRes.fingerStates,
      isWord: wordRes.confidence >= alphabetRes.confidence,
      needsDisambiguation: true,
      disambiguationOptions: {
        alphabetCandidate: alphabetRes.prediction,
        wordCandidate: wordRes.prediction,
      },
    };
  }

  // Neither passed threshold -> UNKNOWN
  return createEmptyResult('ASSISTED');
}

/**
 * Universal dispatcher maintaining backwards compatibility with any existing caller
 */
export function classifyASLLandmarks(
  landmarks: HandLandmark[],
  motionVelocity?: { vx: number; vy: number; vz: number; speed: number },
  options?: ClassifyOptions
): ClassificationResult {
  const mode =
    options?.recognitionMode ||
    (options?.recognitionFocus === 'alphabets' ? 'alphabet' : options?.recognitionFocus === 'words' ? 'word' : 'assisted');

  const handedness = options?.handedness;

  if (mode === 'alphabet') {
    return classifyAlphabet(landmarks, options?.temporalFeatures, motionVelocity || options?.motionVelocity, handedness);
  }

  if (mode === 'word') {
    return classifyWord(landmarks, options?.temporalFeatures, handedness);
  }

  return classifyAssisted(landmarks, options?.temporalFeatures, motionVelocity || options?.motionVelocity, handedness);
}

function formatResult(
  scores: Record<string, number>,
  threshold: number,
  modeStr: string,
  f: any,
  isWord: boolean
): ClassificationResult {
  const matched = Object.keys(scores)
    .filter((k) => scores[k] > 0)
    .sort((a, b) => scores[b] - scores[a]);

  if (matched.length === 0 || scores[matched[0]] < threshold) {
    return createEmptyResult(modeStr);
  }

  const topLabel = matched[0];
  const topConf = Number(scores[topLabel].toFixed(4));
  const topList: TopPrediction[] = matched.slice(0, 4).map((lbl) => ({
    label: lbl,
    confidence: Number(scores[lbl].toFixed(4)),
    percentage: Math.round(scores[lbl] * 100),
  }));

  return {
    prediction: topLabel,
    confidence: topConf,
    probability: topConf,
    topPredictions: topList,
    isUnknown: false,
    mode: modeStr,
    motionEnergy: 0,
    fingerStates: {
      thumb: f.thumbExtended ? 'extended' : 'curled',
      index: f.indexExtended ? 'extended' : f.indexHooked ? 'hooked' : 'curled',
      middle: f.middleExtended ? (f.fingersCrossed ? 'crossed' : 'extended') : 'curled',
      ring: f.ringExtended ? 'extended' : 'curled',
      pinky: f.pinkyExtended ? 'extended' : 'curled',
    },
    isWord,
  };
}

function createEmptyResult(modeStr: string): ClassificationResult {
  return {
    prediction: 'UNKNOWN',
    confidence: 0,
    probability: 0,
    topPredictions: [],
    isUnknown: true,
    mode: modeStr,
    motionEnergy: 0,
    fingerStates: {
      thumb: 'curled',
      index: 'curled',
      middle: 'curled',
      ring: 'curled',
      pinky: 'curled',
    },
    isWord: false,
  };
}
