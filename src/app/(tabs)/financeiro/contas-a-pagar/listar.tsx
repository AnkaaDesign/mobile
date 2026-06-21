import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";

import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { usePayables, usePayableMutations } from "@/hooks";
import { useNav } from "@/contexts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SECTOR_PRIVILEGES } from "@/constants";
import { formatCurrency } from "@/utils";
import { formatDate } from "@/utils/date";
import type { PayableRow, PayableState, ClearanceState } from "@/types/order";

// =====================================================
// Contas a Pagar — two-axis (Pagamento + Conciliação) read/mark-paid screen.
//
// Axis A (paymentState): Previsto → Aguardando → Vencido → Pago — set here.
// Axis B (clearanceState): NÃO CONCILIADO → CONCILIADO — set by the WEB OFX
// import / matcher. Mobile only displays it; reconciliation stays web-only.
// =====================================================

const PAYMENT_LABEL: Record<PayableState, string> = {
  EXPECTED: "Previsto",
  AWAITING_PAYMENT: "Aguardando",
  OVERDUE: "Vencido",
  PARTIALLY_PAID: "Parcial",
  PAID: "Pago",
};

const PAYMENT_VARIANT: Record<PayableState, "secondary" | "pending" | "destructive" | "blue" | "completed"> = {
  EXPECTED: "secondary",
  AWAITING_PAYMENT: "pending",
  OVERDUE: "destructive",
  PARTIALLY_PAID: "blue",
  PAID: "completed",
};

interface ClearanceBadge {
  label: string;
  variant: "pending" | "completed" | "destructive";
  icon: string;
}

/**
 * Combined two-axis clearance badge (design §3). Only meaningful once a row is
 * PAID — an unpaid row has nothing to conciliate, so we return null there.
 */
function getClearanceBadge(row: PayableRow): ClearanceBadge | null {
  const clearance: ClearanceState = row.clearanceState ?? "UNCLEARED";

  if (clearance === "DISPUTED") {
    return { label: "Divergência de valor", variant: "destructive", icon: "alert-triangle" };
  }

  // Conciliação only applies to settled (PAID) rows.
  if (row.paymentState !== "PAID") return null;

  if (clearance === "CLEARED") {
    const when = row.clearedAt ? ` · ${formatDate(row.clearedAt)}` : "";
    return { label: `Pago e conciliado${when}`, variant: "completed", icon: "check" };
  }

  // PAID + UNCLEARED — the 3–5 day OFX window, first-class.
  return { label: "Pago · aguardando conciliação", variant: "pending", icon: "clock" };
}

/** Rows the user can settle directly from the mobile list. */
function canSettleHere(row: PayableRow): boolean {
  if (row.paymentState === "PAID") return false;
  // Boleto installments and scheduled rows settle on the computer (web).
  return row.settleVia === "ORDER_LIFECYCLE" || row.settleVia === "PAYROLL_MONTH";
}

function ContasAPagarContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = usePayables();
  const { markPaidMutation, settlePayrollMutation } = usePayableMutations();
  useScreenReady(!isLoading);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const rows = data?.data?.rows ?? [];
  const summary = data?.data?.summary;

  // Open (non-paid) rows first, then paid; within each, due date ascending.
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aPaid = a.paymentState === "PAID" ? 1 : 0;
      const bPaid = b.paymentState === "PAID" ? 1 : 0;
      if (aPaid !== bPaid) return aPaid - bPaid;
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });
  }, [rows]);

  const handleMarkPaid = (row: PayableRow) => {
    Alert.alert(
      "Marcar como Pago",
      `Confirmar pagamento de ${row.payeeName}\n${formatCurrency(row.amount)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como Pago",
          onPress: async () => {
            try {
              await nav.withLoading(async () => {
                if (row.settleVia === "PAYROLL_MONTH" && row.competence) {
                  const [year, month] = row.competence.split("-").map((n) => parseInt(n, 10));
                  await settlePayrollMutation.mutateAsync({ year, month, amount: null });
                } else {
                  await markPaidMutation.mutateAsync(row.id);
                }
              });
            } catch {
              /* axios interceptor toasts the error */
            }
          },
        },
      ],
    );
  };

  if (isLoading && !refreshing) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={{ backgroundColor: colors.card, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 8 }}
            >
              <Skeleton style={{ height: 16, width: "60%", borderRadius: 4 }} />
              <Skeleton style={{ height: 12, width: "40%", borderRadius: 4 }} />
              <Skeleton style={{ height: 20, width: "30%", borderRadius: 4 }} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 24, alignItems: "center", gap: 12 }}>
          <Icon name="alert-circle" size="xl" color={colors.destructive} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>Erro ao carregar contas a pagar</Text>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {(error as Error).message || "Tente novamente mais tarde"}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16, gap: 16 }}>
        {/* Summary buckets */}
        {summary && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Aguardando", bucket: summary.AWAITING_PAYMENT, color: "#f59e0b" },
              { label: "Vencido", bucket: summary.OVERDUE, color: "#ef4444" },
              { label: "Previsto", bucket: summary.EXPECTED, color: "#737373" },
              { label: "Pago", bucket: summary.PAID, color: "#16a34a" },
            ].map((s) => (
              <View
                key={s.label}
                style={{
                  width: "48%",
                  backgroundColor: colors.card,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{s.label}</Text>
                <Text style={{ color: s.color, fontWeight: "700", fontSize: 16 }}>{formatCurrency(s.bucket?.total ?? 0)}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{s.bucket?.count ?? 0} item(ns)</Text>
              </View>
            ))}
          </View>
        )}

        {sortedRows.length === 0 ? (
          <EmptyState icon="receipt" title="Nenhuma conta a pagar" description="Não há saídas pendentes ou pagas neste período." />
        ) : (
          <View style={{ gap: 10 }}>
            {sortedRows.map((row) => {
              const clearance = getClearanceBadge(row);
              const settleable = canSettleHere(row);
              const needsWeb = row.paymentState !== "PAID" && !settleable;
              const goToOrder = row.source === "ORDER" && row.id;

              return (
                <Pressable
                  key={`${row.source}-${row.id}`}
                  disabled={!goToOrder}
                  onPress={
                    goToOrder
                      ? () => router.push(`/(tabs)/estoque/pedidos/detalhes/${row.id}` as any)
                      : undefined
                  }
                  style={{
                    backgroundColor: colors.card,
                    padding: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }} numberOfLines={1}>
                        {row.payeeName}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }} numberOfLines={2}>
                        {row.description}
                        {row.subtype ? ` · ${row.subtype}` : ""}
                      </Text>
                    </View>
                    <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15 }}>
                      {formatCurrency(row.amount)}
                      {row.isEstimate ? " *" : ""}
                    </Text>
                  </View>

                  {/* Axis A + Axis B badges */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <Badge variant={PAYMENT_VARIANT[row.paymentState]} size="sm">
                      {PAYMENT_LABEL[row.paymentState]}
                    </Badge>
                    {clearance && (
                      <Badge variant={clearance.variant} size="sm">
                        {clearance.label}
                      </Badge>
                    )}
                    {row.dueDate && row.paymentState !== "PAID" && (
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Venc. {formatDate(row.dueDate)}</Text>
                    )}
                  </View>

                  {/* Inline action */}
                  {settleable && (
                    <Pressable
                      onPress={() => handleMarkPaid(row)}
                      style={{
                        marginTop: 4,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        backgroundColor: colors.primary,
                        paddingVertical: 8,
                        borderRadius: 6,
                      }}
                    >
                      <Icon name="receipt" size={16} color={colors.primaryForeground} />
                      <Text style={{ color: colors.primaryForeground, fontWeight: "600", fontSize: 13 }}>Marcar como Pago</Text>
                    </Pressable>
                  )}

                  {needsWeb && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <Icon name="device-desktop" size={14} color={colors.mutedForeground} />
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, flex: 1 }}>
                        Conclua o pagamento no computador (web).
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
          A conciliação bancária (importação de OFX) é feita no computador (web). Aqui você acompanha o status e marca
          pagamentos diretos.
        </Text>
      </View>
    </ScrollView>
  );
}

export default function ContasAPagarScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.ACCOUNTING] }}
    >
      <ContasAPagarContent />
    </PrivilegeGate>
  );
}
