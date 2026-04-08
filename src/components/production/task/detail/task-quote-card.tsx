import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useFileViewer } from "@/components/file";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency, formatDate } from "@/utils";
import { generatePaymentText, generateGuaranteeText } from "@/utils/quote-text-generators";
import { computeServiceDiscount } from "@/utils/task-quote-calculations";
import type { TaskQuote, TaskQuoteService } from "@/types/task-quote";
import { WEB_BASE_URL } from "@/config/urls";
import {
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

interface TaskQuoteCardProps {
  quote: TaskQuote;
  customerId?: string;
  customerName?: string;
  contactName?: string;
  termDate?: Date | string | null;
  // Vehicle identification
  serialNumber?: string | null;
  plate?: string | null;
  chassisNumber?: string | null;
}

type QuoteStatus = "PENDING" | "BUDGET_APPROVED" | "VERIFIED_BY_FINANCIAL" | "BILLING_APPROVED" | "UPCOMING" | "PARTIAL" | "SETTLED" | "DUE";

const STATUS_CONFIG: Record<QuoteStatus, { label: string; variant: "secondary" | "approved" | "rejected" | "cancelled" }> = {
  PENDING: { label: "Pendente", variant: "secondary" },
  BUDGET_APPROVED: { label: "Orçamento Aprovado", variant: "approved" },
  VERIFIED_BY_FINANCIAL: { label: "Verificado pelo Financeiro", variant: "approved" },
  BILLING_APPROVED: { label: "Faturamento Aprovado", variant: "approved" },
  UPCOMING: { label: "A Vencer", variant: "secondary" },
  PARTIAL: { label: "Parcial", variant: "secondary" },
  SETTLED: { label: "Liquidado", variant: "approved" },
  DUE: { label: "Vencido", variant: "rejected" },
};

export function TaskQuoteCard({ quote, customerId, customerName, contactName, termDate, serialNumber, plate, chassisNumber }: TaskQuoteCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  if (!quote || !quote.services || quote.services.length === 0) {
    return null;
  }

  // Dynamic label: "Orçamento" when PENDING or no quote, "Faturamento" when BUDGET_APPROVED or later
  const isPendingOrNoQuote = !quote.status || quote.status === 'PENDING';
  const cardTitle = isPendingOrNoQuote ? "Orçamento" : "Faturamento";

  const statusConfig = STATUS_CONFIG[quote.status as QuoteStatus] || STATUS_CONFIG.PENDING;
  const activeConfig = quote.customerConfigs?.[0];
  const paymentText = generatePaymentText({
    customPaymentText: activeConfig?.customPaymentText || null,
    paymentCondition: activeConfig?.paymentCondition,
    total: typeof quote.total === 'number' ? quote.total : Number(quote.total) || 0,
  });
  const guaranteeText = generateGuaranteeText(quote);

  const handleViewBudget = async () => {
    // Use customer id if available, otherwise fallback to 'c' (matching web behavior)
    const cId = customerId || 'c';
    // Use quote.id if available
    const quoteId = quote.id;

    if (quoteId) {
      const url = `${WEB_BASE_URL}/cliente/${cId}/orcamento/${quoteId}`;

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
      console.log("Quote object:", JSON.stringify(quote, null, 2));
      Alert.alert("Erro", "ID do orçamento não disponível. Salve a tarefa primeiro.");
    }
  };

  const handleViewLayoutFile = () => {
    if (quote.layoutFile) {
      fileViewer.actions.viewFile(quote.layoutFile);
    }
  };

  const handleViewSignature = () => {
    if (activeConfig?.customerSignature) {
      fileViewer.actions.viewFile(activeConfig.customerSignature);
    }
  };

  // Calculate total discount amount from per-service discounts
  const totalDiscountAmount = (quote.services || []).reduce((sum, svc: TaskQuoteService) => {
    return sum + computeServiceDiscount(
      typeof svc.amount === 'number' ? svc.amount : Number(svc.amount) || 0,
      svc.discountType,
      svc.discountValue,
    );
  }, 0);

  return (
    <DetailCard
      title={cardTitle}
      icon="file-invoice"
      badge={
        <View style={styles.headerRight}>
          <Button
            variant="outline"
            size="sm"
            onPress={handleViewBudget}
            disabled={!quote.id}
            style={styles.headerButton}
          >
            <IconExternalLink size={14} color={quote.id ? colors.foreground : colors.mutedForeground} />
            <ThemedText style={[styles.headerButtonText, { color: quote.id ? colors.foreground : colors.mutedForeground }]}>Ver</ThemedText>
          </Button>
          <Badge variant={statusConfig.variant} size="sm" style={styles.statusBadge}>
            {statusConfig.label}
          </Badge>
        </View>
      }
    >
      <View style={styles.content}>
        {/* Budget Number and Validity */}
        <View style={styles.infoRow}>
          {quote.budgetNumber && (
            <View style={[styles.infoChip, { backgroundColor: colors.muted }]}>
              <IconReceipt size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.infoChipText, { color: colors.mutedForeground }]}>
                Orçamento Nº:{" "}
                <ThemedText style={[styles.infoChipValue, { color: colors.foreground }]}>
                  {String(quote.budgetNumber).padStart(4, "0")}
                </ThemedText>
              </ThemedText>
            </View>
          )}
          {quote.expiresAt && (
            <View style={[styles.infoChip, { backgroundColor: colors.muted }]}>
              <IconCalendar size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.infoChipText, { color: colors.mutedForeground }]}>
                Validade:{" "}
                <ThemedText style={[styles.infoChipValue, { color: colors.foreground }]}>
                  {formatDate(quote.expiresAt)}
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
          {quote.services.map((item, index) => {
            const isOutrosWithObservation = item.description === 'Outros' && !!item.observation;
            const displayDescription = isOutrosWithObservation ? item.observation : item.description;
            return (
            <View
              key={item.id || index}
              style={[
                styles.tableRow,
                { borderBottomColor: colors.border },
                index === quote.services!.length - 1 && styles.tableRowLast,
              ]}
            >
              <View style={[styles.descriptionColumn, styles.descriptionCell]}>
                <ThemedText style={styles.tableCellText}>{displayDescription}</ThemedText>
                {!isOutrosWithObservation && item.observation && (
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
            );
          })}
        </View>

        {/* Pricing Summary */}
        <View style={[styles.summaryContainer, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
          {/* Subtotal */}
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {formatCurrency(typeof quote.subtotal === "number" ? quote.subtotal : Number(quote.subtotal) || 0)}
            </ThemedText>
          </View>

          {/* Discount (computed from per-service discounts) */}
          {totalDiscountAmount > 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.discountLabelContainer}>
                <ThemedText style={[styles.summaryLabel, { color: colors.destructive }]}>
                  Desconto
                </ThemedText>
              </View>
              <ThemedText style={[styles.summaryValue, { color: colors.destructive }]}>
                - {formatCurrency(totalDiscountAmount)}
              </ThemedText>
            </View>
          )}

          {/* Total */}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <ThemedText style={styles.totalLabel}>TOTAL</ThemedText>
            <ThemedText style={[styles.totalValue, { color: colors.primary }]}>
              {formatCurrency(typeof quote.total === "number" ? quote.total : Number(quote.total) || 0)}
            </ThemedText>
          </View>
        </View>

        {/* Delivery Deadline */}
        {(quote.customForecastDays || (quote.simultaneousTasks && quote.simultaneousTasks > 1)) && (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.infoSectionHeader}>
              <IconTruck size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoSectionTitle}>Prazo de Entrega</ThemedText>
            </View>
            <ThemedText style={[styles.infoSectionText, { color: colors.mutedForeground }]}>
              {quote.customForecastDays ? `O prazo de entrega é de ${quote.customForecastDays} dias úteis.` : ''}
              {quote.simultaneousTasks && quote.simultaneousTasks > 1 ? ` Capacidade: ${quote.simultaneousTasks} tarefas simultâneas.` : ''}
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

        {/* Order Number */}
        {activeConfig?.orderNumber ? (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>N° do Pedido</ThemedText>
              <ThemedText style={styles.summaryValue}>{activeConfig.orderNumber}</ThemedText>
            </View>
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
        {quote.layoutFile && (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.infoSectionHeader}>
              <IconPhoto size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoSectionTitle}>Layout Aprovado</ThemedText>
            </View>
            <TouchableOpacity onPress={handleViewLayoutFile} activeOpacity={0.7} style={styles.layoutImageContainer}>
              <Image
                source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/files/thumbnail/${quote.layoutFile.id}` }}
                style={styles.layoutImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Signature */}
        {activeConfig?.customerSignature && (
          <View style={[styles.infoSection, { backgroundColor: colors.muted + "30" }]}>
            <View style={styles.infoSectionHeader}>
              <IconWriting size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoSectionTitle}>Assinatura do Cliente</ThemedText>
            </View>
            <TouchableOpacity onPress={handleViewSignature} activeOpacity={0.8} style={styles.signatureContainer}>
              <Image
                source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/files/serve/${activeConfig.customerSignature.id}` }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 1,
  },
  statusBadge: {
    height: 33,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.xs,
    minWidth: 0,
  },
  headerButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  content: {
    gap: spacing.md,
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
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
    padding: spacing.sm,
    gap: spacing.sm,
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
  layoutImageContainer: {
    alignSelf: "flex-start",
  },
  layoutImage: {
    height: 192,
    width: 256,
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

export default TaskQuoteCard;
