import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { Item } from "@/types";

interface PpeItemCardProps {
  item?: Item;
}

export function PpeItemCard({ item }: PpeItemCardProps) {
  const { colors } = useTheme();

  if (!item) {
    return (
      <Card style={styles.card}>
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
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Icon name="shield" size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do EPI</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Item Name */}
        <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
          <View style={styles.fieldLabelWithIcon}>
            <Icon name="file-text" size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nome</ThemedText>
          </View>
          <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{item.name}</ThemedText>
        </View>

        {/* Code/UniCode */}
        {item.uniCode && (
          <View style={[styles.fieldRow, { backgroundColor: colors.background }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="barcode" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Código</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{item.uniCode}</ThemedText>
          </View>
        )}

        {/* PPE Type */}
        {item.ppeType && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="category" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tipo de EPI</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{item.ppeType}</ThemedText>
          </View>
        )}

        {/* Size */}
        {item.ppeSize && (
          <View style={[styles.fieldRow, { backgroundColor: colors.background }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="ruler" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tamanho</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{item.ppeSize}</ThemedText>
          </View>
        )}

        {/* Brand */}
        {item.brand && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="tag" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Marca</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{item.brand.name}</ThemedText>
          </View>
        )}

        {/* Category */}
        {item.category && (
          <View style={[styles.fieldRow, { backgroundColor: colors.background }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="folder" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Categoria</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{item.category.name}</ThemedText>
          </View>
        )}

        {/* Description */}
        {item.description && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50", flexDirection: "column", alignItems: "flex-start" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="align-left" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Descrição</ThemedText>
            </View>
            <ThemedText style={[styles.descriptionValue, { color: colors.foreground }]}>{item.description}</ThemedText>
          </View>
        )}
      </View>
    </Card>
  );
}

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
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.xs,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  descriptionValue: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
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
