/**
 * Quote Section Component
 * Shows a navigation link to the separate quote screen instead of embedding the full selector.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { FormCard } from '@/components/ui/form-section';
import { Badge } from '@/components/ui/badge';
import { ThemedText } from '@/components/ui/themed-text';
import { canViewQuote } from '@/utils/permissions/quote-permissions';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import { formatCurrency } from '@/utils';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/design-system';
import { IconFileInvoice, IconChevronRight } from '@tabler/icons-react-native';

interface PricingSectionProps {
  isSubmitting?: boolean;
  taskId?: string;
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  BUDGET_APPROVED: 'Orçamento Aprovado',
  VERIFIED_BY_FINANCIAL: 'Verificado pelo Financeiro',
  INTERNAL_APPROVED: 'Aprovado Internamente',
  UPCOMING: 'A Vencer',
  PARTIAL: 'Parcial',
  SETTLED: 'Liquidado',
  DUE: 'Vencido',
};

const QUOTE_STATUS_VARIANTS: Record<string, 'secondary' | 'approved' | 'rejected' | 'cancelled'> = {
  PENDING: 'secondary',
  BUDGET_APPROVED: 'approved',
  VERIFIED_BY_FINANCIAL: 'approved',
  INTERNAL_APPROVED: 'approved',
  UPCOMING: 'secondary',
  PARTIAL: 'secondary',
  SETTLED: 'approved',
  DUE: 'rejected',
};

export default function PricingSection({
  isSubmitting = false,
  taskId,
}: PricingSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  // Check if user can view quote sections
  const canViewQuoteSections = canViewQuote(user?.sector?.privileges ?? '');

  if (!canViewQuoteSections) {
    return null;
  }

  // Watch quote data from form to show summary
  const quoteData = useWatch({ control, name: 'pricing' });
  const quoteStatus = quoteData?.status;
  const quoteTotal = quoteData?.total;
  const quoteServicesCount = quoteData?.services?.length || 0;

  // Dynamic label: "Orçamento" when PENDING or no quote, "Faturamento" when BUDGET_APPROVED or later
  const isPendingOrNoQuote = !quoteStatus || quoteStatus === 'PENDING';
  const sectionLabel = isPendingOrNoQuote ? 'Orçamento' : 'Faturamento';
  const manageLabel = isPendingOrNoQuote ? 'Gerenciar Orçamento' : 'Gerenciar Faturamento';

  const handleNavigateToQuote = () => {
    if (!taskId) return;
    router.push(`/(tabs)/producao/agenda/precificacao/${taskId}` as any);
  };

  return (
    <FormCard
      title={sectionLabel}
      icon="IconFileInvoice"
    >
      <TouchableOpacity
        style={[styles.navigationCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
        onPress={handleNavigateToQuote}
        disabled={isSubmitting || !taskId}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.leftContent}>
            <IconFileInvoice size={20} color={colors.primary} />
            <View style={styles.textContent}>
              <ThemedText style={[styles.manageLabel, { color: colors.foreground }]}>
                {manageLabel}
              </ThemedText>
              {quoteServicesCount > 0 && (
                <ThemedText style={[styles.summary, { color: colors.mutedForeground }]}>
                  {quoteServicesCount} {quoteServicesCount === 1 ? 'serviço' : 'serviços'}
                  {quoteTotal != null && quoteTotal > 0 ? ` - ${formatCurrency(quoteTotal)}` : ''}
                </ThemedText>
              )}
            </View>
          </View>
          <View style={styles.rightContent}>
            {quoteStatus && (
              <Badge
                variant={QUOTE_STATUS_VARIANTS[quoteStatus] || 'secondary'}
                size="sm"
              >
                {QUOTE_STATUS_LABELS[quoteStatus] || quoteStatus}
              </Badge>
            )}
            <IconChevronRight size={18} color={colors.mutedForeground} />
          </View>
        </View>
      </TouchableOpacity>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  navigationCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  textContent: {
    flex: 1,
  },
  manageLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  summary: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
