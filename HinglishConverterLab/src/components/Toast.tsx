import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ visible, message, type = 'success', onHide }) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 80, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor =
    type === 'success' ? colors.surfaceContainerHighest :
    type === 'error' ? colors.errorContainer :
    colors.surfaceContainerHighest;
  
  const iconText = type === 'success' ? '●' : type === 'error' ? '✕' : '●';
  const iconColor = type === 'success' ? colors.primary : type === 'error' ? colors.error : colors.secondary;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: bgColor,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.icon, { color: iconColor }]}>{iconText}</Text>
      <Text style={[styles.message, { color: colors.onSurface }]}>{message.toUpperCase()}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 99,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 9998,
  },
  icon: {
    fontSize: 10,
  },
  message: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
