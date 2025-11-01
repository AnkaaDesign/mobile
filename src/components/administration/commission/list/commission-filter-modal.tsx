import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Modal, ThemedText, Button } from "@/components/ui";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { useUsers, useTasks } from '../../../../hooks';
import { COMMISSION_STATUS, COMMISSION_STATUS_LABELS } from '../../../../constants';
import type { CommissionGetManyFormData } from '../../../../schemas';

interface CommissionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<CommissionGetManyFormData>) => void;
  currentFilters: Partial<CommissionGetManyFormData>;
}

export function CommissionFilterModal({
  visible,
  onClose,
  onApply,
  currentFilters,
}: CommissionFilterModalProps) {
  const [filters, setFilters] = useState<Partial<CommissionGetManyFormData> & {
    statuses?: string[];
    userIds?: string[];
    taskIds?: string[];
    createdAt?: { gte?: Date; lte?: Date };
  }>(currentFilters);

  const { data: usersData } = useUsers({});
  const { data: tasksData } = useTasks({});

  const users = usersData?.data || [];
  const tasks = tasksData?.data || [];

  const statusOptions = Object.values(COMMISSION_STATUS).map((status) => ({
    label: COMMISSION_STATUS_LABELS[status],
    value: status,
  }));

  const userOptions = users.map((user) => ({
    label: user.name,
    value: user.id,
  }));

  const taskOptions = tasks.map((task) => ({
    label: task.name || `#${task.id}`,
    value: task.id,
  }));

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Filtrar Comissões"
      size="large"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <MultiCombobox
            options={statusOptions}
            value={filters.statuses || []}
            onChange={(statuses) => setFilters((prev) => ({ ...prev, statuses }))}
            placeholder="Selecione os status"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Colaboradores</ThemedText>
          <MultiCombobox
            options={userOptions}
            value={filters.userIds || []}
            onChange={(userIds) => setFilters((prev) => ({ ...prev, userIds }))}
            placeholder="Selecione os colaboradores"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Serviços</ThemedText>
          <MultiCombobox
            options={taskOptions}
            value={filters.taskIds || []}
            onChange={(taskIds) => setFilters((prev) => ({ ...prev, taskIds }))}
            placeholder="Selecione os serviços"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Data de Criação</ThemedText>
          <View style={styles.dateRange}>
            <View style={styles.dateInput}>
              <ThemedText style={styles.dateLabel}>De:</ThemedText>
              <DatePicker
                value={filters.createdAt?.gte}
                onChange={(date) =>
                  setFilters((prev) => ({
                    ...prev,
                    createdAt: { ...prev.createdAt, gte: date },
                  }))
                }
                placeholder="Data inicial"
              />
            </View>
            <View style={styles.dateInput}>
              <ThemedText style={styles.dateLabel}>Até:</ThemedText>
              <DatePicker
                value={filters.createdAt?.lte}
                onChange={(date) =>
                  setFilters((prev) => ({
                    ...prev,
                    createdAt: { ...prev.createdAt, lte: date },
                  }))
                }
                placeholder="Data final"
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button variant="outline" onPress={handleClear} style={styles.button}>
            Limpar
          </Button>
          <Button onPress={handleApply} style={styles.button}>
            Aplicar Filtros
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateRange: {
    gap: 12,
  },
  dateInput: {
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
});
