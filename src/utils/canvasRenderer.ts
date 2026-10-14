import { HandLandmark, BoundingBox } from '../types';

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17], // Palm bottom
];

export interface RenderOptions {
  mirror?: boolean;
  showLandmarks?: boolean;
  showBoundingBox?: boolean;
  lineColor?: string;
  jointColor?: string;
  tipColor?: string;
  boxColor?: string;
  label?: string;
  confidence?: number;
}

export function renderHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  options: RenderOptions = {}
): void {
  const {
    mirror = false,
    showLandmarks = true,
    showBoundingBox = true,
    lineColor = '#00c8e0',
    jointColor = '#38bdf8',
    tipColor = '#f43f5e',
    boxColor = 'rgba(0, 200, 224, 0.7)',
    label,
    confidence,
  } = options;

  if (!landmarks || landmarks.length !== 21) return;

  ctx.save();

  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  // 1. Draw Skeletal Connections
  if (showLandmarks) {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    HAND_CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    });

    // 2. Draw Joint Nodes
    landmarks.forEach((p, idx) => {
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      const radius = isTip ? 6 : 4;
      const x = p.x * width;
      const y = p.y * height;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? tipColor : jointColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // 3. Draw Bounding Box and Calibration Frame
  if (showBoundingBox) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    landmarks.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const pad = 0.04;
    const x0 = Math.max(0, minX - pad) * width;
    const y0 = Math.max(0, minY - pad) * height;
    const bW = (Math.min(1, maxX + pad) - Math.max(0, minX - pad)) * width;
    const bH = (Math.min(1, maxY + pad) - Math.max(0, minY - pad)) * height;

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, bW, bH);

    // Corner targeting reticles
    const corner = 12;
    ctx.strokeStyle = '#00c8e0';
    ctx.lineWidth = 3;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(x0, y0 + corner);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + corner, y0);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(x0 + bW - corner, y0);
    ctx.lineTo(x0 + bW, y0);
    ctx.lineTo(x0 + bW, y0 + corner);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x0, y0 + bH - corner);
    ctx.lineTo(x0, y0 + bH);
    ctx.lineTo(x0 + corner, y0 + bH);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x0 + bW - corner, y0 + bH);
    ctx.lineTo(x0 + bW, y0 + bH);
    ctx.lineTo(x0 + bW, y0 + bH - corner);
    ctx.stroke();

    // Label header
    if (label && label !== 'UNKNOWN') {
      ctx.restore(); // un-mirror text
      ctx.save();
      const textX = mirror ? width - (x0 + bW) : x0;
      const textY = Math.max(20, y0 - 8);

      ctx.fillStyle = 'rgba(5, 7, 15, 0.85)';
      const textStr = confidence !== undefined ? `${label} (${Math.round(confidence * 100)}%)` : label;
      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(textStr).width;
      ctx.fillRect(textX, textY - 14, textWidth + 12, 18);

      ctx.strokeStyle = '#00c8e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(textX, textY - 14, textWidth + 12, 18);

      ctx.fillStyle = '#00c8e0';
      ctx.fillText(textStr, textX + 6, textY);
      ctx.restore();
      return;
    }
  }

  ctx.restore();
}
