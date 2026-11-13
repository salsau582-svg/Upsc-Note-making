import React, { useMemo, useState } from 'react';
import { CornellNote, ExamRelevance, StandaloneComparison, TableData } from '../../types/note';
import { COMPARISON_TEMPLATES, createId } from '../../constants/upsc';
import { EditableTable } from '../Tables/EditableTable';
import { exportComparisonToPdf } from '../../utils/pdfExport';
import { formatDateShort } from '../../utils/noteHelpers';
import { Download, ExternalLink, Plus, Table2, Trash2 } from 'lucide-react';

interface ComparisonTablesViewProps {
  comparisons: StandaloneComparison[];
  notes: CornellNote[];
  allSubjects: string[];
  printBw: boolean;
  onSaveComparison: (cmp: StandaloneComparison) => Promise<void>;
  onDeleteComparison: (id: string) => Promise<void>;
  onOpenNote: (note: CornellNote) => void;
}

export const ComparisonTablesView: React.FC<ComparisonTablesViewProps> = ({
  comparisons,
  notes,
  allSubjects,
  printBw,
  onSaveComparison,
  onDeleteComparison,
  onOpenNote,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(comparisons[0]?.id ?? null);

  const activeComparison = useMemo(
    () => comparisons.find((c) => c.id === selectedId) ?? comparisons[0] ?? null,
    [comparisons, selectedId]
  );

  // Also collect comparison/data tables embedded inside Cornell Notes
  const embeddedTables = useMemo(() => {
    const items: { note: CornellNote; blockId: string; table: TableData }[] = [];
    notes
      .filter((n) => !n.isArchived)
      .forEach((note) => {
        [...note.cuesBlocks, ...note.notesBlocks, ...note.summaryBlocks].forEach((b) => {
          if (b.type === 'table' && b.table) {
            items.push({ note, blockId: b.id, table: b.table });
          }
        });
      });
    return items;
  }, [notes]);

  const createFromTemplate = async (templateKey?: string) => {
    const now = new Date().toISOString();
    const tpl = COMPARISON_TEMPLATES.find((t) => t.key === templateKey);
    const next: StandaloneComparison = tpl
      ? {
          id: createId('cmp'),
          title: tpl.title,
          subject: tpl.subject,
          relevance: tpl.relevance,
          templateKey: tpl.key,
          createdAt: now,
          updatedAt: now,
          table: JSON.parse(JSON.stringify(tpl.table)),
          notes: '',
        }
      : {
          id: createId('cmp'),
          title: 'Custom UPSC Comparison Table',
          subject: allSubjects[0] || 'Indian Polity',
          relevance: 'Both',
          createdAt: now,
          updatedAt: now,
          table: {
            caption: 'Custom Side-by-Side Comparison',
            hasHeader: true,
            isComparison: true,
            colWidths: [24, 38, 38],
            headers: ['Parameter / Basis', 'Concept / Entity A', 'Concept / Entity B'],
            rows: [
              ['Constitutional / Legal Basis', '', ''],
              ['Key Features', '', ''],
              ['Exceptions / Limitations', '', ''],
              ['UPSC Exam Relevance', '', ''],
            ],
          },
          notes: '',
        };

    await onSaveComparison(next);
    setSelectedId(next.id);
  };

  const updateActive = (patch: Partial<StandaloneComparison>) => {
    if (!activeComparison) return;
    onSaveComparison({
      ...activeComparison,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Comparison Tables</h1>
          <p className="text-xs text-slate-500 mt-1">
            Side-by-side UPSC comparators with ready-made templates, resizable columns, and A4 PDF export
          </p>
        </div>
        <button
          type="button"
          onClick={() => createFromTemplate()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          New Custom Comparison
        </button>
      </div>

      {/* 8 Ready-Made UPSC Comparison Templates */}
      <div className="bg-white border border-slate-200 rounded-md p-4">
        <div className="text-xs font-semibold text-slate-800 mb-2.5">
          One-Click UPSC Comparison Templates
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {COMPARISON_TEMPLATES.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              onClick={() => createFromTemplate(tpl.key)}
              className="text-left p-2.5 border border-slate-200 rounded hover:border-[#1E3A5F] hover:bg-[#EFF4FA]/40 transition-colors"
            >
              <div className="text-xs font-semibold text-slate-900 leading-snug">{tpl.title}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {tpl.subject} · {tpl.relevance}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Comparison Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Saved Standalone Comparisons List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-md overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-800">
            Standalone Comparison Sheets ({comparisons.length})
          </div>
          {comparisons.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Click any template above or "New Custom Comparison" to create your first comparison sheet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {comparisons.map((cmp) => (
                <div
                  key={cmp.id}
                  onClick={() => setSelectedId(cmp.id)}
                  className={`px-4 py-3 cursor-pointer flex items-start justify-between gap-2 ${
                    activeComparison?.id === cmp.id ? 'bg-[#EFF4FA]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">{cmp.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {cmp.subject} · {cmp.relevance} · {formatDateShort(cmp.updatedAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteComparison(cmp.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 shrink-0"
                    title="Delete comparison table"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison Table Editor */}
        <div className="lg:col-span-8">
          {!activeComparison ? (
            <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
              <Table2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-900">Select or create a comparison table</div>
              <p className="text-xs text-slate-500 mt-1">
                Edit rows, columns, column widths, and export cleanly to A4 PDF.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={activeComparison.title}
                    onChange={(e) => updateActive({ title: e.target.value })}
                    className="w-full text-lg font-bold text-slate-900 focus:outline-none border-b border-transparent focus:border-slate-300"
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <select
                      value={activeComparison.subject}
                      onChange={(e) => updateActive({ subject: e.target.value })}
                      className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                    >
                      {allSubjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <select
                      value={activeComparison.relevance}
                      onChange={(e) =>
                        updateActive({ relevance: e.target.value as ExamRelevance })
                      }
                      className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                    >
                      <option value="Prelims">Prelims</option>
                      <option value="Mains">Mains</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    exportComparisonToPdf(
                      activeComparison.title,
                      activeComparison.subject,
                      activeComparison.table,
                      printBw
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download A4 PDF
                </button>
              </div>

              <EditableTable
                table={activeComparison.table}
                onChange={(table) => updateActive({ table })}
              />

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Exam Takeaway / Prelims Trap Notes
                </label>
                <textarea
                  rows={2}
                  value={activeComparison.notes ?? ''}
                  onChange={(e) => updateActive({ notes: e.target.value })}
                  placeholder="Add summary remarks or common UPSC statement traps..."
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A5F]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tables Embedded Inside Notes */}
      {embeddedTables.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-800">
            Tables Inside Your Cornell Notes ({embeddedTables.length})
          </div>
          <div className="divide-y divide-slate-100">
            {embeddedTables.map(({ note, blockId, table }) => (
              <div key={`${note.id}-${blockId}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {table.caption || table.headers.join(' vs ')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Inside note: {note.title || 'Untitled Note'} · {note.subject} ·{' '}
                    <span className="font-mono-tabular">{table.rows.length} rows</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      exportComparisonToPdf(
                        table.caption || note.title || 'Comparison Table',
                        note.subject,
                        table,
                        printBw
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenNote(note)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1E3A5F] bg-[#EFF4FA] border border-slate-200 rounded hover:bg-slate-100"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Note
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
