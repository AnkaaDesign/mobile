import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { PPE_TYPE_LABELS } from "@/constants/enum-labels";
import type { Item } from "@/types";

interface PpeItemCardProps {
  item?: Item;
}

export function PpeItemCard({ item }: PpeItemCardProps) {
  const { colors } = useTheme();

  if (!item) {
    return (
      <Card style={styles.emptyCard}>
        <View style={styles.emptyState}>
          <Icon name="package-x" size={32} color={colors.mutedForeground} />
          <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>Item não encontrado</ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            As informações do item EPI não estão disponíveis.
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <DetailCard title="Informações do EPI" icon="shield">
      {/* Item Name */}
      <DetailField label="Nome" icon="file-text" value={item.name} />

      {/* Code/UniCode */}
      {item.uniCode && (
        <DetailField label="Código" icon="barcode" value={item.uniCode} />
      )}

      {/* PPE Type */}
      {item.ppeType && (
        <DetailField label="Tipo de EPI" icon="category" value={PPE_TYPE_LABELS[item.ppeType as keyof typeof PPE_TYPE_LABELS] || item.ppeType} />
      )}

      {/* Size */}
      {item.ppeSize && (
        <DetailField label="Tamanho" icon="ruler" value={item.ppeSize} />
      )}

      {/* Brand */}
      {item.brand && (
        <DetailField label="Marca" icon="tag" value={item.brand.name} />
      )}

      {/* Category */}
      {item.category && (
        <DetailField label="Categoria" icon="folder" value={item.category.name} />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    padding: spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
