import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useAIModel } from '../context/AIModelContext';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Toast } from '../components/Toast';
import { BottomInputBar } from '../components/BottomInputBar';
import { RecentHistoryCard } from '../components/RecentHistoryCard';
import { SideDrawer } from '../components/SideDrawer';
import { storageService } from '../services/storageService';
import { chatService, ChatSession } from '../services/chatService';
import { ocrService } from '../services/ocrService';
import { HomeStackParamList } from '../navigation/AppNavigator';

type HomeNavProp = StackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { aiMode, modelStatus } = useAIModel();
  const navigation = useNavigation<HomeNavProp>();

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });

  // Animated greeting fade-in
  const greetOpacity = useRef(new Animated.Value(0)).current;
  const greetTranslate = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    loadRecent();
    Animated.parallel([
      Animated.timing(greetOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(greetTranslate, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadRecent = async () => {
    const sessions = await storageService.getChatSessions();
    setRecentSessions(sessions.slice(0, 5));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  // ── Send Message → open Chat screen ────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    setIsThinking(true);
    setInputText('');

    // Create a new chat session and navigate immediately
    const session = chatService.createSession(text);
    const userMsg = chatService.createUserMessage(text);
    session.messages.push(userMsg);

    await storageService.saveChatSession(session);
    await loadRecent();

    setIsThinking(false);

    navigation.navigate('Chat', {
      sessionId: session.id,
      initialMessage: text,
    });
  }, [inputText]);

  // ── File upload → navigate to Convert tab ──────────────────────────────────
  const handleUpload = async () => {
    try {
      const { text, fileName, fileType } = await ocrService.pickDocument();
      setInputText(text);
      showToast(`${fileType} loaded — ${text.trim().split(/\s+/).length} words`, 'success');
    } catch (err: any) {
      if (err.message !== 'CANCELLED') {
        showToast(err.message || 'Failed to load file', 'error');
      }
    }
  };

  // ── Voice ──────────────────────────────────────────────────────────────────
  const handleVoice = () => showToast('Voice input coming soon!', 'info');

  // ── Open Settings ──────────────────────────────────────────────────────────
  const handleOpenSettings = () => navigation.navigate('Settings');

  // ── Drawer navigation ──────────────────────────────────────────────────────
  const handleDrawerNavigate = (screen: string) => {
    if (screen === 'History') {
      navigation.getParent()?.navigate('HistoryTab');
    } else if (screen === 'Labs') {
      navigation.getParent()?.navigate('LabsTab');
    } else if (screen === 'Settings') {
      navigation.navigate('Settings');
    } else if (screen === 'Convert') {
      navigation.navigate('Home');
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Hamburger */}
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            onPress={() => setDrawerOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.hamburger}>
              <View style={[styles.hLine, { backgroundColor: colors.onSurface }]} />
              <View style={[styles.hLine, styles.hLineMid, { backgroundColor: colors.onSurface }]} />
              <View style={[styles.hLine, { backgroundColor: colors.onSurface }]} />
            </View>
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Simplae Word</Text>

          {/* Right: sync icon + avatar */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceContainerHigh }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 15, color: colors.onSurfaceVariant }}>⊡</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenSettings}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>M</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SCROLLABLE CONTENT ───────────────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Greeting Section ────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.greetSection,
              { opacity: greetOpacity, transform: [{ translateY: greetTranslate }] },
            ]}
          >
            <Text style={[styles.greetSub, { color: colors.onSurfaceVariant }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.greetName, { color: colors.onSurface }]}>
              Hi Mohit 👋
            </Text>
            <Text style={[styles.greetQuestion, { color: colors.onSurfaceVariant }]}>
              How can I help you today?
            </Text>
          </Animated.View>

          {/* ── Quick Action Chips ──────────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {[
              { label: 'Explain a concept', icon: '💡' },
              { label: 'Write code', icon: '</>' },
              { label: 'Translate text', icon: '⇄' },
              { label: 'Summarize', icon: '📋' },
            ].map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, { backgroundColor: colors.surfaceContainer, borderColor: colors.cardBorder }]}
                onPress={() => setInputText(chip.label + ' ')}
                activeOpacity={0.75}
              >
                <Text style={styles.chipIcon}>{chip.icon}</Text>
                <Text style={[styles.chipLabel, { color: colors.onSurfaceVariant }]}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Recent History Section ──────────────────────────────────── */}
          {recentSessions.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: colors.onSurface }]}>Recent</Text>
                <TouchableOpacity
                  onPress={() => navigation.getParent()?.navigate('HistoryTab')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.viewAll, { color: colors.primary }]}>View all</Text>
                </TouchableOpacity>
              </View>

              {recentSessions.map((session) => (
                <RecentHistoryCard
                  key={session.id}
                  session={session}
                  onPress={() =>
                    navigation.navigate('Chat', {
                      sessionId: session.id,
                      initialMessage: undefined,
                    })
                  }
                  onLongPress={() => {
                    Alert.alert('Options', session.title, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: session.isPinned ? 'Unpin' : 'Pin',
                        onPress: async () => {
                          await storageService.pinChatSession(session.id, !session.isPinned);
                          loadRecent();
                        },
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await storageService.deleteChatSession(session.id);
                          loadRecent();
                          showToast('Chat deleted', 'success');
                        },
                      },
                    ]);
                  }}
                />
              ))}

              <TouchableOpacity
                style={[styles.viewAllBtn, { borderColor: colors.outline }]}
                onPress={() => navigation.getParent()?.navigate('HistoryTab')}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewAllBtnText, { color: colors.onSurfaceVariant }]}>
                  View all history
                </Text>
                <Text style={[styles.viewAllBtnArrow, { color: colors.onSurfaceDim }]}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty state when no history */}
          {recentSessions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyIcon, { color: colors.onSurfaceDim }]}>✦</Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                Ask me anything to get started
              </Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── BOTTOM INPUT BAR ──────────────────────────────────────────────── */}
      <View style={[styles.inputBarWrap, { backgroundColor: colors.surface }]}>
        <BottomInputBar
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onUpload={handleUpload}
          onSettings={handleOpenSettings}
          onVoice={handleVoice}
          isThinking={isThinking}
          placeholder="Ask Simplae Word"
        />
        <View style={{ height: Platform.OS === 'android' ? 8 : 4 }} />
      </View>

      {/* ── SIDE DRAWER ───────────────────────────────────────────────────── */}
      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleDrawerNavigate}
        userName="Mohit"
      />

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
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburger: { gap: 4 },
  hLine: { width: 18, height: 2, borderRadius: 1 },
  hLineMid: { width: 14 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  greetSection: { paddingTop: 32, paddingBottom: 28 },
  greetSub: { fontSize: 15, fontWeight: '400', marginBottom: 4 },
  greetName: { fontSize: 34, fontWeight: '800', letterSpacing: -1, lineHeight: 40, marginBottom: 8 },
  greetQuestion: { fontSize: 18, fontWeight: '400', letterSpacing: 0.1 },
  chipsRow: { gap: 10, paddingBottom: 28, paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipIcon: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '500' },
  recentSection: { marginBottom: 20 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  recentTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  viewAll: { fontSize: 13, fontWeight: '600' },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
    gap: 6,
  },
  viewAllBtnText: { fontSize: 14, fontWeight: '500' },
  viewAllBtnArrow: { fontSize: 18 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 42 },
  emptyText: { fontSize: 15, fontWeight: '400', textAlign: 'center', lineHeight: 22 },
  inputBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 8,
  },
});
