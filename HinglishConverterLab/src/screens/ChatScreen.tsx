import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { ChatBubble } from '../components/ChatBubble';
import { BottomInputBar } from '../components/BottomInputBar';
import { Toast } from '../components/Toast';
import { chatService, ChatMessage, ChatSession } from '../services/chatService';
import { storageService } from '../services/storageService';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

type ChatRouteProp = RouteProp<HomeStackParamList, 'Chat'>;
type ChatNavProp = StackNavigationProp<HomeStackParamList, 'Chat'>;

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<ChatNavProp>();
  const route = useRoute<ChatRouteProp>();

  const { sessionId, initialMessage } = route.params;

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });

  const flatListRef = useRef<FlatList>(null);
  const sessionRef = useRef<ChatSession | null>(null);

  // ── Load session on mount ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const sessions = await storageService.getChatSessions();
      const found = sessions.find((s) => s.id === sessionId);
      if (found) {
        setSession(found);
        setMessages(found.messages);
        sessionRef.current = found;

        // If there's an initial message and session has only 1 message (just user),
        // trigger AI response immediately
        if (initialMessage && found.messages.length === 1) {
          triggerAIResponse(found, found.messages, initialMessage);
        }
      }
    })();
  }, [sessionId]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') =>
    setToast({ visible: true, message: msg, type });

  // ── Trigger AI Response ──────────────────────────────────────────────────
  const triggerAIResponse = useCallback(
    async (sess: ChatSession, currentMessages: ChatMessage[], userText: string) => {
      setIsThinking(true);

      // Add placeholder typing bubble
      const typingMsg: ChatMessage = {
        id: 'typing',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, typingMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const aiText = await chatService.sendMessage(userText, currentMessages);
        const assistantMsg = chatService.createAssistantMessage(aiText);

        const updatedMessages = [
          ...currentMessages,
          assistantMsg,
        ];

        // Remove typing bubble, add real response
        setMessages(updatedMessages);

        // Persist updated session
        const updatedSession: ChatSession = {
          ...sess,
          messages: updatedMessages,
          updatedAt: Date.now(),
        };
        sessionRef.current = updatedSession;
        setSession(updatedSession);
        await storageService.saveChatSession(updatedSession);

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (err: any) {
        // Remove typing bubble on error
        setMessages((prev) => prev.filter((m) => m.id !== 'typing'));
        showToast(err.message || 'Failed to get a response. Please try again.', 'error');
      } finally {
        setIsThinking(false);
      }
    },
    []
  );

  // ── Handle Send ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isThinking || !sessionRef.current) return;

    setInputText('');

    const userMsg = chatService.createUserMessage(text);
    const updatedMessages = [...messages.filter((m) => m.id !== 'typing'), userMsg];
    setMessages(updatedMessages);

    // Update session title if it's the first user message after initial
    const sess = sessionRef.current;

    // Persist user message
    const updatedSession: ChatSession = {
      ...sess,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };
    sessionRef.current = updatedSession;
    setSession(updatedSession);
    await storageService.saveChatSession(updatedSession);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    await triggerAIResponse(updatedSession, updatedMessages, text);
  }, [inputText, isThinking, messages]);

  const handleVoice = () => showToast('Voice input coming soon!', 'info');

  const handleUpload = () => showToast('File upload coming soon in chat!', 'info');

  // ── Render ───────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatBubble
        message={item}
        isTyping={item.id === 'typing' && isThinking}
      />
    ),
    [isThinking]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.headerBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.backArrow, { color: colors.onSurface }]}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAIBadge}>
              <Text style={{ fontSize: 14 }}>✦</Text>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                {session?.title ?? 'Simplae Word'}
              </Text>
            </View>
            <Text style={[styles.headerSub, { color: colors.onSurfaceDim }]}>
              {session?.category === 'code' ? '⌨️ Code' : session?.category === 'study' ? '📖 Study' : '💬 General'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            onPress={() => {
              Alert.alert('Chat Options', undefined, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear Chat',
                  style: 'destructive',
                  onPress: async () => {
                    if (!sessionRef.current) return;
                    const cleared: ChatSession = { ...sessionRef.current, messages: [] };
                    sessionRef.current = cleared;
                    setSession(cleared);
                    setMessages([]);
                    await storageService.saveChatSession(cleared);
                  },
                },
                {
                  text: session?.isPinned ? 'Unpin' : 'Pin Chat',
                  onPress: async () => {
                    if (!sessionRef.current) return;
                    await storageService.pinChatSession(sessionRef.current.id, !session?.isPinned);
                    setSession((s) => s ? { ...s, isPinned: !s.isPinned } : s);
                    showToast(session?.isPinned ? 'Chat unpinned' : 'Chat pinned 📌', 'success');
                  },
                },
              ]);
            }}
          >
            <Text style={{ color: colors.onSurface, fontSize: 20 }}>⋮</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Chat messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={() => (
            <View style={styles.emptyChat}>
              <Text style={{ fontSize: 44, marginBottom: 16 }}>✦</Text>
              <Text style={[styles.emptyChatTitle, { color: colors.onSurface }]}>
                Simplae Word
              </Text>
              <Text style={[styles.emptyChatSub, { color: colors.onSurfaceVariant }]}>
                Ask me anything — code, study, or general questions
              </Text>
            </View>
          )}
        />

        {/* Input bar */}
        <View style={[styles.inputWrap, { backgroundColor: colors.surface }]}>
          <BottomInputBar
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            onUpload={handleUpload}
            onSettings={() => navigation.navigate('Settings')}
            onVoice={handleVoice}
            isThinking={isThinking}
            placeholder="Reply to Simplae Word…"
          />
          <View style={{ height: Platform.OS === 'android' ? 8 : 4 }} />
        </View>
      </KeyboardAvoidingView>

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
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 26, fontWeight: '300', lineHeight: 30 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerAIBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },
  headerSub: { fontSize: 11, marginTop: 2 },
  messageList: { paddingVertical: 16, paddingBottom: 24, flexGrow: 1 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, paddingTop: 100 },
  emptyChatTitle: { fontSize: 24, fontWeight: '700', marginBottom: 10 },
  emptyChatSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  inputWrap: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
});
