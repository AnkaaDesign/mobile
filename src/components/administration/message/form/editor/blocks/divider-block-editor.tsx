import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';
import type { DividerBlock } from '../types';

interface DividerBlockEditorProps {
  block: DividerBlock;
}

export function DividerBlockEditor({ block: _block }: DividerBlockEditorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
