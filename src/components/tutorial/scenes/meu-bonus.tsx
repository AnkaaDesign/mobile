import { IconCalculator, IconHistory } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_BONUS_CURRENT, TUTORIAL_USER } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meu-bonus/atual.tsx — vertical stack of cards:
// 1) Período (centered month/year + range)
// 2) Regras do Bônus (primary CTA button)
// 3) Valor do Bônus (base + line items + net)
// 4) Detalhes de Performance (~7 metric rows)
// 5) Status das Comissões (4 status badges with counts)
// 6) Simulação + Histórico nav buttons row
export function MeuBonusScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const b = TUTORIAL_BONUS_CURRENT;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Period Info Card */}
      <View
        ref={slot.registerRef("pessoalBonusPeriodCard") as any}
        onLayout={slot.register("pessoalBonusPeriodCard")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.periodInfo}>
          <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>
            Período
          </Text>
          <Text style={[styles.periodMonth, { color: colors.foreground }]}>
            {b.period}
          </Text>
          <Text style={[styles.periodDates, { color: colors.mutedForeground }]}>
            26/04/26 - 25/05/26
          </Text>
        </View>
      </View>

      {/* Rules Button */}
      <Pressable
        ref={slot.registerRef("pessoalBonusRules") as any}
        onLayout={slot.register("pessoalBonusRules")}
        style={[styles.rulesButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.rulesButtonText}>Regras do Bônus</Text>
      </Pressable>

      {/* Bonus Amount Card */}
      <View
        ref={slot.registerRef("pessoalBonusAmount") as any}
        onLayout={slot.register("pessoalBonusAmount")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Valor do Bônus
        </Text>
        <View style={styles.detailsContainer}>
          <DetailRow
            label="Valor Base:"
            value={`R$ ${b.base.toFixed(2).replace(".", ",")}`}
            colors={colors}
          />
          <DetailRow
            label="Performance"
            value={`+${b.performance}%`}
            colors={colors}
            valueColor={colors.success}
          />
          <DetailRow
            label="Faltas / atrasos"
            value={`-${b.discountPercent}%`}
            colors={colors}
            valueColor={colors.destructive}
          />
          <View
            style={[
              styles.detailRow,
              styles.netRow,
              { borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.detailLabel, { color: colors.foreground, fontWeight: "600" }]}>
              Valor Líquido:
            </Text>
            <Text style={[styles.detailValue, { color: colors.success, fontWeight: "600" }]}>
              R$ {b.net.toFixed(2).replace(".", ",")}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Details Card */}
      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Detalhes de Performance
        </Text>
        <View style={styles.detailsContainer}>
          <DetailRow label="Cargo:" value={TUTORIAL_USER.role} colors={colors} />
          <DetailRow label="Setor:" value={TUTORIAL_USER.sectorName} colors={colors} />
          <DetailRow
            label="Nível de Performance:"
            value={`Nível ${Math.round(b.performance / 20)}`}
            colors={colors}
          />
          <DetailRow label="Total de Tarefas:" value="24" colors={colors} />
          <DetailRow label="Tarefas Ponderadas:" value="21.50" colors={colors} />
          <DetailRow label="Colaboradores Elegíveis:" value="12" colors={colors} />
          <DetailRow label="Média por Colaborador:" value="1.79" colors={colors} />
        </View>
      </View>

      {/* Commission Status Card */}
      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Status das Comissões
        </Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          Toque para ver as tarefas
        </Text>
        <View style={styles.commissionList}>
          <CommissionRow
            label="Comissão Integral"
            count={18}
            color={colors.success}
            colors={colors}
          />
          <CommissionRow
            label="Comissão Parcial"
            count={4}
            color={colors.warning}
            colors={colors}
          />
          <CommissionRow
            label="Sem Comissão"
            count={2}
            color={colors.destructive}
            colors={colors}
          />
          <CommissionRow
            label="Comissão Suspensa"
            count={0}
            color={colors.mutedForeground}
            colors={colors}
          />
        </View>
      </View>

      {/* Navigation buttons (Simulação + Histórico) */}
      <View
        ref={slot.registerRef("pessoalBonusNavHistorico") as any}
        onLayout={slot.register("pessoalBonusNavHistorico")}
        style={styles.navigationButtons}
      >
        <View
          style={[
            styles.navButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconCalculator size={24} color={colors.primary} />
          <Text style={[styles.navButtonText, { color: colors.foreground }]}>
            Simulação
          </Text>
        </View>
        <View
          style={[
            styles.navButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconHistory size={24} color={colors.primary} />
          <Text style={[styles.navButtonText, { color: colors.foreground }]}>
            Histórico
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor ?? colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function CommissionRow({
  label,
  count,
  color,
  colors,
}: {
  label: string;
  count: number;
  color: string;
  colors: any;
}) {
  return (
    <View style={styles.commissionRow}>
      <View style={[styles.commissionBadge, { backgroundColor: color + "22", borderColor: color }]}>
        <Text style={[styles.commissionBadgeText, { color }]}>{label}</Text>
      </View>
      <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
        <Text style={[styles.countBadgeText, { color: colors.foreground }]}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodInfo: {
    alignItems: "center",
    gap: 4,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  periodMonth: {
    fontSize: 24,
    fontWeight: "700",
  },
  periodDates: {
    fontSize: 14,
    fontWeight: "500",
  },
  rulesButton: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 8,
  },
  rulesButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  commissionList: {
    gap: 12,
  },
  commissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commissionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  commissionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  countBadge: {
    minWidth: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  navigationButtons: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
