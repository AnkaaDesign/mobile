import React, { useCallback, useRef } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing } from "@/constants/design-system";

interface CustomerTableRowSwipeProps {
  customerId: string;
  customerName: string;
  onEdit?: (customerId: string) => void;
  onDelete?: (customerId: string) => void;
  children: (isActive: boolean) => React.ReactNode;
  disabled?: boolean;
}

export const CustomerTableRowSwipe = React.memo<CustomerTableRowSwipeProps>(({ customerId, customerName, onEdit, onDelete, children, disabled = false }) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow } = useSwipeRow();
  const swipeableRef = useRef<any>(null);
  const isActive = activeRowId === customerId;

  const handleSwipeOpen = useCallback(() => {
    if (activeRowId && activeRowId !== customerId) {
      closeActiveRow();
    }
    setActiveRowId(customerId);
  }, [activeRowId, customerId, setActiveRowId, closeActiveRow]);

  const handleSwipeClose = useCallback(() => {
    if (activeRowId === customerId) {
      setActiveRowId(null);
    }
  }, [activeRowId, customerId, setActiveRowId]);

  const handleEdit = useCallback(() => {
    closeActiveRow();
    if (onEdit) {
      onEdit(customerId);
    }
  }, [customerId, onEdit, closeActiveRow]);

  const handleDelete = useCallback(() => {
    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir o cliente "${customerName}"?`, [
      {
        text: "Cancelar",
        style: "cancel",
        onPress: () => closeActiveRow(),
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          closeActiveRow();
          if (onDelete) {
            onDelete(customerId);
          }
        },
      },
    ]);
  }, [customerId, customerName, onDelete, closeActiveRow]);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.actionsContainer}>
        {onEdit && (
          <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleEdit}>
            <Icon name="edit" size="md" color={colors.primaryForeground} />
            <ThemedText style={[styles.actionText, { color: colors.primaryForeground }]}>Editar</ThemedText>
          </Pressable>
        )}
        {onDelete && (
          <Pressable style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.destructive }]} onPress={handleDelete}>
            <Icon name="trash" size="md" color={colors.destructiveForeground} />
            <ThemedText style={[styles.actionText, { color: colors.destructiveForeground }]}>Excluir</ThemedText>
          </Pressable>
        )}
      </View>
    ),
    [colors, handleEdit, handleDelete, onEdit, onDelete],
  );

  React.useEffect(() => {
    if (activeRowId !== customerId && swipeableRef.current) {
      swipeableRef.current.close();
    }
  }, [activeRowId, customerId]);

  if (disabled || (!onEdit && !onDelete)) {
    return <>{children(false)}</>;
  }

  return (
    <ReanimatedSwipeableRow
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      onSwipeableClose={handleSwipeClose}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      {children(isActive)}
    </ReanimatedSwipeableRow>
  );
});

CustomerTableRowSwipe.displayName = "CustomerTableRowSwipe";

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  actionButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  deleteButton: {
    marginLeft: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
