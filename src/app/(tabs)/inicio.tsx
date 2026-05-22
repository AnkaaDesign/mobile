// Home screen — pure widget-system dashboard. The legacy HomeDashboardSection
// block was retired (2026-05-10) because the new widget system has direct
// equivalents for every section it shipped (task-table for tasks/budgets/
// quotes, item-table for low-stock, etc) and rendering both stacked caused
// "Ver todos in header" + pagination + duplicated content in view mode.
// Sector presets (presets.ts) now provide the same default content via
// proper widget instances.

import {
  View,
  Text,
  Pressable,
  RefreshControl,
} from "react-native";
// Use gesture-handler's ScrollView so child Pan gestures (sortable-grid
// drag) coexist with the parent scroll cleanly. We additionally toggle
// `scrollEnabled` off while a widget drag is active (see
// `isDraggingWidget`) so there's zero scroll-vs-drag contention once a
// drag begins — the previous "activateAfterLongPress" approach alone was
// not reliable on iOS because any micro-movement during the hold made
// the parent scroll win, dropping the user's drag intent silently.
import { ScrollView } from "react-native-gesture-handler";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
// Side-effect import: registers all widgets with the registry on first load.
// Must come before useDashboardLayout so the registry is populated.
import "@/dashboard";
import { useDashboardLayout, DashboardGrid } from "@/dashboard";
import { ConfigureWidgetModal } from "@/dashboard/components/configure-widget-modal";
import { AddWidgetSheet } from "@/dashboard/components/add-widget-sheet";
import { SizeSelector } from "@/dashboard/components/size-selector";
import { EditToolbar } from "@/dashboard/components/edit-toolbar";
import { widgetRegistry } from "@/dashboard/registry";
import { Sheet } from "@/components/ui/sheet";
import {
  IconSettings,
  IconLayoutGrid,
  IconTrash,
} from "@tabler/icons-react-native";

// Overflow-sheet action — icon + label in a clearly bordered button.
// ALL chrome on the outer View (Pressable's style fn is unreliable for
// border/bg/radius on iOS — the "doesnt look like buttons" complaint).
function OverflowAction({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const outline = isDark ? "rgba(217,217,217,0.30)" : "rgba(64,64,64,0.22)";
  const destructiveOutline = destructive
    ? colors.destructive + "55"
    : outline;
  const restingBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.035)";
  return (
    <View
      style={{
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: destructiveOutline,
        backgroundColor: restingBg,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          {icon}
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: destructive ? colors.destructive : colors.foreground,
            }}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

// Isolated clock components — these own their own 1Hz state so the rest of
// HomeScreen (widgets, dashboard data, drag-and-drop grid) doesn't re-render
// once per second. Each ticks independently and only re-renders the small
// Text node it controls. LiveDate only updates when the day actually changes.
const LiveClock = memo(function LiveClock({ color }: { color: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Text
      style={{
        fontSize: 14,
        color,
        fontVariant: ["tabular-nums"],
      }}
    >
      {now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </Text>
  );
});

const LiveDate = memo(function LiveDate({ color }: { color: string }) {
  const [today, setToday] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });
  useEffect(() => {
    // Check once a minute — cheap, and the rendered string only changes at
    // midnight. Avoids re-running toLocaleDateString every second.
    const interval = setInterval(() => {
      const d = new Date();
      const next = d.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setToday((prev) => (prev === next ? prev : next));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Text
      numberOfLines={1}
      style={{
        flex: 1,
        fontSize: 12,
        color,
      }}
    >
      {today}
    </Text>
  );
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Pull-to-refresh refetches every active widget query through React Query's
  // query client. The hook no longer wraps the deprecated useHomeDashboard
  // endpoint — each widget owns its data via its own hook now.
  const queryClient = useQueryClient();
  const [isRefetching, setIsRefetching] = useState(false);
  const refetch = useCallback(async () => {
    setIsRefetching(true);
    try {
      await queryClient.refetchQueries({ type: "active" });
    } finally {
      setIsRefetching(false);
    }
  }, [queryClient]);

  // Widget layout state. The hook returns the merged working layout (persisted
  // OR sector preset on first run), edit-mode toggle, and CRUD handlers.
  const {
    layout,
    isEditing,
    isSaving,
    isDirty,
    enterEdit,
    saveAndExit,
    discardAndExit,
    removeWidget,
    addWidget,
    reorderItems,
    configureWidget,
    resizeWidget,
    restoredInstanceIds,
  } = useDashboardLayout();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  // True while ANY widget tile in the dashboard grid is being dragged.
  // Used to toggle ScrollView.scrollEnabled off so the page can't scroll
  // while the user is mid-rearrange. Wired up via DashboardGrid →
  // SortableGrid's onDragActiveChange callback.
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);
  // Active configure-modal target. When non-null, the ConfigureWidgetModal
  // opens for that instance. Lifting this state here (rather than to context)
  // keeps the modal scoped to the home screen — the only place it can open.
  const [configureInstanceId, setConfigureInstanceId] = useState<string | null>(null);
  const configureInstance = useMemo(
    () =>
      configureInstanceId
        ? layout.items.find((it) => it.instanceId === configureInstanceId) ?? null
        : null,
    [configureInstanceId, layout.items],
  );
  // Active overflow-sheet target. The ActionSheet is hosted at the screen
  // root (not on each tile) because RN <Modal> cannot portal cleanly out of
  // the nested Reanimated transforms each tile lives inside (DraggableFlatList
  // cell + jiggle Animated.View).
  const [overflowInstanceId, setOverflowInstanceId] = useState<string | null>(null);
  const overflowInstance = useMemo(
    () =>
      overflowInstanceId
        ? layout.items.find((it) => it.instanceId === overflowInstanceId) ?? null
        : null,
    [overflowInstanceId, layout.items],
  );
  // Active resize-sheet target. Same Modal-portaling reason as the overflow
  // sheet — must live at screen root, not inside the tile.
  const [resizeInstanceId, setResizeInstanceId] = useState<string | null>(null);
  const resizeInstance = useMemo(
    () =>
      resizeInstanceId
        ? layout.items.find((it) => it.instanceId === resizeInstanceId) ?? null
        : null,
    [resizeInstanceId, layout.items],
  );
  const resizeDef = resizeInstance
    ? widgetRegistry.get(resizeInstance.widgetId)
    : null;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const scrollRef = useRef<ScrollView | null>(null);

  if (!user) return null;

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 32 }}
      // Disable page scroll while a widget tile is being dragged — see
      // sortable-grid.tsx's gesture composition for why this is the
      // bulletproof fix (vs. relying on activateAfterLongPress alone).
      scrollEnabled={!isDraggingWidget}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        {/* Greeting card — name, date, running clock, and the Editar pill
            stacked under the clock on the right side. Edit-mode shows the
            full toolbar in its own row below this card (it has 3 buttons
            and doesn't fit alongside the clock without crowding). */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 2,
          }}
        >
          {/* Row 1 — greeting on the left, clock on the right, vertically
              centered so the baselines align. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: "700",
                color: colors.foreground,
              }}
            >
              {getGreeting()}, {user?.name?.split(" ")[0] || "Usuário"}!
            </Text>
            <LiveClock color={colors.foreground} />
          </View>
          {/* Row 2 — date on the left, Editar pill on the right (view mode
              only). The row's alignItems:center makes the date sit on the
              same horizontal axis as the Editar pill's center. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <LiveDate color={colors.mutedForeground} />
            {!isEditing && (
              <EditToolbar
                isEditing={false}
                isDirty={isDirty}
                isSaving={isSaving}
                onEnterEdit={enterEdit}
                onSave={() => {
                  void saveAndExit();
                }}
                onDiscard={discardAndExit}
                onAddWidget={() => setAddSheetOpen(true)}
              />
            )}
          </View>
        </View>

        {/* Edit-mode toolbar — only shown while editing. The view-mode
            Editar pill lives inside the greeting card above. */}
        {isEditing && (
          <EditToolbar
            isEditing
            isDirty={isDirty}
            isSaving={isSaving}
            onEnterEdit={enterEdit}
            onSave={() => {
              void saveAndExit();
            }}
            onDiscard={discardAndExit}
            onAddWidget={() => setAddSheetOpen(true)}
          />
        )}

        {/* Widget grid — renders the user's current layout. */}
        <View>
          <DashboardGrid
            items={layout.items}
            isEditing={isEditing}
            onRemove={removeWidget}
            onReorder={reorderItems}
            onConfigure={(instanceId) => setConfigureInstanceId(instanceId)}
            onMoreActions={(instanceId) => setOverflowInstanceId(instanceId)}
            onResize={(instanceId) => setResizeInstanceId(instanceId)}
            onEnterEditMode={enterEdit}
            restoredInstanceIds={restoredInstanceIds}
            onDragActiveChange={setIsDraggingWidget}
            onResetConfig={(instanceId) => {
              const it = layout.items.find((i) => i.instanceId === instanceId);
              if (!it) return;
              const def = widgetRegistry.get(it.widgetId);
              if (!def) return;
              configureWidget(instanceId, def.defaultConfig);
            }}
          />
        </View>

        {/* The dashed "+" tile from the previous design has been retired —
            "Adicionar widget" now lives in the edit toolbar (matching web's
            edit-toolbar.tsx). One canonical entry point, no redundancy. */}

        <AddWidgetSheet
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          onAdd={(widgetId) => addWidget(widgetId)}
        />

        <ConfigureWidgetModal
          instance={configureInstance}
          onClose={() => setConfigureInstanceId(null)}
          onApplyConfig={configureWidget}
          onApplySize={resizeWidget}
          onRemove={removeWidget}
        />

        {/* Per-tile overflow sheet — now the SOLE entry point for all
            edit-mode actions (Configurar / Tamanho / Remover). Replaces
            the previous toolbar that had a separate gear, size pill, and
            this sheet. Consolidating into one menu mirrors the user's ask:
            "have a widget size, config and a vertical 3 dots with the
            delete, everything into one". */}
        <Sheet
          open={!!overflowInstance}
          onOpenChange={(o) => {
            if (!o) setOverflowInstanceId(null);
          }}
          snapPoints={[38]}
          backdropOpacity={0.45}
        >
          {overflowInstance && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 4,
                paddingBottom: 24,
                gap: 10,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.foreground,
                  paddingBottom: 8,
                }}
              >
                {widgetRegistry.get(overflowInstance.widgetId)?.name ?? "Widget"}
              </Text>
              {/* Sheet action buttons — use an explicit inner View so the
                  icon + label stay on one horizontal row. The previous
                  Pressable-with-style-function form rendered the icon
                  above the text on iOS (same bug we hit with EditToolbar:
                  inline style functions returning row layouts don't
                  reliably apply to Pressable's children). Wrapping the
                  contents in a View with row flex is the bulletproof
                  pattern. */}
              <OverflowAction
                icon={<IconSettings size={20} color={colors.foreground} />}
                label="Configurar widget"
                onPress={() => {
                  setConfigureInstanceId(overflowInstance.instanceId);
                  setOverflowInstanceId(null);
                }}
              />
              <OverflowAction
                icon={<IconLayoutGrid size={20} color={colors.foreground} />}
                label="Tamanho"
                onPress={() => {
                  setResizeInstanceId(overflowInstance.instanceId);
                  setOverflowInstanceId(null);
                }}
              />
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginVertical: 4,
                }}
              />
              <OverflowAction
                icon={<IconTrash size={20} color={colors.destructive} />}
                label="Remover do painel"
                destructive
                onPress={() => {
                  removeWidget(overflowInstance.instanceId);
                  setOverflowInstanceId(null);
                }}
              />
            </View>
          )}
        </Sheet>

        {/* Inline resize sheet — hosted at screen root (Modal portaling
            constraint). Tapping the size pill on a tile's edit toolbar
            opens this; resize commits immediately on each tap. */}
        <Sheet
          open={!!resizeInstance}
          onOpenChange={(o) => {
            if (!o) setResizeInstanceId(null);
          }}
          snapPoints={[55]}
          backdropOpacity={0.45}
        >
          {resizeInstance && resizeDef && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 24,
                gap: 16,
              }}
            >
              <View style={{ gap: 4 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.foreground,
                  }}
                >
                  Tamanho: {resizeDef.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                  }}
                >
                  Alterações são aplicadas imediatamente.
                </Text>
              </View>
              <SizeSelector
                value={resizeInstance.size}
                allowedSpans={resizeDef.allowedSpans}
                allowedHeights={resizeDef.allowedHeights}
                onChange={(size) => resizeWidget(resizeInstance.instanceId, size)}
              />
            </View>
          )}
        </Sheet>

      </View>
    </ScrollView>
  );
}
