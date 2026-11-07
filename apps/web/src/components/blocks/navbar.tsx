'use client';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChevronRight } from 'lucide-react';
import { FaGithub } from 'react-icons/fa6';

import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const ITEMS = [
  {
    label: 'Features',
    href: '/#features',
    dropdownItems: [
      {
        title: 'Distraction-free Writing',
        href: '/#features',
        description: 'Clean document editor with rich formatting, real-time hierarchy, and slash commands.',
      },
      {
        title: 'Workspace AI Assistant',
        href: '/#features',
        description: 'Create, update, and search documents with your intelligent workspace pair-writer.',
      },
    ],
  },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
];

export const Navbar = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  if (pathname === '/home' || pathname?.startsWith('/home/')) {
    return null;
  }

  return (
    <section
      className={cn(
        'bg-background/85 fixed left-1/2 z-50 w-[min(92%,740px)] -translate-x-1/2 rounded-4xl border border-border shadow-md backdrop-blur-md transition-all duration-300',
        'top-4'
      )}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group cursor-pointer" aria-label="Kivo Home">
          <div className="size-7 rounded-lg bg-black dark:bg-white flex items-center justify-center p-1 shadow-xs transition-transform group-hover:scale-105">
            <Logo size={18} isDark={undefined} className="text-white dark:text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">Kivo</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="max-lg:hidden">
          <NavigationMenuList>
            {ITEMS.map((link) =>
              link.dropdownItems ? (
                <NavigationMenuItem key={link.label} className="">
                  <NavigationMenuTrigger className="data-[state=open]:bg-accent/50 bg-transparent! px-1.5">
                    {link.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-[400px] space-y-2 p-4">
                      {link.dropdownItems.map((item) => (
                        <li key={item.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={item.href}
                              className="group hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 leading-none no-underline outline-hidden transition-colors select-none"
                            >
                              <div className="space-y-1.5 transition-transform duration-300 group-hover:translate-x-1">
                                <div className="text-sm leading-none font-medium">{item.title}</div>
                                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={link.label} className="">
                  <Link
                    href={link.href}
                    className={cn(
                      'relative bg-transparent px-1.5 text-sm font-medium transition-opacity hover:opacity-75',
                      pathname === link.href && 'text-muted-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuItem>
              )
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {user ? (
            <Link
              href="/home"
              title={user.name || user.email || 'Profile'}
              aria-label="Profile and Workspace"
              className="max-lg:hidden flex items-center justify-center p-0.5 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all cursor-pointer"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name || 'User avatar'}
                  className="size-8 rounded-full object-cover border border-border shadow-xs"
                />
              ) : (
                <div className="size-8 rounded-full bg-[#0085FF] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          ) : (
            <Link href="/login" className="max-lg:hidden">
              <Button variant="outline">
                <span className="relative z-10">Login</span>
              </Button>
            </Link>
          )}
          <a
            href="https://github.com/ichshakib/kivo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaGithub className="size-4" />
            <span className="sr-only">GitHub</span>
          </a>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className="text-muted-foreground relative flex size-8 lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <div className="absolute top-1/2 left-1/2 block w-[18px] -translate-x-1/2 -translate-y-1/2">
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}
              ></span>
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? 'opacity-0' : ''}`}
              ></span>
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/*  Mobile Menu Navigation */}
      <div
        className={cn(
          'bg-background fixed inset-x-0 top-[calc(100%+1rem)] flex flex-col rounded-2xl border p-6 transition-all duration-300 ease-in-out lg:hidden',
          isMenuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-4 opacity-0'
        )}
      >
        <nav className="divide-border flex flex-1 flex-col divide-y">
          {ITEMS.map((link) =>
            link.dropdownItems ? (
              <div key={link.label} className="py-4 first:pt-0 last:pb-0">
                <button
                  onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                  className="text-primary flex w-full items-center justify-between text-base font-medium"
                >
                  {link.label}
                  <ChevronRight
                    className={cn(
                      'size-4 transition-transform duration-200',
                      openDropdown === link.label ? 'rotate-90' : ''
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    openDropdown === link.label
                      ? 'mt-4 max-h-[1000px] opacity-100'
                      : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="bg-muted/50 space-y-3 rounded-lg p-4">
                    {link.dropdownItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="group hover:bg-accent block rounded-md p-2 transition-colors"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setOpenDropdown(null);
                        }}
                      >
                        <div className="transition-transform duration-200 group-hover:translate-x-1">
                          <div className="text-primary font-medium">{item.title}</div>

                          <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'text-primary hover:text-primary/80 py-4 text-base font-medium transition-colors first:pt-0 last:pb-0',
                  pathname === link.href && 'text-muted-foreground'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}

          {/* Mobile Auth Button */}
          <div className="py-4 first:pt-0 last:pb-0">
            {user ? (
              <Link
                href="/home"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border/60 hover:bg-muted transition-colors cursor-pointer"
                title="Go to Workspace"
              >
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name || 'User avatar'}
                    className="size-9 rounded-full object-cover border border-border shadow-xs"
                  />
                ) : (
                  <div className="size-9 rounded-full bg-[#0085FF] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm text-foreground truncate">{user.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block w-full">
                <Button className="w-full bg-[#0085FF] hover:bg-[#0073e6] text-white">
                  Login / Sign in
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </section>
  );
};
