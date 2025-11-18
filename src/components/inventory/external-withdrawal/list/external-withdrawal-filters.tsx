import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Modal, ModalContent, ModalHeader, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/lib/theme';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  EXTERNAL_WITHDRAWAL_STATUS,
  EXTERNAL_WITHDRAWAL_STATUS_LABELS,
  EXTERNAL_WITHDRAWAL_TYPE,
  EXTERNAL_WITHDRAWAL_TYPE_LABELS,
} from '@/constants';

interface FilterValues {
  statuses?: EXTERNAL_WITHDRAWAL_STATUS[];
  types?: EXTERNAL_WITHDRAWAL_TYPE[];
  createdAtStart?: Date;
  createdAtEnd?: Date;
}

interface ExternalWithdrawalFiltersProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterValues;
  onApplyFilters: (filters: FilterValues) => void;
  onClearFilters: () => void;
}

export const ExternalWithdrawalFilters = React.memo<ExternalWithdrawalFiltersProps>(
  ({ visible, onClose, filters, onApplyFilters, onClearFilters }) => {
    const { colors } = useTheme();
    const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

    // Update local filters when modal opens
    React.useEffect(() => {
      if (visible) {
        setLocalFilters(filters);
      }
    }, [visible, filters]);

    const statusOptions = useMemo(
      () =>
        Object.values(EXTERNAL_WITHDRAWAL_STATUS).map((status) => ({
          label: EXTERNAL_WITHDRAWAL_STATUS_LABELS[status],
          value: status,
        })),
      []
    );

    const typeOptions = useMemo(
      () =>
        Object.values(EXTERNAL_WITHDRAWAL_TYPE).map((type) => ({
          label: EXTERNAL_WITHDRAWAL_TYPE_LABELS[type],
          value: type,
        })),
      []
    );

    const activeFilterCount = useMemo(() => {
      let count = 0;
      if (localFilters.statuses && localFilters.statuses.length > 0) {
        count += localFilters.statuses.length;
      }
      if (localFilters.types && localFilters.types.length > 0) {
        count += localFilters.types.length;
      }
      if (localFilters.createdAtStart || localFilters.createdAtEnd) {
        count += 1;
      }
      return count;
    }, [localFilters]);

    const handleApply = useCallback(() => {
      onApplyFilters(localFilters);
      onClose();
    }, [localFilters, onApplyFilters, onClose]);

    const handleClear = useCallback(() => {
      setLocalFilters({});
      onClearFilters();
      onClose();
    }, [onClearFilters, onClose]);

    const handleStatusChange = useCallback((values: string[]) => {
      setLocalFilters((prev) => ({
        ...prev,
        statuses: values as EXTERNAL_WITHDRAWAL_STATUS[],
      }));
    }, []);

    const handleTypeChange = useCallback((values: string[]) => {
      setLocalFilters((prev) => ({
        ...prev,
        types: values as EXTERNAL_WITHDRAWAL_TYPE[],
      }));
    }, []);

    const handleCreatedAtStartChange = useCallback((date: Date | null) => {
      setLocalFilters((prev) => ({
        ...prev,
        createdAtStart: date || undefined,
      }));
    }, []);

    const handleCreatedAtEndChange = useCallback((date: Date | null) => {
      setLocalFilters((prev) => ({
        ...prev,
        createdAtEnd: date || undefined,
      }));
    }, []);

    return (
      <Modal visible={visible} onClose={onClose} animationType="slide">
        <ModalContent style={styles.modalContent}>
          <ModalHeader>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Icon name="filter" size={20} color={colors.foreground} />
                <Text style={[styles.title, { color: colors.foreground }]}>Filtros</Text>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" size="sm">
                    {activeFilterCount}
                  </Badge>
                )}
              </View>
            </View>
          </ModalHeader>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Status</Text>
              <Select
                options={statusOptions}
                value={localFilters.statuses || []}
                onChange={handleStatusChange}
                placeholder="Selecione os status"
                multiple
              />
            </View>

            {/* Type Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Tipo</Text>
              <Select
                options={typeOptions}
                value={localFilters.types || []}
                onChange={handleTypeChange}
                placeholder="Selecione os tipos"
                multiple
              />
            </View>

            {/* Date Range Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                Período de Criação
              </Text>
              <View style={styles.dateRange}>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>De</Text>
                  <DatePicker
                    value={localFilters.createdAtStart}
                    onChange={handleCreatedAtStartChange}
                    placeholder="Selecionar..."
                    mode="date"
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>Até</Text>
                  <DatePicker
                    value={localFilters.createdAtEnd}
                    onChange={handleCreatedAtEndChange}
                    placeholder="Selecionar..."
                    mode="date"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <ModalFooter>
            <Button variant="outline" onPress={handleClear} style={styles.button}>
              <Icon name="x" size={16} color={colors.foreground} />
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Limpar</Text>
            </Button>
            <Button onPress={handleApply} style={styles.button}>
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                Aplicar {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Text>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);

ExternalWithdrawalFilters.displayName = 'ExternalWithdrawalFilters';

const styles = StyleSheet.create({
  modalContent: {
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 500,
  },
  scrollContent: {
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateRange: {
    gap: 12,
  },
  dateField: {
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
