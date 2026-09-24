import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle, Bell, Flame } from 'lucide-react';
import { sound } from '../utils/sound';
import { fireSubtleConfetti } from '../utils/confetti';
import { db } from '../db/database';
import { getStudyDate } from '../utils/dateUtils';

interface PomodoroTimerModalProps {
  taskTitle?: string;
  subjectId?: string;
  defaultMinutes?: number;
  onClose: () => void;
  onCompleteSession?: (minutes: number) => void;
}

export const PomodoroTimerModal: React.FC<PomodoroTimerModalProps> = ({
  taskTitle = 'Deep Study Focus',
  subjectId = 'math',
  defaultMinutes = 25,
  onClose,
  onCompleteSession,
}) => {
  const [mode, setMode] = useState<'WORK' | 'BREAK'>('WORK');
  const [workDuration, setWorkDuration] = useState<number>(defaultMinutes);
  const [breakDuration] = useState<number>(5);
  const [secondsLeft, setSecondsLeft] = useState<number>(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [minutesLogged, setMinutesLogged] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalSeconds = (mode === 'WORK' ? workDuration : breakDuration) * 60;

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerFinish = async () => {
    setIsRunning(false);
    sound.playBell();

    if (mode === 'WORK') {
      const logged = workDuration;
      setMinutesLogged((prev) => prev + logged);
      fireSubtleConfetti();

      // Log study time in IndexedDB
      const studyDate = getStudyDate();
      await db.studyLogs.add({
        id: `log-${Date.now()}`,
        dateStr: studyDate,
        minutes: logged,
        subjectId: subjectId,
        xp: logged * 2,
        timestamp: Date.now(),
      });

      // Award XP in profile
      const profile = await db.userProfile.get(1);
      if (profile) {
        await db.userProfile.update(1, {
          xp: profile.xp + logged * 2,
          coins: profile.coins + Math.round(logged * 0.5),
        });
      }

      if (onCompleteSession) {
        onCompleteSession(logged);
      }

      // Switch to break
      setMode('BREAK');
      setSecondsLeft(breakDuration * 60);
    } else {
      // Break finished
      setMode('WORK');
      setSecondsLeft(workDuration * 60);
    }
  };

  const togglePlay = () => {
    sound.playClick();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    sound.playClick();
    setIsRunning(false);
    setSecondsLeft((mode === 'WORK' ? workDuration : breakDuration) * 60);
  };

  const setCustomMinutes = (mins: number) => {
    sound.playClick();
    setIsRunning(false);
    setWorkDuration(mins);
    if (mode === 'WORK') {
      setSecondsLeft(mins * 60);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / totalSeconds));
  const strokeDashoffset = 283 * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl text-slate-100 flex flex-col items-center relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {mode === 'WORK' ? 'Focus Quest' : 'Rest Sanctuary'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Title */}
        <div className="text-center px-2 mb-4 w-full">
          <h3 className="text-sm sm:text-base font-bold text-white truncate">{taskTitle}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'WORK' ? 'Deep concentration earns XP & Coins' : 'Take deep breaths & relax'}
          </p>
        </div>

        {/* Duration Selectors (Work Mode) */}
        {mode === 'WORK' && !isRunning && (
          <div className="flex items-center gap-2 mb-4">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setCustomMinutes(mins)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition ${
                  workDuration === mins
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Circular Progress Display */}
        <div className="relative w-48 h-48 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1e293b"
              strokeWidth="6"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={mode === 'WORK' ? '#06b6d4' : '#10b981'}
              strokeWidth="6"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
              {formatTime(secondsLeft)}
            </span>
            <span className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
              {mode === 'WORK' ? 'Focusing' : 'Break'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={resetTimer}
            title="Reset timer"
            className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className={`h-14 px-8 rounded-2xl flex items-center gap-2.5 font-bold text-sm shadow-xl active:scale-95 transition ${
              isRunning
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/25 hover:bg-amber-400'
                : 'bg-cyan-500 text-slate-950 shadow-cyan-500/25 hover:bg-cyan-400'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-slate-950" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Start Quest</span>
              </>
            )}
          </button>

          <button
            onClick={handleTimerFinish}
            title="Complete session now"
            className="w-11 h-11 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-900/60 active:scale-95 transition"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        </div>

        {minutesLogged > 0 && (
          <p className="text-[11px] text-emerald-400 mt-4 flex items-center gap-1 font-mono">
            <span>✨</span> {minutesLogged} mins auto-logged to offline vault
          </p>
        )}
      </div>
    </div>
  );
};
