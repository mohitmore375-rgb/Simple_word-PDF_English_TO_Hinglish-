import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useAIModel } from '../context/AIModelContext';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Toast } from '../components/Toast';
import { ConversionCard } from '../components/ConversionCard';
import { converterService } from '../services/converter';
import { ocrService } from '../services/ocrService';
import { storageService, HistoryItem } from '../services/storageService';
import { modelDownloadService } from '../services/modelDownloadService';
import { HomeStackParamList } from '../navigation/AppNavigator';

type HomeNavProp = StackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { aiMode, modelStatus } = useAIModel();
  const navigation = useNavigation<HomeNavProp>();

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Converting...');
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'success' });
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [pickedFile, setPickedFile] = useState<{ name: string; type: string } | null>(null);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  // Button press animation
  const btnScale = useRef(new Animated.Value(1)).current;

  // Mode badge pulse animation
  const badgePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadRecent();
  }, []);

  // Pulse badge when mode changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(badgePulse, { toValue: 1.12, duration: 150, useNativeDriver: true }),
      Animated.timing(badgePulse, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [aiMode]);

  const loadRecent = async () => {
    const history = await storageService.getHistory();
    setRecentHistory(history.slice(0, 5));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const animateBtn = (cb: () => void) => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(cb);
  };

  const handleConvert = useCallback(() => {
    if (!inputText.trim()) {
      showToast('Please enter some text to convert', 'error');
      return;
    }

    // Guard: offline mode but model not ready
    if (aiMode === 'offline') {
      if (modelStatus === 'not_downloaded' || modelStatus === 'error') {
        Alert.alert(
          '📱 Model Not Downloaded',
          'Please download the Gemma 2B model from the Labs tab before using offline mode.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (modelStatus === 'downloading') {
        showToast('Model is still downloading. Please wait.', 'info');
        return;
      }
    }

    animateBtn(async () => {
      setIsLoading(true);
      setLoadingMsg(
        aiMode === 'offline'
          ? '🧠 Running Gemma 2B on-device...'
          : '☁️ Calling V2-Neural Engine...'
      );

      try {
        const { result } = await converterService.convert(inputText.trim(), aiMode);

        await storageService.saveItem({
          originalText: inputText.trim(),
          convertedText: result,
          wordCount,
          source: 'text',
        });

        navigation.navigate('Result', {
          originalText: inputText.trim(),
          convertedText: result,
          source: 'text',
        });

        setInputText('');
        setPickedFile(null);
        await loadRecent();
      } catch (err: any) {
        const msg: string = err.message || 'Conversion failed. Retry.';

        // Offer fallback to online if offline fails
        if (aiMode === 'offline' && msg.includes('offline')) {
          Alert.alert(
            'Offline AI Error',
            `${msg}\n\nWould you like to use Online AI instead?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Use Online AI',
                onPress: async () => {
                  setIsLoading(true);
                  setLoadingMsg('☁️ Falling back to Online AI...');
                  try {
                    const { result } = await converterService.convert(inputText.trim(), 'online');
                    await storageService.saveItem({
                      originalText: inputText.trim(),
                      convertedText: result,
                      wordCount,
                      source: 'text',
                    });
                    navigation.navigate('Result', {
                      originalText: inputText.trim(),
                      convertedText: result,
                      source: 'text',
                    });
                    setInputText('');
                    setPickedFile(null);
                    await loadRecent();
                  } catch (e2: any) {
                    showToast(e2.message || 'Conversion failed.', 'error');
                  } finally {
                    setIsLoading(false);
                  }
                },
              },
            ]
          );
        } else {
          showToast(msg, 'error');
        }
      } finally {
        setIsLoading(false);
      }
    });
  }, [inputText, aiMode, modelStatus]);

  const handleDocumentPick = async () => {
    setIsLoading(true);
    setLoadingMsg('Extracting text from document...');
    try {
      const { text, fileName, fileType } = await ocrService.pickDocument();
      setInputText(text);
      setPickedFile({ name: fileName, type: fileType });
      showToast(`${fileType} loaded — ${text.trim().split(/\s+/).length} words`, 'success');
    } catch (err: any) {
      if (err.message !== 'CANCELLED') {
        showToast(err.message || 'Failed to extract text from file', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearInput = () => {
    setInputText('');
    setPickedFile(null);
  };

  // ── Mode Badge Config ────────────────────────────────────────────────────────
  const modeBadge = {
    online: { icon: '⚡', label: 'ONLINE · GEMINI', color: colors.success ?? '#00AA00', bg: (colors.successContainer ?? '#00800018') },
    offline: { icon: '📱', label: 'OFFLINE · GEMMA 2B', color: colors.primary, bg: colors.primary + '18' },
  }[aiMode];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surfaceContainer }]}>
        <View>
          <Text style={[styles.headerLabel, { color: colors.primary }]}>← PRECISION LAB</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <Text style={{ fontSize: 22 }}>{isDark ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {/* Hero title */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
            Hinglish{'\n'}Converter
          </Text>
          <Text style={[styles.heroSub, { color: colors.onSurfaceVariant }]}>
            CONVERT ENGLISH TO HINGLISH INSTANTLY
          </Text>

          {/* AI Mode Badge */}
          <Animated.View style={{ transform: [{ scale: badgePulse }], alignSelf: 'flex-start', marginTop: 12 }}>
            <View style={[styles.aiModeBadge, { backgroundColor: modeBadge.bg }]}>
              <Text style={[styles.aiModeBadgeText, { color: modeBadge.color }]}>
                {modeBadge.icon} {modeBadge.label}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Document picker card */}
        <TouchableOpacity
          style={[styles.docCard, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={handleDocumentPick}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <View style={[styles.docIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.docIconText}>⊞</Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={[styles.docTitle, { color: colors.onSurface }]}>
              {pickedFile ? pickedFile.name : 'Import Document'}
            </Text>
            <Text style={[styles.docSub, { color: colors.onSurfaceVariant }]}>
              {pickedFile ? `Type: ${pickedFile.type}` : 'PDF, DOCX, or Image (OCR)'}
            </Text>
          </View>
          <View style={[styles.selectBtn, { borderColor: colors.primary }]}>
            <Text style={[styles.selectBtnText, { color: colors.primary }]}>
              {pickedFile ? 'CHANGE' : 'SELECT FILE'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Text input */}
        <View style={[styles.inputCard, { backgroundColor: colors.surfaceContainerLowest }]}>
          <TextInput
            style={[styles.input, { color: colors.onSurface }]}
            placeholder="Paste your English text here..."
            placeholderTextColor={colors.onSurfaceDim}
            multiline
            value={inputText}
            onChangeText={setInputText}
            textAlignVertical="top"
            editable={!isLoading}
            maxLength={10000}
          />
          {inputText.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearInput}>
              <Text style={[styles.clearBtnText, { color: colors.onSurfaceDim }]}>✕ CLEAR</Text>
            </TouchableOpacity>
          )}

          {/* ENG → HIN chip row */}
          <View style={styles.inputMeta}>
            <View style={styles.langRow}>
              <View style={[styles.langChip, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={[styles.langChipText, { color: colors.onSurfaceVariant }]}>ENG</Text>
              </View>
              <Text style={[styles.arrow, { color: colors.onSurfaceDim }]}>→</Text>
              <View style={[styles.langChip, { backgroundColor: colors.primary }]}>
                <Text style={[styles.langChipText, { color: '#fff' }]}>HIN</Text>
              </View>
            </View>
            <Text style={[styles.wordCount, { color: colors.onSurfaceVariant }]}>
              WORDS: {wordCount}
            </Text>
          </View>
        </View>

        {/* Convert button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[
              styles.convertBtn,
              {
                backgroundColor: aiMode === 'offline' ? colors.primary : colors.primary,
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            onPress={handleConvert}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <Text style={styles.convertBtnText}>
              {aiMode === 'offline' ? 'CONVERT OFFLINE 📱' : 'CONVERT TO HINGLISH ⚡'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Offline model not ready warning */}
        {aiMode === 'offline' &&
          (modelStatus === 'not_downloaded' || modelStatus === 'error') && (
            <View
              style={[styles.warningBanner, { backgroundColor: '#FF6B0018', borderColor: '#FF6B0044' }]}
            >
              <Text style={[styles.warningText, { color: '#FF6B00' }]}>
                ⚠️ Offline model not downloaded. Go to{' '}
                <Text style={{ fontWeight: '800' }}>Labs → Offline Model</Text> to download.
              </Text>
            </View>
          )}

        {/* Recent Conversions */}
        {recentHistory.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={[styles.recentTitle, { color: colors.onSurfaceVariant }]}>
                RECENT CONVERSIONS
              </Text>
              <Text style={[styles.filterIcon, { color: colors.onSurfaceDim }]}>⊟</Text>
            </View>
            {recentHistory.map((item) => (
              <ConversionCard
                key={item.id}
                item={item}
                compact
                onPress={() =>
                  navigation.navigate('Result', {
                    originalText: item.originalText,
                    convertedText: item.convertedText,
                    source: item.source,
                    fileName: item.fileName,
                  })
                }
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <LoadingOverlay visible={isLoading} message={loadingMsg} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  themeBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  hero: { marginBottom: 24, paddingLeft: 4 },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 44,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  aiModeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  aiModeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  docCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconText: { fontSize: 20, color: '#fff' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  docSub: { fontSize: 12, letterSpacing: 0.2 },
  selectBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selectBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  inputCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    minHeight: 180,
  },
  input: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 130,
    textAlignVertical: 'top',
  },
  clearBtn: { alignSelf: 'flex-end', paddingVertical: 4, marginTop: 4 },
  clearBtnText: { fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
  inputMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  langChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  arrow: { fontSize: 14, fontWeight: '700' },
  wordCount: { fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
  convertBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  convertBtnText: { color: '#fff', fontSize: 14, letterSpacing: 2, fontWeight: '800' },
  warningBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  warningText: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  recentSection: { marginBottom: 16 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  recentTitle: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  filterIcon: { fontSize: 18 },
});
