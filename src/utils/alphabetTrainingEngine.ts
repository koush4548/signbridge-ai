import { HandLandmark } from '../types';

export const ALL_ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function dist3D(a: HandLandmark, b: HandLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function jointAngle(a: HandLandmark, b: HandLandmark, c: HandLandmark): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  if (m1 * m2 === 0) return 0;
  const cosine = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export interface AlphabetFeatures {
  thumbTipWrist: number;
  indexTipWrist: number;
  middleTipWrist: number;
  ringTipWrist: number;
  pinkyTipWrist: number;
  thumbIndexTip: number;
  thumbMiddleTip: number;
  thumbRingTip: number;
  thumbPinkyTip: number;
  indexMiddleTip: number;
  middleRingTip: number;
  ringPinkyTip: number;
  thumbIndexMcp: number;
  thumbMiddleMcp: number;
  thumbRingMcp: number;
  thumbPinkyMcp: number;
  thumbIndexPip: number;
  thumbMiddlePip: number;
  thumbRingPip: number;
  thumbPinkyPip: number;
  indexPipAngle: number;
  middlePipAngle: number;
  ringPipAngle: number;
  pinkyPipAngle: number;
  thumbAngle: number;
  indexExt: boolean;
  middleExt: boolean;
  ringExt: boolean;
  pinkyExt: boolean;
  thumbExt: boolean;
  isUpright: boolean;
  isHorizontal: boolean;
  isDownward: boolean;
  indexTipIndexMcpX: number;
  knuckleProjRatio: number;
  fingersCrossed: boolean;
  indexHooked: boolean;
  palmScale: number;
  speed: number;
}

export function extractAlphabetFeatures(
  landmarks: HandLandmark[],
  speed = 0
): AlphabetFeatures | null {
  if (!landmarks || landmarks.length !== 21) return null;

  const wrist = landmarks[0];
  const thumbCmc = landmarks[1];
  const thumbMcp = landmarks[2];
  const thumbTip = landmarks[4];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  const palmScale = Math.max(0.001, dist3D(wrist, middleMcp));

  const thumbTipWrist = dist3D(thumbTip, wrist) / palmScale;
  const indexTipWrist = dist3D(indexTip, wrist) / palmScale;
  const middleTipWrist = dist3D(middleTip, wrist) / palmScale;
  const ringTipWrist = dist3D(ringTip, wrist) / palmScale;
  const pinkyTipWrist = dist3D(pinkyTip, wrist) / palmScale;

  const thumbIndexTip = dist3D(thumbTip, indexTip) / palmScale;
  const thumbMiddleTip = dist3D(thumbTip, middleTip) / palmScale;
  const thumbRingTip = dist3D(thumbTip, ringTip) / palmScale;
  const thumbPinkyTip = dist3D(thumbTip, pinkyTip) / palmScale;
  const indexMiddleTip = dist3D(indexTip, middleTip) / palmScale;
  const middleRingTip = dist3D(middleTip, ringTip) / palmScale;
  const ringPinkyTip = dist3D(ringTip, pinkyTip) / palmScale;

  const thumbIndexMcp = dist3D(thumbTip, indexMcp) / palmScale;
  const thumbMiddleMcp = dist3D(thumbTip, middleMcp) / palmScale;
  const thumbRingMcp = dist3D(thumbTip, ringMcp) / palmScale;
  const thumbPinkyMcp = dist3D(thumbTip, pinkyMcp) / palmScale;

  const thumbIndexPip = dist3D(thumbTip, indexPip) / palmScale;
  const thumbMiddlePip = dist3D(thumbTip, middlePip) / palmScale;
  const thumbRingPip = dist3D(thumbTip, ringPip) / palmScale;
  const thumbPinkyPip = dist3D(thumbTip, pinkyPip) / palmScale;

  const indexPipAngle = jointAngle(indexMcp, indexPip, indexTip);
  const middlePipAngle = jointAngle(middleMcp, middlePip, middleTip);
  const ringPipAngle = jointAngle(ringMcp, ringPip, ringTip);
  const pinkyPipAngle = jointAngle(pinkyMcp, pinkyPip, pinkyTip);
  const thumbAngle = jointAngle(thumbCmc, thumbMcp, thumbTip);

  const dIndexPipWrist = dist3D(indexPip, wrist);
  const dMiddlePipWrist = dist3D(middlePip, wrist);
  const dRingPipWrist = dist3D(ringPip, wrist);
  const dPinkyPipWrist = dist3D(pinkyPip, wrist);

  const indexExt =
    (dist3D(indexTip, wrist) > dIndexPipWrist * 1.05 && indexPipAngle > 115) ||
    (indexTip.y < indexPip.y - palmScale * 0.08 && indexPipAngle > 110);
  const middleExt =
    (dist3D(middleTip, wrist) > dMiddlePipWrist * 1.05 && middlePipAngle > 115) ||
    (middleTip.y < middlePip.y - palmScale * 0.08 && middlePipAngle > 110);
  const ringExt =
    (dist3D(ringTip, wrist) > dRingPipWrist * 1.04 && ringPipAngle > 110) ||
    (ringTip.y < ringPip.y - palmScale * 0.06 && ringPipAngle > 105);
  const pinkyExt =
    (dist3D(pinkyTip, wrist) > dPinkyPipWrist * 1.04 && pinkyPipAngle > 108) ||
    (pinkyTip.y < pinkyPip.y - palmScale * 0.06 && pinkyPipAngle > 100);

  const thumbExt = thumbAngle > 125 || thumbTipWrist > 1.05 || thumbIndexMcp > 0.6;
  const isUpright = wrist.y > middleMcp.y - palmScale * 0.15;
  const isDownward = indexTip.y > wrist.y + palmScale * 0.05 || middleMcp.y > wrist.y + palmScale * 0.15;
  const indexTipIndexMcpX = Math.abs(indexTip.x - indexMcp.x) / palmScale;
  const isHorizontal =
    indexTipIndexMcpX > 0.4 ||
    Math.abs(indexTip.x - wrist.x) > Math.abs(indexTip.y - wrist.y) * 0.7;

  const kVecX = pinkyMcp.x - indexMcp.x;
  const kVecY = pinkyMcp.y - indexMcp.y;
  const kLenSq = Math.max(0.0001, kVecX * kVecX + kVecY * kVecY);
  const tRelX = thumbTip.x - indexMcp.x;
  const tRelY = thumbTip.y - indexMcp.y;
  const knuckleProjRatio = (tRelX * kVecX + tRelY * kVecY) / kLenSq;

  const fingersCrossed =
    (indexExt || indexPipAngle > 115) &&
    (middleExt || middlePipAngle > 110) &&
    ((indexTip.x - middleTip.x) * (indexMcp.x - middleMcp.x) < 0 ||
      Math.abs(indexTip.x - middleTip.x) < palmScale * 0.14);

  const indexHooked = indexPipAngle > 70 && indexPipAngle < 135 && dist3D(indexTip, indexMcp) / palmScale < 0.75;

  return {
    thumbTipWrist,
    indexTipWrist,
    middleTipWrist,
    ringTipWrist,
    pinkyTipWrist,
    thumbIndexTip,
    thumbMiddleTip,
    thumbRingTip,
    thumbPinkyTip,
    indexMiddleTip,
    middleRingTip,
    ringPinkyTip,
    thumbIndexMcp,
    thumbMiddleMcp,
    thumbRingMcp,
    thumbPinkyMcp,
    thumbIndexPip,
    thumbMiddlePip,
    thumbRingPip,
    thumbPinkyPip,
    indexPipAngle,
    middlePipAngle,
    ringPipAngle,
    pinkyPipAngle,
    thumbAngle,
    indexExt,
    middleExt,
    ringExt,
    pinkyExt,
    thumbExt,
    isUpright,
    isHorizontal,
    isDownward,
    indexTipIndexMcpX,
    knuckleProjRatio,
    fingersCrossed,
    indexHooked,
    palmScale,
    speed,
  };
}

export function evaluateAlphabetScores(feat: AlphabetFeatures): Record<string, number> {
  const scores: Record<string, number> = {};
  ALL_ALPHABETS.forEach((l) => {
    scores[l] = 0;
  });

  const {
    indexExt,
    middleExt,
    ringExt,
    pinkyExt,
    thumbExt,
    isDownward,
    indexTipIndexMcpX,
    speed,
  } = feat;

  const allFingersCurled = !indexExt && !middleExt && !ringExt && !pinkyExt;

  const isCOpenCup =
    !isDownward &&
    feat.thumbIndexTip >= 0.4 &&
    feat.thumbIndexTip <= 1.15 &&
    feat.thumbMiddleTip >= 0.4 &&
    feat.thumbMiddleTip <= 1.15 &&
    feat.indexPipAngle >= 95 &&
    feat.indexPipAngle <= 165 &&
    feat.middlePipAngle >= 95 &&
    feat.middlePipAngle <= 165 &&
    !feat.indexHooked &&
    !allFingersCurled;

  const isOClosedCircle =
    !isCOpenCup &&
    feat.thumbIndexTip < 0.35 &&
    feat.thumbMiddleTip < 0.38 &&
    feat.indexPipAngle > 70 &&
    feat.indexPipAngle < 155 &&
    feat.indexTipWrist > 0.6;

  if (isCOpenCup) {
    scores['C'] = 0.96;
  }
  if (isOClosedCircle) {
    scores['O'] = 0.96;
  }

  if (!indexExt && !middleExt && !ringExt && pinkyExt) {
    const isYThumbWide = (thumbExt || feat.thumbPinkyTip > 0.65) && feat.thumbIndexMcp > 0.45;
    const isJSwoop = speed > 0.12;
    if (isYThumbWide) {
      scores['Y'] = 0.96;
    } else if (isJSwoop) {
      scores['J'] = 0.95;
    } else {
      scores['I'] = 0.96;
    }
  }

  const isXHooked = feat.indexHooked && !middleExt && !ringExt && !pinkyExt && feat.indexTipWrist > 0.5;
  if (isXHooked) {
    scores['X'] = 0.96;
  }

  if (allFingersCurled && !isCOpenCup && !isOClosedCircle && !isXHooked) {
    const isEThumbShelf =
      feat.thumbIndexTip < 0.48 &&
      feat.thumbMiddleTip < 0.48 &&
      feat.thumbIndexPip > 0.32 &&
      feat.thumbMiddlePip > 0.32;
    const isAThumbSide =
      feat.thumbIndexMcp < 0.45 &&
      feat.knuckleProjRatio <= 0.2 &&
      feat.thumbIndexMcp < feat.thumbMiddleMcp * 0.96 &&
      !isEThumbShelf;
    const isTThumbTucked =
      !isAThumbSide &&
      !isEThumbShelf &&
      feat.knuckleProjRatio >= 0.15 &&
      feat.knuckleProjRatio < 0.4 &&
      feat.thumbIndexPip < feat.thumbRingPip;
    const isNThumbTucked =
      !isAThumbSide &&
      !isEThumbShelf &&
      !isTThumbTucked &&
      feat.knuckleProjRatio >= 0.4 &&
      feat.knuckleProjRatio < 0.7 &&
      feat.thumbMiddlePip < feat.thumbPinkyPip;
    const isMThumbTucked =
      !isAThumbSide &&
      !isEThumbShelf &&
      !isTThumbTucked &&
      !isNThumbTucked &&
      feat.knuckleProjRatio >= 0.7 &&
      feat.knuckleProjRatio <= 1.15 &&
      (feat.thumbPinkyPip < 0.55 || feat.thumbRingPip < feat.thumbIndexPip);
    const isSThumbFront =
      !isAThumbSide &&
      !isEThumbShelf &&
      !isTThumbTucked &&
      !isNThumbTucked &&
      !isMThumbTucked &&
      feat.thumbMiddlePip < 0.5;

    if (isEThumbShelf) {
      scores['E'] = 0.96;
    } else if (isAThumbSide) {
      scores['A'] = 0.96;
    } else if (isTThumbTucked) {
      scores['T'] = 0.95;
    } else if (isNThumbTucked) {
      scores['N'] = 0.95;
    } else if (isMThumbTucked) {
      scores['M'] = 0.95;
    } else if (isSThumbFront) {
      scores['S'] = 0.95;
    } else {
      scores['S'] = 0.92;
    }
  }

  if (
    indexExt &&
    (!middleExt || feat.middleTipWrist < feat.indexTipWrist * 0.8) &&
    (!ringExt || feat.ringTipWrist < feat.indexTipWrist * 0.78) &&
    (!pinkyExt || feat.pinkyTipWrist < feat.indexTipWrist * 0.75) &&
    !isCOpenCup
  ) {
    const isZTrajectory = speed > 0.14;
    const isQDownward = isDownward;
    const isGHorizontal = !isQDownward && (feat.isHorizontal || indexTipIndexMcpX > 0.45);
    const isLThumbWide =
      !isQDownward &&
      !isGHorizontal &&
      (thumbExt || feat.thumbIndexMcp > 0.48) &&
      feat.thumbIndexTip > 0.55 &&
      feat.thumbMiddleTip > 0.45;

    if (isZTrajectory) {
      scores['Z'] = 0.95;
    } else if (isQDownward) {
      scores['Q'] = 0.96;
    } else if (isGHorizontal) {
      scores['G'] = 0.96;
    } else if (isLThumbWide) {
      scores['L'] = 0.96;
    } else {
      scores['D'] = 0.96;
    }
  }

  const twoFingersExtended =
    (indexExt || feat.indexPipAngle > 120) &&
    (middleExt || feat.middlePipAngle > 118) &&
    (!ringExt || feat.ringTipWrist < feat.middleTipWrist * 0.84) &&
    (!pinkyExt || feat.pinkyTipWrist < feat.middleTipWrist * 0.8) &&
    !isCOpenCup;

  if (twoFingersExtended) {
    const isPDownward = isDownward;
    const isHHorizontal = !isPDownward && feat.isHorizontal && feat.indexMiddleTip <= 0.32;
    const isRCrossed = !isPDownward && !isHHorizontal && (feat.fingersCrossed || feat.indexMiddleTip < 0.16);
    const isKThumbRaised =
      !isPDownward &&
      !isHHorizontal &&
      !isRCrossed &&
      (feat.thumbMiddlePip < 0.45 || feat.thumbMiddleMcp < 0.45) &&
      feat.indexMiddleTip > 0.18;

    if (isPDownward) {
      scores['P'] = 0.96;
    } else if (isHHorizontal) {
      scores['H'] = 0.96;
    } else if (isRCrossed) {
      scores['R'] = 0.96;
    } else if (isKThumbRaised) {
      scores['K'] = 0.95;
    } else if (feat.indexMiddleTip < 0.22) {
      scores['U'] = 0.96;
    } else if (feat.indexMiddleTip >= 0.25) {
      scores['V'] = 0.96;
    } else {
      if (feat.indexMiddleTip < 0.235) {
        scores['U'] = 0.92;
      } else {
        scores['V'] = 0.92;
      }
    }
  }

  const threeFingersExtended =
    indexExt &&
    middleExt &&
    ringExt &&
    (!pinkyExt || feat.pinkyTipWrist < feat.ringTipWrist * 0.84 || feat.pinkyPipAngle < 125) &&
    !isCOpenCup;

  if (threeFingersExtended) {
    scores['W'] = 1.0;
  }

  if (!indexExt && middleExt && ringExt && pinkyExt && feat.thumbIndexTip < 0.48) {
    scores['F'] = 1.0;
  }

  if (
    indexExt &&
    middleExt &&
    ringExt &&
    pinkyExt &&
    feat.pinkyTipWrist >= feat.ringTipWrist * 0.82 &&
    !isDownward &&
    !isCOpenCup
  ) {
    scores['B'] = 1.0;
  }

  return scores;
}

export function classifyAlphabet(landmarks: HandLandmark[], speed = 0): any {
  const feat = extractAlphabetFeatures(landmarks, speed);
  if (!feat) return null;
  const scores = evaluateAlphabetScores(feat);
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topLetter, topScore] = sorted[0];
  if (topScore <= 0.4) return null;

  return {
    letter: topLetter,
    confidence: topScore,
    percentage: Math.round(topScore * 100),
    breakdown: {
      fingerAlignment: Math.min(100, Math.round(topScore * 100)),
      jointAngles: Math.min(100, Math.round(topScore * 95)),
      thumbPlacement: Math.min(100, Math.round(topScore * 98)),
      handOrientation: Math.min(100, Math.round(topScore * 96)),
    },
    feedback: getLetterFeedback(topLetter),
  };
}

export function getLetterFeedback(letter: string): string[] {
  const tips: string[] = [];
  if (letter === 'D') tips.push('Point your index finger straight up and loop thumb to middle fingertip.');
  else if (letter === 'E') tips.push('Curl all four fingertips tightly down resting on your thumb shelf.');
  else if (letter === 'G') tips.push('Point your index finger horizontally sideways with thumb parallel.');
  else if (letter === 'I') tips.push('Keep pinky straight up and fold thumb flat across your other fingers.');
  else if (letter === 'J') tips.push('Hold pinky straight up and swoop down in a curved J shape.');
  else if (letter === 'K') tips.push('Point index up, angle middle forward, and place thumb on middle knuckle.');
  else if (letter === 'M') tips.push('Tuck thumb under three fingers, poking between ring and pinky.');
  else if (letter === 'N') tips.push('Tuck thumb under two fingers, poking between middle and ring.');
  else if (letter === 'P') tips.push('Make the K handshape and point it downward toward the floor.');
  else if (letter === 'Q') tips.push('Point index finger and thumb straight down toward the floor.');
  else if (letter === 'R') tips.push('Cross your middle finger tightly over your index finger.');
  else if (letter === 'S') tips.push('Clench a tight fist with thumb wrapped horizontally across front of fingers.');
  else if (letter === 'T') tips.push('Tuck thumb under your index finger only, poking between index and middle.');
  else if (letter === 'U') tips.push('Hold index and middle fingers straight up and pressed together.');
  else if (letter === 'V') tips.push('Spread index and middle fingers wide apart in a V shape.');
  else if (letter === 'W') tips.push('Hold index, middle, and ring fingers up in a W, pinky tucked under thumb.');
  else if (letter === 'Y') tips.push('Extend thumb and pinky wide apart with three middle fingers curled.');
  else if (letter === 'Z') tips.push('Point index finger and trace a Z zig-zag path in the air.');
  return tips;
}
