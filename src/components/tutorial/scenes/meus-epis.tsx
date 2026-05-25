import {
  IconArrowsSort,
  IconColumns3,
  IconFilter,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_PPE_DELIVERIES } from "../fixtures";
import type { SceneProps } from "./index";

/**
 * Mirrors the real "Meus EPIs" list page:
 *   src/app/(tabs)/pessoal/meus-epis/index.tsx
 *     → <Layout config={personalPpeDeliveriesListConfig} />
 *
 * The generic list renders:
 *   1. A header row: search bar + column-visibility button + filter button
 *      (Layout/index.tsx — paddingH 12, paddingV 12, gap 8, 40px controls).
 *   2. A bordered "table card" (radius 8, 1px border) containing a fixed
 *      header (uppercase 10px labels), alternating-background rows, and a
 *      "Mostrando N de N" footer (Table/index.tsx + Header.tsx + Row.tsx).
 *   3. A primary FAB (plus) bottom-right → "Solicitar EPI"
 *      (config.actions.create → ui/fab.tsx).
 *
 * Visible columns mirror config.table.defaultVisible:
 *   ['item.name', 'status', 'createdAt'] → ITEM / STATUS / DATA REQUISIÇÃO.
 * The status cell is the same solid radius-6 badge rendered by CellContent
 * for format:"badge" with badgeEntity:"PPE_DELIVERY".
 */

// Status → solid badge color + label, mirroring exactly
// constants/badge-colors.ts → ENTITY_BADGE_CONFIG.PPE_DELIVERY → BADGE_COLORS
// and constants/enum-labels PPE_DELIVERY_STATUS_LABELS.
const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  PENDING: { bg: "#737373", label: "Pendente" }, // gray → neutral-500
  APPROVED: { bg: "#2563eb", label: "Aprovado" }, // blue → blue-600
  DELIVERED: { bg: "#15803d", label: "Entregue" }, // delivered → green-700
  WAITING_SIGNATURE: { bg: "#f59e0b", label: "Aguardando Assinatura" }, // amber → amber-500
  COMPLETED: { bg: "#15803d", label: "Concluído" }, // green → green-700
  SIGNATURE_REJECTED: { bg: "#b91c1c", label: "Assinatura Rejeitada" }, // red → red-700
  REPROVED: { bg: "#b91c1c", label: "Reprovado" }, // red → red-700
  CANCELLED: { bg: "#b91c1c", label: "Cancelado" }, // cancelled → red-700
};

// Plausible "Data Requisição" timestamps for the datetime-multiline cell
// (real config renders delivery.createdAt with format "datetime-multiline":
// a date line + a dimmed HH:mm line). Fixtures lack createdAt, so we mirror
// the visual shape only.
const REQUEST_DATE: Record<string, { date: string; time: string }> = {
  "ppe-0": { date: "05/05/26", time: "08:12" },
  "ppe-1": { date: "12/05/26", time: "14:03" },
  "ppe-2": { date: "10/05/26", time: "09:47" },
  "ppe-3": { date: "06/05/26", time: "16:21" },
};

export function MeusEpisScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header: search + column-visibility + filter (Layout/index.tsx) ── */}
      <View style={styles.header}>
        <View
          style={[
            styles.search,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconSearch size={20} color={colors.mutedForeground} />
          <Text
            style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            Buscar EPIs...
          </Text>
        </View>
        <View
          style={[
            styles.actionButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconColumns3 size={20} color={colors.foreground} />
        </View>
        <View
          style={[
            styles.actionButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconFilter size={20} color={colors.foreground} />
        </View>
      </View>

      {/* ── Table card (Table/index.tsx) — registers the list slot ─────────── */}
      <View style={styles.tableWrap}>
        <View
          ref={slot.registerRef("pessoalEpis") as any}
          onLayout={slot.register("pessoalEpis")}
          style={[
            styles.tableCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Fixed header row — uppercase 10px labels + sort glyphs */}
          <View
            style={[styles.tableHeader, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.headerCell, { flex: 2.0 }]}>
              <Text
                style={[styles.headerText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                ITEM
              </Text>
              <IconArrowsSort size={14} color={colors.mutedForeground} />
            </View>
            <View style={[styles.headerCell, styles.headerCenter, { flex: 1.5 }]}>
              <Text
                style={[styles.headerText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                STATUS
              </Text>
              <IconArrowsSort size={14} color={colors.mutedForeground} />
            </View>
            <View style={[styles.headerCell, { flex: 1.5 }]}>
              <Text
                style={[styles.headerText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                DATA REQUISIÇÃO
              </Text>
              <IconArrowsSort size={14} color={colors.mutedForeground} />
            </View>
          </View>

          {/* Rows — alternating background, item / status badge / datetime.
              Real rows are pressable and open the delivery detail (Row.tsx
              onPress → router.push). The "Aguardando Assinatura" row is the
              spotlight target the worker taps to sign (pessoalEpisAwaitingRow). */}
          {TUTORIAL_PPE_DELIVERIES.map((p, idx) => {
            const badge =
              STATUS_BADGE[p.status] ?? { bg: "#737373", label: p.statusLabel };
            const req = REQUEST_DATE[p.id] ?? { date: "—", time: "" };
            const rowBg = idx % 2 === 0 ? colors.background : colors.card;
            const isLast = idx === TUTORIAL_PPE_DELIVERIES.length - 1;
            const isAwaiting = p.status === "WAITING_SIGNATURE";

            return (
              <Pressable
                key={p.id}
                ref={
                  isAwaiting
                    ? (slot.registerRef("pessoalEpisAwaitingRow") as any)
                    : undefined
                }
                onLayout={
                  isAwaiting ? slot.register("pessoalEpisAwaitingRow") : undefined
                }
                style={[
                  styles.row,
                  { backgroundColor: rowBg },
                  !isLast && {
                    borderBottomColor: colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                {/* ITEM */}
                <View style={[styles.cell, { flex: 2.0 }]}>
                  <Text
                    style={[styles.itemText, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {p.item}
                  </Text>
                </View>

                {/* STATUS — solid radius-6 badge (CellContent badge cell) */}
                <View style={[styles.cell, styles.cellCenter, { flex: 1.5 }]}>
                  <View
                    style={[styles.statusBadge, { backgroundColor: badge.bg }]}
                  >
                    <Text style={styles.statusText} numberOfLines={1}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* DATA REQUISIÇÃO — datetime-multiline (date + dimmed time) */}
                <View style={[styles.cell, { flex: 1.5 }]}>
                  <Text style={[styles.dateText, { color: colors.foreground }]}>
                    {req.date}
                  </Text>
                  {!!req.time && (
                    <Text
                      style={[
                        styles.dateText,
                        { color: colors.foreground, opacity: 0.7 },
                      ]}
                    >
                      {req.time}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}

          {/* Footer — pagination summary */}
          <View
            style={[
              styles.tableFooter,
              { borderTopColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Text style={[styles.footerText, { color: colors.foreground }]}>
              Mostrando {TUTORIAL_PPE_DELIVERIES.length} de{" "}
              {TUTORIAL_PPE_DELIVERIES.length}
            </Text>
          </View>
        </View>
      </View>

      {/* ── FAB → "Solicitar EPI" (ui/fab.tsx, plus icon) ──────────────────── */}
      <Pressable
        ref={slot.registerRef("pessoalEpisRequestButton") as any}
        onLayout={slot.register("pessoalEpisRequestButton")}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: Math.max(24, insets.bottom + 32),
          },
        ]}
      >
        <IconPlus size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header row — search + action buttons (Layout/index.tsx styles.header)
  header: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    alignItems: "center",
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchPlaceholder: { flex: 1, fontSize: 16 },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Table card (Table/index.tsx — container paddingH 12, card radius 8)
  tableWrap: {
    flex: 1,
    paddingHorizontal: 12,
  },
  tableCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    minHeight: 40,
    borderBottomWidth: 1,
  },
  headerCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerCenter: { justifyContent: "center" },
  headerText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Rows (Row.tsx — minHeight 48, per-cell paddingH 12)
  row: {
    flexDirection: "row",
    minHeight: 48,
    alignItems: "center",
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
  },
  cellCenter: { alignItems: "center" },
  itemText: { fontSize: 12, fontWeight: "500" },
  dateText: { fontSize: 12 },
  // Status badge — CellContent statusBadge (paddingH 10, paddingV 3, radius 6)
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "center",
    maxWidth: "100%",
  },
  statusText: { color: "#ffffff", fontSize: 12, fontWeight: "500" },
  // Footer (Table/index.tsx footerContainer + paginationText)
  tableFooter: {
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
  // FAB (ui/fab.tsx — radius 28, paddingH 16, paddingV 16, bottom =
  // max(24, insets.bottom + 32) applied inline, right 16, shadow 0.2/8)
  fab: {
    position: "absolute",
    right: 16,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
