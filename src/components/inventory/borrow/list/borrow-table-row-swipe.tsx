import React, { memo } from "react";
import { Alert, View } from "react-native";
import { IconTrash, IconCheck, IconAlertTriangle } from "@tabler/icons-react-native";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import type { SwipeAction } from "@/components/ui/reanimated-swipeable-row";
import { BORROW_STATUS } from '../../../../constants';

interface BorrowTableRowSwipeProps {
  borrowId: string;
  borrowDescription: string;
  status: string;
  onReturn: () => void;
  onMarkAsLost: () => void;
  onDelete: () => void;
  disabled: boolean;
  children: (isActive: boolean) => React.ReactNode;
}

export const BorrowTableRowSwipe = memo(({
  borrowId,
  borrowDescription,
  status,
  onReturn,
  onMarkAsLost,
  onDelete,
  disabled,
  children,
}: BorrowTableRowSwipeProps) => {
  const handleReturn = () => {
    Alert.alert(
      "Devolver Item",
      `Confirma a devolução de "${borrowDescription}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Devolver",
          style: "default",
          onPress: onReturn,
        },
      ]
    );
  };

  const handleMarkAsLost = () => {
    Alert.alert(
      "Marcar como Perdido",
      `Deseja marcar "${borrowDescription}" como perdido? Esta ação é irreversível.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como Perdido",
          style: "destructive",
          onPress: onMarkAsLost,
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Empréstimo",
      `Deseja excluir o empréstimo de "${borrowDescription}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: onDelete,
        },
      ]
    );
  };

  const rightActions: SwipeAction[] = [];

  if (status === BORROW_STATUS.ACTIVE) {
    rightActions.push({
      key: "return",
      label: "Devolver",
      icon: <IconCheck size={20} color="white" />,
      backgroundColor: "#10b981",
      color: "white",
      onPress: handleReturn,
      closeOnPress: true,
    });
    rightActions.push({
      key: "lost",
      label: "Perdido",
      icon: <IconAlertTriangle size={20} color="white" />,
      backgroundColor: "#f59e0b",
      color: "white",
      onPress: handleMarkAsLost,
      closeOnPress: true,
    });
  }

  rightActions.push({
    key: "delete",
    label: "Excluir",
    icon: <IconTrash size={20} color="white" />,
    backgroundColor: "#ef4444",
    color: "white",
    onPress: handleDelete,
    closeOnPress: true,
  });

  if (disabled) {
    return <View>{children(false)}</View>;
  }

  return (
    <ReanimatedSwipeableRow
      key={borrowId}
      rightActions={rightActions}
      enabled={!disabled}
    >
      {children(false)}
    </ReanimatedSwipeableRow>
  );
});

BorrowTableRowSwipe.displayName = "BorrowTableRowSwipe";