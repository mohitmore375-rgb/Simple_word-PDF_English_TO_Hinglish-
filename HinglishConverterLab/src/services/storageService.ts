import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@hinglish_history';

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
      // Prepend, keep max 100 items
      const updated = [newItem, ...history].slice(0, 100);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // silently fail
    }
    return newItem;
  },

  async deleteItem(id: string): Promise<void> {
    try {
      const history = await storageService.getHistory();
      const updated = history.filter((h) => h.id !== id);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // silently fail
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {
      // silently fail
    }
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
};
