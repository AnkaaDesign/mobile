import {
  IconAlertTriangle,
  IconCalendar,
  IconCircleCheck,
  IconExclamationCircle,
  IconFilter,
  IconSearch,
  IconUser,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_WARNINGS } from "../fixtures";
import type { SceneProps } from "./index";

// Severity → label + solid badge color (mirrors real list-config which uses
// the WARNING_SEVERITY badge mapping: info/pending/warning/destructive).
// VERBAL = info (blue), WRITTEN = pending (amber),
// SUSPENSION = warning (orange), FINAL_WARNING = destructive (red).
const SEVERITY_META: Record<string, { label: string; color: string }> = {
  VERBAL: { label: "Verbal", color: "#5985b3" },
  WRITTEN: { label: "Escrita", color: "#d97706" },
  SUSPENSION: { label: "Suspensão", color: "#ea580c" },
  FINAL_WARNING: { label: "Advertência Final", color: "#bf4040" },
};

// Fallback category label so the fixture stays in sync with the real screen.
const CATEGORY_LABELS: Record<string, string> = {
  SAFETY: "Segurança",
  MISCONDUCT: "Má Conduta",
  INSUBORDINATION: "Insubordinação",
  POLICY_VIOLATION: "Violação de Política",
  ATTENDANCE: "Assiduidade",
  PERFORMANCE: "Desempenho",
  BEHAVIOR: "Comportamento",
  OTHER: "Outro",
};

// Extra fixture display fields (supervisor, follow-up, active) inferred from
// the real screen's list config columns. Indexed by fixture id.
const ROW_EXTRA: Record<
  string,
  {
    severity: string;
    reasonCategory: string;
    reason: string;
    supervisor: string;
    followUpDate: string;
    isActive: boolean;
    acknowledged: boolean;
  }
> = {
  "w-0": {
    severity: "VERBAL",
    reasonCategory: "ATTENDANCE",
    reason: "Atraso reiterado no início do expediente",
    supervisor: "Carlos Andrade",
    followUpDate: "12/06/2026",
    isActive: true,
    acknowledged: false,
  },
  "w-1": {
    severity: "WRITTEN",
    reasonCategory: "SAFETY",
    reason: "Não utilização de EPI obrigatório",
    supervisor: "Marina Souza",
    followUpDate: "05/06/2026",
    isActive: true,
    acknowledged: true,
  },
};

export function MinhasAdvertenciasScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <View
      ref={slot.registerRef("pessoalAdvertencias") as any}
      onLayout={slot.register("pessoalAdvertencias")}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Toolbar — search + filter, mirroring the Layout list pattern */}
      <View style={styles.toolbar}>
        <View
          style={[
            styles.search,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconSearch size={18} color={colors.mutedForeground} />
          <Text
            style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}
          >
            Buscar advertências...
          </Text>
        </View>
        <Pressable
          style={[
            styles.iconBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconFilter size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Section header — count summary */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 4,
              height: 20,
              borderRadius: 2,
              backgroundColor: colors.primary,
            }}
          />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Histórico de Advertências
          </Text>
        </View>
        <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
          {TUTORIAL_WARNINGS.length}{" "}
          {TUTORIAL_WARNINGS.length === 1 ? "registro" : "registros"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {TUTORIAL_WARNINGS.map((w) => {
          const extra = ROW_EXTRA[w.id] ?? {
            severity: w.category,
            reasonCategory: "OTHER",
            reason: w.description,
            supervisor: "—",
            followUpDate: "—",
            isActive: true,
            acknowledged: false,
          };
          const sev = SEVERITY_META[extra.severity] ?? SEVERITY_META.VERBAL;
          const StatusIcon = extra.acknowledged
            ? IconCircleCheck
            : IconExclamationCircle;
          const statusColor = extra.acknowledged ? "#16a34a" : "#f59e0b";
          const statusLabel = extra.acknowledged ? "Ciente" : "Pendente";

          return (
            <View
              key={w.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderLeftColor: sev.color,
                },
              ]}
            >
              {/* Header row: severity badge + date + status pill */}
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.severityIconWrap}>
                    <IconAlertTriangle size={18} color={sev.color} />
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: sev.color }]}>
                    <Text style={styles.severityBadgeText} numberOfLines={1}>
                      {sev.label.toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.categoryBadge,
                      { borderColor: colors.border, backgroundColor: colors.muted },
                    ]}
                  >
                    <Text
                      style={[styles.categoryBadgeText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {CATEGORY_LABELS[extra.reasonCategory] ?? "Outro"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor + "1A" }]}>
                  <StatusIcon size={12} color={statusColor} />
                  <Text style={[styles.statusPillText, { color: statusColor }]}>
                    {statusLabel}
                  </Text>
                </View>
              </View>

              {/* Reason — primary line */}
              <Text
                style={[styles.reason, { color: colors.text }]}
                numberOfLines={2}
              >
                {extra.reason}
              </Text>

              {/* Description — secondary line */}
              <Text
                style={[styles.description, { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {w.description}
              </Text>

              {/* Metadata footer: supervisor + date + follow-up */}
              <View
                style={[styles.metaRow, { borderTopColor: colors.border }]}
              >
                <View style={styles.metaItem}>
                  <IconUser size={13} color={colors.mutedForeground} />
                  <Text
                    style={[styles.metaText, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {extra.supervisor}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <IconCalendar size={13} color={colors.mutedForeground} />
                  <Text
                    style={[styles.metaText, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {w.date}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text
                    style={[styles.followUpLabel, { color: colors.mutedForeground }]}
                  >
                    Acomp.
                  </Text>
                  <Text
                    style={[styles.metaText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {extra.followUpDate}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchPlaceholder: { fontSize: 14 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  sectionCount: { fontSize: 12 },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  severityIconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  reason: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "500",
  },
  followUpLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
