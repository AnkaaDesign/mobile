import React, { useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { SwipeRow } from "react-native-swipe-list-view";
import { IconButton } from "@/components/ui/icon-button";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing } from "@/constants/design-system";
import { TASK_STATUS } from '../../../../constants';

interface TaskTableRowSwipeProps {
  taskId: string;
  taskStatus: TASK_STATUS;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: TASK_STATUS) => void;
  children: React.ReactNode;
}

export const TaskTableRowSwipe: React.FC<TaskTableRowSwipeProps> = ({
  taskId,
  taskStatus,
  onEdit,
  onDelete,
  onStatusChange,
  children,
}) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId } = useSwipeRow();
  const rowRef = useRef<SwipeRow<any>>(null);

  React.useEffect(() => {
    if (activeRowId !== taskId && rowRef.current) {
      rowRef.current.closeRow();
    }
  }, [activeRowId, taskId]);

  const handleSwipeOpen = () => {
    setActiveRowId(taskId);
  };

  const handleEdit = () => {
    rowRef.current?.closeRow();
    onEdit?.();
  };

  const handleDelete = () => {
    rowRef.current?.closeRow();
    onDelete?.();
  };

  const handleStatusChange = (status: TASK_STATUS) => {
    rowRef.current?.closeRow();
    onStatusChange?.(status);
  };

  const getStatusActions = () => {
    const actions = [];

    switch (taskStatus) {
      case TASK_STATUS.PENDING:
        actions.push(
          <IconButton
            key="start"
            name="play"
            size="sm"
            variant="default"
            style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.success }])}
            onPress={() => handleStatusChange(TASK_STATUS.IN_PRODUCTION)}
          />
        );
        break;
      case TASK_STATUS.IN_PRODUCTION:
        actions.push(
          <IconButton
            key="hold"
            name="pause"
            size="sm"
            variant="default"
            style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.warning }])}
            onPress={() => handleStatusChange(TASK_STATUS.ON_HOLD)}
          />,
          <IconButton
            key="complete"
            name="check"
            size="sm"
            variant="default"
            style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.success }])}
            onPress={() => handleStatusChange(TASK_STATUS.COMPLETED)}
          />
        );
        break;
      case TASK_STATUS.ON_HOLD:
        actions.push(
          <IconButton
            key="resume"
            name="play"
            size="sm"
            variant="default"
            style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.success }])}
            onPress={() => handleStatusChange(TASK_STATUS.IN_PRODUCTION)}
          />
        );
        break;
      default:
        break;
    }

    if (taskStatus !== TASK_STATUS.COMPLETED && taskStatus !== TASK_STATUS.CANCELLED) {
      actions.push(
        <IconButton
          key="cancel"
          name="x"
          size="sm"
          variant="default"
          style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
          onPress={() => handleStatusChange(TASK_STATUS.CANCELLED)}
        />
      );
    }

    return actions;
  };

  return (
    <SwipeRow
      ref={rowRef}
      rightOpenValue={-240}
      stopRightSwipe={-240}
      disableRightSwipe={false}
      onRowOpen={handleSwipeOpen}
      preview={false}
      previewOpenValue={-40}
    >
      <View style={StyleSheet.flatten([styles.rowBack, { backgroundColor: colors.muted }])}>
        <View style={styles.rightActions}>
          {getStatusActions()}
          {onEdit && (
            <IconButton
              name="edit"
              size="sm"
              variant="default"
              style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
              onPress={handleEdit}
            />
          )}
          {onDelete && (
            <IconButton
              name="trash"
              size="sm"
              variant="default"
              style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
              onPress={handleDelete}
            />
          )}
        </View>
      </View>
      <View>{children}</View>
    </SwipeRow>
  );
};

const styles = StyleSheet.create({
  rowBack: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: spacing.sm,
  },
  rightActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
