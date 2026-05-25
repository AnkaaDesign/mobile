/**
 * Home scene — matches the real Ankaa dashboard (src/app/(tabs)/inicio.tsx +
 * dashboard/components/*).
 *
 * Real-app layout (three stacked sections, padding 16 / gap 16):
 *   1. Greeting card: "{Bom dia/tarde/noite}, {firstName}!" + live clock,
 *      then date + an outline "Editar" button (view mode only).
 *   2. Edit toolbar (edit mode): "Adicionar" (outline, icon-right) · spacer ·
 *      "Descartar" (filled destructive) · "Salvar" (filled primary).
 *   3. Widget grid. The example "Tarefas" widget uses IconClipboardText and a
 *      teal accent (#14b8a6), a 36px header with bottom border, a count pill,
 *      and a 28px "Ver todos" footer.
 *
 * There is NO "Atalhos"/favorites section — the real home doesn't have one.
 */
import { type ReactNode, useEffect, useRef } from "react";
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconChartBar,
  IconChevronRight,
  IconClipboardText,
  IconClock,
  IconDeviceFloppy,
  IconDotsVertical,
  IconMessage,
  IconPencil,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/lib/theme";
import {
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
  spacing,
} from "@/constants/design-system";
import { useSlotContext } from "../chrome/slot-context";
import { useTutorialStore } from "../engine-store";
import {
  TUTORIAL_HOME_WIDGETS_AVAILABLE,
  TUTORIAL_TASKS,
  TUTORIAL_USER,
} from "../fixtures";
import type { SceneProps } from "./index";

/** teal-500 — the real Tarefas widget accent (ACCENT_SCALES.teal[500]). */
const TASK_ACCENT = "#14b8a6";

// Accents of the real PRODUCTION-sector default widgets (presets.ts →
// productionLayout): Mensagens Recentes (indigo), Meu Ponto (teal),
// Produtividade (blue). The panel ships with these — it is NOT empty.
const MSG_ACCENT = "#6366f1"; // indigo
const PONTO_ACCENT = "#14b8a6"; // teal
const PROD_ACCENT = "#3b82f6"; // blue

const CATALOG_ICONS = {
  tasks: IconClipboardText,
  stock: IconAlertTriangle,
  metrics: IconChartBar,
} as const;

export function HomeScene({ state }: SceneProps) {
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();
  const editMode = !!state.homeEditMode;
  // The Tarefas widget is the one the user *adds* during the tutorial; the
  // panel itself is never empty (it ships with the sector defaults).
  const taskWidgetAdded = !!state.homeWidgetPresent;
  const addSheetOpen = !!state.homeAddWidgetSheet;

  const headerBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const pillBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  const pillBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const iconBlockBg = isDark ? `${TASK_ACCENT}2E` : `${TASK_ACCENT}1F`;
  const outlineBg = isDark ? colors.secondary : colors.card;

  // Scroll the highlighted widget into view. The Tarefas tile is appended last,
  // so revealing it means scrolling to the end; other targets sit near the top.
  // onScroll re-measures so the spotlight/tooltip track the content.
  const scrollRef = useRef<ScrollView>(null);
  const activeSlot = useTutorialStore((s) => s.activeSlot);
  useEffect(() => {
    const onTaskTile =
      activeSlot === "homeFirstWidgetTile" ||
      activeSlot === "homeWidgetMoreActions";
    if (onTaskTile) {
      scrollRef.current?.scrollToEnd({ animated: true });
    } else if (activeSlot) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollRef}
        onScroll={() => slot.remeasureAll()}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
      >
        {/* Greeting card */}
        <View
          ref={slot.registerRef("homeGreeting") as any}
          onLayout={slot.register("homeGreeting")}
          style={[styles.greetingCard, { backgroundColor: colors.card }]}
        >
          <View style={styles.greetingRow}>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>
              Boa tarde, {TUTORIAL_USER.firstName}!
            </Text>
            <Text style={[styles.greetingClock, { color: colors.text }]}>
              14:32:08
            </Text>
          </View>
          <View style={styles.greetingRow}>
            <Text style={[styles.greetingDate, { color: colors.mutedForeground }]}>
              quarta-feira, 21 de maio de 2026
            </Text>
            {!editMode ? (
              <Pressable
                ref={slot.registerRef("homeEditPanelButton") as any}
                onLayout={slot.register("homeEditPanelButton")}
                style={[
                  styles.editBtn,
                  { borderColor: colors.border, backgroundColor: outlineBg },
                ]}
              >
                <IconPencil size={13} color={colors.text} />
                <Text style={[styles.editBtnText, { color: colors.text }]}>
                  Editar
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Edit-mode toolbar */}
        {editMode ? (
          <View
            ref={slot.registerRef("homeEditToolbar") as any}
            onLayout={slot.register("homeEditToolbar")}
            style={styles.editToolbar}
          >
            <Pressable
              ref={slot.registerRef("homeAddWidgetButton") as any}
              onLayout={slot.register("homeAddWidgetButton")}
              style={[
                styles.toolbarBtn,
                { borderWidth: 1, borderColor: colors.border, backgroundColor: outlineBg },
              ]}
            >
              <Text style={[styles.toolbarBtnText, { color: colors.text }]}>
                Adicionar
              </Text>
              <IconPlus size={14} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              style={[styles.toolbarBtn, shadow.sm, { backgroundColor: colors.destructive }]}
            >
              <IconArrowBackUp size={14} color="#fff" />
              <Text style={[styles.toolbarBtnText, { color: "#fff" }]}>
                Descartar
              </Text>
            </Pressable>
            <Pressable
              ref={slot.registerRef("homeSaveEditButton") as any}
              onLayout={slot.register("homeSaveEditButton")}
              style={[styles.toolbarBtn, shadow.sm, { backgroundColor: colors.primary }]}
            >
              <IconDeviceFloppy size={14} color="#fff" />
              <Text style={[styles.toolbarBtnText, { color: "#fff" }]}>
                Salvar
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Widget grid container — primary-tinted when in edit mode */}
        <View
          ref={slot.registerRef("homeWidgetList") as any}
          onLayout={slot.register("homeWidgetList")}
          style={[
            editMode && {
              backgroundColor: `${colors.primary}11`,
              borderColor: `${colors.primary}33`,
              borderWidth: 1,
              borderRadius: 14,
              padding: 12,
            },
            { gap: 12 },
          ]}
        >
          {/* PRODUCTION-sector default widgets — the panel ships with these
              (presets.ts productionLayout), so it is never empty. */}
          <MiniWidget
            accent={MSG_ACCENT}
            icon={IconMessage}
            title="Mensagens Recentes"
            editMode={editMode}
            colors={colors}
            isDark={isDark}
          >
            <View style={styles.msgRow}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.msgCard, { backgroundColor: headerBg, borderColor: colors.border }]}
                >
                  <View style={[styles.skelLine, { width: "70%", backgroundColor: colors.mutedForeground, opacity: 0.5 }]} />
                  <View style={[styles.skelLine, { width: "100%", backgroundColor: colors.border }]} />
                  <View style={[styles.skelLine, { width: "55%", backgroundColor: colors.border }]} />
                </View>
              ))}
            </View>
          </MiniWidget>
          <MiniWidget
            accent={PONTO_ACCENT}
            icon={IconClock}
            title="Meu Ponto"
            editMode={editMode}
            colors={colors}
            isDark={isDark}
          >
            <View style={[styles.pontoRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              {["Data", "E1", "S1", "E2", "S2"].map((h) => (
                <Text key={h} style={[styles.pontoHeadCell, { color: colors.mutedForeground }]}>
                  {h}
                </Text>
              ))}
            </View>
            <View style={styles.pontoRow}>
              {["21/05", "08:00", "12:00", "13:00", "17:00"].map((v, i) => (
                <Text key={i} style={[styles.pontoCell, { color: colors.text }]}>
                  {v}
                </Text>
              ))}
            </View>
          </MiniWidget>
          <MiniWidget
            accent={PROD_ACCENT}
            icon={IconChartBar}
            title="Produtividade"
            editMode={editMode}
            colors={colors}
            isDark={isDark}
          >
            <View style={styles.chartRow}>
              {[44, 72, 56, 90, 63, 81].map((h, i) => (
                <View
                  key={i}
                  style={[styles.bar, { height: h, backgroundColor: PROD_ACCENT, opacity: 0.85 }]}
                />
              ))}
            </View>
          </MiniWidget>

          {/* Tarefas — appended last; this is the widget the user adds. */}
          {taskWidgetAdded ? (
            <View
              ref={slot.registerRef("homeFirstWidgetTile") as any}
              onLayout={slot.register("homeFirstWidgetTile")}
              style={[
                styles.widgetCard,
                {
                  backgroundColor: colors.card,
                  borderColor: editMode ? colors.primary : TASK_ACCENT,
                  borderWidth: 1.5,
                },
              ]}
            >
              {/* Top accent stripe (real app uses a 6px tinted strip) */}
              <View style={[styles.accentStripe, { backgroundColor: TASK_ACCENT }]} />
              <View
                style={[
                  styles.widgetHeader,
                  { backgroundColor: headerBg, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.iconBlock, { backgroundColor: iconBlockBg }]}>
                  <IconClipboardText size={16} color={TASK_ACCENT} />
                </View>
                <Text style={[styles.widgetTitle, { color: colors.text }]}>
                  Tarefas
                </Text>
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: pillBg, borderColor: pillBorder },
                  ]}
                >
                  <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                    {TUTORIAL_TASKS.length}
                  </Text>
                </View>
              </View>
              <View style={styles.widgetBody}>
                {TUTORIAL_TASKS.slice(0, 3).map((t, i) => (
                  <View
                    key={t.id}
                    style={[
                      styles.widgetRow,
                      i < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: t.paintHex }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.widgetRowTitle, { color: colors.text }]} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={[styles.widgetRowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {t.customer}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: `${t.statusColor}22`, borderColor: t.statusColor },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: t.statusColor }]}>
                        {t.statusLabel.split(" (")[0]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={[styles.widgetFooter, { backgroundColor: headerBg, borderTopColor: colors.border }]}>
                <Text style={[styles.viewAll, { color: colors.mutedForeground }]}>
                  Ver todos
                </Text>
                <IconChevronRight size={12} color={colors.mutedForeground} />
              </View>

              {/* Edit-mode floating toolbar (bottom-right) — matches the real
                  WidgetTile: a single 3-dots options button. */}
              {editMode ? (
                <View
                  style={[
                    styles.widgetEditToolbar,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Pressable
                    ref={slot.registerRef("homeWidgetMoreActions") as any}
                    onLayout={slot.register("homeWidgetMoreActions")}
                    style={styles.widgetEditBtn}
                  >
                    <IconDotsVertical size={15} color={colors.foreground} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {addSheetOpen ? <AddWidgetSheet /> : null}
    </View>
  );
}

// Shared chrome for the default dashboard widgets (accent stripe + 36px header
// with tinted icon + title, then a body). Mirrors widget-card.tsx. In edit mode
// each tile shows the floating 3-dots options button like the real WidgetTile.
function MiniWidget({
  accent,
  icon: Icon,
  title,
  editMode,
  colors,
  isDark,
  children,
}: {
  accent: string;
  icon: any;
  title: string;
  editMode: boolean;
  colors: any;
  isDark: boolean;
  children: ReactNode;
}) {
  const headerBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const iconBlockBg = isDark ? `${accent}2E` : `${accent}1F`;
  return (
    <View
      style={[
        styles.widgetCard,
        {
          backgroundColor: colors.card,
          borderColor: editMode ? colors.primary : accent,
          borderWidth: 1.5,
        },
      ]}
    >
      <View style={[styles.accentStripe, { backgroundColor: accent }]} />
      <View
        style={[
          styles.widgetHeader,
          { backgroundColor: headerBg, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.iconBlock, { backgroundColor: iconBlockBg }]}>
          <Icon size={16} color={accent} />
        </View>
        <Text style={[styles.widgetTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.widgetBody}>{children}</View>
      {editMode ? (
        <View
          style={[
            styles.widgetEditToolbar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.widgetEditBtn}>
            <IconDotsVertical size={15} color={colors.foreground} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

// Mirrors the real `AddWidgetSheet` (dashboard/components/add-widget-sheet.tsx):
// a Sheet pinned at 90% height with a drag-indicator pill, a bordered sticky
// header (title 18/600 + subtitle 13/400/muted + 36×36 close), a sticky search
// strip, and a scrollable widget list. The list is single-column with
// full-width cards (each a 4px top accent stripe, tinted icon, category badge,
// name, description) — matching the live gallery the user sees.
function AddWidgetSheet() {
  const { colors } = useTheme();
  const slot = useSlotContext();
  return (
    <View style={styles.sheetBackdrop} pointerEvents="box-none">
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Drag-indicator pill — auto-rendered by the real Sheet primitive. */}
        <View style={[styles.sheetDragIndicator, { backgroundColor: colors.muted }]} />

        {/* Sticky header — title 18/600 + subtitle 13/400/muted + 36×36 close. */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
              Adicionar widget
            </Text>
            <Text style={[styles.sheetDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              Escolha um widget para adicionar ao seu painel.
            </Text>
          </View>
          <Pressable hitSlop={8} style={styles.sheetClose}>
            <IconX size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Sticky search strip — matches the real Adicionar widget gallery. */}
        <View style={[styles.sheetSearchStrip, { borderBottomColor: colors.border }]}>
          <View style={[styles.sheetSearch, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <IconSearch size={16} color={colors.mutedForeground} />
            <Text style={[styles.sheetSearchPlaceholder, { color: colors.mutedForeground }]}>
              Buscar widgets...
            </Text>
          </View>
        </View>

        {/* Scrollable single-column widget list. */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.catalogList}
          showsVerticalScrollIndicator={false}
        >
          {TUTORIAL_HOME_WIDGETS_AVAILABLE.map((w) => {
            const isTarefas = w.id === "table.tasks";
            const Icon = CATALOG_ICONS[w.iconKey] ?? IconClipboardText;
            return (
              <View
                key={w.id}
                ref={
                  isTarefas
                    ? (slot.registerRef("homeAddWidgetCatalogTarefas") as any)
                    : undefined
                }
                onLayout={
                  isTarefas
                    ? slot.register("homeAddWidgetCatalogTarefas")
                    : undefined
                }
                style={[
                  styles.catalogCard,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <View style={[styles.catalogAccent, { backgroundColor: w.accent }]} />
                <View style={styles.catalogTopRow}>
                  <View style={[styles.catalogIconWrap, { backgroundColor: w.accentTint }]}>
                    <Icon size={20} color={w.accentText} />
                  </View>
                  <View style={[styles.catalogBadge, { backgroundColor: w.accentTint }]}>
                    <Text style={[styles.catalogBadgeText, { color: w.accentText }]}>
                      {w.categoryLabel.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.catalogLabel, { color: colors.text }]} numberOfLines={2}>
                  {w.label}
                </Text>
                <Text style={[styles.catalogDesc2, { color: colors.mutedForeground }]} numberOfLines={3}>
                  {w.description}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Greeting card — mirrors the real inicio.tsx card: bg card, radius 12,
  // padH16/padV12, NO border (the real home greeting card is borderless).
  greetingCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: borderRadius.xl,
    gap: 2,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  greetingTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, flex: 1 },
  greetingClock: { fontSize: fontSize.sm, fontVariant: ["tabular-nums"] },
  greetingDate: { fontSize: fontSize.xs, flex: 1 },
  // "Editar" — outline sm button via EditToolbar: height 30, padH10, r6.
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  editBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  editToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -8,
  },
  // Edit-mode toolbar buttons — mirror the real EditToolbar's Button size="sm":
  // height 33, padH12, r6, with shadow.sm on the filled (default/destructive)
  // variants. text uses fontSize.xs (12) per the sm Button text size.
  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 33,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  toolbarBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

  // Widget card — mirrors widget-card.tsx: radius 8 (CARD_RADIUS), soft
  // shadow.sm, overflow hidden so the accent stripe corners stay clean.
  widgetCard: { borderRadius: borderRadius.lg, overflow: "hidden", ...shadow.sm },
  // ACCENT_STRIPE_HEIGHT = 6px (widget-card.tsx) — drives widget identity.
  accentStripe: { height: 6 },
  // Header strip — h36, padH12, icon block 24 r6, title 14/600 letterSpacing
  // -0.1, count pill r6 padH6/padV1 (mirrors widget-card.tsx).
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 12,
    height: 36,
    borderBottomWidth: 1,
  },
  iconBlock: { width: 24, height: 24, borderRadius: borderRadius.md, alignItems: "center", justifyContent: "center" },
  widgetTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, letterSpacing: -0.1 },
  countPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: borderRadius.md, borderWidth: 1, minWidth: 20, alignItems: "center", justifyContent: "center" },
  countText: { fontSize: 10, fontWeight: fontWeight.semibold, lineHeight: 14, fontVariant: ["tabular-nums"] },
  widgetEditToolbar: {
    position: "absolute",
    bottom: 6,
    right: 6,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  // Edit-mode 3-dots button — TOOLBAR_BTN 32 / TOOLBAR_RADIUS 6 (widget-tile.tsx).
  widgetEditBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  widgetBody: { paddingHorizontal: 12, paddingVertical: spacing.xs },
  widgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  colorDot: { width: 20, height: 20, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" },
  widgetRowTitle: { fontSize: 13, fontWeight: fontWeight.medium },
  widgetRowSub: { fontSize: 11, marginTop: 1 },
  // Compact tinted status pill inside the widget table rows (r6 matches the
  // real Badge used by the Tarefas widget rows).
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.md, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: fontWeight.medium },
  // Footer "Ver todos" link strip — h28, 11/500 mutedForeground (widget-card.tsx).
  widgetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    height: 28,
    borderTopWidth: 1,
  },
  viewAll: { fontSize: 11, fontWeight: fontWeight.medium },
  // Mensagens Recentes — 3 compact stub cards (skeleton previews) in a row.
  msgRow: { flexDirection: "row", gap: 8 },
  msgCard: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, gap: 5 },
  skelLine: { height: 6, borderRadius: 3 },
  // Meu Ponto — 5-column mini punch table.
  pontoRow: { flexDirection: "row", paddingVertical: 5 },
  pontoHeadCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  pontoCell: { flex: 1, fontSize: 12, fontVariant: ["tabular-nums"] },
  // Produtividade — simple SVG-less bar chart row.
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 96,
    paddingTop: 4,
  },
  bar: { flex: 1, borderRadius: 3 },
  sheetBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  // Sheet shell — mirrors the real Sheet primitive at snapPoints [90]: fixed
  // 90% height anchored to the bottom, rounded top corners, a top+side border
  // (no bottom border), overflow hidden, soft lifted shadow.
  sheet: {
    height: "90%",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    ...shadow.lg,
  },
  // Drag-indicator pill — 40×4, radius full, centered (Sheet primitive spec).
  sheetDragIndicator: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  // Sticky header — padH16, padTop8/padBottom14, bottom border (AddWidgetSheet).
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  // Sticky search strip beneath the header — padH16, padTop12/padBottom10,
  // bottom border (mirrors the real gallery's pinned search + tabs section).
  sheetSearchStrip: {
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  // Search input — mirrors AddWidgetSheet: h40, r8, IconSearch 16, input 14.
  sheetSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  sheetSearchPlaceholder: { fontSize: fontSize.sm },
  // Header — title 18/600, description 13/400/muted (AddWidgetSheet header).
  sheetTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, letterSpacing: -0.2 },
  sheetDesc: { fontSize: 13, marginTop: spacing.xs, lineHeight: 18 },
  // 36×36 round close button (AddWidgetSheet close affordance — transparent).
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // Single-column scroll list — padH16, top/bottom inset, 10px between cards
  // (matches the live gallery the user sees: full-width cards stacked).
  catalogList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.lg,
    gap: 10,
  },
  // Gallery card — mirrors WidgetGalleryCard: full-width, r10, border 1.5,
  // 4px top accent, 40×40 tinted icon r8, category badge r4, name 14/600,
  // description 12/400/muted, soft shadow.sm.
  catalogCard: {
    width: "100%",
    borderRadius: borderRadius.xl - 2,
    borderWidth: 1.5,
    padding: 12,
    gap: spacing.sm,
    overflow: "hidden",
    ...shadow.sm,
  },
  catalogAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  catalogTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: 6,
  },
  catalogIconWrap: { width: 40, height: 40, borderRadius: borderRadius.lg, alignItems: "center", justifyContent: "center" },
  catalogBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.sm },
  catalogBadgeText: { fontSize: 10, fontWeight: fontWeight.semibold, letterSpacing: 0.4 },
  catalogLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, lineHeight: 18 },
  catalogDesc2: { fontSize: fontSize.xs, lineHeight: 16 },
});
