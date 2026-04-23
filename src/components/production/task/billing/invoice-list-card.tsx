import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency } from "@/utils/formatters";
import { useInvoicesByTask } from "@/hooks/useInvoice";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { InstallmentList } from "./installment-list";
import { InvoiceDetailModal } from "./invoice-detail-modal";
import { NfseStatusBadge } from "./nfse-status-badge";
import { NfseActions } from "./nfse-actions";
import {
  IconChevronDown,
  IconChevronRight,
  IconFileInvoice,
  IconReceipt,
} from "@tabler/icons-react-native";
import type { Invoice } from "@/types/invoice";
import { INVOICE_STATUS, NFSE_STATUS } from "@/constants/enums";

interface InvoiceListCardProps {
  taskId: string;
}

export function InvoiceListCard({ taskId }: InvoiceListCardProps) {
  const { colors } = useTheme();
  const { data: invoices, isLoading, isError } = useInvoicesByTask(taskId);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const handleOpenDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailModalVisible(false);
    setSelectedInvoice(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Carregando faturas...
            </ThemedText>
          </View>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent>
          <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
            Erro ao carregar faturas.
          </ThemedText>
        </CardContent>
      </Card>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Nenhuma fatura"
            description="Esta tarefa ainda não possui faturas."
            icon="file-invoice"
            style={styles.emptyState}
          />
        </CardContent>
      </Card>
    );
  }

  const totalAmount = invoices.reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum: number, inv: Invoice) => sum + (inv.paidAmount || 0), 0);
  const totalPending = totalAmount - totalPaid;
  const isSingleInvoice = invoices.length === 1;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Summary Bar */}
          <View style={[styles.summaryBar, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.summaryCell}>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Total
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
                {formatCurrency(totalAmount)}
              </ThemedText>
            </View>
            <View style={styles.summaryCell}>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Pago
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: "#15803d" }]}>
                {formatCurrency(totalPaid)}
              </ThemedText>
            </View>
            <View style={styles.summaryCell}>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Pendente
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: "#d97706" }]}>
                {formatCurrency(totalPending)}
              </ThemedText>
            </View>
          </View>

          {invoices.map((invoice: Invoice, index: number) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              isLast={index === invoices.length - 1}
              alwaysExpanded={isSingleInvoice}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </CardContent>
      </Card>

      <InvoiceDetailModal
        invoice={selectedInvoice}
        visible={detailModalVisible}
        onClose={handleCloseDetail}
      />
    </>
  );
}

// ---- Invoice Row (expandable, or always-open when single) ----

interface InvoiceRowProps {
  invoice: Invoice;
  isLast: boolean;
  /** When true, the row is always open and the chevron is hidden. */
  alwaysExpanded?: boolean;
  onOpenDetail: (invoice: Invoice) => void;
}

function InvoiceRow({ invoice, isLast, alwaysExpanded = false, onOpenDetail }: InvoiceRowProps) {
  const { colors } = useTheme();
  const [userExpanded, setUserExpanded] = useState(false);
  const expanded = alwaysExpanded || userExpanded;

  const hasInstallments = invoice.installments && invoice.installments.length > 0;
  const installments = hasInstallments
    ? [...invoice.installments!].sort((a, b) => a.number - b.number)
    : [];
  const ChevronIcon = expanded ? IconChevronDown : IconChevronRight;

  // The top-level summary bar already shows Total/Pago/Pendente, and the
  // invoice badge reflects fully-paid/pending state. So instead of repeating
  // "Pago: R$ X" here, we just tint the amount green when fully paid and
  // amber when partially paid.
  const isFullyPaid =
    invoice.paidAmount > 0 && invoice.paidAmount >= invoice.totalAmount;
  const isPartiallyPaid =
    invoice.paidAmount > 0 && invoice.paidAmount < invoice.totalAmount;
  const amountColor = isFullyPaid
    ? "#15803d"
    : isPartiallyPaid
      ? "#d97706"
      : colors.foreground;

  return (
    <View
      style={[
        styles.invoiceRow,
        { borderColor: colors.border },
        !isLast && { marginBottom: spacing.sm },
      ]}
    >
      <TouchableOpacity
        onPress={alwaysExpanded ? () => onOpenDetail(invoice) : () => setUserExpanded((v) => !v)}
        onLongPress={() => onOpenDetail(invoice)}
        activeOpacity={0.7}
        style={styles.invoiceHeader}
      >
        {/* Leading chevron (matches web) — omitted when always-expanded */}
        {!alwaysExpanded && (
          <ChevronIcon size={16} color={colors.mutedForeground} />
        )}

        <TouchableOpacity
          onPress={() => onOpenDetail(invoice)}
          activeOpacity={0.7}
          style={[styles.invoiceIconContainer, { backgroundColor: colors.primary + "15" }]}
        >
          <IconFileInvoice size={16} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.invoiceInfo}>
          {/* Row 1: amount + status badge */}
          <View style={styles.amountStatusRow}>
            <ThemedText style={[styles.totalAmount, { color: amountColor }]}>
              {formatCurrency(invoice.totalAmount)}
            </ThemedText>
            <InvoiceStatusBadge status={invoice.status as INVOICE_STATUS} />
          </View>
          {/* Row 2: customer name */}
          <ThemedText
            style={[styles.customerName, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {invoice.customer?.fantasyName ?? "Cliente"}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {expanded && hasInstallments && (
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.muted + "30" }]}>
            <IconReceipt size={13} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              Parcelas
            </ThemedText>
          </View>
          <View style={styles.sectionBody}>
            <InstallmentList installments={installments} />
          </View>
        </View>
      )}

      {expanded && (() => {
        const nfseDocuments = invoice.nfseDocuments ?? [];
        const activeNfse =
          nfseDocuments.find((d) => d.status === "AUTHORIZED") ??
          nfseDocuments[nfseDocuments.length - 1] ??
          null;
        // Condensed NFS-e section — just the status and actions. Details
        // (número, emissão, ISS, etc.) live in the NFS-e detail page and the
        // invoice detail modal so we don't duplicate them here.
        return (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <View style={[styles.sectionHeader, { backgroundColor: colors.muted + "30" }]}>
              <IconFileInvoice size={13} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                NFS-e
              </ThemedText>
            </View>
            <View style={styles.sectionBody}>
              <View style={styles.nfseRow}>
                <View style={styles.nfseStatusRow}>
                  {activeNfse ? (
                    <NfseStatusBadge status={activeNfse.status as NFSE_STATUS} size="sm" />
                  ) : (
                    <ThemedText style={[styles.nfseNotIssued, { color: colors.mutedForeground }]}>
                      Nao emitida
                    </ThemedText>
                  )}
                  {nfseDocuments.length > 1 && (
                    <ThemedText style={[styles.nfseMeta, { color: colors.mutedForeground }]}>
                      ({nfseDocuments.length} emissões)
                    </ThemedText>
                  )}
                </View>
                <NfseActions invoiceId={invoice.id} nfseDocuments={nfseDocuments} />
              </View>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  emptyState: {
    paddingVertical: spacing.lg,
  },
  cardContent: {
    gap: spacing.md,
  },
  // Summary bar at top of card
  summaryBar: {
    flexDirection: "row",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  summaryCell: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  // Invoice card
  invoiceRow: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  invoiceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  invoiceInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  amountStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  customerName: {
    fontSize: fontSize.xs,
  },
  totalAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  // Sections inside the invoice (Parcelas / NFS-e)
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // NFS-e specific
  nfseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  nfseStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  nfseNotIssued: {
    fontSize: fontSize.sm,
  },
  nfseMeta: {
    fontSize: fontSize.xs,
    flexShrink: 1,
  },
});
