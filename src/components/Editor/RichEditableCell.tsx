import React, { useEffect, useRef } from 'react';
import { sanitizeInlineHtml } from '../../utils/noteHelpers';

interface RichEditableCellProps {
  blockId: string;
  html: string;
  placeholder?: string;
  className?: string;
  spellCheck?: boolean;
  onChange: (nextHtml: string) => void;
  onFocus: () => void;
  onEnterKey?: () => void;
  onBackspaceEmpty?: () => void;
  onTabKey?: (shift: boolean) => void;
  registerElement?: (el: HTMLDivElement | null) => void;
}

export const RichEditableCell: React.FC<RichEditableCellProps> = ({
  blockId,
  html,
  placeholder = 'Write here...',
  className = '',
  spellCheck = true,
  onChange,
  onFocus,
  onEnterKey,
  onBackspaceEmpty,
  onTabKey,
  registerElement,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastCommittedRef = useRef<string>(html);
  const lastBlockIdRef = useRef<string>(blockId);

  useEffect(() => {
    registerElement?.(ref.current);
    return () => registerElement?.(null);
  }, [registerElement]);

  // Sync DOM only when switching block or when external state (undo/redo/highlight/template) diverges from local edits
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (lastBlockIdRef.current !== blockId || html !== lastCommittedRef.current) {
      if (el.innerHTML !== html) {
        el.innerHTML = html;
      }
      lastCommittedRef.current = html;
      lastBlockIdRef.current = blockId;
    }
  }, [blockId, html]);

  const emitChange = () => {
    const el = ref.current;
    if (!el) return;
    const raw = el.innerHTML;
    const clean = sanitizeInlineHtml(raw);
    lastCommittedRef.current = clean;
    onChange(clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && onTabKey) {
      e.preventDefault();
      onTabKey(e.shiftKey);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey && onEnterKey) {
      e.preventDefault();
      emitChange();
      onEnterKey();
      return;
    }

    if (e.key === 'Backspace' && onBackspaceEmpty) {
      const text = ref.current?.textContent ?? '';
      const rawHtml = ref.current?.innerHTML ?? '';
      if (text.trim() === '' && !rawHtml.includes('<mark')) {
        e.preventDefault();
        onBackspaceEmpty();
        return;
      }
    }

    if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
      const k = e.key.toLowerCase();
      if (k === 'b') {
        e.preventDefault();
        document.execCommand('bold');
        emitChange();
      } else if (k === 'i') {
        e.preventDefault();
        document.execCommand('italic');
        emitChange();
      } else if (k === 'u') {
        e.preventDefault();
        document.execCommand('underline');
        emitChange();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const htmlClip = e.clipboardData.getData('text/html');
    const textClip = e.clipboardData.getData('text/plain');
    if (htmlClip) {
      const sanitized = sanitizeInlineHtml(htmlClip);
      document.execCommand('insertHTML', false, sanitized);
    } else if (textClip) {
      document.execCommand('insertText', false, textClip);
    }
    emitChange();
  };

  const isEmpty = !html || html === '<br>';

  return (
    <div className="relative w-full">
      {isEmpty && (
        <span
          className={`pointer-events-none absolute left-0 top-0 text-slate-400 select-none ${className}`}
          aria-hidden="true"
        >
          {placeholder}
        </span>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={spellCheck}
        onInput={emitChange}
        onBlur={emitChange}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={`w-full focus:outline-none break-words min-h-[1.45em] ${className}`}
      />
    </div>
  );
};
