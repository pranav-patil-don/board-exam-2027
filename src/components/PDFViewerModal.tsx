import React, { useState, useEffect } from 'react';
import { PDFDocument } from '../types';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Star,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  FileText,
} from 'lucide-react';
import { db } from '../db/database';
import { sound } from '../utils/sound';

interface PDFViewerModalProps {
  document: PDFDocument;
  onClose: () => void;
  onUpdate?: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ document, onClose, onUpdate }) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [zoom, setZoom] = useState<number>(100);
  const [isFav, setIsFav] = useState(document.isFavorite);
  const [attempted, setAttempted] = useState(document.attemptedCount || 0);
  const [correct, setCorrect] = useState(document.correctCount || 0);
  const [redo, setRedo] = useState(document.redoCount || 0);

  useEffect(() => {
    // Generate an object URL from the stored Blob in IndexedDB
    let url = '';
    if (document.blob) {
      url = URL.createObjectURL(document.blob);
      setBlobUrl(url);
    }

    // Update last opened date
    const nowStr = new Date().toISOString().split('T')[0];
    db.pdfs.update(document.id, { lastOpenedDate: nowStr }).then(() => {
      if (onUpdate) onUpdate();
    });

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [document]);

  const toggleFavorite = async () => {
    sound.playClick();
    const nextFav = !isFav;
    setIsFav(nextFav);
    await db.pdfs.update(document.id, { isFavorite: nextFav });
    if (onUpdate) onUpdate();
  };

  const updateStats = async (deltaAtt: number, deltaCorr: number, deltaRedo: number) => {
    sound.playClick();
    const newAtt = Math.max(0, attempted + deltaAtt);
    const newCorr = Math.max(0, correct + deltaCorr);
    const newRedo = Math.max(0, redo + deltaRedo);
    setAttempted(newAtt);
    setCorrect(newCorr);
    setRedo(newRedo);

    await db.pdfs.update(document.id, {
      attemptedCount: newAtt,
      correctCount: newCorr,
      redoCount: newRedo,
    });
    if (onUpdate) onUpdate();
  };

  const handleDownload = () => {
    sound.playClick();
    if (!blobUrl) return;
    const a = window.document.createElement('a');
    a.href = blobUrl;
    a.download = `${document.title.replace(/\s+/g, '_')}.pdf`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070a12] text-slate-100 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <header className="h-14 shrink-0 flex items-center justify-between px-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
            {document.type === 'QUESTION_PAPER' ? <AlertCircle className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">{document.title}</h2>
            <p className="text-[11px] text-slate-400 truncate">
              {document.chapterTag} · {(document.fileSize / 1024).toFixed(1)} KB · Added {document.addedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Reset zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={toggleFavorite}
            title={isFav ? 'Unstar' : 'Star this PDF'}
            className={`p-2 rounded-lg border transition ${
              isFav
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            title="Download offline copy"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            title="Close viewer"
            className="p-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Optional Question Paper Tracker Bar */}
      {document.type === 'QUESTION_PAPER' && (
        <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Paper Performance Tracker:</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Attempted:</span>
              <span className="font-mono font-bold text-white">{attempted}</span>
              <button
                onClick={() => updateStats(1, 0, 0)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Correct:
              </span>
              <span className="font-mono font-bold text-emerald-300">{correct}</span>
              <button
                onClick={() => updateStats(1, 1, 0)}
                className="w-5 h-5 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-xs flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-amber-400 flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Re-do:
              </span>
              <span className="font-mono font-bold text-amber-300">{redo}</span>
              <button
                onClick={() => updateStats(0, 0, 1)}
                className="w-5 h-5 rounded bg-amber-950 text-amber-300 hover:bg-amber-900 text-xs flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main PDF Canvas / Object Container */}
      <div className="flex-1 overflow-auto bg-slate-950/80 p-2 sm:p-6 flex items-center justify-center">
        {blobUrl ? (
          <div
            className="w-full h-full max-w-4xl bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
          >
            <object
              data={blobUrl}
              type="application/pdf"
              className="w-full h-full min-h-[500px]"
            >
              {/* Fallback for browsers without native PDF embed */}
              <div className="p-8 text-center flex flex-col items-center justify-center h-full space-y-4">
                <BookOpen className="w-12 h-12 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">{document.title}</h3>
                <p className="text-sm text-slate-400 max-w-md">
                  This PDF is stored 100% offline in your browser's IndexedDB vault.
                </p>
                <div className="flex gap-3">
                  <a
                    href={blobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition"
                  >
                    Open in Full Reader
                  </a>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-sm hover:bg-slate-700 transition"
                  >
                    Download File
                  </button>
                </div>
              </div>
            </object>
          </div>
        ) : (
          <div className="text-slate-400 text-sm">Loading PDF from offline vault...</div>
        )}
      </div>
    </div>
  );
};
