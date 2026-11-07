'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/auth-context';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  Monitor,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    isGoogleSigningIn,
    error,
    signInWithGoogle,
    signOut,
    clearError,
  } = useAuth();

  const [desktopSource, setDesktopSource] = useState(false);
  const [desktopPort, setDesktopPort] = useState<string | null>(null);
  const [redirectedToDesktop, setRedirectedToDesktop] = useState(false);
  const [isSendingToDesktop, setIsSendingToDesktop] = useState(false);

  // Read query params and session storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const sourceParam = params.get('source');
    const portParam = params.get('port');

    if (sourceParam === 'desktop') {
      setDesktopSource(true);
      sessionStorage.setItem('kivo_auth_source', 'desktop');
      if (portParam) {
        setDesktopPort(portParam);
        sessionStorage.setItem('kivo_auth_port', portParam);
      }
    } else {
      const storedSource = sessionStorage.getItem('kivo_auth_source');
      const storedPort = sessionStorage.getItem('kivo_auth_port');
      if (storedSource === 'desktop') {
        setDesktopSource(true);
        if (storedPort) setDesktopPort(storedPort);
      }
    }
  }, []);

  // Redirect authenticated web users away from login page to /home
  useEffect(() => {
    if (!isLoading && isAuthenticated && !desktopSource) {
      router.replace('/home');
    }
  }, [isLoading, isAuthenticated, desktopSource, router]);

  // Send auth token and user to desktop app when authenticated
  const sendAuthToDesktop = useCallback(async () => {
    if (!token || !user) return;
    setIsSendingToDesktop(true);

    const port = desktopPort || sessionStorage.getItem('kivo_auth_port') || '28282';

    // 1. Send via local loopback HTTP server
    try {
      await fetch(`http://127.0.0.1:${port}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          user,
        }),
      });
    } catch {
      // Loopback server might not be running or CORS/network blocked, fallback to deep link
    }

    // 2. Trigger custom scheme deep link (kivo://auth)
    const userPayload = encodeURIComponent(JSON.stringify(user));
    const deepLinkUrl = `kivo://auth?token=${encodeURIComponent(token)}&user=${userPayload}`;
    window.location.href = deepLinkUrl;

    setRedirectedToDesktop(true);
    setIsSendingToDesktop(false);
  }, [token, user, desktopPort]);

  // When user is authenticated and desktop flow is active, automatically trigger desktop return
  useEffect(() => {
    if (isAuthenticated && desktopSource && token && user && !redirectedToDesktop) {
      sendAuthToDesktop();
    }
  }, [isAuthenticated, desktopSource, token, user, redirectedToDesktop, sendAuthToDesktop]);

  const handleGoogleSignIn = () => {
    if (desktopSource) {
      sessionStorage.setItem('kivo_auth_source', 'desktop');
      if (desktopPort) {
        sessionStorage.setItem('kivo_auth_port', desktopPort);
      }
      signInWithGoogle('desktop');
    } else {
      signInWithGoogle();
    }
  };

  // If loading auth state or already authenticated on web, show spinner while redirecting
  if (isLoading || (isAuthenticated && !desktopSource)) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-start pt-36 sm:pt-44 lg:pt-48 pb-20 px-4">
      <div className="w-full max-w-[380px] flex flex-col items-center text-center animate-in fade-in duration-200">
        {/* Logo */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center justify-center transition-opacity hover:opacity-80"
          aria-label="Back to home"
        >
          <Logo size={46} className="text-foreground" isDark={undefined} />
        </Link>

        {/* Desktop indicator badge if initiated from desktop app */}
        {desktopSource && (
          <div className="mb-4 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-medium flex items-center gap-1.5 animate-in fade-in duration-200">
            <Monitor className="size-3.5" />
            <span>Connecting to Kivo Desktop</span>
          </div>
        )}

        {/* Heading & Subtitle */}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          {desktopSource && isAuthenticated
            ? 'Desktop Connected'
            : isAuthenticated
              ? 'Welcome back'
              : 'Sign in to Kivo'}
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {desktopSource && isAuthenticated
            ? 'You are authenticated. Returning session to Kivo Desktop.'
            : isAuthenticated
              ? 'You are currently signed in with your Google account.'
              : desktopSource
                ? 'Continue with Google to access your account on the Kivo Desktop app.'
                : 'Continue with Google to access your workspace and documents.'}
        </p>

        {/* Error Alert Banner */}
        {error && (
          <div className="w-full mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-200">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
            <button
              type="button"
              onClick={clearError}
              className="text-destructive/80 hover:text-destructive text-xs font-semibold underline ml-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Authenticated State */}
        {isAuthenticated && user ? (
          <div className="w-full space-y-4">
            <div className="w-full bg-muted/40 border border-border/80 rounded-xl p-4 flex items-center gap-3.5 text-left">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="size-11 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="size-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-base shadow-xs">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-0.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>Signed in with Google</span>
                </div>
                <div className="text-sm font-semibold text-foreground truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>

            {/* Desktop Return Action */}
            {desktopSource ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={isSendingToDesktop}
                  onClick={sendAuthToDesktop}
                  className="w-full h-11 rounded-xl bg-[#0085FF] hover:bg-[#0073e6] active:scale-[0.99] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-70"
                >
                  {isSendingToDesktop ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ExternalLink className="size-4" />
                  )}
                  <span>Open Kivo Desktop</span>
                </button>

                <p className="text-[11px] text-muted-foreground">
                  If the desktop app doesn&apos;t open automatically, click the button above.
                </p>

                <div className="pt-2">
                  <Link
                    href="/home"
                    className="w-full h-10 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Or continue to Web Workspace</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/home"
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:bg-primary/90 active:scale-[0.99] flex items-center justify-center shadow-xs"
              >
                Go to Workspace
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('kivo_auth_source');
                sessionStorage.removeItem('kivo_auth_port');
                signOut();
              }}
              className="w-full h-10 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        ) : (
          /* Unauthenticated State */
          <div className="w-full space-y-3">
            {/* Prominent Continue with Google Button */}
            <button
              type="button"
              disabled={isGoogleSigningIn}
              onClick={handleGoogleSignIn}
              className="w-full h-12 px-4 rounded-xl border border-border bg-card hover:bg-muted/70 active:scale-[0.99] text-foreground font-medium text-sm transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-70 disabled:cursor-not-allowed group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isGoogleSigningIn ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
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
              )}
              <span>
                {isGoogleSigningIn ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>
          </div>
        )}

        {/* Footer Terms */}
        <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
          By signing in, you agree to our{' '}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
