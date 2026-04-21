import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Processing...',
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity, backgroundColor: colors.scrim }]}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.surfaceContainerHigh, transform: [{ scale }] },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.message, { color: colors.onSurface }]}>{message}</Text>
        <Text style={[styles.sub, { color: colors.onSurfaceVariant }]}>ENGINE: V2-NEURAL</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 180,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  sub: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
