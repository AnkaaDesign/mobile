import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "../list/order-status-badge";
import { DetailCard, DetailField, DetailPhoneField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate, formatDateTime, formatCurrency, formatCNPJ, formatPixKey } from "@/utils";
import type { Order } from "../../../../types";
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

  const handleEmailPress = () => {
    if (order.supplier?.email) {
      const { Linking } = require("react-native");
      Linking.openURL(`mailto:${order.supplier.email}`).catch(() => {});
    }
  };

  return (
    <DetailCard
      title="Informações do Pedido"
      icon="package"
      badge={
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
      }
    >
      {/* Supplier Section */}
      <DetailSection title="Fornecedor">
        {order.supplier ? (
          <View style={styles.supplierContent}>
            {/* Fantasy Name */}
            <DetailField
              label="Nome Fantasia"
              value={order.supplier.fantasyName}
              icon="truck"
            />

            {/* CNPJ */}
            {order.supplier.cnpj && (
              <DetailField
                label="CNPJ"
                value={formatCNPJ(order.supplier.cnpj)}
                icon="id"
                monospace
              />
            )}

            {/* Phone */}
            {order.supplier.phones && order.supplier.phones.length > 0 && (
              <DetailPhoneField
                label="Telefone"
                phone={order.supplier.phones[0]}
                icon="phone"
              />
            )}

            {/* Email */}
            {order.supplier.email && (
              <DetailField
                label="Email"
                icon="mail"
                value={
                  <TouchableOpacity
                    onPress={handleEmailPress}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[styles.linkText, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {order.supplier.email}
                    </ThemedText>
                  </TouchableOpacity>
                }
              />
            )}
          </View>
        ) : (
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhum fornecedor associado
          </ThemedText>
        )}
      </DetailSection>

      {/* Separator */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* Order Details Section */}
      <DetailSection title="Detalhes do Pedido">
        {/* Description */}
        <DetailField
          label="Descrição"
          value={order.description || "-"}
          icon="file-text"
        />

        {/* Total Value */}
        <DetailField
          label="Valor Total"
          icon="coins"
          value={
            <ThemedText style={[styles.totalValue, { color: colors.primary }]}>
              {formatCurrency(orderTotal)}
            </ThemedText>
          }
        />

        {/* Forecast */}
        <DetailField
          label="Previsão de Entrega"
          value={order.forecast ? formatDate(order.forecast) : "-"}
          icon="calendar"
        />

        {/* Created At */}
        <DetailField
          label="Data do Pedido"
          value={formatDateTime(order.createdAt)}
          icon="calendar"
        />

        {/* Updated At */}
        {order.updatedAt && (
          <DetailField
            label="Atualizado em"
            value={formatDateTime(order.updatedAt)}
            icon="calendar"
          />
        )}

        {/* Total Items */}
        <DetailField
          label="Total de Itens"
          icon="package"
          value={
            <Badge variant="secondary" size="sm">
              <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                {order.items?.length || 0} itens
              </ThemedText>
            </Badge>
          }
        />

        {/* Origin (if from schedule) */}
        {order.orderSchedule && (
          <DetailField
            label="Origem"
            icon="calendar"
            value={
              <Badge variant="outline" size="sm">
                <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                  Agendado
                </ThemedText>
              </Badge>
            }
          />
        )}

        {/* Notes */}
        {order.notes && (
          <DetailField
            label="Observações"
            value={order.notes}
            icon="note"
          />
        )}
      </DetailSection>

      {/* Payment Information Section */}
      {(order.paymentMethod || order.paymentResponsible || order.paymentResponsibleId) && (
        <>
          {/* Separator */}
          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <DetailSection title="Pagamento">
            {/* Payment Responsible */}
            {(order.paymentResponsible || order.paymentResponsibleId) && (
              <DetailField
                label="Responsável pelo Pagamento"
                value={order.paymentResponsible?.name || "Responsável definido"}
                icon="user"
              />
            )}

            {/* Payment Method */}
            {order.paymentMethod && (
              <DetailField
                label="Método de Pagamento"
                icon="receipt"
                value={
                  <Badge variant="outline" size="sm">
                    <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                      {PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}
                    </ThemedText>
                  </Badge>
                }
              />
            )}

            {/* PIX Key (only when payment method is PIX) */}
            {order.paymentMethod === "PIX" && order.paymentPix && (
              <DetailField
                label="Chave Pix"
                value={formatPixKey(order.paymentPix)}
                icon="receipt"
              />
            )}

            {/* Due Days (only when payment method is BANK_SLIP) */}
            {order.paymentMethod === "BANK_SLIP" && order.paymentDueDays && (
              <DetailField
                label="Prazo de Vencimento"
                value={`${order.paymentDueDays} dias`}
                icon="calendar"
              />
            )}

            {/* Payment Assigned By */}
            {order.paymentAssignedBy && (
              <DetailField
                label="Atribuído por"
                value={order.paymentAssignedBy.name}
                icon="user"
              />
            )}
          </DetailSection>
        </>
      )}
    </DetailCard>
  );
};

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  supplierContent: {
    gap: spacing.md,
  },
  totalValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  linkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
});
