import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../services/storageService';
import { ChatSession } from '../services/chatService';

interface RecentHistoryCardProps {
  session: ChatSession;
  onPress: () => void;
  onLongPress?: () => void;
}

const CATEGORY_CONFIG = {
  code: { icon: '</>', color: '#4D97F5', bg: '#E8F0FE' },
  study: { icon: '📖', color: '#43A047', bg: '#E8F5E9' },
  general: { icon: '✦', color: '#8B5CF6', bg: '#EDE9FE' },
};

const CATEGORY_CONFIG_DARK = {
  code: { icon: '</>', color: '#8AB4F8', bg: '#1E3A5F' },
  study: { icon: '📖', color: '#66BB6A', bg: '#1B3A1F' },
  general: { icon: '✦', color: '#C9BBF5', bg: '#2D1F5E' },
};

export function RecentHistoryCard({ session, onPress, onLongPress }: RecentHistoryCardProps) {
  const { colors, isDark } = useTheme();
  const cfg = (isDark ? CATEGORY_CONFIG_DARK : CATEGORY_CONFIG)[session.category];
  const timeAgo = storageService.formatTimestamp(session.updatedAt);

  // Last user message as preview
  const lastUserMsg = [...session.messages].reverse().find((m) => m.role === 'user');
  const preview = lastUserMsg?.content ?? session.title;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          shadowColor: isDark ? '#000' : colors.primary,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      {/* Left icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.iconText, { color: cfg.color, fontSize: session.category === 'code' ? 11 : 17 }]}>
          {cfg.icon}
        </Text>
      </View>

      {/* Text content */}
      <View style={styles.textContent}>
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceDim }]} numberOfLines={1}>
          {timeAgo}
        </Text>
      </View>

      {/* Pin indicator */}
      {session.isPinned && (
        <Text style={{ fontSize: 13, marginRight: 4 }}>📌</Text>
      )}

      {/* Chevron */}
      <Text style={[styles.chevron, { color: colors.onSurfaceDim }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontWeight: '700',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 12,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 2,
  },
});
