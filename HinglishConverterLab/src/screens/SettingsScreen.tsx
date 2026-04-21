import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAIModel } from '../context/AIModelContext';
import { storageService } from '../services/storageService';
import { Toast } from '../components/Toast';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { aiMode, setAIMode, modelStatus } = useAIModel();
  const navigation = useNavigation<any>();

  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ visible: true, message: msg, type });

  const handleClearHistory = () => {
    Alert.alert(
      'Clear All History',
      'This will delete all conversations and conversion history. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearAll();
            await storageService.clearAllChatSessions();
            showToast('All history cleared', 'success');
          },
        },
      ]
    );
  };

  const modelStatusLabel: Record<string, string> = {
    not_downloaded: 'Not Downloaded',
    downloading: 'Downloading…',
    downloaded: 'Downloaded ✓',
    loading: 'Loading…',
    loaded: 'Ready ✓',
    error: 'Error',
  };

  const SettingRow = ({
    icon,
    label,
    sublabel,
    right,
    onPress,
    danger = false,
  }: {
    icon: string;
    label: string;
    sublabel?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? '#FF525218' : colors.surfaceContainerHigh }]}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: danger ? colors.error : colors.onSurface }]}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.settingSubLabel, { color: colors.onSurfaceDim }]}>{sublabel}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? (
        <Text style={[styles.chevron, { color: colors.onSurfaceDim }]}>›</Text>
      ) : null)}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.onSurfaceDim }]}>{title}</Text>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.backArrow, { color: colors.onSurface }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Settings</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceContainer }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileAvatarText}>M</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.onSurface }]}>Mohit</Text>
            <Text style={[styles.profileEmail, { color: colors.onSurfaceDim }]}>
              mohit@simplaeword.ai
            </Text>
            <View style={[styles.profileBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.profileBadgeText, { color: colors.primary }]}>✦ Pro</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <SectionHeader title="APPEARANCE" />
        <View style={[styles.section, { backgroundColor: colors.surfaceContainer }]}>
          <SettingRow
            icon="🌙"
            label="Dark Mode"
            sublabel={isDark ? 'Currently dark' : 'Currently light'}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.outline, true: colors.primary }}
                thumbColor={isDark ? colors.onPrimary : '#fff'}
              />
            }
          />
        </View>

        {/* AI Model */}
        <SectionHeader title="AI MODEL" />
        <View style={[styles.section, { backgroundColor: colors.surfaceContainer }]}>
          {/* Google / Online */}
          <TouchableOpacity
            style={[styles.modelOption, {
              borderColor: aiMode === 'online' ? colors.primary : colors.cardBorder,
              backgroundColor: aiMode === 'online' ? colors.primaryContainer : colors.surfaceContainerHigh,
            }]}
            onPress={() => {
              setAIMode('online');
              showToast('Switched to Google Gemini (Online)', 'success');
            }}
            activeOpacity={0.75}
          >
            <View style={styles.modelOptionLeft}>
              <Text style={{ fontSize: 22 }}>⚡</Text>
              <View>
                <Text style={[styles.modelName, { color: colors.onSurface }]}>Google Gemini</Text>
                <Text style={[styles.modelSub, { color: colors.onSurfaceDim }]}>Online · Fast · Accurate</Text>
              </View>
            </View>
            {aiMode === 'online' && (
              <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>

          {/* Local / Offline */}
          <TouchableOpacity
            style={[styles.modelOption, {
              borderColor: aiMode === 'offline' ? colors.primary : colors.cardBorder,
              backgroundColor: aiMode === 'offline' ? colors.primaryContainer : colors.surfaceContainerHigh,
              marginTop: 10,
            }]}
            onPress={() => {
              if (modelStatus === 'not_downloaded') {
                Alert.alert(
                  'Model Not Downloaded',
                  'Go to Labs → Offline Model to download Gemma 2B first.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Labs', onPress: () => navigation.getParent()?.navigate('LabsTab') },
                  ]
                );
                return;
              }
              setAIMode('offline');
              showToast('Switched to Gemma 2B (Offline)', 'success');
            }}
            activeOpacity={0.75}
          >
            <View style={styles.modelOptionLeft}>
              <Text style={{ fontSize: 22 }}>📱</Text>
              <View>
                <Text style={[styles.modelName, { color: colors.onSurface }]}>Gemma 2B (Local)</Text>
                <Text style={[styles.modelSub, { color: colors.onSurfaceDim }]}>
                  Offline · On-device · {modelStatusLabel[modelStatus] ?? modelStatus}
                </Text>
              </View>
            </View>
            {aiMode === 'offline' && (
              <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* General Settings */}
        <SectionHeader title="GENERAL" />
        <View style={[styles.section, { backgroundColor: colors.surfaceContainer }]}>
          <SettingRow
            icon="⚗️"
            label="Labs & Offline Model"
            sublabel="Download Gemma 2B for offline use"
            onPress={() => navigation.getParent()?.navigate('LabsTab')}
          />
          <SettingRow
            icon="🔔"
            label="Notifications"
            sublabel="Coming soon"
          />
          <SettingRow
            icon="🔒"
            label="Privacy"
            sublabel="Data stored locally on device"
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="DATA" />
        <View style={[styles.section, { backgroundColor: colors.surfaceContainer }]}>
          <SettingRow
            icon="🗑️"
            label="Clear All History"
            sublabel="Delete all chats and conversions"
            onPress={handleClearHistory}
            danger
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoName, { color: colors.primary }]}>✦ Simplae Word</Text>
          <Text style={[styles.appInfoVersion, { color: colors.onSurfaceDim }]}>Version 1.0.0 · Built with Expo</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 26, fontWeight: '300', lineHeight: 30 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  scroll: { flex: 1 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontWeight: '700' },
  profileEmail: { fontSize: 13 },
  profileBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10, marginTop: 4,
  },
  profileBadgeText: { fontSize: 11, fontWeight: '700' },
  sectionHeader: {
    fontSize: 11, letterSpacing: 1.5, fontWeight: '700',
    marginLeft: 20, marginTop: 20, marginBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingIconText: { fontSize: 17 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingSubLabel: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 22, fontWeight: '300' },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  modelOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modelName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  modelSub: { fontSize: 12 },
  selectedDot: { width: 10, height: 10, borderRadius: 5 },
  appInfo: { alignItems: 'center', paddingTop: 32, gap: 6 },
  appInfoName: { fontSize: 16, fontWeight: '700' },
  appInfoVersion: { fontSize: 12 },
});
