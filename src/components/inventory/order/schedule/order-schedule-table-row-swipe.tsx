import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditOrders, canDeleteOrders } from "@/utils/permissions/entity-permissions";

interface OrderScheduleTableRowSwipeProps {
  scheduleId: string;
  scheduleName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function OrderScheduleTableRowSwipe({
  scheduleId,
  scheduleName = "este agendamento",
  onEdit,
  onDelete,
  onPress,
  children,
}: OrderScheduleTableRowSwipeProps) {
  const { user } = useAuth();
  const canEdit = canEditOrders(user);
  const canDelete = canDeleteOrders(user);

  // Build actions array
  const actions: GenericSwipeAction[] = [];

  if (onEdit && canEdit) {
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#007AFF", // blue
      onPress: onEdit,
      closeOnPress: true,
    });
  }

  if (onDelete && canDelete) {
    actions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: "#FF3B30", // red
      onPress: onDelete,
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  // Wrap children in Pressable to preserve onPress functionality
  const content = (
    <Pressable onPress={onPress} style={styles.content}>
      {children}
    </Pressable>
  );

  return (
    <GenericTableRowSwipe
      entityId={scheduleId}
      entityName={scheduleName}
      actions={actions}
      canPerformActions={(user) => canEditOrders(user) || canDeleteOrders(user)}
      style={styles.container}
    >
      {content}
    </GenericTableRowSwipe>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
});
