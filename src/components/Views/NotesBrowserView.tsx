import React, { useMemo, useState } from 'react';
import { CornellNote, ExamRelevance, ImportanceMarkerId } from '../../types/note';
import { IMPORTANCE_MARKERS } from '../../constants/upsc';
import { extractNoteMarkers, noteMatchesQuery } from '../../utils/noteHelpers';
import { NoteListTable } from '../Common/NoteListTable';
import { Plus, Search, X } from 'lucide-react';

interface NotesBrowserViewProps {
  mode: 'all' | 'bookmarks' | 'archive';
  notes: CornellNote[];
  allSubjects: string[];
  onCreateNote: () => void;
  onOpenNote: (note: CornellNote) => void;
  onToggleBookmark: (note: CornellNote) => void;
  onDuplicateNote: (note: CornellNote) => void;
  onPrintNote: (note: CornellNote) => void;
  onArchiveToggle: (note: CornellNote) => void;
  onDeleteRequest: (note: CornellNote) => void;
}

export const NotesBrowserView: React.FC<NotesBrowserViewProps> = ({
  mode,
  notes,
  allSubjects,
  onCreateNote,
  onOpenNote,
  onToggleBookmark,
  onDuplicateNote,
  onPrintNote,
  onArchiveToggle,
  onDeleteRequest,
}) => {
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [relevanceFilter, setRelevanceFilter] = useState<'all' | ExamRelevance>('all');
  const [markerFilter, setMarkerFilter] = useState<'all' | ImportanceMarkerId>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated-desc' | 'created-desc' | 'title-asc'>('updated-desc');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (mode === 'archive') return n.isArchived;
        if (n.isArchived) return false;
        if (mode === 'bookmarks' && !n.isBookmarked) return false;
        return true;
      })
      .filter((n) => (subjectFilter === 'all' ? true : n.subject === subjectFilter))
      .filter((n) => (relevanceFilter === 'all' ? true : n.relevance === relevanceFilter))
      .filter((n) => (tagFilter === 'all' ? true : n.tags.includes(tagFilter)))
      .filter((n) => {
        if (markerFilter === 'all') return true;
        return extractNoteMarkers(n).includes(markerFilter);
      })
      .filter((n) => noteMatchesQuery(n, query))
      .sort((a, b) => {
        if (sortBy === 'title-asc') {
          return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
        }
        if (sortBy === 'created-desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, mode, subjectFilter, relevanceFilter, tagFilter, markerFilter, query, sortBy]);

  const title =
    mode === 'bookmarks' ? 'Bookmarked Notes' : mode === 'archive' ? 'Archived Notes' : 'My Notes';
  const subtitle =
    mode === 'bookmarks'
      ? 'High-yield notes starred for rapid revision'
      : mode === 'archive'
        ? 'Archived notes preserved safely — restore anytime or delete permanently'
        : 'Search across titles, subjects, topics, tags, cues, tables, and summaries';

  const hasActiveFilters =
    query.trim() !== '' ||
    subjectFilter !== 'all' ||
    relevanceFilter !== 'all' ||
    markerFilter !== 'all' ||
    tagFilter !== 'all';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        {mode !== 'archive' && (
          <button
            type="button"
            onClick={onCreateNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            New Cornell Note
          </button>
        )}
      </div>

      {/* Search & Multi-Facet Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, subject, topic, tags, or note content..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#1E3A5F]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md shrink-0">
            {(['all', 'Prelims', 'Mains', 'Both'] as const).map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => setRelevanceFilter(rel)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  relevanceFilter === rel
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rel === 'all' ? 'All Stages' : rel}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#1E3A5F]"
          >
            <option value="all">All Subjects</option>
            {allSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={markerFilter}
            onChange={(e) => setMarkerFilter(e.target.value as 'all' | ImportanceMarkerId)}
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#1E3A5F]"
          >
            <option value="all">All Importance Colours</option>
            {IMPORTANCE_MARKERS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#1E3A5F]"
          >
            <option value="all">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'updated-desc' | 'created-desc' | 'title-asc')
            }
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#1E3A5F]"
          >
            <option value="updated-desc">Sort: Last Modified</option>
            <option value="created-desc">Sort: Date Created</option>
            <option value="title-asc">Sort: Title (A–Z)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-mono-tabular">
            Showing {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSubjectFilter('all');
                setRelevanceFilter('all');
                setMarkerFilter('all');
                setTagFilter('all');
              }}
              className="text-[#1E3A5F] font-medium hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      <NoteListTable
        notes={filteredNotes}
        emptyTitle={
          hasActiveFilters
            ? 'No notes match your search or filters'
            : mode === 'bookmarks'
              ? 'No bookmarked notes yet'
              : mode === 'archive'
                ? 'Archive is empty'
                : 'No notes created yet'
        }
        emptyDescription={
          hasActiveFilters
            ? 'Try clearing a filter or searching with broader keywords.'
            : mode === 'bookmarks'
              ? 'Click the bookmark icon on any note to keep it pinned here.'
              : mode === 'archive'
                ? 'Archived notes will appear here so your main workspace stays clean.'
                : 'Start building your UPSC study notebook using the Cornell structure.'
        }
        emptyActionLabel={!hasActiveFilters && mode === 'all' ? 'Create Your First Note' : undefined}
        onEmptyAction={!hasActiveFilters && mode === 'all' ? onCreateNote : undefined}
        onOpenNote={onOpenNote}
        onToggleBookmark={onToggleBookmark}
        onDuplicateNote={onDuplicateNote}
        onPrintNote={onPrintNote}
        onArchiveToggle={onArchiveToggle}
        onDeleteRequest={onDeleteRequest}
      />
    </div>
  );
};
