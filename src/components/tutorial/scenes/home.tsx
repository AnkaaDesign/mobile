/**
 * Home scene — matches the real Ankaa dashboard.
 *
 * Real-app layout:
 *   1. Greeting card: "{Bom dia/tarde/noite}, {firstName}!" + clock + date
 *      + "Editar" outline button on the right (view mode only)
 *   2. Optional edit toolbar (when state.homeEditMode=true): Adicionar / Descartar / Salvar
 *   3. Widget grid — 3 columns on phones, single tile in this demo
 *
 * No "Atalhos" section — that doesn't exist in the real app.
 */
import {
  IconBriefcase,
  IconChevronRight,
  IconDotsVertical,
  IconGripVertical,
  IconPencil,
  IconPlus,
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
import { useSlotContext } from "../chrome/slot-context";
import {
  TUTORIAL_HOME_WIDGETS_AVAILABLE,
  TUTORIAL_TASKS,
  TUTORIAL_USER,
} from "../fixtures";
import type { SceneProps } from "./index";

export function HomeScene({ state }: SceneProps) {
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();
  const editMode = !!state.homeEditMode;
  const widgetPresent = state.homeWidgetPresent !== false;
  const addSheetOpen = !!state.homeAddWidgetSheet;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 100 }}
      >
        {/* Greeting card */}
        <View
          ref={slot.registerRef("homeGreeting") as any}
          onLayout={slot.register("homeGreeting")}
          style={[
            styles.greetingCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
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
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <IconPencil size={12} color={colors.text} />
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
                styles.toolbarBtnOutline,
                { borderColor: colors.primary },
              ]}
            >
              <IconPlus size={14} color={colors.primary} />
              <Text style={[styles.toolbarBtnOutlineText, { color: colors.primary }]}>
                Adicionar
              </Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable style={[styles.toolbarBtnDestructive, { borderColor: colors.destructive }]}>
              <Text style={[styles.toolbarBtnDestructiveText, { color: colors.destructive }]}>
                Descartar
              </Text>
            </Pressable>
            <Pressable
              ref={slot.registerRef("homeSaveEditButton") as any}
              onLayout={slot.register("homeSaveEditButton")}
              style={[styles.toolbarBtnPrimary, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.toolbarBtnPrimaryText}>Salvar</Text>
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
          {widgetPresent ? (
            <View
              ref={slot.registerRef("homeFirstWidgetTile") as any}
              onLayout={slot.register("homeFirstWidgetTile")}
              style={[
                styles.widgetCard,
                {
                  backgroundColor: colors.card,
                  borderColor: editMode ? colors.primary : colors.border,
                  borderWidth: editMode ? 1.5 : 1,
                },
              ]}
            >
              {/* Top accent stripe (real app uses a 4-6px tinted strip) */}
              <View style={[styles.accentStripe, { backgroundColor: colors.primary }]} />
              <View
                style={[
                  styles.widgetHeader,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                  },
                ]}
              >
                {editMode ? (
                  <IconGripVertical size={14} color={colors.mutedForeground} />
                ) : null}
                <View style={[styles.iconBlock, { backgroundColor: `${colors.primary}22` }]}>
                  <IconBriefcase size={14} color={colors.primary} />
                </View>
                <Text style={[styles.widgetTitle, { color: colors.text }]}>
                  Tarefas
                </Text>
                <View style={[styles.countPill, { borderColor: colors.border }]}>
                  <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                    {TUTORIAL_TASKS.length}
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                {editMode ? (
                  <Pressable
                    ref={slot.registerRef("homeWidgetMoreActions") as any}
                    onLayout={slot.register("homeWidgetMoreActions")}
                    style={[styles.moreBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <IconDotsVertical size={15} color={colors.text} />
                  </Pressable>
                ) : null}
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
                        {t.statusLabel.split(" ")[0]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={[styles.widgetFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.viewAll, { color: colors.mutedForeground }]}>
                  Ver todos
                </Text>
                <IconChevronRight size={11} color={colors.mutedForeground} />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.placeholderWidget,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                Adicione widgets ao seu painel
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {addSheetOpen ? <AddWidgetSheet /> : null}
    </View>
  );
}

function AddWidgetSheet() {
  const { colors } = useTheme();
  const slot = useSlotContext();
  return (
    <View style={styles.sheetBackdrop} pointerEvents="box-none">
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.sheetHeader}>
          <View>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Adicionar widget
            </Text>
            <Text style={[styles.sheetDesc, { color: colors.mutedForeground }]}>
              Escolha um widget para adicionar ao seu painel.
            </Text>
          </View>
          <Pressable hitSlop={8} style={[styles.sheetClose, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <IconX size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <View style={styles.catalogGrid}>
          {TUTORIAL_HOME_WIDGETS_AVAILABLE.map((w) => {
            const isTarefas = w.id === "table.tasks";
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
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <View style={[styles.catalogAccent, { backgroundColor: colors.primary }]} />
                <View style={[styles.catalogIconWrap, { backgroundColor: `${colors.primary}22` }]}>
                  <IconBriefcase size={22} color={colors.primary} />
                </View>
                <Text style={[styles.catalogLabel, { color: colors.text }]} numberOfLines={1}>
                  {w.label}
                </Text>
                <Text style={[styles.catalogDesc2, { color: colors.mutedForeground }]} numberOfLines={3}>
                  {w.description}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  greetingTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  greetingClock: { fontSize: 14, fontWeight: "600", fontVariant: ["tabular-nums"] },
  greetingDate: { fontSize: 12, flex: 1 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 12, fontWeight: "600" },
  editToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbarBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolbarBtnOutlineText: { fontSize: 13, fontWeight: "700" },
  toolbarBtnDestructive: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolbarBtnDestructiveText: { fontSize: 13, fontWeight: "700" },
  toolbarBtnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  toolbarBtnPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  widgetCard: { borderRadius: 8, overflow: "hidden" },
  accentStripe: { height: 6 },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 36,
  },
  iconBlock: { width: 22, height: 22, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  widgetTitle: { fontSize: 14, fontWeight: "600" },
  countPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1 },
  countText: { fontSize: 10, fontWeight: "600" },
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  widgetBody: { paddingHorizontal: 12, paddingVertical: 4 },
  widgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  colorDot: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" },
  widgetRowTitle: { fontSize: 13, fontWeight: "500" },
  widgetRowSub: { fontSize: 11, marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: "500" },
  widgetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  viewAll: { fontSize: 11, fontWeight: "500" },
  placeholderWidget: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
  },
  sheetBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    gap: 14,
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 18, fontWeight: "600" },
  sheetDesc: { fontSize: 13, marginTop: 2 },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  catalogGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catalogCard: {
    width: "47%",
    minHeight: 168,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    overflow: "hidden",
  },
  catalogAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  catalogIconWrap: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 6 },
  catalogLabel: { fontSize: 14, fontWeight: "600" },
  catalogDesc2: { fontSize: 12, lineHeight: 16 },
});
