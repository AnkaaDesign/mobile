import React from 'react';
import { StyleSheet } from 'react-native';
import { IconAlertTriangle, IconTrash, IconCheck } from '@tabler/icons-react-native';
import { StandardModal } from '@/components/ui/standard-modal';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/lib/theme';
import { fontSize, lineHeight } from '@/constants/design-system';

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

// StandardModal's header icon accepts optional size/color (Tabler-style). The
// public `icon` prop above keeps its stricter required-prop signature for
// backwards compatibility, so we widen at the call site.
type HeaderIcon = React.ComponentType<{ size?: number; color?: string }>;

/**
 * ConfirmationDialog Component
 *
 * A reusable confirmation dialog for actions that require user confirmation.
 * Supports multiple variants (default, destructive, warning, success) with
 * appropriate styling and icons.
 *
 * Standardized onto the canonical StandardModal (bonus-modal rules).
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
          confirmVariant: 'destructive' as const,
        };
      case 'warning':
        return {
          icon: icon || IconAlertTriangle,
          iconColor: '#f59e0b', // amber-500
          confirmVariant: 'default' as const,
        };
      case 'success':
        return {
          icon: icon || IconCheck,
          iconColor: '#10b981', // emerald-500
          confirmVariant: 'default' as const,
        };
      default:
        return {
          icon: icon || IconAlertTriangle,
          iconColor: colors.primary,
          confirmVariant: 'default' as const,
        };
    }
  };

  const config = getVariantConfig();

  return (
    <StandardModal
      visible={open}
      onClose={() => onOpenChange(false)}
      title={title}
      icon={showIcon ? (config.icon as HeaderIcon) : undefined}
      iconColor={config.iconColor}
      actions={[
        { label: cancelText, variant: 'outline', onPress: handleCancel, disabled: loading },
        {
          label: confirmText,
          variant: config.confirmVariant,
          onPress: handleConfirm,
          disabled: loading,
          loading,
        },
      ]}
    >
      {description ? (
        <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
          {description}
        </ThemedText>
      ) : null}
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
});
