import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CornellNote,
  ImportanceMarkerId,
  NoteBlock,
  PrintOptions,
  TableData,
} from '../types/note';
import { MARKER_MAP } from '../constants/upsc';
import { formatDateShort, stripHtml } from './noteHelpers';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function decodeHtmlText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<mark[^>]*data-marker="([^"]+)"[^>]*>([\s\S]*?)<\/mark>/gi, (_m, markerId, inner) => {
      const meta = MARKER_MAP[markerId as ImportanceMarkerId];
      const cleanInner = stripHtml(inner);
      return meta ? `[${meta.shortLabel}: ${cleanInner}]` : cleanInner;
    })
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function getFilteredRevisionBlocks(blocks: NoteBlock[]): NoteBlock[] {
  return blocks.filter(
    (b) =>
      b.marker !== null &&
      b.marker !== undefined ||
      b.type === 'fact' ||
      b.type === 'definition' ||
      b.type === 'table' ||
      (b.content && b.content.includes('data-marker='))
  );
}

function renderBlockStackToPdf(
  doc: jsPDF,
  blocks: NoteBlock[],
  x: number,
  startY: number,
  width: number,
  pageBottom: number,
  topMargin: number,
  bw: boolean,
  onNewPage?: () => void
): number {
  let y = startY;
  let numberedCounter = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageBottom) {
      doc.addPage();
      y = topMargin;
      onNewPage?.();
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'numbered') {
      numberedCounter += 1;
    } else {
      numberedCounter = 0;
    }

    if (block.type === 'divider') {
      ensureSpace(6);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(x, y + 2, x + width, y + 2);
      y += 6;
      continue;
    }

    if (block.type === 'table' && block.table) {
      ensureSpace(22);
      const t = block.table;
      if (t.caption) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(stripHtml(t.caption), x, y + 3);
        y += 5;
      }

      const colStyles: Record<number, { cellWidth: number }> = {};
      if (t.colWidths && t.colWidths.length === t.headers.length) {
        t.colWidths.forEach((pct, idx) => {
          colStyles[idx] = { cellWidth: (width * pct) / 100 };
        });
      }

      autoTable(doc, {
        startY: y,
        margin: { left: x, right: doc.internal.pageSize.getWidth() - (x + width), top: topMargin, bottom: 18 },
        tableWidth: width,
        head: t.hasHeader ? [t.headers.map((h) => decodeHtmlText(h) || ' ')] : undefined,
        body: t.rows.map((r) => r.map((c) => decodeHtmlText(c) || ' ')),
        columnStyles: colStyles,
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 2.2,
          textColor: [30, 41, 59],
          lineColor: [203, 213, 225],
          lineWidth: 0.25,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: bw ? [226, 232, 240] : [30, 58, 95],
          textColor: bw ? [15, 23, 42] : [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        rowPageBreak: 'avoid',
      });

      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 15;
      y = finalY + 4;
      continue;
    }

    const markerMeta = block.marker ? MARKER_MAP[block.marker] : null;
    const indentPx = (block.indent ?? 0) * 5;
    const effectiveX = x + indentPx;
    const effectiveWidth = Math.max(25, width - indentPx);

    let prefix = '';
    let fontSize = 9.5;
    let fontStyle: 'normal' | 'bold' | 'italic' = 'normal';
    let textColor: [number, number, number] = [30, 41, 59];

    if (block.type === 'heading1') {
      fontSize = 12.5;
      fontStyle = 'bold';
      textColor = bw ? [15, 23, 42] : [30, 58, 95];
    } else if (block.type === 'heading2') {
      fontSize = 11;
      fontStyle = 'bold';
      textColor = bw ? [15, 23, 42] : [30, 58, 95];
    } else if (block.type === 'heading3') {
      fontSize = 10;
      fontStyle = 'bold';
      textColor = [51, 65, 85];
    } else if (block.type === 'bullet') {
      prefix = block.indent === 1 ? '◦  ' : block.indent === 2 ? '▪  ' : '•  ';
    } else if (block.type === 'numbered') {
      prefix = `${numberedCounter}.  `;
    } else if (block.type === 'checklist') {
      prefix = block.checked ? '[x]  ' : '[ ]  ';
    } else if (block.type === 'quote') {
      fontStyle = 'italic';
    }

    const primaryText = decodeHtmlText(block.content);
    const secondaryText = decodeHtmlText(block.secondaryContent ?? '');

    if (!primaryText && !secondaryText && !markerMeta) {
      y += 3;
      continue;
    }

    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);

    const bodyLineHeight = fontSize * 0.43;
    const innerPad = markerMeta || ['definition', 'quote', 'fact', 'expandable'].includes(block.type) ? 2.5 : 0;
    const wrapWidth = effectiveWidth - innerPad * 2;

    const titleLine =
      block.type === 'definition'
        ? `Definition — ${secondaryText || 'Term'}`
        : block.type === 'fact'
          ? `Important Fact — ${secondaryText || 'Key Point'}`
          : block.type === 'expandable'
            ? `Section: ${secondaryText || 'Details'}`
            : block.type === 'quote' && secondaryText
              ? `Quote (${secondaryText})`
              : '';

    const markerLine = markerMeta ? `[${markerMeta.shortLabel}]` : '';
    const contentText = `${prefix}${primaryText}`;
    const wrappedLines: string[] = contentText ? doc.splitTextToSize(contentText, wrapWidth) : [];

    const headerExtra = (markerLine ? 4.2 : 0) + (titleLine ? 4.5 : 0);
    const totalHeight = headerExtra + Math.max(wrappedLines.length, 1) * bodyLineHeight + innerPad * 2 + 1.5;

    // Prevent headings from being orphaned at the bottom of the page
    const minSpace = ['heading1', 'heading2', 'heading3'].includes(block.type) ? totalHeight + 12 : totalHeight;
    ensureSpace(minSpace);

    if (markerMeta || ['definition', 'quote', 'fact', 'expandable'].includes(block.type)) {
      if (markerMeta && !bw) {
        const [r, g, b] = hexToRgb(markerMeta.printBgHex);
        const [br, bg, bb] = hexToRgb(markerMeta.borderHex);
        doc.setFillColor(r, g, b);
        doc.setDrawColor(br, bg, bb);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(148, 163, 184);
      }
      doc.setLineWidth(0.3);
      doc.roundedRect(effectiveX, y, effectiveWidth, totalHeight - 1, 1.2, 1.2, 'FD');
    }

    let cursorY = y + innerPad + 3.2;

    if (markerLine) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      if (markerMeta && !bw) {
        const [tr, tg, tb] = hexToRgb(markerMeta.textHex);
        doc.setTextColor(tr, tg, tb);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(markerLine, effectiveX + innerPad, cursorY);
      cursorY += 4;
    }

    if (titleLine) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(15, 23, 42);
      doc.text(titleLine, effectiveX + innerPad, cursorY);
      cursorY += 4.3;
    }

    if (wrappedLines.length > 0) {
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(...textColor);
      wrappedLines.forEach((line) => {
        doc.text(line, effectiveX + innerPad, cursorY);
        cursorY += bodyLineHeight;
      });
    }

    y += totalHeight + 1.5;
  }

  return y;
}

function drawNoteHeaderOnPdf(
  doc: jsPDF,
  note: CornellNote,
  margin: number,
  contentWidth: number,
  options: PrintOptions,
  subtitleLabel?: string
): number {
  let y = margin;
  const bw = options.blackAndWhite;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(bw ? 51 : 30, bw ? 65 : 58, bw ? 85 : 95);
  const topLine = [note.subject.toUpperCase(), note.relevance.toUpperCase(), subtitleLabel]
    .filter(Boolean)
    .join('  ·  ');
  doc.text(topLine, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Updated: ${formatDateShort(note.updatedAt)}`, margin + contentWidth, y, { align: 'right' });
  y += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(15, 23, 42);
  const titleLines: string[] = doc.splitTextToSize(note.title || 'Untitled UPSC Cornell Note', contentWidth);
  titleLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 6.2;
  });

  const metaItems: string[] = [];
  if (note.topic) metaItems.push(`Topic: ${note.topic}`);
  if (note.subtopic) metaItems.push(`Subtopic: ${note.subtopic}`);
  if (note.tags.length > 0) metaItems.push(`Tags: ${note.tags.join(', ')}`);
  if (options.includeSources && note.source) metaItems.push(`Source: ${note.source}`);

  if (metaItems.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const metaLines: string[] = doc.splitTextToSize(metaItems.join('   |   '), contentWidth);
    metaLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 4;
    });
  }

  y += 1.5;
  doc.setDrawColor(bw ? 51 : 30, bw ? 65 : 58, bw ? 85 : 95);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  return y + 5;
}

function addPageFooters(doc: jsPDF, footerTitle: string) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(footerTitle.slice(0, 80), 14, pageHeight - 8.5);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, pageHeight - 8.5, { align: 'right' });
  }
}

export function exportNoteToPdf(note: CornellNote, options: PrintOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const pageBottom = pageHeight - 18;
  const bw = options.blackAndWhite;

  if (options.layout === 'comparisons-only') {
    const startY = drawNoteHeaderOnPdf(doc, note, margin, contentWidth, options, 'Comparison Tables');
    const tableBlocks = [...note.cuesBlocks, ...note.notesBlocks, ...note.summaryBlocks].filter(
      (b) => b.type === 'table' && b.table
    );
    if (tableBlocks.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No tables found in this note.', margin, startY + 6);
    } else {
      renderBlockStackToPdf(doc, tableBlocks, margin, startY, contentWidth, pageBottom, margin, bw);
    }
    addPageFooters(doc, `${note.subject} — ${note.title || 'Cornell Note'}`);
    doc.save(`${(note.title || 'upsc-note').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}-tables.pdf`);
    return;
  }

  if (options.layout === 'main-only') {
    let y = drawNoteHeaderOnPdf(doc, note, margin, contentWidth, options, 'Main Notes');
    y = renderBlockStackToPdf(doc, note.notesBlocks, margin, y, contentWidth, pageBottom, margin, bw);
    if (options.includeSummary && note.summaryBlocks.some((b) => stripHtml(b.content))) {
      if (y + 18 > pageBottom) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(148, 163, 184);
      doc.line(margin, y, margin + contentWidth, y);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(bw ? 15 : 30, bw ? 23 : 58, bw ? 42 : 95);
      doc.text('SUMMARY & KEY TAKEAWAYS', margin, y);
      y += 5;
      renderBlockStackToPdf(doc, note.summaryBlocks, margin, y, contentWidth, pageBottom, margin, bw);
    }
    addPageFooters(doc, `${note.subject} — ${note.title || 'Cornell Note'}`);
    doc.save(`${(note.title || 'upsc-note').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.pdf`);
    return;
  }

  if (options.layout === 'revision-sheet') {
    let y = drawNoteHeaderOnPdf(doc, note, margin, contentWidth, options, 'Quick Revision Sheet');
    const cues = note.cuesBlocks;
    const importantNotes = getFilteredRevisionBlocks(note.notesBlocks);

    if (cues.some((b) => stripHtml(b.content))) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(bw ? 15 : 30, bw ? 23 : 58, bw ? 42 : 95);
      doc.text('CUES & RECALL PROMPTS', margin, y);
      y += 4.5;
      y = renderBlockStackToPdf(doc, cues, margin, y, contentWidth, pageBottom, margin, bw);
      y += 3;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(bw ? 15 : 30, bw ? 23 : 58, bw ? 42 : 95);
    doc.text('HIGH-PRIORITY FACTS & MARKED CONTENT', margin, y);
    y += 4.5;
    const targetNotes = importantNotes.length > 0 ? importantNotes : note.notesBlocks;
    y = renderBlockStackToPdf(doc, targetNotes, margin, y, contentWidth, pageBottom, margin, bw);

    if (options.includeSummary && note.summaryBlocks.some((b) => stripHtml(b.content))) {
      if (y + 18 > pageBottom) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(148, 163, 184);
      doc.line(margin, y, margin + contentWidth, y);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('SUMMARY', margin, y);
      y += 4.5;
      renderBlockStackToPdf(doc, note.summaryBlocks, margin, y, contentWidth, pageBottom, margin, bw);
    }

    addPageFooters(doc, `${note.subject} — Revision Sheet: ${note.title || 'Cornell Note'}`);
    doc.save(`${(note.title || 'upsc-note').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}-revision.pdf`);
    return;
  }

  // Classic Cornell 2-Column Layout ('complete' or 'cornell')
  const headerBottomY = drawNoteHeaderOnPdf(
    doc,
    note,
    margin,
    contentWidth,
    options,
    options.layout === 'cornell' ? 'Cornell Study Sheet' : 'Complete Cornell Note'
  );

  const ratio = Math.min(42, Math.max(24, note.cuesRatio || 30)) / 100;
  const gap = 5;
  const cuesWidth = contentWidth * ratio - gap / 2;
  const notesX = margin + cuesWidth + gap;
  const notesWidth = contentWidth - cuesWidth - gap;
  const dividerX = margin + cuesWidth + gap / 2;

  // Column labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CUES & QUESTIONS', margin, headerBottomY);
  doc.text('MAIN NOTES', notesX, headerBottomY);
  const colsStartY = headerBottomY + 4;

  // Render Cues first, tracking pages it spans
  const cuesStartPage = doc.getCurrentPageInfo().pageNumber;
  const cuesEndY = renderBlockStackToPdf(
    doc,
    note.cuesBlocks,
    margin,
    colsStartY,
    cuesWidth,
    pageBottom,
    margin,
    bw
  );
  const cuesEndPage = doc.getCurrentPageInfo().pageNumber;

  // Return to cuesStartPage to render Main Notes in the right column
  doc.setPage(cuesStartPage);
  const notesEndY = renderBlockStackToPdf(
    doc,
    note.notesBlocks,
    notesX,
    colsStartY,
    notesWidth,
    pageBottom,
    margin,
    bw
  );
  const notesEndPage = doc.getCurrentPageInfo().pageNumber;

  const maxPage = Math.max(cuesEndPage, notesEndPage);

  // Draw vertical Cornell divider line on pages spanning the columns
  for (let p = cuesStartPage; p <= maxPage; p++) {
    doc.setPage(p);
    const lineTop = p === cuesStartPage ? headerBottomY - 2 : margin;
    const lineBottom =
      p < maxPage
        ? pageBottom
        : Math.max(
            p === cuesEndPage ? cuesEndY : margin,
            p === notesEndPage ? notesEndY : margin
          );
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(dividerX, lineTop, dividerX, Math.min(pageBottom, lineBottom));
  }

  // Summary section on the last page after both columns
  if (options.includeSummary && note.summaryBlocks.some((b) => stripHtml(b.content) || b.table)) {
    doc.setPage(maxPage);
    let summaryY = Math.max(
      maxPage === cuesEndPage ? cuesEndY : margin,
      maxPage === notesEndPage ? notesEndY : margin
    ) + 4;

    if (summaryY + 20 > pageBottom) {
      doc.addPage();
      summaryY = margin;
    }

    doc.setDrawColor(bw ? 51 : 30, bw ? 65 : 58, bw ? 85 : 95);
    doc.setLineWidth(0.45);
    doc.line(margin, summaryY, margin + contentWidth, summaryY);
    summaryY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(bw ? 15 : 30, bw ? 23 : 58, bw ? 42 : 95);
    doc.text('SUMMARY & KEY TAKEAWAYS', margin, summaryY);
    summaryY += 4.5;

    renderBlockStackToPdf(doc, note.summaryBlocks, margin, summaryY, contentWidth, pageBottom, margin, bw);
  }

  addPageFooters(doc, `${note.subject} — ${note.title || 'Cornell Note'}`);
  doc.save(`${(note.title || 'upsc-cornell-note').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.pdf`);
}

export function exportComparisonToPdf(
  title: string,
  subject: string,
  table: TableData,
  bw = false
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(bw ? 51 : 30, bw ? 65 : 58, bw ? 85 : 95);
  doc.text(`${subject.toUpperCase()}  ·  UPSC COMPARISON TABLE`, margin, margin);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const titleLines: string[] = doc.splitTextToSize(title, contentWidth);
  let y = margin + 6;
  titleLines.forEach((l) => {
    doc.text(l, margin, y);
    y += 6;
  });

  renderBlockStackToPdf(
    doc,
    [{ id: 'cmp', type: 'table', content: '', table }],
    margin,
    y + 2,
    contentWidth,
    doc.internal.pageSize.getHeight() - 18,
    margin,
    bw
  );

  addPageFooters(doc, `${subject} — ${title}`);
  doc.save(`${title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.pdf`);
}

export function exportConsolidatedRevisionPdf(
  notes: CornellNote[],
  sheetTitle: string,
  bw = false
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const pageBottom = pageHeight - 18;

  let y = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(bw ? 15 : 30, bw ? 23 : 58, bw ? 42 : 95);
  doc.text(sheetTitle, margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on ${formatDateShort(new Date().toISOString())}  ·  ${notes.length} Notes Included`, margin, y);
  y += 3;
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  notes.forEach((note, idx) => {
    if (y + 25 > pageBottom) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${note.title || 'Untitled Note'}`, margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${note.subject}  ·  ${note.relevance}  ·  Revisions: ${note.revision.count}`, margin, y);
    y += 5;

    const highlighted = getFilteredRevisionBlocks(note.notesBlocks);
    const blocksToPrint = [
      ...(highlighted.length > 0 ? highlighted : note.notesBlocks.slice(0, 6)),
      ...note.summaryBlocks,
    ];
    y = renderBlockStackToPdf(doc, blocksToPrint, margin, y, contentWidth, pageBottom, margin, bw) + 4;
  });

  addPageFooters(doc, sheetTitle);
  doc.save(`${sheetTitle.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.pdf`);
}

export function downloadCleanHtml(note: CornellNote, options: PrintOptions): void {
  const renderHtmlBlocks = (blocks: NoteBlock[]): string => {
    return blocks
      .map((b) => {
        const m = b.marker ? MARKER_MAP[b.marker] : null;
        const badge = m
          ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.04em;color:${options.blackAndWhite ? '#111' : m.textHex};margin-bottom:3px;">[${m.shortLabel}]</div>`
          : '';
        const boxStyle = m
          ? `background:${options.blackAndWhite ? '#fff' : m.printBgHex};border:1px solid ${options.blackAndWhite ? '#64748b' : m.borderHex};padding:8px 10px;border-radius:4px;margin:6px 0;`
          : 'margin:5px 0;';

        if (b.type === 'divider') return '<hr style="border:none;border-top:1px solid #cbd5e1;margin:10px 0;"/>';
        if (b.type === 'table' && b.table) {
          const head = b.table.hasHeader
            ? `<thead><tr>${b.table.headers.map((h) => `<th>${h || ''}</th>`).join('')}</tr></thead>`
            : '';
          const body = `<tbody>${b.table.rows
            .map((r) => `<tr>${r.map((c) => `<td>${c || ''}</td>`).join('')}</tr>`)
            .join('')}</tbody>`;
          return `<div style="margin:10px 0;">${b.table.caption ? `<div style="font-weight:600;font-size:12px;margin-bottom:4px;">${b.table.caption}</div>` : ''}<table>${head}${body}</table></div>`;
        }
        if (b.type === 'heading1') return `<h1 style="${boxStyle}">${badge}${b.content}</h1>`;
        if (b.type === 'heading2') return `<h2 style="${boxStyle}">${badge}${b.content}</h2>`;
        if (b.type === 'heading3') return `<h3 style="${boxStyle}">${badge}${b.content}</h3>`;
        if (b.type === 'bullet') {
          return `<div style="padding-left:${(b.indent ?? 0) * 18 + 14}px;${boxStyle}">• ${badge}${b.content}</div>`;
        }
        if (b.type === 'numbered') {
          return `<div style="padding-left:${(b.indent ?? 0) * 18 + 14}px;${boxStyle}">▪ ${badge}${b.content}</div>`;
        }
        if (b.type === 'checklist') {
          return `<div style="padding-left:${(b.indent ?? 0) * 18}px;${boxStyle}">${b.checked ? '☑' : '☐'} ${badge}${b.content}</div>`;
        }
        if (b.type === 'definition') {
          return `<div style="border:1px solid #cbd5e1;background:${m && !options.blackAndWhite ? m.printBgHex : '#f8fafc'};padding:8px 10px;border-radius:4px;margin:6px 0;">${badge}<strong>Definition — ${b.secondaryContent || ''}:</strong> ${b.content}</div>`;
        }
        if (b.type === 'fact') {
          return `<div style="border:1px solid #cbd5e1;background:${m && !options.blackAndWhite ? m.printBgHex : '#fffbeb'};padding:8px 10px;border-radius:4px;margin:6px 0;">${badge}<strong>Important Fact — ${b.secondaryContent || ''}:</strong> ${b.content}</div>`;
        }
        if (b.type === 'quote') {
          return `<blockquote style="border:1px solid #cbd5e1;padding:8px 12px;margin:6px 0;font-style:italic;">${badge}${b.content}${b.secondaryContent ? `<div style="font-style:normal;font-size:12px;color:#475569;margin-top:4px;">— ${b.secondaryContent}</div>` : ''}</blockquote>`;
        }
        if (b.type === 'expandable') {
          return `<div style="border:1px solid #cbd5e1;padding:8px 10px;margin:6px 0;">${badge}<strong>${b.secondaryContent || 'Details'}</strong><div style="margin-top:4px;">${b.content}</div></div>`;
        }
        return `<p style="${boxStyle}">${badge}${b.content}</p>`;
      })
      .join('\n');
  };

  const cuesHtml = renderHtmlBlocks(note.cuesBlocks);
  const notesHtml = renderHtmlBlocks(note.notesBlocks);
  const summaryHtml = options.includeSummary ? renderHtmlBlocks(note.summaryBlocks) : '';

  const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${note.title || 'UPSC Cornell Note'}</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  body { font-family: Georgia, serif; color: #1e293b; max-width: 800px; margin: 24px auto; padding: 0 20px; line-height: 1.55; font-size: 14px; }
  .meta { font-family: system-ui, sans-serif; font-size: 12px; color: #475569; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 16px; }
  h1.title { font-family: system-ui, sans-serif; font-size: 22px; margin: 4px 0 6px; color: #0f172a; }
  h1, h2, h3 { font-family: system-ui, sans-serif; color: #1e3a5f; margin: 12px 0 4px; break-after: avoid; }
  .cornell { display: grid; grid-template-columns: ${note.cuesRatio || 30}% 1fr; gap: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 16px; }
  .cues { border-right: 1px solid #cbd5e1; padding-right: 16px; }
  .col-label { font-family: system-ui, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: #64748b; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-family: system-ui, sans-serif; font-size: 12.5px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: ${options.blackAndWhite ? '#e2e8f0' : '#1e3a5f'}; color: ${options.blackAndWhite ? '#0f172a' : '#fff'}; }
  mark[data-marker="very-important"] { background: #fee2e2; padding: 1px 3px; }
  mark[data-marker="important"] { background: #ffedd5; padding: 1px 3px; }
  mark[data-marker="prelims-fact"] { background: #fef9c3; padding: 1px 3px; }
  mark[data-marker="mains-value"] { background: #dbeafe; padding: 1px 3px; }
  mark[data-marker="conceptual"] { background: #dcfce7; padding: 1px 3px; }
  mark[data-marker="revision-required"] { background: #f3e8ff; padding: 1px 3px; }
  ${options.blackAndWhite ? 'mark { background: transparent !important; border-bottom: 1.5px solid #111; font-weight: 600; }' : ''}
</style>
</head>
<body>
  <div class="meta">
    <div><strong>${note.subject}</strong> · ${note.relevance} · Updated ${formatDateShort(note.updatedAt)}</div>
    <h1 class="title">${note.title || 'Untitled UPSC Cornell Note'}</h1>
    <div>${[note.topic && `Topic: ${note.topic}`, note.subtopic && `Subtopic: ${note.subtopic}`, options.includeSources && note.source && `Source: ${note.source}`].filter(Boolean).join(' · ')}</div>
  </div>
  ${
    options.layout === 'main-only'
      ? `<div><div class="col-label">MAIN NOTES</div>${notesHtml}</div>`
      : `<div class="cornell"><div class="cues"><div class="col-label">CUES & QUESTIONS</div>${cuesHtml}</div><div><div class="col-label">MAIN NOTES</div>${notesHtml}</div></div>`
  }
  ${
    options.includeSummary && summaryHtml
      ? `<div style="margin-top:16px;"><div class="col-label">SUMMARY & KEY TAKEAWAYS</div>${summaryHtml}</div>`
      : ''
  }
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(note.title || 'upsc-note').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
