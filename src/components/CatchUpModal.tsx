import React, { useState } from 'react';
import { X, Calendar, RotateCcw, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';
import { db } from '../db/database';
import { addDays, getStudyDate } from '../utils/dateUtils';

interface CatchUpModalProps {
  onClose: () => void;
  onCatchUpApplied: () => void;
}

export const CatchUpModal: React.FC<CatchUpModalProps> = ({ onClose, onCatchUpApplied }) => {
  const [shiftDays, setShiftDays] = useState<number>(1);
  const [isRedistributing, setIsRedistributing] = useState<boolean>(false);
  const [appliedMessage, setAppliedMessage] = useState<string>('');

  const handleShiftCalendar = async () => {
    sound.playClick();
    setIsRedistributing(true);

    try {
      const today = getStudyDate();
      // Find all incomplete day tasks from before or on today
      const pendingTasks = await db.dayTasks
        .filter((t) => !t.completed && t.dateStr <= today)
        .toArray();

      for (const t of pendingTasks) {
        const newDate = addDays(t.dateStr, shiftDays);
        await db.dayTasks.update(t.id, { dateStr: newDate });
      }

      setAppliedMessage(`Successfully shifted ${pendingTasks.length} pending quests forward by ${shiftDays} day(s)!`);
      sound.playTaskComplete();
      setTimeout(() => {
        onCatchUpApplied();
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRedistributing(false);
    }
  };

  const handleRedistributeEvenly = async () => {
    sound.playClick();
    setIsRedistributing(true);

    try {
      const today = getStudyDate();
      const pendingTasks = await db.dayTasks
        .filter((t) => !t.completed && t.dateStr < today)
        .toArray();

      // Distribute tasks across the next 5 days
      for (let i = 0; i < pendingTasks.length; i++) {
        const targetDayOffset = (i % 5) + 1;
        const newDate = addDays(today, targetDayOffset);
        await db.dayTasks.update(pendingTasks[i].id, { dateStr: newDate });
      }

      setAppliedMessage(`Redistributed ${pendingTasks.length} backlog quests evenly across the next 5 days!`);
      sound.playTaskComplete();
      setTimeout(() => {
        onCatchUpApplied();
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRedistributing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl text-slate-100 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold font-display text-white">Catch-Up Protocol</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Fell behind due to school tests or sickness? Catch-Up Mode preserves your morale by reorganizing uncompleted quests without streak penalties.
        </p>

        {appliedMessage ? (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{appliedMessage}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Option 1: Shift Calendar */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Shift Timeline Forward
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => setShiftDays(d)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        shiftDays === d ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Postpones pending quests by {shiftDays} day(s) so today's schedule becomes clear.
              </p>
              <button
                disabled={isRedistributing}
                onClick={handleShiftCalendar}
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
              >
                Apply +{shiftDays} Day Shift
              </button>
            </div>

            {/* Option 2: Redistribute Backlog Evenly */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Balance Over Upcoming Week
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Spreads backlog quests evenly into future free slots to avoid study overload.
              </p>
              <button
                disabled={isRedistributing}
                onClick={handleRedistributeEvenly}
                className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
              >
                Redistribute Backlog
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
