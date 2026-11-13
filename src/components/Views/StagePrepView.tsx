import React, { useMemo, useState } from 'react';
import { CornellNote, ImportanceMarkerId } from '../../types/note';
import { NOTE_TEMPLATES } from '../../constants/upsc';
import { stripHtml } from '../../utils/noteHelpers';
import { exportConsolidatedRevisionPdf } from '../../utils/pdfExport';
import { NoteListTable } from '../Common/NoteListTable';
import { ImportanceBadge } from '../Common/ImportanceBadge';
import { Download, FilePlus2, Search } from 'lucide-react';

interface StagePrepViewProps {
  stage: 'prelims' | 'mains';
  notes: CornellNote[];
  allSubjects: string[];
  printBw: boolean;
  onCreateWithTemplate: (templateId: string, subject?: string) => void;
  onOpenNote: (note: CornellNote) => void;
  onToggleBookmark: (note: CornellNote) => void;
  onDuplicateNote: (note: CornellNote) => void;
  onPrintNote: (note: CornellNote) => void;
  onArchiveToggle: (note: CornellNote) => void;
  onDeleteRequest: (note: CornellNote) => void;
}

const PRELIMS_TOPICS = [
  'Articles & Amendments',
  'Dates & Chronology',
  'Reports & Indices',
  'Organisations & HQ',
  'Government Schemes',
  'Places in News',
  'Species & Protected Areas',
  'Personalities & PYQs',
];

export const StagePrepView: React.FC<StagePrepViewProps> = ({
  stage,
  notes,
  allSubjects,
  printBw,
  onCreateWithTemplate,
  onOpenNote,
  onToggleBookmark,
  onDuplicateNote,
  onPrintNote,
  onArchiveToggle,
  onDeleteRequest,
}) => {
  const [subTab, setSubTab] = useState<'notes' | 'extractor'>('notes');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [query, setQuery] = useState('');

  const stageNotes = useMemo(() => {
    const targetRelevance = stage === 'prelims' ? 'Prelims' : 'Mains';
    return notes
      .filter((n) => !n.isArchived && (n.relevance === targetRelevance || n.relevance === 'Both'))
      .filter((n) => (subjectFilter === 'all' ? true : n.subject === subjectFilter))
      .filter((n) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q) ||
          n.topic.toLowerCase().includes(q)
        );
      });
  }, [notes, stage, subjectFilter, query]);

  const extractedBlocks = useMemo(() => {
    const targetMarkers: ImportanceMarkerId[] =
      stage === 'prelims'
        ? ['prelims-fact', 'very-important']
        : ['mains-value', 'very-important'];

    const results: {
      note: CornellNote;
      blockId: string;
      text: string;
      marker?: ImportanceMarkerId | null;
      label?: string;
    }[] = [];

    stageNotes.forEach((note) => {
      note.notesBlocks.forEach((b) => {
        const hasTargetMarker = b.marker && targetMarkers.includes(b.marker);
        const hasInlineMarker = targetMarkers.some((m) => b.content.includes(`data-marker="${m}"`));
        const isFact = stage === 'prelims' && b.type === 'fact';
        const isQuote = stage === 'mains' && b.type === 'quote';

        if (hasTargetMarker || hasInlineMarker || isFact || isQuote) {
          const text = [stripHtml(b.secondaryContent ?? ''), stripHtml(b.content)]
            .filter(Boolean)
            .join(' — ');
          if (text) {
            results.push({
              note,
              blockId: b.id,
              text,
              marker: b.marker ?? (isFact ? 'prelims-fact' : isQuote ? 'mains-value' : null),
              label: b.type === 'fact' ? 'Fact' : b.type === 'quote' ? 'Quote' : undefined,
            });
          }
        }
      });
    });

    return results;
  }, [stageNotes, stage]);

  const mainsTemplates = NOTE_TEMPLATES.filter((t) => t.category === 'Mains');

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {stage === 'prelims' ? 'Prelims Preparation' : 'Mains Preparation'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {stage === 'prelims'
              ? 'Factual accuracy, articles, chronology, schemes, protected areas, and rapid fact extraction'
              : 'GS Paper 1–4, Essay, Optional frameworks, committees, SC judgments, and value-addition points'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={stageNotes.length === 0}
            onClick={() =>
              exportConsolidatedRevisionPdf(
                stageNotes,
                stage === 'prelims'
                  ? 'UPSC Prelims Rapid Revision Sheet'
                  : 'UPSC Mains Value Addition Sheet',
                printBw
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-md whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export {stage === 'prelims' ? 'Prelims' : 'Mains'} PDF
          </button>

          <button
            type="button"
            onClick={() =>
              onCreateWithTemplate(stage === 'prelims' ? 'prelims-mode' : 'mains-mode')
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md whitespace-nowrap"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            {stage === 'prelims' ? 'New Prelims Fact Note' : 'New Mains Issue Note'}
          </button>
        </div>
      </div>

      {/* Stage Templates / Quick Structure Strip */}
      {stage === 'prelims' ? (
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-semibold text-slate-800">
              Prelims Mode Coverage Areas
            </span>
            <span className="text-[11px] text-slate-500">
              Included automatically in the Prelims Mode Sheet template
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRELIMS_TOPICS.map((item) => (
              <div
                key={item}
                className="px-3 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-800 mb-2.5">
            One-Click Mains & Paper Templates
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {mainsTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onCreateWithTemplate(tpl.id, tpl.defaultSubject)}
                className="text-left p-3 border border-slate-200 rounded hover:border-[#1E3A5F] hover:bg-[#EFF4FA]/40 transition-colors"
              >
                <div className="text-xs font-semibold text-[#1E3A5F]">{tpl.label}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {tpl.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-navigation & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-md">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md self-start">
          <button
            type="button"
            onClick={() => setSubTab('notes')}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
              subTab === 'notes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {stage === 'prelims' ? 'Prelims Notes' : 'Mains Notes'} ({stageNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('extractor')}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
              subTab === 'extractor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {stage === 'prelims' ? 'Prelims Fact Extractor' : 'Mains Value Addition Feed'} (
            {extractedBlocks.length})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter notes..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#1E3A5F]"
            />
          </div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white"
          >
            <option value="all">All Subjects</option>
            {allSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {subTab === 'notes' ? (
        <NoteListTable
          notes={stageNotes}
          emptyTitle={`No ${stage === 'prelims' ? 'Prelims' : 'Mains'} notes yet`}
          emptyDescription={`Create a note tagged for ${
            stage === 'prelims' ? 'Prelims or Both' : 'Mains or Both'
          } using the button above.`}
          emptyActionLabel={
            stage === 'prelims' ? 'Create Prelims Fact Note' : 'Create Mains Issue Note'
          }
          onEmptyAction={() =>
            onCreateWithTemplate(stage === 'prelims' ? 'prelims-mode' : 'mains-mode')
          }
          onOpenNote={onOpenNote}
          onToggleBookmark={onToggleBookmark}
          onDuplicateNote={onDuplicateNote}
          onPrintNote={onPrintNote}
          onArchiveToggle={onArchiveToggle}
          onDeleteRequest={onDeleteRequest}
        />
      ) : extractedBlocks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
          <h3 className="text-sm font-semibold text-slate-900">
            No highlighted {stage === 'prelims' ? 'Prelims facts' : 'Mains value-addition points'} found yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Inside any note, mark blocks or text with{' '}
            <strong>
              {stage === 'prelims' ? 'Prelims Fact / Very Important' : 'Mains Value Addition / Very Important'}
            </strong>{' '}
            to aggregate them here automatically for last-minute revision.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-200">
          {extractedBlocks.map((item) => (
            <div
              key={`${item.note.id}-${item.blockId}`}
              onClick={() => onOpenNote(item.note)}
              className="p-4 hover:bg-slate-50 cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {item.marker && <ImportanceBadge markerId={item.marker} compact />}
                  <span className="text-xs font-semibold text-[#1E3A5F]">
                    {item.note.title || 'Untitled Note'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">{item.note.subject}</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
