import axios, { AxiosError } from 'axios';
import { Platform, NativeModules } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  category: 'general' | 'code' | 'study';
  isPinned: boolean;
}

// ─── Host Resolution (reused from converter.ts) ───────────────────────────────

const getHostAddress = () => {
  if (Platform.OS === 'web') return 'localhost';
  const LOCAL_IP = '10.189.70.144';
  if (__DEV__) {
    try {
      const scriptURL = NativeModules.SourceCode.scriptURL;
      if (scriptURL && scriptURL.includes('://')) {
        const address = scriptURL.split('://')[1].split('/')[0].split(':')[0];
        if (address !== 'localhost' && address !== '127.0.0.1') return address;
      }
    } catch (e) { /* fallback */ }
    return LOCAL_IP;
  }
  return Platform.OS === 'android' ? '10.0.2.2' : LOCAL_IP;
};

const BASE_URL = `http://${getHostAddress()}:3001`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function inferCategory(text: string): ChatSession['category'] {
  const lower = text.toLowerCase();
  if (/\bcode\b|python|javascript|function|algorithm|debug|program/.test(lower)) return 'code';
  if (/\blearn\b|explain|study|what is|definition|meaning|history|science/.test(lower)) return 'study';
  return 'general';
}

function generateTitle(text: string): string {
  const words = text.trim().split(/\s+/);
  const title = words.slice(0, 6).join(' ');
  return title.length < text.trim().length ? title + '…' : title;
}

// ─── Chat Service ─────────────────────────────────────────────────────────────

export const chatService = {
  /**
   * Send a message to the AI (Gemini via backend /chat endpoint).
   * Falls back to /convert if /chat is not available.
   */
  async sendMessage(
    userText: string,
    history: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Try dedicated chat endpoint first
      const response = await axios.post<{ result: string; response?: string }>(
        `${BASE_URL}/chat`,
        {
          message: userText,
          history: history.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        { timeout: 35000, headers: { 'Content-Type': 'application/json' } }
      );
      return response.data.response ?? response.data.result;
    } catch (firstErr) {
      // Fallback: use /convert endpoint with a general prompt wrapper
      try {
        const response = await axios.post<{ result: string }>(
          `${BASE_URL}/convert`,
          {
            text: userText,
            mode: 'chat',
          },
          { timeout: 35000, headers: { 'Content-Type': 'application/json' } }
        );
        return response.data.result;
      } catch (error) {
        const axErr = error as AxiosError<{ error: string }>;
        if (axErr.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please check your connection.');
        }
        if (axErr.response?.data?.error) {
          throw new Error(axErr.response.data.error);
        }
        if (axErr.code === 'ECONNREFUSED' || axErr.code === 'ERR_NETWORK') {
          throw new Error('Cannot reach the server. Make sure the backend is running on port 3001.');
        }
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  /** Create a new chat session object (not yet saved). */
  createSession(firstMessage: string): ChatSession {
    const now = Date.now();
    return {
      id: generateId(),
      title: generateTitle(firstMessage),
      messages: [],
      createdAt: now,
      updatedAt: now,
      category: inferCategory(firstMessage),
      isPinned: false,
    };
  },

  /** Create a user ChatMessage. */
  createUserMessage(content: string): ChatMessage {
    return {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
  },

  /** Create an assistant ChatMessage. */
  createAssistantMessage(content: string): ChatMessage {
    return {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
  },
};
