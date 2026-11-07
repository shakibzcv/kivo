import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

import { SiteHeaderFooter } from '@/components/site-header-footer';
import { StyleGlideProvider } from '@/components/styleglide-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kivo.app'),
  title: {
    default: 'Kivo - Modern Document & Workspace Ecosystem',
    template: '%s | Kivo',
  },
  description: 'A modern workspace template built with shadcn/ui, Tailwind & Next.js.',
  icons: {
    icon: [{ url: '/favicon/favicon.ico' }, { url: '/favicon/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/favicon/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'Kivo - Modern Document & Workspace Ecosystem',
    description: 'A modern workspace template built with shadcn/ui, Tailwind & Next.js.',
    siteName: 'Kivo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kivo - Modern Document & Workspace Ecosystem',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <StyleGlideProvider />
            <SiteHeaderFooter>{children}</SiteHeaderFooter>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
