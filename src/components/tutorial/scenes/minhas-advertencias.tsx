import { IconColumns, IconFilter, IconSearch } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_WARNINGS } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/minhas-advertencias/index.tsx — a read-only
// list rendered via <Layout> with `personalWarningsListConfig`: a search bar +
// column-visibility + filter buttons, then a generic Table card with uppercase
// headers, alternating rows, solid rectangular status badges, and a
// "Mostrando X de Y" footer.
//
// Default visible columns (personalWarningsListConfig.table.defaultVisible):
//   severity · category · reason
//
// Severity badge colors follow ENTITY_BADGE_CONFIG.WARNING → BADGE_COLORS:
//   VERBAL        → "Verbal"            info        (#1d4ed8 blue-700)
//   WRITTEN       → "Escrita"           pending     (#d97706 amber-600)
//   SUSPENSION    → "Suspensão"         warning     (#ea580c orange-600)
//   FINAL_WARNING → "Advertência Final" destructive (#b91c1c red-700)
// Category badge has no badgeEntity → resolves to default gray (#737373).

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  VERBAL: { label: "Verbal", color: "#1d4ed8" },
  WRITTEN: { label: "Escrita", color: "#d97706" },
  SUSPENSION: { label: "Suspensão", color: "#ea580c" },
  FINAL_WARNING: { label: "Advertência Final", color: "#b91c1c" },
};

// WARNING_CATEGORY_LABELS (mirrors @/constants/enum-labels).
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

// The fixture's `category` field actually carries the severity enum; map each
// row to the real (severity, category, reason) display columns.
const ROW_EXTRA: Record<string, { severity: string; reasonCategory: string; reason: string }> = {
  "w-0": {
    severity: "VERBAL",
    reasonCategory: "ATTENDANCE",
    reason: "Atraso reiterado no início do expediente",
  },
  "w-1": {
    severity: "WRITTEN",
    reasonCategory: "SAFETY",
    reason: "Não utilização de EPI obrigatório",
  },
};

const COLUMNS: Array<{ key: string; label: string; width: number; align?: "left" | "center" }> = [
  { key: "severity", label: "SEVERIDADE", width: 120, align: "center" },
  { key: "category", label: "CATEGORIA", width: 130 },
  { key: "reason", label: "MOTIVO", width: 200 },
];

const CATEGORY_BADGE_COLOR = "#737373"; // default gray

export function MinhasAdvertenciasScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <View
      ref={slot.registerRef("pessoalAdvertencias") as any}
      onLayout={slot.register("pessoalAdvertencias")}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Toolbar — search + column visibility + filter */}
      <View style={styles.toolbar}>
        <View
          style={[
            styles.search,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconSearch size={20} color={colors.mutedForeground} />
          <Text
            style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}
          >
            Buscar advertências...
          </Text>
        </View>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconColumns size={20} color={colors.foreground} />
          {/* visible (3) < total columns → primary badge with visible count */}
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.countBadgeText, { color: colors.primaryForeground }]}>3</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconFilter size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.tableWrapper}>
        {/* Table card — generic Table layout (card bg, border, radius 8) */}
        <View
          style={[
            styles.tableCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Header row */}
          <View
            style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}
          >
            {COLUMNS.map((c) => (
              <View
                key={c.key}
                style={[
                  styles.headerCell,
                  {
                    width: c.width,
                    alignItems: c.align === "center" ? "center" : "flex-start",
                  },
                ]}
              >
                <Text
                  style={[styles.headerCellText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {c.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Body rows — alternating background */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {TUTORIAL_WARNINGS.map((w, idx) => {
              const extra =
                ROW_EXTRA[w.id] ?? {
                  severity: w.category,
                  reasonCategory: "OTHER",
                  reason: w.description,
                };
              const sev = SEVERITY_META[extra.severity] ?? SEVERITY_META.VERBAL;

              return (
                <View
                  key={w.id}
                  style={[
                    styles.bodyRow,
                    {
                      // Alternating bg + hairline divider — matches the generic
                      // Table Row (index%2 → background/card, borderBottom
                      // rgba(0,0,0,.05)).
                      backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                    },
                  ]}
                >
                  {/* Severity badge */}
                  <View
                    style={[
                      styles.bodyCell,
                      { width: COLUMNS[0].width, alignItems: "center" },
                    ]}
                  >
                    <View style={[styles.statusBadge, { backgroundColor: sev.color }]}>
                      <Text style={styles.statusText} numberOfLines={1}>
                        {sev.label}
                      </Text>
                    </View>
                  </View>

                  {/* Category badge (default gray) */}
                  <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                    <View
                      style={[styles.statusBadge, { backgroundColor: CATEGORY_BADGE_COLOR }]}
                    >
                      <Text style={styles.statusText} numberOfLines={1}>
                        {CATEGORY_LABELS[extra.reasonCategory] ?? "Outro"}
                      </Text>
                    </View>
                  </View>

                  {/* Reason (plain text, medium weight) */}
                  <View style={[styles.bodyCell, { width: COLUMNS[2].width }]}>
                    <Text
                      style={[styles.cellText, { color: colors.foreground, fontWeight: "500" }]}
                      numberOfLines={2}
                    >
                      {extra.reason}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer with pagination info — mirrors the generic Table
              pagination footer (table-pagination-footer.tsx): "Mostrando X de
              Y" at fontSize.sm (14) in mutedForeground, paddingV 8. */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Mostrando {TUTORIAL_WARNINGS.length} de {TUTORIAL_WARNINGS.length}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  searchPlaceholder: { fontSize: 16 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: { fontSize: 10, fontWeight: "700" },
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  tableCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    borderBottomWidth: 1,
  },
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: 1,
    // Matches the generic Table Row divider (Table/Row.tsx rowWrapper).
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  cellText: { fontSize: 12 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "center",
    maxWidth: "100%",
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  footerText: {
    fontSize: 14,
  },
});
