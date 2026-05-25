import {
  IconChevronUp,
  IconColumns,
  IconFilter,
  IconPhoto,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_CUTS_LIST } from "../fixtures";
import type { SceneProps } from "./index";

// The real "STATUS" cell renders through the shared list Table → CellContent
// (format: 'badge', badgeEntity: 'CUT'). Colors come from ENTITY_BADGE_CONFIG.CUT →
// BADGE_COLORS: PENDING → "gray" (#737373), CUTTING → "blue" (#2563eb),
// COMPLETED → "green" (#15803d). Solid rounded pill, white text 12 / weight 500.
const STATUS_BADGE_COLOR: Record<string, string> = {
  PENDING: "#737373",
  CUTTING: "#2563eb",
  COMPLETED: "#15803d",
};

// Cut TYPE display labels — mirror the real cuts list config
// (config/list/production/cuts.ts: VINYL → "Adesivo", STENCIL → "Espovo").
// The cut type must ALWAYS render through this map; never show the raw enum
// (VINYL/STENCIL) or "Vinil"/"Stencil". The phone list's defaultVisible set is
// ARQUIVO/NOME/STATUS (type is not a visible column on phone), but this map is
// kept here so any type rendering is guaranteed to be display-safe.
const CUT_TYPE_LABELS: Record<string, string> = {
  VINYL: "Adesivo",
  STENCIL: "Espovo",
};

/**
 * Tutorial scene mirroring the production "Recorte" list page
 * (`src/app/(tabs)/producao/recorte/listar.tsx`), which renders through the
 * generic `Layout` → `Table` driven by `cutsListConfig`.
 *
 * Layout, top-to-bottom:
 *   1. Header toolbar — Search field (flex) + column-visibility button (with the
 *      visible-count badge "3") + filter button (mirrors Layout header).
 *   2. Bordered table card — uppercase column header row (ARQUIVO / NOME / STATUS,
 *      the phone `defaultVisible` set) over alternating-background data rows, with
 *      a fixed "Mostrando X de Y" pagination footer.
 *   3. "Novo Corte" create FAB (cutsListConfig.actions.create).
 *
 * Each row: file thumbnail + filename ("ARQUIVO"), task/file name ("NOME"),
 * and a solid status badge ("STATUS"). The cuts config default sort is
 * `status: asc`, so the STATUS header shows a chevron-up sort indicator.
 */
export function RecorteScene({ state: _state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  // Pad rows so the table visually feels populated like the real screen.
  // Precompute a display-safe cut TYPE label on every row so the type is NEVER
  // surfaced as a raw enum or "Vinil"/"Stencil" anywhere this list renders it.
  const rows = [
    ...TUTORIAL_CUTS_LIST,
    ...TUTORIAL_CUTS_LIST.slice(0, 2).map((c, i) => ({ ...c, id: `${c.id}-dup-${i}` })),
  ].map((c) => ({ ...c, typeLabel: CUT_TYPE_LABELS[c.type] ?? c.type }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header — Search field + column-visibility + filter (mirrors Layout header) */}
      <View style={styles.header}>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSearch size={20} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Buscar cortes...
          </Text>
        </View>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconColumns size={20} color={colors.foreground} />
          {/* Column-visibility badge → primary bg, primaryForeground text, visible count
              (cuts phone defaultVisible = 3 of 11 columns) */}
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>3</Text>
          </View>
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconFilter size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Table card — flex:1, fixed header, scrollable body, fixed footer */}
      <View style={styles.tableOuter}>
        <View
          ref={slot.registerRef("recorteList") as any}
          onLayout={slot.register("recorteList")}
          style={[
            styles.tableCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Column header row — uppercase labels */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.headerCell, { flex: 2.2 }]}>
              <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                ARQUIVO
              </Text>
            </View>
            <View style={[styles.headerCell, { flex: 2 }]}>
              <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                NOME
              </Text>
            </View>
            <View style={[styles.headerCell, { flex: 1.4 }]}>
              <View style={styles.headerContent}>
                <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                  STATUS
                </Text>
                {/* STATUS is sortable; default sort is status asc → chevron-up */}
                <View style={styles.sortIcon}>
                  <IconChevronUp size={14} color={colors.primary} />
                </View>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((c, index) => {
              const badgeColor = STATUS_BADGE_COLOR[c.status] ?? colors.mutedForeground;
              const isLast = index === rows.length - 1;
              return (
                <View
                  key={c.id}
                  style={[
                    styles.row,
                    { backgroundColor: index % 2 === 0 ? colors.background : colors.card },
                    isLast && { borderBottomWidth: 0 },
                  ]}
                >
                  {/* ARQUIVO — file thumbnail + filename */}
                  <View style={[styles.cell, styles.fileCell, { flex: 2.2 }]}>
                    <View style={[styles.thumb, { backgroundColor: colors.muted }]}>
                      <IconPhoto size={20} color={colors.mutedForeground} />
                    </View>
                    <Text
                      style={[styles.cellText, { color: colors.foreground }]}
                      numberOfLines={2}
                      ellipsizeMode="middle"
                    >
                      {c.filename}
                    </Text>
                  </View>

                  {/* NOME — task/file name */}
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text
                      style={[styles.cellText, { color: colors.foreground }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {c.label}
                    </Text>
                  </View>

                  {/* STATUS — solid badge */}
                  <View style={[styles.cell, { flex: 1.4 }]}>
                    <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
                      <Text style={styles.statusBadgeText} numberOfLines={1}>
                        {c.statusLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Fixed footer — "Mostrando X de Y" */}
          <View
            style={[
              styles.footer,
              { borderTopColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Text style={[styles.footerText, { color: colors.foreground }]}>
              Mostrando {rows.length} de {rows.length}
            </Text>
          </View>
        </View>
      </View>

      {/* FAB — mirrors the "Novo Corte" create action (real FAB component) */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <Pressable style={[styles.fab, { backgroundColor: colors.primary }]}>
          <IconPlus size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header toolbar (mirrors list Layout header: paddingH/V 12, gap 8)
  header: {
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
    minWidth: 40,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
  },
  // Column-visibility count badge (mirrors ColumnVisibility button badge)
  badge: {
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
  badgeText: { fontSize: 10, fontWeight: "700" },
  // Table card outer (mirrors Table: container paddingHorizontal 12, card flex:1)
  tableOuter: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  // Table card container — radius 8, 1px border, clipped
  tableCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  // Column header row — minHeight 40
  headerRow: {
    flexDirection: "row",
    minHeight: 40,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  headerText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Sort indicator wrapper — mirrors Table/Header sortIcon (marginLeft 4)
  sortIcon: {
    marginLeft: 4,
  },
  // Data row — minHeight 48, borderBottom matches real Row rowWrapper rgba(0,0,0,0.05)
  row: {
    flexDirection: "row",
    minHeight: 48,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
  },
  fileCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // 40x40 file thumbnail (mirrors CellContent thumbnailContainer)
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cellText: { fontSize: 12, flexShrink: 1 },
  // Status badge — solid, radius 6, white text 12/500 (mirrors CellContent statusBadge)
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  statusBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "500" },
  // Fixed footer (matches Table footerContainer / paginationText)
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // FAB pinned bottom-right, matches the real FAB component
  // (bottom ~ max(24, insets.bottom + 32), right 16, borderRadius 28, padding 16)
  fabContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 24,
    paddingRight: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
