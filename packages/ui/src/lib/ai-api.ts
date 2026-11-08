import { getApiBaseUrl } from './page-api';

export type AiActionType = 'created' | 'updated' | 'deleted' | 'found';

export interface AiAction {
  type: AiActionType;
  pageId: string;
  title: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageItem {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions?: AiAction[];
  createdAt: string;
}

export interface ChatDetails extends ChatSummary {
  messages: ChatMessageItem[];
}

export interface AiChatResponse {
  reply: string;
  actions: AiAction[];
  interactionId?: string;
  model: string;
  chat?: ChatSummary;
}

function getHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function requestJson<T>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: unknown,
  token?: string | null,
  signal?: AbortSignal
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: getHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if ((error as any)?.name === 'AbortError') throw error;
    throw new Error('Could not reach the AI service. Check your connection and try again.');
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON error body
  }

  if (!res.ok) {
    throw new Error(json?.message || `AI request failed (${res.status}).`);
  }
  return json?.data as T;
}

/**
 * Fetch all saved chats for the current user.
 */
export async function fetchAiChats(token?: string | null): Promise<ChatSummary[]> {
  try {
    return await requestJson<ChatSummary[]>('/api/ai/chats', 'GET', undefined, token);
  } catch (err) {
    console.warn('[AI] Failed to fetch chats:', err);
    return [];
  }
}

/**
 * Fetch a specific chat session with its full message history.
 */
export async function fetchAiChat(
  chatId: string,
  token?: string | null
): Promise<ChatDetails | null> {
  try {
    return await requestJson<ChatDetails>(`/api/ai/chats/${encodeURIComponent(chatId)}`, 'GET', undefined, token);
  } catch (err) {
    console.warn('[AI] Failed to fetch chat:', err);
    return null;
  }
}

/**
 * Explicitly create a new chat session.
 */
export async function createAiChat(
  title?: string,
  token?: string | null
): Promise<ChatSummary> {
  return requestJson<ChatSummary>('/api/ai/chats', 'POST', { title }, token);
}

/**
 * Delete a chat session.
 */
export async function deleteAiChat(
  chatId: string,
  token?: string | null
): Promise<boolean> {
  try {
    const res = await requestJson<{ success: boolean }>(
      `/api/ai/chats/${encodeURIComponent(chatId)}`,
      'DELETE',
      undefined,
      token
    );
    return res?.success ?? true;
  } catch (err) {
    console.warn('[AI] Failed to delete chat:', err);
    return false;
  }
}

/**
 * Sends a message to the Kivo AI agent, which can create, update and delete pages,
 * with database session persistence.
 */
export async function sendAiChat(params: {
  message: string;
  chatId?: string | null;
  currentPage?: { id: string; title?: string; content?: string } | null;
  previousInteractionId?: string | null;
  token?: string | null;
  signal?: AbortSignal;
}): Promise<AiChatResponse> {
  const { message, chatId, currentPage, previousInteractionId, token, signal } = params;
  return requestJson<AiChatResponse>(
    '/api/ai/chat',
    'POST',
    {
      message,
      chatId: chatId || undefined,
      currentPage: currentPage || undefined,
      previousInteractionId: previousInteractionId || undefined,
    },
    token,
    signal
  );
}

export interface StreamAiChatParams {
  message: string;
  chatId?: string | null;
  currentPage?: { id: string; title?: string; content?: string } | null;
  previousInteractionId?: string | null;
  token?: string | null;
  signal?: AbortSignal;
  onChunk?: (text: string) => void;
  onAction?: (action: AiAction) => void;
  onChat?: (chat: ChatSummary) => void;
}

/**
 * Streams response from the Kivo AI agent via SSE, smoothly yielding text chunks
 * and actionable items as they are generated.
 */
export async function streamAiChat(params: StreamAiChatParams): Promise<AiChatResponse> {
  const {
    message,
    chatId,
    currentPage,
    previousInteractionId,
    token,
    signal,
    onChunk,
    onAction,
    onChat,
  } = params;

  const url = `${getApiBaseUrl()}/api/ai/chat`;
  const headers = getHeaders(token);
  headers.Accept = 'text/event-stream';

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      chatId: chatId || undefined,
      currentPage: currentPage || undefined,
      previousInteractionId: previousInteractionId || undefined,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    let errMsg = `AI request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.message) errMsg = errJson.message;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    const json = await response.json();
    const data = json?.data as AiChatResponse;
    if (data?.chat) onChat?.(data.chat);
    if (data?.actions) {
      for (const a of data.actions) onAction?.(a);
    }
    if (data?.reply) onChunk?.(data.reply);
    return data;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullReply = '';
  const actions: AiAction[] = [];
  let chatData: ChatSummary | undefined;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const dataContent = trimmed.slice(5).trim();
        if (dataContent === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(dataContent);
          if (parsed.type === 'chat' && parsed.chat) {
            chatData = parsed.chat;
            onChat?.(parsed.chat);
          } else if (parsed.type === 'action' && parsed.action) {
            actions.push(parsed.action);
            onAction?.(parsed.action);
          } else if (parsed.type === 'chunk' && parsed.text) {
            fullReply += parsed.text;
            onChunk?.(parsed.text);
          } else if (parsed.text && !parsed.type) {
            fullReply += parsed.text;
            onChunk?.(parsed.text);
          } else if (parsed.type === 'done') {
            if (parsed.reply) fullReply = parsed.reply;
            if (parsed.chat) chatData = parsed.chat;
            if (Array.isArray(parsed.actions)) {
              for (const act of parsed.actions) {
                if (!actions.some((existing) => existing.pageId === act.pageId && existing.type === act.type)) {
                  actions.push(act);
                  onAction?.(act);
                }
              }
            }
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error || 'AI streaming error');
          }
        } catch (e: any) {
          if (e?.message && e.message.includes('AI streaming error')) throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    reply: fullReply,
    actions,
    chat: chatData,
    model: 'gemini',
  };
}

/**
 * Generates HTML for the inline "Edit with AI" prompt in the editor.
 */
export async function generateInlineContent(params: {
  prompt: string;
  pageTitle?: string;
  documentText?: string;
  token?: string | null;
  signal?: AbortSignal;
}): Promise<string> {
  const { prompt, pageTitle, documentText, token, signal } = params;
  const data = await requestJson<{ html: string }>(
    '/api/ai/inline',
    'POST',
    { prompt, pageTitle, documentText },
    token,
    signal
  );
  return data?.html ?? '';
}
