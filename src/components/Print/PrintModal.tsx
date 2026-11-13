import React, { useState } from 'react';
import { AppSettings, CornellNote, PrintLayoutMode, PrintOptions } from '../../types/note';
import { Download, FileCode, Printer, X } from 'lucide-react';
import { PrintSheet } from './PrintSheet';
import { downloadCleanHtml, exportNoteToPdf } from '../../utils/pdfExport';

interface PrintModalProps {
  isOpen: boolean;
  note: CornellNote;
  settings: AppSettings;
  onClose: () => void;
  onTriggerBrowserPrint: (note: CornellNote, options: PrintOptions) => void;
}

const LAYOUT_CHOICES: { id: PrintLayoutMode; label: string; desc: string }[] = [
  { id: 'complete', label: 'Complete Cornell Note', desc: 'Metadata + Cues & Main Notes + Summary' },
  { id: 'cornell', label: 'Cornell Sheet (Clean)', desc: 'Classic 2-column Cues & Notes + Summary' },
  { id: 'main-only', label: 'Main Notes Only', desc: 'Full-width detailed notes for reading' },
  { id: 'revision-sheet', label: 'Quick Revision Sheet', desc: 'Cues, Summary & highlighted facts only' },
  { id: 'comparisons-only', label: 'Comparison Tables Only', desc: 'Extracts all tables from this note' },
];

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  note,
  settings,
  onClose,
  onTriggerBrowserPrint,
}) => {
  const [options, setOptions] = useState<PrintOptions>({
    layout: 'complete',
    blackAndWhite: settings.printBlackAndWhite,
    includeSummary: settings.printIncludeSummary,
    includeSources: settings.printIncludeSources,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-lg max-w-5xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Print & Export A4 Study Sheet</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              A4 Portrait · Vector PDF, Browser Print Dialog, or Clean Offline HTML
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
            aria-label="Close export modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Options Column */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 p-5 space-y-5 bg-slate-50/70">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Page Layout
              </label>
              <div className="space-y-1.5">
                {LAYOUT_CHOICES.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setOptions((o) => ({ ...o, layout: choice.id }))}
                    className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                      options.layout === choice.id
                        ? 'bg-white border-[#1E3A5F] ring-1 ring-[#1E3A5F]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900">{choice.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{choice.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Content & Ink Options
              </label>

              <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <span>Include Summary section</span>
                <input
                  type="checkbox"
                  checked={options.includeSummary}
                  onChange={(e) => setOptions((o) => ({ ...o, includeSummary: e.target.checked }))}
                  className="rounded border-slate-300 text-[#1E3A5F]"
                />
              </label>

              <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <span>Include Source references</span>
                <input
                  type="checkbox"
                  checked={options.includeSources}
                  onChange={(e) => setOptions((o) => ({ ...o, includeSources: e.target.checked }))}
                  className="rounded border-slate-300 text-[#1E3A5F]"
                />
              </label>

              <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <span>Print in Black & White</span>
                <input
                  type="checkbox"
                  checked={options.blackAndWhite}
                  onChange={(e) => setOptions((o) => ({ ...o, blackAndWhite: e.target.checked }))}
                  className="rounded border-slate-300 text-[#1E3A5F]"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => exportNoteToPdf(note, options)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md transition-colors"
              >
                <Download className="w-4 h-4" />
                Download A4 PDF
              </button>
              <button
                type="button"
                onClick={() => onTriggerBrowserPrint(note, options)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print via Browser Dialog
              </button>
              <button
                type="button"
                onClick={() => downloadCleanHtml(note, options)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
              >
                <FileCode className="w-4 h-4" />
                Download Clean HTML
              </button>
            </div>
          </div>

          {/* Live A4 Sheet Preview */}
          <div className="lg:col-span-8 bg-slate-200/70 p-6 overflow-y-auto">
            <div className="mx-auto max-w-[660px] bg-white border border-slate-300 shadow-sm p-8 min-h-[760px]">
              <PrintSheet note={note} options={options} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
