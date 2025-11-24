
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconBriefcase, IconCheck, IconX, IconHierarchy, IconUsers, IconHistory } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  const { colors } = useTheme();

  // Get count of remunerations (MonetaryValue entities via remunerations relation)
  const remunerationCount = position._count?.remunerations || 0;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconBriefcase size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações Gerais</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Position Name */}
        <View style={styles.infoItem}>
          <IconBriefcase size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Nome do Cargo</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>{position.name}</ThemedText>
          </View>
        </View>

        {/* Hierarchy */}
        {position.hierarchy !== null && position.hierarchy !== undefined && (
          <View style={styles.infoItem}>
            <IconHierarchy size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Hierarquia</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{position.hierarchy}</ThemedText>
            </View>
          </View>
        )}

        {/* Bonifiable Status */}
        <View style={styles.infoItem}>
          <IconCheck size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Elegível para Bonificação</ThemedText>
            <Badge variant={position.bonifiable ? "success" : "secondary"}>
              <View style={styles.badgeContent}>
                {position.bonifiable ? <IconCheck size={14} color={colors.primaryForeground} /> : <IconX size={14} color={colors.primaryForeground} />}
                <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>
                  {position.bonifiable ? "Sim" : "Não"}
                </ThemedText>
              </View>
            </Badge>
          </View>
        </View>

        {/* Employee Count */}
        <View style={styles.infoItem}>
          <IconUsers size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Total de Colaboradores</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {position._count?.users || 0} {position._count?.users === 1 ? "colaborador" : "colaboradores"}
            </ThemedText>
          </View>
        </View>

        {/* Remunerations Count */}
        <View style={styles.infoItem}>
          <IconHistory size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Histórico de Remunerações</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {remunerationCount} {remunerationCount === 1 ? "registro" : "registros"}
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
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
});
