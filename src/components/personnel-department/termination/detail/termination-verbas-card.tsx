import { useMemo, useState } from "react";
import { View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import type { Termination, TerminationItem } from "@/types";
import type { TaxAssistResult } from "@/types/termination";
import { TERMINATION_ITEM_TYPE_LABELS } from "@/constants/enum-labels";
import { formatCurrency } from "@/utils/number";
import {
  useTerminationCalculate,
  useTerminationComputeTaxes,
  useTerminationItemDelete,
} from "@/hooks/useTermination";

interface Props {
  termination: Termination;
  /** Whether the user may run the verbas/tax engines and edit items. */
  canManage?: boolean;
}

function itemLabel(item: TerminationItem): string {
  return TERMINATION_ITEM_TYPE_LABELS[item.type] ?? item.type;
}

/**
 * True when the description merely echoes the type label (case/accent/whitespace
 * -insensitive) — e.g. "Saldo de salário" under "Saldo de Salário". Such echoes
 * carry no extra info and are hidden (mirror of the web items-card behavior).
 */
function descriptionEchoesLabel(description: string, label: string): boolean {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  return normalize(description) === normalize(label);
}

export function TerminationVerbasCard({ termination: t, canManage }: Props) {
  const { colors } = useTheme();
  const calculate = useTerminationCalculate();
  const computeTaxes = useTerminationComputeTaxes();
  const deleteItem = useTerminationItemDelete();
  const [taxAssist, setTaxAssist] = useState<TaxAssistResult | null>(null);

  const items = (t.items ?? []) as TerminationItem[];
  const earnings = useMemo(() => items.filter((i) => i.amount >= 0), [items]);
  const discounts = useMemo(() => items.filter((i) => i.amount < 0), [items]);

  const totalEarnings = earnings.reduce((s, i) => s + i.amount, 0);
  const totalDiscounts = discounts.reduce((s, i) => s + Math.abs(i.amount), 0);
  const net = totalEarnings - totalDiscounts;

  const handleCalculate = () => {
    Alert.alert(
      "Calcular Verbas",
      "Recalcular as verbas rescisórias? Itens calculados (não manuais) serão substituídos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Calcular",
          onPress: async () => {
            try {
              await calculate.mutateAsync(t.id);
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  const handleComputeTaxes = async () => {
    try {
      const res = await computeTaxes.mutateAsync(t.id);
      setTaxAssist((res as any)?.data ?? null);
    } catch {
      /* interceptor toasts */
    }
  };

  const handleDeleteItem = (item: TerminationItem) => {
    Alert.alert("Remover Verba", `Remover "${itemLabel(item)}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem.mutateAsync(item.id);
          } catch {
            /* interceptor toasts */
          }
        },
      },
    ]);
  };

  const renderItem = (item: TerminationItem, isDiscount: boolean) => {
    const label = itemLabel(item);
    const showDescription = !!item.description && !descriptionEchoesLabel(item.description, label);
    return (
    <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
      <View style={styles.itemInfo}>
        <View style={styles.itemTitleRow}>
          <ThemedText style={{ color: colors.foreground, flexShrink: 1 }}>
            {label}
          </ThemedText>
          {item.isCustom ? (
            <Badge variant="outline">
              <ThemedText style={{ fontSize: 10 }}>Manual</ThemedText>
            </Badge>
          ) : null}
        </View>
        {showDescription ? (
          <ThemedText style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {item.description}
          </ThemedText>
        ) : null}
        {item.referenceQuantity != null || item.baseValue != null ? (
          <ThemedText style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {item.referenceQuantity != null ? `${item.referenceQuantity} × ` : ""}
            {item.baseValue != null ? formatCurrency(item.baseValue) : ""}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText
        style={{ color: isDiscount ? colors.destructive : "#16a34a", fontWeight: "600" }}
      >
        {isDiscount ? "- " : ""}
        {formatCurrency(Math.abs(item.amount))}
      </ThemedText>
      {canManage && item.isCustom ? (
        <TouchableOpacity
          onPress={() => handleDeleteItem(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Remover verba"
        >
          <Icon name="trash" size={16} color={colors.destructive} />
        </TouchableOpacity>
      ) : null}
    </View>
    );
  };

  return (
    <DetailCard title="Verbas Rescisórias" icon="calculator">
      <View style={styles.content}>
        {items.length === 0 ? (
          <ThemedText style={{ color: colors.mutedForeground }}>
            Nenhuma verba lançada. Use "Calcular Verbas" para gerar o acerto rescisório.
          </ThemedText>
        ) : (
          <>
            {earnings.length > 0 ? (
              <View>
                <ThemedText style={styles.sectionTitle}>Proventos</ThemedText>
                {earnings.map((i) => renderItem(i, false))}
              </View>
            ) : null}

            {discounts.length > 0 ? (
              <View>
                <ThemedText style={styles.sectionTitle}>Descontos</ThemedText>
                {discounts.map((i) => renderItem(i, true))}
              </View>
            ) : null}

            <View style={[styles.totals, { borderTopColor: colors.border }]}>
              <View style={styles.totalRow}>
                <ThemedText style={{ color: colors.mutedForeground }}>Proventos</ThemedText>
                <ThemedText style={{ color: "#16a34a", fontWeight: "600" }}>
                  {formatCurrency(totalEarnings)}
                </ThemedText>
              </View>
              <View style={styles.totalRow}>
                <ThemedText style={{ color: colors.mutedForeground }}>Descontos</ThemedText>
                <ThemedText style={{ color: colors.destructive, fontWeight: "600" }}>
                  - {formatCurrency(totalDiscounts)}
                </ThemedText>
              </View>
              <View style={styles.totalRow}>
                <ThemedText style={{ color: colors.foreground, fontWeight: "700" }}>Líquido</ThemedText>
                <ThemedText style={{ color: colors.primary, fontWeight: "700", fontSize: 16 }}>
                  {formatCurrency(net)}
                </ThemedText>
              </View>
            </View>
          </>
        )}

        {/* Tax assist result (INSS/IRRF on taxable verbas + FGTS-multa base) */}
        {taxAssist ? (
          <View style={[styles.taxBox, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
            <ThemedText style={styles.sectionTitle}>Assistente de Impostos</ThemedText>
            <ThemedText style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 4 }}>
              INSS/IRRF incidem apenas sobre verbas tributáveis (saldo, 13º, aviso trabalhado).
            </ThemedText>
            <TaxLine label="Base INSS (mês)" value={taxAssist.monthlyInssBase} />
            <TaxLine label="INSS (mês)" value={taxAssist.monthlyInss} />
            <TaxLine label="IRRF (mês)" value={taxAssist.monthlyIrrf} />
            <TaxLine label="Base INSS (13º)" value={taxAssist.thirteenthInssBase} />
            <TaxLine label="INSS (13º)" value={taxAssist.thirteenthInss} />
            <TaxLine label="IRRF (13º)" value={taxAssist.thirteenthIrrf} />
            <TaxLine label="Total INSS" value={taxAssist.totalInss} bold />
            <TaxLine label="Total IRRF" value={taxAssist.totalIrrf} bold />
            <TaxLine label="Base da Multa do FGTS" value={taxAssist.fgtsFineBase} bold />
            <ThemedText style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>
              Valores sugeridos. Lance/ajuste como verbas manuais (INSS/IRRF) conforme necessário.
            </ThemedText>
          </View>
        ) : null}

        {canManage ? (
          <View style={styles.actions}>
            <Button
              variant="default"
              loading={calculate.isPending}
              onPress={handleCalculate}
              icon={<Icon name="refresh" size={16} color={colors.background} />}
            >
              Calcular Verbas
            </Button>
            <Button
              variant="outline"
              loading={computeTaxes.isPending}
              onPress={handleComputeTaxes}
              icon={<Icon name="receipt" size={16} color={colors.foreground} />}
            >
              Calcular Impostos (INSS/IRRF/FGTS)
            </Button>
          </View>
        ) : null}
      </View>
    </DetailCard>
  );
}

function TaxLine({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.taxLine}>
      <ThemedText style={{ color: colors.mutedForeground, fontWeight: bold ? "700" : "400" }}>
        {label}
      </ThemedText>
      <ThemedText style={{ color: colors.foreground, fontWeight: bold ? "700" : "500" }}>
        {formatCurrency(value ?? 0)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  sectionTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6, opacity: 0.8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  totals: { borderTopWidth: 1, paddingTop: 10, gap: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  taxBox: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 2 },
  taxLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  actions: { gap: 10 },
});
