import React from 'react';
import { Sparkles, BookOpen, Hand } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ALL_ASL_REFERENCE } from '../../utils/aslReference';

interface SigningInstructionBreakdownProps {
  tokens: string[];
  onSelectSign?: (letter: string) => void;
  className?: string;
}

export const SigningInstructionBreakdown: React.FC<SigningInstructionBreakdownProps> = ({
  tokens,
  onSelectSign,
  className = '',
}) => {
  const { currentTheme } = useTheme();

  if (!tokens || tokens.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-xl space-y-3 ${className}`}
      style={{
        backgroundColor: currentTheme.bgCard,
        borderColor: currentTheme.borderColor,
      }}
    >
      <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: currentTheme.borderColor }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-white">
            Signing Instruction Breakdown
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {tokens.length} {tokens.length === 1 ? 'Token' : 'Tokens'}
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
        {tokens.map((rawToken, idx) => {
          const cleanToken = rawToken.toUpperCase().trim();
          const ref = ALL_ASL_REFERENCE[cleanToken];
          const isFingerspell = cleanToken.length === 1;

          return (
            <div
              key={`${cleanToken}-${idx}`}
              className="p-3 rounded-xl border flex flex-col gap-1 transition-all"
              style={{
                backgroundColor: currentTheme.bgSurface,
                borderColor: currentTheme.borderColor,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono text-cyan-400">
                  {cleanToken.replace(/_/g, ' ')}
                </span>
                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300">
                  {isFingerspell ? 'Fingerspell' : 'Conversational Sign'}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                {ref?.description || `Form the ASL gesture for ${cleanToken}.`}
              </p>

              {ref?.tips && (
                <p className="text-[11px] text-slate-400 italic">
                  Tip: {Array.isArray(ref.tips) ? ref.tips[0] : ref.tips}
                </p>
              )}

              {onSelectSign && isFingerspell && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectSign(cleanToken)}
                    className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Hand className="w-3 h-3" />
                    <span>View Guide</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SigningInstructionBreakdown;
