import { API_CONFIG } from '@/constants/auth';
import { type User } from '@react-native-google-signin/google-signin';

export interface BackendAuthResponse {
  statusCode: number;
  data: {
    user: User['user'];
    token: string;
  } | null;
  message: string;
  success: boolean;
}

/**
 * Send mobile Google auth details to backend API for verification and logging
 */
export async function syncGoogleAuthWithBackend(
  user: User['user'],
  idToken?: string | null
): Promise<BackendAuthResponse | null> {
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.mobileGoogleAuth}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        user,
        idToken: idToken ?? null,
      }),
    });

    if (!response.ok) {
      console.warn(`[API] Auth sync returned status ${response.status}`);
      return null;
    }

    const data: BackendAuthResponse = await response.json();
    return data;
  } catch (error) {
    console.warn(`[API] Could not connect to backend at ${url}:`, error);
    return null;
  }
}

/**
 * Notify backend API of user logout for server-side logging and session termination
 */
export async function notifyBackendLogout(user?: User['user'] | null): Promise<boolean> {
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.logout}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        user: user ?? null,
        userId: user?.id ?? null,
        email: user?.email ?? null,
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn(`[API] Could not send logout to backend at ${url}:`, error);
    return false;
  }
}
