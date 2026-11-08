'use client';

/**
 * BlockHandle – Notion-style left-gutter handles for every block.
 *
 * On hover shows two controls:
 *   [+]  – inserts a new paragraph below, places cursor there, fires "/" slash menu
 *   [⠿]  – selects the block + opens a block-actions popover
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Extension } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import {
  Copy,
  Trash2,
  Plus,
  ChevronRight,
  Palette,
  MessageSquare,
  Sparkles,
  Search,
  Link,
  MoveRight,
  Edit3,
  BookOpen,
} from 'lucide-react';
import { cn } from '../lib/utils';

/* -------------------------------------------------------------------------- */
/*  6-dot drag icon (2 col × 3 row)                                           */
/* -------------------------------------------------------------------------- */

function DragDots({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 18"
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="1.65" />
      <circle cx="3" cy="9" r="1.65" />
      <circle cx="3" cy="15" r="1.65" />
      <circle cx="9" cy="3" r="1.65" />
      <circle cx="9" cy="9" r="1.65" />
      <circle cx="9" cy="15" r="1.65" />
    </svg>
  );
}

/**
 * Accurately calculates the vertical offset to the first line's center
 * relative to the block's top bounding rect. This ensures the handle is
 * positioned on the first line (not vertically centered on multi-line blocks).
 */
function getFirstLineOffset(domNode: HTMLElement): number {
  try {
    const style = window.getComputedStyle(domNode);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const fontSize = parseFloat(style.fontSize) || 14;
    const lineHeightRaw = style.lineHeight;
    let lineHeight = fontSize * 1.5;
    if (lineHeightRaw && lineHeightRaw !== 'normal') {
      const parsed = parseFloat(lineHeightRaw);
      if (!isNaN(parsed)) lineHeight = parsed;
    }
    return paddingTop + lineHeight / 2;
  } catch {
    return 12;
  }
}

/* -------------------------------------------------------------------------- */
/*  Block actions popover                                                     */
/* -------------------------------------------------------------------------- */

interface ActionItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
  danger?: boolean;
  section?: string;
  dividerAfter?: boolean;
  onClick: () => void;
}

interface PopoverAnchor {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

interface BlockActionsPopoverProps {
  isDark: boolean;
  anchor: PopoverAnchor;
  nodePos: number;
  editor: Editor;
  onClose: () => void;
}

function BlockActionsPopover({
  isDark,
  anchor,
  nodePos,
  editor,
  onClose,
}: BlockActionsPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState({ top: anchor.top, left: anchor.left });

  /* Reposition so popover sits to the left (matching Notion) or right if tight */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer positioning to the left of the 6-dot button
    let left = anchor.left - rect.width - 6;
    if (left < 8) {
      // If not enough room on the left, position to the right
      left = anchor.right + 6;
      if (left + rect.width > vw - 8) {
        left = Math.max(8, vw - rect.width - 8);
      }
    }

    // Align vertically with the button, clamped to screen viewport
    let top = anchor.top - 8;
    if (top + rect.height > vh - 10) {
      top = Math.max(10, vh - rect.height - 10);
    }
    if (top < 10) {
      top = 10;
    }
    setPos({ top, left });
  }, [anchor]);

  /* Close on outside mousedown / Escape */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  /* Block inspection */
  const getNode = () => editor.state.doc.nodeAt(nodePos);
  const node = getNode();

  const typeMap: Record<string, string> = {
    paragraph: 'Text',
    heading: 'Heading',
    bulletList: 'Bulleted list',
    orderedList: 'Numbered list',
    taskList: 'To-do list',
    blockquote: 'Quote',
    codeBlock: 'Code',
    horizontalRule: 'Divider',
    image: 'Image',
    imagePlaceholder: 'Image',
    table: 'Table',
    callout: 'Callout',
    details: 'Toggle',
  };
  const typeLabel = typeMap[node?.type.name ?? ''] ?? 'Block';

  const textContent = node?.textContent || '';
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.href}#pos-${nodePos}`).catch(() => {});
    onClose();
  };
  const duplicate = () => {
    const cur = getNode();
    if (!cur) return;
    editor.chain().focus().insertContentAt(nodePos + cur.nodeSize, cur.toJSON()).run();
    onClose();
  };
  const deleteBlock = () => {
    const cur = getNode();
    if (!cur) return;
    editor.chain().focus().deleteRange({ from: nodePos, to: nodePos + cur.nodeSize }).run();
    onClose();
  };

  const isImageBlock = typeLabel === 'Image';

  const ACTIONS: ActionItem[] = isImageBlock
    ? [
        {
          id: 'add-link',
          section: 'Image',
          label: 'Add link to image',
          shortcut: 'Ctrl+K',
          icon: Link,
          dividerAfter: true,
          onClick: onClose,
        },
        { id: 'copy-link', label: 'Copy link to block', shortcut: 'Alt+⇧+L', icon: Link, onClick: copyLink },
        { id: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', icon: Copy, onClick: duplicate },
        { id: 'move-to', label: 'Move to', shortcut: 'Ctrl+⇧+P', icon: MoveRight, onClick: onClose },
        { id: 'delete', label: 'Delete', shortcut: 'Del', icon: Trash2, danger: true, dividerAfter: true, onClick: deleteBlock },
        { id: 'comment', label: 'Comment', shortcut: 'Ctrl+⇧+M', icon: MessageSquare, onClick: onClose },
        { id: 'suggest-edits', label: 'Suggest edits', shortcut: 'Ctrl+⇧+Alt+X', icon: Edit3, dividerAfter: true, onClick: onClose },
        { id: 'ask-ai', label: 'Ask AI', shortcut: 'Ctrl+J', icon: Sparkles, onClick: onClose },
      ]
    : [
        {
          id: 'turn-into',
          section: typeLabel,
          label: 'Turn into',
          icon: MoveRight,
          hasSubmenu: true,
          onClick: onClose,
        },
        {
          id: 'color',
          label: 'Color',
          icon: Palette,
          hasSubmenu: true,
          dividerAfter: true,
          onClick: onClose,
        },
        { id: 'copy-link', label: 'Copy link to block', shortcut: 'Alt+⇧+L', icon: Link, onClick: copyLink },
        { id: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', icon: Copy, onClick: duplicate },
        { id: 'move-to', label: 'Move to', shortcut: 'Ctrl+⇧+P', icon: MoveRight, onClick: onClose },
        { id: 'delete', label: 'Delete', shortcut: 'Del', icon: Trash2, danger: true, dividerAfter: true, onClick: deleteBlock },
        { id: 'comment', label: 'Comment', shortcut: 'Ctrl+⇧+M', icon: MessageSquare, onClick: onClose },
        { id: 'suggest-edits', label: 'Suggest edits', shortcut: 'Ctrl+⇧+Alt+X', icon: Edit3, dividerAfter: true, onClick: onClose },
        { id: 'ask-ai', label: 'Ask AI', shortcut: 'Ctrl+J', icon: Sparkles, onClick: onClose },
        { id: 'skills', label: 'Skills', icon: BookOpen, hasSubmenu: true, onClick: onClose },
      ];

  const filtered = search.trim()
    ? ACTIONS.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()))
    : ACTIONS;

  /* Theme tokens */
  const bg = isDark ? 'bg-[#202020] border-white/[0.09]' : 'bg-white border-black/[0.09]';
  const text = isDark ? 'text-[#e2e2e2]' : 'text-[#1a1a1a]';
  const muted = isDark ? 'text-[#888]' : 'text-[#999]';
  const secLbl = isDark ? 'text-[#666]' : 'text-[#bbb]';
  const hover = isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-black/[0.05]';
  const inp = isDark
    ? 'bg-[#181818] border-white/[0.1] focus-within:border-blue-500 placeholder-[#555] text-[#e2e2e2]'
    : 'bg-[#f4f4f4] border-black/[0.08] focus-within:border-blue-500 placeholder-[#bbb] text-[#1a1a1a]';
  const divider = isDark ? 'border-white/[0.08]' : 'border-black/[0.07]';
  const foot = isDark ? 'border-white/[0.07]' : 'border-black/[0.06]';

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 10000, width: 252 }}
      className={cn(
        'rounded-xl border shadow-2xl overflow-hidden select-none',
        'animate-in fade-in zoom-in-95 duration-100',
        bg,
        text,
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Search bar */}
      <div className="px-2 pt-2 pb-1.5">
        <div className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors', inp)}>
          <Search className="size-3.5 shrink-0 opacity-40" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions…"
            className="w-full bg-transparent outline-none text-xs"
          />
        </div>
      </div>

      {/* Actions list */}
      <div className="py-1">
        {filtered.map((action, i) => {
          const Icon = action.icon;
          const showSection = i === 0 && action.section;
          return (
            <div key={action.id}>
              {showSection && (
                <div className={cn('px-3 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wide', secLbl)}>
                  {action.section}
                </div>
              )}
              <button
                type="button"
                onClick={action.onClick}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-1.5 text-xs transition-colors cursor-pointer',
                  hover,
                  action.danger ? 'text-red-400 hover:text-red-400 hover:bg-red-500/10' : '',
                )}
              >
                <Icon className="size-3.5 shrink-0 opacity-70" />
                <span className="flex-1 text-left">{action.label}</span>
                {action.shortcut && <span className={cn('text-[11px]', muted)}>{action.shortcut}</span>}
                {action.hasSubmenu && <ChevronRight className={cn('size-3.5 shrink-0', muted)} />}
              </button>
              {action.dividerAfter && i < filtered.length - 1 && (
                <div className={cn('my-1 border-t', divider)} />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={cn('border-t px-3 py-2', foot, muted, 'text-[11px] leading-relaxed select-none')}>
        <div>Last edited by Shakib Khan</div>
        <div className="opacity-70">Today at 9:26 AM</div>
        {charCount > 0 && (
          <div className="opacity-70">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}, {charCount} characters
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/*  Handle bar (the +  and ⠿ buttons)                                         */
/* -------------------------------------------------------------------------- */

interface HandleBarProps {
  isDark: boolean;
  blockTop: number;
  blockHeight: number;
  firstLineOffset?: number;
  editorLeft: number;
  nodePos: number;
  editor: Editor;
  onInsertBelow: () => void;
  onOpenPopover: (anchor: PopoverAnchor) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  containerRef?: (el: HTMLDivElement | null) => void;
}

function HandleBar({
  isDark,
  blockTop,
  firstLineOffset = 12,
  editorLeft,
  nodePos,
  editor,
  onInsertBelow,
  onOpenPopover,
  onMouseEnter,
  onMouseLeave,
  containerRef,
}: HandleBarProps) {
  const dotRef = useRef<HTMLButtonElement>(null);

  const handleDotsClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      /* Select the node in ProseMirror (shows blue selection background) */
      const node = editor.state.doc.nodeAt(nodePos);
      if (node) {
        try {
          editor.chain().focus().setNodeSelection(nodePos).run();
        } catch {
          /* atom */
        }
      }
      const btn = dotRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      onOpenPopover({
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
      });
    },
    [editor, nodePos, onOpenPopover],
  );

  // Position: Center of the 28px buttons matches the center of the first line of text
  const BUTTON_HEIGHT = 28;
  const top = Math.round(blockTop + firstLineOffset - BUTTON_HEIGHT / 2);
  const left = Math.max(4, editorLeft - 62);

  const iconCls = isDark
    ? 'text-[#777] hover:text-[#e0e0e0] hover:bg-white/[0.08] active:bg-white/[0.12]'
    : 'text-[#9b9a97] hover:text-[#37352f] hover:bg-black/[0.06] active:bg-black/[0.1]';

  return (
    <>
      {createPortal(
        <div
          ref={containerRef}
          style={{
            position: 'fixed',
            top,
            left,
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            paddingRight: 6, // Invisible bridge extending toward editor text
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* + button */}
          <button
            type="button"
            title="Click to add a block below"
            onClick={(e) => {
              e.stopPropagation();
              onInsertBelow();
            }}
            className={cn(
              'flex items-center justify-center rounded-md size-7 transition-colors cursor-pointer select-none',
              iconCls,
            )}
          >
            <Plus className="size-4 stroke-[2.2]" />
          </button>

          {/* 6-dot drag / options button */}
          <button
            ref={dotRef}
            type="button"
            title="Click for block menu, drag to move"
            onClick={handleDotsClick}
            className={cn(
              'flex items-center justify-center rounded-md size-7 transition-colors select-none',
              iconCls,
            )}
            style={{ cursor: 'grab' }}
          >
            <DragDots className="w-3 h-4" />
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Overlay manager (mounts inside TiptapEditor via React)                    */
/* -------------------------------------------------------------------------- */

interface ActiveHandle {
  top: number;
  height: number;
  firstLineOffset: number;
  editorLeft: number;
  nodePos: number;
}

export interface BlockHandleOverlayProps {
  editor: Editor;
  isDark: boolean;
}

export function BlockHandleOverlay({ editor, isDark }: BlockHandleOverlayProps) {
  const [active, setActive] = useState<ActiveHandle | null>(null);
  const [popover, setPopover] = useState<{
    anchor: PopoverAnchor;
    nodePos: number;
  } | null>(null);

  const activeRef = useRef<ActiveHandle | null>(null);
  activeRef.current = active;

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverOpen = useRef(false);
  useEffect(() => {
    popoverOpen.current = popover !== null;
  }, [popover]);

  const handleBarElRef = useRef<HTMLDivElement | null>(null);
  const isHoveringHandleRef = useRef(false);

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const schedHide = useCallback(() => {
    if (popoverOpen.current) return;
    if (isHoveringHandleRef.current) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!isHoveringHandleRef.current && !popoverOpen.current) {
        setActive(null);
      }
    }, 180);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // 1. If popover is open, freeze handle state completely
      if (popoverOpen.current) return;

      // 2. If hovering over handle bar container or its buttons, keep locked
      if (
        isHoveringHandleRef.current ||
        (handleBarElRef.current && handleBarElRef.current.contains(e.target as Node))
      ) {
        clearHide();
        return; // ZERO RECALCULATION, ZERO BLINKING
      }

      const editorDom = editor.view?.dom as HTMLElement | null;
      if (!editorDom || !editorDom.isConnected) return;

      const editorRect = editorDom.getBoundingClientRect();

      // Horizontal gutter bounds: from left of buttons to right edge of editor
      const gutterLeft = editorRect.left - 75;
      const gutterRight = editorRect.right + 40;
      const gutterTop = editorRect.top - 40;
      const gutterBottom = editorRect.bottom + 40;

      // If mouse is far outside the editor and gutter:
      if (
        e.clientX < gutterLeft ||
        e.clientX > gutterRight ||
        e.clientY < gutterTop ||
        e.clientY > gutterBottom
      ) {
        schedHide();
        return;
      }

      // 3. Row lock: If currently hovering within the active row's vertical band + gutter:
      const cur = activeRef.current;
      if (cur) {
        const domNode = editor.view.nodeDOM(cur.nodePos) as HTMLElement | null;
        if (domNode && domNode.isConnected) {
          const rowRect = domNode.getBoundingClientRect();
          const inRowVertical = e.clientY >= rowRect.top - 4 && e.clientY <= rowRect.bottom + 4;
          const inRowHorizontal = e.clientX >= gutterLeft && e.clientX <= gutterRight;

          if (inRowVertical && inRowHorizontal) {
            // Still on the same row or in its gutter!
            clearHide();
            return; // Stay completely stable - NO JUMPING, NO FLICKERING
          }
        }
      }

      // 4. Mouse moved to another row: locate the target block
      const clampedX = Math.max(editorRect.left + 8, Math.min(e.clientX, editorRect.right - 8));
      const posInfo = editor.view.posAtCoords({ left: clampedX, top: e.clientY });
      if (!posInfo) {
        return; // Don't hide immediately on empty line margins
      }

      const $pos = editor.view.state.doc.resolve(posInfo.pos);
      const targetDepth = Math.max(1, $pos.depth > 0 ? 1 : 0);
      const nodePos = $pos.depth === 0 ? 0 : $pos.before(targetDepth);

      if (cur && cur.nodePos === nodePos) {
        clearHide();
        return;
      }

      const domNode = editor.view.nodeDOM(nodePos) as HTMLElement | null;
      if (!domNode) return;

      const rect = domNode.getBoundingClientRect();
      const firstLineOffset = getFirstLineOffset(domNode);

      clearHide();
      setActive({
        top: rect.top,
        height: Math.max(rect.height, 24),
        firstLineOffset,
        editorLeft: editorRect.left,
        nodePos,
      });
    };

    const onScroll = () => {
      if (popoverOpen.current) return;
      const cur = activeRef.current;
      if (cur) {
        const domNode = editor.view.nodeDOM(cur.nodePos) as HTMLElement | null;
        if (domNode && domNode.isConnected) {
          const rect = domNode.getBoundingClientRect();
          const editorDom = editor.view.dom as HTMLElement | null;
          const editorLeft = editorDom ? editorDom.getBoundingClientRect().left : cur.editorLeft;
          setActive((prev) =>
            prev
              ? {
                  ...prev,
                  top: rect.top,
                  editorLeft,
                }
              : null,
          );
          return;
        }
      }
      setActive(null);
    };

    const onDocLeave = (e: MouseEvent) => {
      if (!e.relatedTarget && !popoverOpen.current) {
        schedHide();
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.addEventListener('mouseleave', onDocLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('mouseleave', onDocLeave);
    };
  }, [editor, clearHide, schedHide]);

  const handleInsert = useCallback(() => {
    if (!active) return;
    const node = editor.state.doc.nodeAt(active.nodePos);
    if (!node) return;
    const insertAt = active.nodePos + node.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, { type: 'paragraph' })
      .setTextSelection(insertAt + 1)
      .run();
    editor.view.dispatch(
      editor.view.state.tr.insertText('/', insertAt + 1, insertAt + 1),
    );
    setActive(null);
  }, [editor, active]);

  const handleOpenPopover = useCallback((anchor: PopoverAnchor) => {
    if (!active) return;
    setPopover({ anchor, nodePos: active.nodePos });
  }, [active]);

  const handleClosePopover = useCallback(() => {
    setPopover(null);
    hideTimer.current = setTimeout(() => setActive(null), 300);
  }, []);

  const handleBarMouseEnter = useCallback(() => {
    isHoveringHandleRef.current = true;
    clearHide();
  }, [clearHide]);

  const handleBarMouseLeave = useCallback(() => {
    isHoveringHandleRef.current = false;
    schedHide();
  }, [schedHide]);

  return (
    <>
      {active && (
        <HandleBar
          isDark={isDark}
          blockTop={active.top}
          blockHeight={active.height}
          firstLineOffset={active.firstLineOffset}
          editorLeft={active.editorLeft}
          nodePos={active.nodePos}
          editor={editor}
          onInsertBelow={handleInsert}
          onOpenPopover={handleOpenPopover}
          onMouseEnter={handleBarMouseEnter}
          onMouseLeave={handleBarMouseLeave}
          containerRef={(el) => {
            handleBarElRef.current = el;
          }}
        />
      )}
      {popover && (
        <BlockActionsPopover
          isDark={isDark}
          anchor={popover.anchor}
          nodePos={popover.nodePos}
          editor={editor}
          onClose={handleClosePopover}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tiptap Extension shim                                                     */
/* -------------------------------------------------------------------------- */

export interface BlockHandleOptions {
  getEditor?: () => Editor | null;
  getIsDark?: () => boolean;
}

export const BlockHandle = Extension.create<BlockHandleOptions>({
  name: 'blockHandle',
  addOptions() {
    return {};
  },
  addProseMirrorPlugins() {
    return [new Plugin({ key: new PluginKey('blockHandle') })];
  },
});
