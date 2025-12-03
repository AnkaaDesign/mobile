import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconAlertTriangle, IconTrash, IconCheck } from '@tabler/icons-react-native';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';

export type ConfirmationVariant = 'default' | 'destructive' | 'warning' | 'success';

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description?: string;
  /** Variant determines color scheme and icon */
  variant?: ConfirmationVariant;
  /** Text for confirm button */
  confirmText?: string;
  /** Text for cancel button */
  cancelText?: string;
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Whether the confirm action is loading */
  loading?: boolean;
  /** Custom icon component to override default */
  icon?: React.ComponentType<{ size: number; color: string }>;
  /** Whether to show the icon */
  showIcon?: boolean;
}

/**
 * ConfirmationDialog Component
 *
 * A reusable confirmation dialog for actions that require user confirmation.
 * Supports multiple variants (default, destructive, warning, success) with
 * appropriate styling and icons.
 *
 * @example
 * ```tsx
 * // Delete confirmation
 * <ConfirmationDialog
 *   open={showDeleteDialog}
 *   onOpenChange={setShowDeleteDialog}
 *   title="Excluir item"
 *   description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
 *   variant="destructive"
 *   confirmText="Excluir"
 *   onConfirm={handleDelete}
 * />
 *
 * // Warning confirmation
 * <ConfirmationDialog
 *   open={showWarningDialog}
 *   onOpenChange={setShowWarningDialog}
 *   title="Atenção"
 *   description="Esta ação irá afetar outros registros. Deseja continuar?"
 *   variant="warning"
 *   onConfirm={handleProceed}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  icon,
  showIcon = true,
}: ConfirmationDialogProps) {
  const { colors } = useTheme();

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getVariantConfig = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: icon || IconTrash,
          iconColor: colors.destructive,
          iconBg: colors.destructive + '20',
          confirmVariant: 'destructive' as const,
        };
      case 'warning':
        return {
          icon: icon || IconAlertTriangle,
          iconColor: '#f59e0b', // amber-500
          iconBg: '#fef3c7', // amber-100
          confirmVariant: 'default' as const,
        };
      case 'success':
        return {
          icon: icon || IconCheck,
          iconColor: '#10b981', // emerald-500
          iconBg: '#d1fae5', // emerald-100
          confirmVariant: 'default' as const,
        };
      default:
        return {
          icon: icon || IconAlertTriangle,
          iconColor: colors.primary,
          iconBg: colors.primary + '20',
          confirmVariant: 'default' as const,
        };
    }
  };

  const config = getVariantConfig();
  const IconComponent = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={true}>
        <DialogHeader>
          {showIcon && (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: config.iconBg },
              ]}
            >
              <IconComponent size={24} color={config.iconColor} />
            </View>
          )}
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={loading}
            style={styles.button}
          >
            <ThemedText>{cancelText}</ThemedText>
          </Button>
          <Button
            variant={config.confirmVariant}
            onPress={handleConfirm}
            disabled={loading}
            loading={loading}
            style={styles.button}
          >
            <ThemedText
              style={{
                color: variant === 'destructive' ? '#ffffff' : colors.foreground,
              }}
            >
              {confirmText}
            </ThemedText>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});
