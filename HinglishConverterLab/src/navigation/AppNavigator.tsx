import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LabsScreen from '../screens/LabsScreen';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type HomeStackParamList = {
  Home: undefined;
  Chat: {
    sessionId: string;
    initialMessage?: string;
  };
  Settings: undefined;
  Result: {
    originalText: string;
    convertedText: string;
    source: 'text' | 'document' | 'image';
    fileName?: string;
  };
};

export type RootTabParamList = {
  ConvertTab: undefined;
  HistoryTab: undefined;
  LabsTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
      <HomeStack.Screen name="Result" component={ResultScreen} />
    </HomeStack.Navigator>
  );
}

// ─── Gemini-Style Custom Tab Bar ──────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useTheme();

  const tabs = [
    { key: 'ConvertTab', label: 'Home', icon: '✦', activeIcon: '✦' },
    { key: 'HistoryTab', label: 'History', icon: '🕐', activeIcon: '🕐' },
    { key: 'LabsTab', label: 'Labs', icon: '⚗️', activeIcon: '⚗️' },
  ];

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.tabBarBg,
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          shadowColor: isDark ? '#000' : colors.primary,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs[index];

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            {/* Active pill background */}
            {isFocused && (
              <View style={[styles.activePill, { backgroundColor: colors.primaryContainer }]} />
            )}

            <Text
              style={[
                styles.tabIcon,
                { color: isFocused ? colors.tabActive : colors.tabInactive },
              ]}
            >
              {isFocused ? tab.activeIcon : tab.icon}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? colors.tabActive : colors.tabInactive,
                  fontWeight: isFocused ? '700' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Root Navigator ────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="ConvertTab" component={HomeStackNavigator} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
      <Tab.Screen name="LabsTab" component={LabsScreen} />
    </Tab.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
    gap: 3,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 34,
    borderRadius: 17,
  },
  tabIcon: {
    fontSize: 20,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
    zIndex: 1,
  },
});
