import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@hinglish_theme_dark';

export const themeService = {
  async saveTheme(isDark: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_KEY, JSON.stringify(isDark));
    } catch {
      // silently fail
    }
  },

  async loadTheme(): Promise<boolean | null> {
    try {
      const val = await AsyncStorage.getItem(THEME_KEY);
      if (val === null) return null;
      return JSON.parse(val) as boolean;
    } catch {
      return null;
    }
  },
};
