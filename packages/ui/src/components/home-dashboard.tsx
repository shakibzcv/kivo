'use client';

import React, { useMemo } from 'react';
import {
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  FileText,
  Target,
  Calendar,
  Layers,
  Presentation,
  PanelLeft,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { PageItem } from '../lib/page-api';
import { AiAvatar } from './ai-avatar';

export interface HomeDashboardProps {
  user: {
    id?: string;
    email?: string;
    name?: string;
    avatar?: string;
  } | null;
  pages: PageItem[];
  onSelectPage: (page: PageItem) => void;
  onCreatePageWithTemplate?: (template: {
    title: string;
    icon?: string;
    content: string;
  }) => void;
  isDark: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenAi?: () => void;
}

export function HomeDashboard({
  user,
  pages,
  onSelectPage,
  onCreatePageWithTemplate,
  isDark,
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenAi,
}: HomeDashboardProps) {
  // 1. Dynamic Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = useMemo(() => {
    if (!user?.name) return 'Professor';
    const first = user.name.split(' ')[0];
    return first || user.name;
  }, [user?.name]);

  // 2. Curated Recently Visited list
  interface RecentCard {
    id: string;
    title: string;
    icon: string;
    date: string;
    isReal: boolean;
    page?: PageItem;
  }

  const recentCards: RecentCard[] = useMemo(() => {
    const userCards: RecentCard[] = pages.slice(0, 6).map((p, idx) => ({
      id: p.id,
      title: p.title || 'Untitled',
      icon: p.icon || 'doc',
      date: idx === 0 ? 'Just now' : idx === 1 ? '2d ago' : `${idx + 1}w ago`,
      isReal: true,
      page: p,
    }));

    if (userCards.length >= 6) {
      return userCards;
    }

    const fallbacks: RecentCard[] = [
      { id: 'fb-1', title: 'Code Beaver AI', icon: 'doc', date: 'May 22', isReal: false },
      { id: 'fb-2', title: 'Kivo', icon: 'doc', date: 'Oct 7', isReal: false },
      { id: 'fb-3', title: 'Projects', icon: 'target', date: 'Aug 31', isReal: false },
      { id: 'fb-4', title: 'Kino+', icon: 'doc', date: '1w ago', isReal: false },
      { id: 'fb-5', title: 'Home', icon: 'home', date: '2d ago', isReal: false },
      { id: 'fb-6', title: 'Cadence — YouTube...', icon: 'doc', date: '3w ago', isReal: false },
    ];

    return [...userCards, ...fallbacks.slice(userCards.length)];
  }, [pages]);

  // 3. Learn items matching the screenshot
  const learnItems = [
    {
      title: 'The ultimate guide to Notion templates',
      readTime: '5m read',
      verified: true,
      theme: 'template',
    },
    {
      title: 'Customize & style your content',
      readTime: '9m read',
      verified: true,
      theme: 'style',
    },
    {
      title: 'Getting started with projects and tasks',
      readTime: '8m read',
      verified: true,
      theme: 'tasks',
    },
    {
      title: 'Using Notion AI to 10x your impact',
      readTime: '3m read',
      verified: false,
      theme: 'ai',
    },
  ];

  // 4. Featured templates matching the screenshot
  const templates = [
    {
      id: 'projects',
      title: 'Projects & Tasks',
      author: 'By Notion',
      icon: Target,
      content:
        '# Projects & Tasks\n\nTrack your team deliverables, sprints, and engineering milestones in one unified view.\n\n## Active Sprints\n- [ ] Sprint 12: AI Editor rollout\n- [ ] Sprint 13: Collaborative workspaces\n\n## Backlog\n- [ ] Mobile push notifications\n- [ ] Export to Markdown & PDF',
    },
    {
      id: 'meetings',
      title: 'Meetings',
      author: 'By Notion',
      icon: Calendar,
      content:
        '# Meetings\n\nOrganize all weekly team syncs, customer check-ins, and 1-on-1 agendas.\n\n## Attendees\n- Engineering Team\n- Product Design\n\n## Agenda\n1. Review sprint burndown\n2. Blockers and architectural decisions\n3. Next steps & action items',
    },
    {
      id: 'wiki',
      title: 'Wiki',
      author: 'By Notion',
      icon: Layers,
      content:
        '# Company Wiki\n\nCentralized documentation, engineering principles, and team guidelines.\n\n## Quick Links\n- Engineering Handbook\n- Brand Assets & Style Guide\n- Onboarding Guide for New Hires',
    },
    {
      id: 'presentation',
      title: 'Presentation',
      author: 'By Notion',
      icon: Presentation,
      content:
        '# Presentation Deck\n\nStructure high-impact pitch decks, product reviews, and team all-hands.\n\n## Slide 1: Executive Summary\nIntroduce the core mission and problem statement.\n\n## Slide 2: Product Solution\nDemonstrate how Kivo solves modern document management.',
    },
  ];

  const handleRecentCardClick = (card: (typeof recentCards)[number]) => {
    if (card.isReal && card.page) {
      onSelectPage(card.page);
    } else {
      onCreatePageWithTemplate?.({
        title: card.title,
        content: `# ${card.title}\n\nWelcome to your ${card.title} workspace note.`,
      });
    }
  };

  return (
    <div
      className={cn(
        'flex-1 h-screen flex flex-col overflow-hidden relative select-none',
        isDark ? 'bg-[#191919] text-[#ededed]' : 'bg-[#ffffff] text-[#1a1a1a]'
      )}
    >
      {/* Top Header toggle when sidebar is collapsed */}
      {!isSidebarOpen && onToggleSidebar && (
        <div className="absolute top-3 left-3 z-20">
          <button
            type="button"
            onClick={onToggleSidebar}
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              isDark
                ? 'bg-[#202020] hover:bg-[#2a2a2a] text-[#9b9b9b] hover:text-white border border-white/10'
                : 'bg-white hover:bg-neutral-100 text-[#6b6966] hover:text-black border border-black/10 shadow-xs'
            )}
            title="Open sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
        </div>
      )}

      {/* Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 lg:px-20 py-10 md:py-14">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Main Greeting */}
          <div className="text-center pt-2 pb-2">
            <h1
              className={cn(
                'text-2xl sm:text-3xl font-semibold tracking-tight transition-colors',
                isDark ? 'text-white' : 'text-neutral-900'
              )}
            >
              {greeting}, {userName}
            </h1>
          </div>

          {/* 1. Recently Visited Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#888888]">
              <Clock className="size-3.5" />
              <span>Recently visited</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {recentCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleRecentCardClick(card)}
                  className={cn(
                    'h-28 rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-150 group',
                    isDark
                      ? 'bg-[#222222] hover:bg-[#282828]'
                      : 'bg-[#fafafa] hover:bg-white shadow-2xs'
                  )}
                >
                  <div className="flex items-center justify-between">
                    {card.icon === 'target' ? (
                      <Target className="size-4 text-[#888888] group-hover:text-white transition-colors" />
                    ) : card.icon === 'home' ? (
                      <div className="size-4 rounded bg-white/10 flex items-center justify-center">
                        <FileText className="size-3 text-white" />
                      </div>
                    ) : (
                      <FileText className="size-4 text-[#888888] group-hover:text-white transition-colors" />
                    )}
                  </div>

                  <div
                    className={cn(
                      'text-xs font-semibold truncate',
                      isDark ? 'text-white' : 'text-neutral-900'
                    )}
                  >
                    {card.title}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#777777]">
                    <div className="size-3.5 rounded-full bg-[#0085FF] flex items-center justify-center text-[8px] text-white font-bold shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{card.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Learn Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#888888]">
              <BookOpen className="size-3.5" />
              <span>Learn</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {learnItems.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'rounded-xl overflow-hidden transition-all duration-150 cursor-pointer flex flex-col group',
                    isDark
                      ? 'bg-[#222222] hover:bg-[#282828]'
                      : 'bg-white shadow-2xs hover:shadow-xs'
                  )}
                >
                  {/* Miniature Thumbnail Mockup */}
                  <div
                    className={cn(
                      'h-28 w-full overflow-hidden relative flex items-center justify-center p-3 select-none',
                      isDark ? 'bg-[#181818]' : 'bg-neutral-100'
                    )}
                  >
                    {item.theme === 'template' && (
                      <div className="w-full h-full bg-white text-black rounded p-2 text-[8px] space-y-1 shadow-sm overflow-hidden opacity-90">
                        <div className="font-bold flex items-center justify-between border-b pb-0.5 border-black/10">
                          <span>Notion Flake</span>
                          <span className="text-[7px] text-gray-500">Live</span>
                        </div>
                        <div className="space-y-0.5 text-gray-600">
                          <div className="h-1 bg-gray-200 rounded w-3/4" />
                          <div className="h-1 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    )}

                    {item.theme === 'style' && (
                      <div className="w-full h-full bg-white text-black rounded p-2 text-[8px] space-y-1 shadow-sm overflow-hidden opacity-90">
                        <div className="font-bold text-[9px]">Untitled</div>
                        <div className="rounded border border-black/10 p-1 bg-neutral-50 text-[7px] space-y-0.5">
                          <div className="font-medium text-gray-700">Typography</div>
                          <div className="flex gap-1">
                            <span className="px-1 bg-blue-100 text-blue-700 rounded text-[6px]">Default</span>
                            <span className="px-1 bg-gray-100 rounded text-[6px]">Serif</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.theme === 'tasks' && (
                      <div className="w-full h-full bg-white text-black rounded p-2 text-[8px] space-y-1 shadow-sm overflow-hidden opacity-90">
                        <div className="font-bold text-[9px] flex items-center gap-1 text-gray-800">
                          <span>People projects</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <div className="h-7 bg-orange-50 border border-orange-200 rounded p-0.5 text-[6px] text-orange-800">
                            Planning
                          </div>
                          <div className="h-7 bg-blue-50 border border-blue-200 rounded p-0.5 text-[6px] text-blue-800">
                            Active
                          </div>
                          <div className="h-7 bg-green-50 border border-green-200 rounded p-0.5 text-[6px] text-green-800">
                            Done
                          </div>
                        </div>
                      </div>
                    )}

                    {item.theme === 'ai' && (
                      <div className="w-full h-full bg-[#121212] text-white rounded p-2 text-[8px] flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-radial from-violet-500/20 to-transparent" />
                        <Sparkles className="size-5 text-violet-400 mb-1 animate-pulse" />
                        <span className="font-medium text-[8px] text-violet-200">Notion AI Engine</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <span
                        className={cn(
                          'text-xs font-semibold leading-tight line-clamp-2',
                          isDark ? 'text-white' : 'text-neutral-900'
                        )}
                      >
                        {item.title}
                      </span>
                      {item.verified && (
                        <CheckCircle2 className="size-3.5 text-[#0085FF] fill-[#0085FF] text-white shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#777777]">
                      <BookOpen className="size-3 text-[#777777]" />
                      <span>{item.readTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Featured Templates Section */}
          <section className="space-y-3 pb-8">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#888888]">
              <Sparkles className="size-3.5" />
              <span>Featured templates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <div
                    key={tpl.id}
                    onClick={() =>
                      onCreatePageWithTemplate?.({
                        title: tpl.title,
                        content: tpl.content,
                      })
                    }
                    className={cn(
                      'rounded-xl overflow-hidden transition-all duration-150 cursor-pointer flex flex-col group',
                      isDark
                        ? 'bg-[#222222] hover:bg-[#282828]'
                        : 'bg-white shadow-2xs hover:shadow-xs'
                    )}
                  >
                    {/* Header */}
                    <div className="p-3 pb-2 flex items-center gap-2">
                      <div
                        className={cn(
                          'size-6 rounded-md flex items-center justify-center shrink-0',
                          isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            'text-xs font-semibold truncate',
                            isDark ? 'text-white' : 'text-neutral-900'
                          )}
                        >
                          {tpl.title}
                        </div>
                        <div className="text-[10px] text-[#777777] truncate">{tpl.author}</div>
                      </div>
                    </div>

                    {/* Miniature UI Canvas Preview */}
                    <div
                      className={cn(
                        'h-24 mx-2.5 mb-2.5 rounded-lg overflow-hidden p-2 text-[7px] space-y-1 select-none opacity-85 group-hover:opacity-100 transition-opacity',
                        isDark
                          ? 'bg-[#181818] text-gray-300'
                          : 'bg-neutral-50 text-gray-700'
                      )}
                    >
                      <div className="font-bold flex items-center gap-1 border-b pb-0.5 border-white/5">
                        <span className="size-1.5 rounded-full bg-red-400" />
                        <span className="size-1.5 rounded-full bg-yellow-400" />
                        <span className="size-1.5 rounded-full bg-green-400" />
                        <span className="ml-1 text-[7px]">{tpl.title}</span>
                      </div>
                      <div className="space-y-1 pt-0.5">
                        <div className="h-1 bg-current opacity-20 rounded w-4/5" />
                        <div className="h-1 bg-current opacity-15 rounded w-3/5" />
                        <div className="h-1 bg-current opacity-10 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Floating Bottom-Right AI Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={onOpenAi}
          className="size-11 rounded-full shadow-2xl flex items-center justify-center p-0.5 border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500"
          title="Ask Kivo AI"
        >
          <div className="size-full rounded-full overflow-hidden bg-white p-0.5">
            <AiAvatar className="size-full object-cover rounded-full transition-transform group-hover:scale-110" />
          </div>
        </button>
      </div>
    </div>
  );
}

export default HomeDashboard;
