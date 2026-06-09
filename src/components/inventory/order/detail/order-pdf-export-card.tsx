import { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { IconFileText, IconBrandWhatsapp } from "@tabler/icons-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useCanViewPrices } from "@/hooks";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { exportOrderPdf, type OrderPdfData, type OrderPdfLineItem } from "@/utils/order-pdf-generator";
import { buildOrderCode } from "@/utils/order-code";
import type { Order } from "@/types";

interface OrderPdfExportCardProps {
  order: Order;
}

/** Compact one-line measures summary for an item (value + unit, first two). */
function formatMeasures(measures?: { value: number | null; unit: string | null }[] | null): string {
  if (!measures || measures.length === 0) return "-";
  const parts = measures
    .filter((m) => m.value != null)
    .map((m) => `${m.value}${m.unit ? ` ${m.unit}` : ""}`);
  if (parts.length === 0) return "-";
  if (parts.length > 2) return `${parts.slice(0, 2).join(" - ")} +${parts.length - 2}`;
  return parts.join(" - ");
}

/**
 * Order detail action card: exports the branded order PDF and shares it (incl. to
 * WhatsApp via the OS share sheet). Mirrors the web "Exportar PDF" experience —
 * with values, as a budget request, and a direct WhatsApp share.
 */
export function OrderPdfExportCard({ order }: OrderPdfExportCardProps) {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();

  const buildData = useCallback(
    (includePricing: boolean, documentType: string): OrderPdfData => {
      const items: OrderPdfLineItem[] = (order.items || []).map((orderItem) => ({
        code: orderItem.item?.uniCode || "-",
        name: orderItem.temporaryItemDescription || orderItem.item?.name || "-",
        brand: orderItem.item?.brands?.map((b) => b.name).join(", ") || "-",
        measures: formatMeasures(orderItem.item?.measures),
        quantity: orderItem.orderedQuantity || 0,
        unitPrice: orderItem.price ?? 0,
        icms: orderItem.icms ?? 0,
        ipi: orderItem.ipi ?? 0,
      }));

      return {
        title: buildOrderCode(order),
        documentType,
        includePricing,
        description: order.description || undefined,
        supplierName: order.supplier?.fantasyName || order.supplier?.corporateName || undefined,
        orderDate: order.createdAt,
        forecastDate: order.forecast,
        freight: (order as any).freight ?? 0,
        discount: order.discount ?? 0,
        notes: order.notes,
        items,
      };
    },
    [order],
  );

  const handleExportWithValues = useCallback(() => {
    void exportOrderPdf(buildData(true, "Pedido de Compra"), { dialogTitle: "Exportar PDF" });
  }, [buildData]);

  const handleExportBudgetRequest = useCallback(() => {
    void exportOrderPdf(buildData(false, "Solicitação de Orçamento"), {
      dialogTitle: "Solicitação de Orçamento",
    });
  }, [buildData]);

  const handleSendWhatsApp = useCallback(() => {
    // Same branded PDF; the OS share sheet surfaces WhatsApp, where the user picks
    // the supplier contact and sends the attached document.
    void exportOrderPdf(buildData(canViewPrices, "Pedido de Compra"), {
      dialogTitle: "Enviar no WhatsApp",
    });
  }, [buildData, canViewPrices]);

  return (
    <Card style={styles.card}>
      <ThemedText style={[styles.title, { color: colors.foreground }]}>Exportar Pedido</ThemedText>
      <View style={styles.buttons}>
        {canViewPrices && (
          <Button
            variant="outline"
            onPress={handleExportWithValues}
            icon={<IconFileText size={18} color={colors.foreground} />}
          >
            Exportar PDF
          </Button>
        )}
        <Button
          variant="outline"
          onPress={handleExportBudgetRequest}
          icon={<IconFileText size={18} color={colors.foreground} />}
        >
          Solicitação de Orçamento
        </Button>
        <Button
          variant="default"
          onPress={handleSendWhatsApp}
          icon={<IconBrandWhatsapp size={18} color="#fff" />}
        >
          Enviar no WhatsApp
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  buttons: {
    gap: spacing.sm,
  },
});
