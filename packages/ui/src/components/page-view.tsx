'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  PanelLeft,
  Download,
  Smile,
  ImageIcon,
  Check,
  X,
  Move,
} from 'lucide-react';
import { PageItem, updatePageInApi, fetchPageByIdFromApi } from '../lib/page-api';
import { generateInlineContent, type AiAction } from '../lib/ai-api';
import { TiptapEditor } from './tiptap-editor';
import { getPageIcon } from './page-tree';
import { AiSidebar } from './ai-sidebar';
import { AiAvatar } from './ai-avatar';
import { IconPicker, renderPageIcon } from './icon-picker';
import { CoverPicker } from './cover-picker';
import { cn } from '../lib/utils';

export interface PageViewProps {
  page: PageItem | null;
  onPageUpdate?: (updatedPage: PageItem) => void;
  token?: string | null;
  isDark?: boolean;
  showHeader?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  /** Called when the AI creates, updates or deletes pages. */
  onPagesChanged?: (actions: AiAction[]) => void | Promise<void>;
}

export function PageView({
  page,
  onPageUpdate,
  token,
  isDark = true,
  showHeader = true,
  isSidebarOpen = true,
  onToggleSidebar,
  onPagesChanged,
}: PageViewProps) {
  const [title, setTitle] = useState(page?.title || '');
  const [content, setContent] = useState(page?.content || '');
  const [icon, setIcon] = useState<string | null>(page?.icon || null);
  const [coverImage, setCoverImage] = useState<string | null>(page?.coverImage || null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Popover states
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  // Cover repositioning state
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [coverPosition, setCoverPosition] = useState<number>(50);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [startPosPercent, setStartPosPercent] = useState<number>(50);

  // Element Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const coverPickerRef = useRef<HTMLDivElement>(null);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);

  // Parse cover position from coverImage string if stored with '#pos=X'
  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setContent(page.content || '');
      setIcon(page.icon || null);

      const rawCover = page.coverImage || null;
      setCoverImage(rawCover);
      if (rawCover && rawCover.includes('#pos=')) {
        const parts = rawCover.split('#pos=');
        const p = Number(parts[1]);
        if (!isNaN(p)) setCoverPosition(p);
      } else {
        setCoverPosition(50);
      }
    }
  }, [page?.id]);

  // Click outside listener for Cover & Icon Pickers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isCoverPickerOpen &&
        coverPickerRef.current &&
        !coverPickerRef.current.contains(target)
      ) {
        setIsCoverPickerOpen(false);
      }
      if (
        isIconPickerOpen &&
        iconPickerRef.current &&
        !iconPickerRef.current.contains(target)
      ) {
        setIsIconPickerOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCoverPickerOpen(false);
        setIsIconPickerOpen(false);
        if (isRepositioning) setIsRepositioning(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCoverPickerOpen, isIconPickerOpen, isRepositioning]);

  // Debounced auto-save to Cloud Database (PostgreSQL) via API with merge accumulator
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<Partial<PageItem>>({});
  const activePageIdRef = useRef<string | null>(page?.id || null);

  useEffect(() => {
    // Flush any pending updates for the previous page if user switched pages
    if (activePageIdRef.current && activePageIdRef.current !== page?.id) {
      const prevId = activePageIdRef.current;
      const pending = { ...pendingUpdatesRef.current };
      if (Object.keys(pending).length > 0) {
        updatePageInApi(prevId, pending, token).catch(() => {});
        pendingUpdatesRef.current = {};
      }
    }
    activePageIdRef.current = page?.id || null;
  }, [page?.id, token]);

  const flushPendingUpdates = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const currentId = page?.id;
    const pending = { ...pendingUpdatesRef.current };
    if (!currentId || Object.keys(pending).length === 0) return;

    pendingUpdatesRef.current = {};
    try {
      const updated = await updatePageInApi(currentId, pending, token);
      if (updated && onPageUpdate) {
        onPageUpdate(updated);
      }
    } catch (err) {
      console.error('[PageView] Failed to flush pending page save:', err);
    }
  }, [page?.id, token, onPageUpdate]);

  const saveUpdates = useCallback(
    (updates: Partial<PageItem>) => {
      if (!page?.id) return;
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        saveTimeoutRef.current = null;
        const currentId = page.id;
        const toSave = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {};

        if (Object.keys(toSave).length === 0) return;
        try {
          const updated = await updatePageInApi(currentId, toSave, token);
          if (updated && onPageUpdate) {
            onPageUpdate(updated);
          }
        } catch (err) {
          console.error('[PageView] Failed to auto-save page to cloud:', err);
        }
      }, 500);
    },
    [page?.id, token, onPageUpdate]
  );

  // Handle inline "Edit with AI" prompt (Space on an empty line)
  const handleInlineAi = useCallback(
    async (prompt: string, documentText: string): Promise<string> => {
      return generateInlineContent({
        prompt,
        pageTitle: title,
        documentText,
        token,
      });
    },
    [title, token]
  );

  // Handle AI sidebar actions (created/updated/deleted pages)
  const handleAiActions = useCallback(
    async (actions: AiAction[]) => {
      // If current page was updated by the AI, reload its latest fields
      const currentWasUpdated = actions.some((a) => a.type === 'updated' && a.pageId === page?.id);
      if (currentWasUpdated && page?.id) {
        try {
          const fresh = await fetchPageByIdFromApi(page.id, token);
          if (fresh) {
            setTitle(fresh.title || '');
            setContent(fresh.content || '');
            setIcon(fresh.icon || null);
            setCoverImage(fresh.coverImage || null);
            onPageUpdate?.(fresh);
          }
        } catch (err) {
          console.error('[PageView] Failed to reload page after AI update:', err);
        }
      }

      // Notify parent tree to refetch/update hierarchy
      if (onPagesChanged) {
        await onPagesChanged(actions);
      }
    },
    [page?.id, token, onPageUpdate, onPagesChanged]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    saveUpdates({ title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    saveUpdates({ content: newContent });
  };

  // Change Icon
  const handleIconChange = (newIcon: string | null) => {
    setIcon(newIcon);
    saveUpdates({ icon: newIcon });
    setIsIconPickerOpen(false);
  };

  // Change Cover Image
  const handleCoverChange = (newCover: string | null) => {
    setCoverImage(newCover);
    setCoverPosition(50);
    saveUpdates({ coverImage: newCover });
    setIsCoverPickerOpen(false);
  };

  // Repositioning drag handlers
  const handleRepositionMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    e.preventDefault();
    setDragStartY(e.clientY);
    setStartPosPercent(coverPosition);
  };

  const handleRepositionMouseMove = (e: React.MouseEvent) => {
    if (!isRepositioning || dragStartY === null || !coverContainerRef.current) return;
    const deltaY = e.clientY - dragStartY;
    const height = coverContainerRef.current.clientHeight || 200;
    // Dragging down moves objectPosition downward
    const deltaPercent = (deltaY / height) * 100;
    const newPos = Math.max(0, Math.min(100, Math.round(startPosPercent - deltaPercent)));
    setCoverPosition(newPos);
  };

  const handleRepositionMouseUp = () => {
    if (isRepositioning) {
      setDragStartY(null);
    }
  };

  const handleSavePosition = () => {
    if (!coverImage) {
      setIsRepositioning(false);
      return;
    }
    const baseUrl = coverImage.split('#pos=')[0];
    const updatedCover = `${baseUrl}#pos=${coverPosition}`;
    setCoverImage(updatedCover);
    saveUpdates({ coverImage: updatedCover });
    setIsRepositioning(false);
  };

  const handleCancelPosition = () => {
    // Revert to saved position
    if (coverImage && coverImage.includes('#pos=')) {
      const p = Number(coverImage.split('#pos=')[1]);
      setCoverPosition(isNaN(p) ? 50 : p);
    } else {
      setCoverPosition(50);
    }
    setIsRepositioning(false);
  };

  // Download Cover Image
  const handleDownloadCover = async () => {
    if (!coverImage) return;

    const rawUrl = coverImage.split('#pos=')[0] || '';

    // If gradient or solid color, render to canvas
    if (
      rawUrl.startsWith('linear-gradient') ||
      rawUrl.startsWith('#') ||
      rawUrl.startsWith('rgb')
    ) {
      downloadGradientCover(rawUrl);
      return;
    }

    // Direct Image URL
    try {
      const res = await fetch(rawUrl, { mode: 'cors' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-${title || 'page'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = rawUrl;
      a.target = '_blank';
      a.download = `cover-${title || 'page'}.jpg`;
      a.click();
    }
  };

  // Helper to render gradient to canvas & trigger download
  const downloadGradientCover = (gradientCss: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gradientCss.startsWith('#')) {
      ctx.fillStyle = gradientCss;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#74ebd5');
      grad.addColorStop(1, '#acb6e5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-${title || 'page'}.png`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  // Keyboard navigation: Navigate to editor first row
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editorRef.current?.commands?.focus('start');
    } else if (e.key === 'ArrowDown') {
      editorRef.current?.commands?.focus('start');
    }
  };

  // Keyboard navigation: Back from editor to title input
  const handleNavigateToTitle = () => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      const len = titleInputRef.current.value.length;
      titleInputRef.current.setSelectionRange(len, len);
    }
  };

  if (!page) {
    return (
      <div className="flex-1 h-full min-h-0 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="max-w-md space-y-3">
          <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
            <FileText className="size-6" />
          </div>
          <h2 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
            No page selected
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Select a page from the sidebar or click &ldquo;Add a page&rdquo; to start drafting your ideas.
          </p>
        </div>
      </div>
    );
  }

  // Cover image source and type
  const rawCover = coverImage ? coverImage.split('#pos=')[0] : null;
  const isGradientOrColor =
    rawCover &&
    (rawCover.startsWith('linear-gradient') ||
      rawCover.startsWith('#') ||
      rawCover.startsWith('rgb'));

  return (
    <div
      className={cn(
        'flex-1 h-full min-h-0 flex flex-row overflow-hidden relative select-none transition-colors',
        isDark ? 'bg-[#191919] text-[#e0e0e0]' : 'bg-[#ffffff] text-[#1a1a1a]'
      )}
    >
      {/* Center Main Document Column */}
      <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden relative min-w-0">
        {/* 1. Top Clean Header */}
        {showHeader && (
          <header
            className={cn(
              'h-11 px-4 flex items-center justify-between border-b shrink-0 z-20 backdrop-blur-sm select-none',
              isDark
                ? 'bg-[#191919]/90 border-white/[0.06] text-[#d4d4d4]'
                : 'bg-white/90 border-black/[0.06] text-[#37352f]'
            )}
          >
            {/* Left: Sidebar toggle if closed + Page Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              {!isSidebarOpen && onToggleSidebar && (
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className={cn(
                    'p-1 rounded-md transition-colors cursor-pointer mr-0.5',
                    isDark
                      ? 'hover:bg-white/[0.08] text-[#9b9b9b] hover:text-white'
                      : 'hover:bg-black/[0.06] text-[#6b6966] hover:text-black'
                  )}
                  title="Open sidebar"
                >
                  <PanelLeft className="size-4" />
                </button>
              )}
              {icon ? (
                renderPageIcon(icon, 'size-3.5')
              ) : (
                getPageIcon({ ...page, title }, 'size-3.5')
              )}
              <span
                className={cn(
                  'text-xs font-medium truncate max-w-sm',
                  isDark ? 'text-white/90' : 'text-gray-900'
                )}
              >
                {title || 'Untitled'}
              </span>
            </div>

            <div className="flex items-center" />
          </header>
        )}

        {/* 2. Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Cover Banner Area (Only rendered when page has a cover) */}
          {rawCover ? (
            <div className="relative w-full h-48 sm:h-56 select-none transition-all group z-10">
              {/* Clipped background/image layer */}
              <div
                ref={coverContainerRef}
                onMouseDown={handleRepositionMouseDown}
                onMouseMove={handleRepositionMouseMove}
                onMouseUp={handleRepositionMouseUp}
                className={cn(
                  'absolute inset-0 overflow-hidden',
                  isRepositioning ? 'cursor-ns-resize' : 'cursor-default'
                )}
                style={{
                  background: isGradientOrColor ? rawCover! : undefined,
                }}
              >
                {/* If Image URL: render <img> with objectPosition */}
                {!isGradientOrColor && (
                  <img
                    src={rawCover}
                    alt="Page cover"
                    className="size-full object-cover select-none pointer-events-none transition-all duration-75"
                    style={{
                      objectPosition: `center ${coverPosition}%`,
                    }}
                  />
                )}

                {/* Reposition Mode Overlay: Banner Hint + Save / Cancel */}
                {isRepositioning && (
                  <div className="absolute inset-x-0 top-4 z-30 flex items-center justify-center">
                    <div className="bg-black/75 backdrop-blur-md text-white text-xs px-4 py-1.5 rounded-full border border-white/20 shadow-xl flex items-center gap-3">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Move className="size-3.5 text-blue-400" />
                        Drag image to reposition
                      </span>
                      <div className="h-3 w-px bg-white/20" />
                      <button
                        type="button"
                        onClick={handleSavePosition}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                      >
                        <Check className="size-3" />
                        Save position
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPosition}
                        className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer"
                      >
                        <X className="size-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Top-Right Action Buttons: Change, Reposition, Download (Icon button) */}
              {!isRepositioning && (
                <div className="absolute top-3 right-4 flex items-center gap-1.5 z-20">
                  {/* 1. Change Button (Text button) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCoverPickerOpen((prev) => !prev);
                      setIsIconPickerOpen(false);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all flex items-center shadow-xs',
                      isDark
                        ? 'bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/10 backdrop-blur-md'
                        : 'bg-white/80 hover:bg-white text-black border border-black/10 backdrop-blur-md shadow-xs'
                    )}
                  >
                    Change
                  </button>

                  {/* 2. Reposition Button (Text button) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRepositioning(true);
                      setIsCoverPickerOpen(false);
                      setIsIconPickerOpen(false);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all flex items-center shadow-xs',
                      isDark
                        ? 'bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/10 backdrop-blur-md'
                        : 'bg-white/80 hover:bg-white text-black border border-black/10 backdrop-blur-md shadow-xs'
                    )}
                  >
                    Reposition
                  </button>

                  {/* 3. Download Button (Icon button) */}
                  <button
                    type="button"
                    onClick={handleDownloadCover}
                    title="Download cover image"
                    className={cn(
                      'p-1.5 rounded-md text-xs font-medium cursor-pointer transition-all flex items-center justify-center shadow-xs',
                      isDark
                        ? 'bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/10 backdrop-blur-md'
                        : 'bg-white/80 hover:bg-white text-black border border-black/10 backdrop-blur-md shadow-xs'
                    )}
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              )}

              {/* Cover Picker Popover anchored to top right */}
              {isCoverPickerOpen && (
                <div
                  ref={coverPickerRef}
                  className="absolute top-12 right-4 z-50 shadow-2xl"
                >
                  <CoverPicker
                    currentCover={coverImage}
                    onSelect={handleCoverChange}
                    onClose={() => setIsCoverPickerOpen(false)}
                    isDark={isDark}
                    token={token}
                  />
                </div>
              )}
            </div>
          ) : null}

          {/* Content Body Container - takes full page width with responsive padding */}
          <div className="relative z-20 w-full px-6 sm:px-12 md:px-20 lg:px-28 pb-24 group/main">
            {/* Notion-style hover actions: Add icon / Add cover when none exists */}
            {(!icon || !rawCover) && (
              <div
                className={cn(
                  'flex items-center gap-2 pb-2 opacity-0 group-hover/main:opacity-100 transition-opacity',
                  rawCover ? 'pt-3' : 'pt-8'
                )}
              >
                {!icon && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsIconPickerOpen(true);
                        setIsCoverPickerOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer',
                        isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-black hover:bg-black/5'
                      )}
                    >
                      <Smile className="size-3.5" />
                      <span>Add icon</span>
                    </button>

                    {/* Icon Picker Popover when opening from Add Icon */}
                    {isIconPickerOpen && !icon && (
                      <div
                        ref={iconPickerRef}
                        className="absolute top-8 left-0 z-50"
                      >
                        <IconPicker
                          currentIcon={icon}
                          onSelect={handleIconChange}
                          onClose={() => setIsIconPickerOpen(false)}
                          isDark={isDark}
                          token={token}
                        />
                      </div>
                    )}
                  </div>
                )}

                {!rawCover && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCoverPickerOpen((prev) => !prev);
                        setIsIconPickerOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer',
                        isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-black hover:bg-black/5'
                      )}
                    >
                      <ImageIcon className="size-3.5" />
                      <span>Add cover</span>
                    </button>

                    {/* Cover Picker Popover when opening from Add Cover */}
                    {isCoverPickerOpen && (
                      <div
                        ref={coverPickerRef}
                        className="absolute top-8 left-0 z-50"
                      >
                        <CoverPicker
                          currentCover={coverImage}
                          onSelect={handleCoverChange}
                          onClose={() => setIsCoverPickerOpen(false)}
                          isDark={isDark}
                          token={token}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Page Icon + Icon Picker (Pure icon without background box or border, resting on top of cover) */}
            {icon && (
              <div
                className={cn(
                  'relative z-30 mb-4 flex items-center',
                  rawCover ? '-mt-12 sm:-mt-14' : 'mt-4'
                )}
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsIconPickerOpen((prev) => !prev);
                      setIsCoverPickerOpen(false);
                    }}
                    title="Click to change icon"
                    className={cn(
                      'group relative inline-flex items-center justify-center rounded-2xl p-1 transition-all cursor-pointer select-none text-[64px] sm:text-[76px] leading-none',
                      isDark
                        ? 'hover:bg-white/[0.08]'
                        : 'hover:bg-black/[0.05]'
                    )}
                  >
                    {renderPageIcon(icon, 'size-16 sm:size-20 text-[64px] sm:text-[76px]')}
                  </button>

                  {/* Icon Picker Popover */}
                  {isIconPickerOpen && (
                    <div
                      ref={iconPickerRef}
                      className="absolute top-full left-0 mt-2 z-50"
                    >
                      <IconPicker
                        currentIcon={icon}
                        onSelect={handleIconChange}
                        onClose={() => setIsIconPickerOpen(false)}
                        isDark={isDark}
                        token={token}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Document Title Input with Keyboard Navigation */}
            <div className="mb-6">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled"
                className={cn(
                  'w-full font-serif text-3xl sm:text-4xl font-bold bg-transparent outline-none border-none p-0 tracking-tight leading-tight',
                  isDark
                    ? 'text-white placeholder:text-gray-600'
                    : 'text-gray-900 placeholder:text-gray-400'
                )}
              />
            </div>

            {/* 5. Tiptap Rich-Text Editor with keyboard navigation back to title */}
            <div className="flex-1 min-h-[calc(100vh-320px)] w-full pb-20">
              <TiptapEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Press 'space' for AI or '/' for commands"
                isDark={isDark}
                token={token}
                editorRef={editorRef}
                onNavigateToTitle={handleNavigateToTitle}
                onAiSubmit={handleInlineAi}
              />
            </div>
          </div>
        </div>

        {/* Bottom-Right Floating Action Button (FAB) */}
        {!isRightSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsRightSidebarOpen(true)}
            className="absolute bottom-6 right-6 size-12 rounded-full bg-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer z-30 border border-black/10 group overflow-hidden p-1"
            title="Open AI Assistant"
          >
            <div className="size-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              <AiAvatar className="size-full object-cover rounded-full transition-transform group-hover:scale-110" />
            </div>
          </button>
        )}
      </div>

      {/* Resizable Right AI Sidebar */}
      {isRightSidebarOpen && (
        <AiSidebar
          isDark={isDark}
          onClose={() => setIsRightSidebarOpen(false)}
          pageTitle={title}
          pageContent={content}
          pageId={page?.id}
          token={token}
          onBeforeSend={flushPendingUpdates}
          onActions={handleAiActions}
        />
      )}
    </div>
  );
}

export default PageView;
