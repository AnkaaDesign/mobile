import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconShield size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações do EPI</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent style={styles.content}>
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
          <DetailRow icon={IconCertificate} label="CA (Certificado de Aprovação)" value={item.ppeCA} />
        )}

        {item.ppeStandardQuantity && (
          <DetailRow
            icon={IconClock}
            label="Quantidade Padrão"
            value={`${item.ppeStandardQuantity} unidade${item.ppeStandardQuantity > 1 ? "s" : ""}`}
          />
        )}

        {item.ppeAutoOrderMonths && (
          <DetailRow
            icon={IconCalendar}
            label="Período de Pedido Automático"
            value={`${item.ppeAutoOrderMonths} ${item.ppeAutoOrderMonths === 1 ? "mês" : "meses"}`}
          />
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
