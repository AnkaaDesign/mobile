
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconCalendar, IconClock } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { formatDateTime } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface MetadataCardProps {
  position: Position;
}

export function MetadataCard({ position }: MetadataCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconClock size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Sistema</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Created At */}
        <View style={styles.infoItem}>
          <IconCalendar size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Criado em</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(new Date(position.createdAt))}
            </ThemedText>
          </View>
        </View>

        {/* Updated At */}
        <View style={styles.infoItem}>
          <IconClock size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Atualizado em</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(new Date(position.updatedAt))}
            </ThemedText>
          </View>
        </View>
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
});
