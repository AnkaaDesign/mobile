import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { BORROW_STATUS, BORROW_STATUS_ORDER } from "@/constants";
import { IconAlertTriangle, IconCheck, IconClock } from "@tabler/icons-react-native";

interface StatusSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  currentStatus: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  onStatusChange?: (status: string) => void;
}

// Define valid status transitions
const getValidStatusTransitions = (currentStatus: string): string[] => {
  switch (currentStatus) {
    case BORROW_STATUS.ACTIVE:
      return [BORROW_STATUS.ACTIVE, BORROW_STATUS.RETURNED, BORROW_STATUS.LOST];
    case BORROW_STATUS.RETURNED:
      return [BORROW_STATUS.RETURNED]; // Cannot change from returned
    case BORROW_STATUS.LOST:
      return [BORROW_STATUS.LOST]; // Cannot change from lost
    default:
      return [currentStatus];
  }
};

// Get status display info
const getStatusInfo = (status: string) => {
  switch (status) {
    case BORROW_STATUS.ACTIVE:
      return {
        label: "Ativo",
        icon: IconClock,
        color: "#3b82f6", // blue
      };
    case BORROW_STATUS.RETURNED:
      return {
        label: "Devolvido",
        icon: IconCheck,
        color: "#10b981", // green
      };
    case BORROW_STATUS.LOST:
      return {
        label: "Perdido",
        icon: IconAlertTriangle,
        color: "#ef4444", // red
      };
    default:
      return {
        label: status,
        icon: IconClock,
        color: "#6b7280", // gray
      };
  }
};

export function BorrowStatusSelector({
  value,
  onValueChange,
  currentStatus,
  disabled,
  error,
  label = "Status",
  required = false,
  onStatusChange,
}: StatusSelectorProps) {
  const { colors } = useTheme();

  const validStatuses = useMemo(
    () => getValidStatusTransitions(currentStatus),
    [currentStatus]
  );

  const currentStatusInfo = useMemo(
    () => getStatusInfo(currentStatus),
    [currentStatus]
  );

  const statusOptions = useMemo(() => {
    return validStatuses
      .sort((a, b) => (BORROW_STATUS_ORDER[a] || 999) - (BORROW_STATUS_ORDER[b] || 999))
      .map((status) => {
        const info = getStatusInfo(status);
        return {
          value: status,
          label: info.label,
        };
      });
  }, [validStatuses]);

  const handleStatusChange = (newStatus: string | undefined) => {
    if (!newStatus) return;

    onValueChange(newStatus);

    // Call the external status change handler
    onStatusChange?.(newStatus);
  };

  const selectedStatus = value || currentStatus;
  const selectedStatusInfo = useMemo(
    () => getStatusInfo(selectedStatus),
    [selectedStatus]
  );

  // Show warning for status changes
  const showLostWarning = selectedStatus === BORROW_STATUS.LOST;
  const showReturnedInfo = selectedStatus === BORROW_STATUS.RETURNED;

  return (
    <View style={styles.container}>
      {/* Current Status Display */}
      <Card style={styles.currentStatusCard}>
        <View style={styles.currentStatusContent}>
          <Label>Status Atual</Label>
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: currentStatusInfo.color + "20" }]}>
              {currentStatusInfo.icon && (
                <currentStatusInfo.icon size={16} color={currentStatusInfo.color} />
              )}
              <ThemedText style={[styles.statusText, { color: currentStatusInfo.color }]}>
                {currentStatusInfo.label}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>

      {/* Status Selection (only if transitions are available) */}
      {validStatuses.length > 1 && (
        <View style={styles.selectorContainer}>
          {label && (
            <Label>
              Alterar Status {required && <ThemedText style={{ color: colors.destructive }}>*</ThemedText>}
            </Label>
          )}
          <Combobox
            value={selectedStatus}
            onValueChange={handleStatusChange}
            options={statusOptions}
            placeholder="Selecione o status"
            emptyText="Nenhum status disponível"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
          {error && (
            <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </ThemedText>
          )}
          <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
            Selecione o novo status do empréstimo
          </ThemedText>
        </View>
      )}

      {/* Status Change Warnings */}
      {showLostWarning && (
        <Card style={[styles.warningCard, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive }]}>
          <View style={styles.warningContent}>
            <IconAlertTriangle size={20} color={colors.destructive} />
            <View style={styles.warningTextContainer}>
              <ThemedText style={[styles.warningTitle, { color: colors.destructive }]}>
                Atenção: Item será marcado como perdido
              </ThemedText>
              <ThemedText style={[styles.warningText, { color: colors.destructive }]}>
                Esta ação indica que o item foi perdido e pode impactar o estoque.
              </ThemedText>
            </View>
          </View>
        </Card>
      )}

      {showReturnedInfo && currentStatus !== BORROW_STATUS.RETURNED && (
        <Card style={[styles.infoCard, { backgroundColor: colors.success + "10", borderColor: colors.success }]}>
          <View style={styles.warningContent}>
            <IconCheck size={20} color={colors.success} />
            <View style={styles.warningTextContainer}>
              <ThemedText style={[styles.warningTitle, { color: colors.success }]}>
                Item será marcado como devolvido
              </ThemedText>
              <ThemedText style={[styles.warningText, { color: colors.success }]}>
                O item será retornado ao estoque e a data de devolução será registrada.
              </ThemedText>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}

// Export as StatusSelector for compatibility
export { BorrowStatusSelector as StatusSelector };

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  currentStatusCard: {
    padding: spacing.md,
  },
  currentStatusContent: {
    gap: spacing.sm,
  },
  statusBadgeContainer: {
    flexDirection: "row",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  selectorContainer: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  warningCard: {
    padding: spacing.md,
    borderWidth: 1,
  },
  infoCard: {
    padding: spacing.md,
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  warningTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  warningText: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
  },
});
