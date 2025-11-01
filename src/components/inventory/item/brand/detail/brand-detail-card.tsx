
import { View, StyleSheet, Pressable } from "react-native";
import type { ItemBrand } from '../../../../../types';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize } from "@/constants/design-system";

interface BrandDetailCardProps {
  brand: ItemBrand;
  onPress?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  variant?: "default" | "compact";
}

export function BrandDetailCard({ brand, onPress, showActions: _showActions = true, variant = "default" }: BrandDetailCardProps) {

  const itemCount = brand.items?.length || 0;

  return (
    <Pressable onPress={onPress}>
      <Card style={variant === "compact" ? { ...styles.card, ...styles.cardCompact } : styles.card}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {brand.name}
            </ThemedText>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>ID:</ThemedText>
              <ThemedText style={styles.value}>#{brand.id.slice(-8)}</ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Produtos associados:</ThemedText>
              <Badge variant={itemCount > 0 ? "default" : "secondary"}>
                <ThemedText style={styles.badgeText}>{itemCount}</ThemedText>
              </Badge>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Criado em:</ThemedText>
              <ThemedText style={styles.value}>{new Date(brand.createdAt).toLocaleDateString("pt-BR")}</ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Atualizado em:</ThemedText>
              <ThemedText style={styles.value}>{new Date(brand.updatedAt).toLocaleDateString("pt-BR")}</ThemedText>
            </View>
          </View>

          <View style={styles.footer}>
            <Badge variant="secondary">
              <ThemedText style={styles.statusText}>Ativo</ThemedText>
            </Badge>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  cardCompact: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs / 2,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    flex: 1,
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  footer: {
    marginTop: spacing.sm,
    flexDirection: "row",
  },
  statusText: {
    fontSize: fontSize.xs,
  },
});
