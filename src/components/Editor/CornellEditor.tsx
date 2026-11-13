import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppSettings,
  BlockType,
  CornellNote,
  EditorSectionKey,
  ExamRelevance,
  ImportanceMarkerId,
  NoteBlock,
  PrintOptions,
} from '../../types/note';
import {
  COMPARISON_TEMPLATES,
  createBlock,
  createId,
  IMPORTANCE_MARKERS,
  MARKER_MAP,
  NOTE_TEMPLATES,
} from '../../constants/upsc';
import { computeWordCount, formatDateTime, sanitizeInlineHtml, stripHtml } from '../../utils/noteHelpers';
import { RichEditableCell } from './RichEditableCell';
import { EditableTable } from '../Tables/EditableTable';
import { ColourLegendModal, ImportanceBadge } from '../Common/ImportanceBadge';
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  Bookmark,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Indent,
  Info,
  Italic,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Outdent,
  Plus,
  Printer,
  Quote,
  Redo2,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  Tag,
  Trash2,
  Underline,
  Undo2,
  X,
} from 'lucide-react';

interface CornellEditorProps {
  note: CornellNote;
  allSubjects: string[];
  settings: AppSettings;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSaveNote: (updated: CornellNote) => Promise<void>;
  onBack: () => void;
  onOpenPrintModal: (note: CornellNote) => void;
  onDuplicate: (note: CornellNote) => void;
  onArchiveToggle: (note: CornellNote) => void;
  onDeleteRequest: (note: CornellNote) => void;
  onAddCustomSubject: (subjectName: string) => void;
  onQuickRevise: (note: CornellNote, intervalDays: number) => void;
}

export const CornellEditor: React.FC<CornellEditorProps> = ({
  note: initialNote,
  allSubjects,
  settings,
  isFullscreen,
  onToggleFullscreen,
  onSaveNote,
  onBack,
  onOpenPrintModal,
  onDuplicate,
  onArchiveToggle,
  onDeleteRequest,
  onAddCustomSubject,
  onQuickRevise,
}) => {
  const [note, setNote] = useState<CornellNote>(initialNote);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string>(initialNote.updatedAt);

  // Undo / Redo history
  const historyRef = useRef<CornellNote[]>([initialNote]);
  const historyIndexRef = useRef<number>(0);
  const [, setHistoryTick] = useState(0);

  // Active focus tracking
  const [activeTarget, setActiveTarget] = useState<{
    section: EditorSectionKey;
    blockId: string;
  }>({
    section: 'notesBlocks',
    blockId: initialNote.notesBlocks[0]?.id ?? '',
  });
  const blockElementsRef = useRef<Record<string, HTMLDivElement | null>>({});

  // UI toggles
  const [showMeta, setShowMeta] = useState(true);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [highlightMode, setHighlightMode] = useState<'selection' | 'block'>('selection');
  const [tagInput, setTagInput] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);

  // In-note search
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatchIdx, setSearchMatchIdx] = useState(0);

  // Column resizing
  const columnsContainerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<number | null>(null);

  // Sync if note ID changes externally
  useEffect(() => {
    setNote(initialNote);
    setLastSavedAt(initialNote.updatedAt);
    setSaveStatus('saved');
    historyRef.current = [initialNote];
    historyIndexRef.current = 0;
    setActiveTarget({
      section: 'notesBlocks',
      blockId: initialNote.notesBlocks[0]?.id ?? '',
    });
  }, [initialNote.id]);

  // Autosave with debounce
  const commitChange = useCallback(
    (updater: (prev: CornellNote) => CornellNote, recordHistory = true) => {
      setNote((prev) => {
        const nextRaw = updater(prev);
        const now = new Date().toISOString();
        const next: CornellNote = {
          ...nextRaw,
          updatedAt: now,
          wordCount: computeWordCount(nextRaw),
        };

        if (recordHistory) {
          const sliced = historyRef.current.slice(0, historyIndexRef.current + 1);
          sliced.push(next);
          if (sliced.length > 60) sliced.shift();
          historyRef.current = sliced;
          historyIndexRef.current = sliced.length - 1;
          setHistoryTick((t) => t + 1);
        }

        setSaveStatus('saving');
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(async () => {
          await onSaveNote(next);
          setSaveStatus('saved');
          setLastSavedAt(next.updatedAt);
        }, 350);

        return next;
      });
    },
    [onSaveNote]
  );

  // Flush save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snap = historyRef.current[historyIndexRef.current];
    setNote(snap);
    setHistoryTick((t) => t + 1);
    setSaveStatus('saving');
    onSaveNote(snap).then(() => {
      setSaveStatus('saved');
      setLastSavedAt(snap.updatedAt);
    });
  }, [onSaveNote]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snap = historyRef.current[historyIndexRef.current];
    setNote(snap);
    setHistoryTick((t) => t + 1);
    setSaveStatus('saving');
    onSaveNote(snap).then(() => {
      setSaveStatus('saved');
      setLastSavedAt(snap.updatedAt);
    });
  }, [onSaveNote]);

  // Global editor keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
      } else if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onOpenPrintModal(note);
      } else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        // Let native undo work inside plain inputs, or trigger snapshot undo
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          handleUndo();
        }
      } else if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (showSearch) setShowSearch(false);
        else if (isFullscreen) onToggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo, isFullscreen, note, onOpenPrintModal, onToggleFullscreen, showSearch]);

  const focusBlock = (blockId: string) => {
    requestAnimationFrame(() => {
      const el = blockElementsRef.current[blockId];
      if (el) {
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  };

  // Block operations
  const updateBlock = (section: EditorSectionKey, blockId: string, patch: Partial<NoteBlock>) => {
    commitChange((prev) => ({
      ...prev,
      [section]: prev[section].map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
    }));
  };

  const insertBlockAfter = (
    section: EditorSectionKey,
    afterBlockId: string | null,
    newBlock: NoteBlock
  ) => {
    commitChange((prev) => {
      const list = [...prev[section]];
      if (!afterBlockId) {
        list.push(newBlock);
      } else {
        const idx = list.findIndex((b) => b.id === afterBlockId);
        if (idx === -1) list.push(newBlock);
        else list.splice(idx + 1, 0, newBlock);
      }
      return { ...prev, [section]: list };
    });
    setActiveTarget({ section, blockId: newBlock.id });
    if (newBlock.type !== 'divider' && newBlock.type !== 'table') {
      focusBlock(newBlock.id);
    }
  };

  const deleteBlock = (section: EditorSectionKey, blockId: string) => {
    commitChange((prev) => {
      const list = prev[section];
      if (list.length <= 1) {
        return {
          ...prev,
          [section]: [createBlock({ type: 'paragraph', content: '' })],
        };
      }
      const idx = list.findIndex((b) => b.id === blockId);
      const nextList = list.filter((b) => b.id !== blockId);
      const fallback = nextList[Math.max(0, idx - 1)];
      if (fallback) {
        setActiveTarget({ section, blockId: fallback.id });
        focusBlock(fallback.id);
      }
      return { ...prev, [section]: nextList };
    });
  };

  const moveBlock = (section: EditorSectionKey, blockId: string, dir: -1 | 1) => {
    commitChange((prev) => {
      const list = [...prev[section]];
      const idx = list.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const [item] = list.splice(idx, 1);
      list.splice(targetIdx, 0, item);
      return { ...prev, [section]: list };
    });
  };

  const changeActiveBlockType = (type: BlockType) => {
    const { section, blockId } = activeTarget;
    const targetList = note[section];
    const current = targetList.find((b) => b.id === blockId);
    if (!current) {
      insertBlockAfter(section, null, createBlock({ type }));
      return;
    }
    if (type === 'divider') {
      insertBlockAfter(section, blockId, createBlock({ type: 'divider' }));
      return;
    }
    if (type === 'definition' || type === 'quote' || type === 'fact' || type === 'expandable') {
      insertBlockAfter(
        section,
        blockId,
        createBlock({
          type,
          secondaryContent:
            type === 'definition'
              ? 'Term'
              : type === 'fact'
                ? 'Key Fact'
                : type === 'expandable'
                  ? 'Expandable Section Title'
                  : 'Source / Thinker',
        })
      );
      return;
    }
    updateBlock(section, blockId, { type });
    focusBlock(blockId);
  };

  const handleIndentActive = (delta: 1 | -1) => {
    const { section, blockId } = activeTarget;
    const blk = note[section].find((b) => b.id === blockId);
    if (!blk) return;
    const nextIndent = Math.max(0, Math.min(2, (blk.indent ?? 0) + delta));
    updateBlock(section, blockId, { indent: nextIndent });
  };

  const applyInlineFormat = (cmd: 'bold' | 'italic' | 'underline') => {
    document.execCommand(cmd);
    const { section, blockId } = activeTarget;
    const el = blockElementsRef.current[blockId];
    if (el) {
      updateBlock(section, blockId, { content: sanitizeInlineHtml(el.innerHTML) });
    }
  };

  const applyImportanceMarker = (markerId: ImportanceMarkerId | null) => {
    const { section, blockId } = activeTarget;

    if (highlightMode === 'selection' && markerId !== null) {
      const sel = window.getSelection();
      const el = blockElementsRef.current[blockId];
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && el && el.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const mark = document.createElement('mark');
        mark.setAttribute('data-marker', markerId);
        try {
          range.surroundContents(mark);
        } catch {
          const frag = range.extractContents();
          mark.appendChild(frag);
          range.insertNode(mark);
        }
        sel.removeAllRanges();
        updateBlock(section, blockId, { content: sanitizeInlineHtml(el.innerHTML) });
        return;
      }
    }

    // Apply or clear marker at block level
    if (markerId === null) {
      // Also strip inline marks if selection inside block, otherwise clear block marker
      const sel = window.getSelection();
      const el = blockElementsRef.current[blockId];
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && el && el.contains(sel.anchorNode)) {
        const text = sel.toString();
        document.execCommand('insertText', false, text);
        updateBlock(section, blockId, { content: sanitizeInlineHtml(el.innerHTML) });
        return;
      }
    }

    const currentBlock = note[section].find((b) => b.id === blockId);
    if (currentBlock) {
      const nextMarker = currentBlock.marker === markerId ? null : markerId;
      updateBlock(section, blockId, { marker: nextMarker });
    }
  };

  const insertCustomTable = (cols = 3, rows = 3) => {
    const colWidths = Array(cols).fill(Number((100 / cols).toFixed(1)));
    const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);
    const bodyRows = Array.from({ length: rows }, () => Array(cols).fill(''));
    const tblBlock = createBlock({
      type: 'table',
      table: {
        caption: '',
        hasHeader: true,
        isComparison: false,
        colWidths,
        headers,
        rows: bodyRows,
      },
    });
    insertBlockAfter('notesBlocks', activeTarget.section === 'notesBlocks' ? activeTarget.blockId : null, tblBlock);
    setShowTableMenu(false);
  };

  const insertComparisonTemplate = (templateKey: string) => {
    const tpl = COMPARISON_TEMPLATES.find((t) => t.key === templateKey);
    if (!tpl) return;
    const tblBlock = createBlock({
      type: 'table',
      table: JSON.parse(JSON.stringify(tpl.table)),
    });
    insertBlockAfter('notesBlocks', activeTarget.section === 'notesBlocks' ? activeTarget.blockId : null, tblBlock);
    setShowTableMenu(false);
  };

  const applyNoteTemplate = (templateId: string) => {
    const tpl = NOTE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    commitChange((prev) => ({
      ...prev,
      relevance: tpl.relevance,
      templateUsed: tpl.id,
      cuesBlocks: [...prev.cuesBlocks.filter((b) => stripHtml(b.content)), ...tpl.cuesBlocks()],
      notesBlocks: [...prev.notesBlocks.filter((b) => stripHtml(b.content) || b.table), ...tpl.notesBlocks()],
      summaryBlocks: [...prev.summaryBlocks.filter((b) => stripHtml(b.content)), ...tpl.summaryBlocks()],
    }));
    setShowTemplateMenu(false);
  };

  // Column resizer
  const handleStartColumnResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = columnsContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const onMove = (moveEvt: MouseEvent) => {
      const pct = ((moveEvt.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.round(Math.max(20, Math.min(46, pct)));
      commitChange((prev) => ({ ...prev, cuesRatio: clamped }), false);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Search matches across all blocks
  const searchMatches = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    const matches: { section: EditorSectionKey; blockId: string }[] = [];
    (['cuesBlocks', 'notesBlocks', 'summaryBlocks'] as EditorSectionKey[]).forEach((sec) => {
      note[sec].forEach((blk) => {
        const text = `${stripHtml(blk.content)} ${stripHtml(blk.secondaryContent ?? '')} ${
          blk.table ? `${blk.table.caption ?? ''} ${blk.table.headers.join(' ')} ${blk.table.rows.flat().join(' ')}` : ''
        }`.toLowerCase();
        if (text.includes(q)) {
          matches.push({ section: sec, blockId: blk.id });
        }
      });
    });
    return matches;
  }, [note, searchTerm]);

  const jumpToSearchMatch = (idx: number) => {
    if (searchMatches.length === 0) return;
    const wrapped = ((idx % searchMatches.length) + searchMatches.length) % searchMatches.length;
    setSearchMatchIdx(wrapped);
    const match = searchMatches[wrapped];
    setActiveTarget(match);
    const el = blockElementsRef.current[match.blockId];
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Render a block list for Cues, Main Notes, or Summary
  const renderBlockSection = (section: EditorSectionKey, blocks: NoteBlock[], placeholderText: string) => {
    let numberedCount = 0;
    const fontClass = settings.editorFont === 'serif' ? 'font-academic-serif' : 'font-academic-sans';

    return (
      <div className={`space-y-1.5 ${fontClass}`}>
        {blocks.map((block, index) => {
          if (block.type === 'numbered') numberedCount += 1;
          else numberedCount = 0;

          const isActive = activeTarget.section === section && activeTarget.blockId === block.id;
          const markerMeta = block.marker ? MARKER_MAP[block.marker] : null;
          const isSearchMatch =
            searchTerm.trim().length > 0 &&
            searchMatches.some((m) => m.section === section && m.blockId === block.id);
          const isCurrentMatch =
            searchMatches[searchMatchIdx]?.section === section &&
            searchMatches[searchMatchIdx]?.blockId === block.id;

          const indentPx = (block.indent ?? 0) * 20;

          if (block.type === 'divider') {
            return (
              <div
                key={block.id}
                onClick={() => setActiveTarget({ section, blockId: block.id })}
                className={`group relative py-2 flex items-center gap-2 cursor-pointer ${
                  isActive ? 'bg-slate-50 rounded px-1' : ''
                }`}
              >
                <hr className="flex-1 border-t border-slate-300" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBlock(section, block.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600"
                  title="Remove divider"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          if (block.type === 'table' && block.table) {
            return (
              <div
                key={block.id}
                onClick={() => setActiveTarget({ section, blockId: block.id })}
                className={`group relative rounded ${isCurrentMatch ? 'ring-2 ring-amber-400' : ''}`}
              >
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-[11px] font-sans text-slate-400">
                    {block.table.isComparison ? 'Comparison Table' : 'Table'}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveBlock(section, block.id, -1)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(section, block.id, 1)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlock(section, block.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                      title="Delete table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <EditableTable
                  table={block.table}
                  onChange={(updatedTable) => updateBlock(section, block.id, { table: updatedTable })}
                />
              </div>
            );
          }

          const containerStyle: React.CSSProperties = {
            marginLeft: `${indentPx}px`,
            ...(markerMeta
              ? {
                  backgroundColor: markerMeta.bgHex,
                  borderColor: markerMeta.borderHex,
                }
              : {}),
          };

          const textStyleClass =
            block.type === 'heading1'
              ? 'font-academic-sans text-xl font-bold text-slate-900 leading-snug'
              : block.type === 'heading2'
                ? 'font-academic-sans text-[16.5px] font-bold text-[#1E3A5F] leading-snug'
                : block.type === 'heading3'
                  ? 'font-academic-sans text-sm font-semibold text-slate-800 leading-snug'
                  : 'text-[15px] text-slate-800 leading-relaxed';

          return (
            <div
              key={block.id}
              style={containerStyle}
              className={`group relative rounded-md transition-colors ${
                markerMeta
                  ? 'border px-3 py-2'
                  : isActive
                    ? 'bg-slate-50/70 px-2 py-1'
                    : 'px-2 py-0.5 hover:bg-slate-50/50'
              } ${isCurrentMatch ? 'ring-2 ring-amber-400' : isSearchMatch ? 'ring-1 ring-amber-300' : ''}`}
            >
              {/* Block Marker Badge & Reorder Actions */}
              <div className="flex items-center justify-between gap-2 mb-0.5 empty:hidden">
                {markerMeta ? (
                  <ImportanceBadge
                    markerId={markerMeta.id}
                    compact
                    onRemove={() => updateBlock(section, block.id, { marker: null })}
                  />
                ) : (
                  <span />
                )}

                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 font-sans">
                  <button
                    type="button"
                    onClick={() => moveBlock(section, block.id, -1)}
                    className="p-0.5 text-slate-400 hover:text-slate-700"
                    title="Move block up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(section, block.id, 1)}
                    className="p-0.5 text-slate-400 hover:text-slate-700"
                    title="Move block down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(section, block.id)}
                    className="p-0.5 text-slate-400 hover:text-red-600"
                    title="Delete block"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Special UPSC Blocks: Definition, Quote, Fact, Expandable */}
              {block.type === 'definition' && (
                <div className="border border-slate-200 bg-slate-50/80 rounded-md p-2.5 space-y-1">
                  <div className="flex items-center gap-2 font-sans">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F]">
                      Definition
                    </span>
                    <input
                      type="text"
                      value={block.secondaryContent ?? ''}
                      onFocus={() => setActiveTarget({ section, blockId: block.id })}
                      onChange={(e) => updateBlock(section, block.id, { secondaryContent: e.target.value })}
                      placeholder="Term / Concept name..."
                      className="flex-1 bg-transparent text-xs font-semibold text-slate-900 border-b border-transparent focus:border-slate-300 focus:outline-none"
                    />
                  </div>
                  <RichEditableCell
                    blockId={block.id}
                    html={block.content}
                    placeholder="Write precise definition..."
                    className="text-[14.5px] text-slate-800 leading-relaxed"
                    spellCheck={settings.spellCheck}
                    onChange={(html) => updateBlock(section, block.id, { content: html })}
                    onFocus={() => setActiveTarget({ section, blockId: block.id })}
                    registerElement={(el) => {
                      blockElementsRef.current[block.id] = el;
                    }}
                  />
                </div>
              )}

              {block.type === 'fact' && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-md p-2.5 space-y-1">
                  <div className="flex items-center gap-2 font-sans">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      Important Fact
                    </span>
                    <input
                      type="text"
                      value={block.secondaryContent ?? ''}
                      onFocus={() => setActiveTarget({ section, blockId: block.id })}
                      onChange={(e) => updateBlock(section, block.id, { secondaryContent: e.target.value })}
                      placeholder="Fact heading..."
                      className="flex-1 bg-transparent text-xs font-semibold text-slate-900 border-b border-transparent focus:border-amber-300 focus:outline-none"
                    />
                  </div>
                  <RichEditableCell
                    blockId={block.id}
                    html={block.content}
                    placeholder="Enter factual point, article, year, or Prelims trap..."
                    className="text-[14.5px] text-slate-800 leading-relaxed"
                    spellCheck={settings.spellCheck}
                    onChange={(html) => updateBlock(section, block.id, { content: html })}
                    onFocus={() => setActiveTarget({ section, blockId: block.id })}
                    registerElement={(el) => {
                      blockElementsRef.current[block.id] = el;
                    }}
                  />
                </div>
              )}

              {block.type === 'quote' && (
                <div className="border border-slate-200 bg-white rounded-md p-3 space-y-1.5">
                  <RichEditableCell
                    blockId={block.id}
                    html={block.content}
                    placeholder="Enter quote, committee observation, or judicial excerpt..."
                    className="text-[14.5px] italic text-slate-800 leading-relaxed"
                    spellCheck={settings.spellCheck}
                    onChange={(html) => updateBlock(section, block.id, { content: html })}
                    onFocus={() => setActiveTarget({ section, blockId: block.id })}
                    registerElement={(el) => {
                      blockElementsRef.current[block.id] = el;
                    }}
                  />
                  <div className="flex items-center gap-1.5 font-sans text-xs text-slate-500">
                    <span>—</span>
                    <input
                      type="text"
                      value={block.secondaryContent ?? ''}
                      onFocus={() => setActiveTarget({ section, blockId: block.id })}
                      onChange={(e) => updateBlock(section, block.id, { secondaryContent: e.target.value })}
                      placeholder="Attribution / Source / Judgment"
                      className="flex-1 bg-transparent text-xs text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {block.type === 'expandable' && (
                <div className="border border-slate-200 bg-white rounded-md overflow-hidden">
                  <div className="flex items-center gap-2 px-2.5 py-2 bg-slate-50 border-b border-slate-100 font-sans">
                    <button
                      type="button"
                      onClick={() => updateBlock(section, block.id, { isOpen: !block.isOpen })}
                      className="p-0.5 text-slate-600 hover:text-slate-900"
                      aria-label="Toggle expandable section"
                    >
                      {block.isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={block.secondaryContent ?? ''}
                      onFocus={() => setActiveTarget({ section, blockId: block.id })}
                      onChange={(e) => updateBlock(section, block.id, { secondaryContent: e.target.value })}
                      placeholder="Collapsible section title..."
                      className="flex-1 bg-transparent text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                  {block.isOpen !== false && (
                    <div className="p-2.5">
                      <RichEditableCell
                        blockId={block.id}
                        html={block.content}
                        placeholder="Detailed explanation inside expandable section..."
                        className="text-[14.5px] text-slate-800 leading-relaxed"
                        spellCheck={settings.spellCheck}
                        onChange={(html) => updateBlock(section, block.id, { content: html })}
                        onFocus={() => setActiveTarget({ section, blockId: block.id })}
                        registerElement={(el) => {
                          blockElementsRef.current[block.id] = el;
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Standard & List Blocks */}
              {!['definition', 'fact', 'quote', 'expandable'].includes(block.type) && (
                <div className="flex items-start gap-2">
                  {block.type === 'bullet' && (
                    <span className="mt-1.5 text-slate-500 select-none shrink-0 font-sans text-xs">
                      {block.indent === 1 ? '◦' : block.indent === 2 ? '▪' : '•'}
                    </span>
                  )}
                  {block.type === 'numbered' && (
                    <span className="mt-0.5 text-slate-600 select-none shrink-0 font-mono-tabular text-xs font-semibold min-w-[1.2rem]">
                      {numberedCount}.
                    </span>
                  )}
                  {block.type === 'checklist' && (
                    <input
                      type="checkbox"
                      checked={!!block.checked}
                      onChange={(e) => updateBlock(section, block.id, { checked: e.target.checked })}
                      className="mt-1.5 rounded border-slate-300 text-[#1E3A5F] shrink-0 cursor-pointer"
                    />
                  )}
                  <RichEditableCell
                    blockId={block.id}
                    html={block.content}
                    placeholder={index === 0 ? placeholderText : 'Continue writing...'}
                    className={`${textStyleClass} ${
                      block.type === 'checklist' && block.checked ? 'line-through text-slate-400' : ''
                    }`}
                    spellCheck={settings.spellCheck}
                    onChange={(html) => updateBlock(section, block.id, { content: html })}
                    onFocus={() => setActiveTarget({ section, blockId: block.id })}
                    onEnterKey={() => {
                      const isList = ['bullet', 'numbered', 'checklist'].includes(block.type);
                      const plain = stripHtml(block.content);
                      if (isList && !plain) {
                        updateBlock(section, block.id, { type: 'paragraph', indent: 0 });
                      } else {
                        insertBlockAfter(
                          section,
                          block.id,
                          createBlock({
                            type: isList ? block.type : 'paragraph',
                            indent: isList ? block.indent : 0,
                          })
                        );
                      }
                    }}
                    onBackspaceEmpty={() => {
                      if (block.type !== 'paragraph') {
                        updateBlock(section, block.id, { type: 'paragraph', indent: 0 });
                      } else if (blocks.length > 1) {
                        deleteBlock(section, block.id);
                      }
                    }}
                    onTabKey={(shift) => handleIndentActive(shift ? -1 : 1)}
                    registerElement={(el) => {
                      blockElementsRef.current[block.id] = el;
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() =>
            insertBlockAfter(section, blocks[blocks.length - 1]?.id ?? null, createBlock({ type: 'paragraph' }))
          }
          className="font-sans inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#1E3A5F] py-1 px-2 rounded hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add block
        </button>
      </div>
    );
  };

  const handleAddTag = () => {
    const clean = tagInput.trim();
    if (!clean) return;
    if (!note.tags.includes(clean)) {
      commitChange((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setTagInput('');
  };

  const activeBlockObj =
    note[activeTarget.section].find((b) => b.id === activeTarget.blockId) ?? null;

  return (
    <div className={`flex flex-col h-full bg-[#F8FAFC] ${isFullscreen ? 'fixed inset-0 z-40' : ''}`}>
      {/* Editor Top Action Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
            <span className="font-medium text-slate-700">
              {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular hidden sm:inline">
              {note.wordCount} words
            </span>
            <span className="hidden md:inline" aria-hidden="true">·</span>
            <span className="hidden md:inline text-slate-400">
              Last saved {formatDateTime(lastSavedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSearch((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border whitespace-nowrap ${
              showSearch
                ? 'bg-[#EFF4FA] border-[#1E3A5F] text-[#1E3A5F]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Search within note (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
            Find
          </button>

          <button
            type="button"
            onClick={() => onQuickRevise(note, note.revision.intervalDays || 3)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 whitespace-nowrap"
            title="Mark this note as revised today"
          >
            <Check className="w-3.5 h-3.5" />
            Mark Revised
          </button>

          <button
            type="button"
            onClick={() =>
              commitChange((prev) => ({ ...prev, isBookmarked: !prev.isBookmarked }))
            }
            className={`p-1.5 rounded border ${
              note.isBookmarked
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={note.isBookmarked ? 'Remove bookmark' : 'Bookmark note'}
            aria-label="Toggle bookmark"
          >
            <Bookmark className="w-3.5 h-3.5" fill={note.isBookmarked ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(note)}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Duplicate note"
            aria-label="Duplicate note"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onArchiveToggle(note)}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title={note.isArchived ? 'Restore from archive' : 'Archive note'}
            aria-label="Archive toggle"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteRequest(note)}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-200"
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title={isFullscreen ? 'Exit distraction-free mode (Esc)' : 'Distraction-free full screen'}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onOpenPrintModal(note)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* In-note Search Bar */}
      {showSearch && (
        <div className="bg-amber-50/70 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs shrink-0">
          <Search className="w-3.5 h-3.5 text-amber-700" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSearchMatchIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') jumpToSearchMatch(searchMatchIdx + (e.shiftKey ? -1 : 1));
            }}
            placeholder="Search inside Cues, Main Notes, Tables, and Summary..."
            className="bg-white border border-amber-300 rounded px-2.5 py-1 text-xs w-72 focus:outline-none focus:border-[#1E3A5F]"
          />
          <span className="font-mono-tabular text-slate-600">
            {searchTerm
              ? searchMatches.length > 0
                ? `${searchMatchIdx + 1} of ${searchMatches.length} blocks`
                : '0 matches'
              : ''}
          </span>
          {searchMatches.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => jumpToSearchMatch(searchMatchIdx - 1)}
                className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => jumpToSearchMatch(searchMatchIdx + 1)}
                className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
            className="ml-auto p-1 text-slate-500 hover:text-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Rich Text & UPSC Marker Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center gap-1 shrink-0">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className="p-1.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-35"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={!canRedo}
          className="p-1.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-35"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Inline formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyInlineFormat('bold')}
          className="p-1.5 rounded text-slate-700 hover:bg-slate-100"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyInlineFormat('italic')}
          className="p-1.5 rounded text-slate-700 hover:bg-slate-100"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyInlineFormat('underline')}
          className="p-1.5 rounded text-slate-700 hover:bg-slate-100"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Headings & Paragraph */}
        <button
          type="button"
          onClick={() => changeActiveBlockType('paragraph')}
          className={`px-2 py-1 text-[11px] font-medium rounded ${
            activeBlockObj?.type === 'paragraph' ? 'bg-[#EFF4FA] text-[#1E3A5F]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Normal Paragraph"
        >
          Text
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('heading1')}
          className={`p-1.5 rounded ${
            activeBlockObj?.type === 'heading1' ? 'bg-[#EFF4FA] text-[#1E3A5F]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('heading2')}
          className={`p-1.5 rounded ${
            activeBlockObj?.type === 'heading2' ? 'bg-[#EFF4FA] text-[#1E3A5F]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('heading3')}
          className={`p-1.5 rounded ${
            activeBlockObj?.type === 'heading3' ? 'bg-[#EFF4FA] text-[#1E3A5F]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Lists & Indent */}
        <button
          type="button"
          onClick={() => changeActiveBlockType('bullet')}
          className={`p-1.5 rounded ${
            activeBlockObj?.type === 'bullet' ? 'bg-[#EFF4FA] text-[#1E3A5F]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('numbered')}
          className={`p-1.5 rounded ${
            activeBlockObj?.type === 'numbered' ? 'bg-[#EFF4FA] text-[#1E3A5F]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('checklist')}
          className={`p-1.5 rounded ${
            activeBlockObj?.type === 'checklist' ? 'bg-[#EFF4FA] text-[#1E3A5F]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Checklist"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleIndentActive(-1)}
          className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
          title="Outdent (Shift+Tab)"
        >
          <Outdent className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleIndentActive(1)}
          className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
          title="Indent / Nest (Tab)"
        >
          <Indent className="w-3.5 h-3.5" />
        </button>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Academic Blocks */}
        <button
          type="button"
          onClick={() => changeActiveBlockType('definition')}
          className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded whitespace-nowrap"
          title="Insert Definition Block"
        >
          + Definition
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('fact')}
          className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded whitespace-nowrap"
          title="Insert Important Fact Block"
        >
          + Fact
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('quote')}
          className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
          title="Insert Quote Block"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('expandable')}
          className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded whitespace-nowrap"
          title="Insert Expandable / Collapsible Section"
        >
          + Expandable
        </button>
        <button
          type="button"
          onClick={() => changeActiveBlockType('divider')}
          className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
          title="Insert Horizontal Divider"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Tables & Comparison Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTableMenu((v) => !v);
              setShowTemplateMenu(false);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded whitespace-nowrap"
          >
            <Table2 className="w-3.5 h-3.5 text-[#1E3A5F]" />
            + Table / Compare
            <ChevronDown className="w-3 h-3" />
          </button>
          {showTableMenu && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-md shadow-lg z-30 py-1.5">
              <button
                type="button"
                onClick={() => insertCustomTable(3, 3)}
                className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Insert Custom 3×3 Table</span>
                <Plus className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => insertCustomTable(2, 4)}
                className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Insert 2-Column Side-by-Side Table</span>
                <Plus className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <div className="my-1 border-t border-slate-100" />
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                UPSC Comparison Templates
              </div>
              {COMPARISON_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => insertComparisonTemplate(tpl.key)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-[#EFF4FA] hover:text-[#1E3A5F]"
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* One-Click Note Template Applier */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTemplateMenu((v) => !v);
              setShowTableMenu(false);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#1E3A5F] bg-[#EFF4FA] hover:bg-slate-200/70 rounded whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            UPSC Templates
            <ChevronDown className="w-3 h-3" />
          </button>
          {showTemplateMenu && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-md shadow-lg z-30 py-1.5 max-h-80 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Append UPSC Section Structure
              </div>
              {NOTE_TEMPLATES.filter((t) => t.id !== 'blank').map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyNoteTemplate(tpl.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                >
                  <div className="text-xs font-semibold text-slate-800">{tpl.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{tpl.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Colour-Coded UPSC Importance Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 mr-1">
            <Highlighter className="w-3.5 h-3.5" />
            Marker:
          </span>

          <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 mr-1">
            <button
              type="button"
              onClick={() => setHighlightMode('selection')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                highlightMode === 'selection'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Selected Text
            </button>
            <button
              type="button"
              onClick={() => setHighlightMode('block')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                highlightMode === 'block'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Whole Block
            </button>
          </div>

          {IMPORTANCE_MARKERS.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyImportanceMarker(m.id)}
              title={m.description}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded border transition-transform active:scale-95 whitespace-nowrap"
              style={{
                backgroundColor: m.bgHex,
                borderColor: m.borderHex,
                color: m.textHex,
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: m.dotHex }}
                aria-hidden="true"
              />
              {m.label}
            </button>
          ))}

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyImportanceMarker(null)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 whitespace-nowrap"
            title="Remove marker from selection or active block"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowLegend(true)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1E3A5F] hover:underline whitespace-nowrap"
        >
          <Info className="w-3.5 h-3.5" />
          Colour Legend
        </button>
      </div>

      {/* Main Scrollable Cornell Notebook Sheet */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
          {/* Note Title & Metadata Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <input
                type="text"
                value={note.title}
                onChange={(e) => commitChange((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter Note Title (e.g., Parliamentary Privileges — Article 105 & 194)"
                className="w-full text-xl sm:text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowMeta((s) => !s)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap shrink-0 mt-1"
              >
                {showMeta ? 'Hide metadata' : 'Show metadata'}
              </button>
            </div>

            {showMeta && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Subject
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={note.subject}
                        onChange={(e) =>
                          commitChange((prev) => ({ ...prev, subject: e.target.value }))
                        }
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#1E3A5F]"
                      >
                        {allSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewSubjectInput((v) => !v)}
                        className="px-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                        title="Add custom subject"
                      >
                        +
                      </button>
                    </div>
                    {showNewSubjectInput && (
                      <div className="flex gap-1 mt-1">
                        <input
                          type="text"
                          value={newSubjectInput}
                          onChange={(e) => setNewSubjectInput(e.target.value)}
                          placeholder="New subject..."
                          className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const s = newSubjectInput.trim();
                            if (s) {
                              onAddCustomSubject(s);
                              commitChange((prev) => ({ ...prev, subject: s }));
                              setNewSubjectInput('');
                              setShowNewSubjectInput(false);
                            }
                          }}
                          className="px-2 py-1 bg-[#1E3A5F] text-white rounded text-xs"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Exam Relevance
                    </label>
                    <div className="grid grid-cols-3 border border-slate-200 rounded overflow-hidden bg-white">
                      {(['Prelims', 'Mains', 'Both'] as ExamRelevance[]).map((rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => commitChange((prev) => ({ ...prev, relevance: rel }))}
                          className={`py-1.5 text-xs font-medium transition-colors ${
                            note.relevance === rel
                              ? 'bg-[#1E3A5F] text-white'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={note.topic}
                      onChange={(e) => commitChange((prev) => ({ ...prev, topic: e.target.value }))}
                      placeholder="e.g., Parliament & State Legislatures"
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Subtopic
                    </label>
                    <input
                      type="text"
                      value={note.subtopic}
                      onChange={(e) =>
                        commitChange((prev) => ({ ...prev, subtopic: e.target.value }))
                      }
                      placeholder="e.g., Parliamentary Committees"
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A5F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end text-xs">
                  <div className="lg:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Source / Reference
                    </label>
                    <input
                      type="text"
                      value={note.source}
                      onChange={(e) => commitChange((prev) => ({ ...prev, source: e.target.value }))}
                      placeholder="e.g., Laxmikanth Ch. 22, The Hindu (12 Nov), PIB"
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A5F]"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Tags
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag & press Enter..."
                        className="flex-1 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A5F]"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 border border-slate-200 rounded hover:bg-slate-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex items-center justify-between sm:justify-end gap-3 text-[11px] text-slate-500 pb-1">
                    <span>Created {formatDateTime(note.createdAt).split(',')[0]}</span>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={note.isDifficult}
                        onChange={(e) =>
                          commitChange((prev) => ({ ...prev, isDifficult: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#1E3A5F]"
                      />
                      Difficult topic
                    </label>
                  </div>
                </div>

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {note.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 text-xs text-slate-700">
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() =>
                            commitChange((prev) => ({
                              ...prev,
                              tags: prev.tags.filter((x) => x !== t),
                            }))
                          }
                          className="text-slate-400 hover:text-red-600"
                          aria-label={`Remove tag ${t}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Classic Resizable Cornell Two-Column Workspace */}
          <div
            ref={columnsContainerRef}
            className="flex flex-col md:flex-row border-b border-slate-200 min-h-[460px]"
          >
            {/* LEFT COLUMN — CUES & QUESTIONS */}
            <div
              style={{ '--cues-width': `${note.cuesRatio}%` } as React.CSSProperties}
              className="w-full md:w-[var(--cues-width)] shrink-0 p-4 sm:p-5 bg-slate-50/50 border-b md:border-b-0 border-slate-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Cues & Questions
                </span>
                <span className="text-[11px] font-mono-tabular text-slate-400 hidden md:inline">
                  {note.cuesRatio}%
                </span>
              </div>
              {renderBlockSection(
                'cuesBlocks',
                note.cuesBlocks,
                'Keywords, recall prompts, potential UPSC questions...'
              )}
            </div>

            {/* DRAGGABLE COLUMN DIVIDER */}
            <div
              onMouseDown={handleStartColumnResize}
              title="Drag to resize Cues & Main Notes columns"
              className="hidden md:flex w-2 bg-slate-100 hover:bg-[#1E3A5F]/20 border-x border-slate-200 cursor-col-resize items-center justify-center shrink-0 transition-colors"
            >
              <GripVertical className="w-3 h-3 text-slate-400" />
            </div>

            {/* RIGHT COLUMN — MAIN NOTES */}
            <div className="flex-1 min-w-0 p-4 sm:p-6 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F]">
                  Main Notes
                </span>
                <span className="text-[11px] text-slate-400">
                  Concepts, articles, committees, case studies, tables
                </span>
              </div>
              {renderBlockSection(
                'notesBlocks',
                note.notesBlocks,
                'Start writing detailed study notes, facts, constitutional provisions...'
              )}
            </div>
          </div>

          {/* BOTTOM SECTION — SUMMARY */}
          <div className="p-4 sm:p-6 bg-slate-50/40">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F]">
                Summary & Key Takeaways
              </span>
              <span className="text-[11px] text-slate-400">
                Concise 30-second revision conclusions
              </span>
            </div>
            {renderBlockSection(
              'summaryBlocks',
              note.summaryBlocks,
              'Synthesize key takeaways and quick revision points here...'
            )}
          </div>
        </div>
      </div>

      <ColourLegendModal isOpen={showLegend} onClose={() => setShowLegend(false)} />
    </div>
  );
};
