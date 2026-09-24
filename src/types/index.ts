export type SubjectId = 'kannada' | 'math' | 'science' | 'english' | 'it' | 'ss' | string;

export type ChapterStatus = 'NOT_STARTED' | 'LEARNING' | 'PRACTISED' | 'REVISED' | 'MASTERED';

export type TaskType = 'LEARN' | 'PRACTISE' | 'REVISE' | 'TEST';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';

export interface Subject {
  id: SubjectId;
  name: string;
  code: string;
  emoji: string;
  color: string; // Tailwind hex or class color
  badgeColor: string;
  weeklyTargetHours: number;
  order: number;
}

export interface Chapter {
  id: string;
  subjectId: SubjectId;
  chapterNo: number;
  title: string;
  status: ChapterStatus;
  lastRevisedDate?: string;
  weakTag?: boolean;
  notesCount?: number;
  questionsCount?: number;
}

export interface PDFDocument {
  id: string;
  subjectId: SubjectId;
  type: 'NOTE' | 'QUESTION_PAPER';
  title: string;
  chapterTag: string;
  fileSize: number; // in bytes
  addedDate: string;
  lastOpenedDate?: string;
  isFavorite: boolean;
  blob: Blob;
  // Question paper specific tracker
  attemptedCount?: number;
  correctCount?: number;
  redoCount?: number;
  totalQuestions?: number;
}

export interface RoutineSlot {
  id: string;
  dayOfWeek: number; // 0 = Mon, 1 = Tue, ..., 6 = Sun
  slotIndex: number; // 0..N
  startTime: string; // e.g. "17:00"
  durationMinutes: number; // default 45 min
  subjectId: SubjectId;
  topic: string;
  type: TaskType;
}

export interface DayTask {
  id: string;
  dateStr: string; // "YYYY-MM-DD"
  routineSlotId?: string;
  subjectId: SubjectId;
  title: string;
  type: TaskType;
  completed: boolean;
  completedAt?: string;
  xpEarned: number;
  durationMinutes: number;
  difficulty: Difficulty;
  isBossQuest?: boolean;
}

export interface UserProfile {
  id: number; // singleton = 1
  xp: number;
  coins: number;
  level: number;
  streakDays: number;
  lastActiveDate: string; // "YYYY-MM-DD"
  dailyGoalHours: number;
  examDate: string; // "2027-03-01"
  phase2Enabled: boolean; // May 2027 revision mode
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  currentTheme: 'cyber' | 'emerald' | 'amethyst' | 'sunset';
  avatarHat: string;
  unlockedItems: string[];
  completedDayDates: string[]; // dates where student completed quota
}

export interface ShopItem {
  id: string;
  title: string;
  costCoins: number;
  category: 'THEME' | 'AVATAR' | 'REAL_LIFE';
  icon: string;
  description: string;
  redeemedCount: number;
  custom?: boolean;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
  coinReward: number;
  progress: number;
  maxProgress: number;
}

export interface StudyLog {
  id: string;
  dateStr: string;
  minutes: number;
  subjectId: SubjectId;
  xp: number;
  timestamp: number;
}

export interface DailyQuestDefinition {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  type: 'STUDY_MINUTES' | 'TASKS_COMPLETED' | 'CHAPTER_REVISED';
}
