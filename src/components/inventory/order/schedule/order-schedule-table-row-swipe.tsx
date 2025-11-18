import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ReanimatedSwipeableRow} from "@/components/ui/reanimated-swipeable-row";
import { useAuth } from "@/contexts/auth-context";
import { canEditOrders, canDeleteOrders } from "@/utils/permissions/entity-permissions";

interface OrderScheduleTableRowSwipeProps {
  scheduleId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function OrderScheduleTableRowSwipe({
  // scheduleId removed
  onEdit,
  onDelete,
  onPress,
  children,
  isOpen: _isOpen = false,
  // onOpenChange removed
}: OrderScheduleTableRowSwipeProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const canEdit = canEditOrders(user);
  const canDelete = canDeleteOrders(user);

  // Return early if no permissions
  if (!canEdit && !canDelete) {
    return (
      <Pressable onPress={onPress} style={styles.content}>
        {children}
      </Pressable>
    );
  }

  const rightActions: SwipeAction[] = [];

  if (onEdit && canEdit) {
    rightActions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: colors.primary,
      onPress: onEdit,
      closeOnPress: true,
    });
  }

  if (onDelete && canDelete) {
    rightActions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: colors.destructive,
      onPress: onDelete,
      closeOnPress: true,
    });
  }

  if (rightActions.length === 0) {
    return (
      <Pressable onPress={onPress} style={styles.content}>
        {children}
      </Pressable>
    );
  }

  return (
    <ReanimatedSwipeableRow
      rightActions={rightActions}
      enabled={true}
      containerStyle={styles.container}
    >
      <Pressable onPress={onPress} style={styles.content}>
        {children}
      </Pressable>
    </ReanimatedSwipeableRow>
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
