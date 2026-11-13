export type NavSection =
  | 'dashboard'
  | 'notes'
  | 'create'
  | 'subjects'
  | 'revision'
  | 'comparisons'
  | 'prelims'
  | 'mains'
  | 'bookmarks'
  | 'archive'
  | 'settings';

export type ExamRelevance = 'Prelims' | 'Mains' | 'Both';

export type ImportanceMarkerId =
  | 'very-important'
  | 'important'
  | 'prelims-fact'
  | 'mains-value'
  | 'conceptual'
  | 'revision-required';

export interface ImportanceMarkerMeta {
  id: ImportanceMarkerId;
  label: string;
  shortLabel: string;
  description: string;
  bgHex: string;
  borderHex: string;
  textHex: string;
  dotHex: string;
  printBgHex: string;
}

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet'
  | 'numbered'
  | 'checklist'
  | 'definition'
  | 'quote'
  | 'fact'
  | 'expandable'
  | 'divider'
  | 'table';

export interface TableData {
  headers: string[];
  rows: string[][];
  colWidths: number[]; // percentages summing to 100
  hasHeader: boolean;
  isComparison: boolean;
  caption?: string;
}

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: string; // sanitized inline HTML (b, i, u, mark)
  secondaryContent?: string; // term for definition, author for quote, title for fact/expandable
  indent?: number; // 0, 1, 2
  checked?: boolean;
  isOpen?: boolean;
  marker?: ImportanceMarkerId | null;
  table?: TableData;
}

export interface RevisionHistoryEntry {
  id: string;
  date: string;
  intervalDays: number | null;
  note?: string;
}

export interface RevisionState {
  lastRevisedAt: string | null;
  nextRevisionAt: string | null;
  intervalDays: number | null;
  count: number;
  history: RevisionHistoryEntry[];
}

export interface CornellNote {
  id: string;
  title: string;
  subject: string;
  folderId?: string;
  topic: string;
  subtopic: string;
  source: string;
  tags: string[];
  relevance: ExamRelevance;
  templateUsed?: string;
  createdAt: string;
  updatedAt: string;
  cuesRatio: number; // percentage for left column (20 - 45)
  cuesBlocks: NoteBlock[];
  notesBlocks: NoteBlock[];
  summaryBlocks: NoteBlock[];
  isBookmarked: boolean;
  isArchived: boolean;
  isDifficult: boolean;
  revision: RevisionState;
  wordCount: number;
}

export interface StandaloneComparison {
  id: string;
  title: string;
  subject: string;
  relevance: ExamRelevance;
  templateKey?: string;
  createdAt: string;
  updatedAt: string;
  table: TableData;
  notes?: string;
}

export interface CustomFolder {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
}

export interface AppSettings {
  id: 'user-settings';
  defaultCuesRatio: number;
  editorFont: 'serif' | 'sans';
  spellCheck: boolean;
  printBlackAndWhite: boolean;
  printIncludeSummary: boolean;
  printIncludeSources: boolean;
  customSubjects: string[];
  folders: CustomFolder[];
}

export type PrintLayoutMode =
  | 'complete'
  | 'cornell'
  | 'main-only'
  | 'revision-sheet'
  | 'comparisons-only';

export interface PrintOptions {
  layout: PrintLayoutMode;
  blackAndWhite: boolean;
  includeSummary: boolean;
  includeSources: boolean;
}

export type EditorSectionKey = 'cuesBlocks' | 'notesBlocks' | 'summaryBlocks';
