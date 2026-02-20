
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField } from "@/components/ui/detail-page-layout";
import { IconShield } from "@tabler/icons-react-native";
import type { Item } from "../../../../types";
import { PPE_TYPE_LABELS, PPE_SIZE_LABELS, PPE_DELIVERY_MODE_LABELS, PPE_SIZE } from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface PpeInfoCardProps {
  item: Item;
}

export function PpeInfoCard({ item }: PpeInfoCardProps) {
  const { colors } = useTheme();

  // Check if item has PPE configuration
  if (!item.ppeType) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconShield size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações de EPI</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* PPE Type and Size */}
        <View>
          <ThemedText style={StyleSheet.flatten([styles.subSectionHeader, { color: colors.foreground }])}>Tipo de EPI</ThemedText>
          <View style={styles.sectionContent}>
            <DetailField
              label="Tipo"
              value={PPE_TYPE_LABELS[item.ppeType]}
              icon="shirt"
            />
            {item.ppeSize && (
              <DetailField
                label="Tamanho"
                value={PPE_SIZE_LABELS[item.ppeSize as PPE_SIZE]}
                icon="ruler"
              />
            )}
            {item.ppeCA && (
              <DetailField
                label="Certificado de Aprovação (CA)"
                value={item.ppeCA}
                icon="certificate"
              />
            )}
          </View>
        </View>

        {/* Delivery Configuration */}
        <View style={StyleSheet.flatten([styles.divider, { borderTopColor: colors.border + "50" }])} />
        <View>
          <ThemedText style={StyleSheet.flatten([styles.subSectionHeader, { color: colors.foreground }])}>Configuração de Entrega</ThemedText>
          <View style={styles.sectionContent}>
            <DetailField
              label="Modo de Entrega"
              value={item.ppeDeliveryMode ? PPE_DELIVERY_MODE_LABELS[item.ppeDeliveryMode] : "-"}
              icon="package"
            />
            <DetailField
              label="Atribuído ao Usuário"
              value={item.shouldAssignToUser ? "Sim" : "Não"}
              icon="user"
            />
            <DetailField
              label="Qtd. Padrão"
              value={String(item.ppeStandardQuantity ?? "-")}
              icon="package"
            />
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
  subSectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  sectionContent: {
    gap: spacing.md,
  },
  divider: {
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: 1,
  },
});
