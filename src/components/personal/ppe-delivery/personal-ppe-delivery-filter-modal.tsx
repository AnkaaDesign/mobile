import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { IconX } from '@tabler/icons-react-native';

interface PersonalPpeDeliveryFilterModalProps {
  visible: boolean;
  filters: any;
  onApplyFilters: (filters: any) => void;
  onClose: () => void;
}

/**
 * Placeholder filter modal for Personal PPE Deliveries
 * TODO: Implement full filter functionality with status, date range, and item filters
 */
export function PersonalPpeDeliveryFilterModal({
  visible,
  filters,
  onApplyFilters,
  onClose,
}: PersonalPpeDeliveryFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleClear = () => {
    onApplyFilters({});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Filtros</ThemedText>
          <TouchableOpacity onPress={handleClear}>
            <ThemedText style={[styles.clearText, { color: colors.primary }]}>Limpar</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText style={[styles.placeholder, { color: colors.mutedForeground }]}>
            Filtros em desenvolvimento
          </ThemedText>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Button onPress={onClose} style={styles.applyButton}>
            <ThemedText style={{ color: colors.primaryForeground }}>Fechar</ThemedText>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholder: {
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
  },
  applyButton: {
    width: '100%',
  },
});
