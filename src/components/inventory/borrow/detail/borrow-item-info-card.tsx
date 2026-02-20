import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { Borrow } from '../../../../types';
import { IconPackage } from "@tabler/icons-react-native";

interface BorrowItemInfoCardProps {
  borrow: Borrow & {
    item?: {
      name: string;
      uniCode: string | null;
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconPackage size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Item</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Item Name */}
        <DetailField label="Nome" value={item.name} icon="package" />

        {/* UniCode */}
        {item.uniCode && (
          <DetailField label="Código" value={item.uniCode} icon="barcode" monospace />
        )}

        {/* Brand */}
        <DetailField label="Marca" value={item.brand ? item.brand.name : "-"} icon="tag" />

        {/* Category */}
        <DetailField label="Categoria" value={item.category ? item.category.name : "-"} icon="tags" />

        {/* Supplier */}
        {item.supplier && (
          <DetailField
            label="Fornecedor"
            value={item.supplier.fantasyName || item.supplier.corporateName || "-"}
            icon="truck"
          />
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
    borderBottomWidth: 1,
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
  emptyText: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
});
