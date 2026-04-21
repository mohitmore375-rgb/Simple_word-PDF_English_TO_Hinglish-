import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { Toast } from '../components/Toast';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { pdfService } from '../services/pdfService';
import { storageService } from '../services/storageService';
import { HomeStackParamList } from '../navigation/AppNavigator';

type ResultRouteProp = RouteProp<HomeStackParamList, 'Result'>;

export default function ResultScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ResultRouteProp>();
  const { originalText, convertedText, source, fileName } = route.params;

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'success',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(convertedText);
      showToast('Copied to Clipboard', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hinglish Conversion (Precision Lab)\n\n📝 Original:\n${originalText}\n\n🔁 Hinglish:\n${convertedText}`,
        title: 'Hinglish Conversion',
      });
    } catch {
      showToast('Share failed', 'error');
    }
  };

  const handlePDF = async () => {
    setIsLoading(true);
    try {
      await pdfService.generateAndShare({ originalText, convertedText });
      showToast('PDF exported successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'PDF export failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (saved) {
      showToast('Already saved', 'info');
      return;
    }
    await storageService.saveItem({
      originalText,
      convertedText,
      wordCount: originalText.trim().split(/\s+/).length,
      source,
      fileName,
    });
    setSaved(true);
    showToast('Saved to Lab ✓', 'success');
  };

  const wordCount = convertedText.trim().split(/\s+/).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surfaceContainer }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>← BACK</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurfaceVariant }]}>RESULT</Text>
        <TouchableOpacity onPress={handleCopy}>
          <Text style={{ color: colors.primary, fontSize: 22 }}>⊕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Engine badge */}
        <View style={styles.engineBadge}>
          <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
          <View>
            <Text style={[styles.badgeLabel, { color: colors.onSurfaceVariant }]}>ENGINE OUTPUT</Text>
            <Text style={[styles.badgeTitle, { color: colors.onSurface }]}>Hinglish V2-Neural</Text>
          </View>
        </View>

        {/* Result card */}
        <View style={[styles.resultCard, { backgroundColor: colors.surfaceContainerHigh }]}>
          {/* Chips */}
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: colors.surfaceContainerHighest }]}>
              <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>HIN-ENG</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.surfaceContainerHighest }]}>
              <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>RAW_TXT</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.chipText, { color: colors.primary }]}>{wordCount}W</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyChip, { backgroundColor: colors.primary }]}
              onPress={handleCopy}
            >
              <Text style={styles.copyChipText}>⊕</Text>
            </TouchableOpacity>
          </View>

          {/* Converted text */}
          <Text style={[styles.resultText, { color: colors.onSurface }]}>
            {convertedText}
          </Text>

          {/* Progress micro-bar */}
          <View style={[styles.microBar, { backgroundColor: colors.surfaceContainerHighest }]}>
            <View style={[styles.microBarFill, { backgroundColor: colors.secondary, width: '100%' }]} />
          </View>
        </View>

        {/* Original text reference */}
        <View style={[styles.originalCard, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.originalLabel, { color: colors.onSurfaceDim }]}>ORIGINAL INPUT</Text>
          <Text style={[styles.originalText, { color: colors.onSurfaceVariant }]} numberOfLines={4}>
            {originalText}
          </Text>
        </View>

        {/* Action buttons */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={handlePDF}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.actionBtnIcon}>📄</Text>
          <Text style={[styles.actionBtnLabel, { color: colors.onSurface }]}>CONVERT TO PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnIcon}>⟳</Text>
          <Text style={[styles.actionBtnLabel, { color: colors.onSurface }]}>SHARE OUTPUT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.primaryActionBtn,
            {
              backgroundColor: saved ? colors.surfaceContainerHigh : colors.primary,
              opacity: saved ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnIcon}>⊟</Text>
          <Text style={[styles.actionBtnLabel, { color: saved ? colors.onSurface : '#fff' }]}>
            {saved ? 'SAVED TO LAB ✓' : 'SAVE TO LAB'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Generating PDF..." />
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
  backBtn: { paddingRight: 8 },
  backText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  headerTitle: { fontSize: 11, letterSpacing: 3, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  accentBar: {
    width: 4,
    height: 52,
    borderRadius: 2,
  },
  badgeLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  copyChip: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyChipText: { fontSize: 18, color: '#fff' },
  resultText: {
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.1,
  },
  microBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 20,
    overflow: 'hidden',
  },
  microBarFill: { height: '100%', borderRadius: 1 },
  originalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  originalLabel: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  originalText: { fontSize: 13, lineHeight: 20 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 12,
    gap: 10,
  },
  primaryActionBtn: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  actionBtnIcon: { fontSize: 20 },
  actionBtnLabel: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '800',
  },
});
