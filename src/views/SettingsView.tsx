import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  exportFullDatabaseBackup,
  importFullDatabaseBackup,
  getStorageUsage,
  initializeDatabase,
  resetToFreshStart,
  resetTodayQuests,
  factoryResetAll,
  loadDemoSampleData,
} from '../db/database';
import { getStudyDate } from '../utils/dateUtils';
import { sound } from '../utils/sound';
import {
  Save,
  Upload,
  HardDrive,
  Bell,
  Volume2,
  Calendar,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onReloadAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onReloadAllData,
}) => {
  const [examDate, setExamDate] = useState<string>(profile.examDate);
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(profile.dailyGoalHours);
  const [phase2, setPhase2] = useState<boolean>(profile.phase2Enabled);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(profile.soundEnabled);
  const [storageInfo, setStorageInfo] = useState<{ usedBytes: number; formatted: string; pdfCount: number }>({
    usedBytes: 0,
    formatted: 'Calculating...',
    pdfCount: 0,
  });
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [notificationsAllowed, setNotificationsAllowed] = useState<boolean>(false);

  // Reset confirmation states
  const [showFreshResetConfirm, setShowFreshResetConfirm] = useState<boolean>(false);
  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState<boolean>(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState<boolean>(false);

  useEffect(() => {
    updateStorageMeter();
    if (typeof Notification !== 'undefined') {
      setNotificationsAllowed(Notification.permission === 'granted');
    }
  }, []);

  const updateStorageMeter = async () => {
    const info = await getStorageUsage();
    setStorageInfo(info);
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const updated = {
      examDate,
      dailyGoalHours,
      phase2Enabled: phase2,
      soundEnabled,
    };

    sound.enabled = soundEnabled;
    onUpdateProfile(updated);
    setBackupStatus('Preferences saved successfully!');
    setTimeout(() => setBackupStatus(''), 2500);
  };

  const handleExportBackup = async () => {
    sound.playClick();
    try {
      const json = await exportFullDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BoardQuest2027_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus('Backup JSON downloaded successfully!');
      setTimeout(() => setBackupStatus(''), 4000);
    } catch (e) {
      console.error(e);
      setBackupStatus('Failed to generate backup JSON.');
      setTimeout(() => setBackupStatus(''), 4000);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playClick();
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importFullDatabaseBackup(text);
        sound.playTaskComplete();
        await updateStorageMeter();
        setBackupStatus('Vault backup successfully restored! Reloading quest data...');
        setTimeout(() => {
          setBackupStatus('');
          onReloadAllData();
        }, 800);
      } catch (err) {
        setBackupStatus('Failed to import backup file. Ensure it is a valid BoardQuest JSON export.');
        setTimeout(() => setBackupStatus(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleRequestNotifications = async () => {
    sound.playClick();
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotificationsAllowed(perm === 'granted');
      if (perm === 'granted') {
        new Notification('BoardQuest 2027', {
          body: 'Offline Quest Notifications enabled! Study alerts & daily resets active.',
          icon: '/icon-192.png',
        });
      }
    } else {
      setBackupStatus('Notifications are not supported in this browser.');
      setTimeout(() => setBackupStatus(''), 3000);
    }
  };

  const handleResetToFreshStart = async () => {
    sound.playClick();
    setShowFreshResetConfirm(false);
    await resetToFreshStart();
    await updateStorageMeter();
    setBackupStatus('✨ Quest reset to Fresh Start (Level 1, 0 XP)!');
    setTimeout(() => {
      onReloadAllData();
      setBackupStatus('');
    }, 600);
  };

  const handleResetTodayQuests = async () => {
    sound.playClick();
    const today = getStudyDate();
    await resetTodayQuests(today);
    setBackupStatus("Today's quest checklist reset to uncompleted!");
    setTimeout(() => {
      onReloadAllData();
      setBackupStatus('');
    }, 600);
  };

  const handleFactoryReset = async () => {
    sound.playClick();
    setShowFactoryResetConfirm(false);
    await factoryResetAll();
    await updateStorageMeter();
    setBackupStatus('All data completely wiped and restored to pristine start!');
    setTimeout(() => {
      onReloadAllData();
      setBackupStatus('');
    }, 600);
  };

  const handleLoadDemo = async () => {
    sound.playClick();
    setShowDemoConfirm(false);
    await loadDemoSampleData();
    await updateStorageMeter();
    setBackupStatus('Sample demo progress loaded for feature preview!');
    setTimeout(() => {
      onReloadAllData();
      setBackupStatus('');
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto pb-28">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black font-display text-white">
          Quest Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Exam schedules, offline backups, storage vault & reset rules
        </p>
      </div>

      {backupStatus && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{backupStatus}</span>
        </div>
      )}

      {/* Preferences Form */}
      <form onSubmit={handleSavePreferences} className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <h2 className="text-sm font-bold font-display text-white">Exam & Daily Targets</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-300 block mb-1">
              CBSE Class 10 Board Exam Target Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Daily Study Target</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="12"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white text-center"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Daily Reset Rule</label>
              <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono text-center">
                4:00 AM Local
              </div>
            </div>
          </div>

          {/* Phase 2 May Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Phase 2 Revision Mode</span>
              <span className="text-[11px] text-slate-400">
                Extends quest calendar to May 31, 2027 (+61 days post-boards)
              </span>
            </div>
            <input
              type="checkbox"
              checked={phase2}
              onChange={(e) => setPhase2(e.target.checked)}
              className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Sound FX Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white block">RPG Sound Effects</span>
                <span className="text-[11px] text-slate-400">Audio fanfares on level-up and quest completion</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
        >
          Save Preferences
        </button>
      </form>

      {/* Offline Storage Usage Meter */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold font-display text-white">
              Offline Storage Vault (IndexedDB)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {storageInfo.formatted}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {storageInfo.pdfCount} PDFs, revision notes, question papers, and quest logs stored 100% on your device.
          No cloud sync, no tracking, zero ads, zero telemetry.
        </p>
      </section>

      {/* Backup & Restore (JSON Export / Import) */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-bold font-display text-white">
          Data Backup & Transfer (JSON)
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Export your complete quest save (including offline PDFs) to a single JSON backup file, or transfer it to another phone/laptop.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Save className="w-4 h-4 text-cyan-400" />
            <span>Export Backup</span>
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer text-center">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import Backup</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* Notifications & System Info */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold font-display text-white">Notifications</h2>
          </div>
          <button
            onClick={handleRequestNotifications}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
              notificationsAllowed
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {notificationsAllowed ? 'Allowed ✨' : 'Enable'}
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          Enables local study reminders and daily quest reset alarms.
        </p>
      </section>

      {/* Reset & Quest Data Management */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold font-display text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Quest Progress & Daily Resets</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your daily quest checklists or restart your quest journey.
          </p>
        </div>

        {/* Action 1: Reset Today's Checklist */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white block">Reset Today's Quests</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Uncheck all daily tasks for today and restore original routine slots.
            </span>
          </div>
          <button
            onClick={handleResetTodayQuests}
            className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-cyan-300 text-xs font-semibold shrink-0 transition"
          >
            Reset Today
          </button>
        </div>

        {/* Action 2: Reset All Progress to Fresh Start (Level 1) */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-amber-500/30 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Fresh Start (Level 1)</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Resets XP to 0, Level to 1, Coins to 0, and Streak to 0. Clears past study logs and marks all syllabus chapters as Not Started. Keeps your CBSE subject list and timetable intact.
              </span>
            </div>
          </div>

          {showFreshResetConfirm ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-wrap items-center gap-2">
              <span className="text-xs text-amber-300 font-semibold">Start fresh at Level 1?</span>
              <button
                onClick={handleResetToFreshStart}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
              >
                Yes, Reset to Level 1
              </button>
              <button
                onClick={() => setShowFreshResetConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowFreshResetConfirm(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition"
            >
              Reset Quest to Level 1
            </button>
          )}
        </div>
      </section>

      {/* Danger Zone: Factory Wipe & Demo Tools */}
      <section className="rounded-3xl bg-slate-900/60 border border-rose-950 p-5 space-y-4">
        <div>
          <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Danger Zone & Advanced</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Permanent vault deletion or loading mock demo progress for testing.
          </p>
        </div>

        {/* Factory Reset */}
        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/50 space-y-2">
          <div>
            <span className="text-xs font-bold text-rose-300 block">Complete Factory Reset (Wipe All Storage)</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Permanently wipes all IndexedDB tables, stored notes, custom subjects, and restores clean install.
            </span>
          </div>

          {showFactoryResetConfirm ? (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-600/50 flex flex-wrap items-center gap-2">
              <span className="text-xs text-rose-200 font-bold">Permanently erase all local data?</span>
              <button
                onClick={handleFactoryReset}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Wipe All</span>
              </button>
              <button
                onClick={() => setShowFactoryResetConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowFactoryResetConfirm(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-900/40 transition"
            >
              Factory Wipe Vault
            </button>
          )}
        </div>

        {/* Load Demo Data (Optional for testing) */}
        <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-slate-300 block">Demo & Testing Data</span>
            <span className="text-[11px] text-slate-500 block">
              Populate sample Level 8 stats, heatmap logs, and demo progress.
            </span>
          </div>
          {showDemoConfirm ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleLoadDemo}
                className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
              >
                Load Demo
              </button>
              <button
                onClick={() => setShowDemoConfirm(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDemoConfirm(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 transition"
            >
              Load Demo
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
