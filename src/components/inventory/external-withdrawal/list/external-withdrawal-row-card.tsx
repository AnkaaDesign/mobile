import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ExternalWithdrawal } from '@/types';
import { useTheme } from '@/lib/theme';
import { formatDate, formatCurrency } from '@/utils';
import { ExternalWithdrawalStatusBadge } from '../common/external-withdrawal-status-badge';
import { Badge } from '@/components/ui/badge';
import { EXTERNAL_WITHDRAWAL_TYPE, EXTERNAL_WITHDRAWAL_TYPE_LABELS } from '@/constants';
import { Icon } from '@/components/ui/icon';

interface ExternalWithdrawalRowCardProps {
  withdrawal: ExternalWithdrawal;
  onPress?: (withdrawal: ExternalWithdrawal) => void;
  isActive?: boolean;
}

export const ExternalWithdrawalRowCard = React.memo<ExternalWithdrawalRowCardProps>(
  ({ withdrawal, onPress, isActive = false }) => {
    const { colors } = useTheme();
    const router = useRouter();

    // Calculate total value for chargeable withdrawals
    const totalValue = withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && withdrawal.items
      ? withdrawal.items.reduce((sum, item) => {
          const price = item.price || item.unitPrice || 0;
          return sum + item.withdrawedQuantity * price;
        }, 0)
      : 0;

    // Count items
    const itemCount = withdrawal.items?.length || 0;

    const handlePress = () => {
      if (onPress) {
        onPress(withdrawal);
      } else {
        router.push(`/estoque/retiradas-externas/detalhes/${withdrawal.id}`);
      }
    };

    const getTypeVariant = (type: string) => {
      switch (type) {
        case EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE:
          return 'default';
        case EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE:
          return 'destructive';
        case EXTERNAL_WITHDRAWAL_TYPE.COURTESY:
          return 'secondary';
        default:
          return 'default';
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.container,
          {
            backgroundColor: isActive ? colors.muted : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Header: Withdrawer Name and Status */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="user" size={16} color={colors.mutedForeground} />
            <Text
              style={[styles.withdrawerName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {withdrawal.withdrawerName}
            </Text>
          </View>
          <ExternalWithdrawalStatusBadge status={withdrawal.status} size="sm" />
        </View>

        {/* Type and Item Count */}
        <View style={styles.row}>
          <Badge variant={getTypeVariant(withdrawal.type)} size="sm">
            {EXTERNAL_WITHDRAWAL_TYPE_LABELS[withdrawal.type]}
          </Badge>

          <View style={styles.itemCountContainer}>
            <Icon name="package" size={14} color={colors.mutedForeground} />
            <Text style={[styles.itemCount, { color: colors.mutedForeground }]}>
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </Text>
          </View>
        </View>

        {/* Total Value (for chargeable) */}
        {withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && totalValue > 0 && (
          <View style={styles.row}>
            <View style={styles.valueContainer}>
              <Icon name="currency-real" size={14} color={colors.mutedForeground} />
              <Text style={[styles.value, { color: colors.foreground }]}>
                {formatCurrency(totalValue)}
              </Text>
            </View>
          </View>
        )}

        {/* Notes (if available) */}
        {withdrawal.notes && (
          <View style={styles.notesContainer}>
            <Text
              style={[styles.notes, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {withdrawal.notes}
            </Text>
          </View>
        )}

        {/* Footer: Date */}
        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <Icon name="calendar" size={12} color={colors.mutedForeground} />
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {formatDate(withdrawal.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

ExternalWithdrawalRowCard.displayName = 'ExternalWithdrawalRowCard';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  withdrawerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  notesContainer: {
    paddingTop: 4,
  },
  notes: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 12,
  },
});
