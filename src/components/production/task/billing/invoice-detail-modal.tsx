import React, { useState } from "react";
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency } from "@/utils/formatters";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { NfseStatusBadge } from "./nfse-status-badge";
import { InstallmentList } from "./installment-list";
import { BoletoActions } from "./boleto-actions";
import { NfseActions } from "./nfse-actions";
import { NfseEnrichedInfo } from "./nfse-enriched-info";
import { useCancelInvoice } from "@/hooks/useInvoice";
import { IconX } from "@tabler/icons-react-native";
import type { Invoice } from "@/types/invoice";
import type { INVOICE_STATUS, NFSE_STATUS } from "@/constants/enums";

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  visible: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, visible, onClose }: InvoiceDetailModalProps) {
  const { colors } = useTheme();
  const cancelInvoice = useCancelInvoice();

  if (!invoice) return null;

  const canCancel = invoice.status === "DRAFT" || invoice.status === "ACTIVE";

  const handleCancel = () => {
    Alert.alert(
      "Cancelar Fatura",
      "Tem certeza que deseja cancelar esta fatura? Todos os boletos pendentes serao cancelados.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: () => {
            cancelInvoice.mutate(
              { id: invoice.id },
              {
                onSuccess: () => {
                  Alert.alert("Sucesso", "Fatura cancelada com sucesso");
                  onClose();
                },
                onError: () => {
                  Alert.alert("Erro", "Erro ao cancelar fatura");
                },
              },
            );
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
              Fatura
            </ThemedText>
            <InvoiceStatusBadge status={invoice.status as INVOICE_STATUS} />
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer & Task */}
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {invoice.customer?.fantasyName || "Cliente"}
            {invoice.task?.serialNumber && ` - OS #${invoice.task.serialNumber}`}
          </ThemedText>

          {/* Invoice Summary */}
          <View style={[styles.summaryContainer, { borderBottomColor: colors.border }]}>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                TOTAL
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
                {formatCurrency(invoice.totalAmount)}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                PAGO
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>
                {formatCurrency(invoice.paidAmount)}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                PARCELAS
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
                {invoice.installments?.length ?? 0}
              </ThemedText>
            </View>
          </View>

          {/* NFS-e Section */}
          {((invoice.nfseDocuments && invoice.nfseDocuments.length > 0) || invoice.status === "ACTIVE" || invoice.status === "PAID") && (
            <View style={[styles.nfseSection, { borderBottomColor: colors.border }]}>
              {/* Header row: label + status/actions */}
              <View style={styles.nfseHeaderRow}>
                <ThemedText style={[styles.sectionLabel, { color: colors.foreground, marginBottom: 0 }]}>
                  NFS-e
                </ThemedText>
                <View style={styles.nfseHeaderRight}>
                  {invoice.nfseDocuments && invoice.nfseDocuments.length > 0 ? (
                    <NfseStatusBadge status={invoice.nfseDocuments[invoice.nfseDocuments.length - 1].status as NFSE_STATUS} />
                  ) : (
                    <ThemedText style={[styles.nfseNotIssued, { color: colors.mutedForeground }]}>
                      Nao emitida
                    </ThemedText>
                  )}
                  <NfseActions invoiceId={invoice.id} nfseDocuments={invoice.nfseDocuments ?? []} />
                </View>
              </View>
              {/* Enriched info (full width, below header) */}
              {(() => {
                const nfseDocuments = invoice.nfseDocuments ?? [];
                const activeNfse = nfseDocuments.find((d) => d.status === 'AUTHORIZED') ?? nfseDocuments[nfseDocuments.length - 1] ?? null;
                return activeNfse?.elotechNfseId ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <NfseEnrichedInfo elotechNfseId={activeNfse.elotechNfseId} showPdfLink />
                  </View>
                ) : null;
              })()}
            </View>
          )}

          {/* Installments */}
          {invoice.installments && invoice.installments.length > 0 && (
            <View style={styles.installmentsSection}>
              <ThemedText style={[styles.sectionLabel, { color: colors.foreground }]}>
                Parcelas
              </ThemedText>
              {invoice.installments
                .sort((a, b) => a.number - b.number)
                .map((installment) => (
                  <View
                    key={installment.id}
                    style={[styles.installmentRow, { borderBottomColor: colors.border }]}
                  >
                    <InstallmentList installments={[installment]} />
                    {installment.bankSlip && (
                      <BoletoActions
                        installmentId={installment.id}
                        bankSlip={installment.bankSlip}
                      />
                    )}
                  </View>
                ))}
            </View>
          )}

          {/* Notes */}
          {invoice.notes && (
            <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                OBSERVACOES
              </ThemedText>
              <ThemedText style={[styles.notesText, { color: colors.foreground }]}>
                {invoice.notes}
              </ThemedText>
            </View>
          )}

          {/* Cancel Action */}
          {canCancel && (
            <View style={[styles.actionsSection, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={cancelInvoice.isPending}
                style={[styles.cancelButton, { backgroundColor: colors.destructive }]}
                activeOpacity={0.7}
              >
                <IconX size={16} color="#fff" />
                <ThemedText style={styles.cancelButtonText}>
                  {cancelInvoice.isPending ? "Cancelando..." : "Cancelar Fatura"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  summaryContainer: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  nfseSection: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nfseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  nfseHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nfseNumber: {
    fontSize: fontSize.sm,
  },
  nfseNotIssued: {
    fontSize: fontSize.sm,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  installmentsSection: {
    paddingVertical: spacing.md,
  },
  installmentRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  notesSection: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.sm,
  },
  actionsSection: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "flex-end",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
