import Dexie, { type Table } from 'dexie';
import {
  Subject,
  Chapter,
  PDFDocument,
  RoutineSlot,
  DayTask,
  UserProfile,
  Achievement,
  ShopItem,
  StudyLog,
} from '../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_CHAPTERS,
  INITIAL_PDFS,
  INITIAL_ROUTINE_SLOTS,
  INITIAL_ACHIEVEMENTS,
  INITIAL_SHOP_ITEMS,
  INITIAL_USER_PROFILE,
} from './seedData';

export class BoardQuestDatabase extends Dexie {
  subjects!: Table<Subject, string>;
  chapters!: Table<Chapter, string>;
  pdfs!: Table<PDFDocument, string>;
  routineSlots!: Table<RoutineSlot, string>;
  dayTasks!: Table<DayTask, string>;
  userProfile!: Table<UserProfile, number>;
  achievements!: Table<Achievement, string>;
  shopItems!: Table<ShopItem, string>;
  studyLogs!: Table<StudyLog, string>;

  constructor() {
    super('BoardQuestDB');

    this.version(1).stores({
      subjects: 'id, order, name',
      chapters: 'id, subjectId, chapterNo, status',
      pdfs: 'id, subjectId, type, isFavorite, addedDate',
      routineSlots: 'id, dayOfWeek, slotIndex, subjectId',
      dayTasks: 'id, dateStr, subjectId, completed',
      userProfile: 'id',
      achievements: 'id, key, unlocked',
      shopItems: 'id, category',
      studyLogs: 'id, dateStr, subjectId, timestamp',
    });
  }
}

export const db = new BoardQuestDatabase();

let initPromise: Promise<void> | null = null;

/**
 * Initializes the database with realistic seed data if empty
 */
export async function initializeDatabase(forceReset: boolean = false): Promise<void> {
  if (forceReset) {
    initPromise = null;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const profile = await db.userProfile.get(1);
      if (!profile || forceReset) {
        if (forceReset) {
          await db.subjects.clear();
          await db.chapters.clear();
          await db.pdfs.clear();
          await db.routineSlots.clear();
          await db.dayTasks.clear();
          await db.userProfile.clear();
          await db.achievements.clear();
          await db.shopItems.clear();
          await db.studyLogs.clear();
        }

        await db.subjects.bulkPut(INITIAL_SUBJECTS);
        await db.chapters.bulkPut(INITIAL_CHAPTERS);
        await db.pdfs.bulkPut(INITIAL_PDFS);
        await db.routineSlots.bulkPut(INITIAL_ROUTINE_SLOTS);
        await db.achievements.bulkPut(INITIAL_ACHIEVEMENTS);
        await db.shopItems.bulkPut(INITIAL_SHOP_ITEMS);
        await db.userProfile.put(INITIAL_USER_PROFILE);

        // Seed initial logs for the past 8 days
        const demoLogs: StudyLog[] = [
          { id: 'log-1', dateStr: '2026-10-01', minutes: 120, subjectId: 'math', xp: 200, timestamp: Date.now() - 7 * 86400000 },
          { id: 'log-2', dateStr: '2026-10-02', minutes: 180, subjectId: 'science', xp: 300, timestamp: Date.now() - 6 * 86400000 },
          { id: 'log-3', dateStr: '2026-10-03', minutes: 150, subjectId: 'kannada', xp: 250, timestamp: Date.now() - 5 * 86400000 },
          { id: 'log-4', dateStr: '2026-10-04', minutes: 210, subjectId: 'ss', xp: 350, timestamp: Date.now() - 4 * 86400000 },
          { id: 'log-5', dateStr: '2026-10-05', minutes: 140, subjectId: 'it', xp: 220, timestamp: Date.now() - 3 * 86400000 },
          { id: 'log-6', dateStr: '2026-10-06', minutes: 240, subjectId: 'math', xp: 400, timestamp: Date.now() - 2 * 86400000 },
          { id: 'log-7', dateStr: '2026-10-07', minutes: 190, subjectId: 'science', xp: 310, timestamp: Date.now() - 1 * 86400000 },
          { id: 'log-8', dateStr: '2026-10-08', minutes: 165, subjectId: 'english', xp: 280, timestamp: Date.now() },
        ];
        await db.studyLogs.bulkPut(demoLogs);
      }
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  })();

  return initPromise;
}

/**
 * Helper to convert Blob to Base64 data string for JSON export
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper to convert Base64 data string back to Blob
 */
function base64ToBlob(base64: string, type: string = 'application/pdf'): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1] || type;
  const raw = window.atob(parts[1] || parts[0]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Exports complete database to a single downloadable JSON backup file
 */
export async function exportFullDatabaseBackup(): Promise<string> {
  const subjects = await db.subjects.toArray();
  const chapters = await db.chapters.toArray();
  const pdfsList = await db.pdfs.toArray();
  const routineSlots = await db.routineSlots.toArray();
  const dayTasks = await db.dayTasks.toArray();
  const userProfile = await db.userProfile.get(1);
  const achievements = await db.achievements.toArray();
  const shopItems = await db.shopItems.toArray();
  const studyLogs = await db.studyLogs.toArray();

  // Convert blobs to serializable format
  const serializedPdfs = await Promise.all(
    pdfsList.map(async (p) => ({
      ...p,
      blobBase64: await blobToBase64(p.blob),
      blob: undefined, // remove non-serializable blob property
    }))
  );

  const backupData = {
    appName: 'BoardQuest 2027',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    subjects,
    chapters,
    pdfs: serializedPdfs,
    routineSlots,
    dayTasks,
    userProfile,
    achievements,
    shopItems,
    studyLogs,
  };

  return JSON.stringify(backupData, null, 2);
}

/**
 * Imports full database save from a JSON string
 */
export async function importFullDatabaseBackup(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (!data || data.appName !== 'BoardQuest 2027') {
      throw new Error('Invalid BoardQuest backup file format.');
    }

    await db.transaction('rw', [
      db.subjects,
      db.chapters,
      db.pdfs,
      db.routineSlots,
      db.dayTasks,
      db.userProfile,
      db.achievements,
      db.shopItems,
      db.studyLogs,
    ], async () => {
      await db.subjects.clear();
      await db.chapters.clear();
      await db.pdfs.clear();
      await db.routineSlots.clear();
      await db.dayTasks.clear();
      await db.userProfile.clear();
      await db.achievements.clear();
      await db.shopItems.clear();
      await db.studyLogs.clear();

      if (data.subjects?.length) await db.subjects.bulkPut(data.subjects);
      if (data.chapters?.length) await db.chapters.bulkPut(data.chapters);
      if (data.routineSlots?.length) await db.routineSlots.bulkPut(data.routineSlots);
      if (data.dayTasks?.length) await db.dayTasks.bulkPut(data.dayTasks);
      if (data.userProfile) await db.userProfile.put(data.userProfile);
      if (data.achievements?.length) await db.achievements.bulkPut(data.achievements);
      if (data.shopItems?.length) await db.shopItems.bulkPut(data.shopItems);
      if (data.studyLogs?.length) await db.studyLogs.bulkPut(data.studyLogs);

      if (data.pdfs?.length) {
        const deserializedPdfs: PDFDocument[] = data.pdfs.map((item: any) => ({
          id: item.id,
          subjectId: item.subjectId,
          type: item.type,
          title: item.title,
          chapterTag: item.chapterTag,
          fileSize: item.fileSize,
          addedDate: item.addedDate,
          lastOpenedDate: item.lastOpenedDate,
          isFavorite: item.isFavorite,
          blob: item.blobBase64 ? base64ToBlob(item.blobBase64) : new Blob([]),
          attemptedCount: item.attemptedCount,
          correctCount: item.correctCount,
          redoCount: item.redoCount,
          totalQuestions: item.totalQuestions,
        }));
        await db.pdfs.bulkPut(deserializedPdfs);
      }
    });

    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    throw err;
  }
}

/**
 * Estimates storage usage in bytes and formatted string
 */
export async function getStorageUsage(): Promise<{ usedBytes: number; formatted: string; pdfCount: number }> {
  let usedBytes = 0;
  let pdfCount = 0;

  try {
    const allPdfs = await db.pdfs.toArray();
    pdfCount = allPdfs.length;
    for (const p of allPdfs) {
      usedBytes += p.fileSize || 0;
    }

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) {
        usedBytes = Math.max(usedBytes, estimate.usage);
      }
    }
  } catch (e) {
    console.error(e);
  }

  const mb = (usedBytes / (1024 * 1024)).toFixed(2);
  return {
    usedBytes,
    formatted: `${mb} MB`,
    pdfCount,
  };
}
