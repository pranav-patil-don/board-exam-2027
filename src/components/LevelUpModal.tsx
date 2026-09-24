import React, { useEffect } from 'react';
import { Award, Zap, ChevronRight } from 'lucide-react';
import { sound } from '../utils/sound';
import { fireLevelUpConfetti } from '../utils/confetti';

interface LevelUpModalProps {
  level: number;
  title: string;
  bonusCoins: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, title, bonusCoins, onClose }) => {
  useEffect(() => {
    sound.playLevelUp();
    fireLevelUpConfetti();
  }, [level]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400/60 p-6 shadow-2xl text-slate-100 flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Level Emblem */}
        <div className="relative my-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 rotate-6 shadow-xl shadow-amber-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-xl flex flex-col items-center justify-center -rotate-6">
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">LEVEL</span>
              <span className="text-4xl font-extrabold font-mono text-yellow-300 leading-none">{level}</span>
            </div>
          </div>
        </div>

        {/* Victory text */}
        <span className="text-xs font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 fill-amber-400" /> LEVEL UP ACHIEVED!
        </span>
        <h2 className="text-2xl font-extrabold text-white mt-1 font-display tracking-tight">{title}</h2>
        <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
          Your consistent study devotion has strengthened your hero mastery for the 2027 Board Exams!
        </p>

        {/* Rewards Box */}
        <div className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 my-5 flex items-center justify-around">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              🪙
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block font-medium">COINS BONUS</span>
              <span className="text-sm font-bold text-yellow-400 font-mono">+{bonusCoins}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block font-medium">HERO TITLE</span>
              <span className="text-xs font-bold text-cyan-300 truncate max-w-[100px] block">{title}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-98 transition"
        >
          <span>Claim & Continue Quest</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
