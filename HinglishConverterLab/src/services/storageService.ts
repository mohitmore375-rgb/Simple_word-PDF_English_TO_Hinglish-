import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatSession, ChatMessage } from './chatService';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const HISTORY_KEY = '@hinglish_history';
const CHAT_SESSIONS_KEY = '@chat_sessions';

// ─── Conversion History (unchanged API) ──────────────────────────────────────

export interface HistoryItem {
  id: string;
  originalText: string;
  convertedText: string;
  timestamp: number;
  wordCount: number;
  source: 'text' | 'document' | 'image';
  fileName?: string;
}

export const storageService = {
  // ── Conversion History ────────────────────────────────────────────────────

  async getHistory(): Promise<HistoryItem[]> {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as HistoryItem[];
    } catch {
      return [];
    }
  },

  async saveItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem> {
    const newItem: HistoryItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    try {
      const history = await storageService.getHistory();
      const updated = [newItem, ...history].slice(0, 100);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch { /* silently fail */ }
    return newItem;
  },

  async deleteItem(id: string): Promise<void> {
    try {
      const history = await storageService.getHistory();
      const updated = history.filter((h) => h.id !== id);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch { /* silently fail */ }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch { /* silently fail */ }
  },

  formatTimestamp(ts: number): string {
    const now = Date.now();
    const diff = now - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  },

  // ── Chat Sessions ─────────────────────────────────────────────────────────

  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const raw = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
      if (!raw) return [];
      const sessions = JSON.parse(raw) as ChatSession[];
      // Sort: pinned first, then by updatedAt desc
      return sessions.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
    } catch {
      return [];
    }
  },

  async saveChatSession(session: ChatSession): Promise<void> {
    try {
      const sessions = await storageService.getChatSessions();
      const idx = sessions.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        sessions[idx] = session;
      } else {
        sessions.unshift(session);
      }
      // Keep max 200 sessions
      const trimmed = sessions.slice(0, 200);
      await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(trimmed));
    } catch { /* silently fail */ }
  },

  async deleteChatSession(id: string): Promise<void> {
    try {
      const sessions = await storageService.getChatSessions();
      const updated = sessions.filter((s) => s.id !== id);
      await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(updated));
    } catch { /* silently fail */ }
  },

  async pinChatSession(id: string, pinned: boolean): Promise<void> {
    try {
      const sessions = await storageService.getChatSessions();
      const idx = sessions.findIndex((s) => s.id === id);
      if (idx >= 0) {
        sessions[idx].isPinned = pinned;
        await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
      }
    } catch { /* silently fail */ }
  },

  async clearAllChatSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CHAT_SESSIONS_KEY);
    } catch { /* silently fail */ }
  },
};
