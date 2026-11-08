'use client';

import { useState, useRef, useEffect, Fragment, type ReactNode } from 'react';
import {
  Sparkles,
  ArrowUp,
  ArrowUpRight,
  Loader2,
  Trash2,
  PanelLeft,
  FilePlus2,
  PencilLine,
  FileText,
  Target,
  AlignLeft,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  streamAiChat,
  fetchAiChat,
  type AiAction,
  type AiActionType,
} from '../lib/ai-api';
import { AiAvatar } from './ai-avatar';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';

export interface ChatViewProps {
  chatId?: string | null;
  onChatCreated?: (newChatId: string) => void;
  onTitleUpdated?: (newTitle: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onNavigateToPage?: (pageId: string) => void;
  token?: string | null;
  isDark?: boolean;
  showHeader?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onPagesChanged?: (actions: AiAction[]) => void | Promise<void>;
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

function renderMessageContent(content: string): ReactNode {
  return content.split('\n').map((rawLine, index) => {
    const line = rawLine.trimEnd();
    if (!line.trim()) return <div key={index} className="h-2" />;

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      return (
        <div key={index} className="font-semibold text-sm mt-2 mb-1">
          {renderInline(heading[1] ?? '')}
        </div>
      );
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      return (
        <div key={index} className="flex gap-2 pl-1 my-0.5">
          <span className="shrink-0 opacity-60">•</span>
          <span className="min-w-0">{renderInline(bullet[1] ?? '')}</span>
        </div>
      );
    }

    return <div key={index} className="leading-relaxed">{renderInline(line)}</div>;
  });
}

export function ChatView({
  chatId,
  onChatCreated,
  onTitleUpdated,
  onDeleteChat,
  onNavigateToPage,
  token,
  isDark = true,
  showHeader = true,
  isSidebarOpen = true,
  onToggleSidebar,
  onPagesChanged,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('New AI chat');
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync currentChatId with props
  useEffect(() => {
    setCurrentChatId(chatId || null);
  }, [chatId]);

  // Load chat messages when currentChatId changes
  useEffect(() => {
    let isCancelled = false;
    if (currentChatId) {
      setIsLoading(true);
      fetchAiChat(currentChatId, token)
        .then((data) => {
          if (!isCancelled) {
            if (data) {
              setTitle(data.title);
              setMessages(
                data.messages.map((m) => ({
                  id: m.id,
                  role: m.role as 'user' | 'assistant',
                  content: m.content,
                  actions: m.actions,
                }))
              );
            } else {
              setMessages([]);
            }
          }
        })
        .catch((err) => {
          console.error('[ChatView] Failed to load chat:', err);
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    } else {
      setMessages([]);
      setTitle('New AI chat');
    }
    return () => {
      isCancelled = true;
    };
  }, [currentChatId, token]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = async (textToSend?: string) => {
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await streamAiChat({
        message: prompt,
        chatId: currentChatId,
        token,
        signal: controller.signal,
        onChat: (chat) => {
          if (!currentChatId || currentChatId !== chat.id) {
            setCurrentChatId(chat.id);
            onChatCreated?.(chat.id);
          }
          setTitle(chat.title);
          onTitleUpdated?.(chat.title);
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
          await onPagesChanged?.([action]);
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

      if (response.chat) {
        if (!currentChatId || currentChatId !== response.chat.id) {
          setCurrentChatId(response.chat.id);
          onChatCreated?.(response.chat.id);
        }
        setTitle(response.chat.title);
        onTitleUpdated?.(response.chat.title);
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
        await onPagesChanged?.(response.actions);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        'flex-1 h-screen flex flex-col overflow-hidden relative select-none',
        isDark ? 'bg-[#191919] text-[#ededed]' : 'bg-[#ffffff] text-[#1a1a1a]'
      )}
    >
      {/* Top Header */}
      {showHeader && (
        <div
          className={cn(
            'h-11 px-4 flex items-center justify-between border-b shrink-0 select-none z-10',
            isDark ? 'border-white/[0.06] bg-[#191919]' : 'border-black/[0.06] bg-white'
          )}
        >
          <div className="flex items-center gap-2 text-xs min-w-0">
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
            <Sparkles className="size-3.5 text-violet-400 shrink-0" />
            <span className="font-semibold text-xs truncate max-w-[280px]">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {currentChatId && onDeleteChat && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer text-[#888888] hover:text-red-400',
                  isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
                )}
                title="Delete this chat"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 select-text">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.length === 0 ? (
            /* Welcoming Empty State */
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="size-16 rounded-full flex items-center justify-center overflow-hidden shadow-sm bg-white border border-black/10">
                <AiAvatar className="size-full object-cover" />
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-bold tracking-tight">
                  How can I help you today?
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  I can create, organize, and edit pages in your workspace, brainstorm ideas, draft summaries, and answer questions.
                </p>
              </div>

              {/* Quick suggestions - Minimal Notion-style List */}
              <div className="w-full max-w-sm pt-2 space-y-1">
                {[
                  {
                    title: 'Create meeting notes',
                    icon: FileText,
                    prompt: 'Create a new page titled "Meeting Notes" with sections for Attendees, Agenda, Discussion, and Action Items.',
                  },
                  {
                    title: 'Draft project roadmap',
                    icon: Target,
                    prompt: 'Create a new page titled "Q4 Product Roadmap" with a structured breakdown of milestones, priorities, and tasks.',
                  },
                  {
                    title: 'Brainstorm ideas',
                    icon: Sparkles,
                    prompt: 'Create a new page titled "Brainstorming" with 5 creative ideas for product growth and feature improvements.',
                  },
                  {
                    title: 'Summarize workspace',
                    icon: AlignLeft,
                    prompt: 'List the pages in my workspace and give me a brief summary of what documents are available.',
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(item.prompt)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-normal transition-colors cursor-pointer text-left',
                        isDark
                          ? 'text-[#d4d4d4] hover:bg-white/[0.06] hover:text-white'
                          : 'text-[#37352f] hover:bg-black/[0.05] hover:text-black'
                      )}
                    >
                      <Icon className="size-4 text-[#888888] shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Message List */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3.5 animate-in fade-in duration-200',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="size-7 rounded-full overflow-hidden bg-white border border-black/10 shrink-0 mt-0.5">
                    <AiAvatar className="size-full object-cover" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? isDark
                        ? 'bg-[#2a2a2a] text-white border border-white/[0.08]'
                        : 'bg-[#0085FF] text-white shadow-xs'
                      : isDark
                        ? 'bg-transparent text-[#ededed]'
                        : 'bg-transparent text-[#1a1a1a]'
                  )}
                >
                  {/* Interactive Page Components / Action Cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-3">
                      {msg.actions.map((act, i) => {
                        const meta = ACTION_META[act.type] || ACTION_META.found;
                        const Icon = meta.icon;

                        if (act.type === 'deleted') {
                          return (
                            <div
                              key={i}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border select-none',
                                isDark
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                  : 'bg-red-50 border-red-200 text-red-600'
                              )}
                            >
                              <Icon className="size-3.5 shrink-0" />
                              <span>
                                Deleted: <strong className="font-semibold">{act.title || 'Untitled'}</strong>
                              </span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (act.pageId && onNavigateToPage) {
                                onNavigateToPage(act.pageId);
                              }
                            }}
                            className={cn(
                              'group/page-card flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border text-left shadow-xs',
                              isDark
                                ? 'bg-[#222222] hover:bg-[#2c2c2c] border-white/[0.08] hover:border-white/[0.18] text-white'
                                : 'bg-white hover:bg-black/[0.03] border-black/[0.1] hover:border-black/[0.2] text-[#222222]'
                            )}
                            title={`Open "${act.title || 'Untitled'}"`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  'size-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors',
                                  isDark
                                    ? 'bg-white/[0.06] border-white/[0.08] group-hover/page-card:bg-white/[0.1]'
                                    : 'bg-black/[0.04] border-black/[0.06] group-hover/page-card:bg-black/[0.08]'
                                )}
                              >
                                <Icon className={cn('size-3.5', meta.color)} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-xs truncate max-w-[200px] group-hover/page-card:underline">
                                  {act.title || 'Untitled'}
                                </span>
                                <span className={cn('text-[10px]', isDark ? 'text-gray-400' : 'text-gray-500')}>
                                  {meta.label} · Click to open
                                </span>
                              </div>
                            </div>
                            <ArrowUpRight
                              className={cn(
                                'size-3.5 shrink-0 transition-transform group-hover/page-card:translate-x-0.5 group-hover/page-card:-translate-y-0.5',
                                isDark ? 'text-gray-400 group-hover/page-card:text-white' : 'text-gray-500 group-hover/page-card:text-black'
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Text Content */}
                  <div>{renderMessageContent(msg.content)}</div>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3.5 items-center justify-start animate-in fade-in duration-150">
              <div className="size-7 rounded-full overflow-hidden bg-white border border-black/10 shrink-0">
                <AiAvatar className="size-full object-cover" />
              </div>
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                <Loader2 className="size-3.5 animate-spin text-violet-400" />
                <span>Thinking & working...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Area */}
      <div className="p-4 md:px-8 shrink-0">
        <div className="max-w-2xl mx-auto">
          <div
            className={cn(
              'rounded-2xl border p-2 flex items-end gap-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-violet-500/20',
              isDark
                ? 'bg-[#202020] border-white/[0.1] focus-within:border-white/[0.2]'
                : 'bg-white border-black/[0.1] focus-within:border-black/[0.2]'
            )}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or request a page change..."
              className={cn(
                'flex-1 resize-none bg-transparent px-2 py-1 text-xs outline-none leading-relaxed max-h-40',
                isDark ? 'text-white placeholder:text-gray-500' : 'text-black placeholder:text-gray-400'
              )}
            />

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                'size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0',
                input.trim() && !isLoading
                  ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-xs'
                  : isDark
                    ? 'bg-white/[0.06] text-gray-600 cursor-not-allowed'
                    : 'bg-black/[0.06] text-gray-400 cursor-not-allowed'
              )}
              title="Send message (Enter)"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Chat Dialog */}
      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          setIsConfirmDeleteOpen(false);
          if (currentChatId && onDeleteChat) {
            onDeleteChat(currentChatId);
          }
        }}
        title="Delete chat"
        description="Are you sure you want to delete this chat conversation? This action cannot be undone."
        isDark={isDark}
      />
    </div>
  );
}
