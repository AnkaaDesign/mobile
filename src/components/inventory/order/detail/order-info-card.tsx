import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "../list/order-status-badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatDate, formatDateTime, formatCurrency, formatCNPJ, formatPixKey, formatBrazilianPhone } from "@/utils";
import type { Order } from "../../../../types";
import {
  IconPackage,
  IconTruck,
  IconId,
  IconFileText,
  IconCurrencyReal,
  IconCalendar,
  IconNotes,
  IconPhone,
  IconMail,
  IconCreditCard,
  IconBrandWhatsapp,
} from "@tabler/icons-react-native";
import { PAYMENT_METHOD_LABELS } from "@/constants";

interface OrderInfoCardProps {
  order: Order;
}

export const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order }) => {
  const { colors } = useTheme();

  // Check if order has temporary items
  const hasTemporaryItems = order.items?.some((item) => item.temporaryItemDescription);

  // Calculate order total with taxes
  const orderTotal = useMemo(() => {
    if (!order?.items) return 0;
    return order.items.reduce((total, item) => {
      const subtotal = item.orderedQuantity * item.price;
      const icmsAmount = subtotal * (item.icms / 100);
      const ipiAmount = subtotal * (item.ipi / 100);
      return total + subtotal + icmsAmount + ipiAmount;
    }, 0);
  }, [order?.items]);

  const handlePhonePress = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const handleWhatsAppPress = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    // Try opening WhatsApp app directly first
    try {
      await Linking.openURL(`whatsapp://send?phone=${whatsappNumber}`);
    } catch {
      // Fallback to web WhatsApp
      try {
        await Linking.openURL(`https://wa.me/${whatsappNumber}`);
      } catch {
        // Silent fail
      }
    }
  };

  const handleEmailPress = () => {
    if (order.supplier?.email) {
      Linking.openURL(`mailto:${order.supplier.email}`).catch(() => {});
    }
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconPackage size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Pedido</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <OrderStatusBadge status={order.status} size="md" />
          {hasTemporaryItems && (
            <Badge variant="outline" size="sm">
              <ThemedText style={[styles.badgeText, { color: colors.mutedForeground }]}>
                Temporário
              </ThemedText>
            </Badge>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* Supplier Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
            Fornecedor
          </ThemedText>
          {order.supplier ? (
            <View style={styles.supplierContent}>
              {/* Fantasy Name */}
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
                <View style={styles.infoLabel}>
                  <IconTruck size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Nome Fantasia
                  </ThemedText>
                </View>
                <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                  {order.supplier.fantasyName}
                </ThemedText>
              </View>

              {/* CNPJ */}
              {order.supplier.cnpj && (
                <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
                  <View style={styles.infoLabel}>
                    <IconId size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                      CNPJ
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                    {formatCNPJ(order.supplier.cnpj)}
                  </ThemedText>
                </View>
              )}

              {/* Phone */}
              {order.supplier.phones && order.supplier.phones.length > 0 && (
                <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
                  <View style={styles.infoLabel}>
                    <IconPhone size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                      Telefone
                    </ThemedText>
                  </View>
                  <View style={styles.phoneContainer}>
                    <TouchableOpacity
                      onPress={() => handlePhonePress(order.supplier!.phones[0])}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={[styles.phoneValue, { color: "#16a34a" }]}>
                        {formatBrazilianPhone(order.supplier!.phones[0])}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleWhatsAppPress(order.supplier!.phones[0])}
                      activeOpacity={0.7}
                    >
                      <IconBrandWhatsapp size={20} color="#16a34a" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Email */}
              {order.supplier.email && (
                <TouchableOpacity
                  style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}
                  onPress={handleEmailPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.infoLabel}>
                    <IconMail size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                      Email
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={[styles.valueText, styles.linkText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {order.supplier.email}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhum fornecedor associado
            </ThemedText>
          )}
        </View>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* Order Details Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
            Detalhes do Pedido
          </ThemedText>

          {/* Description */}
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.infoLabel}>
              <IconFileText size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                Descrição
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.valueText, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {order.description || "-"}
            </ThemedText>
          </View>

          {/* Total Value */}
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.infoLabel}>
              <IconCurrencyReal size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                Valor Total
              </ThemedText>
            </View>
            <ThemedText style={[styles.valueText, styles.totalValue, { color: colors.primary }]}>
              {formatCurrency(orderTotal)}
            </ThemedText>
          </View>

          {/* Forecast */}
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.infoLabel}>
              <IconCalendar size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                Previsão de Entrega
              </ThemedText>
            </View>
            <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
              {order.forecast ? formatDate(order.forecast) : "-"}
            </ThemedText>
          </View>

          {/* Created At */}
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.infoLabel}>
              <IconCalendar size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                Data do Pedido
              </ThemedText>
            </View>
            <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
              {formatDateTime(order.createdAt)}
            </ThemedText>
          </View>

          {/* Updated At */}
          {order.updatedAt && (
            <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.infoLabel}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                  Atualizado em
                </ThemedText>
              </View>
              <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                {formatDateTime(order.updatedAt)}
              </ThemedText>
            </View>
          )}

          {/* Total Items */}
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.infoLabel}>
              <IconPackage size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                Total de Itens
              </ThemedText>
            </View>
            <Badge variant="secondary" size="sm">
              <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                {order.items?.length || 0} itens
              </ThemedText>
            </Badge>
          </View>

          {/* Origin (if from schedule) */}
          {order.orderSchedule && (
            <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.infoLabel}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                  Origem
                </ThemedText>
              </View>
              <Badge variant="outline" size="sm">
                <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                  Agendado
                </ThemedText>
              </Badge>
            </View>
          )}

          {/* Notes */}
          {order.notes && (
            <View style={[styles.notesContainer, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.notesHeader}>
                <IconNotes size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                  Observações
                </ThemedText>
              </View>
              <ThemedText style={[styles.notesText, { color: colors.foreground }]}>
                {order.notes}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Payment Information Section */}
        {order.paymentMethod && (
          <>
            {/* Separator */}
            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Pagamento
              </ThemedText>

              {/* Payment Method */}
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
                <View style={styles.infoLabel}>
                  <IconCreditCard size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Método de Pagamento
                  </ThemedText>
                </View>
                <Badge variant="outline" size="sm">
                  <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                    {PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}
                  </ThemedText>
                </Badge>
              </View>

              {/* PIX Key (only when payment method is PIX) */}
              {order.paymentMethod === "PIX" && order.paymentPix && (
                <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
                  <View style={styles.infoLabel}>
                    <IconCreditCard size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                      Chave Pix
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                    {formatPixKey(order.paymentPix)}
                  </ThemedText>
                </View>
              )}

              {/* Due Days (only when payment method is BANK_SLIP) */}
              {order.paymentMethod === "BANK_SLIP" && order.paymentDueDays && (
                <View style={[styles.infoRow, { backgroundColor: colors.muted + "50" }]}>
                  <View style={styles.infoLabel}>
                    <IconCalendar size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.labelText, { color: colors.mutedForeground }]}>
                      Prazo de Vencimento
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                    {order.paymentDueDays} dias
                  </ThemedText>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500" as const,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  supplierContent: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  labelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  valueText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
    flex: 1,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  phoneValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    fontFamily: "monospace",
  },
  totalValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  linkText: {
    textDecorationLine: "underline",
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
    paddingVertical: spacing.sm,
  },
  separator: {
    height: 1,
  },
  notesContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
