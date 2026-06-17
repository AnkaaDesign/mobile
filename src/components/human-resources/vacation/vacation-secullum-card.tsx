import React from "react";
import { View, StyleSheet } from "react-native";
import { IconClockHour4 } from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing } from "@/constants/design-system";
import { useVacationSecullumStatus, useVacationSyncSecullum } from "@/hooks/useVacation";
import type { VacationSecullumState } from "@/api-client";

const STATE_LABEL: Record<VacationSecullumState, { label: string; variant: string }> = {
  SYNCED: { label: "Sincronizado", variant: "delivered" },
  NOT_PUSHED: { label: "Não enviado", variant: "onHold" },
  OUT_OF_SYNC: { label: "Divergente", variant: "expired" },
  NOT_LINKED: { label: "Sem vínculo", variant: "outline" },
  UNKNOWN: { label: "Indisponível", variant: "secondary" },
};

const fmtRange = (r: { inicio: string; fim: string }) => `${r.inicio} → ${r.fim}`;

/**
 * Ponto (Secullum) sync status for a single vacation — mirrors the web card.
 * Read-derived comparison of gozo períodos vs. the afastamentos tagged for this
 * vacation in Secullum, with verify + manual re-push actions.
 */
export function VacationSecullumCard({ vacationId }: { vacationId: string }) {
  const { data, isLoading, isFetching, refetch } = useVacationSecullumStatus(vacationId);
  const sync = useVacationSyncSecullum();

  const status = data?.data;
  const meta = STATE_LABEL[status?.state ?? "UNKNOWN"];

  const handleSync = async () => {
    try {
      await sync.mutateAsync(vacationId);
      refetch();
    } catch {
      // api-client surfaces the error.
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <IconClockHour4 size={20} />
          <ThemedText style={styles.title}>Ponto (Secullum)</ThemedText>
        </View>
        <Badge variant={meta.variant as any}>{meta.label}</Badge>
      </View>

      {isLoading ? (
        <ThemedText style={styles.muted}>Consultando o ponto...</ThemedText>
      ) : (
        <>
          <ThemedText style={styles.muted}>{status?.message}</ThemedText>

          {status?.linked && status.pushedAbsences.length > 0 && (
            <View style={styles.group}>
              <ThemedText style={styles.groupLabel}>No ponto ({status.pushedAbsences.length})</ThemedText>
              {status.pushedAbsences.map((p) => (
                <ThemedText key={p.id} style={styles.range}>
                  {fmtRange(p)}
                </ThemedText>
              ))}
            </View>
          )}

          {status?.linked && status.missing.length > 0 && (
            <View style={styles.group}>
              <ThemedText style={[styles.groupLabel, styles.danger]}>Faltando ({status.missing.length})</ThemedText>
              {status.missing.map((p, i) => (
                <ThemedText key={i} style={[styles.range, styles.danger]}>
                  {fmtRange(p)}
                </ThemedText>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button variant="outline" size="sm" onPress={() => refetch()} disabled={isFetching || sync.isPending}>
              Verificar
            </Button>
            <Button size="sm" onPress={handleSync} loading={sync.isPending} disabled={isFetching || !status?.linked}>
              Sincronizar
            </Button>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 16, fontWeight: "600" },
  muted: { fontSize: 14, opacity: 0.7 },
  group: { gap: 2 },
  groupLabel: { fontSize: 12, fontWeight: "600", opacity: 0.8 },
  range: { fontSize: 13, opacity: 0.7 },
  danger: { color: "#dc2626", opacity: 1 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
});
