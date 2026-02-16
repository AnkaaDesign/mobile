import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { formatCurrency, formatDate } from "@/utils";
import { generatePaymentText, generateGuaranteeText } from "@/utils/pricing-text-generators";
import { getFileUrl } from "@/utils/file-utils";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import type { TaskPricing } from "@/types/task-pricing";
import { COMPANY_INFO, DIRECTOR_INFO, BRAND_COLORS } from "@/config/company";

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}

interface BudgetPreviewProps {
  pricing: {
    budgetNumber?: number;
    subtotal: number;
    discountType: string;
    discountValue: number | null;
    total: number;
    expiresAt?: Date | string | null;
    status: string;
    paymentCondition?: string | null;
    customPaymentText?: string | null;
    guaranteeYears?: number | null;
    customGuaranteeText?: string | null;
    layoutFileId?: string | null;
    layoutFile?: { id: string } | null;
    items?: Array<{
      id?: string;
      description: string;
      observation?: string | null;
      amount: number;
    }>;
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
    representatives?: { id: string; name?: string }[];
  };
}

export function BudgetPreview({ pricing, task }: BudgetPreviewProps) {
  const { colors } = useTheme();

  const corporateName =
    task?.customer?.corporateName ||
    task?.customer?.fantasyName ||
    "Cliente";
  const contactName = task?.representatives?.[0]?.name || "";
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
  const paymentText = generatePaymentText(pricing as TaskPricing);
  const guaranteeText = generateGuaranteeText(pricing as TaskPricing);
  const hasDiscount =
    pricing.discountType !== "NONE" &&
    pricing.discountValue != null &&
    pricing.discountValue > 0;
  const discountAmount =
    pricing.discountType === "PERCENTAGE"
      ? (pricing.subtotal * (pricing.discountValue || 0)) / 100
      : pricing.discountValue || 0;

  // Handle both uploaded files (with id) and newly selected files (with uri)
  const layoutImageUrl =
    (pricing.layoutFile as any)?.uri // Newly selected file - use local URI
      ? (pricing.layoutFile as any).uri
      : pricing.layoutFile?.id // Uploaded file - use getFileUrl
      ? getFileUrl(pricing.layoutFile as any)
      : null;

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

      {/* Services */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Serviços</ThemedText>
        {pricing.items?.map((item, index) => {
          const description = toTitleCase(item.description || "");
          const observation = item.observation
            ? toTitleCase(item.observation)
            : "";
          const displayText = observation
            ? `${description} ${observation}`
            : description;
          return (
            <View key={item.id || index} style={styles.serviceRow}>
              <ThemedText style={styles.serviceDescription} numberOfLines={2}>
                {index + 1} - {displayText}
              </ThemedText>
              <ThemedText style={styles.serviceAmount}>
                {formatCurrency(Number(item.amount) || 0)}
              </ThemedText>
            </View>
          );
        })}

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
                Desconto
                {pricing.discountType === "PERCENTAGE"
                  ? ` (${pricing.discountValue}%)`
                  : ""}
              </ThemedText>
              <ThemedText style={styles.discountText}>
                - {formatCurrency(discountAmount)}
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

      {/* Delivery Term */}
      {termDate ? (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Prazo de entrega
          </ThemedText>
          <ThemedText style={styles.bodyText}>
            O prazo de entrega é de {termDate}, desde que o implemento
            esteja nas condições previamente informada e não haja
            alterações nos serviços descritos.
          </ThemedText>
        </View>
      ) : null}

      {/* Payment Terms */}
      {paymentText ? (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Condições de pagamento
          </ThemedText>
          <ThemedText style={styles.bodyText}>{paymentText}</ThemedText>
        </View>
      ) : null}

      {/* Guarantee */}
      {guaranteeText ? (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Garantias</ThemedText>
          <ThemedText style={styles.bodyText}>{guaranteeText}</ThemedText>
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
