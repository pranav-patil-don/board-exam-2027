import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-slate-900/95 border border-amber-500/50 px-3.5 py-1.5 text-xs font-semibold text-amber-300 shadow-xl backdrop-blur-md">
      <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-400" />
      <span>Offline Vault Active · All Data & PDFs Stored Locally</span>
    </div>
  );
};
