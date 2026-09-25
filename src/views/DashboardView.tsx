import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  DayTask,
  Chapter,
  Subject,
  StudyLog,
} from '../types';
import {
  calculateLevelFromXp,
  calculateTaskRewards,
} from '../utils/gameRules';
import {
  getDaysRemaining,
  getStudyDate,
  formatDateToHuman,
  addDays,
} from '../utils/dateUtils';
import { db, resetTodayQuests } from '../db/database';
import { sound } from '../utils/sound';
import { fireSubtleConfetti } from '../utils/confetti';
import {
  Flame,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  Plus,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Calendar,
  ChevronRight,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { PomodoroTimerModal } from '../components/PomodoroTimerModal';

interface DashboardViewProps {
  profile: UserProfile;
  subjects: Subject[];
  currentSimulatedDate: string;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onNavigateToSubject: (subjectId: string) => void;
  onOpenCatchUp: () => void;
  onChangeSimulatedDate: (newDate: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  subjects,
  currentSimulatedDate,
  onUpdateProfile,
  onNavigateToSubject,
  onOpenCatchUp,
  onChangeSimulatedDate,
}) => {
  const [tasks, setTasks] = useState<DayTask[]>([]);
  const [weakChapters, setWeakChapters] = useState<Chapter[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [activeTimerTask, setActiveTimerTask] = useState<DayTask | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickSubjectId, setQuickSubjectId] = useState<string>('math');
  const [quickMinutes, setQuickMinutes] = useState<number>(45);

  const { currentLevel, xpInCurrentLevel, xpForNextLevel, progressPercent, title } = calculateLevelFromXp(profile.xp);
  const daysToExam = getDaysRemaining(profile.examDate, currentSimulatedDate);

  // Load tasks for current study date & weak chapters & logs
  useEffect(() => {
    loadData();
  }, [currentSimulatedDate]);

  const loadData = async () => {
    // 1. Load tasks for current date
    let dayTasks = await db.dayTasks.where('dateStr').equals(currentSimulatedDate).toArray();

    // If no tasks exist for this date yet, generate initial tasks from routine slots for this weekday
    if (dayTasks.length === 0) {
      const [y, m, d] = currentSimulatedDate.split('-').map(Number);
      const jsDay = new Date(y, m - 1, d).getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

      const routineSlots = await db.routineSlots.where('dayOfWeek').equals(dayOfWeek).toArray();
      if (routineSlots.length > 0) {
        const newTasks: DayTask[] = routineSlots.map((slot) => ({
          id: `task-${currentSimulatedDate}-${slot.id}`,
          dateStr: currentSimulatedDate,
          routineSlotId: slot.id,
          subjectId: slot.subjectId,
          title: slot.topic,
          type: slot.type,
          completed: false,
          xpEarned: slot.durationMinutes * 2,
          durationMinutes: slot.durationMinutes,
          difficulty: slot.type === 'TEST' ? 'HARD' : 'MEDIUM',
        }));
        await db.dayTasks.bulkPut(newTasks);
        dayTasks = await db.dayTasks.where('dateStr').equals(currentSimulatedDate).toArray();
      }
    }
    setTasks(dayTasks);

    // 2. Load weakest chapters (status !== MASTERED and weakTag === true)
    const weak = await db.chapters.filter((c) => c.weakTag === true && c.status !== 'MASTERED').limit(3).toArray();
    setWeakChapters(weak);

    // 3. Load past study logs for heatmap & comparison
    const logs = await db.studyLogs.toArray();
    setStudyLogs(logs);
  };

  const toggleTaskCompletion = async (task: DayTask) => {
    const isNowCompleted = !task.completed;
    const rewards = calculateTaskRewards(task.difficulty, profile.streakDays);

    const updatedTask = {
      ...task,
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    };

    await db.dayTasks.put(updatedTask);

    if (isNowCompleted) {
      sound.playTaskComplete();
      sound.playCoin();
      fireSubtleConfetti();

      const newXp = profile.xp + rewards.xp;
      const newCoins = profile.coins + rewards.coins;

      // Check if this date should be marked completed
      const allOtherCompleted = tasks.filter((t) => t.id !== task.id).every((t) => t.completed);
      let completedDates = [...(profile.completedDayDates || [])];
      if (allOtherCompleted && !completedDates.includes(task.dateStr)) {
        completedDates.push(task.dateStr);
      }

      const updatedProfile = {
        xp: newXp,
        coins: newCoins,
        completedDayDates: completedDates,
      };

      await db.userProfile.update(1, updatedProfile);
      onUpdateProfile(updatedProfile);
    } else {
      sound.playClick();
      const updatedProfile = {
        xp: Math.max(0, profile.xp - rewards.xp),
        coins: Math.max(0, profile.coins - rewards.coins),
      };
      await db.userProfile.update(1, updatedProfile);
      onUpdateProfile(updatedProfile);
    }

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
  };

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    sound.playClick();
    const newTask: DayTask = {
      id: `task-${Date.now()}`,
      dateStr: currentSimulatedDate,
      subjectId: quickSubjectId,
      title: quickTitle.trim(),
      type: 'PRACTISE',
      completed: false,
      xpEarned: quickMinutes * 2,
      durationMinutes: quickMinutes,
      difficulty: 'MEDIUM',
    };

    await db.dayTasks.add(newTask);
    setTasks((prev) => [...prev, newTask]);
    setQuickTitle('');
    setShowQuickAdd(false);
  };

  const handleResetQuests = async () => {
    sound.playClick();
    await resetTodayQuests(currentSimulatedDate);
    await loadData();
    const prof = await db.userProfile.get(1);
    if (prof) onUpdateProfile(prof);
  };

  // Local Leaderboard stats: Past 7 days vs Today
  const todayMinutes = studyLogs
    .filter((l) => l.dateStr === currentSimulatedDate)
    .reduce((sum, l) => sum + l.minutes, 0);

  const past7DaysLogs = studyLogs.filter((l) => {
    const diff = Math.round((new Date(currentSimulatedDate).getTime() - new Date(l.dateStr).getTime()) / 86400000);
    return diff > 0 && diff <= 7;
  });
  const past7DaysTotalMinutes = past7DaysLogs.reduce((sum, l) => sum + l.minutes, 0);
  const past7DaysAvgMinutes = Math.round(past7DaysTotalMinutes / 7);

  // Generate 8-week heatmap data (56 days)
  const heatmapDays = Array.from({ length: 56 }).map((_, i) => {
    const date = addDays(currentSimulatedDate, -55 + i);
    const dayLogs = studyLogs.filter((l) => l.dateStr === date);
    const totalMin = dayLogs.reduce((s, l) => s + l.minutes, 0);
    return { date, totalMin };
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto pb-28">
      {/* 1. HERO QUEST HUD & COUNTDOWN CARD */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-cyan-500/30 p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                HERO LEVEL {currentLevel}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-medium text-slate-300 truncate">{title}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-white mt-1">
              Class 10 Board Quest
            </h1>
          </div>

          {/* Countdown Pill */}
          <div className="rounded-2xl bg-amber-950/50 border border-amber-500/40 px-3 py-2 text-right shrink-0">
            <span className="text-[10px] font-bold text-amber-300 block uppercase tracking-wider font-mono">
              COUNTDOWN
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-yellow-400 leading-none">
              {daysToExam}
            </span>
            <span className="text-[9px] text-amber-200/80 block mt-0.5">days to Boards</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              XP {xpInCurrentLevel} / {xpForNextLevel}
            </span>
            <span className="text-cyan-400 font-bold">{progressPercent}% to L{currentLevel + 1}</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Date Selector & Simulation Switcher */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatDateToHuman(currentSimulatedDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onChangeSimulatedDate(addDays(currentSimulatedDate, -1))}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
            >
              -1d
            </button>
            <button
              onClick={() => onChangeSimulatedDate(getStudyDate())}
              className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] font-mono font-bold"
            >
              Today
            </button>
            <button
              onClick={() => onChangeSimulatedDate(addDays(currentSimulatedDate, 1))}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
            >
              +1d
            </button>
          </div>
        </div>
      </section>

      {/* 2. WEAKEST CHAPTER NUDGE CARD */}
      {weakChapters.length > 0 && (
        <section className="rounded-2xl bg-slate-900/90 border border-amber-500/30 p-4 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide font-mono">
                  WEAK SPOT NUDGE
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[11px] text-slate-400 capitalize">
                  {weakChapters[0].subjectId}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                {weakChapters[0].title}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                Status: {weakChapters[0].status.replace('_', ' ')} · Ready for mastery revision
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToSubject(weakChapters[0].subjectId)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shrink-0 hover:bg-amber-400 transition"
          >
            Revise
          </button>
        </section>
      )}

      {/* 3. TODAY'S QUESTS & ROUTINE TASKS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white font-display">
              Today's Quests ({tasks.filter((t) => t.completed).length}/{tasks.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetQuests}
              title="Reset quests for this day to uncompleted"
              className="text-xs font-semibold text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 py-1 px-1.5 rounded-lg hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onOpenCatchUp}
              className="text-xs font-semibold text-slate-400 hover:text-cyan-300 transition"
            >
              Catch-up
            </button>
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 flex items-center justify-center border border-cyan-500/40"
              title="Quick-add task"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Add Form */}
        {showQuickAdd && (
          <form
            onSubmit={handleQuickAddTask}
            className="rounded-2xl bg-slate-900 border border-slate-700 p-3 space-y-3 animate-in fade-in duration-150"
          >
            <input
              type="text"
              placeholder="Quest topic (e.g. Solve 10 Trigonometry identities)..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <div className="flex items-center justify-between gap-2">
              <select
                value={quickSubjectId}
                onChange={(e) => setQuickSubjectId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <select
                  value={quickMinutes}
                  onChange={(e) => setQuickMinutes(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 font-mono"
                >
                  <option value={25}>25 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>

                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Quests List */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-2">
              <span className="text-2xl">⚔️</span>
              <h4 className="text-sm font-bold text-white">No quests scheduled for this day</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Tap "+" to quick-add a study goal, or configure your weekly timetable.
              </p>
              <button
                onClick={() => setShowQuickAdd(true)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs inline-block mt-2"
              >
                Add First Quest
              </button>
            </div>
          ) : (
            tasks.map((task) => {
              const subj = subjects.find((s) => s.id === task.subjectId);
              const rewards = calculateTaskRewards(task.difficulty, profile.streakDays);

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-3 sm:p-3.5 transition flex items-center justify-between gap-3 ${
                    task.completed
                      ? 'bg-slate-950/60 border-slate-800/60 opacity-80'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left Checkbox & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskCompletion(task)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition active:scale-95 ${
                        task.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      aria-label="Toggle quest complete"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono">
                          {subj?.name || task.subjectId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {task.durationMinutes}m · {task.type}
                        </span>
                      </div>
                      <h3
                        className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>
                  </div>

                  {/* Right Rewards & Timer Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-mono text-[10px] sm:text-xs">
                      <span className="text-cyan-400 font-bold block">+{rewards.xp} XP</span>
                      <span className="text-amber-400">+{rewards.coins} 🪙</span>
                    </div>

                    {!task.completed && (
                      <button
                        onClick={() => setActiveTimerTask(task)}
                        title="Launch 25m Focus Timer"
                        className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center hover:bg-cyan-500/30 active:scale-95 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-cyan-300" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 4. 8-WEEK ACTIVITY HEATMAP */}
      <section className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-display text-white">
            8-Week Consistency Grid (56 Days)
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {heatmapDays.filter((d) => d.totalMin > 0).length} active study days
          </span>
        </div>

        {/* Horizontal Mini Grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto py-1">
          {heatmapDays.map(({ date, totalMin }) => {
            let bgClass = 'bg-slate-800';
            if (totalMin > 0 && totalMin < 45) bgClass = 'bg-emerald-950 border border-emerald-700/50';
            else if (totalMin >= 45 && totalMin < 120) bgClass = 'bg-emerald-700';
            else if (totalMin >= 120) bgClass = 'bg-emerald-400 shadow-[0_0_6px_#34d399]';

            const isToday = date === currentSimulatedDate;

            return (
              <div
                key={date}
                title={`${date}: ${totalMin} mins studied`}
                className={`w-3.5 h-3.5 rounded-[3px] transition-transform ${bgClass} ${
                  isToday ? 'ring-2 ring-cyan-400' : ''
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-950 border border-emerald-700/50" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
          <span>More</span>
        </div>
      </section>

      {/* 5. LOCAL LEADERBOARD (Self vs Past-Week Self) */}
      <section className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-display text-white">
            Personal Leaderboard (Past Week vs Today)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">PAST 7-DAY AVG</span>
            <span className="text-lg font-bold text-slate-200 mt-0.5 block">{past7DaysAvgMinutes}m</span>
            <span className="text-[10px] text-slate-400">focus per day</span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
            <span className="text-[10px] text-cyan-400 font-bold block">TODAY'S MOMENTUM</span>
            <span className="text-lg font-bold text-cyan-300 mt-0.5 block">{todayMinutes}m</span>
            <span className="text-[10px] text-slate-300">
              {todayMinutes >= past7DaysAvgMinutes ? '🔥 Ahead of average' : '⚡ Keep pushing!'}
            </span>
          </div>
        </div>
      </section>

      {/* Active Pomodoro Timer Modal */}
      {activeTimerTask && (
        <PomodoroTimerModal
          taskTitle={activeTimerTask.title}
          subjectId={activeTimerTask.subjectId}
          defaultMinutes={activeTimerTask.durationMinutes}
          onClose={() => setActiveTimerTask(null)}
          onCompleteSession={(mins) => {
            toggleTaskCompletion(activeTimerTask);
            setActiveTimerTask(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};
