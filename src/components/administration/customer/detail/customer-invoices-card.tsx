
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconFileText, IconExternalLink } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatDate, formatCurrency } from "@/utils";

interface CustomerInvoicesCardProps {
  customer: Customer;
}

// Placeholder for invoice interface - will be implemented when backend supports it
interface Invoice {
  id: string;
  number: string;
  createdAt: Date;
  description?: string;
  total: number;
}

export function CustomerInvoicesCard({}: CustomerInvoicesCardProps) {
  const { colors } = useTheme();

  // Placeholder - this will be populated when customer invoices are fetched
  const invoices: Invoice[] = [];

  return (
    <DetailCard
      title="Notas Fiscais Relacionadas"
      icon="file-text"
      badge={invoices.length > 0 ? (
        <Badge variant="outline">
          {invoices.length}
        </Badge>
      ) : undefined}
    >
      <View style={styles.content}>
        {invoices.length === 0 ? (
          <View style={styles.emptyState}>
            <IconFileText size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
            <ThemedText style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
              Nenhuma nota fiscal encontrada
            </ThemedText>
          </View>
        ) : (
          <View style={styles.invoicesList}>
            {invoices.map((invoice, index) => (
              <View
                key={invoice.id}
                style={[
                  styles.invoiceItem,
                  {
                    backgroundColor: colors.muted + "20",
                    borderColor: colors.border,
                  },
                  index < invoices.length - 1 && styles.invoiceItemMargin,
                ]}
              >
                <View style={styles.invoiceHeader}>
                  <View style={styles.invoiceInfo}>
                    <View style={styles.invoiceTitleRow}>
                      <ThemedText style={[styles.invoiceNumber, { color: colors.foreground }]}>
                        NF #{invoice.number}
                      </ThemedText>
                      <IconExternalLink size={16} color={colors.mutedForeground} />
                    </View>
                    <ThemedText style={[styles.invoiceDate, { color: colors.mutedForeground }]}>
                      {formatDate(invoice.createdAt)}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.invoiceAmount, { color: colors.primary }]}>
                    {formatCurrency(invoice.total)}
                  </ThemedText>
                </View>
                {invoice.description && (
                  <ThemedText
                    style={[styles.invoiceDescription, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {invoice.description}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  invoicesList: {
    gap: spacing.md,
  },
  invoiceItem: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  invoiceItemMargin: {
    marginBottom: spacing.sm,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  invoiceInfo: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  invoiceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  invoiceNumber: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  invoiceDate: {
    fontSize: fontSize.xs,
  },
  invoiceAmount: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  invoiceDescription: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
});
