// MAX Bot API HTTP client
// Docs: https://dev.max.ru/docs-api
// Base URL: https://platform-api.max.ru
// Auth: Authorization: <token>  (NO "Bearer" prefix — MAX API specifics)

import type {
  BotInfo,
  Chat,
  ChatsResult,
  ChatMembersResult,
  MessagesResult,
  SendMessageParams,
  SendMessageResult,
  EditMessageParams,
  DeleteMessageParams,
  SimpleResult,
  GetMessagesParams,
  MaxApiError as MaxApiErrorResponse,
} from './types.js';

const BASE_URL = 'https://platform-api.max.ru';

export class MaxApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(`MAX API error [${code}]: ${message}`);
    this.name = 'MaxApiError';
  }
}

export class MaxClient {
  private readonly token: string;

  constructor(token: string) {
    if (!token || token.trim() === '') {
      throw new Error('MAX bot token is required');
    }
    this.token = token.trim();
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    params?: Record<string, string | number | boolean | string[]>,
    body?: unknown,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);

    // Append query params for GET/DELETE
    if (params && (method === 'GET' || method === 'DELETE')) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      }
    }

    const headers: Record<string, string> = {
      // MAX API uses token directly — NO "Bearer" prefix
      Authorization: this.token,
      'Content-Type': 'application/json',
      'User-Agent': 'mcp-max-messenger/0.1.0',
    };

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestInit.body = JSON.stringify(body);
    } else if (params && ['POST', 'PUT', 'PATCH'].includes(method) && !body) {
      requestInit.body = JSON.stringify(params);
    }

    const response = await fetch(url.toString(), requestInit);

    if (!response.ok) {
      let errorData: MaxApiErrorResponse | null = null;
      try {
        errorData = (await response.json()) as MaxApiErrorResponse;
      } catch {
        // ignore parse error
      }
      throw new MaxApiError(
        errorData?.code ?? String(response.status),
        errorData?.message ?? response.statusText,
      );
    }

    // Some DELETE endpoints return empty body
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: true } as unknown as T;
    }

    return JSON.parse(text) as T;
  }

  // ─── Bot ──────────────────────────────────────────────────────────────────

  async getMe(): Promise<BotInfo> {
    return this.request<BotInfo>('GET', '/me');
  }

  // ─── Chats ────────────────────────────────────────────────────────────────

  async getChats(count = 50, marker?: number): Promise<ChatsResult> {
    const params: Record<string, string | number> = { count };
    if (marker !== undefined) params.marker = marker;
    return this.request<ChatsResult>('GET', '/chats', params);
  }

  async getChat(chatId: number): Promise<Chat> {
    return this.request<Chat>('GET', `/chats/${chatId}`);
  }

  async getChatMembers(
    chatId: number,
    count = 50,
    marker?: number,
  ): Promise<ChatMembersResult> {
    const params: Record<string, string | number> = { count };
    if (marker !== undefined) params.marker = marker;
    return this.request<ChatMembersResult>(
      'GET',
      `/chats/${chatId}/members`,
      params,
    );
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessages(p: GetMessagesParams): Promise<MessagesResult> {
    const params: Record<string, string | number | boolean | string[]> = {
      chat_id: p.chat_id,
    };
    if (p.message_ids?.length) params.message_ids = p.message_ids;
    if (p.from !== undefined) params.from = p.from;
    if (p.to !== undefined) params.to = p.to;
    if (p.count !== undefined) params.count = p.count;
    return this.request<MessagesResult>('GET', '/messages', params);
  }

  async sendMessage(p: SendMessageParams): Promise<SendMessageResult> {
    const body: Record<string, unknown> = {
      text: p.text,
    };
    if (p.user_id !== undefined) body.user_id = p.user_id;
    if (p.chat_id !== undefined) body.chat_id = p.chat_id;
    if (p.format) body.format = p.format;
    if (p.notify !== undefined) body.notify = p.notify;
    if (p.attachments?.length) body.attachments = p.attachments;

    const queryParams: Record<string, string | number> = {};
    if (p.user_id !== undefined) queryParams.user_id = p.user_id;
    if (p.chat_id !== undefined) queryParams.chat_id = p.chat_id;

    const url = new URL(`${BASE_URL}/messages`);
    for (const [k, v] of Object.entries(queryParams)) {
      url.searchParams.set(k, String(v));
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: this.token,
        'Content-Type': 'application/json',
        'User-Agent': 'mcp-max-messenger/0.1.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData: MaxApiError | null = null;
      try {
        errorData = (await response.json()) as MaxApiError;
      } catch { /* ignore */ }
      throw new MaxApiError(
        (errorData as unknown as { code: string })?.code ?? String(response.status),
        (errorData as unknown as { message: string })?.message ?? response.statusText,
      );
    }

    return response.json() as Promise<SendMessageResult>;
  }

  async editMessage(p: EditMessageParams): Promise<SimpleResult> {
    // FIX: message_id must be a query param — PUT /messages?message_id=...
    const body: Record<string, unknown> = { text: p.text };
    if (p.format) body.format = p.format;
    if (p.attachments?.length) body.attachments = p.attachments;
    return this.request<SimpleResult>(
      'PUT',
      `/messages?message_id=${encodeURIComponent(p.message_id)}`,
      undefined,
      body,
    );
  }

  async deleteMessage(p: DeleteMessageParams): Promise<SimpleResult> {
    return this.request<SimpleResult>('DELETE', '/messages', {
      message_id: p.message_id,
    });
  }

  // ─── Pin ─────────────────────────────────────────────────────────────────

  async pinMessage(chatId: number, messageId: string, notify = false): Promise<SimpleResult> {
    return this.request<SimpleResult>(
      'PUT',
      `/chats/${chatId}/pin`,
      undefined,
      { message_id: messageId, notify },
    );
  }

  async unpinMessage(chatId: number): Promise<SimpleResult> {
    return this.request<SimpleResult>('DELETE', `/chats/${chatId}/pin`);
  }
}
