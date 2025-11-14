import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDateTime } from "@/utils";
import { BORROW_STATUS } from "@/constants";
import type { Borrow } from '../../../../types';
import {
  IconCalendar,
  IconClock,
  IconCheck,
  IconHash,
} from "@tabler/icons-react-native";

interface BorrowDatesCardProps {
  borrow: Borrow;
}

export const BorrowDatesCard: React.FC<BorrowDatesCardProps> = ({ borrow }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconCalendar size={20} color={colors.mutedForeground} />
        <ThemedText style={styles.title}>Detalhes do Empréstimo</ThemedText>
      </View>

      <View style={styles.content}>
        {/* Quantity */}
        <View style={styles.dateItem}>
          <IconHash size={20} color={colors.mutedForeground} />
          <View style={styles.dateText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Quantidade</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {borrow.quantity} {borrow.quantity === 1 ? "unidade" : "unidades"}
            </ThemedText>
          </View>
        </View>

        {/* Borrow Date (Created At) */}
        <View style={styles.dateItem}>
          <IconCalendar size={20} color={colors.mutedForeground} />
          <View style={styles.dateText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Data do Empréstimo</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(borrow.createdAt)}
            </ThemedText>
          </View>
        </View>

        {/* Return Date */}
        {borrow.returnedAt && borrow.status === BORROW_STATUS.RETURNED && (
          <View style={styles.dateItem}>
            <IconCheck size={20} color="#10b981" />
            <View style={styles.dateText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Data de Devolução</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {formatDateTime(borrow.returnedAt)}
              </ThemedText>
            </View>
          </View>
        )}

        <Separator style={styles.separator} />

        {/* Created At */}
        <View style={styles.dateItem}>
          <IconClock size={20} color={colors.mutedForeground} />
          <View style={styles.dateText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Criado</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(borrow.createdAt)}
            </ThemedText>
          </View>
        </View>

        {/* Updated At */}
        <View style={styles.dateItem}>
          <IconClock size={20} color={colors.mutedForeground} />
          <View style={styles.dateText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Atualizado</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(borrow.updatedAt)}
            </ThemedText>
          </View>
        </View>
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
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  dateItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  dateText: {
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
  separator: {
    marginVertical: 0,
  },
});
