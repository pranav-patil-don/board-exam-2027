import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  generateJourneyDays,
  getQuestDayIndex,
  formatDateToHuman,
  QUEST_START_DATE,
  QUEST_END_DATE,
} from '../utils/dateUtils';
import { sound } from '../utils/sound';
import { fireSubtleConfetti } from '../utils/confetti';
import { db } from '../db/database';
import {
  Shield,
  Swords,
  Crown,
  Check,
  Lock,
  Sparkles,
  Award,
  Calendar,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface JourneyMapViewProps {
  profile: UserProfile;
  currentSimulatedDate: string;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSelectDate: (dateStr: string) => void;
}

export const JourneyMapView: React.FC<JourneyMapViewProps> = ({
  profile,
  currentSimulatedDate,
  onUpdateProfile,
  onSelectDate,
}) => {
  const [selectedDayNode, setSelectedDayNode] = useState<{ dayNumber: number; dateStr: string } | null>(null);
  const [showBossModal, setShowBossModal] = useState<boolean>(false);
  const [activeBossName, setActiveBossName] = useState<string>('');

  const journeyDays = generateJourneyDays(profile.phase2Enabled);
  const currentHeroDay = getQuestDayIndex(currentSimulatedDate);
  const completedDates = new Set(profile.completedDayDates || []);

  const handleTogglePhase2 = async () => {
    sound.playClick();
    const nextVal = !profile.phase2Enabled;
    await db.userProfile.update(1, { phase2Enabled: nextVal });
    onUpdateProfile({ phase2Enabled: nextVal });
  };

  const openBossFight = (dayNo: number) => {
    sound.playClick();
    const weekNumber = Math.ceil(dayNo / 7);
    setActiveBossName(`Week ${weekNumber} Boss: All-India CBSE Mock Paper ${weekNumber}`);
    setShowBossModal(true);
  };

  const handleVanquishBoss = async () => {
    sound.playLevelUp();
    fireSubtleConfetti();
    const bonusXp = 500;
    const bonusCoins = 300;

    await db.userProfile.update(1, {
      xp: profile.xp + bonusXp,
      coins: profile.coins + bonusCoins,
    });
    onUpdateProfile({
      xp: profile.xp + bonusXp,
      coins: profile.coins + bonusCoins,
    });
    setShowBossModal(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto pb-28">
      {/* Header Banner */}
      <section className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase">
              <Swords className="w-3.5 h-3.5" />
              <span>182-Day Hero's Odyssey</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-white mt-1">
              BoardQuest Journey
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Day {currentHeroDay} of 182 · {completedDates.size} levels conquered
            </p>
          </div>

          <div className="text-right">
            <button
              onClick={handleTogglePhase2}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition ${
                profile.phase2Enabled
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/50 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {profile.phase2Enabled ? 'Phase 2 (May 2027) ON' : '+ Phase 2 May'}
            </button>
          </div>
        </div>

        {/* Quest Window Info */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Start: Oct 1, 2026</span>
          <span className="text-yellow-400 font-bold">Boards: Mar 2027</span>
          <span>{profile.phase2Enabled ? 'May 31, 2027' : 'Mar 31, 2027'}</span>
        </div>
      </section>

      {/* Interactive Journey Track (Snake / Spiral RPG Board) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white font-display">
            Hero Waypoints & Weekly Bosses
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Every 7th Day = Mock Boss Fight ⚔️
          </span>
        </div>

        {/* Milestone Path */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
          {journeyDays.slice(0, 112).map((item) => {
            const isCompleted = completedDates.has(item.dateStr);
            const isCurrent = item.dayNumber === currentHeroDay;
            const isBoss = item.dayNumber % 7 === 0;
            const isPast = item.dayNumber < currentHeroDay;

            let nodeClass = 'bg-slate-900 border-slate-800 text-slate-500';
            if (isCompleted) {
              nodeClass = 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_#10b98133]';
            } else if (isCurrent) {
              nodeClass = 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold ring-4 ring-cyan-500/30 scale-105';
            } else if (isBoss) {
              nodeClass = 'bg-amber-950/50 border-amber-500/40 text-amber-400';
            } else if (isPast) {
              nodeClass = 'bg-slate-900/80 border-slate-800 text-slate-400';
            }

            return (
              <button
                key={item.dayNumber}
                onClick={() => {
                  sound.playClick();
                  if (isBoss) {
                    openBossFight(item.dayNumber);
                  } else {
                    setSelectedDayNode(item);
                  }
                }}
                className={`h-16 rounded-2xl border flex flex-col items-center justify-center relative transition active:scale-95 ${nodeClass}`}
                title={`Day ${item.dayNumber} (${item.dateStr})`}
              >
                {/* Hero Token on Current Day */}
                {isCurrent && (
                  <span className="absolute -top-3 px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-tight shadow">
                    HERO
                  </span>
                )}

                {/* Node Center Icon / Indicator */}
                <div className="text-base leading-none">
                  {isCurrent ? (
                    profile.avatarHat || '🛡️'
                  ) : isBoss ? (
                    '👑'
                  ) : isCompleted ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold">{item.dayNumber}</span>
                  )}
                </div>

                <span className="text-[9px] font-mono mt-1 opacity-80 truncate max-w-[40px]">
                  D{item.dayNumber}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Node Details Modal */}
      {selectedDayNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  WAYPOINT DAY {selectedDayNode.dayNumber}
                </span>
                <h3 className="text-base font-bold text-white font-display">
                  {formatDateToHuman(selectedDayNode.dateStr)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayNode(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Status:{' '}
              {completedDates.has(selectedDayNode.dateStr) ? (
                <span className="text-emerald-400 font-bold">Conquered & Completed ✨</span>
              ) : selectedDayNode.dayNumber === currentHeroDay ? (
                <span className="text-cyan-400 font-bold">Active Today ⚡</span>
              ) : (
                <span className="text-slate-400">Scheduled Journey Day</span>
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSelectDate(selectedDayNode.dateStr);
                  setSelectedDayNode(null);
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
              >
                Go to this Day's Quests
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Boss Fight Modal */}
      {showBossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-amber-950/30 border-2 border-amber-500/50 p-6 shadow-2xl text-slate-100 text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-3xl mb-3 shadow-lg">
              👑
            </div>

            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
              WEEKLY BOSS ARENA
            </span>
            <h3 className="text-lg font-black font-display text-white mt-1">
              {activeBossName}
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Vanquishing weekly boss papers validates your exam endurance. Awards a huge bounty of 500 XP and 300 Coins!
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-around text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">BOUNTY</span>
                <span className="text-cyan-300 font-bold">+500 XP</span>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px]">LOOT</span>
                <span className="text-yellow-400 font-bold">+300 🪙</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBossModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Retreat
              </button>
              <button
                onClick={handleVanquishBoss}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
              >
                Vanquish Boss!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
