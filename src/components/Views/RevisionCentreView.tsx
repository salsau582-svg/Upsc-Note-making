import React, { useMemo, useState } from 'react';
import { CornellNote } from '../../types/note';
import {
  extractNoteMarkers,
  formatDateShort,
  formatDateTime,
  isNotRevisedRecently,
  isRevisionDue,
} from '../../utils/noteHelpers';
import { exportConsolidatedRevisionPdf } from '../../utils/pdfExport';
import { Calendar, Check, Clock, Download, Flag, History, X } from 'lucide-react';

interface RevisionCentreViewProps {
  notes: CornellNote[];
  printBw: boolean;
  onOpenNote: (note: CornellNote) => void;
  onMarkRevised: (note: CornellNote, intervalDays: number | null, customDateIso?: string, noteText?: string) => void;
  onScheduleNext: (note: CornellNote, intervalDays: number | null, customDateIso?: string) => void;
  onToggleDifficult: (note: CornellNote) => void;
}

type RevisionTab = 'due' | 'upcoming' | 'stale' | 'difficult' | 'marked' | 'all';

const INTERVALS = [1, 3, 7, 15, 30];

export const RevisionCentreView: React.FC<RevisionCentreViewProps> = ({
  notes,
  printBw,
  onOpenNote,
  onMarkRevised,
  onScheduleNext,
  onToggleDifficult,
}) => {
  const [tab, setTab] = useState<RevisionTab>('due');
  const [selectedIntervals, setSelectedIntervals] = useState<Record<string, number>>({});
  const [customDates, setCustomDates] = useState<Record<string, string>>({});
  const [historyModalNote, setHistoryModalNote] = useState<CornellNote | null>(null);
  const [revisionRemark, setRevisionRemark] = useState<Record<string, string>>({});

  const activeNotes = useMemo(() => notes.filter((n) => !n.isArchived), [notes]);

  const counts = useMemo(() => {
    const due = activeNotes.filter((n) => isRevisionDue(n));
    const upcoming = activeNotes.filter((n) => n.revision.nextRevisionAt && !isRevisionDue(n));
    const stale = activeNotes.filter((n) => isNotRevisedRecently(n, 14));
    const difficult = activeNotes.filter((n) => n.isDifficult);
    const marked = activeNotes.filter((n) => extractNoteMarkers(n).includes('revision-required'));
    return { due, upcoming, stale, difficult, marked, all: activeNotes };
  }, [activeNotes]);

  const displayedNotes = counts[tab];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Revision Centre</h1>
          <p className="text-xs text-slate-500 mt-1">
            Spaced-repetition scheduler (1, 3, 7, 15, 30 days or custom date) and quick revision sheets
          </p>
        </div>

        <button
          type="button"
          disabled={displayedNotes.length === 0}
          onClick={() =>
            exportConsolidatedRevisionPdf(
              displayedNotes,
              `UPSC Revision Sheet — ${tab.toUpperCase()}`,
              printBw
            )
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] disabled:opacity-40 rounded-md whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Download Revision Sheet PDF ({displayedNotes.length})
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-md">
        {[
          { id: 'due' as RevisionTab, label: 'Due Today / Overdue', count: counts.due.length },
          { id: 'upcoming' as RevisionTab, label: 'Scheduled Upcoming', count: counts.upcoming.length },
          { id: 'stale' as RevisionTab, label: 'Not Revised >14 Days', count: counts.stale.length },
          { id: 'difficult' as RevisionTab, label: 'Difficult Topics', count: counts.difficult.length },
          { id: 'marked' as RevisionTab, label: 'Revision Marker', count: counts.marked.length },
          { id: 'all' as RevisionTab, label: 'All Active Notes', count: counts.all.length },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-[#1E3A5F] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {t.label} <span className="font-mono-tabular opacity-80 ml-1">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Revision Queue List */}
      {displayedNotes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No notes in this revision queue</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Switch to "All Active Notes" to schedule spaced-repetition intervals on your study notes.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-200">
          {displayedNotes.map((note) => {
            const chosenInterval = selectedIntervals[note.id] ?? note.revision.intervalDays ?? 3;
            const customDate = customDates[note.id] ?? '';
            const due = isRevisionDue(note);

            return (
              <div key={note.id} className="p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenNote(note)}
                        className="text-sm font-semibold text-slate-900 hover:text-[#1E3A5F] hover:underline text-left"
                      >
                        {note.title || 'Untitled Note'}
                      </button>
                      {due && (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          Due Now
                        </span>
                      )}
                      {note.isDifficult && (
                        <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                          Difficult Topic
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-2">
                      <span className="font-medium text-slate-700">{note.subject}</span>
                      <span>·</span>
                      <span>{note.relevance}</span>
                      <span>·</span>
                      <span>
                        Last revised:{' '}
                        <span className="font-mono-tabular text-slate-700">
                          {formatDateShort(note.revision.lastRevisedAt)}
                        </span>
                      </span>
                      <span>·</span>
                      <span>
                        Next due:{' '}
                        <span className="font-mono-tabular text-slate-700">
                          {formatDateShort(note.revision.nextRevisionAt)}
                        </span>
                      </span>
                      <span>·</span>
                      <span className="font-mono-tabular">Total revisions: {note.revision.count}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleDifficult(note)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border ${
                        note.isDifficult
                          ? 'bg-purple-50 border-purple-200 text-purple-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {note.isDifficult ? 'Difficult' : 'Mark Difficult'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistoryModalNote(note)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-50"
                    >
                      <History className="w-3.5 h-3.5" />
                      History ({note.revision.history.length})
                    </button>
                  </div>
                </div>

                {/* Interval & Mark Revised Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">
                      Next interval:
                    </span>
                    {INTERVALS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setSelectedIntervals((prev) => ({ ...prev, [note.id]: days }));
                          setCustomDates((prev) => ({ ...prev, [note.id]: '' }));
                          onScheduleNext(note, days);
                        }}
                        className={`px-2 py-1 text-[11px] font-medium rounded border font-mono-tabular ${
                          chosenInterval === days && !customDate
                            ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                    <div className="inline-flex items-center gap-1 ml-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomDates((prev) => ({ ...prev, [note.id]: val }));
                          if (val) {
                            onScheduleNext(note, null, new Date(`${val}T09:00:00`).toISOString());
                          }
                        }}
                        className="border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-[#1E3A5F]"
                        title="Custom revision date"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={revisionRemark[note.id] ?? ''}
                      onChange={(e) =>
                        setRevisionRemark((prev) => ({ ...prev, [note.id]: e.target.value }))
                      }
                      placeholder="Optional revision note..."
                      className="border border-slate-200 rounded px-2.5 py-1 text-xs w-48 focus:outline-none focus:border-[#1E3A5F]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onMarkRevised(
                          note,
                          customDate ? null : chosenInterval,
                          customDate ? new Date(`${customDate}T09:00:00`).toISOString() : undefined,
                          revisionRemark[note.id]
                        );
                        setRevisionRemark((prev) => ({ ...prev, [note.id]: '' }));
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark as Revised
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revision History Modal */}
      {historyModalNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setHistoryModalNote(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-lg max-w-lg w-full shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Revision History</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                  {historyModalNote.title || 'Untitled Note'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalNote(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 max-h-80 overflow-y-auto">
              {historyModalNote.revision.history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No revision sessions logged for this note yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {[...historyModalNote.revision.history].reverse().map((h, idx) => (
                    <div
                      key={h.id}
                      className="border border-slate-200 rounded p-3 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          Session #{historyModalNote.revision.history.length - idx}
                        </div>
                        {h.note && <div className="text-slate-600 mt-1">{h.note}</div>}
                      </div>
                      <div className="text-right text-[11px] text-slate-500 shrink-0 font-mono-tabular">
                        <div>{formatDateTime(h.date)}</div>
                        {h.intervalDays && <div>Next: +{h.intervalDays}d</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
