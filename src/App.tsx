/**
 * BoardQuest 2027: Gamified CBSE Class 10 Study Planner PWA
 */

import React, { useState, useEffect } from 'react';
import { db, initializeDatabase } from './db/database';
import { UserProfile, Subject } from './types';
import { calculateLevelFromXp, getTitleForLevel } from './utils/gameRules';
import { getStudyDate } from './utils/dateUtils';
import { sound } from './utils/sound';
import { TopHeader } from './components/TopHeader';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LevelUpModal } from './components/LevelUpModal';
import { CatchUpModal } from './components/CatchUpModal';

// Views
import { DashboardView } from './views/DashboardView';
import { SubjectsView } from './views/SubjectsView';
import { RoutineView } from './views/RoutineView';
import { JourneyMapView } from './views/JourneyMapView';
import { RewardsShopView } from './views/RewardsShopView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSimulatedDate, setCurrentSimulatedDate] = useState<string>(getStudyDate());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Catch-Up Modal
  const [showCatchUpModal, setShowCatchUpModal] = useState<boolean>(false);

  // Level Up Detection
  const [levelUpData, setLevelUpData] = useState<{ level: number; title: string; bonusCoins: number } | null>(null);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      await initializeDatabase();
      await loadState();
    } catch (err) {
      console.error('Bootstrap error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadState = async () => {
    const prof = await db.userProfile.get(1);
    if (prof) {
      setProfile(prof);
      sound.enabled = prof.soundEnabled;
    }

    const subjs = await db.subjects.orderBy('order').toArray();
    setSubjects(subjs);
    setDataVersion((v) => v + 1);
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (!profile) return;
    const oldLevel = calculateLevelFromXp(profile.xp).currentLevel;
    const nextProf = { ...profile, ...updated };
    setProfile(nextProf);
    await db.userProfile.update(1, updated);

    if (updated.xp !== undefined) {
      const newLevel = calculateLevelFromXp(updated.xp).currentLevel;
      if (newLevel > oldLevel) {
        const title = getTitleForLevel(newLevel);
        const bonusCoins = newLevel * 50;
        setLevelUpData({
          level: newLevel,
          title,
          bonusCoins,
        });
      }
    }
  };

  const navigateToSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setActiveTab('subjects');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl animate-pulse mb-3">
          ⚔️
        </div>
        <h1 className="text-base font-bold font-display text-white">Loading BoardQuest 2027</h1>
        <p className="text-xs text-slate-400 mt-1">Initializing local offline vault...</p>
      </div>
    );
  }

  // Theme accent class based on user's purchased / equipped theme
  const themeClass =
    profile.currentTheme === 'emerald'
      ? 'theme-emerald'
      : profile.currentTheme === 'amethyst'
      ? 'theme-amethyst'
      : profile.currentTheme === 'sunset'
      ? 'theme-sunset'
      : 'theme-cyber';

  return (
    <div className={`min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans ${themeClass}`}>
      {/* Offline Status Alert */}
      <OfflineIndicator />

      {/* Mobile Top App Bar */}
      <TopHeader
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <DashboardView
            key={`dash-${dataVersion}`}
            profile={profile}
            subjects={subjects}
            currentSimulatedDate={currentSimulatedDate}
            onUpdateProfile={handleUpdateProfile}
            onNavigateToSubject={navigateToSubject}
            onOpenCatchUp={() => setShowCatchUpModal(true)}
            onChangeSimulatedDate={(d) => setCurrentSimulatedDate(d)}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsView
            key={`subj-${dataVersion}`}
            subjects={subjects}
            onUpdateSubjectsList={loadState}
            selectedSubjectId={selectedSubjectId}
            onClearSelectedSubject={() => setSelectedSubjectId(null)}
          />
        )}

        {activeTab === 'routine' && (
          <RoutineView
            key={`rout-${dataVersion}`}
            subjects={subjects}
            profile={profile}
            currentSimulatedDate={currentSimulatedDate}
            onUpdateProfile={handleUpdateProfile}
            onOpenCatchUp={() => setShowCatchUpModal(true)}
          />
        )}

        {activeTab === 'map' && (
          <JourneyMapView
            key={`map-${dataVersion}`}
            profile={profile}
            currentSimulatedDate={currentSimulatedDate}
            onUpdateProfile={handleUpdateProfile}
            onSelectDate={(date) => {
              setCurrentSimulatedDate(date);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'rewards' && (
          <RewardsShopView
            key={`shop-${dataVersion}`}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            key={`settings-${dataVersion}`}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onReloadAllData={loadState}
          />
        )}
      </main>

      {/* Fixed Bottom Tab Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setSelectedSubjectId(null);
          setActiveTab(tab);
        }}
      />

      {/* Catch-Up Mode Modal */}
      {showCatchUpModal && (
        <CatchUpModal
          onClose={() => setShowCatchUpModal(false)}
          onCatchUpApplied={loadState}
        />
      )}

      {/* Level-Up Celebration Modal */}
      {levelUpData && (
        <LevelUpModal
          level={levelUpData.level}
          title={levelUpData.title}
          bonusCoins={levelUpData.bonusCoins}
          onClose={async () => {
            const newCoins = profile.coins + levelUpData.bonusCoins;
            await handleUpdateProfile({ coins: newCoins });
            setLevelUpData(null);
          }}
        />
      )}
    </div>
  );
}
