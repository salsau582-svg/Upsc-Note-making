import React, { useState } from 'react';
import { AppSettings, CornellNote, CustomFolder } from '../../types/note';
import { createId } from '../../constants/upsc';
import { NoteListTable } from '../Common/NoteListTable';
import { Folder, FolderPlus, Plus, Trash2 } from 'lucide-react';

interface SubjectLibraryViewProps {
  notes: CornellNote[];
  allSubjects: string[];
  settings: AppSettings;
  selectedSubject: string | null;
  onSelectSubject: (subject: string | null) => void;
  onCreateNoteInSubject: (subject: string, folderId?: string) => void;
  onAddCustomSubject: (name: string) => void;
  onUpdateFolders: (folders: CustomFolder[]) => void;
  onOpenNote: (note: CornellNote) => void;
  onToggleBookmark: (note: CornellNote) => void;
  onDuplicateNote: (note: CornellNote) => void;
  onPrintNote: (note: CornellNote) => void;
  onArchiveToggle: (note: CornellNote) => void;
  onDeleteRequest: (note: CornellNote) => void;
}

export const SubjectLibraryView: React.FC<SubjectLibraryViewProps> = ({
  notes,
  allSubjects,
  settings,
  selectedSubject,
  onSelectSubject,
  onCreateNoteInSubject,
  onAddCustomSubject,
  onUpdateFolders,
  onOpenNote,
  onToggleBookmark,
  onDuplicateNote,
  onPrintNote,
  onArchiveToggle,
  onDeleteRequest,
}) => {
  const [newSubject, setNewSubject] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const activeNotes = notes.filter((n) => !n.isArchived);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSubject.trim();
    if (!clean) return;
    onAddCustomSubject(clean);
    setNewSubject('');
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderName.trim();
    if (!clean || !selectedSubject) return;
    const folder: CustomFolder = {
      id: createId('fld'),
      name: clean,
      subject: selectedSubject,
      createdAt: new Date().toISOString(),
    };
    onUpdateFolders([...settings.folders, folder]);
    setNewFolderName('');
  };

  const handleDeleteFolder = (folderId: string) => {
    onUpdateFolders(settings.folders.filter((f) => f.id !== folderId));
    if (selectedFolderId === folderId) setSelectedFolderId(null);
  };

  if (selectedSubject) {
    const subjectFolders = settings.folders.filter((f) => f.subject === selectedSubject);
    const subjectNotes = activeNotes.filter(
      (n) =>
        n.subject === selectedSubject &&
        (!selectedFolderId || n.folderId === selectedFolderId)
    );

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => {
                onSelectSubject(null);
                setSelectedFolderId(null);
              }}
              className="text-xs font-medium text-[#1E3A5F] hover:underline mb-1"
            >
              ← All Subjects
            </button>
            <h1 className="text-2xl font-bold text-slate-900">{selectedSubject}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {subjectNotes.length} notes {selectedFolderId ? 'in selected folder' : 'in this subject'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCreateNoteInSubject(selectedSubject, selectedFolderId ?? undefined)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            New Note in {selectedSubject}
          </button>
        </div>

        {/* Folders inside Subject */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">Folders in {selectedSubject}</span>
            <form onSubmit={handleAddFolder} className="flex gap-1.5">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name..."
                className="border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#1E3A5F]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
              >
                <FolderPlus className="w-3.5 h-3.5" /> Add Folder
              </button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border ${
                selectedFolderId === null
                  ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Subject Notes
            </button>
            {subjectFolders.map((f) => (
              <div
                key={f.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border ${
                  selectedFolderId === f.id
                    ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(f.id)}
                  className="inline-flex items-center gap-1.5"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>{f.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(f.id)}
                  className="ml-1 opacity-60 hover:opacity-100"
                  title="Delete folder"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <NoteListTable
          notes={subjectNotes}
          emptyTitle={`No notes in ${selectedSubject} yet`}
          emptyDescription="Create a Cornell note in this subject to build your UPSC syllabus repository."
          emptyActionLabel={`Create Note in ${selectedSubject}`}
          onEmptyAction={() => onCreateNoteInSubject(selectedSubject, selectedFolderId ?? undefined)}
          onOpenNote={onOpenNote}
          onToggleBookmark={onToggleBookmark}
          onDuplicateNote={onDuplicateNote}
          onPrintNote={onPrintNote}
          onArchiveToggle={onArchiveToggle}
          onDeleteRequest={onDeleteRequest}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subject Library</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organised across core UPSC Prelims & Mains papers, plus custom subjects and folders
          </p>
        </div>

        <form onSubmit={handleAddSubject} className="flex items-center gap-2">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add custom subject..."
            className="border border-slate-200 bg-white rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-[#1E3A5F]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add Subject
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {allSubjects.map((subject) => {
          const subjectNotes = activeNotes.filter((n) => n.subject === subject);
          const prelimsCnt = subjectNotes.filter(
            (n) => n.relevance === 'Prelims' || n.relevance === 'Both'
          ).length;
          const mainsCnt = subjectNotes.filter(
            (n) => n.relevance === 'Mains' || n.relevance === 'Both'
          ).length;
          const folderCnt = settings.folders.filter((f) => f.subject === subject).length;

          return (
            <div
              key={subject}
              onClick={() => onSelectSubject(subject)}
              className="bg-white border border-slate-200 rounded-md p-4 hover:border-[#1E3A5F] transition-colors cursor-pointer flex flex-col justify-between gap-3"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{subject}</h3>
                <div className="text-xs text-slate-500 mt-1.5 font-mono-tabular">
                  {subjectNotes.length} notes · {prelimsCnt} Prelims · {mainsCnt} Mains
                  {folderCnt > 0 ? ` · ${folderCnt} folders` : ''}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] font-medium text-[#1E3A5F]">Open Subject →</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateNoteInSubject(subject);
                  }}
                  className="text-[11px] font-medium text-slate-600 hover:text-[#1E3A5F] px-2 py-0.5 border border-slate-200 rounded hover:bg-slate-50"
                >
                  + New Note
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
