import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { formatCurrency, formatDate } from "@/utils";
import { generatePaymentText, generateGuaranteeText } from "@/utils/quote-text-generators";
import { getFileUrl } from "@/utils/file-utils";
import { computeServiceDiscount, computeServiceNet } from "@/utils/task-quote-calculations";
import { DISCOUNT_TYPE_LABELS } from "@/constants/enum-labels";
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
  discountType?: string;
  discountValue?: number | null;
  discountReference?: string | null;
  invoiceToCustomerId?: string | null;
}

interface CustomerConfig {
  customerId: string;
  subtotal: number;
  total: number;
  paymentCondition?: string | null;
  downPaymentDate?: Date | string | null;
  customPaymentText?: string | null;
  responsibleId?: string | null;
  generateInvoice?: boolean;
}

interface BudgetPreviewProps {
  pricing: {
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
    responsibles?: { id: string; name?: string; role?: string }[];
  };
  selectedCustomers?: Map<string, any>;
}

export function BudgetPreview({ pricing, task, selectedCustomers }: BudgetPreviewProps) {
  const { colors } = useTheme();

  const corporateName =
    task?.customer?.corporateName ||
    task?.customer?.fantasyName ||
    "Cliente";
  // Prefer the explicitly selected budget responsible from first customer config
  const activeConfig = pricing.customerConfigs?.[0];
  const selectedResponsible = activeConfig?.responsibleId
    ? task?.responsibles?.find((r: any) => r.id === activeConfig.responsibleId)
    : null;
  const commercialRep = task?.responsibles?.find((r: any) => r.role === "COMMERCIAL");
  const contactName = selectedResponsible?.name
    || commercialRep?.name
    || task?.responsibles?.[0]?.name
    || "";
  const budgetNumber = pricing.budgetNumber
    ? String(pricing.budgetNumber).padStart(4, "0")
    : task?.serialNumber || "0000";

  const validityDays = pricing.expiresAt
    ? Math.max(
        0,
        Math.round(
          (new Date(pricing.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 30;

  const termDate = task?.term ? formatDate(task.term as any) : "";

  // Compute total discount from per-service discounts
  const totalDiscountAmount = (pricing.services || []).reduce((sum, svc) => {
    const amount = Number(svc.amount) || 0;
    return sum + computeServiceDiscount(amount, svc.discountType, svc.discountValue);
  }, 0);
  const hasDiscount = totalDiscountAmount > 0;

  // Multi-customer support
  const hasMultipleCustomers =
    Array.isArray(pricing.customerConfigs) && pricing.customerConfigs.length >= 2;
  const validServices = (pricing.services || []).filter((s) => s.description?.trim());

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
    (pricing.layoutFile as any)?.uri // Newly selected file - use local URI
      ? (pricing.layoutFile as any).uri
      : pricing.layoutFile?.id // Uploaded file - use getFileUrl
      ? getFileUrl(pricing.layoutFile as any)
      : null;

  // Render a single service row with discount details
  const renderServiceRow = (item: ServiceItem, index: number) => {
    const amount = Number(item.amount) || 0;
    const discount = computeServiceDiscount(amount, item.discountType, item.discountValue);
    const net = computeServiceNet({ amount, discountType: item.discountType, discountValue: item.discountValue });
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
            {observation ? (
              <ThemedText style={{ opacity: 0.6, fontStyle: "italic" }}> — {observation}</ThemedText>
            ) : null}
          </ThemedText>
          <View style={{ alignItems: "flex-end" }}>
            {discount > 0 ? (
              <>
                <ThemedText style={styles.strikethroughAmount}>
                  {formatCurrency(amount)}
                </ThemedText>
                <ThemedText style={styles.serviceAmount}>
                  {formatCurrency(net)}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={styles.serviceAmount}>
                {formatCurrency(amount)}
              </ThemedText>
            )}
          </View>
        </View>
        {discount > 0 && (
          <View style={{ paddingLeft: spacing.lg, marginTop: 2 }}>
            <ThemedText style={styles.discountText}>
              Desc: {item.discountType === "PERCENTAGE" ? `${item.discountValue}%` : formatCurrency(discount)}
              {" "}({DISCOUNT_TYPE_LABELS[item.discountType as keyof typeof DISCOUNT_TYPE_LABELS] || item.discountType})
              {item.discountReference ? ` — ${item.discountReference}` : ""}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.companyName}>{COMPANY_INFO.name}</ThemedText>
        <View style={styles.headerRight}>
          <ThemedText style={styles.budgetTitle}>
            Orçamento Nº {budgetNumber}
          </ThemedText>
          {pricing.createdAt && (
            <ThemedText style={styles.headerMeta}>
              Emissão: {formatDate(pricing.createdAt as any)}
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
        <ThemedText style={styles.customerName}>
          À {corporateName}
        </ThemedText>
        {contactName ? (
          <ThemedText style={styles.bodyText}>
            Caro {contactName}
          </ThemedText>
        ) : null}
        <ThemedText style={styles.bodyText}>
          Conforme solicitado, apresentamos nossa proposta de preço para
          execução dos serviços abaixo descriminados.
        </ThemedText>
      </View>

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
                {formatCurrency(pricing.subtotal)}
              </ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={styles.discountText}>
                Desconto (serviços)
              </ThemedText>
              <ThemedText style={styles.discountText}>
                - {formatCurrency(totalDiscountAmount)}
              </ThemedText>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={styles.totalValue}>
                {formatCurrency(pricing.total)}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.totalsContainer}>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={styles.totalValue}>
                {formatCurrency(pricing.total)}
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Per-Customer Config Cards (multi-customer only) */}
      {hasMultipleCustomers && pricing.customerConfigs && pricing.customerConfigs.length >= 2 && (
        <View style={styles.section}>
          {pricing.customerConfigs.map((config, i) => {
            const customer = selectedCustomers?.get(config.customerId);
            const configSubtotal = Number(config.subtotal) || 0;
            const configTotal = Number(config.total) || 0;
            const configDiscountAmount = Math.max(0, configSubtotal - configTotal);
            const configPaymentText = generatePaymentText({
              customPaymentText: config.customPaymentText || null,
              paymentCondition: config.paymentCondition,
              downPaymentDate: config.downPaymentDate,
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
                    <ThemedText style={styles.discountText}>Desconto (serviços)</ThemedText>
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
              </View>
            );
          })}
        </View>
      )}

      {/* Single customer payment conditions */}
      {!hasMultipleCustomers && (() => {
        const config = pricing.customerConfigs?.[0];
        if (!config) return null;
        const configTotal = Number(config.total) || 0;
        const paymentText = generatePaymentText({
          customPaymentText: config.customPaymentText || null,
          paymentCondition: config.paymentCondition,
          downPaymentDate: config.downPaymentDate,
          total: configTotal,
        });
        if (!paymentText) return null;
        return (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Condições de pagamento
            </ThemedText>
            <ThemedText style={styles.bodyText}>{paymentText}</ThemedText>
          </View>
        );
      })()}

      {/* Delivery Deadline - from customForecastDays/simultaneousTasks or term */}
      {(pricing.customForecastDays || (pricing.simultaneousTasks && pricing.simultaneousTasks > 1) || termDate) ? (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Prazo de entrega
          </ThemedText>
          {pricing.customForecastDays ? (
            <ThemedText style={styles.bodyText}>
              O prazo de entrega é de {pricing.customForecastDays} dias úteis a partir da data de liberação.
              {pricing.simultaneousTasks && pricing.simultaneousTasks > 1
                ? ` Capacidade de produção: ${pricing.simultaneousTasks} tarefas simultâneas.`
                : ""}
            </ThemedText>
          ) : pricing.simultaneousTasks && pricing.simultaneousTasks > 1 ? (
            <ThemedText style={styles.bodyText}>
              Capacidade de produção: {pricing.simultaneousTasks} tarefas simultâneas.
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
      {(pricing.guaranteeYears || pricing.customGuaranteeText) ? (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Garantias</ThemedText>
          <ThemedText style={styles.bodyText}>{generateGuaranteeText(pricing)}</ThemedText>
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
        {/* Company Signature - Sergio */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureImageContainer}>
            <Image
              source={require("../../../../../assets/sergio-signature.webp")}
              style={styles.sergioSignature}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.signatureLine, { backgroundColor: colors.foreground }]} />
          <ThemedText style={styles.signatureName}>
            {DIRECTOR_INFO.name}
          </ThemedText>
          <ThemedText style={styles.signatureRole}>
            {DIRECTOR_INFO.title}
          </ThemedText>
        </View>

        {/* Customer Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureImageContainer}>
            {/* Placeholder for customer signature */}
          </View>
          <View style={[styles.signatureLine, { backgroundColor: colors.foreground }]} />
          <ThemedText style={styles.signatureName}>
            Responsável CLIENTE
          </ThemedText>
          <ThemedText style={styles.signatureRole}>&nbsp;</ThemedText>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <ThemedText style={styles.footerCompany}>{COMPANY_INFO.name}</ThemedText>
        <ThemedText style={styles.footerText}>{COMPANY_INFO.address}</ThemedText>
        <ThemedText style={[styles.footerText, { color: BRAND_COLORS.primaryGreen }]}>
          {COMPANY_INFO.phone}
        </ThemedText>
        <ThemedText style={[styles.footerText, { color: BRAND_COLORS.primaryGreen }]}>
          {COMPANY_INFO.website}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: spacing.lg,
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
