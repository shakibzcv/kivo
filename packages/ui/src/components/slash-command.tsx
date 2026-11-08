'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Extension, Node, ReactRenderer, mergeAttributes } from '@tiptap/react';
import type { Editor, Range } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import {
  Bookmark,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Lightbulb,
  List,
  ListCollapse,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Table as TableIcon,
  Type,
} from 'lucide-react';
import { cn } from '../lib/utils';

/* -------------------------------------------------------------------------- */
/*  Callout block (custom node)                                               */
/* -------------------------------------------------------------------------- */

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        class: 'callout-block my-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3',
      }),
      0,
    ];
  },
});

/* -------------------------------------------------------------------------- */
/*  Slash menu items                                                          */
/* -------------------------------------------------------------------------- */

export interface SlashItem {
  title: string;
  section: string;
  hint?: string;
  keywords?: string[];
  icon: React.ComponentType<{ className?: string }>;
  run: (editor: Editor, range: Range) => void;
}

const chain = (editor: Editor, range: Range) => editor.chain().focus().deleteRange(range);

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: 'Text',
    section: 'Basic blocks',
    icon: Type,
    keywords: ['paragraph', 'plain'],
    run: (e, r) => chain(e, r).setParagraph().run(),
  },
  {
    title: 'Heading 1',
    section: 'Basic blocks',
    hint: '#',
    icon: Heading1,
    keywords: ['h1', 'title'],
    run: (e, r) => chain(e, r).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    section: 'Basic blocks',
    hint: '##',
    icon: Heading2,
    keywords: ['h2', 'subtitle'],
    run: (e, r) => chain(e, r).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    section: 'Basic blocks',
    hint: '###',
    icon: Heading3,
    keywords: ['h3'],
    run: (e, r) => chain(e, r).setHeading({ level: 3 }).run(),
  },
  {
    title: 'Heading 4',
    section: 'Basic blocks',
    hint: '####',
    icon: Heading4,
    keywords: ['h4'],
    run: (e, r) => chain(e, r).setHeading({ level: 4 }).run(),
  },
  {
    title: 'Bulleted list',
    section: 'Basic blocks',
    hint: '-',
    icon: List,
    keywords: ['ul', 'unordered', 'bullet'],
    run: (e, r) => chain(e, r).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    section: 'Basic blocks',
    hint: '1.',
    icon: ListOrdered,
    keywords: ['ol', 'ordered', 'number'],
    run: (e, r) => chain(e, r).toggleOrderedList().run(),
  },
  {
    title: 'To-do list',
    section: 'Basic blocks',
    hint: '[]',
    icon: ListTodo,
    keywords: ['task', 'checkbox', 'todo'],
    run: (e, r) => chain(e, r).toggleTaskList().run(),
  },
  {
    title: 'Toggle list',
    section: 'Basic blocks',
    hint: '>',
    icon: ListCollapse,
    keywords: ['collapse', 'details', 'accordion'],
    run: (e, r) =>
      chain(e, r)
        .insertContent(
          '<details open><summary>Toggle</summary><div data-type="detailsContent"><p></p></div></details>',
        )
        .run(),
  },
  {
    title: 'Callout',
    section: 'Basic blocks',
    icon: Lightbulb,
    keywords: ['note', 'info', 'tip'],
    run: (e, r) =>
      chain(e, r)
        .insertContent('<div data-type="callout"><p></p></div>')
        .run(),
  },
  {
    title: 'Quote',
    section: 'Basic blocks',
    hint: '"',
    icon: Quote,
    keywords: ['blockquote', 'citation'],
    run: (e, r) => chain(e, r).toggleBlockquote().run(),
  },
  {
    title: 'Table',
    section: 'Basic blocks',
    icon: TableIcon,
    keywords: ['grid', 'rows', 'columns'],
    run: (e, r) =>
      chain(e, r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Divider',
    section: 'Basic blocks',
    hint: '---',
    icon: Minus,
    keywords: ['hr', 'line', 'separator', 'rule'],
    run: (e, r) => chain(e, r).setHorizontalRule().run(),
  },
  {
    title: 'Image',
    section: 'Media',
    icon: ImageIcon,
    keywords: ['picture', 'photo', 'img'],
    run: (e, r) => {
      // Flag the placeholder so it opens the picker immediately on mount
      (e.storage as any).imagePlaceholder = { openNext: true };
      chain(e, r)
        .insertContent({ type: 'imagePlaceholder' })
        .run();
    },
  },
  {
    title: 'Code',
    section: 'Media',
    hint: '```',
    icon: Code,
    keywords: ['snippet', 'pre', 'codeblock'],
    run: (e, r) => chain(e, r).toggleCodeBlock().run(),
  },
  {
    title: 'Web bookmark',
    section: 'Media',
    icon: Bookmark,
    keywords: ['link', 'url', 'website'],
    run: (e, r) => {
      chain(e, r).run();
      const url = window.prompt('Link URL');
      if (!url) return;
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      e.chain()
        .focus()
        .insertContent(`<a href="${href}">${href}</a> `)
        .run();
    },
  },
];

function filterItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q)),
  );
}

/* -------------------------------------------------------------------------- */
/*  Popover UI                                                                */
/* -------------------------------------------------------------------------- */

interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
  clientRect?: (() => DOMRect | null) | null;
  onClose: () => void;
}

interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(function SlashMenu(
  { items, command, clientRect, onClose },
  ref,
) {
  const [selected, setSelected] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Index === items.length means the "Close menu" row is highlighted
  const closeIndex = items.length;
  const total = items.length + 1;

  useEffect(() => setSelected(0), [items]);

  // Position next to the caret, flipping above when there is no room below
  useLayoutEffect(() => {
    const rect = clientRect?.();
    if (!rect) return;
    const height = containerRef.current?.offsetHeight ?? 340;
    const width = containerRef.current?.offsetWidth ?? 280;
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setPos({ top, left: Math.max(8, left) });
  }, [clientRect, items]);

  useEffect(() => {
    if (selected === closeIndex) closeRef.current?.scrollIntoView({ block: 'nearest' });
    else itemRefs.current[selected]?.scrollIntoView({ block: 'nearest' });
  }, [selected, closeIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (event.key === 'ArrowDown') {
        setSelected((s) => (s + 1) % total);
        return true;
      }
      if (event.key === 'ArrowUp') {
        setSelected((s) => (s - 1 + total) % total);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (selected === closeIndex) {
          onClose();
          return true;
        }
        const item = items[selected];
        if (item) command(item);
        return true;
      }
      if (event.key === 'Escape') {
        onClose();
        return true;
      }
      return false;
    },
  }));

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-[290px] overflow-hidden rounded-lg border border-white/10 bg-[#252525] text-[#e6e6e6] shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="max-h-[320px] overflow-y-auto py-1.5 [scrollbar-width:thin]">
        {items.length === 0 ? (
          <div className="px-3 py-3 text-xs text-[#8a8a8a]">No results</div>
        ) : (
          items.map((item, index) => {
            const Icon = item.icon;
            const showSection = index === 0 || items[index - 1]?.section !== item.section;
            return (
              <div key={item.title}>
                {showSection && (
                  <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-[#8a8a8a]">
                    {item.section}
                  </div>
                )}
                <button
                  type="button"
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onMouseEnter={() => setSelected(index)}
                  onClick={() => command(item)}
                  className={cn(
                    'mx-1 flex w-[calc(100%-0.5rem)] cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    index === selected ? 'bg-white/[0.08]' : 'bg-transparent',
                  )}
                >
                  <Icon className="size-4 shrink-0 text-[#b5b5b5]" />
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.hint && <span className="text-xs text-[#6f6f6f]">{item.hint}</span>}
                </button>
              </div>
            );
          })
        )}
      </div>
      <button
        type="button"
        ref={closeRef}
        onMouseEnter={() => setSelected(closeIndex)}
        onClick={onClose}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between border-t border-white/10 px-3 py-2 text-sm text-[#d0d0d0] transition-colors',
          selected === closeIndex ? 'bg-white/[0.08]' : 'bg-transparent',
        )}
      >
        <span>Close menu</span>
        <span className="text-xs text-[#6f6f6f]">esc</span>
      </button>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*  Extension                                                                 */
/* -------------------------------------------------------------------------- */

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }) => props.run(editor, range),
        items: ({ query }) => filterItems(query),
        render: () => {
          let component: ReactRenderer<SlashMenuHandle, SlashMenuProps> | null = null;
          let closed = false;

          const destroy = () => {
            closed = true;
            component?.destroy();
            component = null;
          };

          return {
            onStart: (props: SuggestionProps<SlashItem, SlashItem>) => {
              closed = false;
              component = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items,
                  command: props.command,
                  clientRect: props.clientRect,
                  onClose: destroy,
                },
                editor: props.editor,
              });
              document.body.appendChild(component.element);
            },
            onUpdate: (props: SuggestionProps<SlashItem, SlashItem>) => {
              if (closed || !component) return;
              component.updateProps({
                items: props.items,
                command: props.command,
                clientRect: props.clientRect,
                onClose: destroy,
              });
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (closed || !component) return false;
              return component.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => destroy(),
          };
        },
      }),
    ];
  },
});
