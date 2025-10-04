import React from "react";
import { View, Pressable , StyleSheet} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconShield, IconUser, IconCalendar, IconTrash } from "@tabler/icons-react-native";
import { formatDate } from '../../../../utils';
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from '../../../../constants';
import type { PpeDelivery } from '../../../../types';

interface PpeTableRowSwipeProps {
  ppe: PpeDelivery;
  onPress: () => void;
  onDelete: () => void;
}

export const PpeTableRowSwipe: React.FC<PpeTableRowSwipeProps> = ({
  ppe,
  onPress,
  onDelete,
}) => {
  const { colors } = useTheme();
  const swipeableRef = React.useRef<Swipeable>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case PPE_DELIVERY_STATUS.PENDING:
        return "#f59e0b";
      case PPE_DELIVERY_STATUS.APPROVED:
        return "#10b981";
      case PPE_DELIVERY_STATUS.DELIVERED:
        return "#3b82f6";
      case PPE_DELIVERY_STATUS.REPROVED:
        return "#ef4444";
      case PPE_DELIVERY_STATUS.CANCELLED:
        return "#6b7280";
      default:
        return colors.mutedForeground;
    }
  };

  const renderRightActions = () => {
    return (
      <View style={styles.swipeActions}>
        <Pressable
          style={StyleSheet.flatten([styles.actionButton, { backgroundColor: "#ef4444" }])}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete();
          }}
        >
          <IconTrash size={20} color="white" />
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <Pressable
        style={StyleSheet.flatten([styles.row, { backgroundColor: colors.card }])}
        onPress={onPress}
      >
        <View style={styles.content}>
          {/* Header with item name and status */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <IconShield size={16} color={colors.primary} />
              <ThemedText style={styles.title} numberOfLines={1}>
                {ppe.item?.name || "Sem nome"}
              </ThemedText>
            </View>
            <Badge
              variant="default"
              style={{ backgroundColor: getStatusColor(ppe.status) }}
            >
              <ThemedText style={styles.statusText}>
                {PPE_DELIVERY_STATUS_LABELS[ppe.status]}
              </ThemedText>
            </Badge>
          </View>

          {/* User info */}
          {ppe.user && (
            <View style={styles.infoRow}>
              <IconUser size={14} color={colors.mutedForeground} />
              <ThemedText style={styles.infoText}>
                {ppe.user.name}
                {ppe.user.position && ` - ${ppe.user.position.name}`}
              </ThemedText>
            </View>
          )}

          {/* Item details */}
          <View style={styles.detailsRow}>
            {ppe.item?.category && (
              <View style={styles.detailItem}>
                <ThemedText style={styles.detailLabel}>Categoria:</ThemedText>
                <ThemedText style={styles.detailValue}>{ppe.item.category.name}</ThemedText>
              </View>
            )}
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Quantidade:</ThemedText>
              <ThemedText style={styles.detailValue}>{ppe.quantity}</ThemedText>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.footer}>
            <View style={styles.dateItem}>
              <IconCalendar size={14} color={colors.mutedForeground} />
              <ThemedText style={styles.dateText}>
                Criado: {formatDate(ppe.createdAt)}
              </ThemedText>
            </View>
            {ppe.scheduledDate && (
              <ThemedText style={StyleSheet.flatten([
                styles.dateText,
                new Date(ppe.scheduledDate) < new Date() && ppe.status === PPE_DELIVERY_STATUS.PENDING && { color: "#ef4444" }
              ])}>
                Agendado: {formatDate(ppe.scheduledDate)}
              </ThemedText>
            )}
          </View>

          {/* Delivery date */}
          {ppe.actualDeliveryDate && (
            <View style={styles.countBadge}>
              <ThemedText style={styles.countText}>
                Entregue em: {formatDate(ppe.actualDeliveryDate)}
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  detailsRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
  countBadge: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  countText: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 60,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});