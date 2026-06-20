import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "../list/order-status-badge";
import { DetailCard, DetailField, DetailPhoneField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate, formatDateTime, formatCurrency, formatCNPJ, formatPixKey } from "@/utils";
import { formatOrderNumber } from "@/utils/order-code";
import type { Order } from "../../../../types";
import { PAYMENT_METHOD_LABELS, ORDER_INSTALLMENT_STATUS_LABELS, getBadgeVariant } from "@/constants";
import { useCanViewPrices } from "@/hooks";

interface OrderInfoCardProps {
  order: Order;
}

export const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order }) => {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();

  // Check if order has temporary items
  const hasTemporaryItems = order.items?.some((item) => item.temporaryItemDescription);

  // Boleto parcela schedule, ordered by number (single-payment orders carry none).
  const sortedInstallments = useMemo(
    () => (order.installments || []).slice().sort((a, b) => (a.number || 0) - (b.number || 0)),
    [order.installments],
  );

  // Calculate order total with taxes. Mirrors the API's computeOrderPayableTotal:
  // items grossed up by ICMS/IPI, minus discount% on the pre-tax goods subtotal,
  // plus freight, rounded to centavos.
  const orderTotal = useMemo(() => {
    if (!order?.items) return 0;
    let goodsSubtotal = 0;
    let itemsTotal = 0;
    for (const item of order.items) {
      const subtotal = item.orderedQuantity * item.price;
      goodsSubtotal += subtotal;
      itemsTotal += subtotal * (1 + (item.icms || 0) / 100 + (item.ipi || 0) / 100);
    }
    const discount = order.discount || 0;
    const discountAmount = discount > 0 ? goodsSubtotal * (discount / 100) : 0;
    const total = itemsTotal - discountAmount + (order.freight || 0);
    return Math.max(0, Math.round(total * 100) / 100);
  }, [order?.items, order?.discount, order?.freight]);

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
        {/* Order number */}
        <DetailField
          label="Número do Pedido"
          value={order.orderNumber != null ? formatOrderNumber(order.orderNumber) : "—"}
          icon="hash"
        />

        {/* Description */}
        <DetailField
          label="Descrição"
          value={order.description || "-"}
          icon="file-text"
        />

        {/* Total Value */}
        {canViewPrices && (
          <DetailField
            label="Valor Total"
            icon="coins"
            value={
              <ThemedText style={[styles.totalValue, { color: colors.primary }]}>
                {formatCurrency(orderTotal)}
              </ThemedText>
            }
          />
        )}

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

      {/* Payment Information Section — financial-only, hidden from WAREHOUSE. */}
      {canViewPrices && (order.paymentMethod || order.paymentResponsible || order.paymentResponsibleId) && (
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

            {/* Parcelas (only when payment method is BANK_SLIP with 2x+) */}
            {order.paymentMethod === "BANK_SLIP" && (order.installmentCount || 1) > 1 && (
              <DetailField
                label="Parcelas"
                value={`${order.installmentCount}x`}
                icon="receipt"
              />
            )}

            {/* First due date (only when payment method is BANK_SLIP) */}
            {order.paymentMethod === "BANK_SLIP" && order.paymentFirstDueDate && (
              <DetailField
                label={(order.installmentCount || 1) > 1 ? "1º Vencimento" : "Vencimento"}
                value={formatDate(order.paymentFirstDueDate)}
                icon="calendar"
              />
            )}

            {/* Interval between parcelas (only when BANK_SLIP with 2x+) */}
            {order.paymentMethod === "BANK_SLIP" && (order.installmentCount || 1) > 1 && order.paymentDueDays && (
              <DetailField
                label="Intervalo entre Parcelas"
                value={`${order.paymentDueDays} dias`}
                icon="calendar"
              />
            )}

            {/* Paid at */}
            {order.paidAt && (
              <DetailField
                label="Pago em"
                value={formatDateTime(order.paidAt)}
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

          {/* Installment schedule (boleto 2x/3x) — one row per parcela, mirrors web. */}
          {sortedInstallments.length > 0 && (
            <>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <DetailSection title="Parcelas do Boleto">
                {sortedInstallments.map((inst) => (
                  <View key={inst.id} style={styles.installmentRow}>
                    <View style={styles.installmentInfo}>
                      <ThemedText style={[styles.installmentLabel, { color: colors.foreground }]}>
                        {inst.number}ª parcela de {sortedInstallments.length}
                      </ThemedText>
                      {inst.dueDate && (
                        <ThemedText style={[styles.installmentDue, { color: colors.mutedForeground }]}>
                          Vence em {formatDate(inst.dueDate)}
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.installmentRight}>
                      <ThemedText style={[styles.installmentAmount, { color: colors.foreground }]}>
                        {formatCurrency(inst.amount)}
                      </ThemedText>
                      <Badge variant={getBadgeVariant(inst.status, "ORDER_INSTALLMENT")} size="sm">
                        <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                          {ORDER_INSTALLMENT_STATUS_LABELS[inst.status] ?? inst.status}
                        </ThemedText>
                      </Badge>
                    </View>
                  </View>
                ))}
              </DetailSection>
            </>
          )}
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
  installmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  installmentInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  installmentLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  installmentDue: {
    fontSize: fontSize.xs,
  },
  installmentRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  installmentAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
