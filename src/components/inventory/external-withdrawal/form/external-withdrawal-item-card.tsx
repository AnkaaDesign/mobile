import React, { useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { IconX, IconAlertTriangle } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { EXTERNAL_WITHDRAWAL_TYPE } from "@/constants";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import { CurrencyInput } from "@/components/ui/currency-input";

interface ExternalWithdrawalItemCardProps {
  itemId: string;
  itemName: string;
  itemCode?: string | null;
  itemBrand?: string | null;
  itemCategory?: string | null;
  currentStock: number;
  itemPrice?: number | null;
  quantity: number;
  unitPrice?: number | null;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  onQuantityChange: (quantity: number) => void;
  onPriceChange?: (price: number) => void;
  onRemove: () => void;
}

export function ExternalWithdrawalItemCard({
  itemId,
  itemName,
  itemCode,
  itemBrand,
  itemCategory,
  currentStock,
  itemPrice,
  quantity,
  unitPrice,
  type,
  onQuantityChange,
  onPriceChange,
  onRemove,
}: ExternalWithdrawalItemCardProps) {
  const { colors } = useTheme();

  // Calculate final stock after withdrawal
  const finalStock = currentStock - quantity;
  const isNegativeStock = finalStock < 0;

  // Get display price
  const displayPrice = unitPrice ?? itemPrice ?? 0;
  const hasCustomPrice = unitPrice !== null && unitPrice !== itemPrice;

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      {/* Item Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {itemCode ? `${itemCode} - ` : ""}{itemName}
          </Text>

          {/* Brand and Category */}
          {(itemBrand || itemCategory) && (
            <View style={styles.metadata}>
              {itemBrand && (
                <Text style={styles.metaText}>
                  Marca: {itemBrand}
                </Text>
              )}
              {itemCategory && (
                <Text style={styles.metaText}>
                  Categoria: {itemCategory}
                </Text>
              )}
            </View>
          )}

          {/* Stock Information */}
          <View style={styles.stockInfo}>
            <Text style={styles.stockText}>
              Estoque atual: {currentStock}
            </Text>
            <Text
              style={[
                styles.stockText,
                isNegativeStock && styles.negativeStock,
              ]}
            >
              Após retirada: {finalStock}
            </Text>
          </View>

          {/* Price Info (for CHARGEABLE only) */}
          {type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && (
            <View style={styles.priceInfo}>
              <Text style={styles.priceText}>
                Preço item: R$ {(itemPrice ?? 0).toFixed(2)}
              </Text>
              {hasCustomPrice && (
                <Badge variant="outline" style={styles.customPriceBadge}>
                  Preço personalizado
                </Badge>
              )}
            </View>
          )}
        </View>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          onPress={onRemove}
          style={styles.removeButton}
        >
          <IconX size={18} color={colors.destructive} />
        </Button>
      </View>

      {/* Inputs */}
      <View style={styles.inputs}>
        {/* Quantity Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Quantidade</Text>
          <NumberInput
            value={quantity}
            onChangeValue={onQuantityChange}
            min={0.01}
            decimals={2}
            style={styles.input}
          />
        </View>

        {/* Price Input (only for CHARGEABLE) */}
        {type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && onPriceChange && (
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Preço unitário</Text>
            <CurrencyInput
              value={displayPrice}
              onChangeValue={onPriceChange}
              style={styles.input}
            />
          </View>
        )}
      </View>

      {/* Stock Warning */}
      {isNegativeStock && (
        <View style={[styles.warning, { backgroundColor: `${colors.destructive}10` }]}>
          <IconAlertTriangle size={16} color={colors.destructive} />
          <Text style={[styles.warningText, { color: colors.destructive }]}>
            Quantidade excede o estoque disponível
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  metadata: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 13,
    opacity: 0.7,
  },
  stockInfo: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stockText: {
    fontSize: 13,
    fontWeight: "500",
  },
  negativeStock: {
    color: "#ef4444",
  },
  priceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priceText: {
    fontSize: 13,
    opacity: 0.7,
  },
  customPriceBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
  },
  inputs: {
    flexDirection: "row",
    gap: spacing.md,
  },
  inputWrapper: {
    flex: 1,
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  input: {
    height: 40,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
});
