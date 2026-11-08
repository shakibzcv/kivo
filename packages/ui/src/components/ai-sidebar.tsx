'use client';

import { useState, useRef, useEffect, Fragment, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronsRight,
  MoreHorizontal,
  MessageSquarePlus,
  PanelRight,
  AlignLeft,
  Languages,
  Sparkles,
  CheckCircle2,
  ArrowUp,
  Plus,
  ShieldCheck,
  Loader2,
  FilePlus2,
  PencilLine,
  Trash2,
  MessageSquare,
  FileText,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  streamAiChat,
  fetchAiChats,
  fetchAiChat,
  deleteAiChat,
  type AiAction,
  type AiActionType,
  type ChatSummary,
} from '../lib/ai-api';
import { AiAvatar } from './ai-avatar';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';

export interface AiSidebarProps {
  isDark?: boolean;
  onClose: () => void;
  pageTitle?: string;
  pageContent?: string;
  /** Id of the page currently open; lets the AI treat it as "this page". */
  pageId?: string;
  /** Auth token sent to the AI API so it only touches the user's own pages. */
  token?: string | null;
  /** Called before each request so pending editor changes can be saved first. */
  onBeforeSend?: () => void | Promise<void>;
  /** Called after the AI created, updated or deleted pages. */
  onActions?: (actions: AiAction[]) => void | Promise<void>;
  /** Called when the user clicks an AI page action button to open that page. */
  onNavigateToPage?: (pageId: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AiAction[];
  isError?: boolean;
}

const ACTION_META: Record<AiActionType, { label: string; icon: LucideIcon; color: string }> = {
  created: { label: 'Created', icon: FilePlus2, color: 'text-emerald-500' },
  updated: { label: 'Updated', icon: PencilLine, color: 'text-blue-500' },
  deleted: { label: 'Deleted', icon: Trash2, color: 'text-red-500' },
  found: { label: 'Page', icon: FileText, color: 'text-violet-400' },
};

/** Renders **bold** segments as React elements (no innerHTML). */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={index} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}

/** Minimal markdown for assistant replies: headings, bullet lists and bold. */
function renderMessageContent(content: string): ReactNode {
  return content.split('\n').map((rawLine, index) => {
    const line = rawLine.trimEnd();
    if (!line.trim()) return <div key={index} className="h-2" />;

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      return (
        <div key={index} className="font-semibold text-[13px] mt-1">
          {renderInline(heading[1] ?? '')}
        </div>
      );
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      return (
        <div key={index} className="flex gap-2 pl-1">
          <span className="shrink-0 opacity-60">•</span>
          <span className="min-w-0">{renderInline(bullet[1] ?? '')}</span>
        </div>
      );
    }

    return <div key={index}>{renderInline(line)}</div>;
  });
}

/**
 * Hand-drawn face sketch avatar matching Notion AI logo in the provided design
 */
export function AiSidebar({
  isDark = true,
  onClose,
  pageTitle = 'Home',
  pageContent = '',
  pageId,
  token,
  onBeforeSend,
  onActions,
  onNavigateToPage,
}: AiSidebarProps) {
  const [width, setWidth] = useState<number>(272);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string>('New AI chat');
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore saved width
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kivo_ai_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        const max = typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.40) : 500;
        if (!isNaN(parsed) && parsed >= 272 && parsed <= max) {
          setWidth(parsed);
        }
      }
    } catch {}
  }, []);

  // Fetch saved chat list on mount or token change
  useEffect(() => {
    let isCancelled = false;
    fetchAiChats(token).then((data) => {
      if (!isCancelled && Array.isArray(data)) {
        setChats(data);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [token]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Left-edge Resizer logic
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const min = 272;
      const max = Math.floor(window.innerWidth * 0.40);
      const delta = startX - moveEvent.clientX; // Dragging left increases width
      const clamped = Math.max(min, Math.min(startWidth + delta, max));
      setWidth(clamped);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const min = 272;
      const max = Math.floor(window.innerWidth * 0.40);
      const delta = startX - upEvent.clientX;
      const finalWidth = Math.max(min, Math.min(startWidth + delta, max));
      try {
        localStorage.setItem('kivo_ai_sidebar_width', String(finalWidth));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const resetWidth = () => {
    setWidth(272);
    try {
      localStorage.setItem('kivo_ai_sidebar_width', '272');
    } catch {}
  };

  // Cancel any in-flight request when the sidebar closes
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const canSend = input.trim().length > 0 && !isLoading;

  const handleStartNewChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setInteractionId(null);
    setActiveChatId(null);
    setChatTitle('New AI chat');
    setMessages([]);
    setInput('');
    setIsDropdownOpen(false);
  };

  const handleSelectChat = async (selected: ChatSummary) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsDropdownOpen(false);
    setActiveChatId(selected.id);
    setChatTitle(selected.title);
    setIsLoading(true);

    try {
      const details = await fetchAiChat(selected.id, token);
      if (details) {
        setMessages(
          details.messages.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            actions: m.actions,
          }))
        );
      }
    } catch (err) {
      console.warn('[AI] Failed to load chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: prompt,
    };

    const assistantId = `ast_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        actions: [],
      },
    ]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Make sure unsaved edits are stored so the AI sees (and doesn't overwrite) the latest text
      await onBeforeSend?.();

      const response = await streamAiChat({
        message: prompt,
        chatId: activeChatId,
        currentPage: pageId ? { id: pageId, title: pageTitle, content: pageContent } : null,
        previousInteractionId: interactionId,
        token,
        signal: controller.signal,
        onChat: (chat) => {
          setActiveChatId(chat.id);
          setChatTitle(chat.title);
          setChats((prev) => {
            const filtered = prev.filter((c) => c.id !== chat.id);
            return [chat, ...filtered];
          });
        },
        onAction: async (action) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              const currentActions = m.actions || [];
              if (currentActions.some((a) => a.pageId === action.pageId && a.type === action.type)) return m;
              return { ...m, actions: [...currentActions, action] };
            })
          );
          await onActions?.([action]);
        },
        onChunk: (textChunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: (m.content || '') + textChunk } : m
            )
          );
        },
      });

      if (controller.signal.aborted) return;

      if (response.interactionId) setInteractionId(response.interactionId);

      if (response.chat) {
        setActiveChatId(response.chat.id);
        setChatTitle(response.chat.title);
        setChats((prev) => {
          const filtered = prev.filter((c) => c.id !== response.chat!.id);
          return [response.chat!, ...filtered];
        });
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            content: response.reply || m.content || 'Done.',
            actions: response.actions && response.actions.length > 0 ? response.actions : m.actions,
          };
        })
      );

      if (response.actions?.length) {
        await onActions?.(response.actions);
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            content: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
            isError: true,
          };
        })
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <aside
      style={{ width: `${width}px` }}
      className={cn(
        'h-full flex flex-col justify-between select-none relative shrink-0 border-l z-30 transition-[width] duration-150',
        isResizing ? 'transition-none select-none' : '',
        isDark
          ? 'bg-[#191919] border-white/[0.08] text-[#ededed]'
          : 'bg-[#ffffff] border-black/[0.08] text-[#1a1a1a]'
      )}
    >
      {/* 1. Left Resize Handle */}
      <div
        onMouseDown={startResizing}
        onDoubleClick={resetWidth}
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize z-40"
        title="Drag to resize AI sidebar (double-click to reset)"
      />

      {/* 2. Top Header Bar */}
      <div
        className={cn(
          'h-11 px-3.5 flex items-center justify-between border-b shrink-0 relative',
          isDark ? 'border-white/[0.06] bg-[#191919]' : 'border-black/[0.06] bg-white'
        )}
      >
        {/* Left: Avatar + Chat Title + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={cn(
              'flex items-center gap-2 p-1 -ml-1 rounded-lg transition-colors cursor-pointer group max-w-[170px]',
              isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
            )}
            title="Chat history"
          >
            <div className="size-6 rounded-full flex items-center justify-center overflow-hidden bg-white border border-black/10 shrink-0">
              <AiAvatar className="size-full object-cover" />
            </div>
            <span className="text-xs font-semibold tracking-tight truncate max-w-[105px]">
              {chatTitle}
            </span>
            <ChevronDown
              className={cn(
                'size-3 text-[#888888] group-hover:text-current transition-transform shrink-0',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown Menu showing New chat and recent chats */}
          {isDropdownOpen && (
            <div
              className={cn(
                'absolute top-full left-0 mt-1.5 w-64 rounded-xl border shadow-2xl z-50 p-1 flex flex-col backdrop-blur-md animate-in fade-in zoom-in-95 duration-150',
                isDark
                  ? 'bg-[#202020]/95 border-white/[0.1] text-white shadow-black/60'
                  : 'bg-white/95 border-black/[0.1] text-black shadow-black/10'
              )}
            >
              <button
                type="button"
                onClick={handleStartNewChat}
                className={cn(
                  'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left',
                  isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-black/[0.06]'
                )}
              >
                <Plus className="size-3.5 text-blue-500 shrink-0" />
                <span>New AI chat</span>
              </button>

              <div className={cn('h-px my-1', isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]')} />

              <div className="text-[10px] font-medium px-2.5 py-1 text-gray-400">
                Recent chats
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {chats.length === 0 ? (
                  <div className="px-2.5 py-3 text-center text-xs text-gray-400">
                    No saved chats yet
                  </div>
                ) : (
                  chats.map((c) => {
                    const isSelected = c.id === activeChatId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectChat(c)}
                        className={cn(
                          'group/item flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left',
                          isSelected
                            ? isDark
                              ? 'bg-white/[0.12] text-white font-medium'
                              : 'bg-black/[0.08] text-black font-medium'
                            : isDark
                              ? 'hover:bg-white/[0.06] text-gray-300'
                              : 'hover:bg-black/[0.05] text-gray-700'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare className="size-3.5 shrink-0 opacity-60" />
                          <span className="truncate">{c.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatToDelete(c.id);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-400 transition-opacity ml-1 rounded shrink-0 cursor-pointer"
                          title="Delete chat"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Icons: New Chat, Panel, More, and Collapse (>>) */}
        <div className="flex items-center gap-1 text-[#888888]">
          <button
            type="button"
            onClick={handleStartNewChat}
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              isDark ? 'hover:bg-white/[0.08] hover:text-white' : 'hover:bg-black/[0.06] hover:text-black'
            )}
            title="Start new chat"
          >
            <MessageSquarePlus className="size-4" />
          </button>

          <button
            type="button"
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              isDark ? 'hover:bg-white/[0.08] hover:text-white' : 'hover:bg-black/[0.06] hover:text-black'
            )}
            title="Sidebar view"
          >
            <PanelRight className="size-4" />
          </button>

          <button
            type="button"
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              isDark ? 'hover:bg-white/[0.08] hover:text-white' : 'hover:bg-black/[0.06] hover:text-black'
            )}
            title="More actions"
          >
            <MoreHorizontal className="size-4" />
          </button>

          {/* >> Collapse Button (closes the right sidebar) */}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer text-[#888888]',
              isDark ? 'hover:bg-white/[0.08] hover:text-white' : 'hover:bg-black/[0.06] hover:text-black'
            )}
            title="Close sidebar (>>)"
          >
            <ChevronsRight className="size-4.5" />
          </button>
        </div>
      </div>

      {/* 3. Middle Content Area (Initial Suggestions OR Message Stream) */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col justify-end">
        {messages.length === 0 ? (
          /* Empty / Initial state matching image */
          <div className="space-y-6 pb-2">
            {/* Notion AI Avatar badge in center */}
            <div className="flex flex-col items-start">
              <div className="size-16 rounded-full flex items-center justify-center overflow-hidden mb-3 shadow-sm bg-white border border-black/10">
                <AiAvatar className="size-full object-cover" />
              </div>

              {/* Bold Title */}
              <h2 className={cn('text-xl font-bold tracking-tight mb-2', isDark ? 'text-white' : 'text-black')}>
                How can I help you today?
              </h2>
            </div>

            {/* Suggested Action Buttons List */}
            <div className="space-y-1">
              {/* Option 1: Summarize */}
              <button
                type="button"
                onClick={() => handleSendMessage('Summarize this page')}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-normal transition-colors text-left cursor-pointer',
                  isDark
                    ? 'text-[#d4d4d4] hover:bg-white/[0.06] hover:text-white'
                    : 'text-[#333333] hover:bg-black/[0.05] hover:text-black'
                )}
              >
                <AlignLeft className="size-4.5 text-[#9b9b9b] shrink-0" />
                <span className="truncate">Summarize this page</span>
              </button>

              {/* Option 2: Translate */}
              <button
                type="button"
                onClick={() => handleSendMessage('Translate this page')}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-normal transition-colors text-left cursor-pointer',
                  isDark
                    ? 'text-[#d4d4d4] hover:bg-white/[0.06] hover:text-white'
                    : 'text-[#333333] hover:bg-black/[0.05] hover:text-black'
                )}
              >
                <Languages className="size-4.5 text-[#9b9b9b] shrink-0" />
                <span className="truncate">Translate this page</span>
              </button>

              {/* Option 3: Analyze insights */}
              <button
                type="button"
                onClick={() => handleSendMessage('Analyze for insights')}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-normal transition-colors text-left cursor-pointer',
                  isDark
                    ? 'text-[#d4d4d4] hover:bg-white/[0.06] hover:text-white'
                    : 'text-[#333333] hover:bg-black/[0.05] hover:text-black'
                )}
              >
                <Sparkles className="size-4.5 text-[#9b9b9b] shrink-0" />
                <span className="truncate">Analyze for insights</span>
              </button>

              {/* Option 4: Create task tracker */}
              <button
                type="button"
                onClick={() => handleSendMessage('Create a task tracker')}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-normal transition-colors text-left cursor-pointer',
                  isDark
                    ? 'text-[#d4d4d4] hover:bg-white/[0.06] hover:text-white'
                    : 'text-[#333333] hover:bg-black/[0.05] hover:text-black'
                )}
              >
                <CheckCircle2 className="size-4.5 text-[#9b9b9b] shrink-0" />
                <span className="truncate">Create a task tracker</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Chat Message Stream */
          <div className="space-y-4 pb-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col text-xs leading-relaxed',
                  m.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                {m.role === 'user' ? (
                  <div
                    className={cn(
                      'px-3.5 py-2 rounded-2xl max-w-[85%] text-xs',
                      isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                    )}
                  >
                    {m.content}
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 max-w-full min-w-0">
                    <div className="size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 overflow-hidden bg-white border border-black/10">
                      <AiAvatar className="size-full object-cover" />
                    </div>
                    <div
                      className={cn(
                        'flex-1 min-w-0 text-xs leading-relaxed select-text break-words',
                        m.isError
                          ? isDark ? 'text-red-300' : 'text-red-600'
                          : isDark ? 'text-[#d4d4d4]' : 'text-[#2e2e2e]'
                      )}
                    >
                      {renderMessageContent(m.content)}
                      {m.actions && m.actions.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {m.actions.map((action, index) => {
                            const meta = ACTION_META[action.type] || ACTION_META.found;
                            const ActionIcon = meta.icon;
                            const isClickable = action.type !== 'deleted' && Boolean(action.pageId) && Boolean(onNavigateToPage);

                            if (isClickable) {
                              return (
                                <button
                                  key={`${action.type}_${action.pageId}_${index}`}
                                  type="button"
                                  onClick={() => onNavigateToPage?.(action.pageId)}
                                  className={cn(
                                    'group/action flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition-colors cursor-pointer w-full',
                                    isDark
                                      ? 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 hover:text-white'
                                      : 'border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] text-gray-800 hover:text-black'
                                  )}
                                  title={`Open "${action.title || 'Untitled'}"`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <ActionIcon className={cn('size-3.5 shrink-0', meta.color)} />
                                    <span className="shrink-0 font-medium">{meta.label}:</span>
                                    <span className="truncate underline-offset-2 group-hover/action:underline">
                                      {action.title || 'Untitled'}
                                    </span>
                                  </div>
                                  <ArrowUpRight className="size-3 shrink-0 opacity-60 group-hover/action:opacity-100" />
                                </button>
                              );
                            }

                            return (
                              <div
                                key={`${action.type}_${action.pageId}_${index}`}
                                className={cn(
                                  'flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] min-w-0',
                                  isDark ? 'border-white/[0.08] bg-white/[0.04]' : 'border-black/[0.08] bg-black/[0.03]'
                                )}
                              >
                                <ActionIcon className={cn('size-3.5 shrink-0', meta.color)} />
                                <span className="shrink-0 font-medium">{meta.label}</span>
                                <span className="truncate opacity-80">{action.title || 'Untitled'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#8e8e8e]">
                <Loader2 className="size-3.5 animate-spin text-[#0085FF]" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 4. Bottom Input Area matching design */}
      <div className="p-3 pt-0 shrink-0 select-none">
        {/* Input Card Container */}
        <div
          className={cn(
            'p-2.5 rounded-xl border flex flex-col gap-2 shadow-sm',
            isDark
              ? 'bg-[#202020] border-white/[0.08] text-white'
              : 'bg-[#f7f7f5] border-black/[0.08] text-black'
          )}
        >
          {/* Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask Kivo AI to write, edit or delete pages"
            rows={2}
            className="w-full bg-transparent border-none outline-none text-xs sm:text-[13px] placeholder-[#6e6e6e] resize-none leading-relaxed"
          />

          {/* Bottom Card Toolbar: (+) (Shield) ... (Auto) (Submit) */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Icons */}
            <div className="flex items-center gap-1.5 text-[#888888]">
              <button
                type="button"
                className={cn(
                  'p-1 rounded-md transition-colors cursor-pointer',
                  isDark ? 'hover:bg-white/[0.08] hover:text-white' : 'hover:bg-black/[0.06] hover:text-black'
                )}
                title="Add context or file"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                type="button"
                className={cn(
                  'p-1 rounded-md transition-colors cursor-pointer',
                  isDark ? 'hover:bg-white/[0.08] hover:text-white' : 'hover:bg-black/[0.06] hover:text-black'
                )}
                title="Private & Secure AI"
              >
                <ShieldCheck className="size-3.5" />
              </button>
            </div>

            {/* Right: Submit Arrow Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!canSend}
                className={cn(
                  'size-6 rounded-full flex items-center justify-center transition-all cursor-pointer',
                  canSend
                    ? isDark
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-black text-white hover:bg-gray-800'
                    : isDark
                      ? 'bg-white/10 text-[#666666] cursor-not-allowed'
                      : 'bg-black/10 text-[#999999] cursor-not-allowed'
                )}
                title="Send message"
              >
                <ArrowUp className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Chat Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(chatToDelete)}
        onClose={() => setChatToDelete(null)}
        onConfirm={async () => {
          if (chatToDelete) {
            const id = chatToDelete;
            setChatToDelete(null);
            await deleteAiChat(id, token);
            setChats((prev) => prev.filter((c) => c.id !== id));
            if (activeChatId === id) {
              handleStartNewChat();
            }
          }
        }}
        title="Delete chat"
        description="Are you sure you want to delete this chat conversation? This cannot be undone."
        isDark={isDark}
      />
    </aside>
  );
}

export default AiSidebar;
