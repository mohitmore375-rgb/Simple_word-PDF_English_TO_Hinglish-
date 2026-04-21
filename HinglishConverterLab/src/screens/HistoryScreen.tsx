import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../services/storageService';
import { ChatSession } from '../services/chatService';
import { RecentHistoryCard } from '../components/RecentHistoryCard';
import { Toast } from '../components/Toast';

const CATEGORY_FILTERS = ['All', 'general', 'code', 'study'] as const;
type FilterType = typeof CATEGORY_FILTERS[number];

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    const sessions = await storageService.getChatSessions();
    setAllSessions(sessions);
  };

  const showToast = (msg: string) => setToast({ visible: true, message: msg, type: 'success' });

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredSessions = allSessions.filter((s) => {
    const matchCategory = activeFilter === 'All' || s.category === activeFilter;
    const matchSearch = !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    await storageService.deleteChatSession(id);
    setAllSessions((prev) => prev.filter((s) => s.id !== id));
    showToast('Chat deleted');
  };

  const handlePin = async (session: ChatSession) => {
    await storageService.pinChatSession(session.id, !session.isPinned);
    setAllSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, isPinned: !s.isPinned } : s))
    );
    showToast(session.isPinned ? 'Unpinned' : 'Pinned 📌');
  };

  const handleClearAll = () => {
    Alert.alert('Clear All Chats', 'This will delete all chat history. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await storageService.clearAllChatSessions();
          setAllSessions([]);
          showToast('All history cleared');
        },
      },
    ]);
  };

  const handleLongPress = (session: ChatSession) => {
    Alert.alert('Chat Options', session.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: session.isPinned ? '📌 Unpin' : '📌 Pin', onPress: () => handlePin(session) },
      {
        text: '🗑️ Delete',
        style: 'destructive',
        onPress: () => handleDelete(session.id),
      },
    ]);
  };

  const FILTER_LABELS: Record<FilterType, string> = {
    All: 'All',
    general: '💬 General',
    code: '⌨️ Code',
    study: '📖 Study',
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>History</Text>
            <Text style={[styles.headerSub, { color: colors.onSurfaceDim }]}>
              {allSessions.length} conversation{allSessions.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {allSessions.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.clearBtn, { borderColor: colors.error }]}
            >
              <Text style={[styles.clearBtnText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainer, borderColor: colors.inputBorder }]}>
          <Text style={{ fontSize: 15, color: colors.onSurfaceDim }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder="Search history…"
            placeholderTextColor={colors.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.onSurfaceDim, fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category filter chips */}
        <View style={styles.filterRow}>
          {CATEGORY_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === f ? colors.primary : colors.surfaceContainer,
                  borderColor: activeFilter === f ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: activeFilter === f ? colors.onPrimary : colors.onSurfaceVariant },
                ]}
              >
                {FILTER_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* List */}
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={{ fontSize: 42, marginBottom: 16 }}>💬</Text>
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {searchQuery ? 'No results found' : 'No chats yet'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.onSurfaceVariant }]}>
              {searchQuery
                ? `No chats match "${searchQuery}"`
                : 'Start a conversation from the Home tab'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <RecentHistoryCard
            session={item}
            onPress={() => navigation.navigate('ConvertTab', {
              screen: 'Chat',
              params: { sessionId: item.id, initialMessage: undefined },
            })}
            onLongPress={() => handleLongPress(item)}
          />
        )}
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
  safe: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  clearBtn: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  clearBtnText: { fontSize: 12, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '500' },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
