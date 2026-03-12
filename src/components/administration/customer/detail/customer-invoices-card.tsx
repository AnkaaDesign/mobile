
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFileText, IconCalendar, IconCash } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatDate, formatCurrency } from "@/utils";
import { useInvoicesByCustomer } from "@/hooks/useInvoice";
import { InvoiceStatusBadge } from "@/components/production/task/billing/invoice-status-badge";
import type { INVOICE_STATUS } from "@/constants/enums";

interface CustomerInvoicesCardProps {
  customer: Customer;
}

export function CustomerInvoicesCard({ customer }: CustomerInvoicesCardProps) {
  const { colors } = useTheme();
  const { data: invoices = [], isLoading } = useInvoicesByCustomer(customer.id);

  if (isLoading) {
    return (
      <DetailCard title="Faturas Relacionadas" icon="file-text">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Carregando faturas...
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  if (invoices.length === 0) {
    return (
      <DetailCard title="Faturas Relacionadas" icon="file-text">
        <View style={styles.emptyState}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
            <IconFileText size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
            Nenhuma fatura encontrada
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
            As faturas estao relacionadas as tarefas do cliente.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard
      title="Faturas Relacionadas"
      icon="file-text"
      badge={
        <Badge variant="secondary">
          <ThemedText style={StyleSheet.flatten([styles.countText, { color: colors.foreground }])}>
            {invoices.length}
          </ThemedText>
        </Badge>
      }
    >
      <View style={{ paddingHorizontal: 0 }}>
        <ScrollView
          style={[styles.invoicesList, { maxHeight: 400 }]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {invoices.map((invoice, index) => (
            <View
              key={invoice.id}
              style={StyleSheet.flatten([
                styles.invoiceItem,
                {
                  backgroundColor: colors.muted + "10",
                  borderBottomColor: colors.border,
                },
                index === invoices.length - 1 && styles.lastInvoiceItem,
              ])}
            >
              <View style={styles.invoiceContent}>
                <View style={styles.invoiceInfo}>
                  {/* Header row: task serial + status */}
                  <View style={styles.invoiceHeader}>
                    <ThemedText
                      style={StyleSheet.flatten([styles.invoiceTitle, { color: colors.foreground }])}
                      numberOfLines={1}
                    >
                      {invoice.task?.serialNumber ? `OS #${invoice.task.serialNumber}` : "Fatura"}
                    </ThemedText>
                    <InvoiceStatusBadge status={invoice.status as INVOICE_STATUS} size="sm" />
                  </View>

                  {/* Metadata row: date + installments */}
                  <View style={styles.invoiceMetadata}>
                    <View style={styles.metadataItem}>
                      <IconCalendar size={14} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.metadataText, { color: colors.mutedForeground }])}>
                        {formatDate(invoice.createdAt)}
                      </ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.metadataText, { color: colors.mutedForeground }])}>
                      {invoice.installments?.length ?? 0} parcela{(invoice.installments?.length ?? 0) !== 1 ? "s" : ""}
                    </ThemedText>
                  </View>

                  {/* Amount row: total + paid */}
                  <View style={styles.amountRow}>
                    <ThemedText style={StyleSheet.flatten([styles.totalAmount, { color: colors.foreground }])}>
                      {formatCurrency(invoice.totalAmount)}
                    </ThemedText>
                    {invoice.paidAmount > 0 && (
                      <View style={styles.paidContainer}>
                        <IconCash size={14} color={colors.primary} />
                        <ThemedText style={StyleSheet.flatten([styles.paidAmount, { color: colors.primary }])}>
                          Pago: {formatCurrency(invoice.paidAmount)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  invoicesList: {
    flex: 1,
  },
  invoiceItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  lastInvoiceItem: {
    borderBottomWidth: 0,
  },
  invoiceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  invoiceInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  invoiceTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  invoiceMetadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    alignItems: "center",
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metadataText: {
    fontSize: fontSize.xs,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  totalAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  paidContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  paidAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
