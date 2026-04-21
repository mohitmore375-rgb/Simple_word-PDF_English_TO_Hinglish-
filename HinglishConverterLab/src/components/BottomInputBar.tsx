import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { TypingIndicator } from './TypingIndicator';

interface BottomInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onUpload?: () => void;
  onSettings?: () => void;
  onVoice?: () => void;
  isThinking?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function BottomInputBar({
  value,
  onChangeText,
  onSend,
  onUpload,
  onSettings,
  onVoice,
  isThinking = false,
  placeholder = 'Ask Simplae Word',
  disabled = false,
}: BottomInputBarProps) {
  const { colors, isDark } = useTheme();
  const sendScale = useRef(new Animated.Value(1)).current;
  const [focused, setFocused] = useState(false);

  const animateSend = (cb: () => void) => {
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(sendScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(cb);
  };

  const handleSend = () => {
    if (!value.trim() || isThinking || disabled) return;
    animateSend(onSend);
    Keyboard.dismiss();
  };

  const canSend = value.trim().length > 0 && !isThinking && !disabled;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.inputBackground,
          borderColor: focused ? colors.primary : colors.inputBorder,
          shadowColor: isDark ? '#000' : colors.primary,
        },
      ]}
    >
      {/* Left actions */}
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={onUpload}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.iconBtnText, { color: colors.onSurfaceVariant }]}>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={onSettings}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.iconBtnText, { color: colors.onSurfaceVariant }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Center input or Thinking state */}
      <View style={styles.inputWrap}>
        {isThinking ? (
          <View style={styles.thinkingRow}>
            <TypingIndicator size={6} color={colors.primary} />
            <Text style={[styles.thinkingText, { color: colors.primary }]}>Thinking…</Text>
          </View>
        ) : (
          <TextInput
            style={[styles.input, { color: colors.onSurface }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholderText}
            multiline
            maxLength={4000}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            editable={!disabled}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        )}
      </View>

      {/* Right actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={onVoice}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.iconBtnText, { color: colors.onSurfaceVariant }]}>🎤</Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: canSend ? colors.primary : colors.surfaceContainerHigh,
                shadowColor: colors.primary,
              },
            ]}
            onPress={handleSend}
            disabled={!canSend}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={[styles.sendIcon, { color: canSend ? colors.onPrimary : colors.onSurfaceDim }]}>
              ✦
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    gap: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 16,
    lineHeight: 20,
  },
  inputWrap: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
  },
  input: {
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 100,
    paddingVertical: 0,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendIcon: {
    fontSize: 17,
    fontWeight: '700',
  },
});
