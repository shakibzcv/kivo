'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Home,
  Target,
  PenLine,
  GraduationCap,
  Plus,
  Trash2,
} from 'lucide-react';
import { PageItem } from '../lib/page-api';
import { cn } from '../lib/utils';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';

import { renderPageIcon } from './icon-picker';

export interface PageTreeProps {
  pages: PageItem[];
  selectedId: string | null;
  onSelect: (page: PageItem) => void;
  onCreatePage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  isDark?: boolean;
}

export function getPageIcon(page: PageItem, sizeClass = 'size-4') {
  if (page.icon) {
    return renderPageIcon(page.icon, sizeClass);
  }
  const title = (page.title || '').toLowerCase();

  if (title === 'home') {
    return <Home className={cn(sizeClass, 'shrink-0 text-slate-300')} />;
  }
  if (title.includes('project')) {
    return <Target className={cn(sizeClass, 'shrink-0 text-red-400/90')} />;
  }
  if (title.includes('article') || title.includes('writing')) {
    return <PenLine className={cn(sizeClass, 'shrink-0 text-amber-400/90')} />;
  }
  if (title.includes('knowledge')) {
    return <GraduationCap className={cn(sizeClass, 'shrink-0 text-blue-400/90')} />;
  }
  return <FileText className={cn(sizeClass, 'shrink-0 text-slate-400')} />;
}

export function PageTree({
  pages,
  selectedId,
  onSelect,
  onCreatePage,
  onDeletePage,
  isDark = true,
}: PageTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pageToDelete, setPageToDelete] = useState<PageItem | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (items: PageItem[], level = 0) => {
    return items.map((page) => {
      const isSelected = selectedId === page.id;
      const hasChildren = Boolean(page.children && page.children.length > 0);
      const isExpanded = expanded[page.id] ?? false;

      return (
        <div key={page.id} className="select-none">
          <div
            onClick={() => onSelect(page)}
            style={{ paddingLeft: `${level * 14 + 6}px` }}
            className={cn(
              'group flex items-center justify-between pr-2 py-0.5 min-h-[28px] rounded-md text-xs transition-colors cursor-pointer text-left',
              isSelected
                ? isDark
                  ? 'bg-white/[0.12] text-white font-medium'
                  : 'bg-black/[0.08] text-black font-medium'
                : isDark
                  ? 'text-[#d4d4d4] hover:bg-white/[0.05] hover:text-white'
                  : 'text-[#37352f] hover:bg-black/[0.04] hover:text-black'
            )}
          >
            {/* Left: Morphing Icon/Arrow + Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Icon / Chevron container (enlarged container on hover with decreased parent py) */}
              <button
                type="button"
                onClick={(e) => toggleExpand(page.id, e)}
                className="size-5.5 shrink-0 flex items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {/* Resting state (no hover & not expanded): Show page icon */}
                <span
                  className={cn(
                    'items-center justify-center',
                    isExpanded ? 'hidden' : 'flex group-hover:hidden'
                  )}
                >
                  {getPageIcon(page, 'size-4')}
                </span>

                {/* Hover state OR expanded state: Arrow */}
                <span
                  className={cn(
                    'items-center justify-center text-[#9b9b9b] hover:text-white',
                    isExpanded ? 'flex' : 'hidden group-hover:flex'
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </span>
              </button>

              {/* Title */}
              <span className="truncate">{page.title || 'Untitled'}</span>
            </div>

            {/* Right: Hover action buttons (+ Add sub-page, Delete) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((prev) => ({ ...prev, [page.id]: true }));
                  onCreatePage(page.id);
                }}
                className={cn(
                  'p-1 rounded transition-colors cursor-pointer',
                  isDark
                    ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                    : 'hover:bg-black/10 text-gray-600 hover:text-black'
                )}
                title="Add sub-page"
              >
                <Plus className="size-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPageToDelete(page);
                }}
                className="p-1 rounded transition-colors cursor-pointer hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                title="Delete page"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>

          {/* Children items or 'No pages inside' when expanded */}
          {isExpanded && (
            <div className="mt-0.5">
              {hasChildren ? (
                renderTree(page.children!, level + 1)
              ) : (
                <div
                  style={{ paddingLeft: `${(level + 1) * 14 + 18}px` }}
                  className={cn(
                    'py-1 text-xs select-none font-normal italic',
                    isDark ? 'text-[#84827e]' : 'text-[#9b9a97]'
                  )}
                >
                  No pages inside
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-0.5 pt-1">
      {/* Pages Tree or Empty State */}
      {pages.length > 0 ? (
        <div className="space-y-0.5">{renderTree(pages)}</div>
      ) : (
        <div className="px-1 py-1">
          <button
            type="button"
            onClick={() => onCreatePage(null)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
              isDark
                ? 'text-[#8e8e8e] hover:text-white hover:bg-white/[0.04]'
                : 'text-[#6b6966] hover:text-black hover:bg-black/[0.04]'
            )}
          >
            <Plus className="size-3.5" />
            <span>Add a page</span>
          </button>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(pageToDelete)}
        onClose={() => setPageToDelete(null)}
        onConfirm={() => {
          if (pageToDelete) {
            onDeletePage(pageToDelete.id);
            setPageToDelete(null);
          }
        }}
        title="Delete page"
        description={`Are you sure you want to delete "${pageToDelete?.title || 'Untitled'}"? All sub-pages inside it will also be deleted.`}
        isDark={isDark}
      />
    </div>
  );
}

export default PageTree;
