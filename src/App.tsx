import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppSettings,
  CornellNote,
  CustomFolder,
  ExamRelevance,
  NavSection,
  PrintOptions,
  StandaloneComparison,
} from './types/note';
import {
  buildSampleReferenceNotes,
  createId,
  DEFAULT_UPSC_SUBJECTS,
} from './constants/upsc';
import { DEFAULT_SETTINGS, storage } from './storage/indexedDb';
import {
  createNewNote,
  duplicateCornellNote,
  isRevisionDue,
} from './utils/noteHelpers';
import { Sidebar } from './components/Layout/Sidebar';
import { DashboardView } from './components/Views/DashboardView';
import { NotesBrowserView } from './components/Views/NotesBrowserView';
import { SubjectLibraryView } from './components/Views/SubjectLibraryView';
import { RevisionCentreView } from './components/Views/RevisionCentreView';
import { ComparisonTablesView } from './components/Views/ComparisonTablesView';
import { StagePrepView } from './components/Views/StagePrepView';
import { SettingsView } from './components/Views/SettingsView';
import { CornellEditor } from './components/Editor/CornellEditor';
import { PrintModal } from './components/Print/PrintModal';
import { PrintSheet } from './components/Print/PrintSheet';
import { ConfirmModal } from './components/Common/ConfirmModal';
import { Menu } from 'lucide-react';

export function App() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<CornellNote[]>([]);
  const [comparisons, setComparisons] = useState<StandaloneComparison[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals & print state
  const [printModalNote, setPrintModalNote] = useState<CornellNote | null>(null);
  const [browserPrintPayload, setBrowserPrintPayload] = useState<{
    note: CornellNote;
    options: PrintOptions;
  } | null>(null);
  const [deleteTargetNote, setDeleteTargetNote] = useState<CornellNote | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  const loadAllData = useCallback(async () => {
    const [loadedNotes, loadedComparisons, loadedSettings] = await Promise.all([
      storage.getAllNotes(),
      storage.getAllComparisons(),
      storage.getSettings(),
    ]);
    setNotes(loadedNotes);
    setComparisons(loadedComparisons);
    setSettings(loadedSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const allSubjects = useMemo(() => {
    const set = new Set([...DEFAULT_UPSC_SUBJECTS, ...settings.customSubjects]);
    notes.forEach((n) => {
      if (n.subject) set.add(n.subject);
    });
    return Array.from(set);
  }, [settings.customSubjects, notes]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? null,
    [notes, activeNoteId]
  );

  const dueRevisionCount = useMemo(
    () => notes.filter((n) => isRevisionDue(n)).length,
    [notes]
  );

  const bookmarkCount = useMemo(
    () => notes.filter((n) => !n.isArchived && n.isBookmarked).length,
    [notes]
  );

  const handleSaveNote = useCallback(async (updated: CornellNote) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updated.id);
      const next = exists
        ? prev.map((n) => (n.id === updated.id ? updated : n))
        : [updated, ...prev];
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    await storage.saveNote(updated);
  }, []);

  const handleCreateNote = useCallback(
    async (opts?: {
      templateId?: string;
      subject?: string;
      relevance?: ExamRelevance;
      folderId?: string;
    }) => {
      const newNote = createNewNote({
        templateId: opts?.templateId,
        subject: opts?.subject,
        relevance: opts?.relevance,
        cuesRatio: settings.defaultCuesRatio,
        folderId: opts?.folderId,
      });
      await handleSaveNote(newNote);
      setActiveNoteId(newNote.id);
    },
    [handleSaveNote, settings.defaultCuesRatio]
  );

  const handleNavigate = (section: NavSection) => {
    if (section === 'create') {
      handleCreateNote({ templateId: 'blank' });
      return;
    }
    setActiveNoteId(null);
    setIsFullscreenEditor(false);
    if (section !== 'subjects') {
      setSelectedSubject(null);
    }
    setActiveSection(section);
  };

  const handleToggleBookmark = async (note: CornellNote) => {
    const updated: CornellNote = {
      ...note,
      isBookmarked: !note.isBookmarked,
      updatedAt: new Date().toISOString(),
    };
    await handleSaveNote(updated);
    showToast(updated.isBookmarked ? 'Added to Bookmarks' : 'Removed from Bookmarks');
  };

  const handleDuplicateNote = async (note: CornellNote) => {
    const copy = duplicateCornellNote(note);
    await handleSaveNote(copy);
    showToast('Note duplicated');
    if (activeNoteId) {
      setActiveNoteId(copy.id);
    }
  };

  const handleArchiveToggle = async (note: CornellNote) => {
    const updated: CornellNote = {
      ...note,
      isArchived: !note.isArchived,
      updatedAt: new Date().toISOString(),
    };
    await handleSaveNote(updated);
    showToast(updated.isArchived ? 'Note moved to Archive' : 'Note restored from Archive');
    if (activeNoteId === note.id && updated.isArchived) {
      setActiveNoteId(null);
    }
  };

  const handleConfirmDeleteNote = async () => {
    if (!deleteTargetNote) return;
    const id = deleteTargetNote.id;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await storage.deleteNote(id);
    if (activeNoteId === id) setActiveNoteId(null);
    setDeleteTargetNote(null);
    showToast('Note permanently deleted');
  };

  const handleMarkRevised = async (
    note: CornellNote,
    intervalDays: number | null,
    customDateIso?: string,
    noteText?: string
  ) => {
    const nowIso = new Date().toISOString();
    let nextRevisionIso = customDateIso ?? null;
    if (!nextRevisionIso && intervalDays) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + intervalDays);
      nextRevisionIso = nextDate.toISOString();
    }

    const updated: CornellNote = {
      ...note,
      updatedAt: nowIso,
      revision: {
        lastRevisedAt: nowIso,
        nextRevisionAt: nextRevisionIso,
        intervalDays,
        count: note.revision.count + 1,
        history: [
          ...note.revision.history,
          {
            id: createId('rev'),
            date: nowIso,
            intervalDays,
            note: noteText?.trim() || undefined,
          },
        ],
      },
    };
    await handleSaveNote(updated);
    showToast(
      intervalDays
        ? `Marked revised · Next due in ${intervalDays} day${intervalDays > 1 ? 's' : ''}`
        : 'Marked revised'
    );
  };

  const handleScheduleRevision = async (
    note: CornellNote,
    intervalDays: number | null,
    customDateIso?: string
  ) => {
    let nextRevisionIso = customDateIso ?? null;
    if (!nextRevisionIso && intervalDays) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + intervalDays);
      nextRevisionIso = nextDate.toISOString();
    }
    const updated: CornellNote = {
      ...note,
      revision: {
        ...note.revision,
        intervalDays,
        nextRevisionAt: nextRevisionIso,
      },
    };
    await handleSaveNote(updated);
  };

  const handleToggleDifficult = async (note: CornellNote) => {
    const updated: CornellNote = {
      ...note,
      isDifficult: !note.isDifficult,
      updatedAt: new Date().toISOString(),
    };
    await handleSaveNote(updated);
  };

  const handleUpdateSettings = async (next: AppSettings) => {
    setSettings(next);
    await storage.saveSettings(next);
  };

  const handleAddCustomSubject = async (name: string) => {
    if (allSubjects.includes(name)) return;
    await handleUpdateSettings({
      ...settings,
      customSubjects: [...settings.customSubjects, name],
    });
    showToast(`Subject "${name}" added`);
  };

  const handleUpdateFolders = async (folders: CustomFolder[]) => {
    await handleUpdateSettings({ ...settings, folders });
  };

  const handleSaveComparison = async (cmp: StandaloneComparison) => {
    setComparisons((prev) => {
      const exists = prev.some((c) => c.id === cmp.id);
      const next = exists
        ? prev.map((c) => (c.id === cmp.id ? cmp : c))
        : [cmp, ...prev];
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    await storage.saveComparison(cmp);
  };

  const handleDeleteComparison = async (id: string) => {
    setComparisons((prev) => prev.filter((c) => c.id !== id));
    await storage.deleteComparison(id);
    showToast('Comparison table deleted');
  };

  const handleLoadSampleNotes = async () => {
    const sample = buildSampleReferenceNotes();
    for (const n of sample.notes) {
      await storage.saveNote(n);
    }
    for (const c of sample.comparisons) {
      await storage.saveComparison(c);
    }
    await loadAllData();
    showToast('Loaded 2 sample UPSC reference notes & 1 comparison table');
  };

  const handleTriggerBrowserPrint = (note: CornellNote, options: PrintOptions) => {
    setBrowserPrintPayload({ note, options });
    setPrintModalNote(null);
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
      }, 120);
    });
  };

  const handleClearAllData = async () => {
    await storage.clearAll();
    setNotes([]);
    setComparisons([]);
    setSettings(DEFAULT_SETTINGS);
    setActiveNoteId(null);
    setConfirmClearAll(false);
    showToast('All local data cleared');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-xs text-slate-500">
        Loading UPSC Cornell Notebook...
      </div>
    );
  }

  return (
    <>
      <div id="app-shell" className="min-h-screen flex bg-[#F8FAFC] text-slate-800">
        {!isFullscreenEditor && (
          <Sidebar
            activeSection={activeNote ? 'notes' : activeSection}
            dueRevisionCount={dueRevisionCount}
            bookmarkCount={bookmarkCount}
            isOpenMobile={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            onSelectSection={handleNavigate}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Mobile Header */}
          {!isFullscreenEditor && !activeNote && (
            <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 text-slate-700 border border-slate-200 rounded"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-[#1E3A5F]">Sankalan UPSC</span>
              <button
                type="button"
                onClick={() => handleCreateNote({ templateId: 'blank' })}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#1E3A5F] rounded"
              >
                + New
              </button>
            </header>
          )}

          {/* Active Note Editor OR Active Section View */}
          {activeNote ? (
            <div className="flex-1 flex flex-col min-h-0">
              <CornellEditor
                note={activeNote}
                allSubjects={allSubjects}
                settings={settings}
                isFullscreen={isFullscreenEditor}
                onToggleFullscreen={() => setIsFullscreenEditor((v) => !v)}
                onSaveNote={handleSaveNote}
                onBack={() => {
                  setIsFullscreenEditor(false);
                  setActiveNoteId(null);
                }}
                onOpenPrintModal={(n) => setPrintModalNote(n)}
                onDuplicate={handleDuplicateNote}
                onArchiveToggle={handleArchiveToggle}
                onDeleteRequest={(n) => setDeleteTargetNote(n)}
                onAddCustomSubject={handleAddCustomSubject}
                onQuickRevise={(n, days) => handleMarkRevised(n, days)}
              />
            </div>
          ) : (
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {activeSection === 'dashboard' && (
                <DashboardView
                  notes={notes}
                  comparisonCount={comparisons.length}
                  onNavigate={handleNavigate}
                  onCreateNote={(templateId) => handleCreateNote({ templateId })}
                  onOpenNote={(n) => setActiveNoteId(n.id)}
                  onSelectSubject={(sub) => {
                    setSelectedSubject(sub);
                    setActiveSection('subjects');
                  }}
                  onQuickRevise={(n, days) => handleMarkRevised(n, days)}
                  onLoadSampleNotes={handleLoadSampleNotes}
                />
              )}

              {(activeSection === 'notes' ||
                activeSection === 'bookmarks' ||
                activeSection === 'archive') && (
                <NotesBrowserView
                  mode={
                    activeSection === 'bookmarks'
                      ? 'bookmarks'
                      : activeSection === 'archive'
                        ? 'archive'
                        : 'all'
                  }
                  notes={notes}
                  allSubjects={allSubjects}
                  onCreateNote={() => handleCreateNote({ templateId: 'blank' })}
                  onOpenNote={(n) => setActiveNoteId(n.id)}
                  onToggleBookmark={handleToggleBookmark}
                  onDuplicateNote={handleDuplicateNote}
                  onPrintNote={(n) => setPrintModalNote(n)}
                  onArchiveToggle={handleArchiveToggle}
                  onDeleteRequest={(n) => setDeleteTargetNote(n)}
                />
              )}

              {activeSection === 'subjects' && (
                <SubjectLibraryView
                  notes={notes}
                  allSubjects={allSubjects}
                  settings={settings}
                  selectedSubject={selectedSubject}
                  onSelectSubject={setSelectedSubject}
                  onCreateNoteInSubject={(subject, folderId) =>
                    handleCreateNote({ templateId: 'blank', subject, folderId })
                  }
                  onAddCustomSubject={handleAddCustomSubject}
                  onUpdateFolders={handleUpdateFolders}
                  onOpenNote={(n) => setActiveNoteId(n.id)}
                  onToggleBookmark={handleToggleBookmark}
                  onDuplicateNote={handleDuplicateNote}
                  onPrintNote={(n) => setPrintModalNote(n)}
                  onArchiveToggle={handleArchiveToggle}
                  onDeleteRequest={(n) => setDeleteTargetNote(n)}
                />
              )}

              {activeSection === 'revision' && (
                <RevisionCentreView
                  notes={notes}
                  printBw={settings.printBlackAndWhite}
                  onOpenNote={(n) => setActiveNoteId(n.id)}
                  onMarkRevised={handleMarkRevised}
                  onScheduleNext={handleScheduleRevision}
                  onToggleDifficult={handleToggleDifficult}
                />
              )}

              {activeSection === 'comparisons' && (
                <ComparisonTablesView
                  comparisons={comparisons}
                  notes={notes}
                  allSubjects={allSubjects}
                  printBw={settings.printBlackAndWhite}
                  onSaveComparison={handleSaveComparison}
                  onDeleteComparison={handleDeleteComparison}
                  onOpenNote={(n) => setActiveNoteId(n.id)}
                />
              )}

              {(activeSection === 'prelims' || activeSection === 'mains') && (
                <StagePrepView
                  stage={activeSection}
                  notes={notes}
                  allSubjects={allSubjects}
                  printBw={settings.printBlackAndWhite}
                  onCreateWithTemplate={(templateId, subject) =>
                    handleCreateNote({ templateId, subject })
                  }
                  onOpenNote={(n) => setActiveNoteId(n.id)}
                  onToggleBookmark={handleToggleBookmark}
                  onDuplicateNote={handleDuplicateNote}
                  onPrintNote={(n) => setPrintModalNote(n)}
                  onArchiveToggle={handleArchiveToggle}
                  onDeleteRequest={(n) => setDeleteTargetNote(n)}
                />
              )}

              {activeSection === 'settings' && (
                <SettingsView
                  settings={settings}
                  notesCount={notes.length}
                  comparisonsCount={comparisons.length}
                  onUpdateSettings={handleUpdateSettings}
                  onAfterImport={loadAllData}
                  onRequestClearAll={() => setConfirmClearAll(true)}
                />
              )}
            </main>
          )}
        </div>

        {/* Print & PDF Modal */}
        {printModalNote && (
          <PrintModal
            isOpen={!!printModalNote}
            note={printModalNote}
            settings={settings}
            onClose={() => setPrintModalNote(null)}
            onTriggerBrowserPrint={handleTriggerBrowserPrint}
          />
        )}

        {/* Delete Note Confirmation */}
        <ConfirmModal
          isOpen={!!deleteTargetNote}
          title="Delete Cornell Note"
          message={`Are you sure you want to permanently delete "${
            deleteTargetNote?.title || 'Untitled Note'
          }"? This action cannot be undone.`}
          confirmLabel="Delete Permanently"
          onConfirm={handleConfirmDeleteNote}
          onCancel={() => setDeleteTargetNote(null)}
        />

        {/* Clear All Data Confirmation */}
        <ConfirmModal
          isOpen={confirmClearAll}
          title="Clear All Local Data"
          message="This will permanently erase all your notes, comparison tables, custom folders, and settings stored in this browser. Export a JSON backup first if you want to keep a copy."
          confirmLabel="Erase Everything"
          onConfirm={handleClearAllData}
          onCancel={() => setConfirmClearAll(false)}
        />

        {/* Subtle Non-Intrusive Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-md shadow-lg">
            {toast}
          </div>
        )}
      </div>

      {/* Dedicated A4 Print Output Portal (Hidden on screen, visible ONLY in @media print) */}
      <div id="print-output-root">
        {browserPrintPayload && (
          <PrintSheet
            note={browserPrintPayload.note}
            options={browserPrintPayload.options}
          />
        )}
      </div>
    </>
  );
}

export default App;
