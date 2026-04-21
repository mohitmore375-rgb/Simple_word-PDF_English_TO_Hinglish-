import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAIModel } from '../context/AIModelContext';
import { storageService } from '../services/storageService';
import { modelDownloadService } from '../services/modelDownloadService';
import { localModelService } from '../services/localModelService';
import { Toast } from '../components/Toast';

export default function LabsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    aiMode,
    setAIMode,
    modelStatus,
    setModelStatus,
    downloadProgress,
    setDownloadProgress,
    modelError,
    setModelError,
  } = useAIModel();

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'success' });

  const [modelSizeStr, setModelSizeStr] = useState('~1.5 GB');
  const [isNativeAvailable] = useState(() => localModelService.isNativeAvailable());

  // Animated progress bar width
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message: msg, type });
  };

  // Check model status on mount
  useEffect(() => {
    checkModelStatus();
  }, []);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: downloadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [downloadProgress]);

  const checkModelStatus = useCallback(async () => {
    const downloaded = await modelDownloadService.isModelDownloaded();
    if (downloaded) {
      const bytes = await modelDownloadService.getModelSize();
      setModelSizeStr(modelDownloadService.formatSize(bytes));
      if (localModelService.isModelLoaded()) {
        setModelStatus('loaded');
      } else {
        setModelStatus('downloaded');
      }
    } else {
      setModelStatus('not_downloaded');
    }
  }, []);

  // ── AI Mode Toggle ─────────────────────────────────────────────────────────
  const handleModeToggle = async (value: boolean) => {
    const newMode = value ? 'offline' : 'online';

    if (newMode === 'offline') {
      if (!isNativeAvailable) {
        Alert.alert(
          'Native Build Required',
          'Offline AI requires a native build (Expo Dev Client or EAS Build). It cannot run in Expo Go.\n\nRun: npx expo run:android',
          [{ text: 'OK' }]
        );
        return;
      }
      const downloaded = await modelDownloadService.isModelDownloaded();
      if (!downloaded) {
        Alert.alert(
          'Model Not Downloaded',
          'Download the Gemma 2B model first (≈1.5 GB) before switching to offline mode.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Release model from memory when switching to online
    if (newMode === 'online' && localModelService.isModelLoaded()) {
      await localModelService.releaseModel();
      setModelStatus('downloaded');
    }

    setAIMode(newMode);
    showToast(
      newMode === 'offline'
        ? '📱 Switched to Offline AI (Gemma 2B)'
        : '☁️ Switched to Online AI (Gemini)',
      'success'
    );
  };

  // ── Download Model ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!isNativeAvailable) {
      Alert.alert(
        'Native Build Required',
        'Please build the app with Expo Dev Client:\n\nnpx expo run:android',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Download Gemma 2B',
      '⚠️ This will download ~1.5 GB of data.\n\nMake sure you are on Wi-Fi and have at least 2 GB of free storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: startDownload,
        },
      ]
    );
  };

  const startDownload = async () => {
    setModelStatus('downloading');
    setDownloadProgress(0);
    setModelError(null);

    try {
      await modelDownloadService.downloadModel((pct) => {
        setDownloadProgress(pct);
      });
      const bytes = await modelDownloadService.getModelSize();
      setModelSizeStr(modelDownloadService.formatSize(bytes));
      setModelStatus('downloaded');
      showToast('✅ Gemma 2B downloaded successfully!', 'success');
    } catch (err: any) {
      setModelStatus('error');
      setModelError(err.message);
      showToast(err.message || 'Download failed', 'error');
    }
  };

  // ── Cancel Download ────────────────────────────────────────────────────────
  const handleCancelDownload = async () => {
    await modelDownloadService.cancelDownload();
    setModelStatus('not_downloaded');
    setDownloadProgress(0);
    showToast('Download cancelled', 'info');
  };

  // ── Delete Model ───────────────────────────────────────────────────────────
  const handleDeleteModel = () => {
    Alert.alert(
      'Delete Model',
      `This will remove the Gemma 2B model (${modelSizeStr}) from your device. You can re-download it anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Switch back to online if currently using offline
            if (aiMode === 'offline') {
              setAIMode('online');
            }
            if (localModelService.isModelLoaded()) {
              await localModelService.releaseModel();
            }
            await modelDownloadService.deleteModel();
            setModelStatus('not_downloaded');
            setModelSizeStr('~1.5 GB');
            setDownloadProgress(0);
            showToast('Model deleted from device', 'success');
          },
        },
      ]
    );
  };

  // ── Load Model into Memory ─────────────────────────────────────────────────
  const handleLoadModel = async () => {
    if (modelStatus !== 'downloaded') return;
    setModelStatus('loading');
    try {
      await localModelService.loadModel();
      setModelStatus('loaded');
      showToast('🧠 Model loaded into memory', 'success');
    } catch (err: any) {
      setModelStatus('downloaded');
      showToast(err.message || 'Failed to load model', 'error');
    }
  };

  // ── Clear History ──────────────────────────────────────────────────────────
  const handleClearCache = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all conversion history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearAll();
            showToast('Cache cleared successfully', 'success');
          },
        },
      ]
    );
  };

  // ── Helper Components ──────────────────────────────────────────────────────
  const SettingRow = ({
    label,
    sub,
    right,
    onPress,
    isLast = false,
  }: {
    label: string;
    sub?: string;
    right: React.ReactNode;
    onPress?: () => void;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { backgroundColor: colors.surfaceContainerHigh },
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '50' },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.onSurface }]}>{label}</Text>
        {sub && (
          <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>{sub}</Text>
        )}
      </View>
      {right}
    </TouchableOpacity>
  );

  // ── Model Status Badge ─────────────────────────────────────────────────────
  const getStatusBadge = () => {
    const configs: Record<string, { label: string; bg: string; fg: string }> = {
      not_downloaded: { label: 'NOT DOWNLOADED', bg: colors.surfaceContainerHighest, fg: colors.onSurfaceVariant },
      downloading: { label: `DOWNLOADING ${downloadProgress}%`, bg: '#FF6B0022', fg: '#FF6B00' },
      downloaded: { label: 'READY', bg: colors.successContainer ?? '#00C80022', fg: colors.success ?? '#00C800' },
      loading: { label: 'LOADING...', bg: colors.primary + '22', fg: colors.primary },
      loaded: { label: 'IN MEMORY ✓', bg: colors.primary + '22', fg: colors.primary },
      error: { label: 'ERROR', bg: '#FF000022', fg: '#FF4444' },
    };
    const cfg = configs[modelStatus] ?? configs.not_downloaded;
    return (
      <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.chipText, { color: cfg.fg }]}>{cfg.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surfaceContainer }]}>
        <View>
          <Text style={[styles.headerLabel, { color: colors.onSurfaceDim }]}>⊞ LABS</Text>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Settings & Info</Text>
        </View>
        {/* Active mode pill */}
        <View
          style={[
            styles.modePill,
            {
              backgroundColor:
                aiMode === 'offline' ? colors.primary + '22' : colors.successContainer ?? '#00800018',
            },
          ]}
        >
          <Text
            style={[
              styles.modePillText,
              { color: aiMode === 'offline' ? colors.primary : colors.success ?? '#00AA00' },
            ]}
          >
            {aiMode === 'offline' ? '📱 OFFLINE' : '☁️ ONLINE'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── APPEARANCE ───────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceDim }]}>APPEARANCE</Text>
        <View style={styles.sectionGroup}>
          <SettingRow
            label="Dark Mode"
            sub="Industrial Precision Lab theme"
            isLast
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.outline, true: colors.primary + '88' }}
                thumbColor={isDark ? colors.primary : colors.onSurfaceDim}
              />
            }
          />
        </View>

        {/* ── AI ENGINE ────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceDim }]}>AI ENGINE</Text>
        <View style={styles.sectionGroup}>

          {/* AI Mode Toggle */}
          <SettingRow
            label="AI Mode"
            sub={
              aiMode === 'offline'
                ? 'Offline · Gemma 2B · On-device'
                : 'Online · Gemini 2.5 Flash · Cloud'
            }
            right={
              <Switch
                value={aiMode === 'offline'}
                onValueChange={handleModeToggle}
                trackColor={{ false: colors.outline, true: colors.primary + '88' }}
                thumbColor={aiMode === 'offline' ? colors.primary : colors.onSurfaceDim}
              />
            }
          />

          {/* Active Model Info */}
          <SettingRow
            label="Active Model"
            sub={
              aiMode === 'offline'
                ? 'Gemma 2B IT Q4_K_M (GGUF)'
                : 'Gemini 2.5 Flash (V2-Neural)'
            }
            right={
              <View style={[styles.chip, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.chipText, { color: colors.primary }]}>ACTIVE</Text>
              </View>
            }
          />

          {/* Backend Info */}
          <SettingRow
            label="Backend"
            sub={aiMode === 'offline' ? 'On-device · No internet needed' : 'Secured Node.js Express API'}
            right={
              <View style={[styles.chip, { backgroundColor: colors.successContainer ?? '#00800018' }]}>
                <Text style={[styles.chipText, { color: colors.success ?? '#00AA00' }]}>
                  {aiMode === 'offline' ? 'LOCAL' : 'SECURE'}
                </Text>
              </View>
            }
          />

          {/* OCR Engine */}
          <SettingRow
            label="OCR Engine"
            sub="OCR.space API (Multi-language)"
            isLast
            right={
              <View style={[styles.chip, { backgroundColor: colors.surfaceContainerHighest }]}>
                <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>V2</Text>
              </View>
            }
          />
        </View>

        {/* ── OFFLINE MODEL MANAGER ─────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceDim }]}>
          OFFLINE MODEL
        </Text>
        <View style={[styles.modelCard, { backgroundColor: colors.surfaceContainerHigh }]}>

          {/* Top: Name + Status */}
          <View style={styles.modelCardHeader}>
            <View style={styles.modelIconWrap}>
              <Text style={styles.modelIcon}>🧠</Text>
            </View>
            <View style={styles.modelInfo}>
              <Text style={[styles.modelName, { color: colors.onSurface }]}>
                Gemma 2B Instruct
              </Text>
              <Text style={[styles.modelMeta, { color: colors.onSurfaceVariant }]}>
                Q4_K_M · GGUF · {modelSizeStr}
              </Text>
            </View>
            {getStatusBadge()}
          </View>

          {/* Progress bar (shown while downloading) */}
          {modelStatus === 'downloading' && (
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerHighest }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          )}

          {/* Error message */}
          {modelStatus === 'error' && modelError && (
            <Text style={[styles.errorText, { color: '#FF4444' }]}>{modelError}</Text>
          )}

          {/* Info note */}
          <Text style={[styles.modelNote, { color: colors.onSurfaceDim }]}>
            ℹ️ Offline quality is lower than cloud AI. Best for short texts. Requires native build.
          </Text>

          {/* Action Buttons */}
          <View style={styles.modelActions}>
            {/* Download / Cancel */}
            {(modelStatus === 'not_downloaded' || modelStatus === 'error') && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={handleDownload}
              >
                <Text style={styles.actionBtnText}>⬇ DOWNLOAD MODEL</Text>
              </TouchableOpacity>
            )}

            {modelStatus === 'downloading' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FF4444' }]}
                onPress={handleCancelDownload}
              >
                <Text style={styles.actionBtnText}>✕ CANCEL ({downloadProgress}%)</Text>
              </TouchableOpacity>
            )}

            {/* Load into memory */}
            {modelStatus === 'downloaded' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={handleLoadModel}
              >
                <Text style={styles.actionBtnText}>▶ LOAD MODEL</Text>
              </TouchableOpacity>
            )}

            {/* Already loaded */}
            {modelStatus === 'loading' && (
              <View style={[styles.actionBtn, { backgroundColor: colors.primary + '66' }]}>
                <Text style={styles.actionBtnText}>⏳ LOADING...</Text>
              </View>
            )}

            {/* Delete (show when downloaded or loaded) */}
            {(modelStatus === 'downloaded' || modelStatus === 'loaded') && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn, { borderColor: '#FF4444' }]}
                onPress={handleDeleteModel}
              >
                <Text style={[styles.actionBtnText, { color: '#FF4444' }]}>🗑 DELETE</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── DATA ─────────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceDim }]}>DATA</Text>
        <View style={styles.sectionGroup}>
          <SettingRow
            label="Storage"
            sub="Local AsyncStorage (device only)"
            right={
              <Text style={[styles.valueText, { color: colors.onSurfaceVariant }]}>LOCAL</Text>
            }
          />
          <SettingRow
            label="Clear History"
            sub="Delete all saved conversions"
            onPress={handleClearCache}
            isLast
            right={
              <Text style={[styles.valueText, { color: colors.error }]}>CLEAR →</Text>
            }
          />
        </View>

        {/* ── ABOUT ────────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceDim }]}>ABOUT</Text>
        <View style={styles.sectionGroup}>
          <SettingRow
            label="App Name"
            sub="Hinglish Converter Lab"
            right={
              <View style={[styles.chip, { backgroundColor: colors.surfaceContainerHighest }]}>
                <Text style={[styles.chipText, { color: colors.primary }]}>LAB</Text>
              </View>
            }
          />
          <SettingRow
            label="Version"
            sub="Production Build"
            right={
              <Text style={[styles.valueText, { color: colors.onSurfaceVariant }]}>1.0.0</Text>
            }
          />
          <SettingRow
            label="SDK"
            sub="Expo SDK 54 · TypeScript"
            isLast
            right={
              <Text style={[styles.valueText, { color: colors.onSurfaceVariant }]}>SDK 54</Text>
            }
          />
        </View>

        {/* Footer */}
        <View style={[styles.footerBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Text style={[styles.footerText, { color: colors.onSurfaceDim }]}>
            PRECISION LAB · HINGLISH V2-NEURAL · {new Date().getFullYear()}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: { fontSize: 10, letterSpacing: 2.5, fontWeight: '700', marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
    paddingLeft: 4,
  },
  sectionGroup: { marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1, marginBottom: 2 },
  settingSub: { fontSize: 12, lineHeight: 16 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  valueText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  // ── Model Card ──────────────────────────────────────────────────────────────
  modelCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 14,
  },
  modelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelIcon: { fontSize: 24 },
  modelInfo: { flex: 1 },
  modelName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  modelMeta: { fontSize: 12, lineHeight: 16 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  modelNote: {
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  modelActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footerBadge: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: { fontSize: 10, letterSpacing: 2, fontWeight: '600' },
});
