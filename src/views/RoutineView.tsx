import React, { useState, useEffect } from 'react';
import {
  Subject,
  RoutineSlot,
  DayTask,
  TaskType,
  UserProfile,
} from '../types';
import { db } from '../db/database';
import { sound } from '../utils/sound';
import { fireSubtleConfetti } from '../utils/confetti';
import {
  DAY_NAMES,
  SHORT_DAY_NAMES,
  getStudyDate,
  formatDateToHuman,
  addDays,
} from '../utils/dateUtils';
import { calculateTaskRewards } from '../utils/gameRules';
import { PomodoroTimerModal } from '../components/PomodoroTimerModal';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  CheckCircle2,
  Circle,
  Copy,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
} from 'lucide-react';

interface RoutineViewProps {
  subjects: Subject[];
  profile: UserProfile;
  currentSimulatedDate: string;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenCatchUp: () => void;
}

export const RoutineView: React.FC<RoutineViewProps> = ({
  subjects,
  profile,
  currentSimulatedDate,
  onUpdateProfile,
  onOpenCatchUp,
}) => {
  const [viewMode, setViewMode] = useState<'WEEKLY' | 'DAY'>('WEEKLY');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(0); // 0 = Mon, 6 = Sun
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>([]);
  const [dayTasks, setDayTasks] = useState<DayTask[]>([]);
  const [activeTimerTask, setActiveTimerTask] = useState<DayTask | null>(null);

  // Edit / Add Slot Modal
  const [editingSlot, setEditingSlot] = useState<RoutineSlot | null>(null);
  const [slotSubjectId, setSlotSubjectId] = useState<string>('math');
  const [slotTopic, setSlotTopic] = useState<string>('');
  const [slotType, setSlotType] = useState<TaskType>('LEARN');
  const [slotDuration, setSlotDuration] = useState<number>(45);
  const [slotStartTime, setSlotStartTime] = useState<string>('17:00');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmPreset, setConfirmPreset] = useState<'SCHOOL' | 'HOLIDAY' | 'SPRINT' | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadRoutineData();
  }, [selectedDayOfWeek, currentSimulatedDate]);

  const loadRoutineData = async () => {
    const slots = await db.routineSlots.toArray();
    setRoutineSlots(slots);

    const tasks = await db.dayTasks.where('dateStr').equals(currentSimulatedDate).toArray();
    setDayTasks(tasks);
  };

  // Preset timetable templates
  const applyPresetTemplate = async (templateName: 'SCHOOL' | 'HOLIDAY' | 'SPRINT') => {
    sound.playClick();
    setConfirmPreset(null);

    await db.routineSlots.clear();
    const newSlots: RoutineSlot[] = [];

    if (templateName === 'SCHOOL') {
      // 3 evening study slots per weekday (Mon-Fri) + 4 weekend slots
      for (let day = 0; day < 7; day++) {
        const isWeekend = day >= 5;
        if (!isWeekend) {
          newSlots.push(
            { id: `r-${day}-1`, dayOfWeek: day, slotIndex: 0, startTime: '17:00', durationMinutes: 45, subjectId: day % 2 === 0 ? 'math' : 'science', topic: 'Core Concept Mastery', type: 'LEARN' },
            { id: `r-${day}-2`, dayOfWeek: day, slotIndex: 1, startTime: '17:55', durationMinutes: 45, subjectId: day % 3 === 0 ? 'kannada' : 'ss', topic: 'Questions & NCERT Practice', type: 'PRACTISE' },
            { id: `r-${day}-3`, dayOfWeek: day, slotIndex: 2, startTime: '19:00', durationMinutes: 45, subjectId: day % 2 === 0 ? 'english' : 'it', topic: 'Quick Formula & Vocab Revision', type: 'REVISE' }
          );
        } else {
          newSlots.push(
            { id: `r-${day}-1`, dayOfWeek: day, slotIndex: 0, startTime: '09:30', durationMinutes: 60, subjectId: 'math', topic: 'Full Exercise Deep Practice', type: 'PRACTISE' },
            { id: `r-${day}-2`, dayOfWeek: day, slotIndex: 1, startTime: '11:00', durationMinutes: 60, subjectId: 'science', topic: 'Chemistry Equations & Biology Diagrams', type: 'LEARN' },
            { id: `r-${day}-3`, dayOfWeek: day, slotIndex: 2, startTime: '15:00', durationMinutes: 60, subjectId: 'ss', topic: 'History & Civics Long Answers', type: 'REVISE' },
            { id: `r-${day}-4`, dayOfWeek: day, slotIndex: 3, startTime: '17:00', durationMinutes: 60, subjectId: day === 6 ? 'math' : 'kannada', topic: 'Mock Test Section Challenge', type: 'TEST' }
          );
        }
      }
    } else if (templateName === 'HOLIDAY') {
      // 5 slots per day: morning, afternoon, evening
      for (let day = 0; day < 7; day++) {
        newSlots.push(
          { id: `r-${day}-1`, dayOfWeek: day, slotIndex: 0, startTime: '08:30', durationMinutes: 60, subjectId: 'math', topic: 'High-Difficulty Numerical Problems', type: 'PRACTISE' },
          { id: `r-${day}-2`, dayOfWeek: day, slotIndex: 1, startTime: '10:00', durationMinutes: 60, subjectId: 'science', topic: 'Physics & Chemistry Theory', type: 'LEARN' },
          { id: `r-${day}-3`, dayOfWeek: day, slotIndex: 2, startTime: '14:00', durationMinutes: 45, subjectId: 'ss', topic: 'Geography Maps & Economics', type: 'REVISE' },
          { id: `r-${day}-4`, dayOfWeek: day, slotIndex: 3, startTime: '16:00', durationMinutes: 45, subjectId: 'kannada', topic: 'ಸಾಹಿತ್ಯ & ಗಾದೆ ಮಾತುಗಳು', type: 'LEARN' },
          { id: `r-${day}-5`, dayOfWeek: day, slotIndex: 4, startTime: '17:30', durationMinutes: 45, subjectId: 'english', topic: 'Literature Analysis & Grammar', type: 'REVISE' }
        );
      }
    } else if (templateName === 'SPRINT') {
      // Pre-Board sprint: focus heavily on Mock Tests and revision sweeps
      for (let day = 0; day < 7; day++) {
        newSlots.push(
          { id: `r-${day}-1`, dayOfWeek: day, slotIndex: 0, startTime: '09:00', durationMinutes: 90, subjectId: subjects[day % subjects.length].id, topic: 'Timed 3-Hour Board Sample Paper Half', type: 'TEST' },
          { id: `r-${day}-2`, dayOfWeek: day, slotIndex: 1, startTime: '14:00', durationMinutes: 60, subjectId: 'math', topic: 'High-Weightage Geometry & Trigonometry', type: 'PRACTISE' },
          { id: `r-${day}-3`, dayOfWeek: day, slotIndex: 2, startTime: '16:30', durationMinutes: 60, subjectId: 'science', topic: 'Error Analysis & NCERT Exemplar', type: 'REVISE' }
        );
      }
    }

    await db.routineSlots.bulkPut(newSlots);
    setRoutineSlots(newSlots);
    sound.playTaskComplete();
    fireSubtleConfetti();
    showToast(`Template "${templateName}" applied across all 7 days!`);
  };

  const handleDuplicateWeek = async () => {
    sound.playClick();
    // Re-synchronize current routine slots to upcoming week day tasks
    let addedCount = 0;
    for (let offset = 0; offset < 7; offset++) {
      const targetDate = addDays(currentSimulatedDate, offset);
      const [y, m, d] = targetDate.split('-').map(Number);
      const jsDay = new Date(y, m - 1, d).getDay();
      const dow = jsDay === 0 ? 6 : jsDay - 1;

      const slotsForDay = routineSlots.filter((s) => s.dayOfWeek === dow);
      for (const slot of slotsForDay) {
        const taskId = `task-${targetDate}-${slot.id}`;
        const existing = await db.dayTasks.get(taskId);
        if (!existing) {
          await db.dayTasks.put({
            id: taskId,
            dateStr: targetDate,
            routineSlotId: slot.id,
            subjectId: slot.subjectId,
            title: slot.topic,
            type: slot.type,
            completed: false,
            xpEarned: slot.durationMinutes * 2,
            durationMinutes: slot.durationMinutes,
            difficulty: slot.type === 'TEST' ? 'HARD' : 'MEDIUM',
          });
          addedCount++;
        }
      }
    }
    sound.playTaskComplete();
    showToast(`Routine duplicated! ${addedCount} future quest tasks synchronized.`);
    loadRoutineData();
  };

  const openSlotEditor = (slot?: RoutineSlot) => {
    sound.playClick();
    if (slot) {
      setEditingSlot(slot);
      setSlotSubjectId(slot.subjectId);
      setSlotTopic(slot.topic);
      setSlotType(slot.type);
      setSlotDuration(slot.durationMinutes);
      setSlotStartTime(slot.startTime);
    } else {
      setEditingSlot({
        id: `r-${selectedDayOfWeek}-${Date.now()}`,
        dayOfWeek: selectedDayOfWeek,
        slotIndex: routineSlots.filter((s) => s.dayOfWeek === selectedDayOfWeek).length,
        startTime: '17:00',
        durationMinutes: 45,
        subjectId: subjects[0]?.id || 'math',
        topic: 'Chapter Practice',
        type: 'LEARN',
      });
      setSlotSubjectId(subjects[0]?.id || 'math');
      setSlotTopic('Chapter Practice');
      setSlotType('LEARN');
      setSlotDuration(45);
      setSlotStartTime('17:00');
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    sound.playClick();

    const updated: RoutineSlot = {
      ...editingSlot,
      subjectId: slotSubjectId,
      topic: slotTopic.trim() || 'Study Session',
      type: slotType,
      durationMinutes: slotDuration,
      startTime: slotStartTime,
    };

    await db.routineSlots.put(updated);
    setEditingSlot(null);
    loadRoutineData();
  };

  const handleDeleteSlot = async (slotId: string) => {
    sound.playClick();
    await db.routineSlots.delete(slotId);
    setRoutineSlots((prev) => prev.filter((s) => s.id !== slotId));
    setEditingSlot(null);
  };

  const toggleDayTask = async (task: DayTask) => {
    const isCompleted = !task.completed;
    const rewards = calculateTaskRewards(task.difficulty, profile.streakDays);

    const updated: DayTask = {
      ...task,
      completed: isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    };

    await db.dayTasks.put(updated);

    if (isCompleted) {
      sound.playTaskComplete();
      sound.playCoin();
      fireSubtleConfetti();
      const updatedProfile = {
        xp: profile.xp + rewards.xp,
        coins: profile.coins + rewards.coins,
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

    setDayTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const daySlots = routineSlots
    .filter((s) => s.dayOfWeek === selectedDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto pb-28">
      {/* Header & View Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-display text-white">
            Quest Routine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Weekly timetable grid & Pomodoro study view
          </p>
        </div>

        {/* Segmented Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('WEEKLY');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'WEEKLY' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('DAY');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'DAY' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Day View
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/30 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Preset Templates & Duplication Actions */}
      {viewMode === 'WEEKLY' && (
        <section className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Presets:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {confirmPreset ? (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-amber-300 font-medium">Apply {confirmPreset}?</span>
                <button
                  onClick={() => applyPresetTemplate(confirmPreset)}
                  className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmPreset(null)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setConfirmPreset('SCHOOL')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                >
                  School Day
                </button>
                <button
                  onClick={() => setConfirmPreset('HOLIDAY')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                >
                  Holiday Grind
                </button>
                <button
                  onClick={() => setConfirmPreset('SPRINT')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition"
                >
                  Pre-board Sprint
                </button>
              </>
            )}
            <button
              onClick={handleDuplicateWeek}
              title="Duplicate routine to future weeks"
              className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition ml-auto"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* 7-Day Horizontal Pill Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {SHORT_DAY_NAMES.map((name, idx) => {
          const isSelected = selectedDayOfWeek === idx;
          const slotCount = routineSlots.filter((s) => s.dayOfWeek === idx).length;

          return (
            <button
              key={name}
              onClick={() => {
                sound.playClick();
                setSelectedDayOfWeek(idx);
              }}
              className={`flex-1 min-w-[48px] py-2 px-1 rounded-2xl border text-center transition ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20 scale-105'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-[11px] block">{name}</span>
              <span className="text-[9px] font-mono opacity-80">{slotCount} slots</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: WEEKLY ROUTINE GRID FOR SELECTED DAY */}
      {viewMode === 'WEEKLY' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-display">
              {DAY_NAMES[selectedDayOfWeek]}'s Timetable ({daySlots.length} sessions)
            </h2>
            <button
              onClick={() => openSlotEditor()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slot</span>
            </button>
          </div>

          {/* Slots List */}
          <div className="space-y-2.5">
            {daySlots.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
                <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">No study slots scheduled for {DAY_NAMES[selectedDayOfWeek]}</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tap "Add Slot" or apply a preset template above to build your study timetable.
                </p>
              </div>
            ) : (
              daySlots.map((slot) => {
                const subj = subjects.find((s) => s.id === slot.subjectId);
                const typeColors: Record<TaskType, string> = {
                  LEARN: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
                  PRACTISE: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
                  REVISE: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
                  TEST: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
                };

                return (
                  <div
                    key={slot.id}
                    onClick={() => openSlotEditor(slot)}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-3 shadow"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: subj?.color || '#06b6d4',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center font-mono shrink-0">
                        <span className="text-xs font-bold text-white block">{slot.startTime}</span>
                        <span className="text-[10px] text-slate-400 block">{slot.durationMinutes}m</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                            {subj?.emoji} {subj?.name || slot.subjectId}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${typeColors[slot.type]}`}>
                            {slot.type}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                          {slot.topic}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                      <Edit3 className="w-3.5 h-3.5 hover:text-white" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* VIEW 2: TODAY'S DAY VIEW WITH POMODORO */}
      {viewMode === 'DAY' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white font-display">
                Quests for {formatDateToHuman(currentSimulatedDate)}
              </h2>
              <p className="text-[11px] text-slate-400">
                Tap checkbox to finish or ⚡ to run 25/5 Pomodoro timer
              </p>
            </div>

            <button
              onClick={onOpenCatchUp}
              className="text-xs text-amber-400 font-semibold hover:underline"
            >
              Catch-up mode
            </button>
          </div>

          <div className="space-y-2">
            {dayTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
                <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">No tasks created yet for this date</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Switch to Weekly Grid and tap "Duplicate Week" or quick-add from dashboard.
                </p>
              </div>
            ) : (
              dayTasks.map((task) => {
                const subj = subjects.find((s) => s.id === task.subjectId);
                const rewards = calculateTaskRewards(task.difficulty, profile.streakDays);

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      task.completed
                        ? 'bg-slate-950/60 border-slate-800/60 opacity-80'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleDayTask(task)}
                        className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition active:scale-95 ${
                          task.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {subj?.name || task.subjectId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {task.durationMinutes}m · {task.type}
                          </span>
                        </div>
                        <h4
                          className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${
                            task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right font-mono text-[10px]">
                        <span className="text-cyan-400 font-bold block">+{rewards.xp} XP</span>
                        <span className="text-amber-400">+{rewards.coins} 🪙</span>
                      </div>

                      {!task.completed && (
                        <button
                          onClick={() => setActiveTimerTask(task)}
                          className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center hover:bg-cyan-500/30 active:scale-95 transition"
                          title="Start focus timer"
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
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold font-display text-white mb-3">
              Configure Routine Slot ({DAY_NAMES[editingSlot.dayOfWeek]})
            </h3>

            <form onSubmit={handleSaveSlot} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Subject</label>
                <select
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Topic / Objective</label>
                <input
                  type="text"
                  value={slotTopic}
                  onChange={(e) => setSlotTopic(e.target.value)}
                  placeholder="e.g. Chemical Equations Practice"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Type</label>
                  <select
                    value={slotType}
                    onChange={(e) => setSlotType(e.target.value as TaskType)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  >
                    <option value="LEARN">Learn</option>
                    <option value="PRACTISE">Practise</option>
                    <option value="REVISE">Revise</option>
                    <option value="TEST">Test</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Duration</label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  >
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>60m</option>
                    <option value={90}>90m</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Time</label>
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteSlot(editingSlot.id)}
                  className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                  title="Delete slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                  >
                    Save Slot
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Pomodoro Timer Modal */}
      {activeTimerTask && (
        <PomodoroTimerModal
          taskTitle={activeTimerTask.title}
          subjectId={activeTimerTask.subjectId}
          defaultMinutes={activeTimerTask.durationMinutes}
          onClose={() => setActiveTimerTask(null)}
          onCompleteSession={() => {
            toggleDayTask(activeTimerTask);
            setActiveTimerTask(null);
            loadRoutineData();
          }}
        />
      )}
    </div>
  );
};
