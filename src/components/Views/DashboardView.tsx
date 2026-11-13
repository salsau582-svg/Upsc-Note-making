import React from 'react';
import { CornellNote, NavSection } from '../../types/note';
import { formatDateShort, isRevisionDue } from '../../utils/noteHelpers';
import {
  BookOpen,
  Bookmark,
  Check,
  Clock,
  FilePlus2,
  FileText,
  Layers,
  Search,
  Table2,
} from 'lucide-react';

interface DashboardViewProps {
  notes: CornellNote[];
  comparisonCount: number;
  onNavigate: (section: NavSection) => void;
  onCreateNote: (templateId?: string) => void;
  onOpenNote: (note: CornellNote) => void;
  onSelectSubject: (subject: string) => void;
  onQuickRevise: (note: CornellNote, intervalDays: number) => void;
  onLoadSampleNotes: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  notes,
  comparisonCount,
  onNavigate,
  onCreateNote,
  onOpenNote,
  onSelectSubject,
  onQuickRevise,
  onLoadSampleNotes,
}) => {
  const activeNotes = notes.filter((n) => !n.isArchived);
  const prelimsNotes = activeNotes.filter((n) => n.relevance === 'Prelims' || n.relevance === 'Both');
  const mainsNotes = activeNotes.filter((n) => n.relevance === 'Mains' || n.relevance === 'Both');
  const dueNotes = activeNotes.filter((n) => isRevisionDue(n));
  const bookmarkedNotes = activeNotes.filter((n) => n.isBookmarked);

  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const revisedThisWeek = activeNotes.filter(
    (n) => n.revision.lastRevisedAt && new Date(n.revision.lastRevisedAt).getTime() >= sevenDaysAgo
  );

  // Subject breakdown
  const subjectCounts = activeNotes.reduce<Record<string, number>>((acc, n) => {
    acc[n.subject] = (acc[n.subject] || 0) + 1;
    return acc;
  }, {});
  const sortedSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);

  const recentNotes = [...activeNotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daily UPSC Civil Services Cornell workspace · Persistent local storage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onCreateNote('blank')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md whitespace-nowrap"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            New Cornell Note
          </button>
          <button
            type="button"
            onClick={() => onNavigate('comparisons')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap"
          >
            <Table2 className="w-3.5 h-3.5" />
            Comparison Table ({comparisonCount})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('revision')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" />
            Revision Centre
          </button>
          <button
            type="button"
            onClick={() => onNavigate('notes')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            Search Notes
          </button>
        </div>
      </div>

      {/* Empty Starter Onboarding when 0 notes exist */}
      {activeNotes.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-md p-6">
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold text-slate-900">
              Start Your UPSC Cornell Notebook
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Your notes are saved automatically in your browser’s IndexedDB database and never leave your device. Create your first structured note or load two sample UPSC reference notes (Polity & Economy) to explore highlighting, comparison tables, spaced revision, and A4 PDF export.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => onCreateNote('blank')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                Create Blank Cornell Note
              </button>
              <button
                type="button"
                onClick={() => onCreateNote('prelims-mode')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md"
              >
                New Prelims Fact Sheet
              </button>
              <button
                type="button"
                onClick={() => onCreateNote('mains-mode')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md"
              >
                New Mains Issue Note
              </button>
              <button
                type="button"
                onClick={onLoadSampleNotes}
                className="px-3.5 py-2 text-xs font-medium text-[#1E3A5F] bg-[#EFF4FA] border border-slate-200 hover:bg-slate-100 rounded-md"
              >
                Load 2 Sample UPSC Reference Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Notes', value: activeNotes.length, icon: FileText, onClick: () => onNavigate('notes') },
          { label: 'Prelims Notes', value: prelimsNotes.length, icon: Layers, onClick: () => onNavigate('prelims') },
          { label: 'Mains Notes', value: mainsNotes.length, icon: BookOpen, onClick: () => onNavigate('mains') },
          { label: 'Due for Revision', value: dueNotes.length, icon: Clock, onClick: () => onNavigate('revision'), highlight: dueNotes.length > 0 },
          { label: 'Bookmarked', value: bookmarkedNotes.length, icon: Bookmark, onClick: () => onNavigate('bookmarks') },
          { label: 'Revised (7d)', value: revisedThisWeek.length, icon: Check, onClick: () => onNavigate('revision') },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              type="button"
              onClick={stat.onClick}
              className={`text-left bg-white border rounded-md p-4 hover:border-slate-300 transition-colors ${
                stat.highlight ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">{stat.label}</span>
                <Icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono-tabular">
                {stat.value}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upcoming Revisions */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Upcoming & Due Revisions</h2>
              <p className="text-[11px] text-slate-500">
                Scheduled spaced-repetition queue across subjects
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('revision')}
              className="text-xs font-medium text-[#1E3A5F] hover:underline"
            >
              Open Revision Centre
            </button>
          </div>
          {dueNotes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No revisions due today. Schedule revision intervals inside the Revision Centre or while editing notes.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dueNotes.slice(0, 6).map((note) => (
                <div
                  key={note.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div
                    onClick={() => onOpenNote(note)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {note.title || 'Untitled Note'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {note.subject} · Due {formatDateShort(note.revision.nextRevisionAt)} · Revised{' '}
                      <span className="font-mono-tabular">{note.revision.count}</span>x
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuickRevise(note, note.revision.intervalDays || 3)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 whitespace-nowrap"
                  >
                    <Check className="w-3 h-3" /> Mark Revised
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject-wise Distribution */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Subject-Wise Notes</h2>
              <p className="text-[11px] text-slate-500">Click a subject to browse its notes</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="text-xs font-medium text-[#1E3A5F] hover:underline"
            >
              Subject Library
            </button>
          </div>
          {sortedSubjects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Subject counts will appear here as you create notes.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {sortedSubjects.map(([subject, count]) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => onSelectSubject(subject)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-medium text-slate-800">{subject}</span>
                  <span className="text-xs font-mono-tabular font-semibold text-slate-600">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recently Edited & Bookmarked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recently Edited Notes</h2>
            <button
              type="button"
              onClick={() => onNavigate('notes')}
              className="text-xs font-medium text-[#1E3A5F] hover:underline"
            >
              View All
            </button>
          </div>
          {recentNotes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No notes yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentNotes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onOpenNote(n)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {n.title || 'Untitled Note'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {n.subject} · {n.relevance} · {formatDateShort(n.updatedAt)}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-tabular text-slate-400 shrink-0">
                    {n.wordCount}w
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Bookmarked Notes</h2>
            <button
              type="button"
              onClick={() => onNavigate('bookmarks')}
              className="text-xs font-medium text-[#1E3A5F] hover:underline"
            >
              All Bookmarks
            </button>
          </div>
          {bookmarkedNotes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Star or bookmark high-yield notes for quick access here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookmarkedNotes.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onOpenNote(n)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {n.title || 'Untitled Note'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {n.subject} · {n.relevance}
                    </div>
                  </div>
                  <Bookmark className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="currentColor" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
