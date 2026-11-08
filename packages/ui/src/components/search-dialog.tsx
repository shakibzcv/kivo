'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import type { PageItem } from '../lib/page-api';
import { getPageIcon } from './page-tree';

export interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PageItem[];
  onSelectPage: (page: PageItem) => void;
  isDark?: boolean;
}

interface FlattenedPage {
  page: PageItem;
  path: string;
}

function flattenPages(items: PageItem[], parentPath = ''): FlattenedPage[] {
  let list: FlattenedPage[] = [];
  for (const item of items) {
    const currentPath = parentPath ? `${parentPath} / ${item.title || 'Untitled'}` : (item.title || 'Untitled');
    list.push({ page: item, path: currentPath });
    if (item.children && item.children.length > 0) {
      list = list.concat(flattenPages(item.children, currentPath));
    }
  }
  return list;
}

export function SearchDialog({
  isOpen,
  onClose,
  pages,
  onSelectPage,
  isDark = true,
}: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const flatList = useMemo(() => flattenPages(pages), [pages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatList.slice(0, 15);
    return flatList.filter((item) =>
      item.page.title.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [flatList, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global keydown listeners for keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter') {
        if (filtered[selectedIndex]) {
          e.preventDefault();
          onSelectPage(filtered[selectedIndex].page);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onSelectPage, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col',
          isDark
            ? 'bg-[#1e1e1e] border-white/[0.1] text-white shadow-black/80'
            : 'bg-white border-black/[0.1] text-black shadow-black/20'
        )}
      >
        {/* Search Input Bar */}
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3.5 border-b shrink-0',
            isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
          )}
        >
          <Search className="size-4.5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to page..."
            className={cn(
              'flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400',
              isDark ? 'text-white' : 'text-black'
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-mono',
                isDark
                  ? 'bg-white/[0.08] text-gray-400 border border-white/[0.08]'
                  : 'bg-black/[0.06] text-gray-600 border border-black/[0.06]'
              )}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              <FileText className="size-8 mx-auto mb-2 opacity-40" />
              <span>No pages found matching &ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.page.id}
                  onClick={() => {
                    onSelectPage(item.page);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer',
                    isSelected
                      ? isDark
                        ? 'bg-white/[0.12] text-white'
                        : 'bg-black/[0.07] text-black font-medium'
                      : isDark
                        ? 'hover:bg-white/[0.06] text-gray-300'
                        : 'hover:bg-black/[0.04] text-gray-700'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="shrink-0 flex items-center justify-center size-5">
                      {getPageIcon(item.page, 'size-4')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[13px]">
                        {item.page.title || 'Untitled'}
                      </div>
                      {item.path !== item.page.title && (
                        <div className="text-[10px] text-gray-400 truncate">
                          {item.path}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <ArrowRight className="size-3.5 text-gray-400 shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          className={cn(
            'px-4 py-2 border-t flex items-center justify-between text-[11px] text-gray-400 shrink-0',
            isDark ? 'border-white/[0.06] bg-black/20' : 'border-black/[0.06] bg-gray-50'
          )}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> to select
            </span>
          </div>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}
