import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { type User } from '@react-native-google-signin/google-signin';
import {
  getCurrentGoogleUser,
  signInSilently,
  signInWithGoogle as googleSignInService,
  signOutGoogle as googleSignOutService,
  type GoogleAuthResult,
} from '@/services/google-auth';
import { syncGoogleAuthWithBackend, notifyBackendLogout } from '@/services/api-client';

export type AuthUser = User['user'];

interface AuthContextValue {
  user: AuthUser | null;
  idToken: string | null;
  isLoading: boolean;
  isGoogleSigningIn: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<GoogleAuthResult>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Restore silent session on app startup
  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      try {
        const cachedUser = await getCurrentGoogleUser();
        if (cachedUser && isMounted) {
          setUser(cachedUser);
          setIsLoading(false);
          return;
        }

        const silentResult = await signInSilently();
        if (isMounted && silentResult.success && silentResult.user) {
          setUser(silentResult.user);
          if (silentResult.idToken) {
            setIdToken(silentResult.idToken);
          }
        }
      } catch {
        // Silent sign-in error can be ignored
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    setIsGoogleSigningIn(true);
    setError(null);

    try {
      const result = await googleSignInService();
      if (result.success && result.user) {
        setUser(result.user);
        if (result.idToken) {
          setIdToken(result.idToken);
        }

        // Asynchronously notify & sync with backend API for server logging
        syncGoogleAuthWithBackend(result.user, result.idToken).catch((err) => {
          console.warn('Backend sync warning:', err);
        });
      } else if (result.error && !result.cancelled) {
        setError(result.error);
      }
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign in failed.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsGoogleSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Notify backend of logout for server-side logging
      await notifyBackendLogout(user);
      await googleSignOutService();
      setUser(null);
      setIdToken(null);
      setError(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isLoading,
        isGoogleSigningIn,
        error,
        signInWithGoogle,
        signOut,
        clearError,
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
