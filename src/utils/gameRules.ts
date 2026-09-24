import { Difficulty } from '../types';

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  EASY: 1.0,     // 50 XP
  MEDIUM: 1.5,   // 75 XP
  HARD: 2.0,     // 100 XP
  EPIC: 3.0,     // 150 XP (Mock tests / Boss fights)
};

export const BASE_TASK_XP = 50;
export const BASE_TASK_COINS = 25;

export const LEVEL_TITLES: { [level: number]: string } = {
  1: 'Novice Scholar',
  3: 'Apprentice Scribe',
  5: 'Quill Squire',
  8: 'Concept Tracker',
  10: 'Chapter Conqueror',
  13: 'Formula Scout',
  16: 'Theorem Knight',
  20: 'Syllabus Sentinel',
  24: 'Revision Paladin',
  28: 'Equation Sorcerer',
  32: 'PyQ Master',
  36: 'High Exam Archon',
  40: 'Board Topper',
  45: 'CBSE Grandmaster',
  50: 'Legend of 2027',
};

export function getTitleForLevel(level: number): string {
  const levels = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const l of levels) {
    if (level >= l) {
      return LEVEL_TITLES[l];
    }
  }
  return 'Novice Scholar';
}

/**
 * Cumulative XP required to reach next level
 * Level n requires (n * 150) XP
 */
export function getXpRequiredForLevel(level: number): number {
  return level * 150;
}

export function calculateTaskRewards(difficulty: Difficulty, streakDays: number): { xp: number; coins: number } {
  const diffMult = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
  const streakMult = streakDays >= 7 ? 1.5 : 1.0;

  const xp = Math.round(BASE_TASK_XP * diffMult * streakMult);
  const coins = Math.round(BASE_TASK_COINS * diffMult);

  return { xp, coins };
}

export interface LevelProgression {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  title: string;
}

export function calculateLevelFromXp(totalXp: number): LevelProgression {
  let level = 1;
  let remainingXp = totalXp;

  while (level < 50) {
    const required = getXpRequiredForLevel(level);
    if (remainingXp >= required) {
      remainingXp -= required;
      level++;
    } else {
      break;
    }
  }

  const xpForNext = getXpRequiredForLevel(level);
  const progressPercent = Math.min(100, Math.round((remainingXp / xpForNext) * 100));

  return {
    currentLevel: level,
    xpInCurrentLevel: remainingXp,
    xpForNextLevel: xpForNext,
    progressPercent,
    title: getTitleForLevel(level),
  };
}
