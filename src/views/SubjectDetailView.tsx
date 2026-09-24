import React, { useState, useEffect } from 'react';
import {
  Subject,
  Chapter,
  PDFDocument,
  ChapterStatus,
  StudyLog,
} from '../types';
import { db } from '../db/database';
import { sound } from '../utils/sound';
import { fireSubtleConfetti } from '../utils/confetti';
import { makeSamplePdfBlob } from '../db/seedData';
import { PDFViewerModal } from '../components/PDFViewerModal';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  ListCheck,
  BarChart3,
  Plus,
  Search,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Upload,
} from 'lucide-react';

interface SubjectDetailViewProps {
  subject: Subject;
  onBack: () => void;
  onUpdateSubject: (updated: Partial<Subject>) => void;
}

type TabType = 'notes' | 'questions' | 'chapters' | 'stats';

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  onBack,
  onUpdateSubject,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('chapters');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFavorite, setFilterFavorite] = useState<boolean>(false);
  const [activePdfModal, setActivePdfModal] = useState<PDFDocument | null>(null);

  // New item modal / form states
  const [showAddChapter, setShowAddChapter] = useState<boolean>(false);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');

  const [showAddPdf, setShowAddPdf] = useState<boolean>(false);
  const [newPdfTitle, setNewPdfTitle] = useState<string>('');
  const [newPdfChapter, setNewPdfChapter] = useState<string>('');
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);

  useEffect(() => {
    loadSubjectData();
  }, [subject.id]);

  const loadSubjectData = async () => {
    const chs = await db.chapters.where('subjectId').equals(subject.id).sortBy('chapterNo');
    setChapters(chs);

    const docList = await db.pdfs.where('subjectId').equals(subject.id).toArray();
    setPdfs(docList);

    const logs = await db.studyLogs.where('subjectId').equals(subject.id).toArray();
    setStudyLogs(logs);
  };

  // Chapter 5-stage status transition
  const CHAPTER_STAGES: ChapterStatus[] = [
    'NOT_STARTED',
    'LEARNING',
    'PRACTISED',
    'REVISED',
    'MASTERED',
  ];

  const advanceChapterStatus = async (chapter: Chapter) => {
    sound.playClick();
    const currentIndex = CHAPTER_STAGES.indexOf(chapter.status);
    const nextIndex = (currentIndex + 1) % CHAPTER_STAGES.length;
    const nextStatus = CHAPTER_STAGES[nextIndex];

    const isMastered = nextStatus === 'MASTERED';
    if (isMastered) {
      sound.playTaskComplete();
      fireSubtleConfetti();
    }

    const updated = {
      ...chapter,
      status: nextStatus,
      weakTag: nextStatus === 'LEARNING' ? true : false,
      lastRevisedDate: new Date().toISOString().split('T')[0],
    };

    await db.chapters.put(updated);
    setChapters((prev) => prev.map((c) => (c.id === chapter.id ? updated : c)));
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    sound.playClick();
    const newNo = chapters.length + 1;
    const newChapter: Chapter = {
      id: `${subject.id}-ch-${Date.now()}`,
      subjectId: subject.id,
      chapterNo: newNo,
      title: newChapterTitle.trim(),
      status: 'NOT_STARTED',
      weakTag: false,
      notesCount: 0,
      questionsCount: 0,
    };

    await db.chapters.add(newChapter);
    setChapters((prev) => [...prev, newChapter]);
    setNewChapterTitle('');
    setShowAddChapter(false);
  };

  const handleAddPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPdfTitle.trim()) return;

    sound.playClick();
    let fileBlob: Blob;
    let fileSize = 35000;

    if (newPdfFile) {
      fileBlob = newPdfFile;
      fileSize = newPdfFile.size;
    } else {
      // Auto generate offline study PDF blob
      fileBlob = makeSamplePdfBlob(
        newPdfTitle,
        subject.name,
        `Offline Notes for Chapter: ${newPdfChapter || 'Syllabus Core'}`
      );
    }

    const isQuestionPaper = activeTab === 'questions';
    const newDoc: PDFDocument = {
      id: `pdf-${Date.now()}`,
      subjectId: subject.id,
      type: isQuestionPaper ? 'QUESTION_PAPER' : 'NOTE',
      title: newPdfTitle.trim(),
      chapterTag: newPdfChapter.trim() || 'General',
      fileSize: fileSize,
      addedDate: new Date().toISOString().split('T')[0],
      isFavorite: false,
      blob: fileBlob,
      attemptedCount: isQuestionPaper ? 0 : undefined,
      correctCount: isQuestionPaper ? 0 : undefined,
      redoCount: isQuestionPaper ? 0 : undefined,
      totalQuestions: isQuestionPaper ? 25 : undefined,
    };

    await db.pdfs.add(newDoc);
    setPdfs((prev) => [...prev, newDoc]);
    setNewPdfTitle('');
    setNewPdfChapter('');
    setNewPdfFile(null);
    setShowAddPdf(false);
  };

  const handleDeletePdf = async (id: string) => {
    sound.playClick();
    await db.pdfs.delete(id);
    setPdfs((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePdfFavorite = async (doc: PDFDocument) => {
    sound.playClick();
    const updated = { ...doc, isFavorite: !doc.isFavorite };
    await db.pdfs.put(updated);
    setPdfs((prev) => prev.map((p) => (p.id === doc.id ? updated : p)));
  };

  // Filtered PDFs
  const displayedPdfs = pdfs
    .filter((p) => (activeTab === 'notes' ? p.type === 'NOTE' : p.type === 'QUESTION_PAPER'))
    .filter((p) => (filterFavorite ? p.isFavorite : true))
    .filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.chapterTag.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Subject stats
  const totalMinutesStudied = studyLogs.reduce((acc, log) => acc + log.minutes, 0);
  const totalHours = (totalMinutesStudied / 60).toFixed(1);
  const totalXpEarned = studyLogs.reduce((acc, log) => acc + log.xp, 0);
  const masteredCount = chapters.filter((c) => c.status === 'MASTERED').length;
  const progressPercentage = chapters.length > 0 ? Math.round((masteredCount / chapters.length) * 100) : 0;
  const weakestChapters = chapters.filter((c) => c.weakTag || c.status === 'LEARNING' || c.status === 'NOT_STARTED').slice(0, 4);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto pb-28">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Subjects</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">{subject.emoji}</span>
          <span className="text-sm font-bold font-display text-white">{subject.name}</span>
        </div>
      </div>

      {/* Subject Hero Card */}
      <section
        className="rounded-3xl p-5 border relative overflow-hidden shadow-xl"
        style={{
          backgroundColor: '#0f172a',
          borderColor: `${subject.color}50`,
        }}
      >
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: subject.color }}
        />

        <div className="flex items-start justify-between">
          <div>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={{ backgroundColor: `${subject.color}25`, color: subject.color }}
            >
              CODE: {subject.code}
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-white mt-1.5">
              {subject.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Target: {subject.weeklyTargetHours}h / week · {chapters.length} Chapters Syllabus
            </p>
          </div>

          {/* Progress Ring */}
          <div className="flex flex-col items-center">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={subject.color}
                  strokeWidth="3.5"
                  strokeDasharray={`${progressPercentage}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-mono font-bold text-xs text-white">
                {progressPercentage}%
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono mt-1">Mastered</span>
          </div>
        </div>

        {/* 4 Tabs Segmented Control */}
        <div className="grid grid-cols-4 gap-1 mt-5 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 text-xs">
          {[
            { id: 'chapters', label: 'Chapters', icon: <ListCheck className="w-3.5 h-3.5" /> },
            { id: 'notes', label: 'Notes', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'questions', label: 'PYQ / Tests', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as TabType);
                }}
                className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 font-semibold transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB A: CHAPTERS CHECKLIST (5 Stages) */}
      {activeTab === 'chapters' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white font-display">
                Syllabus Chapters ({chapters.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Tap status badge to cycle: Not started → Learn → Practised → Revised → Mastered
              </p>
            </div>
            <button
              onClick={() => setShowAddChapter(!showAddChapter)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
              title="Add custom chapter"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showAddChapter && (
            <form
              onSubmit={handleAddChapter}
              className="p-3 bg-slate-900 border border-slate-700 rounded-2xl space-y-3"
            >
              <input
                type="text"
                placeholder="Chapter title (e.g. Surface Areas and Volumes)..."
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Add Chapter
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {chapters.map((ch) => {
              const statusColors: Record<ChapterStatus, { text: string; bg: string; border: string }> = {
                NOT_STARTED: { text: 'text-slate-400', bg: 'bg-slate-800/80', border: 'border-slate-700' },
                LEARNING: { text: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-500/40' },
                PRACTISED: { text: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/40' },
                REVISED: { text: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/40' },
                MASTERED: { text: 'text-emerald-300', bg: 'bg-emerald-950/40', border: 'border-emerald-500/50' },
              };

              const currentCfg = statusColors[ch.status];

              return (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {ch.chapterNo}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{ch.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {ch.notesCount || 0} notes · {ch.questionsCount || 0} papers
                        {ch.weakTag && <span className="text-amber-400 ml-1 font-semibold">· Weak area</span>}
                      </p>
                    </div>
                  </div>

                  {/* 5-Stage Status Interactive Badge */}
                  <button
                    onClick={() => advanceChapterStatus(ch)}
                    className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold font-mono transition active:scale-95 shrink-0 ${currentCfg.bg} ${currentCfg.text} ${currentCfg.border}`}
                  >
                    {ch.status === 'MASTERED' ? '⭐ MASTERED' : ch.status.replace('_', ' ')}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB B & C: NOTES & QUESTIONS TABS */}
      {(activeTab === 'notes' || activeTab === 'questions') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-display">
              {activeTab === 'notes' ? 'Offline Notes Vault' : 'Question Papers & PYQs'}
            </h2>
            <button
              onClick={() => setShowAddPdf(!showAddPdf)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </button>
          </div>

          {/* Search & Favorites Filter */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by topic or chapter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={() => setFilterFavorite(!filterFavorite)}
              className={`p-2 rounded-xl border transition ${
                filterFavorite
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Filter favorites"
            >
              <Star className={`w-4 h-4 ${filterFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>

          {/* Upload PDF Form */}
          {showAddPdf && (
            <form
              onSubmit={handleAddPdf}
              className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Add Offline PDF ({activeTab === 'notes' ? 'Notes' : 'Question Paper'})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddPdf(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                placeholder="Document Title (e.g. Mindmap & High-yield Formulae)..."
                value={newPdfTitle}
                onChange={(e) => setNewPdfTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                required
              />

              <input
                type="text"
                placeholder="Chapter / Topic Tag (e.g. Chapter 4)..."
                value={newPdfChapter}
                onChange={(e) => setNewPdfChapter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />

              <div className="p-3 border border-dashed border-slate-700 rounded-xl bg-slate-800/50">
                <label className="text-xs text-slate-300 block font-medium mb-1">
                  Select Local PDF file (optional; generates offline template if blank):
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setNewPdfFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-300 file:text-xs"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPdf(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                >
                  Save to Offline Vault
                </button>
              </div>
            </form>
          )}

          {/* Documents List */}
          <div className="space-y-2">
            {displayedPdfs.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">No PDFs stored in this tab yet</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload syllabus PDFs or previous year papers to study without internet.
                </p>
                <button
                  onClick={() => setShowAddPdf(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs mt-3"
                >
                  Upload First PDF
                </button>
              </div>
            ) : (
              displayedPdfs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setActivePdfModal(doc)}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                      {doc.type === 'QUESTION_PAPER' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{doc.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {doc.chapterTag} · {(doc.fileSize / 1024).toFixed(1)} KB · Added {doc.addedDate}
                        {doc.lastOpenedDate && ` · Last opened ${doc.lastOpenedDate}`}
                      </p>
                      {doc.type === 'QUESTION_PAPER' && doc.attemptedCount !== undefined && (
                        <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          Attempted: {doc.attemptedCount} · Correct: {doc.correctCount || 0} · Re-do: {doc.redoCount || 0}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => togglePdfFavorite(doc)}
                      className={`p-1.5 rounded-lg border transition ${
                        doc.isFavorite
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${doc.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleDeletePdf(doc.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* TAB D: SUBJECT STATS */}
      {activeTab === 'stats' && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase">TOTAL STUDY TIME</span>
              <span className="text-xl font-mono font-black text-white mt-1 block">{totalHours} hrs</span>
              <span className="text-[10px] text-slate-400">logged in offline timer</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400 uppercase">SUBJECT XP</span>
              <span className="text-xl font-mono font-black text-cyan-300 mt-1 block">
                {totalXpEarned.toLocaleString()} XP
              </span>
              <span className="text-[10px] text-slate-400">earned from quests</span>
            </div>
          </div>

          {/* Weakest Chapters List */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold font-display text-white">Weakest Chapters in {subject.name}</h3>
            {weakestChapters.length === 0 ? (
              <p className="text-xs text-emerald-400">🎉 Excellent! All chapters are well revised.</p>
            ) : (
              <div className="space-y-2">
                {weakestChapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-2.5 rounded-xl bg-slate-800/70 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 truncate">{ch.title}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase px-2 py-0.5 bg-amber-950/60 rounded">
                      {ch.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Fullscreen Offline PDF Viewer */}
      {activePdfModal && (
        <PDFViewerModal
          document={activePdfModal}
          onClose={() => setActivePdfModal(null)}
          onUpdate={loadSubjectData}
        />
      )}
    </div>
  );
};
