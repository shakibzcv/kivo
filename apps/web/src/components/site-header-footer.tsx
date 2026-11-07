'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/blocks/navbar';
import { Footer } from '@/components/blocks/footer';

export function SiteHeaderFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // App workspace routes and authentication routes must NOT render marketing Header or Footer
  const isAppRoute =
    pathname === '/home' ||
    pathname.startsWith('/home/') ||
    pathname.startsWith('/p/') ||
    pathname === '/chats' ||
    pathname.startsWith('/chats/') ||
    pathname === '/c' ||
    pathname.startsWith('/c/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup');

  if (isAppRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
