import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react-native';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useTheme } from '@/lib/theme';
import type { BatchOperationResult } from '../form/order-form-utils-enhanced';

interface OrderBatchResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BatchOperationResult | null;
  onConfirm?: () => void;
}

/**
 * Dialog to display batch operation results
 * Shows success/failure counts and detailed error messages
 */
export const OrderBatchResultDialog: React.FC<OrderBatchResultDialogProps> = ({ open, onOpenChange, result, onConfirm }) => {
  const theme = useTheme();

  if (!result) {
    return null;
  }

  const { success, successCount, failedCount, errors } = result;
  const total = successCount + failedCount;

  const styles = StyleSheet.create({
    container: {
      gap: theme.spacing.md,
    },
    summaryCard: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: success ? theme.colors.success + '20' : failedCount > 0 && successCount > 0 ? theme.colors.warning + '20' : theme.colors.error + '20',
      borderWidth: 1,
      borderColor: success ? theme.colors.success : failedCount > 0 && successCount > 0 ? theme.colors.warning : theme.colors.error,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    summaryIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryIconSuccess: {
      backgroundColor: theme.colors.success,
    },
    summaryIconError: {
      backgroundColor: theme.colors.error,
    },
    summaryIconWarning: {
      backgroundColor: theme.colors.warning,
    },
    summaryText: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold as any,
      color: theme.colors.text,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    statLabel: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    statValue: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium as any,
      color: theme.colors.text,
    },
    errorSection: {
      marginTop: theme.spacing.md,
    },
    errorTitle: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    errorList: {
      maxHeight: 200,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    errorItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
    },
    errorBullet: {
      marginTop: 4,
    },
    errorText: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      color: theme.colors.error,
      lineHeight: 18,
    },
  });

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
      return styles.summaryIconSuccess;
    }
    if (failedCount > 0 && successCount > 0) {
      return styles.summaryIconWarning;
    }
    return styles.summaryIconError;
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
    if (failedCount === 0) {
      return `${successCount} ${successCount === 1 ? 'pedido criado' : 'pedidos criados'} com sucesso.`;
    }
    if (successCount === 0) {
      return `Falha ao criar ${failedCount} ${failedCount === 1 ? 'pedido' : 'pedidos'}.`;
    }
    return `${successCount} de ${total} pedidos criados com sucesso. ${failedCount} ${failedCount === 1 ? 'falhou' : 'falharam'}.`;
  };

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Resultado da Operação em Lote</DialogTitle>
          <DialogDescription>Resumo da criação de pedidos</DialogDescription>
        </DialogHeader>

        <View style={styles.container}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryIcon, getSummaryIconStyle()]}>{getSummaryIcon()}</View>
              <ThemedText style={styles.summaryText}>{getSummaryTitle()}</ThemedText>
            </View>
            <ThemedText style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
              {getSummaryMessage()}
            </ThemedText>
          </View>

          {/* Statistics */}
          <View>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Total de pedidos processados:</ThemedText>
              <ThemedText style={styles.statValue}>{total}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Criados com sucesso:</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.colors.success }]}>{successCount}</ThemedText>
            </View>
            {failedCount > 0 && (
              <View style={styles.statRow}>
                <ThemedText style={styles.statLabel}>Falharam:</ThemedText>
                <ThemedText style={[styles.statValue, { color: theme.colors.error }]}>{failedCount}</ThemedText>
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
                    <IconX size={12} color={theme.colors.error} style={styles.errorBullet} />
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <DialogFooter>
          <Button variant="default" onPress={handleConfirm}>
            <ThemedText style={{ color: '#ffffff' }}>Entendi</ThemedText>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
