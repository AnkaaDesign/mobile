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
import { NfseEnrichedInfo } from "./nfse-enriched-info";
import { IconChevronDown, IconChevronUp, IconFileInvoice } from "@tabler/icons-react-native";
import type { Invoice } from "@/types/invoice";
import type { INVOICE_STATUS } from "@/constants/enums";
import { NFSE_STATUS } from "@/constants/enums";

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Faturas ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {invoices.map((invoice: Invoice, index: number) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              isLast={index === invoices.length - 1}
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

// ---- Invoice Row (expandable) ----

interface InvoiceRowProps {
  invoice: Invoice;
  isLast: boolean;
  onOpenDetail: (invoice: Invoice) => void;
}

function InvoiceRow({ invoice, isLast, onOpenDetail }: InvoiceRowProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const hasInstallments = invoice.installments && invoice.installments.length > 0;
  const ChevronIcon = expanded ? IconChevronUp : IconChevronDown;

  return (
    <View
      style={[
        styles.invoiceRow,
        { borderBottomColor: colors.border },
        isLast && styles.invoiceRowLast,
      ]}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        onLongPress={() => onOpenDetail(invoice)}
        activeOpacity={0.7}
        style={styles.invoiceHeader}
      >
        <TouchableOpacity
          onPress={() => onOpenDetail(invoice)}
          activeOpacity={0.7}
          style={styles.invoiceIconContainer}
        >
          <IconFileInvoice size={18} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.invoiceInfo}>
          <ThemedText style={[styles.customerName, { color: colors.foreground }]} numberOfLines={1}>
            {invoice.customer?.fantasyName ?? "Cliente"}
          </ThemedText>

          <View style={styles.invoiceMeta}>
            <ThemedText style={[styles.totalAmount, { color: colors.foreground }]}>
              {formatCurrency(invoice.totalAmount)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.invoiceRight}>
          <InvoiceStatusBadge status={invoice.status as INVOICE_STATUS} />
          <ChevronIcon size={16} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {expanded && hasInstallments && (
        <View style={[styles.installmentsContainer, { backgroundColor: colors.muted + "20" }]}>
          <InstallmentList installments={invoice.installments!} />
        </View>
      )}

      {expanded && (() => {
        const nfseDocuments = invoice.nfseDocuments ?? [];
        const activeNfse = nfseDocuments.find((d) => d.status === "AUTHORIZED") ?? nfseDocuments[nfseDocuments.length - 1] ?? null;
        return (
          <View style={[styles.nfseSection, { backgroundColor: colors.muted + "20" }]}>
            <View style={styles.nfseSectionHeader}>
              <IconFileInvoice size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.nfseSectionTitle, { color: colors.mutedForeground }]}>
                NFS-e
              </ThemedText>
            </View>
            <View style={styles.nfseContent}>
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
                    <ThemedText style={[styles.nfseCount, { color: colors.mutedForeground }]}>
                      ({nfseDocuments.length} emissoes)
                    </ThemedText>
                  )}
                </View>
                <NfseActions invoiceId={invoice.id} nfseDocuments={nfseDocuments} />
              </View>
              {activeNfse?.elotechNfseId && (
                <NfseEnrichedInfo elotechNfseId={activeNfse.elotechNfseId} />
              )}
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
    gap: 0,
    paddingVertical: 0,
  },
  invoiceRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  invoiceRowLast: {
    borderBottomWidth: 0,
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
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
    gap: 4,
  },
  customerName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  invoiceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  totalAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  invoiceRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  installmentsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  nfseSection: {
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  nfseSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  nfseSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nfseContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  nfseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nfseStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nfseNotIssued: {
    fontSize: fontSize.sm,
  },
  nfseCount: {
    fontSize: fontSize.xs,
  },
});
