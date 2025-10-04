import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import { IconTrash } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

interface NotificationTableRowSwipeProps {
  notificationId: string;
  notificationTitle: string;
  onDelete?: (notificationId: string) => void;
  disabled?: boolean;
  children: (isActive: boolean) => React.ReactNode;
}

export function NotificationTableRowSwipe({ notificationId, notificationTitle, onDelete, disabled = false, children }: NotificationTableRowSwipeProps) {
  const { colors } = useTheme();

  const handleDelete = () => {
    Alert.alert("Excluir notificação", `Tem certeza que deseja excluir a notificação "${notificationTitle}"?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => onDelete?.(notificationId),
      },
    ]);
  };

  const rightActions = onDelete
    ? [
        {
          key: "delete",
          label: "Excluir",
          icon: <IconTrash size={20} color="white" />,
          backgroundColor: colors.destructive,
          onPress: handleDelete,
        },
      ]
    : [];

  return (
    <ReanimatedSwipeableRow
      id={notificationId}
      rightActions={rightActions}
      disabled={disabled}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
    >
      {children}
    </ReanimatedSwipeableRow>
  );
}

const styles = StyleSheet.create({});
