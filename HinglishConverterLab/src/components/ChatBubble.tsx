import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ChatMessage } from '../services/chatService';
import { TypingIndicator } from './TypingIndicator';

interface ChatBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export function ChatBubble({ message, isTyping = false }: ChatBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${ampm}`;
  };

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowRight]}>
        <View style={styles.bubbleContent}>
          <View
            style={[
              styles.bubble,
              styles.userBubble,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.bubbleText, { color: colors.onPrimary }]}>
              {message.content}
            </Text>
          </View>
          <Text style={[styles.timestamp, styles.tsRight, { color: colors.onSurfaceDim }]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        {/* User Avatar */}
        <View style={[styles.avatar, styles.userAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      </View>
    );
  }

  // AI Bubble
  return (
    <View style={[styles.row, styles.rowLeft]}>
      {/* AI Avatar */}
      <View style={[styles.avatar, styles.aiAvatar, { backgroundColor: colors.primaryContainer }]}>
        <Text style={{ fontSize: 14 }}>✦</Text>
      </View>
      <View style={styles.bubbleContent}>
        <View
          style={[
            styles.bubble,
            styles.aiBubble,
            {
              backgroundColor: colors.aiBubble,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {isTyping ? (
            <View style={styles.typingWrap}>
              <TypingIndicator size={7} color={colors.primary} />
            </View>
          ) : (
            <Text style={[styles.bubbleText, { color: colors.aiBubbleText }]}>
              {message.content}
            </Text>
          )}
        </View>
        {!isTyping && (
          <Text style={[styles.timestamp, styles.tsLeft, { color: colors.onSurfaceDim }]}>
            Simplae Word · {formatTime(message.timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    gap: 10,
  },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubbleContent: { maxWidth: '78%' },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  typingWrap: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 5,
    opacity: 0.7,
  },
  tsRight: { textAlign: 'right' },
  tsLeft: { textAlign: 'left' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatar: {},
  aiAvatar: {},
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
