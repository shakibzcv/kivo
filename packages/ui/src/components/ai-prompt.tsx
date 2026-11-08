'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Extension } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { AiAvatar } from './ai-avatar';

/* -------------------------------------------------------------------------- */
/*  Extension: press Space on an empty line to open the "Edit with AI" input  */
/* -------------------------------------------------------------------------- */

interface AiPromptState {
  open: boolean;
  pos: number;
}

export const aiPromptKey = new PluginKey<AiPromptState>('aiPrompt');

export interface AiPromptOptions {
  /** Called with the DOM node (a ProseMirror widget) the input should be rendered into. */
  onMount: (container: HTMLElement) => void;
}

export const AiPrompt = Extension.create<AiPromptOptions>({
  name: 'aiPrompt',

  addOptions() {
    return { onMount: () => {} };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin<AiPromptState>({
        key: aiPromptKey,
        state: {
          init: () => ({ open: false, pos: 0 }),
          apply(tr, value) {
            const meta = tr.getMeta(aiPromptKey) as AiPromptState | undefined;
            if (meta) return meta;
            if (value.open && tr.docChanged) {
              return { open: true, pos: tr.mapping.map(value.pos) };
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            const current = aiPromptKey.getState(state);
            if (!current?.open) return null;
            const widget = Decoration.widget(
              current.pos,
              () => {
                const el = document.createElement('div');
                el.className = 'ai-prompt-widget';
                el.contentEditable = 'false';
                options.onMount(el);
                return el;
              },
              { key: 'ai-prompt', side: -1, stopEvent: () => true, ignoreSelection: true },
            );
            return DecorationSet.create(state.doc, [widget]);
          },
          handleKeyDown(view, event) {
            if (event.key !== ' ' || event.isComposing) return false;
            if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;

            const { selection } = view.state;
            if (!selection.empty) return false;

            const { $from } = selection;
            const parent = $from.parent;
            if (parent.type.name !== 'paragraph' || parent.content.size !== 0) return false;
            if (aiPromptKey.getState(view.state)?.open) return false;

            event.preventDefault();
            view.dispatch(
              view.state.tr.setMeta(aiPromptKey, { open: true, pos: $from.before() }),
            );
            return true;
          },
        },
      }),
    ];
  },
});

export function closeAiPrompt(editor: Editor) {
  editor.view.dispatch(editor.state.tr.setMeta(aiPromptKey, { open: false, pos: 0 }));
}

/* -------------------------------------------------------------------------- */
/*  UI                                                                        */
/* -------------------------------------------------------------------------- */

export interface AiPromptBoxProps {
  isDark?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: (refocusEditor?: boolean) => void;
  isLoading?: boolean;
  notice?: string | null;
}

export function AiPromptBox({
  isDark = true,
  value,
  onChange,
  onSubmit,
  onClose,
  isLoading = false,
  notice,
}: AiPromptBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Grow with the text the user types
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, window.innerHeight * 0.5)}px`;
  }, [value]);

  return (
    <div
      className="my-2 w-full select-none"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-lg',
          isDark
            ? 'border-white/[0.08] bg-[#202020] text-[#ededed]'
            : 'border-black/[0.08] bg-[#f7f7f5] text-[#1a1a1a]',
        )}
      >
        <div className="size-7 shrink-0 self-center overflow-hidden rounded-full border border-black/10 bg-white">
          <AiAvatar className="size-full object-cover" />
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          disabled={isLoading}
          placeholder="Edit with AI"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            } else if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            } else if (e.key === 'Backspace' && value.length === 0) {
              e.preventDefault();
              onClose();
            }
          }}
          onBlur={() => {
            if (!value.trim() && !isLoading) onClose(false);
          }}
          className="max-h-[50vh] min-h-6 flex-1 resize-none self-center bg-transparent py-0.5 text-sm leading-6 outline-none placeholder:text-[#6e6e6e]"
        />

        <button
          type="button"
          // Keep focus in the textarea so blur-to-close doesn't fire before click
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSubmit}
          disabled={!hasText || isLoading}
          title="Send"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center self-center rounded-full transition-colors',
            hasText && !isLoading
              ? 'cursor-pointer bg-[#2383e2] text-white hover:bg-[#1b74cc]'
              : isDark
                ? 'cursor-not-allowed bg-white/10 text-[#777777]'
                : 'cursor-not-allowed bg-black/10 text-[#999999]',
          )}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ArrowUp className="size-3.5" />
          )}
        </button>
      </div>

      {notice && <p className="mt-1.5 px-1 text-xs text-[#8a8a8a]">{notice}</p>}
    </div>
  );
}
