import React, { useState } from 'react';
import { Subject, Chapter } from '../types';
import { SubjectDetailView } from './SubjectDetailView';
import { BookOpen, Edit2, Plus, ArrowRight, Clock, Award } from 'lucide-react';
import { db } from '../db/database';
import { sound } from '../utils/sound';

interface SubjectsViewProps {
  subjects: Subject[];
  onUpdateSubjectsList: () => void;
  selectedSubjectId?: string | null;
  onClearSelectedSubject?: () => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  onUpdateSubjectsList,
  selectedSubjectId,
  onClearSelectedSubject,
}) => {
  const [activeSubject, setActiveSubject] = useState<Subject | null>(() => {
    if (selectedSubjectId) {
      return subjects.find((s) => s.id === selectedSubjectId) || null;
    }
    return null;
  });

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editEmoji, setEditEmoji] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('');
  const [editHours, setEditHours] = useState<number>(5);

  // If a subject is active, show the 4-tab detail view
  if (activeSubject) {
    return (
      <SubjectDetailView
        subject={activeSubject}
        onBack={() => {
          setActiveSubject(null);
          if (onClearSelectedSubject) onClearSelectedSubject();
        }}
        onUpdateSubject={async (updated) => {
          await db.subjects.update(activeSubject.id, updated);
          setActiveSubject((prev) => (prev ? { ...prev, ...updated } : null));
          onUpdateSubjectsList();
        }}
      />
    );
  }

  const openEditModal = (s: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setEditingSubject(s);
    setEditName(s.name);
    setEditEmoji(s.emoji);
    setEditColor(s.color);
    setEditHours(s.weeklyTargetHours);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    sound.playClick();

    const updated = {
      ...editingSubject,
      name: editName.trim() || editingSubject.name,
      emoji: editEmoji.trim() || editingSubject.emoji,
      color: editColor,
      weeklyTargetHours: editHours,
    };

    await db.subjects.put(updated);
    onUpdateSubjectsList();
    setEditingSubject(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-display text-white">
            CBSE Class 10 Subjects
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            6 Core subjects · Syllabus chapters, PDF notes, and PYQs
          </p>
        </div>
      </div>

      {/* Grid of 6 Subjects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {subjects.map((subj) => {
          return (
            <div
              key={subj.id}
              onClick={() => {
                sound.playClick();
                setActiveSubject(subj);
              }}
              className="group p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer relative overflow-hidden shadow-lg flex flex-col justify-between"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: subj.color,
              }}
            >
              {/* Background radial accent */}
              <div
                className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-10 group-hover:opacity-20 transition"
                style={{ backgroundColor: subj.color }}
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/5"
                    style={{ backgroundColor: `${subj.color}20` }}
                  >
                    {subj.emoji}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition">
                      {subj.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Code: {subj.code}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => openEditModal(subj, e)}
                  className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700"
                  title="Edit subject settings"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {subj.weeklyTargetHours}h / week
                </span>

                <span className="flex items-center gap-1 font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold font-display text-white mb-3">
              Edit Subject: {editingSubject.name}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Emoji / Icon</label>
                  <input
                    type="text"
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-center"
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Weekly Target</label>
                  <input
                    type="number"
                    value={editHours}
                    onChange={(e) => setEditHours(Number(e.target.value))}
                    min={1}
                    max={25}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Theme Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-400">{editColor}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
