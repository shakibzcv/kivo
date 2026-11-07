'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function Footer() {
  const pathname = usePathname();

  if (pathname === '/home' || pathname?.startsWith('/home/')) {
    return null;
  }

  const navigation = [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'FAQ', href: '/#faq' },
  ];

  const social = [
    { name: 'GitHub', href: 'https://github.com' },
  ];

  const legal = [{ name: 'Privacy Policy', href: '/privacy' }];

  return (
    <footer className="flex flex-col items-center gap-14 pt-28 lg:pt-32 pb-12">
      <div className="container space-y-3 text-center">
        <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl font-bold">
          Start writing in Kivo today
        </h2>
        <p className="text-muted-foreground mx-auto max-w-xl leading-relaxed text-balance">
          Experience the minimalist workspace designed for clear thinking, clean writing, and effortless organization.
        </p>
        <div>
          <Button size="lg" className="mt-4" asChild>
            <Link href="/login">Get Started Free</Link>
          </Button>
        </div>
      </div>

      <nav className="container flex flex-col items-center gap-4">
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link href={item.href} className="font-medium transition-opacity hover:opacity-75">
                {item.name}
              </Link>
            </li>
          ))}
          {social.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center gap-0.5 font-medium transition-opacity hover:opacity-75"
              >
                {item.name} <ArrowUpRight className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {legal.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="text-muted-foreground text-sm transition-opacity hover:opacity-75"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="text-foreground/5 select-none pointer-events-none mt-10 w-full md:mt-14 lg:mt-20 text-center font-black tracking-widest text-[clamp(4.5rem,18vw,15rem)] leading-none uppercase">
        KIVO
      </div>
    </footer>
  );
}
