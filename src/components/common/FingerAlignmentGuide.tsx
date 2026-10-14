import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Hand,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ALL_ASL_REFERENCE, ASL_ALPHABET_DATA } from '../../utils/aslReference';
import { ASLAlphabetEntry } from '../../types';

export interface FingerAlignmentGuideProps {
  sign: string;
  variant?: 'compact' | 'full';
  className?: string;
  onPractice?: (sign: string) => void;
}

/**
 * Extracts 3 clear, sequential procedural steps from an ASL sign entry.
 */
function deriveProceduralSteps(entry: ASLAlphabetEntry): string[] {
  const p = entry.fingerPositions;
  const letter = entry.letter.toUpperCase();

  // Custom step overrides for popular fingerspelling postures
  if (letter === 'A') {
    return [
      'Raise hand at chest height with palm facing outward toward the viewer.',
      'Curl index, middle, ring, and pinky fingers tightly into a flat fist.',
      'Keep thumb straight upright, resting firmly against the outside edge of your index finger.',
    ];
  }
  if (letter === 'B') {
    return [
      'Hold hand flat with palm facing forward.',
      'Extend all four fingers (index, middle, ring, pinky) straight up pressed together.',
      'Fold thumb flat across the lower palm, keeping the other 4 fingers straight.',
    ];
  }
  if (letter === 'C') {
    return [
      'Turn hand sideways so thumb and fingers are visible in profile.',
      'Curve all four fingers downward into an upper arch.',
      'Curve thumb upward into a lower arch, leaving a clear circular gap resembling the letter C.',
    ];
  }
  if (letter === 'D') {
    return [
      'Point index finger straight up to the ceiling like a number 1.',
      'Curl middle, ring, and pinky fingers inward toward the palm.',
      'Touch the tip of your thumb to the tip of your curled middle finger to create a closed loop.',
    ];
  }
  if (letter === 'E') {
    return [
      'Raise hand with palm facing directly forward.',
      'Curl all four fingertips downward like small claws.',
      'Fold thumb tightly across your palm so your 4 fingertips rest directly on top of the thumb.',
    ];
  }
  if (letter === 'F') {
    return [
      'Touch the tip of your index finger to the tip of your thumb, forming an open circle.',
      'Extend your middle, ring, and pinky fingers straight upward.',
      'Fan the 3 upright fingers slightly apart, identical to the universal OK gesture.',
    ];
  }
  if (letter === 'G') {
    return [
      'Turn your hand horizontally toward your body.',
      'Extend your index finger straight out to the side.',
      'Extend your thumb parallel underneath the index finger, about 1 inch apart like a caliper.',
    ];
  }
  if (letter === 'H') {
    return [
      'Turn your hand horizontally with palm facing your chest.',
      'Extend both index and middle fingers together horizontally pointing sideways.',
      'Keep ring and pinky curled in, with thumb tucked across the ring finger.',
    ];
  }
  if (letter === 'I') {
    return [
      'Curl index, middle, and ring fingers tightly into a fist.',
      'Fold thumb horizontally across the curled fingers.',
      'Extend only your pinky finger straight up toward the ceiling.',
    ];
  }
  if (letter === 'J') {
    return [
      'Form the Letter I posture (pinky straight up, other fingers in a fist).',
      'Trace a smooth J curve in the air with your pinky tip, dipping down and hooking up.',
      'End with your palm facing toward you.',
    ];
  }
  if (letter === 'K') {
    return [
      'Extend your index finger straight up.',
      'Extend your middle finger upward, but tilt it slightly forward at a 45° angle.',
      'Tuck thumb upright between index and middle fingers, resting its tip on the middle knuckle.',
    ];
  }
  if (letter === 'L') {
    return [
      'Extend your index finger straight up to the ceiling.',
      'Extend your thumb straight out sideways at a 90° right angle to form a crisp L.',
      'Keep middle, ring, and pinky curled tightly into your palm.',
    ];
  }
  if (letter === 'M') {
    return [
      'Tuck your thumb across your palm under your first three fingers.',
      'Curl index, middle, and ring fingers over top of the tucked thumb.',
      'Let the thumb tip peek out between your ring and pinky fingers.',
    ];
  }
  if (letter === 'N') {
    return [
      'Tuck your thumb across your palm under your first two fingers.',
      'Curl index and middle fingers over top of the thumb.',
      'Let the thumb tip peek out between your middle and ring fingers.',
    ];
  }
  if (letter === 'O') {
    return [
      'Curve all four fingers forward in a smooth rounded arc.',
      'Curve thumb forward to meet all fingertips at their tips.',
      'Form an open circular aperture you can look through like a telescope.',
    ];
  }
  if (letter === 'P') {
    return [
      'Form a Letter K handshape (index upright, middle forward, thumb between).',
      'Rotate your entire wrist downward so fingers point toward the floor.',
      'Keep middle finger pointing straight down and index pointing horizontal.',
    ];
  }
  if (letter === 'Q') {
    return [
      'Form a Letter G posture (index and thumb parallel).',
      'Angle your wrist downward so index and thumb point straight toward the ground.',
      'Keep other three fingers curled tightly into your palm.',
    ];
  }
  if (letter === 'R') {
    return [
      'Extend index and middle fingers straight up.',
      'Cross your middle finger tightly over the front of your index finger (fingers crossed).',
      'Keep ring and pinky curled into your palm with thumb folded over them.',
    ];
  }
  if (letter === 'S') {
    return [
      'Curl all four fingers tightly into a compact fist.',
      'Wrap your thumb horizontally across the front of all curled fingers.',
      'Distinguish from A: Thumb crosses the front knuckles, rather than resting at the side.',
    ];
  }
  if (letter === 'T') {
    return [
      'Tuck your thumb under your index finger only.',
      'Curl index finger over the thumb, with thumb tip poking up between index and middle knuckles.',
      'Curl remaining fingers tightly into your palm.',
    ];
  }
  if (letter === 'U') {
    return [
      'Extend index and middle fingers straight up to the ceiling.',
      'Press index and middle fingers tightly flush together with zero gap between them.',
      'Keep ring and pinky curled into palm with thumb folded across them.',
    ];
  }
  if (letter === 'V') {
    return [
      'Extend index and middle fingers straight up.',
      'Spread index and middle fingers wide apart into an open V (peace sign).',
      'Keep ring and pinky curled in with thumb folded across them.',
    ];
  }
  if (letter === 'W') {
    return [
      'Extend index, middle, and ring fingers straight up, spread evenly into a W shape.',
      'Curl your pinky finger into your palm.',
      'Hold pinky tip pinned down firmly with your thumb.',
    ];
  }
  if (letter === 'X') {
    return [
      'Curl middle, ring, and pinky into your palm.',
      'Extend index finger and hook its top knuckle into a curved trigger / hook shape.',
      'Fold thumb resting against the curled fingers.',
    ];
  }
  if (letter === 'Y') {
    return [
      'Extend thumb out wide to the right.',
      'Extend pinky out wide to the left (shaka / hang-loose shape).',
      'Curl the middle three fingers (index, middle, ring) tightly down against your palm.',
    ];
  }
  if (letter === 'Z') {
    return [
      'Curl middle, ring, and pinky fingers into your palm with thumb tucked.',
      'Extend index finger pointing slightly forward.',
      'Trace the letter Z in the air with your index fingertip (horizontal right, diagonal down-left, horizontal right).',
    ];
  }

  // Fallback to structured data
  return [
    `Set palm orientation: ${entry.palmOrientation}.`,
    `Thumb position: ${p.thumb || 'Positioned as required'}.`,
    `Fingers alignment: Index (${p.index}), Middle (${p.middle}), Ring (${p.ring}), Pinky (${p.pinky}).`,
  ];
}

/**
 * Categorizes a finger posture into a simple readable status tag & color.
 */
function getFingerStatusBadge(desc: string = ''): { tag: string; color: string } {
  const d = desc.toLowerCase();
  if (d.includes('straight up') || d.includes('extended') || d.includes('points') || d.includes('high')) {
    return { tag: 'Extended ⬆️', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  }
  if (d.includes('curled') || d.includes('fist') || d.includes('tuck') || d.includes('closed')) {
    return { tag: 'Curled ✊', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  }
  if (d.includes('touch') || d.includes('loop') || d.includes('circle')) {
    return { tag: 'Touching 🤏', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
  }
  if (d.includes('cross')) {
    return { tag: 'Crossed 🤞', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  }
  if (d.includes('hook')) {
    return { tag: 'Hooked 🪝', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  }
  if (d.includes('spread') || d.includes('wide')) {
    return { tag: 'Spread ✌️', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  }
  return { tag: 'Aligned ✨', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
}

/**
 * Finger Alignment Guide Component (No Reference Images)
 * Provides an ultra-clear, structured visual procedure for setting finger alignment.
 */
export const FingerAlignmentGuide: React.FC<FingerAlignmentGuideProps> = ({
  sign,
  variant = 'full',
  className = '',
  onPractice,
}) => {
  const { currentTheme } = useTheme();
  const cleanKey = (sign || 'A').toUpperCase().trim().replace(/[\s-]+/g, '_');
  const entry: any = (ASL_ALPHABET_DATA[cleanKey] ||
    ALL_ASL_REFERENCE[cleanKey] || {
      letter: cleanKey,
      name: `Sign ${cleanKey.replace('_', ' ')}`,
      description: 'Form the target ASL posture accurately.',
      fingerPositions: {
        thumb: 'Aligned in position',
        index: 'Aligned in position',
        middle: 'Aligned in position',
        ring: 'Aligned in position',
        pinky: 'Aligned in position',
      },
      palmOrientation: 'Facing forward toward camera',
      commonMistakes: [],
      tips: 'Hold wrist steady at chest level.',
      difficulty: 'Easy',
    });

  const steps = deriveProceduralSteps(entry);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ==========================================================================
  // COMPACT VARIANT: For Grid Cards (Replaces Reference Images)
  // ==========================================================================
  if (variant === 'compact') {
    const thumbStatus = getFingerStatusBadge(entry.fingerPositions.thumb);
    const indexStatus = getFingerStatusBadge(entry.fingerPositions.index);

    return (
      <div
        className={`w-full h-full flex flex-col justify-between p-2.5 rounded-xl border select-none transition-all group-hover:border-sky-500/50 ${className}`}
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
        }}
      >
        {/* Top: Letter Mark + Palm Orientation */}
        <div className="flex items-center justify-between w-full">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm text-white shadow-xs"
            style={{ background: currentTheme.accentGradient }}
          >
            {cleanKey.length > 3 ? cleanKey.substring(0, 2) : cleanKey}
          </div>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border truncate max-w-[120px]"
            style={{
              backgroundColor: currentTheme.bgCard,
              borderColor: currentTheme.borderColor,
              color: currentTheme.accentPrimary,
            }}
            title={entry.palmOrientation}
          >
            {entry.palmOrientation.includes('sideway')
              ? 'Sideways'
              : entry.palmOrientation.includes('down')
              ? 'Downward'
              : 'Palm Forward'}
          </span>
        </div>

        {/* Middle: 5-Finger Micro-Badges */}
        <div className="space-y-1 my-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span style={{ color: currentTheme.textMuted }}>Thumb:</span>
            <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${thumbStatus.color}`}>
              {thumbStatus.tag}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span style={{ color: currentTheme.textMuted }}>Index:</span>
            <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${indexStatus.color}`}>
              {indexStatus.tag}
            </span>
          </div>
        </div>

        {/* Bottom: Fast Directive */}
        <div className="pt-1 border-t flex items-center justify-between" style={{ borderColor: currentTheme.borderColor }}>
          <span className="text-[10px] truncate leading-tight font-medium" style={{ color: currentTheme.textSecondary }}>
            {entry.description.split('.')[0] || 'Align hand posture'}
          </span>
          <span className="text-[9px] font-bold text-sky-500 ml-1 whitespace-nowrap group-hover:translate-x-0.5 transition-transform">
            Guide →
          </span>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // FULL VARIANT: Complete Step-by-Step Finger Alignment Procedure
  // ==========================================================================
  const fingers = [
    { label: 'Thumb', pos: entry.fingerPositions?.thumb || 'Aligned', icon: '👍' },
    { label: 'Index Finger', pos: entry.fingerPositions?.index || 'Aligned', icon: '☝️' },
    { label: 'Middle Finger', pos: entry.fingerPositions?.middle || 'Aligned', icon: '🖐️' },
    { label: 'Ring Finger', pos: entry.fingerPositions?.ring || 'Aligned', icon: '🖖' },
    { label: 'Pinky Finger', pos: entry.fingerPositions?.pinky || 'Aligned', icon: '🤙' },
  ];

  return (
    <div
      className={`w-full rounded-2xl border p-4 space-y-4 select-none ${className}`}
      style={{
        backgroundColor: currentTheme.bgCard,
        borderColor: currentTheme.borderColor,
      }}
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: currentTheme.borderColor }}>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl text-white shadow-md"
            style={{ background: currentTheme.accentGradient }}
          >
            {cleanKey.replace('_', ' ')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold" style={{ color: currentTheme.textPrimary }}>
                {entry.name}
              </h3>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold"
                style={{
                  backgroundColor: currentTheme.bgSurface,
                  borderColor: currentTheme.borderColor,
                  color: currentTheme.accentPrimary,
                }}
              >
                {entry.difficulty || 'Standard'}
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-md" style={{ color: currentTheme.textSecondary }}>
              {entry.description}
            </p>
          </div>
        </div>

        {/* Palm Orientation Badge */}
        <div
          className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-xl border text-right"
          style={{
            backgroundColor: currentTheme.bgSurface,
            borderColor: currentTheme.borderColor,
          }}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 text-sky-500 font-bold">
            <Compass className="w-3 h-3" /> Palm Direction
          </span>
          <span className="text-xs font-semibold" style={{ color: currentTheme.textPrimary }}>
            {entry.palmOrientation}
          </span>
        </div>
      </div>

      {/* Section 1: The 5-Finger Alignment Matrix */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-sky-500">
            <Hand className="w-3.5 h-3.5" /> 5-Finger Alignment Breakdown
          </span>
          <span className="text-[11px] font-mono" style={{ color: currentTheme.textMuted }}>
            {entry.palmOrientation}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {fingers.map((f, i) => {
            const badge = getFingerStatusBadge(f.pos);
            return (
              <div
                key={i}
                className="p-2.5 rounded-xl border flex flex-col justify-between space-y-1.5 transition-colors"
                style={{
                  backgroundColor: currentTheme.bgSurface,
                  borderColor: currentTheme.borderColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: currentTheme.textPrimary }}>
                    {f.icon} {f.label}
                  </span>
                </div>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${badge.color}`}>
                  {badge.tag}
                </span>
                <p className="text-[11px] leading-snug line-clamp-2" style={{ color: currentTheme.textSecondary }}>
                  {f.pos}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Step-by-Step 3-Step Execution Procedure */}
      <div
        className="p-3.5 rounded-xl border space-y-2.5"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
        }}
      >
        <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-500">
          <CheckCircle2 className="w-3.5 h-3.5" /> 3-Step Execution Procedure
        </span>

        <div className="space-y-2">
          {steps.map((st, idx) => {
            const isChecked = !!checkedSteps[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  isChecked
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'hover:border-sky-500/30'
                }`}
                style={{
                  backgroundColor: isChecked ? undefined : currentTheme.bgCard,
                  borderColor: isChecked ? undefined : currentTheme.borderColor,
                }}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-all ${
                    isChecked
                      ? 'bg-emerald-500 text-white'
                      : 'border text-slate-500'
                  }`}
                  style={{
                    backgroundColor: isChecked ? undefined : currentTheme.bgSurface,
                    borderColor: isChecked ? undefined : currentTheme.borderColor,
                  }}
                >
                  {isChecked ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="flex-1">
                  <span
                    className={`text-xs leading-relaxed block ${
                      isChecked ? 'line-through text-slate-400' : 'font-medium'
                    }`}
                    style={{ color: isChecked ? undefined : currentTheme.textPrimary }}
                  >
                    {st}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Pro-Tip & Common Mistakes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pro Tip */}
        <div
          className="p-3 rounded-xl border flex items-start gap-2.5"
          style={{
            backgroundColor: `${currentTheme.bgSurface}90`,
            borderColor: currentTheme.borderColor,
          }}
        >
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider block text-amber-500 mb-0.5">
              Pro-Alignment Tip
            </span>
            <p className="text-xs leading-relaxed" style={{ color: currentTheme.textSecondary }}>
              {entry.tips || 'Keep your wrist flexible and maintain consistent hand distance from camera.'}
            </p>
          </div>
        </div>

        {/* Common Pitfall */}
        <div
          className="p-3 rounded-xl border flex items-start gap-2.5"
          style={{
            backgroundColor: `${currentTheme.bgSurface}90`,
            borderColor: currentTheme.borderColor,
          }}
        >
          <div className="p-1 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider block text-rose-500 mb-0.5">
              Common Pitfall to Avoid
            </span>
            <p className="text-xs leading-relaxed" style={{ color: currentTheme.textSecondary }}>
              {entry.commonMistakes && entry.commonMistakes.length > 0
                ? entry.commonMistakes.join(' · ')
                : 'Avoid over-extending knuckles or tilting hand off-angle.'}
            </p>
          </div>
        </div>
      </div>

      {/* Practice in Tutor Action */}
      {onPractice && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onPractice(cleanKey)}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold tracking-wide transition-all shadow-md flex items-center gap-1.5 hover:scale-102 cursor-pointer"
            style={{ background: currentTheme.accentGradient }}
          >
            <span>Practice Alignment in Live Camera</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FingerAlignmentGuide;
