import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { SwipeableRow } from "@/components/ui/swipeable-row";

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
  scheduleId,
  onEdit,
  onDelete,
  onPress,
  children,
  isOpen = false,
  onOpenChange,
}: OrderScheduleTableRowSwipeProps) {
  const { colors } = useTheme();

  const renderRightActions = () => (
    <View style={styles.actionsContainer}>
      {onEdit && (
        <Pressable
          style={[styles.action, { backgroundColor: colors.primary }]}
          onPress={onEdit}
        >
          <IconEdit size={20} color="white" />
        </Pressable>
      )}
      {onDelete && (
        <Pressable
          style={[styles.action, { backgroundColor: colors.destructive }]}
          onPress={onDelete}
        >
          <IconTrash size={20} color="white" />
        </Pressable>
      )}
    </View>
  );

  return (
    <SwipeableRow
      rightActions={renderRightActions()}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Pressable onPress={onPress} style={styles.content}>
        {children}
      </Pressable>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  action: {
    width: 80,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
