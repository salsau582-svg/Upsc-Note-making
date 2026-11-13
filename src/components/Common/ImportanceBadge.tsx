import React from 'react';
import { ImportanceMarkerId } from '../../types/note';
import { IMPORTANCE_MARKERS, MARKER_MAP } from '../../constants/upsc';
import { X } from 'lucide-react';

interface ImportanceBadgeProps {
  markerId: ImportanceMarkerId;
  compact?: boolean;
  onRemove?: () => void;
}

export const ImportanceBadge: React.FC<ImportanceBadgeProps> = ({ markerId, compact, onRemove }) => {
  const meta = MARKER_MAP[markerId];
  if (!meta) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold tracking-wide rounded border whitespace-nowrap shrink-0"
      style={{
        backgroundColor: meta.bgHex,
        borderColor: meta.borderHex,
        color: meta.textHex,
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: meta.dotHex }}
        aria-hidden="true"
      />
      <span>{compact ? meta.shortLabel : meta.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 focus:outline-none"
          title="Remove marker"
          aria-label={`Remove ${meta.label} marker`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

interface ColourLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColourLegendModal: React.FC<ColourLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-lg max-w-xl w-full shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              UPSC Colour-Coded Importance System
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every marker pairs a print-safe pastel background with an explicit text label.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
            aria-label="Close legend"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {IMPORTANCE_MARKERS.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-md border flex flex-col sm:flex-row sm:items-start gap-2.5"
              style={{ backgroundColor: m.bgHex, borderColor: m.borderHex }}
            >
              <div className="shrink-0 pt-0.5">
                <ImportanceBadge markerId={m.id} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: m.textHex }}>
                {m.description}
              </p>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-[#1E3A5F] text-white rounded hover:bg-[#162C49]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
