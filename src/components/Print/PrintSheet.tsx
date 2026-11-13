import React from 'react';
import { CornellNote, NoteBlock, PrintOptions } from '../../types/note';
import { MARKER_MAP } from '../../constants/upsc';
import { formatDateShort, stripHtml } from '../../utils/noteHelpers';

interface PrintSheetProps {
  note: CornellNote;
  options: PrintOptions;
}

function getRevisionBlocks(blocks: NoteBlock[]): NoteBlock[] {
  const filtered = blocks.filter(
    (b) =>
      b.marker !== null && b.marker !== undefined ||
      b.type === 'fact' ||
      b.type === 'definition' ||
      b.type === 'table' ||
      (b.content && b.content.includes('data-marker='))
  );
  return filtered.length > 0 ? filtered : blocks;
}

const PrintBlockStack: React.FC<{ blocks: NoteBlock[]; bw: boolean }> = ({ blocks, bw }) => {
  let numCounter = 0;

  return (
    <div className="space-y-1.5">
      {blocks.map((block) => {
        if (block.type === 'numbered') {
          numCounter += 1;
        } else {
          numCounter = 0;
        }

        if (block.type === 'divider') {
          return <hr key={block.id} className="my-2 border-t border-slate-300" />;
        }

        if (block.type === 'table' && block.table) {
          const t = block.table;
          return (
            <div key={block.id} className="my-2 print-block">
              {t.caption && (
                <div className="text-[11px] font-semibold text-slate-800 mb-1">{t.caption}</div>
              )}
              <table className="w-full border-collapse table-fixed text-[11px]">
                <colgroup>
                  {(t.colWidths || []).map((w, i) => (
                    <col key={i} style={{ width: `${w}%` }} />
                  ))}
                </colgroup>
                {t.hasHeader && (
                  <thead>
                    <tr className={bw ? 'bg-slate-200 text-slate-900' : 'bg-[#1E3A5F] text-white'}>
                      {t.headers.map((h, i) => (
                        <th key={i} className="border border-slate-300 px-2 py-1 text-left font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {t.rows.map((r, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      {r.map((c, cIdx) => (
                        <td key={cIdx} className="border border-slate-300 px-2 py-1 align-top whitespace-pre-wrap">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const marker = block.marker ? MARKER_MAP[block.marker] : null;
        const indentPx = (block.indent ?? 0) * 14;
        const boxStyle: React.CSSProperties | undefined = marker
          ? {
              backgroundColor: bw ? '#ffffff' : marker.printBgHex,
              borderColor: bw ? '#475569' : marker.borderHex,
              borderWidth: '1px',
              borderStyle: 'solid',
              padding: '5px 8px',
              borderRadius: '4px',
            }
          : undefined;

        const markerLabel = marker ? (
          <div
            className="text-[9px] font-bold tracking-wider uppercase mb-0.5"
            style={{ color: bw ? '#111827' : marker.textHex }}
          >
            [{marker.shortLabel}]
          </div>
        ) : null;

        if (block.type === 'heading1') {
          return (
            <div key={block.id} style={boxStyle} className="print-heading pt-1.5">
              {markerLabel}
              <h2
                className="text-[14px] font-bold text-slate-900"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          );
        }
        if (block.type === 'heading2') {
          return (
            <div key={block.id} style={boxStyle} className="print-heading pt-1">
              {markerLabel}
              <h3
                className="text-[12.5px] font-bold text-[#1E3A5F]"
                style={bw ? { color: '#0f172a' } : undefined}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          );
        }
        if (block.type === 'heading3') {
          return (
            <div key={block.id} style={boxStyle} className="print-heading pt-0.5">
              {markerLabel}
              <h4
                className="text-[11.5px] font-semibold text-slate-800"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          );
        }

        if (block.type === 'definition') {
          return (
            <div
              key={block.id}
              className="print-block print-marker-box rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px]"
              style={boxStyle}
            >
              {markerLabel}
              <div className="font-semibold text-slate-900 mb-0.5">
                Definition: {block.secondaryContent || 'Key Term'}
              </div>
              <div dangerouslySetInnerHTML={{ __html: block.content }} />
            </div>
          );
        }

        if (block.type === 'fact') {
          return (
            <div
              key={block.id}
              className="print-block print-marker-box rounded border border-amber-300 bg-amber-50/60 px-2.5 py-1.5 text-[11px]"
              style={boxStyle}
            >
              {markerLabel}
              <div className="font-semibold text-slate-900 mb-0.5">
                Important Fact: {block.secondaryContent || 'Key Point'}
              </div>
              <div dangerouslySetInnerHTML={{ __html: block.content }} />
            </div>
          );
        }

        if (block.type === 'quote') {
          return (
            <div
              key={block.id}
              className="print-block print-marker-box rounded border border-slate-300 px-2.5 py-1.5 text-[11px] italic text-slate-800"
              style={boxStyle}
            >
              {markerLabel}
              <div dangerouslySetInnerHTML={{ __html: block.content }} />
              {block.secondaryContent && (
                <div className="not-italic text-[10px] text-slate-600 mt-0.5">
                  — {block.secondaryContent}
                </div>
              )}
            </div>
          );
        }

        if (block.type === 'expandable') {
          return (
            <div
              key={block.id}
              className="print-block print-marker-box rounded border border-slate-300 px-2.5 py-1.5 text-[11px]"
              style={boxStyle}
            >
              {markerLabel}
              <div className="font-semibold text-slate-900 mb-0.5">
                {block.secondaryContent || 'Additional Notes'}
              </div>
              <div dangerouslySetInnerHTML={{ __html: block.content }} />
            </div>
          );
        }

        if (block.type === 'bullet' || block.type === 'numbered' || block.type === 'checklist') {
          const symbol =
            block.type === 'numbered'
              ? `${numCounter}.`
              : block.type === 'checklist'
                ? block.checked
                  ? '☑'
                  : '☐'
                : block.indent === 1
                  ? '◦'
                  : block.indent === 2
                    ? '▪'
                    : '•';
          return (
            <div
              key={block.id}
              className="print-block print-marker-box text-[11.5px] leading-snug"
              style={{ marginLeft: `${indentPx}px`, ...boxStyle }}
            >
              {markerLabel}
              <div className="flex items-start gap-1.5">
                <span className="shrink-0 font-semibold text-slate-600">{symbol}</span>
                <div
                  className={`flex-1 ${block.type === 'checklist' && block.checked ? 'line-through text-slate-500' : ''}`}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              </div>
            </div>
          );
        }

        return (
          <div
            key={block.id}
            className="print-block print-marker-box text-[11.5px] leading-snug text-slate-800"
            style={boxStyle}
          >
            {markerLabel}
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );
      })}
    </div>
  );
};

export const PrintSheet: React.FC<PrintSheetProps> = ({ note, options }) => {
  const bw = options.blackAndWhite;
  const ratio = Math.min(42, Math.max(24, note.cuesRatio || 30));

  const tableBlocks = [...note.cuesBlocks, ...note.notesBlocks, ...note.summaryBlocks].filter(
    (b) => b.type === 'table' && b.table
  );

  return (
    <div className={`bg-white text-slate-900 font-academic-serif ${bw ? 'print-bw' : ''}`}>
      {/* Header */}
      <div className="border-b-2 border-[#1E3A5F] pb-2.5 mb-3" style={bw ? { borderColor: '#111827' } : undefined}>
        <div className="flex items-center justify-between text-[10px] font-sans font-semibold text-[#1E3A5F] uppercase tracking-wider" style={bw ? { color: '#111827' } : undefined}>
          <span>
            {note.subject} · {note.relevance}
          </span>
          <span className="font-normal text-slate-500 normal-case">
            Created {formatDateShort(note.createdAt)} · Updated {formatDateShort(note.updatedAt)}
          </span>
        </div>
        <h1 className="font-sans text-[19px] font-bold text-slate-950 mt-1 leading-tight">
          {note.title || 'Untitled UPSC Cornell Note'}
        </h1>
        {options.layout !== 'cornell' && (
          <div className="font-sans text-[10.5px] text-slate-600 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {note.topic && <span>Topic: {note.topic}</span>}
            {note.subtopic && <span>Subtopic: {note.subtopic}</span>}
            {note.tags.length > 0 && <span>Tags: {note.tags.join(', ')}</span>}
            {options.includeSources && note.source && <span>Source: {note.source}</span>}
          </div>
        )}
      </div>

      {/* Body by Layout */}
      {options.layout === 'comparisons-only' ? (
        <div>
          <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Comparison & Reference Tables
          </div>
          {tableBlocks.length > 0 ? (
            <PrintBlockStack blocks={tableBlocks} bw={bw} />
          ) : (
            <p className="text-xs text-slate-500">No tables present in this note.</p>
          )}
        </div>
      ) : options.layout === 'main-only' ? (
        <div>
          <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Main Notes
          </div>
          <PrintBlockStack blocks={note.notesBlocks} bw={bw} />
        </div>
      ) : options.layout === 'revision-sheet' ? (
        <div className="space-y-4">
          {note.cuesBlocks.some((b) => stripHtml(b.content)) && (
            <div>
              <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Cues & Recall Prompts
              </div>
              <PrintBlockStack blocks={note.cuesBlocks} bw={bw} />
            </div>
          )}
          <div>
            <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              High-Priority Facts & Marked Notes
            </div>
            <PrintBlockStack blocks={getRevisionBlocks(note.notesBlocks)} bw={bw} />
          </div>
        </div>
      ) : (
        <div
          className="grid gap-4 pb-3 border-b border-slate-300"
          style={{ gridTemplateColumns: `${ratio}% 1fr` }}
        >
          <div className="border-r border-slate-300 pr-3">
            <div className="font-sans text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Cues & Questions
            </div>
            <PrintBlockStack blocks={note.cuesBlocks} bw={bw} />
          </div>
          <div>
            <div className="font-sans text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Main Notes
            </div>
            <PrintBlockStack blocks={note.notesBlocks} bw={bw} />
          </div>
        </div>
      )}

      {/* Summary */}
      {options.includeSummary &&
        options.layout !== 'comparisons-only' &&
        note.summaryBlocks.some((b) => stripHtml(b.content) || b.table) && (
          <div className="mt-3 pt-2.5 border-t border-slate-300 print-block">
            <div className="font-sans text-[9.5px] font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5" style={bw ? { color: '#111827' } : undefined}>
              Summary & Key Takeaways
            </div>
            <PrintBlockStack blocks={note.summaryBlocks} bw={bw} />
          </div>
        )}
    </div>
  );
};
