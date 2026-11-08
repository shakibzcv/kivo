export interface PageItem {
  id: string;
  userId?: string | null;
  parentId?: string | null;
  title: string;
  icon?: string | null;
  coverImage?: string | null;
  quote?: string | null;
  content?: string | null;
  children?: PageItem[];
  createdAt?: string;
  updatedAt?: string;
}

export function getApiBaseUrl(): string {
  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
  if (g?.process?.env?.NEXT_PUBLIC_API_URL) {
    return g.process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const custom = (window as any)?.__ENV__?.VITE_API_URL || (window as any)?.VITE_API_URL;
    if (custom) return custom;
  }
  return 'http://localhost:5000';
}

function getHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetch all pages from Cloud Database via API.
 * Returns empty array if none exist (No dummy data!).
 */
export async function fetchPagesFromApi(token?: string | null): Promise<PageItem[]> {
  const url = `${getApiBaseUrl()}/api/pages`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });
    if (!res.ok) {
      console.warn(`[Page API] fetchPages failed with status ${res.status}`);
      return [];
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error(`[Page API] Could not connect to API at ${url}:`, error);
    return [];
  }
}

/**
 * Fetch a single page by ID from Cloud Database via API.
 */
export async function fetchPageByIdFromApi(
  id: string,
  token?: string | null
): Promise<PageItem | null> {
  const url = `${getApiBaseUrl()}/api/pages/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.error(`[Page API] Could not fetch page ${id}:`, error);
    return null;
  }
}

/**
 * Create a new page in Cloud Database via API.
 */
export async function createPageInApi(
  page: Partial<PageItem>,
  token?: string | null
): Promise<PageItem | null> {
  const url = `${getApiBaseUrl()}/api/pages`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(page),
    });
    if (!res.ok) {
      console.warn(`[Page API] createPage failed with status ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.error(`[Page API] Could not create page at ${url}:`, error);
    return null;
  }
}

/**
 * Update a page in Cloud Database via API.
 */
export async function updatePageInApi(
  id: string,
  updates: Partial<PageItem>,
  token?: string | null
): Promise<PageItem | null> {
  const url = `${getApiBaseUrl()}/api/pages/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      console.warn(`[Page API] updatePage failed with status ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.error(`[Page API] Could not update page ${id}:`, error);
    return null;
  }
}

/**
 * Delete a page from Cloud Database via API.
 */
export async function deletePageFromApi(
  id: string,
  token?: string | null
): Promise<boolean> {
  const url = `${getApiBaseUrl()}/api/pages/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return res.ok;
  } catch (error) {
    console.error(`[Page API] Could not delete page ${id}:`, error);
    return false;
  }
}

// Tree helper functions
export function findPageById(pages: PageItem[], id: string): PageItem | null {
  for (const page of pages) {
    if (page.id === id) return page;
    if (page.children && page.children.length > 0) {
      const found = findPageById(page.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function updatePageInTree(
  pages: PageItem[],
  id: string,
  updates: Partial<PageItem>
): PageItem[] {
  return pages.map((page) => {
    if (page.id === id) {
      // `children` from API responses is not tree-aware; keep the local sub-tree.
      const { children: _ignored, ...rest } = updates;
      return { ...page, ...rest, updatedAt: new Date().toISOString() };
    }
    if (page.children && page.children.length > 0) {
      return {
        ...page,
        children: updatePageInTree(page.children, id, updates),
      };
    }
    return page;
  });
}

export function insertPageInTree(
  pages: PageItem[],
  newPage: PageItem,
  parentId?: string | null
): PageItem[] {
  if (!parentId) {
    return [...pages, newPage];
  }
  return pages.map((page) => {
    if (page.id === parentId) {
      return {
        ...page,
        children: [...(page.children || []), newPage],
      };
    }
    if (page.children && page.children.length > 0) {
      return {
        ...page,
        children: insertPageInTree(page.children, newPage, parentId),
      };
    }
    return page;
  });
}

export function deletePageFromTree(pages: PageItem[], id: string): PageItem[] {
  return pages
    .filter((page) => page.id !== id)
    .map((page) => {
      if (page.children && page.children.length > 0) {
        return {
          ...page,
          children: deletePageFromTree(page.children, id),
        };
      }
      return page;
    });
}
