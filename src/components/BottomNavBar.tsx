import React from 'react';
import { Home, BookMarked, CalendarDays, Map, ShoppingBag, Settings } from 'lucide-react';
import { sound } from '../utils/sound';

export type NavTab = 'dashboard' | 'subjects' | 'routine' | 'map' | 'rewards' | 'settings';

interface BottomNavBarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Quests', icon: <Home className="w-5 h-5" /> },
    { id: 'subjects', label: 'Subjects', icon: <BookMarked className="w-5 h-5" /> },
    { id: 'routine', label: 'Timetable', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'map', label: '182d Map', icon: <Map className="w-5 h-5" /> },
    { id: 'rewards', label: 'Shop', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleTabClick = (tab: NavTab) => {
    sound.playClick();
    onChangeTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-6 items-center h-15 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4]" />
              )}
              <div className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-semibold tracking-tight mt-1 truncate ${isActive ? 'text-cyan-300' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
