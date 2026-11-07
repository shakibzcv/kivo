'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Logo } from '@/components/logo';
import { WebSidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth-context';
import { PageView } from '@repo/ui/components/page-view';
import { ChatView } from '@repo/ui/components/chat-view';
import { HomeDashboard } from '@repo/ui/components/home-dashboard';
import {
  PageItem,
  fetchPagesFromApi,
  createPageInApi,
  deletePageFromApi,
  findPageById,
  insertPageInTree,
  updatePageInTree,
  deletePageFromTree,
} from '@repo/ui/lib/page-api';
import {
  fetchAiChats,
  deleteAiChat,
  type ChatSummary,
} from '@repo/ui/lib/ai-api';

export interface WorkspaceLayoutProps {
  pageId?: string | null;
  chatId?: string | null;
  section?: 'home' | 'chat';
}

export function WorkspaceLayout({
  pageId = null,
  chatId = null,
  section = 'home',
}: WorkspaceLayoutProps) {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, signOut } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active navigation tab ('home' | 'chat' | pageId)
  const [activeItem, setActiveItem] = useState<string>(
    section === 'chat' || chatId ? 'chat' : pageId || 'home'
  );

  // Pages & Chats state
  const [pages, setPages] = useState<PageItem[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pageId);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chatId);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Redirect to login if user is not authenticated once auth finishes loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Sync props to internal state when route changes
  useEffect(() => {
    if (pageId !== undefined) {
      setSelectedPageId(pageId);
      if (pageId) setActiveItem(pageId);
    }
    if (chatId !== undefined) {
      setSelectedChatId(chatId);
      if (chatId || section === 'chat') setActiveItem('chat');
    } else if (section === 'home' && !pageId) {
      setActiveItem('home');
      setSelectedPageId(null);
    }
  }, [pageId, chatId, section]);

  // Fetch cloud pages and saved chats
  const loadWorkspaceData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingPages(true);
    try {
      const [pagesData, chatsData] = await Promise.all([
        fetchPagesFromApi(token),
        fetchAiChats(token),
      ]);
      setPages(pagesData);
      setChats(chatsData);
    } catch (err) {
      console.error('[Web] Failed to fetch workspace data:', err);
    } finally {
      setIsLoadingPages(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isAuthenticated) {
      loadWorkspaceData();
    }
  }, [isAuthenticated, loadWorkspaceData]);

  // Create page in cloud database and navigate to /p/[id]
  const handleCreatePage = useCallback(
    async (parentId?: string | null) => {
      try {
        const created = await createPageInApi(
          {
            title: 'Untitled',
            parentId: parentId || null,
            icon: null,
            coverImage: null,
            quote: null,
            content: '',
          },
          token
        );
        if (created) {
          setPages((prev) => insertPageInTree(prev, created, parentId));
          setSelectedPageId(created.id);
          router.push(`/p/${created.id}`);
        }
      } catch (err) {
        console.error('[Web] Failed to create page:', err);
      }
    },
    [token, router]
  );

  // Delete page from cloud database
  const handleDeletePage = useCallback(
    async (id: string) => {
      try {
        const ok = await deletePageFromApi(id, token);
        if (ok) {
          setPages((prev) => {
            const next = deletePageFromTree(prev, id);
            if (selectedPageId === id) {
              const fallback = next.length > 0 && next[0] ? next[0].id : null;
              if (fallback) {
                router.push(`/p/${fallback}`);
              } else {
                router.push('/home');
              }
            }
            return next;
          });
        }
      } catch (err) {
        console.error('[Web] Failed to delete page:', err);
      }
    },
    [token, selectedPageId, router]
  );

  // Update page in local tree when changed in PageView
  const handlePageUpdate = useCallback((updatedPage: PageItem) => {
    setPages((prev) => updatePageInTree(prev, updatedPage.id, updatedPage));
  }, []);

  // Handle AI actions (pages created, deleted, updated by sidebar agent or chat)
  const handleAiPagesChanged = useCallback(
    async (_actions: any[]) => {
      try {
        const fresh = await fetchPagesFromApi(token);
        setPages(fresh);

        // Do NOT auto-redirect on page creation; user stays in chat and clicks the page card button.
        // If the currently viewed page was deleted, switch to fallback.
        if (selectedPageId && !findPageById(fresh, selectedPageId)) {
          const fallback = fresh.length > 0 && fresh[0] ? fresh[0].id : null;
          if (fallback) {
            router.push(`/p/${fallback}`);
          } else {
            router.push('/home');
          }
        }
      } catch (err) {
        console.error('[Web] Failed to reload pages after AI actions:', err);
      }
    },
    [token, selectedPageId, router]
  );

  // Select page from tree: navigates to /p/[pageId]
  const handleSelectPage = useCallback(
    (page: PageItem) => {
      setSelectedPageId(page.id);
      router.push(`/p/${page.id}`);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    },
    [router]
  );

  // Navigation tab switcher (Home vs Chat)
  const handleSelectItem = useCallback(
    (item: string) => {
      if (item === 'chat') {
        setActiveItem('chat');
        router.push('/chats');
      } else {
        setActiveItem('home');
        setSelectedPageId(null);
        router.push('/home');
      }
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    },
    [router]
  );

  // Select chat from sidebar list: navigates to /chats/[id]
  const handleSelectChat = useCallback(
    (chat: ChatSummary) => {
      setSelectedChatId(chat.id);
      setActiveItem('chat');
      router.push(`/chats/${chat.id}`);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    },
    [router]
  );

  // Create new page with template from HomeDashboard
  const handleCreatePageWithTemplate = useCallback(
    async (template: { title: string; icon?: string; content: string }) => {
      try {
        const created = await createPageInApi(
          {
            title: template.title,
            parentId: null,
            icon: template.icon || null,
            coverImage: null,
            quote: null,
            content: template.content,
          },
          token
        );
        if (created) {
          setPages((prev) => insertPageInTree(prev, created, null));
          setSelectedPageId(created.id);
          router.push(`/p/${created.id}`);
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }
      } catch (err) {
        console.error('[Web] Failed to create page with template:', err);
      }
    },
    [token, router]
  );

  // Create new chat: navigates to /chats
  const handleCreateChat = useCallback(() => {
    setSelectedChatId(null);
    setActiveItem('chat');
    router.push('/chats');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [router]);

  // Delete chat
  const handleDeleteChat = useCallback(
    async (chatIdToDelete: string) => {
      await deleteAiChat(chatIdToDelete, token);
      setChats((prev) => prev.filter((c) => c.id !== chatIdToDelete));
      if (selectedChatId === chatIdToDelete) {
        setSelectedChatId(null);
        router.push('/chats');
      }
    },
    [token, selectedChatId, router]
  );

  // When a chat is created upon first message in ChatView: updates route to /chats/[newChatId]
  const handleChatCreated = useCallback(
    (newChatId: string) => {
      setSelectedChatId(newChatId);
      // Refresh chats list so sidebar shows it immediately
      fetchAiChats(token).then((data) => setChats(data));
      router.replace(`/chats/${newChatId}`);
    },
    [token, router]
  );

  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const isChatActive = activeItem === 'chat' || section === 'chat' || Boolean(chatId);
  const selectedPage = selectedPageId ? findPageById(pages, selectedPageId) : null;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#191919] text-[#ededed]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <Logo size={42} isDark={true} />
          <div className="flex items-center gap-2.5 text-sm text-[#9b9b9b]">
            <Loader2 className="size-4 animate-spin text-[#0085FF]" />
            <span>Loading workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-screen flex flex-row overflow-hidden select-none transition-colors duration-150 ${
        isDark
          ? 'bg-[#191919] text-[#ededed] selection:bg-blue-500/30 selection:text-white'
          : 'bg-[#ffffff] text-[#1a1a1a] selection:bg-blue-500/20 selection:text-blue-900'
      }`}
    >
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Notion-style Left Sidebar */}
      {isSidebarOpen && (
        <WebSidebar
          user={user}
          onToggleSidebar={() => setIsSidebarOpen(false)}
          activeItem={isChatActive ? 'chat' : 'home'}
          onSelectItem={handleSelectItem}
          onSignOut={() => signOut()}
          pages={pages}
          selectedPageId={selectedPageId}
          onSelectPage={handleSelectPage}
          onCreatePage={handleCreatePage}
          onDeletePage={handleDeletePage}
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onCreateChat={handleCreateChat}
          onDeleteChat={handleDeleteChat}
        />
      )}

      {/* Right Column */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden relative">
        {isChatActive ? (
          /* Full Chat View on /chats or /chats/[chatId] */
          <ChatView
            chatId={selectedChatId}
            onChatCreated={handleChatCreated}
            onTitleUpdated={(newTitle) => {
              setChats((prev) =>
                prev.map((c) => (c.id === selectedChatId ? { ...c, title: newTitle } : c))
              );
            }}
            onDeleteChat={handleDeleteChat}
            onNavigateToPage={(pageId) => {
              setSelectedPageId(pageId);
              router.push(`/p/${pageId}`);
            }}
            token={token}
            isDark={isDark}
            showHeader={true}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onPagesChanged={handleAiPagesChanged}
          />
        ) : selectedPageId && selectedPage ? (
          /* Real Page with Tiptap Editor & Cover Banner matching user screenshot */
          <PageView
            page={selectedPage}
            onPageUpdate={handlePageUpdate}
            token={token}
            isDark={isDark}
            showHeader={true}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onPagesChanged={handleAiPagesChanged}
          />
        ) : isLoadingPages ? (
          /* Loading State */
          <div className="flex-1 h-screen flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#0085FF]" />
          </div>
        ) : (
          /* Home Dashboard matching screenshot */
          <HomeDashboard
            user={user}
            pages={pages}
            onSelectPage={handleSelectPage}
            onCreatePageWithTemplate={handleCreatePageWithTemplate}
            isDark={isDark}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onOpenAi={() => router.push('/chats')}
          />
        )}
      </div>
    </div>
  );
}

export default WorkspaceLayout;
