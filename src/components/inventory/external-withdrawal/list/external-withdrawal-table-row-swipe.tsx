import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Alert, StyleProp } from 'react-native';
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { useSwipeRow } from '@/contexts/swipe-row-context';
import { ReanimatedSwipeableRow } from '@/components/ui/reanimated-swipeable-row';
import { EXTERNAL_WITHDRAWAL_STATUS } from '@/constants';

const ACTION_WIDTH = 80;

interface ExternalWithdrawalTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  withdrawalId: string;
  withdrawalName: string;
  withdrawalStatus: EXTERNAL_WITHDRAWAL_STATUS;
  onView?: (withdrawalId: string) => void;
  onEdit?: (withdrawalId: string) => void;
  onDelete?: (withdrawalId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const ExternalWithdrawalTableRowSwipeComponent = ({
  children,
  withdrawalId,
  withdrawalName,
  withdrawalStatus,
  onView,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: ExternalWithdrawalTableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === 'function' ? children(false) : children}</View>;
  }

  const isThisRowActive = activeRowId === withdrawalId;

  // Watch for changes in activeRowId to close this row if another row becomes active
  useEffect(() => {
    if (!isThisRowActive && activeRowId !== null) {
      // Another row became active, close this one immediately
      swipeableRef.current?.close();
    }
  }, [activeRowId, isThisRowActive]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      // Clean up if this row was active
      if (activeRowId === withdrawalId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, withdrawalId, setActiveRowId]);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir a retirada de "${withdrawalName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            swipeableRef.current?.close();
            setTimeout(() => onDelete?.(withdrawalId), 300);
          },
        },
      ]
    );
  }, [withdrawalId, withdrawalName, onDelete]);

  // Only show edit action for PENDING status
  const canEdit = withdrawalStatus === EXTERNAL_WITHDRAWAL_STATUS.PENDING;

  // Build actions array
  // View button uses blue (#007AFF)
  // Edit button uses green (#34C759) - only for PENDING
  // Delete button uses red (#FF3B30)
  const rightActions: SwipeAction[] = [
    ...(onView
      ? [
          {
            key: 'view',
            label: 'Ver',
            icon: <IconEye size={20} color="white" />,
            backgroundColor: '#007AFF', // blue
            onPress: () => onView(withdrawalId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onEdit && canEdit
      ? [
          {
            key: 'edit',
            label: 'Editar',
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: '#34C759', // green
            onPress: () => onEdit(withdrawalId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            key: 'delete',
            label: 'Excluir',
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: '#FF3B30', // red
            onPress: handleDeletePress,
            closeOnPress: false, // Don't close automatically for delete confirmation
          },
        ]
      : []),
  ];

  const handleWillOpen = useCallback(
    (_direction: 'left' | 'right') => {
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      // Close any other active row first
      if (activeRowId && activeRowId !== withdrawalId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, withdrawalId, closeActiveRow, closeOpenRow]
  );

  const handleOpen = useCallback(
    (_direction: 'left' | 'right', swipeable: Swipeable) => {
      setActiveRowId(withdrawalId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [withdrawalId, setActiveRowId, setOpenRow]
  );

  const handleClose = useCallback(() => {
    // Clear any auto-close timer
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    // Clear active row state if this was the active row
    if (isThisRowActive) {
      setActiveRowId(null);
    }
  }, [isThisRowActive, setActiveRowId]);

  // Ensure children is always defined and is a valid React element or function
  if (
    !children ||
    (typeof children !== 'object' &&
      typeof children !== 'string' &&
      typeof children !== 'number' &&
      typeof children !== 'function')
  ) {
    console.warn(
      'ExternalWithdrawalTableRowSwipe: children prop is invalid or undefined:',
      typeof children
    );
    return <View style={style} />;
  }

  if (disabled || rightActions.length === 0) {
    return <View style={style}>{typeof children === 'function' ? children(false) : children}</View>;
  }

  return (
    <ReanimatedSwipeableRow
      ref={swipeableRef}
      rightActions={rightActions}
      enabled={!disabled}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onWillOpen={handleWillOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      containerStyle={StyleSheet.flatten([styles.container, style])}
      childrenContainerStyle={styles.rowContainer}
      actionWidth={ACTION_WIDTH}
    >
      <View style={{ flex: 1 }}>
        {typeof children === 'function' ? children(isThisRowActive) : children}
      </View>
    </ReanimatedSwipeableRow>
  );
};

// Set displayName before memoization for React 19 compatibility
ExternalWithdrawalTableRowSwipeComponent.displayName = 'ExternalWithdrawalTableRowSwipe';

export const ExternalWithdrawalTableRowSwipe = React.memo(ExternalWithdrawalTableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
