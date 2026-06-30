import { StyleSheet } from 'react-native';
import { IconFilter } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { StandardModal } from '@/components/ui/standard-modal';

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

  const handleClear = () => {
    onApplyFilters({});
  };

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Filtros"
      icon={IconFilter}
      actions={[
        { label: 'Limpar', variant: 'outline', onPress: handleClear },
        { label: 'Aplicar', onPress: onClose },
      ]}
    >
      <ThemedText style={[styles.placeholder, { color: colors.mutedForeground }]}>
        Filtros em desenvolvimento
      </ThemedText>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    fontSize: 16,
    textAlign: 'center',
  },
});
