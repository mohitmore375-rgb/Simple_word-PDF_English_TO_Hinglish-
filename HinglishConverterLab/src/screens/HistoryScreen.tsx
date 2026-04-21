import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { ConversionCard } from '../components/ConversionCard';
import { storageService, HistoryItem } from '../services/storageService';
import { Toast } from '../components/Toast';

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const items = await storageService.getHistory();
    setHistory(items);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Conversion', 'Remove this item from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storageService.deleteItem(id);
          setHistory((prev) => prev.filter((i) => i.id !== id));
          setToast({ visible: true, message: 'Deleted from history', type: 'success' });
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear All History', 'This will delete all saved conversions. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await storageService.clearAll();
          setHistory([]);
          setToast({ visible: true, message: 'History cleared', type: 'success' });
        },
      },
    ]);
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={[styles.emptyIcon, { color: colors.onSurfaceDim }]}>◷</Text>
      <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No conversions yet</Text>
      <Text style={[styles.emptySub, { color: colors.onSurfaceVariant }]}>
        Your saved conversions will appear here.{'\n'}Start by converting some text.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surfaceContainer }]}>
        <View>
          <Text style={[styles.headerLabel, { color: colors.onSurfaceDim }]}>◷ HISTORY</Text>
          <Text style={[styles.headerCount, { color: colors.onSurface }]}>
            {history.length} conversion{history.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={[styles.clearAllBtn, { borderColor: colors.error }]}>
            <Text style={[styles.clearAllText, { color: colors.error }]}>CLEAR ALL</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ConversionCard
            item={item}
            onPress={() =>
              navigation.navigate('ConvertTab', {
                screen: 'Result',
                params: {
                  originalText: item.originalText,
                  convertedText: item.convertedText,
                  source: item.source,
                  fileName: item.fileName,
                },
              })
            }
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

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
    paddingVertical: 16,
  },
  headerLabel: { fontSize: 10, letterSpacing: 2.5, fontWeight: '700', marginBottom: 4 },
  headerCount: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  clearAllBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clearAllText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
