import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, X, Smartphone, Check } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If running inside installed standalone PWA, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 3000);
    }
  };

  // Chromium / Android flow
  if (isInstallable) {
    return (
      <>
        <button
          onClick={handleInstallClick}
          title="Install BoardQuest 2027 to your home screen"
          aria-label="Install app"
          className={
            compact
              ? "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 active:scale-95 transition"
              : "flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 active:scale-98 transition"
          }
        >
          {justInstalled ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
          <span className="truncate">{justInstalled ? 'Installed!' : 'Install App'}</span>
        </button>
      </>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Install BoardQuest on iPhone or iPad"
          aria-label="Install on iOS"
          className={
            compact
              ? "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold hover:bg-slate-700 active:scale-95 transition"
              : "flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-700 active:scale-98 transition"
          }
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/30 p-5 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-base font-bold font-display">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 text-xs flex items-center justify-center shrink-0 font-mono font-bold">1</span>
                  <p>
                    Tap the <strong className="text-cyan-300 flex inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> Share</strong> button in your Safari bottom bar.
                  </p>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 text-xs flex items-center justify-center shrink-0 font-mono font-bold">2</span>
                  <p>
                    Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 text-xs flex items-center justify-center shrink-0 font-mono font-bold">3</span>
                  <p>
                    Tap <strong className="text-emerald-400">Add</strong> in the top-right corner to play 100% offline like a native app!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition"
              >
                Got It!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
