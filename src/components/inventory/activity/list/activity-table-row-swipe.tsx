import React, { memo } from "react";
import { Alert, View } from "react-native";
import { IconTrash } from "@tabler/icons-react-native";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import type { SwipeAction } from "@/components/ui/reanimated-swipeable-row";

interface ActivityTableRowSwipeProps {
  activityId: string;
  activityDescription: string;
  onDelete: () => void;
  disabled: boolean;
  children: (isActive: boolean) => React.ReactNode;
}

export const ActivityTableRowSwipe = memo(({
  activityId,
  activityDescription,
  onDelete,
  disabled,
  children,
}: ActivityTableRowSwipeProps) => {
  const handleDelete = () => {
    Alert.alert(
      "Excluir Movimentação",
      `Deseja excluir a movimentação "${activityDescription}"? Esta ação é irreversível e afetará o estoque.`,
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

  const rightActions: SwipeAction[] = [
    {
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: "#ef4444",
      color: "white",
      onPress: handleDelete,
      closeOnPress: true,
    },
  ];

  if (disabled) {
    return <View>{children(false)}</View>;
  }

  return (
    <ReanimatedSwipeableRow
      key={activityId}
      rightActions={rightActions}
      enabled={!disabled}
    >
      {children(false)}
    </ReanimatedSwipeableRow>
  );
});

ActivityTableRowSwipe.displayName = "ActivityTableRowSwipe";