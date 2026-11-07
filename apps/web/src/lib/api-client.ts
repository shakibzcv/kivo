export interface ApiUser {
  id: string;
  googleId?: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: 'google';
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  statusCode: number;
  data: {
    user: ApiUser;
    token: string;
    authenticated?: boolean;
  } | null;
  message: string;
  success: boolean;
}

export interface AuthStatusResponse {
  statusCode: number;
  data: {
    provider: string;
    configured: boolean;
    callbackUrl: string;
    clientUrl: string;
    status: string;
  } | null;
  message: string;
  success: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';


/**
 * Fetch currently logged in user using JWT Bearer token or session cookie
 */
export async function fetchCurrentUser(token?: string | null): Promise<ApiUser | null> {
  const url = `${API_BASE_URL}/api/auth/me`;
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    return (json.data?.user as ApiUser) || null;
  } catch (error) {
    console.warn(`[Web Auth] Failed to fetch current user from ${url}:`, error);
    return null;
  }
}

/**
 * Notify backend of user logout for server-side logging and session termination
 */
export async function logoutBackend(
  user?: ApiUser | null,
  token?: string | null
): Promise<boolean> {
  const url = `${API_BASE_URL}/api/auth/logout`;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        userId: user?.id ?? null,
        email: user?.email ?? null,
        user: user ?? null,
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn(`[Web Auth] Could not notify backend logout at ${url}:`, error);
    return false;
  }
}

/**
 * Get Google Auth configuration status from backend
 */
export async function getAuthStatus(): Promise<AuthStatusResponse | null> {
  const url = `${API_BASE_URL}/api/auth/status`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
