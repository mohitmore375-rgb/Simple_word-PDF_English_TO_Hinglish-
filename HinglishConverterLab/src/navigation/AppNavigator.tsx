import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LabsScreen from '../screens/LabsScreen';
import { HistoryItem } from '../services/storageService';

// — Types —
export type HomeStackParamList = {
  Home: undefined;
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
      <HomeStack.Screen name="Result" component={ResultScreen} />
    </HomeStack.Navigator>
  );
}

// Custom Tab Bar
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();

  const tabs = [
    { key: 'ConvertTab', label: 'CONVERT', icon: '⇄' },
    { key: 'HistoryTab', label: 'HISTORY', icon: '◷' },
    { key: 'LabsTab', label: 'LABS', icon: '⊞' },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.surfaceContainer, borderTopColor: colors.outlineVariant }]}>
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
            <Text style={[styles.tabIcon, { color: isFocused ? colors.primary : colors.tabInactive }]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.tabInactive }]}>
              {tab.label}
            </Text>
            {isFocused && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();

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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -12,
    width: 20,
    height: 2,
    borderRadius: 1,
  },
});
