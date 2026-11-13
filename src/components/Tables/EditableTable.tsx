import React, { useRef, useState } from 'react';
import { TableData } from '../../types/note';
import { Columns, Plus, Rows, Trash2 } from 'lucide-react';

interface EditableTableProps {
  table: TableData;
  onChange: (updated: TableData) => void;
  readOnly?: boolean;
}

export const EditableTable: React.FC<EditableTableProps> = ({ table, onChange, readOnly = false }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);

  const colCount = table.headers.length;
  const colWidths =
    table.colWidths && table.colWidths.length === colCount
      ? table.colWidths
      : Array(colCount).fill(Math.round((100 / colCount) * 10) / 10);

  const updateHeader = (colIdx: number, val: string) => {
    const headers = [...table.headers];
    headers[colIdx] = val;
    onChange({ ...table, headers });
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const rows = table.rows.map((r, i) => (i === rowIdx ? r.map((c, j) => (j === colIdx ? val : c)) : r));
    onChange({ ...table, rows });
  };

  const addRow = (afterIdx?: number) => {
    const emptyRow = Array(colCount).fill('');
    const rows = [...table.rows];
    if (afterIdx !== undefined && afterIdx >= 0 && afterIdx < rows.length) {
      rows.splice(afterIdx + 1, 0, emptyRow);
    } else {
      rows.push(emptyRow);
    }
    onChange({ ...table, rows });
  };

  const deleteRow = (rowIdx: number) => {
    if (table.rows.length <= 1) return;
    const rows = table.rows.filter((_, i) => i !== rowIdx);
    onChange({ ...table, rows });
    setActiveCell(null);
  };

  const addColumn = () => {
    const nextCount = colCount + 1;
    const evenWidths = Array(nextCount).fill(Number((100 / nextCount).toFixed(1)));
    const headers = [...table.headers, `Column ${nextCount}`];
    const rows = table.rows.map((r) => [...r, '']);
    onChange({ ...table, headers, rows, colWidths: evenWidths });
  };

  const deleteColumn = (colIdx: number) => {
    if (colCount <= 2) return;
    const nextCount = colCount - 1;
    const remainingSum = colWidths.reduce((sum, w, idx) => (idx === colIdx ? sum : sum + w), 0);
    const nextWidths = colWidths
      .filter((_, idx) => idx !== colIdx)
      .map((w) => Number(((w / (remainingSum || 100)) * 100).toFixed(1)));
    const headers = table.headers.filter((_, idx) => idx !== colIdx);
    const rows = table.rows.map((r) => r.filter((_, idx) => idx !== colIdx));
    onChange({ ...table, headers, rows, colWidths: nextWidths });
    setActiveCell(null);
  };

  const startResizeColumn = (colIdx: number, e: React.MouseEvent) => {
    if (readOnly || colIdx >= colCount - 1) return;
    e.preventDefault();
    const startX = e.clientX;
    const tableWidth = tableRef.current?.getBoundingClientRect().width || 600;
    const initialLeft = colWidths[colIdx];
    const initialRight = colWidths[colIdx + 1];

    const onMove = (moveEvt: MouseEvent) => {
      const deltaPct = ((moveEvt.clientX - startX) / tableWidth) * 100;
      const minPct = 12;
      const clampedDelta = Math.max(-(initialLeft - minPct), Math.min(initialRight - minPct, deltaPct));
      const next = [...colWidths];
      next[colIdx] = Number((initialLeft + clampedDelta).toFixed(1));
      next[colIdx + 1] = Number((initialRight - clampedDelta).toFixed(1));
      onChange({ ...table, colWidths: next });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="my-2 border border-slate-200 rounded-md bg-white overflow-hidden">
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-xs">
          <input
            type="text"
            value={table.caption ?? ''}
            onChange={(e) => onChange({ ...table, caption: e.target.value })}
            placeholder="Table title / caption (optional)"
            className="bg-transparent text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none min-w-[180px] flex-1"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer mr-1">
              <input
                type="checkbox"
                checked={table.hasHeader}
                onChange={(e) => onChange({ ...table, hasHeader: e.target.checked })}
                className="rounded border-slate-300 text-[#1E3A5F]"
              />
              Header row
            </label>
            <button
              type="button"
              onClick={() => addRow(activeCell?.row)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 whitespace-nowrap"
              title="Add row"
            >
              <Plus className="w-3 h-3" /> Row
            </button>
            <button
              type="button"
              onClick={addColumn}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 whitespace-nowrap"
              title="Add column"
            >
              <Columns className="w-3 h-3" /> + Col
            </button>
            {activeCell && table.rows.length > 1 && (
              <button
                type="button"
                onClick={() => deleteRow(activeCell.row)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 whitespace-nowrap"
                title="Delete selected row"
              >
                <Rows className="w-3 h-3" /> Del Row
              </button>
            )}
            {activeCell && colCount > 2 && (
              <button
                type="button"
                onClick={() => deleteColumn(activeCell.col)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 whitespace-nowrap"
                title="Delete selected column"
              >
                <Trash2 className="w-3 h-3" /> Del Col
              </button>
            )}
          </div>
        </div>
      )}

      {readOnly && table.caption && (
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
          {table.caption}
        </div>
      )}

      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full border-collapse table-fixed text-xs">
          <colgroup>
            {colWidths.map((w, idx) => (
              <col key={idx} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
          {table.hasHeader && (
            <thead>
              <tr className="bg-[#1E3A5F] text-white">
                {table.headers.map((header, colIdx) => (
                  <th
                    key={colIdx}
                    className="relative border-r border-slate-300/30 last:border-r-0 p-0 text-left font-semibold align-top"
                  >
                    {readOnly ? (
                      <div className="px-2.5 py-2 break-words">{header}</div>
                    ) : (
                      <input
                        type="text"
                        value={header}
                        onFocus={() => setActiveCell({ row: -1, col: colIdx })}
                        onChange={(e) => updateHeader(colIdx, e.target.value)}
                        placeholder={`Heading ${colIdx + 1}`}
                        className="w-full bg-transparent px-2.5 py-2 text-xs font-semibold text-white placeholder:text-slate-300 focus:outline-none focus:bg-white/10"
                      />
                    )}
                    {!readOnly && colIdx < colCount - 1 && (
                      <div
                        onMouseDown={(e) => startResizeColumn(colIdx, e)}
                        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-sky-300/60"
                        title="Drag to resize column"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className={`border-t border-r border-slate-200 last:border-r-0 p-0 align-top ${
                      colIdx === 0 && table.isComparison ? 'font-medium text-slate-900 bg-slate-50/80' : 'text-slate-800'
                    }`}
                  >
                    {readOnly ? (
                      <div className="px-2.5 py-2 whitespace-pre-wrap break-words leading-relaxed">{cell}</div>
                    ) : (
                      <textarea
                        value={cell}
                        rows={Math.max(1, Math.min(6, Math.ceil((cell?.length || 1) / 36)))}
                        onFocus={() => setActiveCell({ row: rowIdx, col: colIdx })}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        placeholder="Enter details..."
                        className="w-full bg-transparent px-2.5 py-1.5 text-xs leading-relaxed resize-y focus:outline-none focus:bg-sky-50/40"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
