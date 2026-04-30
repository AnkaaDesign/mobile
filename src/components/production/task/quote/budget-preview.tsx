import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { formatCurrency, formatDate } from "@/utils";
import { generatePaymentText, generateGuaranteeText } from "@/utils/quote-text-generators";
import { getFileUrl } from "@/utils/file-utils";
import { computeConfigDiscount } from "@/utils/task-quote-calculations";
import { DISCOUNT_TYPE_LABELS, TRUCK_CATEGORY_LABELS, IMPLEMENT_TYPE_LABELS } from "@/constants/enum-labels";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { COMPANY_INFO, DIRECTOR_INFO, BRAND_COLORS } from "@/config/company";

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}

interface ServiceItem {
  id?: string;
  description: string;
  observation?: string | null;
  amount: number;
  invoiceToCustomerId?: string | null;
}

interface CustomerConfig {
  customerId: string;
  subtotal: number;
  total: number;
  discountType?: string;
  discountValue?: number | null;
  discountReference?: string | null;
  paymentCondition?: string | null;
  customPaymentText?: string | null;
  responsibleId?: string | null;
  generateInvoice?: boolean;
  orderNumber?: string | null;
}

interface BudgetPreviewProps {
  mode?: 'budget' | 'billing';
  quote: {
    budgetNumber?: number;
    subtotal: number;
    total: number;
    expiresAt?: Date | string | null;
    status: string;
    guaranteeYears?: number | null;
    customGuaranteeText?: string | null;
    customForecastDays?: number | null;
    simultaneousTasks?: number | null;
    layoutFileId?: string | null;
    layoutFile?: { id: string } | null;
    services?: ServiceItem[];
    customerConfigs?: CustomerConfig[];
    createdAt?: Date | string;
  };
  task?: {
    name?: string;
    serialNumber?: string;
    term?: Date | string | null;
    customer?: {
      corporateName?: string;
      fantasyName?: string;
    };
    truck?: {
      plate?: string | null;
      chassisNumber?: string | null;
      category?: string | null;
      implementType?: string | null;
    } | null;
    responsibles?: { id: string; name?: string; role?: string }[];
  };
  selectedCustomers?: Map<string, any>;
}

export function BudgetPreview({ quote, task, selectedCustomers, mode = 'budget' }: BudgetPreviewProps) {
  const { colors } = useTheme();

  // Prefer the explicitly selected budget responsible; otherwise default to the first task responsible
  const activeConfig = quote.customerConfigs?.[0];
  const selectedResponsible = activeConfig?.responsibleId
    ? task?.responsibles?.find((r: any) => r.id === activeConfig.responsibleId)
    : null;
  const contactName = selectedResponsible?.name
    || task?.responsibles?.[0]?.name
    || "";
  const budgetNumber = quote.budgetNumber
    ? String(quote.budgetNumber).padStart(4, "0")
    : task?.serialNumber || "0000";

  const validityDays = quote.expiresAt
    ? Math.max(
        0,
        Math.round(
          (new Date(quote.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 30;

  const termDate = task?.term ? formatDate(task.term as any) : "";

  // Compute total discount from customer config discounts
  const totalDiscountAmount = (quote.customerConfigs || []).reduce((sum, config) => {
    const configSubtotal = Number(config.subtotal) || 0;
    return sum + computeConfigDiscount(configSubtotal, config.discountType, config.discountValue);
  }, 0);
  const hasDiscount = totalDiscountAmount > 0;

  // Multi-customer support
  const hasMultipleCustomers =
    Array.isArray(quote.customerConfigs) && quote.customerConfigs.length >= 2;
  const validServices = (quote.services || []).filter((s) => s.description?.trim());

  // Group services by customer for multi-customer view
  const customerGroups = (() => {
    if (!hasMultipleCustomers) return null;
    const groups = new Map<string, { name: string; services: ServiceItem[] }>();
    for (const svc of validServices) {
      const customerId = svc.invoiceToCustomerId || "__unassigned__";
      const customer = selectedCustomers?.get(customerId);
      const name = customer?.fantasyName || customer?.corporateName || "Sem cliente";
      if (!groups.has(customerId)) {
        groups.set(customerId, { name, services: [] });
      }
      groups.get(customerId)!.services.push(svc);
    }
    return groups;
  })();

  // Handle both uploaded files (with id) and newly selected files (with uri)
  const layoutImageUrl =
    (quote.layoutFile as any)?.uri // Newly selected file - use local URI
      ? (quote.layoutFile as any).uri
      : quote.layoutFile?.id // Uploaded file - use getFileUrl
      ? getFileUrl(quote.layoutFile as any)
      : null;

  // Render a single service row
  const renderServiceRow = (item: ServiceItem, index: number) => {
    const amount = Number(item.amount) || 0;
    const isOutrosWithObservation = item.description === "Outros" && !!item.observation;
    const displayDescription = isOutrosWithObservation
      ? toTitleCase(item.observation!)
      : toTitleCase(item.description || "");
    const observation = !isOutrosWithObservation && item.observation
      ? toTitleCase(item.observation)
      : "";

    return (
      <View key={item.id || index}>
        <View style={styles.serviceRow}>
          <ThemedText style={styles.serviceDescription} numberOfLines={2}>
            {index + 1} - {displayDescription}
            {observation ? ` ${observation}` : ""}
          </ThemedText>
          <ThemedText style={styles.serviceAmount}>
            {formatCurrency(amount)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - budget only */}
      {mode === 'budget' && (
        <>
          <View style={styles.header}>
            <ThemedText style={styles.companyName}>{COMPANY_INFO.name}</ThemedText>
            <View style={styles.headerRight}>
              <ThemedText style={styles.budgetTitle}>
                Orçamento Nº {budgetNumber}
              </ThemedText>
              {quote.createdAt && (
                <ThemedText style={styles.headerMeta}>
                  Emissão: {formatDate(quote.createdAt as any)}
                </ThemedText>
              )}
              <ThemedText style={styles.headerMeta}>
                Validade: {validityDays} dias
              </ThemedText>
            </View>
          </View>

          {/* Green divider */}
          <View style={styles.divider} />

          {/* Title */}
          <ThemedText style={styles.sectionTitle}>ORÇAMENTO</ThemedText>

          {/* Customer Info */}
          <View style={styles.section}>
            {contactName ? (
              <ThemedText style={styles.customerName}>
                À {contactName}
              </ThemedText>
            ) : null}
            <ThemedText style={styles.bodyText}>
              Conforme solicitado, apresentamos nossa proposta de preço para execução dos serviços abaixo descriminados
              {(() => {
                const truckCategoryLabel = task?.truck?.category
                  ? (TRUCK_CATEGORY_LABELS[task.truck.category as keyof typeof TRUCK_CATEGORY_LABELS] || task.truck.category)
                  : null;
                const truckImplementLabel = task?.truck?.implementType
                  ? (IMPLEMENT_TYPE_LABELS[task.truck.implementType as keyof typeof IMPLEMENT_TYPE_LABELS] || task.truck.implementType)
                  : null;
                const parts: string[] = [];
                if (task?.serialNumber) parts.push(` nº de série: ${task.serialNumber}`);
                if (task?.truck?.plate) parts.push(` placa: ${task.truck.plate}`);
                if (task?.truck?.chassisNumber) parts.push(` chassi: ${task.truck.chassisNumber}`);
                if (truckCategoryLabel) parts.push(` categoria: ${truckCategoryLabel}`);
                if (truckImplementLabel) parts.push(` implemento: ${truckImplementLabel}`);
                return parts.length ? ` no veículo${parts.join(',')}` : '';
              })()}
              .
            </ThemedText>
          </View>
        </>
      )}

      {/* Services - Multi-customer grouped or flat */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Serviços</ThemedText>

        {hasMultipleCustomers && customerGroups ? (
          // Multi-customer: group services by customer
          Array.from(customerGroups.entries()).map(([customerId, group], groupIndex) => {
            const groupSubtotal = group.services.reduce(
              (sum, s) => sum + (Number(s.amount) || 0),
              0,
            );
            return (
              <View
                key={customerId}
                style={[
                  styles.customerGroupCard,
                  { borderColor: colors.border },
                ]}
              >
                <View style={[styles.customerGroupHeader, { backgroundColor: colors.muted + "40", borderBottomColor: colors.border }]}>
                  <ThemedText style={styles.customerGroupTitle}>
                    <ThemedText style={{ opacity: 0.6 }}>Cliente {groupIndex + 1}: </ThemedText>
                    {group.name}
                  </ThemedText>
                  <ThemedText style={[styles.customerGroupTotal, { opacity: 0.6 }]}>
                    {formatCurrency(groupSubtotal)}
                  </ThemedText>
                </View>
                <View style={{ padding: spacing.sm, gap: spacing.xs }}>
                  {group.services.map((svc, idx) => renderServiceRow(svc, idx))}
                </View>
              </View>
            );
          })
        ) : (
          // Single customer: flat service list
          validServices.map((item, index) => renderServiceRow(item, index))
        )}

        {/* Totals */}
        {hasDiscount ? (
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <ThemedText style={styles.bodyText}>Subtotal</ThemedText>
              <ThemedText style={styles.bodyText}>
                {formatCurrency(quote.subtotal)}
              </ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={styles.discountText}>
                Desconto
              </ThemedText>
              <ThemedText style={styles.discountText}>
                - {formatCurrency(totalDiscountAmount)}
              </ThemedText>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={styles.totalValue}>
                {formatCurrency(quote.total)}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.totalsContainer}>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={styles.totalValue}>
                {formatCurrency(quote.total)}
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Per-Customer Config Cards (multi-customer only) */}
      {hasMultipleCustomers && quote.customerConfigs && quote.customerConfigs.length >= 2 && (
        <View style={styles.section}>
          {quote.customerConfigs.map((config, i) => {
            const customer = selectedCustomers?.get(config.customerId);
            const configSubtotal = Number(config.subtotal) || 0;
            const configTotal = Number(config.total) || 0;
            const configDiscountAmount = computeConfigDiscount(configSubtotal, config.discountType, config.discountValue);
            const configPaymentText = generatePaymentText({
              customPaymentText: config.customPaymentText || null,
              paymentCondition: config.paymentCondition,
              total: configTotal,
            });

            return (
              <View
                key={config.customerId || i}
                style={[styles.configCard, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}
              >
                <ThemedText style={styles.configCardTitle}>
                  <ThemedText style={{ opacity: 0.6 }}>Cliente {i + 1}: </ThemedText>
                  {customer?.corporateName || customer?.fantasyName || "Cliente"}
                </ThemedText>

                <View style={styles.configRow}>
                  <ThemedText style={[styles.bodyText, { opacity: 0.6 }]}>Subtotal</ThemedText>
                  <ThemedText style={styles.bodyText}>{formatCurrency(configSubtotal)}</ThemedText>
                </View>

                {configDiscountAmount > 0 && (
                  <View style={styles.configRow}>
                    <ThemedText style={styles.discountText}>
                      Desconto{" "}
                      {config.discountType === "PERCENTAGE" ? `(${config.discountValue}%)` : ""}
                      {config.discountReference ? ` — ${config.discountReference}` : ""}
                    </ThemedText>
                    <ThemedText style={styles.discountText}>- {formatCurrency(configDiscountAmount)}</ThemedText>
                  </View>
                )}

                <View style={[styles.configRow, styles.configRowBorder, { borderTopColor: colors.border }]}>
                  <ThemedText style={{ fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>Total</ThemedText>
                  <ThemedText style={{ fontWeight: fontWeight.bold, fontSize: fontSize.base, color: BRAND_COLORS.primaryGreen }}>
                    {formatCurrency(configTotal)}
                  </ThemedText>
                </View>

                {configPaymentText ? (
                  <View style={{ marginTop: spacing.xs }}>
                    <ThemedText style={{ fontWeight: fontWeight.semibold, fontSize: fontSize.sm, marginBottom: 2 }}>
                      Condições de Pagamento
                    </ThemedText>
                    <ThemedText style={[styles.bodyText, { opacity: 0.6 }]}>{configPaymentText}</ThemedText>
                  </View>
                ) : null}

                {config.orderNumber ? (
                  <View style={[styles.configRow, { marginTop: spacing.xs }]}>
                    <ThemedText style={[styles.bodyText, { opacity: 0.6 }]}>N° do Pedido</ThemedText>
                    <ThemedText style={styles.bodyText}>{config.orderNumber}</ThemedText>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* Single customer payment conditions */}
      {!hasMultipleCustomers && (() => {
        const config = quote.customerConfigs?.[0];
        if (!config) return null;
        const configTotal = Number(config.total) || 0;
        const paymentText = generatePaymentText({
          customPaymentText: config.customPaymentText || null,
          paymentCondition: config.paymentCondition,
          total: configTotal,
        });
        if (!paymentText && !config.orderNumber) return null;
        return (
          <View style={styles.section}>
            {paymentText ? (
              <>
                <ThemedText style={styles.sectionTitle}>
                  Condições de pagamento
                </ThemedText>
                <ThemedText style={styles.bodyText}>{paymentText}</ThemedText>
              </>
            ) : null}
            {config.orderNumber ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: paymentText ? spacing.xs : 0 }}>
                <ThemedText style={[styles.bodyText, { opacity: 0.6 }]}>N° do Pedido</ThemedText>
                <ThemedText style={styles.bodyText}>{config.orderNumber}</ThemedText>
              </View>
            ) : null}
          </View>
        );
      })()}

      {/* Budget-only sections: Delivery, Guarantee, Layout, Signatures, Footer */}
      {mode === 'budget' && (
        <>
          {/* Delivery Deadline */}
          {(quote.customForecastDays || (quote.simultaneousTasks && quote.simultaneousTasks > 1) || termDate) ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Prazo de entrega
              </ThemedText>
              {quote.customForecastDays ? (
                <ThemedText style={styles.bodyText}>
                  O prazo de entrega é de {quote.customForecastDays} dias úteis a partir da data de liberação.
                  {quote.simultaneousTasks && quote.simultaneousTasks > 1
                    ? ` Capacidade de produção: ${quote.simultaneousTasks} tarefas simultâneas.`
                    : ""}
                </ThemedText>
              ) : quote.simultaneousTasks && quote.simultaneousTasks > 1 ? (
                <ThemedText style={styles.bodyText}>
                  Capacidade de produção: {quote.simultaneousTasks} tarefas simultâneas.
                </ThemedText>
              ) : termDate ? (
                <ThemedText style={styles.bodyText}>
                  O prazo de entrega é de {termDate}, desde que o implemento
                  esteja nas condições previamente informada e não haja
                  alterações nos serviços descritos.
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          {/* Guarantee */}
          {(quote.guaranteeYears || quote.customGuaranteeText) ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Garantias</ThemedText>
              <ThemedText style={styles.bodyText}>{generateGuaranteeText(quote)}</ThemedText>
            </View>
          ) : null}

          {/* Layout Image */}
          {layoutImageUrl ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Layout aprovado
              </ThemedText>
              <Image
                source={{ uri: layoutImageUrl }}
                style={styles.layoutImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Signature area */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureImageContainer}>
                <Image
                  source={require("../../../../../assets/sergio-signature.webp")}
                  style={styles.sergioSignature}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.signatureLine, { backgroundColor: colors.foreground }]} />
              <ThemedText style={styles.signatureName}>{DIRECTOR_INFO.name}</ThemedText>
              <ThemedText style={styles.signatureRole}>{DIRECTOR_INFO.title}</ThemedText>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureImageContainer} />
              <View style={[styles.signatureLine, { backgroundColor: colors.foreground }]} />
              <ThemedText style={styles.signatureName}>Responsável CLIENTE</ThemedText>
              <ThemedText style={styles.signatureRole}>&nbsp;</ThemedText>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <ThemedText style={styles.footerCompany}>{COMPANY_INFO.name}</ThemedText>
            <ThemedText style={styles.footerText}>{COMPANY_INFO.address}</ThemedText>
            <ThemedText style={[styles.footerText, { color: BRAND_COLORS.primaryGreen }]}>{COMPANY_INFO.phone}</ThemedText>
            <ThemedText style={[styles.footerText, { color: BRAND_COLORS.primaryGreen }]}>{COMPANY_INFO.website}</ThemedText>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Flat container — no background or border, so it blends cleanly when
    // rendered inside a FormCard (no "nested card" visual).
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  companyName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: BRAND_COLORS.primaryGreen,
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  budgetTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  headerMeta: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: BRAND_COLORS.primaryGreen,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: BRAND_COLORS.primaryGreen,
    marginBottom: spacing.xs,
  },
  section: {
    gap: spacing.xs,
  },
  customerName: {
    fontWeight: fontWeight.bold,
    color: BRAND_COLORS.primaryGreen,
  },
  bodyText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    opacity: 0.9,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  serviceDescription: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  serviceAmount: {
    fontSize: fontSize.sm,
    flexShrink: 0,
  },
  strikethroughAmount: {
    fontSize: fontSize.xs,
    opacity: 0.5,
    textDecorationLine: "line-through",
    flexShrink: 0,
  },
  totalsContainer: {
    marginTop: spacing.md,
    paddingLeft: spacing.md,
    gap: spacing.xs,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  totalRowFinal: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    marginTop: spacing.xs,
  },
  discountText: {
    fontSize: fontSize.sm,
    color: "#dc2626",
  },
  totalLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: BRAND_COLORS.primaryGreen,
  },
  layoutImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  // Multi-customer grouping styles
  customerGroupCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  customerGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  customerGroupTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  customerGroupTotal: {
    fontSize: fontSize.xs,
  },
  // Per-customer config card styles
  configCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  configCardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  configRowBorder: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    marginTop: spacing.xs,
  },
  // Signature styles
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  signatureBlock: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  signatureImageContainer: {
    height: 64,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sergioSignature: {
    width: 120,
    height: 60,
  },
  signatureLine: {
    width: "80%",
    height: 1,
    marginBottom: spacing.xs,
  },
  signatureName: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  signatureRole: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    textAlign: "center",
  },
  footer: {
    gap: 2,
    marginTop: spacing.md,
  },
  footerCompany: {
    fontWeight: fontWeight.bold,
    color: BRAND_COLORS.primaryGreen,
    marginTop: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
});
