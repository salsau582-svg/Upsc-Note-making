import React from 'react';
import { CornellNote, ImportanceMarkerId } from '../../types/note';
import { extractNoteMarkers, formatDateShort, isRevisionDue } from '../../utils/noteHelpers';
import { ImportanceBadge } from './ImportanceBadge';
import {
  Archive,
  ArchiveRestore,
  Bookmark,
  Copy,
  FileText,
  Printer,
  Trash2,
} from 'lucide-react';

interface NoteListTableProps {
  notes: CornellNote[];
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onOpenNote: (note: CornellNote) => void;
  onToggleBookmark: (note: CornellNote) => void;
  onDuplicateNote: (note: CornellNote) => void;
  onPrintNote: (note: CornellNote) => void;
  onArchiveToggle: (note: CornellNote) => void;
  onDeleteRequest: (note: CornellNote) => void;
}

export const NoteListTable: React.FC<NoteListTableProps> = ({
  notes,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onOpenNote,
  onToggleBookmark,
  onDuplicateNote,
  onPrintNote,
  onArchiveToggle,
  onDeleteRequest,
}) => {
  if (notes.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-900">{emptyTitle}</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          {emptyDescription}
        </p>
        {emptyActionLabel && onEmptyAction && (
          <button
            type="button"
            onClick={onEmptyAction}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      <div className="divide-y divide-slate-200">
        {notes.map((note) => {
          const markers: ImportanceMarkerId[] = extractNoteMarkers(note);
          const due = isRevisionDue(note);

          return (
            <div
              key={note.id}
              onClick={() => onOpenNote(note)}
              className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-900 truncate max-w-2xl">
                    {note.title || 'Untitled Note'}
                  </h3>
                  {due && (
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      Revision Due
                    </span>
                  )}
                  {note.isDifficult && (
                    <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                      Difficult
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{note.subject}</span>
                  <span aria-hidden="true">·</span>
                  <span>{note.relevance}</span>
                  {note.topic && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{note.topic}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">Updated {formatDateShort(note.updatedAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{note.wordCount} words</span>
                  {note.tags.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500">
                        {note.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                      </span>
                    </>
                  )}
                </div>

                {markers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {markers.map((mId) => (
                      <ImportanceBadge key={mId} markerId={mId} compact />
                    ))}
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onToggleBookmark(note)}
                  className={`p-2 rounded border ${
                    note.isBookmarked
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                  title={note.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  aria-label="Toggle bookmark"
                >
                  <Bookmark className="w-3.5 h-3.5" fill={note.isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={() => onPrintNote(note)}
                  className="p-2 rounded border border-slate-200 bg-white text-slate-600 hover:text-[#1E3A5F] hover:bg-slate-50"
                  title="Print / Export PDF"
                  aria-label="Print or export PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateNote(note)}
                  className="p-2 rounded border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  title="Duplicate note"
                  aria-label="Duplicate note"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onArchiveToggle(note)}
                  className="p-2 rounded border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  title={note.isArchived ? 'Restore note' : 'Archive note'}
                  aria-label={note.isArchived ? 'Restore note' : 'Archive note'}
                >
                  {note.isArchived ? (
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRequest(note)}
                  className="p-2 rounded border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200"
                  title="Delete note"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
