import React, { useCallback, useRef, ReactNode } from "react";
import { View, StyleSheet, Alert, Animated, Dimensions } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { canEditCuts, canDeleteCuts } from "@/utils/permissions/entity-permissions";

interface CutsTableRowSwipeProps {
  cutId: string;
  cutName: string;
  onEdit?: (cutId: string) => void;
  onDelete?: (cutId: string) => void;
  onRequest?: (cutId: string) => void;
  children: (isActive: boolean) => ReactNode;
  disabled?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_ACTION_WIDTH = 80;

export const CutsTableRowSwipe: React.FC<CutsTableRowSwipeProps> = ({
  cutId,
  cutName,
  onEdit,
  onDelete,
  onRequest,
  children,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const { activeRowId, setActiveRowId, closeActiveRow } = useSwipeRow();
  const isActive = activeRowId === cutId;
  const { user } = useAuth();
  const canEdit = canEditCuts(user);
  const canDelete = canDeleteCuts(user);

  // Return early if no permissions
  if (!canEdit && !canDelete) {
    return <>{children(isActive)}</>;
  }

  const handleEdit = useCallback(() => {
    swipeableRef.current?.close();
    onEdit?.(cutId);
  }, [cutId, onEdit]);

  const handleDelete = useCallback(() => {
    Alert.alert("Excluir Corte", `Tem certeza que deseja excluir "${cutName}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          swipeableRef.current?.close();
          onDelete?.(cutId);
        },
      },
    ]);
  }, [cutId, cutName, onDelete]);

  const handleRequest = useCallback(() => {
    swipeableRef.current?.close();
    onRequest?.(cutId);
  }, [cutId, onRequest]);

  const handleSwipeOpen = useCallback(() => {
    // Close previously active row if different
    if (activeRowId && activeRowId !== cutId) {
      closeActiveRow();
    }
    setActiveRowId(cutId);
  }, [cutId, activeRowId, setActiveRowId, closeActiveRow]);

  const handleSwipeClose = useCallback(() => {
    if (activeRowId === cutId) {
      setActiveRowId(null);
    }
  }, [cutId, activeRowId, setActiveRowId]);

  // Close this row when another becomes active
  React.useEffect(() => {
    if (activeRowId !== null && activeRowId !== cutId) {
      swipeableRef.current?.close();
    }
  }, [activeRowId, cutId]);

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      // Calculate number of actions
      const actionsCount = [onRequest, onEdit, onDelete].filter(Boolean).length;
      const totalWidth = actionsCount * SWIPE_ACTION_WIDTH;

      const trans = dragX.interpolate({
        inputRange: [-totalWidth, 0],
        outputRange: [0, totalWidth],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              transform: [{ translateX: trans }],
              width: totalWidth,
            },
          ]}
        >
          {onRequest && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.info || "#3b82f6" }]} onPress={handleRequest} activeOpacity={0.7}>
              <Icon name="scissors" size="md" color="white" />
              <ThemedText style={styles.actionText}>Solicitar</ThemedText>
            </TouchableOpacity>
          )}
          {onEdit && canEdit && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleEdit} activeOpacity={0.7}>
              <Icon name="edit" size="md" color="white" />
              <ThemedText style={styles.actionText}>Editar</ThemedText>
            </TouchableOpacity>
          )}
          {onDelete && canDelete && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.destructive }]} onPress={handleDelete} activeOpacity={0.7}>
              <Icon name="trash" size="md" color="white" />
              <ThemedText style={styles.actionText}>Excluir</ThemedText>
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    },
    [colors, onRequest, onEdit, onDelete, handleRequest, handleEdit, handleDelete],
  );

  if (disabled || (!onEdit && !onDelete && !onRequest)) {
    return <View style={styles.container}>{children(isActive)}</View>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      onSwipeableClose={handleSwipeClose}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={styles.swipeableContainer}
      childrenContainerStyle={styles.childrenContainer}
      enableTrackpadTwoFingerGesture
    >
      {children(isActive)}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  swipeableContainer: {
    width: "100%",
  },
  childrenContainer: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  actionButton: {
    width: SWIPE_ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    gap: spacing.xxs,
  },
  actionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
