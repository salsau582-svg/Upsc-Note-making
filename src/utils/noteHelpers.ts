import {
  CornellNote,
  ExamRelevance,
  ImportanceMarkerId,
  NoteBlock,
} from '../types/note';
import { createBlock, createId, DEFAULT_UPSC_SUBJECTS, NOTE_TEMPLATES } from '../constants/upsc';

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

export function sanitizeInlineHtml(html: string): string {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(walk).join('');

    if (tag === 'b' || tag === 'strong') return `<b>${inner}</b>`;
    if (tag === 'i' || tag === 'em') return `<i>${inner}</i>`;
    if (tag === 'u') return `<u>${inner}</u>`;
    if (tag === 'br') return '<br>';
    if (tag === 'mark') {
      const marker = el.getAttribute('data-marker');
      if (marker) return `<mark data-marker="${marker}">${inner}</mark>`;
      return inner;
    }
    if (tag === 'span') {
      const marker = el.getAttribute('data-marker');
      if (marker) return `<mark data-marker="${marker}">${inner}</mark>`;
      return inner;
    }
    if (tag === 'div' || tag === 'p') {
      return inner ? `${inner}<br>` : '';
    }
    return inner;
  };

  let result = Array.from(root.childNodes).map(walk).join('');
  result = result.replace(/(<br>)+$/g, '');
  return result;
}

function blocksText(blocks: NoteBlock[]): string {
  return blocks
    .map((b) => {
      const parts = [stripHtml(b.content), stripHtml(b.secondaryContent ?? '')];
      if (b.table) {
        parts.push(...b.table.headers.map(stripHtml));
        b.table.rows.forEach((r) => parts.push(...r.map(stripHtml)));
      }
      return parts.join(' ');
    })
    .join(' ');
}

export function computeWordCount(note: Pick<CornellNote, 'title' | 'cuesBlocks' | 'notesBlocks' | 'summaryBlocks'>): number {
  const fullText = [
    note.title,
    blocksText(note.cuesBlocks),
    blocksText(note.notesBlocks),
    blocksText(note.summaryBlocks),
  ]
    .join(' ')
    .trim();
  if (!fullText) return 0;
  return fullText.split(/\s+/).filter(Boolean).length;
}

export function extractNoteMarkers(note: CornellNote): ImportanceMarkerId[] {
  const found = new Set<ImportanceMarkerId>();
  const allBlocks = [...note.cuesBlocks, ...note.notesBlocks, ...note.summaryBlocks];
  const validIds: ImportanceMarkerId[] = [
    'very-important',
    'important',
    'prelims-fact',
    'mains-value',
    'conceptual',
    'revision-required',
  ];

  for (const block of allBlocks) {
    if (block.marker && validIds.includes(block.marker)) {
      found.add(block.marker);
    }
    const html = `${block.content ?? ''} ${block.secondaryContent ?? ''}`;
    for (const id of validIds) {
      if (html.includes(`data-marker="${id}"`)) {
        found.add(id);
      }
    }
  }
  return Array.from(found);
}

export function noteMatchesQuery(note: CornellNote, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [
    note.title,
    note.subject,
    note.topic,
    note.subtopic,
    note.source,
    note.tags.join(' '),
    blocksText(note.cuesBlocks),
    blocksText(note.notesBlocks),
    blocksText(note.summaryBlocks),
  ];
  return haystacks.some((h) => h.toLowerCase().includes(q));
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return 'Not set';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isRevisionDue(note: CornellNote): boolean {
  if (note.isArchived) return false;
  if (!note.revision.nextRevisionAt) return false;
  const nextDate = new Date(note.revision.nextRevisionAt);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return nextDate.getTime() <= endOfToday.getTime();
}

export function isNotRevisedRecently(note: CornellNote, thresholdDays = 14): boolean {
  if (note.isArchived) return false;
  const referenceIso = note.revision.lastRevisedAt ?? note.updatedAt;
  const diffDays = (Date.now() - new Date(referenceIso).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= thresholdDays;
}

export function createNewNote(options?: {
  subject?: string;
  relevance?: ExamRelevance;
  templateId?: string;
  cuesRatio?: number;
  folderId?: string;
}): CornellNote {
  const now = new Date().toISOString();
  const tpl = NOTE_TEMPLATES.find((t) => t.id === options?.templateId) ?? NOTE_TEMPLATES[0];
  const note: CornellNote = {
    id: createId('note'),
    title: '',
    subject: options?.subject || tpl.defaultSubject || DEFAULT_UPSC_SUBJECTS[0],
    folderId: options?.folderId,
    topic: '',
    subtopic: '',
    source: '',
    tags: [],
    relevance: options?.relevance || tpl.relevance || 'Both',
    templateUsed: tpl.id,
    createdAt: now,
    updatedAt: now,
    cuesRatio: options?.cuesRatio ?? 30,
    cuesBlocks: tpl.cuesBlocks(),
    notesBlocks: tpl.notesBlocks(),
    summaryBlocks: tpl.summaryBlocks(),
    isBookmarked: false,
    isArchived: false,
    isDifficult: false,
    revision: {
      lastRevisedAt: null,
      nextRevisionAt: null,
      intervalDays: 3,
      count: 0,
      history: [],
    },
    wordCount: 0,
  };
  if (note.cuesBlocks.length === 0) {
    note.cuesBlocks = [createBlock({ type: 'paragraph', content: '' })];
  }
  if (note.notesBlocks.length === 0) {
    note.notesBlocks = [createBlock({ type: 'paragraph', content: '' })];
  }
  if (note.summaryBlocks.length === 0) {
    note.summaryBlocks = [createBlock({ type: 'paragraph', content: '' })];
  }
  note.wordCount = computeWordCount(note);
  return note;
}

export function duplicateCornellNote(source: CornellNote): CornellNote {
  const now = new Date().toISOString();
  const clone: CornellNote = JSON.parse(JSON.stringify(source));
  clone.id = createId('note');
  clone.title = `${source.title || 'Untitled Note'} (Copy)`;
  clone.createdAt = now;
  clone.updatedAt = now;
  clone.isArchived = false;
  clone.revision = {
    lastRevisedAt: null,
    nextRevisionAt: null,
    intervalDays: source.revision.intervalDays ?? 3,
    count: 0,
    history: [],
  };
  return clone;
}
