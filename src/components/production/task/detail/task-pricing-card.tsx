import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useFileViewer } from "@/components/file";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency, formatDate, exportBudgetPdf } from "@/utils";
import { generatePaymentText, generateGuaranteeText } from "@/utils/pricing-text-generators";
import type { TaskPricing } from "@/types/task-pricing";
import { WEB_BASE_URL } from "@/config/urls";
import {
  IconFileInvoice,
  IconDownload,
  IconExternalLink,
  IconReceipt,
  IconCalendar,
  IconCreditCard,
  IconShieldCheck,
  IconPhoto,
  IconWriting,
  IconNote,
  IconTruck,
} from "@tabler/icons-react-native";

interface TaskPricingCardProps {
  pricing: TaskPricing;
  customerId?: string;
  customerName?: string;
  contactName?: string;
  termDate?: Date | string | null;
}

type PricingStatus = "DRAFT" | "APPROVED" | "REJECTED" | "CANCELLED";

const STATUS_CONFIG: Record<PricingStatus, { label: string; variant: "secondary" | "approved" | "rejected" | "cancelled" }> = {
  DRAFT: { label: "Rascunho", variant: "secondary" },
  APPROVED: { label: "Aprovado", variant: "approved" },
  REJECTED: { label: "Rejeitado", variant: "rejected" },
  CANCELLED: { label: "Cancelado", variant: "cancelled" },
};

export function TaskPricingCard({ pricing, customerId, customerName, contactName, termDate }: TaskPricingCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const [isExporting, setIsExporting] = useState(false);

  if (!pricing || !pricing.items || pricing.items.length === 0) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[pricing.status as PricingStatus] || STATUS_CONFIG.DRAFT;
  const paymentText = generatePaymentText(pricing);
  const guaranteeText = generateGuaranteeText(pricing);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportBudgetPdf({
        pricing,
        customerName,
        contactName,
        termDate,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Não foi possível exportar o PDF"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewBudget = async () => {
    // Use customer id if available, otherwise fallback to 'c' (matching web behavior)
    const cId = customerId || 'c';
    // Use pricing.id if available
    const pricingId = pricing.id;

    if (pricingId) {
      const url = `${WEB_BASE_URL}/cliente/${cId}/orcamento/${pricingId}`;

      try {
        // Use WebBrowser.openBrowserAsync which works better with Safari on iOS
        await WebBrowser.openBrowserAsync(url, {
          // Opens in Safari View Controller on iOS (in-app browser)
          // This is more reliable than Linking.openURL for Safari
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: "#0a5c1e",
          toolbarColor: "#ffffff",
        });
      } catch (err) {
        console.error("Error opening URL:", err, "URL was:", url);
        Alert.alert("Erro", `Não foi possível abrir o link: ${url}`);
      }
    } else {
      // Debug: Show what we have
      console.log("Pricing object:", JSON.stringify(pricing, null, 2));
      Alert.alert("Erro", "ID do orçamento não disponível. Salve a tarefa primeiro.");
    }
  };

  const handleViewLayoutFile = () => {
    if (pricing.layoutFile) {
      fileViewer.actions.viewFile(pricing.layoutFile);
    }
  };

  const handleViewSignature = () => {
    if (pricing.customerSignature) {
      fileViewer.actions.viewFile(pricing.customerSignature);
    }
  };

  // Calculate discount amount
  const discountAmount = pricing.discountType === "PERCENTAGE" && pricing.discountValue
    ? (pricing.subtotal * pricing.discountValue) / 100
    : pricing.discountType === "FIXED_VALUE" && pricing.discountValue
      ? pricing.discountValue
      : 0;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconFileInvoice size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.headerTitle}>Precificação Detalhada</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <Button
            variant="outline"
            size="sm"
            onPress={handleExportPdf}
            disabled={isExporting}
            style={styles.headerButton}
          >
            <IconDownload size={14} color={colors.foreground} />
            <ThemedText style={[styles.headerButtonText, { color: colors.foreground }]}>
              {isExporting ? "..." : "PDF"}
            </ThemedText>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={handleViewBudget}
            disabled={!pricing.id}
            style={styles.headerButton}
          >
            <IconExternalLink size={14} color={pricing.id ? colors.foreground : colors.mutedForeground} />
            <ThemedText style={[styles.headerButtonText, { color: pricing.id ? colors.foreground : colors.mutedForeground }]}>Ver</ThemedText>
          </Button>
          <Badge variant={statusConfig.variant} size="lg">
            {statusConfig.label}
          </Badge>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Budget Number and Validity */}
        <View style={styles.infoRow}>
          {pricing.budgetNumber && (
            <View style={[styles.infoChip, { backgroundColor: colors.muted }]}>
              <IconReceipt size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.infoChipText, { color: colors.mutedForeground }]}>
                Orçamento Nº:{" "}
                <ThemedText style={[styles.infoChipValue, { color: colors.foreground }]}>
                  {String(pricing.budgetNumber).padStart(4, "0")}
                </ThemedText>
              </ThemedText>
            </View>
          )}
          {pricing.expiresAt && (
            <View style={[styles.infoChip, { backgroundColor: colors.muted }]}>
              <IconCalendar size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.infoChipText, { color: colors.mutedForeground }]}>
                Validade:{" "}
                <ThemedText style={[styles.infoChipValue, { color: colors.foreground }]}>
                  {formatDate(pricing.expiresAt)}
                </ThemedText>
              </ThemedText>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={[styles.tableContainer, { borderColor: colors.border }]}>
          {/* Table Header */}
          <View style={[styles.tableHeader, { backgroundColor: colors.muted }]}>
            <ThemedText style={[styles.tableHeaderText, styles.descriptionColumn]}>Descrição</ThemedText>
            <ThemedText style={[styles.tableHeaderText, styles.valueColumn]}>Valor</ThemedText>
          </View>

          {/* Table Body */}
          {pricing.items.map((item, index) => (
            <View
              key={item.id || index}
              style={[
                styles.tableRow,
                { borderBottomColor: colors.border },
                index === pricing.items!.length - 1 && styles.tableRowLast,
              ]}
            >
              <View style={[styles.descriptionColumn, styles.descriptionCell]}>
                <ThemedText style={styles.tableCellText}>{item.description}</ThemedText>
                {item.observation && (
                  <TouchableOpacity
                    onPress={() => Alert.alert("Observação", item.observation!)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.observationIndicator, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <IconNote size={12} color={colors.mutedForeground} />
                      <View style={[styles.observationBadge, { backgroundColor: colors.destructive }]}>
                        <ThemedText style={styles.observationBadgeText}>!</ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              <ThemedText style={[styles.tableCellText, styles.valueColumn, styles.valueText]}>
                {formatCurrency(typeof item.amount === "number" ? item.amount : Number(item.amount) || 0)}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Pricing Summary */}
        <View style={[styles.summaryContainer, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
          {/* Subtotal */}
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {formatCurrency(typeof pricing.subtotal === "number" ? pricing.subtotal : Number(pricing.subtotal) || 0)}
            </ThemedText>
          </View>

          {/* Discount */}
          {pricing.discountType && pricing.discountType !== "NONE" && pricing.discountValue && (
            <View style={styles.summaryRow}>
              <View style={styles.discountLabelContainer}>
                <ThemedText style={[styles.summaryLabel, { color: colors.destructive }]}>
                  Desconto{pricing.discountType === "PERCENTAGE" ? ` (${pricing.discountValue}%)` : " (Valor Fixo)"}
                </ThemedText>
                {pricing.discountReference && (
                  <ThemedText style={[styles.discountReference, { color: colors.mutedForeground }]}>
                    Ref: {pricing.discountReference}
                  </ThemedText>
                )}
              </View>
              <ThemedText style={[styles.summaryValue, { color: colors.destructive }]}>
                - {formatCurrency(discountAmount)}
              </ThemedText>
            </View>
          )}

          {/* Total */}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <ThemedText style={styles.totalLabel}>TOTAL</ThemedText>
            <ThemedText style={[styles.totalValue, { color: colors.primary }]}>
              {formatCurrency(typeof pricing.total === "number" ? pricing.total : Number(pricing.total) || 0)}
            </ThemedText>
          </View>
        </View>

        {/* Delivery Deadline */}
        {(pricing.customForecastDays || (pricing.simultaneousTasks && pricing.simultaneousTasks > 1)) && (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.infoSectionHeader}>
              <IconTruck size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoSectionTitle}>Prazo de Entrega</ThemedText>
            </View>
            <ThemedText style={[styles.infoSectionText, { color: colors.mutedForeground }]}>
              {pricing.customForecastDays ? `O prazo de entrega é de ${pricing.customForecastDays} dias úteis.` : ''}
              {pricing.simultaneousTasks && pricing.simultaneousTasks > 1 ? ` Capacidade: ${pricing.simultaneousTasks} tarefas simultâneas.` : ''}
            </ThemedText>
          </View>
        )}

        {/* Payment Conditions */}
        {paymentText ? (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.infoSectionHeader}>
              <IconCreditCard size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoSectionTitle}>Condições de Pagamento</ThemedText>
            </View>
            <ThemedText style={[styles.infoSectionText, { color: colors.mutedForeground }]}>{paymentText}</ThemedText>
          </View>
        ) : null}

        {/* Guarantee */}
        {guaranteeText ? (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.infoSectionHeader}>
              <IconShieldCheck size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoSectionTitle}>Garantia</ThemedText>
            </View>
            <ThemedText style={[styles.infoSectionText, { color: colors.mutedForeground }]}>{guaranteeText}</ThemedText>
          </View>
        ) : null}

        {/* Layout Aprovado */}
        {pricing.layoutFile && (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.infoSectionHeader}>
              <IconPhoto size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoSectionTitle}>Layout Aprovado</ThemedText>
            </View>
            <TouchableOpacity onPress={handleViewLayoutFile} activeOpacity={0.8}>
              <Image
                source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/files/thumbnail/${pricing.layoutFile.id}` }}
                style={styles.layoutImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Signature */}
        {pricing.customerSignature && (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.infoSectionHeader}>
              <IconWriting size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoSectionTitle}>Assinatura do Cliente</ThemedText>
            </View>
            <TouchableOpacity onPress={handleViewSignature} activeOpacity={0.8} style={styles.signatureContainer}>
              <Image
                source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/files/serve/${pricing.customerSignature.id}` }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "column",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    minWidth: 0,
  },
  headerButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  infoChipText: {
    fontSize: fontSize.sm,
  },
  infoChipValue: {
    fontWeight: fontWeight.medium,
  },
  tableContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tableHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  descriptionColumn: {
    flex: 1,
  },
  valueColumn: {
    width: 100,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  descriptionCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tableCellText: {
    fontSize: fontSize.sm,
  },
  valueText: {
    fontWeight: fontWeight.medium,
  },
  observationIndicator: {
    position: "relative",
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  observationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  observationBadgeText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: "#ffffff",
  },
  summaryContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: fontSize.sm,
  },
  discountLabelContainer: {
    flex: 1,
    gap: 2,
  },
  discountReference: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  infoSection: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  infoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  infoSectionText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  layoutImage: {
    width: "100%",
    height: 192,
    borderRadius: borderRadius.md,
  },
  signatureContainer: {
    alignItems: "center",
  },
  signatureImage: {
    height: 96,
    width: "100%",
  },
});

export default TaskPricingCard;
