import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { IconCopy } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailSection } from "@/components/ui/detail-page-layout";
import { InvoiceStatusBadge } from "@/components/production/task/billing/invoice-status-badge";
import { NfseStatusBadge } from "@/components/production/task/billing/nfse-status-badge";
import { InstallmentList } from "@/components/production/task/billing/installment-list";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { formatCurrency } from "@/utils";
import type { Invoice } from "@/types/invoice";
import type { INVOICE_STATUS, NFSE_STATUS } from "@/constants/enums";

interface ExternalOperationBillingCardProps {
  invoice: Invoice;
}

/**
 * Read-only billing summary for a CHARGEABLE "Operação Externa" that already
 * has a billing invoice: NFS-e status/number, installments (number, due date,
 * amount, status badge) and boleto digitable lines with copy-to-clipboard.
 */
export function ExternalOperationBillingCard({ invoice }: ExternalOperationBillingCardProps) {
  const { colors } = useTheme();

  const nfseDocuments = invoice.nfseDocuments || [];
  const installments = invoice.installments || [];
  const boletoRows = installments.filter((installment) => !!installment.bankSlip?.digitableLine);

  const handleCopyDigitableLine = async (digitableLine: string) => {
    try {
      await Clipboard.setStringAsync(digitableLine);
      Alert.alert("Sucesso", "Linha digitável copiada");
    } catch {
      Alert.alert("Erro", "Erro ao copiar linha digitável");
    }
  };

  return (
    <DetailCard
      title="Faturamento"
      icon="file-invoice"
      badge={<InvoiceStatusBadge status={invoice.status as INVOICE_STATUS} />}
    >
      {/* Totals */}
      <View style={[styles.summaryBar, { backgroundColor: colors.muted + "30" }]}>
        <View style={styles.summaryCell}>
          <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
            {formatCurrency(invoice.totalAmount || 0)}
          </ThemedText>
        </View>
        <View style={styles.summaryCell}>
          <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Pago</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: "#15803d" }]}>
            {formatCurrency(invoice.paidAmount || 0)}
          </ThemedText>
        </View>
      </View>

      {/* NFS-e */}
      {nfseDocuments.length > 0 && (
        <DetailSection title="NFS-e">
          {nfseDocuments.map((nfse) => (
            <View key={nfse.id} style={styles.nfseRow}>
              <NfseStatusBadge status={nfse.status as NFSE_STATUS} />
              <ThemedText style={[styles.nfseNumber, { color: colors.foreground }]}>
                {nfse.nfseNumber ? `Nº ${nfse.nfseNumber}` : "Sem número"}
              </ThemedText>
              {nfse.errorMessage ? (
                <ThemedText
                  style={[styles.nfseError, { color: colors.destructive }]}
                  numberOfLines={2}
                >
                  {nfse.errorMessage}
                </ThemedText>
              ) : null}
            </View>
          ))}
        </DetailSection>
      )}

      {/* Installments */}
      <View style={[styles.sectionDivider, { borderTopColor: colors.border + "50" }]} />
      <DetailSection title="Parcelas">
        <InstallmentList installments={installments} />
      </DetailSection>

      {/* Boletos — digitable line with copy */}
      {boletoRows.length > 0 && (
        <>
          <View style={[styles.sectionDivider, { borderTopColor: colors.border + "50" }]} />
          <DetailSection title="Boletos">
            {boletoRows.map((installment) => (
              <View
                key={installment.id}
                style={[styles.boletoRow, { backgroundColor: colors.muted + "30" }]}
              >
                <View style={styles.boletoInfo}>
                  <ThemedText style={[styles.boletoLabel, { color: colors.mutedForeground }]}>
                    Parcela #{installment.number}
                  </ThemedText>
                  <ThemedText
                    style={[styles.digitableLine, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {installment.bankSlip!.digitableLine}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={() => handleCopyDigitableLine(installment.bankSlip!.digitableLine!)}
                  style={[styles.copyButton, { backgroundColor: colors.muted }]}
                  activeOpacity={0.7}
                >
                  <IconCopy size={16} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            ))}
          </DetailSection>
        </>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  summaryBar: {
    flexDirection: "row",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCell: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  nfseRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  nfseNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  nfseError: {
    fontSize: fontSize.xs,
    flexBasis: "100%",
  },
  sectionDivider: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  boletoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  boletoInfo: {
    flex: 1,
    gap: 2,
  },
  boletoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  digitableLine: {
    fontSize: fontSize.xs,
    fontVariant: ["tabular-nums"],
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
