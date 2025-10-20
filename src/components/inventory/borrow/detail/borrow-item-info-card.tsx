import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { Borrow } from '../../../../types';
import {
  IconPackage,
  IconBarcode,
  IconTag,
  IconCategory,
  IconTruck,
} from "@tabler/icons-react-native";

interface BorrowItemInfoCardProps {
  borrow: Borrow & {
    item?: {
      name: string;
      uniCode?: string;
      brand?: {
        name: string;
      };
      category?: {
        name: string;
      };
      supplier?: {
        fantasyName?: string;
        corporateName?: string;
        name?: string;
      };
    };
  };
}

export const BorrowItemInfoCard: React.FC<BorrowItemInfoCardProps> = ({ borrow }) => {
  const { colors } = useTheme();

  if (!borrow.item) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconPackage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Informações do Item</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Item não encontrado
          </ThemedText>
        </View>
      </Card>
    );
  }

  const { item } = borrow;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconPackage size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Item</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Item Name */}
        <View style={styles.infoItem}>
          <IconPackage size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Nome</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {item.name}
            </ThemedText>
          </View>
        </View>

        {/* UniCode */}
        {item.uniCode && (
          <View style={styles.infoItem}>
            <IconBarcode size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Código</ThemedText>
              <ThemedText style={[styles.value, styles.monoValue, { color: colors.foreground }]}>
                {item.uniCode}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Brand */}
        <View style={styles.infoItem}>
          <IconTag size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Marca</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {item.brand ? item.brand.name : "-"}
            </ThemedText>
          </View>
        </View>

        {/* Category */}
        <View style={styles.infoItem}>
          <IconCategory size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Categoria</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {item.category ? item.category.name : "-"}
            </ThemedText>
          </View>
        </View>

        {/* Supplier */}
        {item.supplier && (
          <View style={styles.infoItem}>
            <IconTruck size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Fornecedor</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {item.supplier.fantasyName || item.supplier.corporateName || item.supplier.name || "-"}
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  monoValue: {
    fontFamily: "monospace",
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
});
