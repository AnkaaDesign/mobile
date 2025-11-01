
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailRow } from "@/components/ui/detail-row";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconShield, IconCalendar, IconClock, IconCertificate } from "@tabler/icons-react-native";
import { PPE_TYPE_LABELS, PPE_DELIVERY_MODE_LABELS } from '../../../../constants';
import type { Item } from '../../../../types';

interface PpeCardProps {
  item: Item;
}

export function PpeCard({ item }: PpeCardProps) {
  const { colors } = useTheme();

  if (!item.ppeType) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconShield size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>Informações do EPI</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.field}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>Tipo de EPI</ThemedText>
            <Badge variant="default" style={styles.badge}>
              <ThemedText style={{ color: colors.primaryForeground }}>{PPE_TYPE_LABELS[item.ppeType as keyof typeof PPE_TYPE_LABELS]}</ThemedText>
            </Badge>
          </View>

          {item.ppeDeliveryMode && (
            <View style={styles.field}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>Modo de Entrega</ThemedText>
              <Badge variant="secondary" style={styles.badge}>
                <ThemedText style={{ color: colors.secondaryForeground }}>{PPE_DELIVERY_MODE_LABELS[item.ppeDeliveryMode as keyof typeof PPE_DELIVERY_MODE_LABELS]}</ThemedText>
              </Badge>
            </View>
          )}
        </View>

        {item.ppeCA && (
          <DetailRow icon={IconCertificate as any} label="CA (Certificado de Aprovação)" value={item.ppeCA} />
        )}

        {item.ppeStandardQuantity && (
          <DetailRow
            icon={IconClock as any}
            label="Quantidade Padrão"
            value={`${item.ppeStandardQuantity} unidade${item.ppeStandardQuantity > 1 ? "s" : ""}`}
          />
        )}

        {item.ppeAutoOrderMonths && (
          <DetailRow
            icon={IconCalendar as any}
            label="Período de Pedido Automático"
            value={`${item.ppeAutoOrderMonths} ${item.ppeAutoOrderMonths === 1 ? "mês" : "meses"}`}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  field: {
    flex: 1,
    minWidth: "45%",
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  badge: {
    alignSelf: "flex-start",
  },
});
