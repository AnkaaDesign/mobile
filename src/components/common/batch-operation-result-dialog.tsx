import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react-native';
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
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/design-system';

export interface BatchOperationResult {
  /** Whether the overall operation was successful */
  success: boolean;
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  failedCount: number;
  /** Array of error messages for failed operations */
  errors: string[];
  /** Optional custom success message */
  successMessage?: string;
  /** Optional custom failure message */
  failureMessage?: string;
}

export interface BatchOperationResultDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Result data from the batch operation */
  result: BatchOperationResult | null;
  /** Callback when user confirms/closes the dialog */
  onConfirm?: () => void;
  /** Custom title for the dialog */
  title?: string;
  /** Custom description for the dialog */
  description?: string;
  /** Custom text for the confirm button */
  confirmText?: string;
  /** What type of items were processed (e.g., "pedidos", "itens", "registros") */
  itemType?: string;
  /** Singular form of item type (e.g., "pedido", "item", "registro") */
  itemTypeSingular?: string;
}

/**
 * BatchOperationResultDialog Component
 *
 * A generic dialog component for displaying the results of batch operations.
 * Shows success/failure counts, detailed error messages, and provides a
 * clear summary of the operation outcome.
 *
 * @example
 * ```tsx
 * // For order batch creation
 * <BatchOperationResultDialog
 *   open={showResultDialog}
 *   onOpenChange={setShowResultDialog}
 *   result={batchResult}
 *   itemType="pedidos"
 *   itemTypeSingular="pedido"
 *   onConfirm={() => router.back()}
 * />
 *
 * // For generic batch operation
 * <BatchOperationResultDialog
 *   open={showResultDialog}
 *   onOpenChange={setShowResultDialog}
 *   result={batchResult}
 *   title="Resultado da Importação"
 *   description="Resumo da importação de dados"
 * />
 * ```
 */
export function BatchOperationResultDialog({
  open,
  onOpenChange,
  result,
  onConfirm,
  title = 'Resultado da Operação em Lote',
  description = 'Resumo da operação',
  confirmText = 'Entendi',
  itemType = 'itens',
  itemTypeSingular = 'item',
}: BatchOperationResultDialogProps) {
  const { colors } = useTheme();

  if (!result) {
    return null;
  }

  const { success, successCount, failedCount, errors, successMessage, failureMessage } = result;
  const total = successCount + failedCount;

  const getSummaryIcon = () => {
    if (success) {
      return <IconCheck size={16} color="#ffffff" />;
    }
    if (failedCount > 0 && successCount > 0) {
      return <IconAlertTriangle size={16} color="#ffffff" />;
    }
    return <IconX size={16} color="#ffffff" />;
  };

  const getSummaryIconStyle = () => {
    if (success) {
      return [styles.summaryIcon, styles.summaryIconSuccess];
    }
    if (failedCount > 0 && successCount > 0) {
      return [styles.summaryIcon, styles.summaryIconWarning];
    }
    return [styles.summaryIcon, styles.summaryIconError];
  };

  const getSummaryTitle = () => {
    if (success) {
      return 'Operação Concluída com Sucesso';
    }
    if (failedCount > 0 && successCount > 0) {
      return 'Operação Parcialmente Concluída';
    }
    return 'Operação Falhou';
  };

  const getSummaryMessage = () => {
    if (successMessage && failedCount === 0) {
      return successMessage;
    }
    if (failureMessage && successCount === 0) {
      return failureMessage;
    }

    if (failedCount === 0) {
      return `${successCount} ${successCount === 1 ? itemTypeSingular : itemType} processado${successCount === 1 ? '' : 's'} com sucesso.`;
    }
    if (successCount === 0) {
      return `Falha ao processar ${failedCount} ${failedCount === 1 ? itemTypeSingular : itemType}.`;
    }
    return `${successCount} de ${total} ${itemType} processados com sucesso. ${failedCount} ${failedCount === 1 ? 'falhou' : 'falharam'}.`;
  };

  const getSummaryCardStyle = () => {
    if (success) {
      return [styles.summaryCard, { backgroundColor: '#dcfce7', borderColor: '#22c55e' }];
    }
    if (failedCount > 0 && successCount > 0) {
      return [styles.summaryCard, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }];
    }
    return [styles.summaryCard, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }];
  };

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const styles = StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    summaryCard: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    summaryIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryIconSuccess: {
      backgroundColor: '#22c55e', // green-500
    },
    summaryIconError: {
      backgroundColor: '#ef4444', // red-500
    },
    summaryIconWarning: {
      backgroundColor: '#f59e0b', // amber-500
    },
    summaryText: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
      color: colors.foreground,
    },
    summaryMessage: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      marginTop: spacing.xs,
    },
    statsContainer: {
      gap: spacing.xs,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    statLabel: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
    },
    statValue: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.foreground,
    },
    errorSection: {
      marginTop: spacing.md,
    },
    errorTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    errorList: {
      maxHeight: 200,
      backgroundColor: colors.muted,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    errorItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    errorBullet: {
      marginTop: 4,
    },
    errorText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.destructive,
      lineHeight: 18,
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <View style={styles.container}>
          {/* Summary Card */}
          <View style={getSummaryCardStyle()}>
            <View style={styles.summaryRow}>
              <View style={getSummaryIconStyle()}>{getSummaryIcon()}</View>
              <ThemedText style={styles.summaryText}>{getSummaryTitle()}</ThemedText>
            </View>
            <ThemedText style={styles.summaryMessage}>{getSummaryMessage()}</ThemedText>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Total processado:</ThemedText>
              <ThemedText style={styles.statValue}>{total}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Sucesso:</ThemedText>
              <ThemedText style={[styles.statValue, { color: '#22c55e' }]}>
                {successCount}
              </ThemedText>
            </View>
            {failedCount > 0 && (
              <View style={styles.statRow}>
                <ThemedText style={styles.statLabel}>Falharam:</ThemedText>
                <ThemedText style={[styles.statValue, { color: '#ef4444' }]}>
                  {failedCount}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Error Details */}
          {errors.length > 0 && (
            <View style={styles.errorSection}>
              <ThemedText style={styles.errorTitle}>Detalhes dos Erros:</ThemedText>
              <ScrollView style={styles.errorList} nestedScrollEnabled>
                {errors.map((error, index) => (
                  <View key={index} style={styles.errorItem}>
                    <IconX size={12} color={colors.destructive} style={styles.errorBullet} />
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <DialogFooter>
          <Button variant="default" onPress={handleConfirm}>
            <ThemedText style={{ color: '#ffffff' }}>{confirmText}</ThemedText>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
