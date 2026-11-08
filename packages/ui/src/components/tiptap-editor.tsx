'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Details, DetailsSummary, DetailsContent } from '@tiptap/extension-details';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { SlashCommand, Callout } from './slash-command';
import { AiPrompt, AiPromptBox, closeAiPrompt } from './ai-prompt';
import { ImagePlaceholder } from './image-block';
import { BlockHandle, BlockHandleOverlay } from './block-handle';

export interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  isDark?: boolean;
  className?: string;
  /** Bearer token forwarded to the image upload API. */
  token?: string | null;
  /**
   * Called when the user submits the "Edit with AI" input (opened with Space on an empty line).
   * Return the text to insert into the document.
   */
  onAiSubmit?: (prompt: string, documentText: string) => Promise<string>;
  /**
   * Called when user presses Backspace or ArrowUp at the start of the editor
   * to navigate back to the page title.
   */
  onNavigateToTitle?: () => void;
  /**
   * Ref to access editor instance from outside (e.g. to focus from title input on Enter).
   */
  editorRef?: React.MutableRefObject<any>;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function TiptapEditor({
  content = '',
  onChange,
  placeholder = "Press 'space' for AI or '/' for commands",
  isDark = true,
  className,
  token,
  onAiSubmit,
  onNavigateToTitle,
  editorRef,
}: TiptapEditorProps) {
  const isUpdatingRef = useRef(false);
  const [aiContainer, setAiContainer] = useState<HTMLElement | null>(null);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-5 my-2 space-y-1',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-5 my-2 space-y-1',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-2 border-white/20 pl-3 my-2 italic text-gray-300',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-black/40 rounded-lg p-3 font-mono text-xs my-2 text-emerald-300 overflow-x-auto',
          },
        },
      }),
      Placeholder.configure({
        placeholder: ({ editor }) => (editor.isFocused ? placeholder : ''),
        showOnlyCurrent: true,
        emptyEditorClass:
          'is-editor-empty before:content-[attr(data-placeholder)] before:float-left before:text-[#555555] before:pointer-events-none before:h-0',
        emptyNodeClass:
          'is-empty before:content-[attr(data-placeholder)] before:float-left before:text-[#555555] before:pointer-events-none before:h-0',
      }),
      TaskList.configure({ HTMLAttributes: { class: 'task-list my-2 pl-0 list-none' } }),
      TaskItem.configure({ nested: true }),
      Image.configure({ HTMLAttributes: { class: 'my-3 max-w-full rounded-lg' } }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Details.configure({ persist: true }),
      DetailsSummary,
      DetailsContent,
      Callout,
      SlashCommand,
      AiPrompt.configure({ onMount: (el) => setAiContainer(el) }),
      ImagePlaceholder.configure({
        getToken: () => token ?? null,
        getIsDark: () => isDark,
      }),
      BlockHandle,
    ],
    content,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Backspace') {
          const { selection } = view.state;
          if (selection.empty && selection.from <= 1) {
            onNavigateToTitle?.();
            return true;
          }
        }
        if (event.key === 'ArrowUp') {
          const { selection } = view.state;
          if (selection.empty && selection.from <= 1) {
            onNavigateToTitle?.();
            return true;
          }
        }
        return false;
      },
      attributes: {
        class: cn(
          'prose prose-invert max-w-none focus:outline-none min-h-[calc(100vh-320px)] w-full text-sm leading-relaxed',
          // Only show placeholder when editor has focus
          '[&:not(.ProseMirror-focused)_*:before]:!content-none [&:not(.ProseMirror-focused)]:before:!content-none',
          // Notion-style block selection highlight when 6-dot handle is clicked
          '[&_.ProseMirror-selectednode]:bg-[#2383e2]/15 [&_.ProseMirror-selectednode]:rounded-sm [&_.ProseMirror-selectednode]:outline-none',
          // Block styling for slash-menu elements
          '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2',
          '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2',
          '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5',
          '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1',
          '[&_hr]:my-4 [&_hr]:border-white/15',
          '[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2',
          '[&_ul[data-type=taskList]_li>label]:mt-0.5 [&_ul[data-type=taskList]_li>div]:flex-1',
          '[&_ul[data-type=taskList]_li[data-checked=true]>div]:line-through [&_ul[data-type=taskList]_li[data-checked=true]>div]:opacity-50',
          '[&_details]:my-2 [&_summary]:cursor-pointer [&_summary]:font-medium',
          '[&_div[data-type=detailsContent]]:pl-5 [&_div[data-type=detailsContent]]:pt-1',
          '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse',
          '[&_th]:border [&_th]:border-white/15 [&_th]:bg-white/5 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left',
          '[&_td]:border [&_td]:border-white/15 [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top',
          isDark ? 'text-[#e0e0e0]' : 'text-[#202020]',
        ),
      },
    },
    onUpdate: ({ editor }) => {
      if (!isUpdatingRef.current) {
        const html = editor.getHTML();
        onChange?.(html);
      }
    },
  });

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Sync external content changes (e.g. switching between different documents)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      isUpdatingRef.current = true;
      editor.commands.setContent(content || '<p></p>');
      isUpdatingRef.current = false;
      closeAiPrompt(editor);
      setAiContainer(null);
      setAiText('');
    }
  }, [content, editor]);

  const closeAi = useCallback(
    (refocus = true) => {
      if (editor && !editor.isDestroyed) {
        closeAiPrompt(editor);
        if (refocus) editor.commands.focus();
      }
      setAiContainer(null);
      setAiText('');
      setAiNotice(null);
      setAiLoading(false);
    },
    [editor],
  );

  const submitAi = async () => {
    const prompt = aiText.trim();
    if (!prompt || !editor) return;
    if (!onAiSubmit) {
      setAiNotice("AI isn't connected yet.");
      return;
    }
    setAiLoading(true);
    setAiNotice(null);
    try {
      const result = await onAiSubmit(prompt, editor.getText());
      closeAi();
      if (!result) return;
      const isHtml = /<\/?(p|h[1-6]|ul|ol|li|blockquote|pre|table|hr|div)[^>]*>/i.test(result);
      const contentToInsert = isHtml
        ? result
        : result
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
            .join('');
      if (contentToInsert) editor.chain().focus().insertContent(contentToInsert).run();
    } catch (err) {
      console.error('[TiptapEditor] AI request failed:', err);
      setAiLoading(false);
      setAiNotice('Something went wrong. Please try again.');
    }
  };

  return (
    <div
      className={cn('w-full min-h-[calc(100vh-320px)] relative cursor-text select-text', className)}
      onClick={() => editor?.commands.focus()}
    >
      <EditorContent editor={editor} />
      {editor && <BlockHandleOverlay editor={editor} isDark={isDark} />}
      {aiContainer &&
        createPortal(
          <AiPromptBox
            isDark={isDark}
            value={aiText}
            onChange={(v) => {
              setAiText(v);
              setAiNotice(null);
            }}
            onSubmit={submitAi}
            onClose={closeAi}
            isLoading={aiLoading}
            notice={aiNotice}
          />,
          aiContainer,
        )}
    </div>
  );
}

export default TiptapEditor;
