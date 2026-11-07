'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ApiUser, fetchCurrentUser, logoutBackend } from './api-client';

export type AuthUser = ApiUser;

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGoogleSigningIn: boolean;
  error: string | null;
  signInWithGoogle: (source?: string) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'kivo_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const saveToken = useCallback((newToken: string | null) => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
        document.cookie = `${TOKEN_KEY}=${newToken}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        localStorage.removeItem(TOKEN_KEY);
        document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await fetchCurrentUser(currentToken);
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Token might be expired or invalid
        saveToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, saveToken]);

  // Handle URL redirect query params from Google OAuth callback on load
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (typeof window === 'undefined') return;

      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get('token');
      const urlError = searchParams.get('error');

      if (urlError) {
        if (isMounted) {
          setError(
            urlError === 'auth_failed'
              ? 'Google authentication was cancelled or failed. Please try again.'
              : `Authentication error: ${urlError}`
          );
        }
        // Clean URL query parameters
        window.history.replaceState({}, '', window.location.pathname);
      } else if (urlToken) {
        saveToken(urlToken);
        try {
          const fetchedUser = await fetchCurrentUser(urlToken);
          if (isMounted && fetchedUser) {
            setUser(fetchedUser);
            const storedSource = typeof window !== 'undefined' ? sessionStorage.getItem('kivo_auth_source') : null;
            if (storedSource !== 'desktop' && window.location.pathname === '/login') {
              window.location.href = '/home';
              return;
            }
          }
        } catch {
          if (isMounted) setError('Could not verify authenticated session.');
        } finally {
          // Clean URL query parameters
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else {
        // Check stored token in localStorage
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          saveToken(storedToken);
          try {
            const fetchedUser = await fetchCurrentUser(storedToken);
            if (isMounted && fetchedUser) {
              setUser(fetchedUser);
            } else if (isMounted) {
              saveToken(null);
            }
          } catch {
            if (isMounted) saveToken(null);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [saveToken]);

  // Interactive Google OAuth flow redirect to backend
  const signInWithGoogle = useCallback((source?: string) => {
    setIsGoogleSigningIn(true);
    setError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const stateQuery = source ? `?state=${encodeURIComponent(source)}` : '';
    window.location.href = `${apiUrl}/api/auth/google${stateQuery}`;
  }, []);


  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Notify backend to trigger Winston logging and session termination
      await logoutBackend(user, token);
    } catch (err) {
      console.warn('Backend logout warning:', err);
    } finally {
      saveToken(null);
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, [user, token, saveToken]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        isGoogleSigningIn,
        error,
        signInWithGoogle,
        signOut,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
