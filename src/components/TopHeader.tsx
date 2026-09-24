import React from 'react';
import { UserProfile } from '../types';
import { calculateLevelFromXp } from '../utils/gameRules';
import { PWAInstallButton } from './PWAInstallButton';
import { Volume2, VolumeX, Flame, Coins, Shield } from 'lucide-react';
import { sound } from '../utils/sound';

interface TopHeaderProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ profile, onUpdateProfile, onOpenSettings }) => {
  const { currentLevel, xpInCurrentLevel, xpForNextLevel, progressPercent, title } = calculateLevelFromXp(profile.xp);

  const toggleSound = () => {
    const nextSound = !profile.soundEnabled;
    sound.enabled = nextSound;
    if (nextSound) {
      sound.playClick();
    }
    onUpdateProfile({ soundEnabled: nextSound });
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between">
      {/* Brand & Hero Level Crest */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-xs font-mono font-black text-cyan-300">
              {profile.avatarHat || '🛡️'}
            </div>
          </div>
          {/* Micro Level Pill */}
          <span className="absolute -bottom-1 -right-1 px-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-md leading-none py-0.5 font-mono shadow">
            L{currentLevel}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black font-display text-white tracking-tight truncate">
              BoardQuest
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold hidden xs:inline">2027</span>
          </div>
          <p className="text-[10px] text-slate-400 truncate leading-tight font-medium">
            {title}
          </p>
        </div>
      </div>

      {/* Center / Right Stats & Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Streak Flame */}
        <div
          title={`${profile.streakDays} Day Study Streak (${profile.streakDays >= 7 ? '1.5x XP Streak Bonus Active!' : 'Reach 7 days for 1.5x XP!'})`}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-950/40 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold"
        >
          <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-500 animate-pulse" />
          <span>{profile.streakDays}d</span>
          {profile.streakDays >= 7 && (
            <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded hidden sm:inline">1.5x</span>
          )}
        </div>

        {/* Coins Badge */}
        <div
          title={`${profile.coins} Coins in Quest Purse`}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-yellow-400 text-xs font-mono font-bold"
        >
          <span>🪙</span>
          <span>{profile.coins.toLocaleString()}</span>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton compact={true} />

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={profile.soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white transition"
        >
          {profile.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
