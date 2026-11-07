import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
  type User,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { GOOGLE_AUTH_CONFIG } from '@/constants/auth';

let isConfigured = false;

/**
 * Configure Google Sign-In with Web, iOS, and Android client credentials
 */
export function configureGoogleSignIn(): void {
  if (Platform.OS === 'web') {
    return;
  }

  if (!isConfigured) {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_AUTH_CONFIG.webClientId,
        iosClientId: GOOGLE_AUTH_CONFIG.iosClientId,
        scopes: [...GOOGLE_AUTH_CONFIG.scopes],
        offlineAccess: GOOGLE_AUTH_CONFIG.offlineAccess,
        forceCodeForRefreshToken: false,
      });
      isConfigured = true;
    } catch (err) {
      console.error('Failed to configure Google Sign-In:', err);
    }
  }
}

export interface GoogleAuthResult {
  success: boolean;
  user?: User['user'];
  idToken?: string;
  cancelled?: boolean;
  error?: string;
}

/**
 * Initiate interactive Google Sign-In flow
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (Platform.OS === 'web') {
    // Graceful web fallback for testing in web browser
    return {
      success: true,
      user: {
        id: 'web_demo_user_1',
        name: 'Demo Google User',
        email: 'user@kivo.app',
        photo: 'https://lh3.googleusercontent.com/a/default-user',
        familyName: 'User',
        givenName: 'Demo',
      },
    };
  }

  try {
    configureGoogleSignIn();

    // Check Play Services on Android
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      return {
        success: true,
        user: response.data.user,
        idToken: response.data.idToken ?? undefined,
      };
    } else {
      return {
        success: false,
        cancelled: true,
      };
    }
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { success: false, cancelled: true };
        case statusCodes.IN_PROGRESS:
          return { success: false, error: 'Sign-in is already in progress.' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            error: 'Google Play Services is not available or needs to be updated.',
          };
        default:
          return {
            success: false,
            error: error.message || `Sign-in failed (code: ${error.code}).`,
          };
      }
    }

    const genericMessage =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred during Google sign in.';
    return { success: false, error: genericMessage };
  }
}

/**
 * Silently restore an existing user session on app launch
 */
export async function signInSilently(): Promise<GoogleAuthResult> {
  if (Platform.OS === 'web') {
    return { success: false };
  }

  try {
    configureGoogleSignIn();

    const hasPrevious = GoogleSignin.hasPreviousSignIn();
    if (!hasPrevious) {
      return { success: false };
    }

    const response = await GoogleSignin.signInSilently();
    if (response && 'data' in response && response.data) {
      return {
        success: true,
        user: response.data.user,
        idToken: response.data.idToken ?? undefined,
      };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

/**
 * Sign out of current Google session
 */
export async function signOutGoogle(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    configureGoogleSignIn();
    await GoogleSignin.signOut();
  } catch (err) {
    console.error('Error during Google Sign-Out:', err);
  }
}

/**
 * Retrieve currently logged-in user profile from GoogleSignin cache
 */
export async function getCurrentGoogleUser(): Promise<User['user'] | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    configureGoogleSignIn();
    const user = GoogleSignin.getCurrentUser();
    return user?.user ?? null;
  } catch {
    return null;
  }
}
