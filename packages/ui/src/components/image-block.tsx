'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Node, NodeViewWrapper, ReactNodeViewRenderer, mergeAttributes } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { AlertCircle, ImageIcon, Loader2, Search, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  searchGiphy,
  searchUnsplash,
  trackUnsplashDownload,
  uploadImage,
} from '../lib/media-api';
import type { MediaResult } from '../lib/media-api';

/* -------------------------------------------------------------------------- */
/*  Picker popover                                                            */
/* -------------------------------------------------------------------------- */

type TabId = 'upload' | 'embed' | 'unsplash' | 'giphy';

const TABS: { id: TabId; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'embed', label: 'Embed link' },
  { id: 'unsplash', label: 'Unsplash' },
  { id: 'giphy', label: 'GIPHY' },
];

interface PickerProps {
  isDark: boolean;
  token?: string | null;
  onSelect: (url: string, alt?: string) => void;
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p className="mt-3 flex items-start gap-1.5 text-xs text-red-400">
      <AlertCircle className="mt-px size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function UploadTab({ isDark, token, onSelect }: PickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const url = await uploadImage(file, token);
      onSelect(url, file.name);
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
      setBusy(false);
    }
  };

  return (
    <div className="p-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-wait',
          isDark
            ? 'border-white/15 hover:bg-white/[0.06]'
            : 'border-black/15 hover:bg-black/[0.05]',
          dragging && (isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]'),
        )}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        <span>{busy ? 'Uploading…' : 'Upload file'}</span>
      </button>
      <p className="mt-2 text-center text-xs text-[#8a8a8a]">
        The maximum size per file is {MAX_IMAGE_BYTES / 1024 / 1024} MB.
      </p>
      {error && <ErrorLine message={error} />}
    </div>
  );
}

function EmbedTab({ isDark, onSelect }: PickerProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const url = value.trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    } catch {
      setError('Enter a valid image link starting with http:// or https://');
      return;
    }
    onSelect(url);
  };

  return (
    <div className="p-3">
      <input
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Paste the image link…"
        className={cn(
          'w-full rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-[#6e6e6e] focus:border-[#2383e2]',
          isDark ? 'border-white/15' : 'border-black/15',
        )}
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        className="mt-3 w-full cursor-pointer rounded-md bg-[#2383e2] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1b74cc] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Embed image
      </button>
      <p className="mt-2 text-center text-xs text-[#8a8a8a]">Works with any image link</p>
      {error && <ErrorLine message={error} />}
    </div>
  );
}

function MediaTab({
  provider,
  isDark,
  onSelect,
}: PickerProps & { provider: 'unsplash' | 'giphy' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<MediaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced search; empty query shows popular / trending
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const search = provider === 'unsplash' ? searchUnsplash : searchGiphy;
        setResults(await search(q.trim(), controller.signal));
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setResults([]);
        setError(err?.message || 'Search failed.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, q ? 350 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, provider]);

  const label = provider === 'unsplash' ? 'Unsplash' : 'GIPHY';

  return (
    <div className="p-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border px-2.5 py-1.5',
          isDark ? 'border-white/15' : 'border-black/15',
        )}
      >
        <Search className="size-3.5 shrink-0 text-[#8a8a8a]" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${label}…`}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#6e6e6e]"
        />
      </div>

      <div className="mt-3 h-[260px] overflow-y-auto [scrollbar-width:thin]">
        {error ? (
          <ErrorLine message={error} />
        ) : loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#8a8a8a]" />
          </div>
        ) : results.length === 0 ? (
          <p className="pt-10 text-center text-xs text-[#8a8a8a]">No results</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.authorName ? `${item.alt} — ${item.authorName}` : item.alt}
                onClick={() => {
                  if (provider === 'unsplash') trackUnsplashDownload(item.downloadLocation);
                  onSelect(item.url, item.alt);
                }}
                className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded bg-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbUrl}
                  alt={item.alt}
                  loading="lazy"
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
                {provider === 'unsplash' && item.authorName && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pt-3 pb-1 text-left text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {item.authorName}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-[#6e6e6e]">
        {provider === 'unsplash' ? 'Photos by Unsplash' : 'Powered by GIPHY'}
      </p>
    </div>
  );
}

function ImagePicker(props: PickerProps) {
  const [tab, setTab] = useState<TabId>('upload');
  const { isDark } = props;

  return (
    <div>
      <div
        role="tablist"
        className={cn('flex gap-1 border-b px-2 pt-1.5', isDark ? 'border-white/10' : 'border-black/10')}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px cursor-pointer border-b-2 px-2 pt-1 pb-1.5 text-sm transition-colors',
              tab === t.id
                ? isDark
                  ? 'border-white text-white'
                  : 'border-black text-black'
                : 'border-transparent text-[#8a8a8a] hover:text-current',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'upload' && <UploadTab {...props} />}
      {tab === 'embed' && <EmbedTab {...props} />}
      {tab === 'unsplash' && <MediaTab provider="unsplash" {...props} />}
      {tab === 'giphy' && <MediaTab provider="giphy" {...props} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Node view: the "Add an image" container + anchored popover                */
/* -------------------------------------------------------------------------- */

const POPOVER_WIDTH = 460;

function ImagePlaceholderView({ editor, node, getPos, extension, selected }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const isDark: boolean = extension.options.getIsDark?.() ?? true;

  // Open instantly when this block was just created from the slash menu
  useEffect(() => {
    const storage = (editor.storage as any).imagePlaceholder;
    if (storage?.openNext) {
      storage.openNext = false;
      setOpen(true);
    }
  }, [editor]);

  const reposition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popHeight = popoverRef.current?.offsetHeight ?? 360;
    let top = rect.bottom + 6;
    if (top + popHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - popHeight - 6);
    }
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8));
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true); // capture: catches the page's scroll container
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, reposition]);

  // Close when clicking anywhere else (or pressing Escape)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as globalThis.Node;
      if (containerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (src: string, alt?: string) => {
    const at = getPos();
    if (typeof at !== 'number') return;
    setOpen(false);
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: at, to: at + node.nodeSize },
        { type: 'image', attrs: { src, alt: alt || null } },
      )
      .run();
  };

  return (
    <NodeViewWrapper className="my-2 select-none" data-drag-handle>
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm text-[#8a8a8a] transition-colors',
          isDark ? 'bg-white/[0.05] hover:bg-white/[0.08]' : 'bg-black/[0.04] hover:bg-black/[0.07]',
          (open || selected) && (isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'),
        )}
      >
        <ImageIcon className="size-5 shrink-0" />
        <span>Add an image</span>
      </div>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: POPOVER_WIDTH, zIndex: 9999 }}
            className={cn(
              'max-w-[calc(100vw-16px)] rounded-lg border shadow-2xl animate-in fade-in zoom-in-95 duration-100',
              isDark
                ? 'border-white/10 bg-[#252525] text-[#e6e6e6]'
                : 'border-black/10 bg-white text-[#1a1a1a]',
            )}
          >
            <ImagePicker
              isDark={isDark}
              token={extension.options.getToken?.() ?? null}
              onSelect={handleSelect}
            />
          </div>,
          document.body,
        )}
    </NodeViewWrapper>
  );
}

/* -------------------------------------------------------------------------- */
/*  Extension                                                                 */
/* -------------------------------------------------------------------------- */

export interface ImagePlaceholderOptions {
  getToken?: () => string | null | undefined;
  getIsDark?: () => boolean;
}

export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({
  name: 'imagePlaceholder',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {};
  },

  addStorage() {
    return { openNext: false };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-placeholder"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-placeholder' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImagePlaceholderView);
  },
});
