import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/utils";
import type { Task } from "@/types";

interface TasksModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  title: string;
}

export function TasksModal({ visible, onClose, tasks, title }: TasksModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderTaskItem = ({ item: task }: { item: Task }) => (
    <Card
      style={[
        styles.taskCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <ThemedText style={styles.taskName} numberOfLines={1}>
        {task.name}
      </ThemedText>

      <View style={styles.taskDetails}>
        <View style={styles.taskRow}>
          <ThemedText style={[styles.taskLabel, { color: colors.mutedForeground }]}>
            Cliente:
          </ThemedText>
          <ThemedText style={styles.taskValue} numberOfLines={1}>
            {task.customer?.fantasyName || "-"}
          </ThemedText>
        </View>

        <View style={styles.taskRow}>
          <ThemedText style={[styles.taskLabel, { color: colors.mutedForeground }]}>
            Setor:
          </ThemedText>
          <ThemedText style={styles.taskValue}>
            {task.sector?.name || "-"}
          </ThemedText>
        </View>

        <View style={styles.taskRow}>
          <ThemedText style={[styles.taskLabel, { color: colors.mutedForeground }]}>
            Finalizado:
          </ThemedText>
          <ThemedText style={styles.taskValue}>
            {task.finishedAt ? formatDate(new Date(task.finishedAt)) : "-"}
          </ThemedText>
        </View>

        {task.serialNumber && (
          <View style={styles.taskRow}>
            <ThemedText style={[styles.taskLabel, { color: colors.mutedForeground }]}>
              Nº Série:
            </ThemedText>
            <ThemedText style={styles.taskValue}>
              {task.serialNumber}
            </ThemedText>
          </View>
        )}

        {task.truck?.plate && (
          <View style={styles.taskRow}>
            <ThemedText style={[styles.taskLabel, { color: colors.mutedForeground }]}>
              Placa:
            </ThemedText>
            <ThemedText style={styles.taskValue}>
              {task.truck.plate.toUpperCase()}
            </ThemedText>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Drag Indicator */}
        <View style={styles.dragIndicatorContainer}>
          <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>{title}</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.muted }]}
            onPress={onClose}
          >
            <IconX size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Task List */}
        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma tarefa encontrada
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  taskDetails: {
    gap: 8,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  taskValue: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});
