import { useState, useEffect, useCallback } from 'react';
import { Logo } from './components/logo';
import { DesktopSidebar } from './components/sidebar';
import {
  PanelLeft,
  Loader2,
  ExternalLink,
  Sparkles,
  Plus,
  AlertCircle,
  FileText,
  Home,
} from 'lucide-react';
import { PageView } from '@repo/ui/components/page-view';
import { ChatView } from '@repo/ui/components/chat-view';
import { getPageIcon } from '@repo/ui/components/page-tree';
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

export function App() {
  const [page, setPage] = useState<'login' | 'dashboard'>('login');
  const [user, setUser] = useState<DesktopAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState<string>('home');

  // Real pages loaded from PostgreSQL API (Zero dummy data)
  const [pages, setPages] = useState<PageItem[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(true);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Restore saved session on app launch
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('kivo_desktop_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed.token && parsed.user) {
          setUser(parsed.user);
          setToken(parsed.token);
          setPage('dashboard');
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved auth from localStorage:', e);
    }
  }, []);

  // Listen for auth:success event from main process (via loopback server or kivo:// deep link)
  useEffect(() => {
    const handleAuthSuccess = (data: { token: string; user: DesktopAuthUser }) => {
      if (data && data.token) {
        localStorage.setItem('kivo_desktop_auth', JSON.stringify(data));
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticating(false);
        setAuthError(null);
        setPage('dashboard');
      }
    };

    let unsubscribe: (() => void) | undefined;
    if (window.electronAPI?.onAuthSuccess) {
      unsubscribe = window.electronAPI.onAuthSuccess(handleAuthSuccess);
    }

    const ipcHandler = (_event: any, data: { token: string; user: DesktopAuthUser }) => {
      handleAuthSuccess(data);
    };
    if (window.ipcRenderer?.on) {
      window.ipcRenderer.on('auth:success', ipcHandler);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (window.ipcRenderer?.off) {
        window.ipcRenderer.off('auth:success', ipcHandler);
      }
    };
  }, []);

  // Fetch real cloud pages and chats on mount or auth change
  const loadPages = useCallback(async () => {
    setIsLoadingPages(true);
    try {
      const [data, chatsData] = await Promise.all([
        fetchPagesFromApi(token),
        fetchAiChats(token),
      ]);
      setPages(data);
      setChats(chatsData);
      if (data.length > 0) {
        setSelectedPageId((prev) => prev || data[0].id);
      }
    } catch (err) {
      console.error('[Desktop] Failed to fetch workspace data from cloud:', err);
    } finally {
      setIsLoadingPages(false);
    }
  }, [token]);

  const handleSelectChat = useCallback((chatItem: ChatSummary) => {
    setSelectedChatId(chatItem.id);
    setActiveItem('chat');
  }, []);

  const handleCreateChat = useCallback(() => {
    setSelectedChatId(null);
    setActiveItem('chat');
  }, []);

  const handleDeleteChat = useCallback(
    async (chatIdToDelete: string) => {
      await deleteAiChat(chatIdToDelete, token);
      setChats((prev) => prev.filter((c) => c.id !== chatIdToDelete));
      if (selectedChatId === chatIdToDelete) {
        setSelectedChatId(null);
      }
    },
    [token, selectedChatId]
  );

  useEffect(() => {
    if (page === 'dashboard') {
      loadPages();
    }
  }, [page, loadPages]);

  // Create page in cloud database
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
          setActiveItem(created.id);
        }
      } catch (err) {
        console.error('[Desktop] Failed to create page:', err);
      }
    },
    [token]
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
              const fallback = next.length > 0 ? next[0].id : null;
              setSelectedPageId(fallback);
              setActiveItem(fallback || 'home');
            }
            return next;
          });
        }
      } catch (err) {
        console.error('[Desktop] Failed to delete page:', err);
      }
    },
    [token, selectedPageId]
  );

  // Update page in local tree when changed in PageView
  const handlePageUpdate = useCallback((updatedPage: PageItem) => {
    setPages((prev) => updatePageInTree(prev, updatedPage.id, updatedPage));
  }, []);

  // Handle AI actions (pages created, deleted, updated by sidebar agent)
  const handleAiPagesChanged = useCallback(
    async (_actions: any[]) => {
      try {
        const fresh = await fetchPagesFromApi(token);
        setPages(fresh);

        setSelectedPageId((curr) => {
          if (!curr || !findPageById(fresh, curr)) {
            const fallback = fresh.length > 0 && fresh[0] ? fresh[0].id : null;
            setActiveItem(fallback || 'home');
            return fallback;
          }
          return curr;
        });
      } catch (err) {
        console.error('[Desktop] Failed to reload pages after AI actions:', err);
      }
    },
    [token]
  );

  const handleSelectPage = useCallback((pageItem: PageItem) => {
    setSelectedPageId(pageItem.id);
    setActiveItem(pageItem.id);
  }, []);

  const handleSelectItem = useCallback(
    (item: string) => {
      if (item === 'chat') {
        setActiveItem('chat');
      } else {
        if (selectedPageId) {
          setActiveItem(selectedPageId);
        } else if (pages.length > 0 && pages[0]) {
          setSelectedPageId(pages[0].id);
          setActiveItem(pages[0].id);
        } else {
          setActiveItem('home');
        }
      }
    },
    [pages, selectedPageId]
  );

  // Handle system theme updates
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (matches: boolean) => {
      setIsDark(matches);
      document.documentElement.classList.toggle('dark', matches);
    };

    updateTheme(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      updateTheme(e.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Initiate authentication via web browser
  const handleGoogleSignIn = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      if (window.electronAPI?.startGoogleAuth) {
        const result = await window.electronAPI.startGoogleAuth();
        if (!result.started && result.error) {
          setAuthError(result.error);
          setIsAuthenticating(false);
        }
      } else if (window.ipcRenderer?.invoke) {
        const result = await window.ipcRenderer.invoke('auth:start-google');
        if (result && !result.started && result.error) {
          setAuthError(result.error);
          setIsAuthenticating(false);
        }
      } else {
        // Fallback for browser preview mode (when running Vite without Electron)
        window.open('http://localhost:3000/login?source=desktop', '_blank');
      }
    } catch (err: any) {
      console.error('Error initiating Google sign-in:', err);
      setAuthError(err.message || 'Could not launch Google authentication in browser.');
      setIsAuthenticating(false);
    }
  }, []);

  // Cancel pending authentication
  const handleCancelAuth = useCallback(async () => {
    try {
      if (window.electronAPI?.cancelAuth) {
        await window.electronAPI.cancelAuth();
      } else if (window.ipcRenderer?.invoke) {
        await window.ipcRenderer.invoke('auth:cancel');
      }
    } catch {
      // Ignore cancel errors
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  // Sign out user and return to login screen
  const handleSignOut = useCallback(() => {
    localStorage.removeItem('kivo_desktop_auth');
    setUser(null);
    setToken(null);
    setPages([]);
    setSelectedPageId(null);
    setPage('login');
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const selectedPage = selectedPageId ? findPageById(pages, selectedPageId) : null;

  return (
    <div
      className={`min-h-screen selection:bg-blue-500/30 transition-colors duration-200 ${
        isDark
          ? 'bg-[#191919] text-[#ededed] selection:text-white'
          : 'bg-[#ffffff] text-[#1a1a1a] selection:text-blue-900'
      }`}
    >
      {page === 'dashboard' ? (
        /* Workspace Screen with Left Sidebar & Right Main Content */
        <div className="h-screen w-screen flex flex-row overflow-hidden">
          {/* Notion-style Left Sidebar */}
          {isSidebarOpen && (
            <DesktopSidebar
              user={user}
              isDark={isDark}
              onToggleSidebar={() => setIsSidebarOpen(false)}
              activeItem={activeItem}
              onSelectItem={handleSelectItem}
              onSignOut={handleSignOut}
              onToggleTheme={toggleTheme}
              isElectron={true}
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

          {/* Right Main Column (Titlebar + Main Content) */}
          <div className="flex-1 h-screen flex flex-col overflow-hidden relative">
            {/* Native Window Titlebar Drag Region for Main Area */}
            <div
              className={`h-11 w-full flex-shrink-0 select-none flex items-center px-4 justify-between border-b ${
                isDark ? 'border-white/[0.06] bg-[#191919]' : 'border-black/[0.06] bg-[#ffffff]'
              }`}
              style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
              <div
                className="flex items-center gap-2"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                {!isSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className={`p-1 rounded-md transition-colors cursor-pointer mr-0.5 ${
                      isDark
                        ? 'hover:bg-white/[0.08] text-[#9b9b9b] hover:text-white'
                        : 'hover:bg-black/[0.06] text-[#6b6966] hover:text-black'
                    }`}
                    title="Open sidebar"
                  >
                    <PanelLeft className="size-4" />
                  </button>
                )}
                {activeItem === 'chat' ? (
                  <Sparkles className="size-3.5 text-violet-400 shrink-0" />
                ) : selectedPage ? (
                  getPageIcon(selectedPage, 'size-3.5')
                ) : (
                  <Home className="size-3.5 text-gray-400 shrink-0" />
                )}
                <span className="text-xs font-medium">
                  {activeItem === 'chat' ? 'Chat' : selectedPage?.title || 'Untitled'}
                </span>
              </div>

              {/* Electron native window controls space - Connected badge removed */}
              <div
                className="flex items-center gap-2 pr-28"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              />
            </div>

            {/* Right Main Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
              {activeItem === 'chat' ? (
                /* Real ChatView with persistent sessions & tools */
                <ChatView
                  chatId={selectedChatId}
                  onChatCreated={(newId) => {
                    setSelectedChatId(newId);
                    fetchAiChats(token).then((data) => setChats(data));
                  }}
                  onTitleUpdated={(newTitle) => {
                    setChats((prev) =>
                      prev.map((c) => (c.id === selectedChatId ? { ...c, title: newTitle } : c))
                    );
                  }}
                  onDeleteChat={handleDeleteChat}
                  onNavigateToPage={(pageId) => {
                    setSelectedPageId(pageId);
                    setActiveItem(pageId);
                  }}
                  token={token}
                  isDark={isDark}
                  showHeader={false}
                  onPagesChanged={handleAiPagesChanged}
                />
              ) : selectedPage ? (
                /* Real Page with Tiptap Editor & Cover Banner matching user screenshot */
                <PageView
                  page={selectedPage}
                  onPageUpdate={handlePageUpdate}
                  token={token}
                  isDark={isDark}
                  showHeader={false}
                  onPagesChanged={handleAiPagesChanged}
                />
              ) : isLoadingPages ? (
                /* Loading State */
                <div className="flex-1 h-full flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-[#0085FF]" />
                </div>
              ) : (
                /* Zero Dummy Data - Clean Empty State */
                <div
                  className={`flex-1 h-full flex flex-col items-center justify-center p-8 text-center select-none ${
                    isDark ? 'bg-[#191919]' : 'bg-[#ffffff]'
                  }`}
                >
                  <div className="max-w-md space-y-4">
                    <div
                      className={`size-14 rounded-2xl flex items-center justify-center mx-auto ${
                        isDark ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-black/5 border border-black/10 text-gray-600'
                      }`}
                    >
                      <FileText className="size-7" />
                    </div>
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      No pages yet
                    </h2>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Your workspace is fresh and clean. Click below to add your first cloud page.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCreatePage(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-medium text-xs shadow-md hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Add a page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Login Screen with Top Drag Bar */
        <div className="min-h-screen flex flex-col justify-between">
          {/* Native Window Titlebar Drag Region */}
          <div
            className="h-9 w-full flex-shrink-0 select-none"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          />

          {/* Login Main Content Area */}
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-[380px] flex flex-col items-center text-center animate-in fade-in duration-200">
              {/* Standalone Kivo Logo */}
              <div className="mb-6 flex items-center justify-center">
                <Logo size={46} isDark={isDark} />
              </div>

              {/* Heading & Subtitle */}
              <h1
                className={`text-2xl font-semibold tracking-tight text-center mb-2 ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}
              >
                Sign in to Kivo
              </h1>
              <p
                className={`text-sm text-center mb-8 font-normal leading-relaxed ${
                  isDark ? 'text-[#9b9b9b]' : 'text-[#6b7280]'
                }`}
              >
                {isAuthenticating
                  ? 'Complete sign-in in your web browser. Kivo Desktop will automatically resume.'
                  : 'Continue with Google to access your workspace and documents.'}
              </p>

              {/* Error banner if authentication failed */}
              {authError && (
                <div className="w-full mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-200">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{authError}</div>
                  <button
                    type="button"
                    onClick={() => setAuthError(null)}
                    className="text-red-400/80 hover:text-red-400 text-xs font-semibold underline ml-1 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Main Auth Action Area */}
              {isAuthenticating ? (
                /* Authenticating State */
                <div className="w-full space-y-4 animate-in fade-in duration-200">
                  <div
                    className={`p-5 rounded-2xl border flex flex-col items-center text-center gap-3 ${
                      isDark
                        ? 'bg-[#181818] border-white/[0.08]'
                        : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Loader2 className="size-6 text-[#0085FF] animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3
                        className={`text-sm font-semibold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        Waiting for browser sign-in...
                      </h3>
                      <p className="text-xs text-[#888888] leading-relaxed">
                        A browser tab has been opened. Complete sign-in on the website to continue to your workspace.
                      </p>
                    </div>

                    <div className="w-full pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className={`w-full h-10 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isDark
                            ? 'bg-[#202020] border-white/[0.1] hover:bg-[#282828] text-white'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Open browser again</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelAuth}
                        className={`w-full h-9 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
                          isDark
                            ? 'text-[#888888] hover:text-white hover:bg-white/[0.04]'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Continue with Google Button */
                <div className="w-full">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className={`w-full h-12 px-4 rounded-xl border font-medium text-sm transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-[0.99] group ${
                      isDark
                        ? 'bg-[#1c1c1c] border-white/[0.12] hover:bg-[#252525] text-white'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              )}

              {/* Footer Disclaimer */}
              <p
                className={`text-center text-xs mt-8 leading-relaxed max-w-xs ${
                  isDark ? 'text-[#666666]' : 'text-gray-500'
                }`}
              >
                By signing in, you agree to our{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.electronAPI?.openExternal) {
                      window.electronAPI.openExternal('http://localhost:3000/privacy');
                    }
                  }}
                  className={`underline transition-colors ${
                    isDark ? 'text-[#888888] hover:text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.electronAPI?.openExternal) {
                      window.electronAPI.openExternal('http://localhost:3000/privacy');
                    }
                  }}
                  className={`underline transition-colors ${
                    isDark ? 'text-[#888888] hover:text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
