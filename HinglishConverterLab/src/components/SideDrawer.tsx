import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface DrawerItem {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
}

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
  userName?: string;
}

export function SideDrawer({ visible, onClose, onNavigate, userName = 'Mohit' }: SideDrawerProps) {
  const { colors, isDark, toggleTheme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && (slideAnim as any).__getValue() <= -DRAWER_WIDTH + 1) {
    // Don't render when fully hidden — using opacity trick instead for animation
  }

  const navItems: DrawerItem[] = [
    { icon: '🏠', label: 'Home', onPress: () => { onNavigate?.('Home'); onClose(); } },
    { icon: '💬', label: 'New Chat', onPress: () => { onNavigate?.('NewChat'); onClose(); } },
    { icon: '⇄', label: 'Convert', onPress: () => { onNavigate?.('Convert'); onClose(); } },
    { icon: '🕐', label: 'History', onPress: () => { onNavigate?.('History'); onClose(); } },
    { icon: '⚗️', label: 'Labs', onPress: () => { onNavigate?.('Labs'); onClose(); } },
    { icon: '⚙️', label: 'Settings', onPress: () => { onNavigate?.('Settings'); onClose(); } },
  ];

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: fadeAnim }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={onClose}
        activeOpacity={1}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.scrim }]} />
      </TouchableOpacity>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.surfaceContainer,
            width: DRAWER_WIDTH,
            transform: [{ translateX: slideAnim }],
            shadowColor: '#000',
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: colors.divider }]}>
          <View style={[styles.drawerAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.drawerAvatarText}>{userName[0].toUpperCase()}</Text>
          </View>
          <View style={styles.drawerHeaderText}>
            <Text style={[styles.drawerName, { color: colors.onSurface }]}>{userName}</Text>
            <Text style={[styles.drawerApp, { color: colors.primary }]}>Simplae Word</Text>
          </View>
        </View>

        {/* Nav items */}
        <ScrollView style={styles.drawerNav} showsVerticalScrollIndicator={false}>
          {navItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.navItem, { borderRadius: 14 }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, { color: colors.onSurface }]}>{item.label}</Text>
              {item.badge && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.drawerFooter, { borderTopColor: colors.divider }]}>
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.7}>
            <Text style={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <Text style={[styles.themeLabel, { color: colors.onSurfaceVariant }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 14,
  },
  drawerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  drawerHeaderText: { flex: 1 },
  drawerName: { fontSize: 17, fontWeight: '700' },
  drawerApp: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  drawerNav: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  navIcon: { fontSize: 19 },
  navLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  drawerFooter: {
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  themeIcon: { fontSize: 20 },
  themeLabel: { fontSize: 14, fontWeight: '500' },
});
