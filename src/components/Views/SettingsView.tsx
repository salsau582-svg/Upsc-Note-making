import React, { useRef, useState } from 'react';
import { AppSettings } from '../../types/note';
import { IMPORTANCE_MARKERS } from '../../constants/upsc';
import { ImportanceBadge } from '../Common/ImportanceBadge';
import { storage } from '../../storage/indexedDb';
import { Download, Trash2, Upload } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  notesCount: number;
  comparisonsCount: number;
  onUpdateSettings: (next: AppSettings) => Promise<void>;
  onAfterImport: () => Promise<void>;
  onRequestClearAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  notesCount,
  comparisonsCount,
  onUpdateSettings,
  onAfterImport,
  onRequestClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const handleExportBackup = async () => {
    try {
      const json = await storage.exportBackup();
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sankalan-upsc-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'Full notebook backup downloaded successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to export backup.',
      });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await storage.importBackup(text, importMode);
      await onAfterImport();
      setFeedback({
        type: 'success',
        message: `Imported ${res.notesCount} notes and ${res.comparisonsCount} comparison tables (${importMode} mode).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Invalid backup JSON file.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings & Backup</h1>
        <p className="text-xs text-slate-500 mt-1">
          Local IndexedDB persistence, backup export/import, editor preferences, and print defaults
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-md border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Data Backup & Restore */}
      <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Data Storage & Backup</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Currently storing{' '}
            <span className="font-mono-tabular font-semibold text-slate-800">{notesCount}</span>{' '}
            notes and{' '}
            <span className="font-mono-tabular font-semibold text-slate-800">
              {comparisonsCount}
            </span>{' '}
            standalone comparison tables locally in browser IndexedDB. Always export periodic backups before clearing browser data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md"
          >
            <Download className="w-3.5 h-3.5" />
            Export All Notes & Data (.json)
          </button>

          <div className="flex items-center gap-2 border border-slate-200 rounded-md p-1 bg-slate-50">
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
              className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
            >
              <option value="merge">Merge with existing</option>
              <option value="replace">Replace all existing</option>
            </select>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Backup (.json)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Editor Preferences */}
      <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Cornell Editor Preferences</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              Note Writing Typography
            </label>
            <div className="grid grid-cols-2 border border-slate-200 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, editorFont: 'serif' })}
                className={`py-2 font-medium ${
                  settings.editorFont === 'serif'
                    ? 'bg-[#1E3A5F] text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Academic Serif
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, editorFont: 'sans' })}
                className={`py-2 font-medium ${
                  settings.editorFont === 'sans'
                    ? 'bg-[#1E3A5F] text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Clean Sans-Serif
              </button>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              Default Cues Column Width ({settings.defaultCuesRatio}%)
            </label>
            <input
              type="range"
              min={22}
              max={42}
              value={settings.defaultCuesRatio}
              onChange={(e) =>
                onUpdateSettings({ ...settings, defaultCuesRatio: Number(e.target.value) })
              }
              className="w-full accent-[#1E3A5F]"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={settings.spellCheck}
            onChange={(e) => onUpdateSettings({ ...settings, spellCheck: e.target.checked })}
            className="rounded border-slate-300 text-[#1E3A5F]"
          />
          <span>Enable browser spellcheck while writing notes</span>
        </label>
      </div>

      {/* Print & PDF Defaults */}
      <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">A4 Printing & PDF Defaults</h2>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.printBlackAndWhite}
            onChange={(e) =>
              onUpdateSettings({ ...settings, printBlackAndWhite: e.target.checked })
            }
            className="rounded border-slate-300 text-[#1E3A5F]"
          />
          <span>Default to high-contrast Black & White printing</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.printIncludeSummary}
            onChange={(e) =>
              onUpdateSettings({ ...settings, printIncludeSummary: e.target.checked })
            }
            className="rounded border-slate-300 text-[#1E3A5F]"
          />
          <span>Include Summary section by default</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.printIncludeSources}
            onChange={(e) =>
              onUpdateSettings({ ...settings, printIncludeSources: e.target.checked })
            }
            className="rounded border-slate-300 text-[#1E3A5F]"
          />
          <span>Include Source / Reference metadata by default</span>
        </label>
      </div>

      {/* Colour-Coding System Reference */}
      <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          UPSC Colour-Coded Importance Legend
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {IMPORTANCE_MARKERS.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded border space-y-1.5"
              style={{ backgroundColor: m.bgHex, borderColor: m.borderHex }}
            >
              <ImportanceBadge markerId={m.id} />
              <p className="text-[11px] leading-relaxed" style={{ color: m.textHex }}>
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-red-700">Clear All Local Notebook Data</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Permanently deletes all notes, comparison tables, custom folders, and settings from this browser.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestClearAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-md whitespace-nowrap self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All Data
        </button>
      </div>
    </div>
  );
};
