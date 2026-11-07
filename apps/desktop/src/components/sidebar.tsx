import { useState, useRef, useEffect } from 'react';
import {
  PanelLeft,
  SquarePen,
  Home,
  MessageSquare,
  Plus,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Trash2,
  HelpCircle,
  LayoutGrid,
  User,
} from 'lucide-react';
import { PageTree } from '@repo/ui/components/page-tree';
import type { PageItem } from '@repo/ui/lib/page-api';
import type { ChatSummary } from '@repo/ui/lib/ai-api';
import { SearchDialog } from '@repo/ui/components/search-dialog';
import { AccountDialog } from '@repo/ui/components/account-dialog';

export interface SidebarProps {
  user: DesktopAuthUser | null;
  isDark: boolean;
  onToggleSidebar: () => void;
  activeItem: string;
  onSelectItem: (id: string) => void;
  onSignOut: () => void;
  onToggleTheme?: () => void;
  isElectron?: boolean;
  pages: PageItem[];
  selectedPageId: string | null;
  onSelectPage: (page: PageItem) => void;
  onCreatePage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  chats?: ChatSummary[];
  selectedChatId?: string | null;
  onSelectChat?: (chat: ChatSummary) => void;
  onCreateChat?: () => void;
  onDeleteChat?: (chatId: string) => void;
}

export function DesktopSidebar({
  user,
  isDark,
  onToggleSidebar,
  activeItem,
  onSelectItem,
  onSignOut,
  onToggleTheme,
  isElectron = true,
  pages,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  chats = [],
  selectedChatId = null,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
}: SidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState<number>(272);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kivo_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        const max = typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.40) : 500;
        if (!isNaN(parsed) && parsed >= 272 && parsed <= max) {
          setWidth(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K to open search dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const min = 272;
      const max = Math.floor(window.innerWidth * 0.40);
      const clamped = Math.max(min, Math.min(moveEvent.clientX, max));
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
      const finalWidth = Math.max(min, Math.min(upEvent.clientX, max));
      try {
        localStorage.setItem('kivo_sidebar_width', String(finalWidth));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const resetWidth = () => {
    setWidth(272);
    try {
      localStorage.setItem('kivo_sidebar_width', '272');
    } catch {}
  };

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const noDragStyle = isElectron
    ? ({ WebkitAppRegion: 'no-drag' } as React.CSSProperties)
    : undefined;

  const isChatActive = activeItem === 'chat';
  const isHomeActive = !isChatActive;

  return (
    <>
      <aside
        style={{ width: `${width}px` }}
        className={`h-screen flex flex-col justify-between select-none relative shrink-0 border-r ${
          isResizing ? 'transition-none select-none' : 'transition-[width] duration-150'
        } ${
          isDark
            ? 'bg-[#202020] border-white/[0.06] text-[#d4d4d4]'
            : 'bg-[#f7f7f5] border-black/[0.08] text-[#37352f]'
        }`}
      >
        {/* Scrollable Main Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 pt-2.5 pb-2">
          {/* 1. Top Header Row: Toggle Left & Actions Right (Inbox & separator border removed) */}
          <div className="h-8 flex items-center justify-between flex-shrink-0 mb-1" style={noDragStyle}>
            {/* Left: Sidebar Toggle icon */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-white/[0.08] text-[#9b9b9b] hover:text-white'
                  : 'hover:bg-black/[0.06] text-[#6b6966] hover:text-black'
              }`}
              title="Close sidebar"
            >
              <PanelLeft className="size-4.5" />
            </button>

            {/* Right: New page */}
            <button
              type="button"
              onClick={() => onCreatePage(null)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-white/[0.08] text-[#9b9b9b] hover:text-white'
                  : 'hover:bg-black/[0.06] text-[#6b6966] hover:text-black'
              }`}
              title="New page"
            >
              <SquarePen className="size-4.5" />
            </button>
          </div>

          {/* 2. Search or ask input */}
          <div className="my-1.5" style={noDragStyle}>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors text-left ${
                isDark
                  ? 'bg-[#191919] border-white/[0.08] text-[#848484] hover:border-white/[0.16] hover:text-[#b0b0b0]'
                  : 'bg-white border-black/[0.08] text-[#787774] hover:border-black/[0.16] hover:text-black shadow-2xs'
              }`}
            >
              <span className="truncate text-xs font-medium">Search or ask</span>
              <kbd
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                  isDark
                    ? 'bg-white/[0.08] text-[#9b9b9b] border border-white/[0.06]'
                    : 'bg-black/[0.05] text-[#666] border border-black/[0.06]'
                }`}
              >
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* 3. Navigation Tabs: [Home] and [Chat] */}
          <div className="flex items-center gap-1.5 py-2 my-0.5" style={noDragStyle}>
            {/* Home Tab */}
            <button
              type="button"
              onClick={() => onSelectItem('home')}
              className={`h-8 flex items-center rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                isHomeActive
                  ? isDark
                    ? 'bg-white/[0.12] text-white font-medium px-3 gap-2 shadow-2xs'
                    : 'bg-black/[0.08] text-black font-semibold px-3 gap-2 shadow-2xs'
                  : isDark
                    ? 'w-8 justify-center text-[#9b9b9b] hover:bg-white/[0.06] hover:text-white'
                    : 'w-8 justify-center text-[#5a5855] hover:bg-black/[0.05] hover:text-black'
              }`}
              title="Home"
            >
              <Home className="size-4 shrink-0" />
              {isHomeActive && <span className="animate-in fade-in duration-150">Home</span>}
            </button>

            {/* Chat Tab */}
            <button
              type="button"
              onClick={() => onSelectItem('chat')}
              className={`h-8 flex items-center rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                isChatActive
                  ? isDark
                    ? 'bg-white/[0.12] text-white font-medium px-3 gap-2 shadow-2xs'
                    : 'bg-black/[0.08] text-black font-semibold px-3 gap-2 shadow-2xs'
                  : isDark
                    ? 'w-8 justify-center text-[#9b9b9b] hover:bg-white/[0.06] hover:text-white'
                    : 'w-8 justify-center text-[#6b6966] hover:bg-black/[0.05] hover:text-black'
              }`}
              title="Chat & Ask AI"
            >
              <MessageSquare className="size-4 shrink-0" />
              {isChatActive && <span className="animate-in fade-in duration-150">Chat</span>}
            </button>
          </div>

          {/* 4. Section Content based on active tab */}
          {isHomeActive ? (
            /* Workspace Pages Tree */
            <div style={noDragStyle}>
              <PageTree
                pages={pages}
                selectedId={selectedPageId}
                onSelect={onSelectPage}
                onCreatePage={onCreatePage}
                onDeletePage={onDeletePage}
                isDark={isDark}
              />
            </div>
          ) : (
            /* Chat List Section */
            <div className="space-y-1 pt-1 select-none" style={noDragStyle}>
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-medium tracking-tight text-[#84827e] dark:text-[#787774]">
                <span>Chats</span>
                <button
                  type="button"
                  onClick={() => onCreateChat?.()}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="New chat"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {chats && chats.length > 0 ? (
                <div className="space-y-0.5">
                  {chats.map((c) => {
                    const isSelected = selectedChatId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => onSelectChat?.(c)}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-white/[0.12] text-white font-medium'
                              : 'bg-black/[0.08] text-black font-medium'
                            : isDark
                              ? 'hover:bg-white/[0.06] text-gray-300'
                              : 'hover:bg-black/[0.05] text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare className="size-3.5 shrink-0 opacity-60" />
                          <span className="truncate">{c.title}</span>
                        </div>
                        {onDeleteChat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteChat(c.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity ml-1 rounded shrink-0 cursor-pointer"
                            title="Delete chat"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-2 py-6 text-center">
                  <p className="text-xs text-[#8e8e8e] dark:text-[#787774] font-normal">
                    No chats yet
                  </p>
                  <button
                    type="button"
                    onClick={() => onCreateChat?.()}
                    className="mt-2 text-[11px] text-blue-500 hover:underline cursor-pointer"
                  >
                    Start an AI chat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Bottom Section: User Profile Footer */}
        <div
          className={`px-3 py-2 border-t flex-shrink-0 ${
            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
          }`}
          style={noDragStyle}
        >
          {/* User Profile Bar */}
          <div className="relative" ref={userMenuRef}>
            <div className="flex items-center justify-between pt-1">
              {/* User Trigger Button */}
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 p-1 -ml-1 rounded-lg transition-colors cursor-pointer max-w-[180px] ${
                  isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-black/[0.05]'
                }`}
              >
                {/* Avatar with notification red badge */}
                <div className="relative shrink-0">
                  {user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="size-6 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-[#0085FF] text-white flex items-center justify-center font-bold text-[10px]">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Red notification dot */}
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#ff4d4f] ring-2 ring-[#202020]" />
                </div>

                {/* Username + Chevron */}
                <span
                  className={`text-xs font-semibold truncate ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {displayName}
                </span>
                <ChevronDown
                  className={`size-3 shrink-0 text-[#8e8e8e] transition-transform duration-150 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Right Icons: Help (?) with blue dot + LayoutGrid */}
              <div className="flex items-center gap-1">
                {/* Help button with blue dot */}
                <button
                  type="button"
                  className={`relative p-1 rounded-md transition-colors cursor-pointer ${
                    isDark
                      ? 'hover:bg-white/[0.08] text-[#8e8e8e] hover:text-white'
                      : 'hover:bg-black/[0.06] text-[#73716d] hover:text-black'
                  }`}
                  title="Help & Support"
                >
                  <HelpCircle className="size-4" />
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[#0085FF]" />
                </button>

                {/* App Grid icon */}
                <button
                  type="button"
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    isDark
                      ? 'hover:bg-white/[0.08] text-[#8e8e8e] hover:text-white'
                      : 'hover:bg-black/[0.06] text-[#73716d] hover:text-black'
                  }`}
                  title="Workspace switcher"
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>

            {/* User Popover Menu */}
            {isUserMenuOpen && (
              <div
                className={`absolute bottom-full left-0 mb-2 w-56 rounded-xl border p-1.5 shadow-xl text-xs z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? 'bg-[#1e1e1e] border-white/[0.1] text-white shadow-black/60'
                    : 'bg-white border-black/[0.1] text-black shadow-gray-400/30'
                }`}
              >
                {/* User summary */}
                <div
                  className={`px-2.5 py-2 border-b mb-1 ${
                    isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                  }`}
                >
                  <div className="font-semibold truncate">{displayName}</div>
                  <div
                    className={`text-[11px] truncate ${
                      isDark ? 'text-[#888]' : 'text-[#666]'
                    }`}
                  >
                    {user?.email || 'user@kivo.app'}
                  </div>
                </div>

                {/* Account Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsAccountOpen(true);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-black/[0.06]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="size-3.5" />
                    <span>Account</span>
                  </span>
                </button>

                {/* Theme Toggle */}
                {onToggleTheme && (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-black/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                      <span>Theme</span>
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-[#888]' : 'text-[#666]'}`}>
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </button>
                )}

                {/* Sign out */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onSignOut();
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-red-50 text-red-600'
                  }`}
                >
                  <LogOut className="size-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Resize Drag Handle */}
        <div
          onMouseDown={startResizing}
          onDoubleClick={resetWidth}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-40"
          title="Drag to resize sidebar (double-click to reset)"
          style={noDragStyle}
        />
      </aside>

      {/* Search or Ask Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pages={pages}
        onSelectPage={onSelectPage}
        isDark={isDark}
      />

      {/* Account Settings Dialog */}
      <AccountDialog
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        user={user}
        isDark={isDark}
        onSignOut={onSignOut}
      />
    </>
  );
}

export default DesktopSidebar;
