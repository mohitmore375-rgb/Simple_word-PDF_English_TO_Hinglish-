import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { HistoryItem, storageService } from '../services/storageService';

interface ConversionCardProps {
  item: HistoryItem;
  onPress?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export const ConversionCard: React.FC<ConversionCardProps> = ({
  item,
  onPress,
  onDelete,
  compact = false,
}) => {
  const { colors } = useTheme();

  const sourceLabel =
    item.source === 'document' ? 'DOC' : item.source === 'image' ? 'IMG' : 'TXT';
  const isActive = item.id.endsWith('0'); // placeholder for "just converted"

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surfaceContainerHigh }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.engine, { color: colors.onSurfaceVariant }]}>ENGINE: V2-NEURAL</Text>
        </View>
        <Text style={[styles.time, { color: colors.onSurfaceDim }]}>
          {storageService.formatTimestamp(item.timestamp)}
        </Text>
      </View>

      <Text
        style={[styles.original, { color: colors.onSurface }]}
        numberOfLines={compact ? 2 : 3}
      >
        {item.originalText}
      </Text>

      {!compact && item.convertedText ? (
        <Text
          style={[styles.converted, { color: colors.primary }]}
          numberOfLines={2}
        >
          {item.convertedText}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: colors.surfaceContainerHighest }]}>
            <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>ENG→HIN</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surfaceContainerHighest }]}>
            <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>{sourceLabel}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surfaceContainerHighest }]}>
            <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>{item.wordCount}W</Text>
          </View>
        </View>
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.deleteBtn, { color: colors.error }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  engine: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  original: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  converted: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    fontSize: 14,
    fontWeight: '700',
  },
});
