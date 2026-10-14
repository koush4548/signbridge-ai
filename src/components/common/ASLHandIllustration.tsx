import React from 'react';

export interface ASLHandIllustrationProps {
  sign?: string;
  size?: number;
  className?: string;
}

export const ASLHandIllustration: React.FC<ASLHandIllustrationProps> = ({
  sign = 'A',
  size = 120,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-slate-900/60 border border-slate-700/50 p-2 shadow-inner ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-cyan-400 font-mono tracking-wider">{sign}</span>
        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono">ASL Handshape</span>
      </div>
    </div>
  );
};

export default ASLHandIllustration;
