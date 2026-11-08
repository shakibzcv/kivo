import { getApiBaseUrl } from './page-api';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'];

export interface MediaResult {
  id: string;
  thumbUrl: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
  authorName?: string;
  authorUrl?: string;
  downloadLocation?: string;
}

function headers(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.json();
    return json?.message || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Upload flow:
 *  1. ask the API for a pre-signed PUT URL
 *  2. PUT the file straight to object storage
 *  3. tell the API it's done so it records the image in the database
 * Returns a stable URL that is safe to embed in page content.
 */
export async function uploadImage(file: File, token?: string | null): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Unsupported image type. Use PNG, JPEG, GIF, WebP or AVIF.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image is too large. Maximum size is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
  }

  const base = getApiBaseUrl();

  const targetRes = await fetch(`${base}/api/images/upload-url`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
  });
  if (!targetRes.ok) throw new Error(await readError(targetRes, 'Could not start the upload.'));
  const target = (await targetRes.json()).data as {
    uploadUrl: string;
    key: string;
    headers: Record<string, string>;
  };

  const putRes = await fetch(target.uploadUrl, {
    method: 'PUT',
    headers: target.headers,
    body: file,
  });
  if (!putRes.ok) throw new Error('Upload to storage failed. Please try again.');

  const saveRes = await fetch(`${base}/api/images`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ key: target.key, fileName: file.name, contentType: file.type }),
  });
  if (!saveRes.ok) throw new Error(await readError(saveRes, 'Could not save the image.'));
  const saved = (await saveRes.json()).data as { path: string };

  return `${base}${saved.path}`;
}

async function searchMedia(
  provider: 'unsplash' | 'giphy',
  q: string,
  signal?: AbortSignal
): Promise<MediaResult[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/media/${provider}?q=${encodeURIComponent(q)}`, {
    headers: headers(),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res, 'Search failed.'));
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export const searchUnsplash = (q: string, signal?: AbortSignal) => searchMedia('unsplash', q, signal);
export const searchGiphy = (q: string, signal?: AbortSignal) => searchMedia('giphy', q, signal);

export function trackUnsplashDownload(downloadLocation?: string) {
  if (!downloadLocation) return;
  fetch(`${getApiBaseUrl()}/api/media/unsplash/track`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ downloadLocation }),
  }).catch(() => {});
}
