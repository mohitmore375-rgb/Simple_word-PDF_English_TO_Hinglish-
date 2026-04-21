import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface TypingIndicatorProps {
  size?: number;
  color?: string;
}

export function TypingIndicator({ size = 8, color }: TypingIndicatorProps) {
  const { colors } = useTheme();
  const dotColor = color ?? colors.primary;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

    const a1 = makeBounce(dot1, 0);
    const a2 = makeBounce(dot2, 180);
    const a3 = makeBounce(dot3, 360);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: dotColor,
    opacity: 0.75,
    transform: [{ translateY: anim }],
  });

  return (
    <View style={styles.row}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={[dotStyle(dot2), styles.mid]} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mid: {
    marginHorizontal: 5,
  },
});
