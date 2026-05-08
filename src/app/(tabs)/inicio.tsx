// Home screen — combines the legacy sector-gated HomeDashboardSection (which
// still hosts the data lists not yet ported to widgets) with the new
// configurable widget system at the bottom. As more widgets ship, sections
// from HomeDashboardSection will move into the widget system and eventually
// the legacy block will be retired.

import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useHomeDashboard } from "@/hooks/dashboard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import {
  HomeDashboardSection,
  HomeDashboardSkeleton,
} from "@/components/home-dashboard";
import {
  useTutorialTarget,
  useOptionalTutorial,
  TUTORIAL_TARGETS,
} from "@/components/tutorial";
// Side-effect import: registers all widgets with the registry on first load.
// Must come before useDashboardLayout so the registry is populated.
import "@/dashboard";
import { useDashboardLayout, DashboardGrid } from "@/dashboard";
import { ConfigureWidgetModal } from "@/dashboard/components/configure-widget-modal";
import { AddWidgetSheet } from "@/dashboard/components/add-widget-sheet";
import { SizeSelector } from "@/dashboard/components/size-selector";
import { widgetRegistry } from "@/dashboard/registry";
import { ActionSheet } from "@/components/ui/action-sheet";
import { Sheet } from "@/components/ui/sheet";
import {
  IconPlus,
  IconPencil,
  IconX,
  IconCheck,
  IconArrowBackUp,
  IconDeviceFloppy,
} from "@tabler/icons-react-native";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const {
    data: dashboardResponse,
    isLoading: isDashboardLoading,
    refetch,
    isRefetching,
  } = useHomeDashboard({ platform: "mobile" });
  const userPrivilege = user?.sector?.privileges;

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
  } = useDashboardLayout();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
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

  // Tutorial spotlights for the widget-first home. Interactive `tap` steps
  // also pass `onAction` so the overlay can drive the underlying behavior
  // even when the dim layer would otherwise swallow the tap.
  const greetingTarget = useTutorialTarget(TUTORIAL_TARGETS.homeGreeting);
  const widgetListTarget = useTutorialTarget(TUTORIAL_TARGETS.homeWidgetList);
  const editButtonTarget = useTutorialTarget(TUTORIAL_TARGETS.homeEditPanelButton, {
    onAction: () => enterEdit(),
  });
  const editToolbarTarget = useTutorialTarget(TUTORIAL_TARGETS.homeEditToolbar);
  const addWidgetTarget = useTutorialTarget(TUTORIAL_TARGETS.homeAddWidgetButton, {
    onAction: () => setAddSheetOpen(true),
  });
  const cancelEditTarget = useTutorialTarget(TUTORIAL_TARGETS.homeCancelEditButton, {
    onAction: () => discardAndExit(),
  });
  const saveEditTarget = useTutorialTarget(TUTORIAL_TARGETS.homeSaveEditButton);

  const tutorial = useOptionalTutorial();
  const tutorialStepId = tutorial?.currentStep?.id;
  const tutorialActive = tutorial?.isActive ?? false;

  // Scroll management for tutorial steps. The "+ Adicionar widget" tile sits
  // below the widget grid and is off-screen when there are several widgets;
  // scroll it into view so the spotlight is visible. Other steps target
  // elements at the top — make sure we're scrolled there for those.
  const scrollRef = useRef<ScrollView | null>(null);
  useEffect(() => {
    if (!tutorialActive || !tutorialStepId) return;
    if (tutorialStepId === "home-add-widget") {
      // Defer one frame so layout from `isEditing` flip has settled, then
      // scroll synchronously (no animation) so the rect re-measure 200ms later
      // captures the post-scroll window position.
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: false }),
      );
      return;
    }
    if (
      tutorialStepId === "home-greeting" ||
      tutorialStepId === "home-widgets-intro" ||
      tutorialStepId === "home-edit-panel" ||
      tutorialStepId === "home-edit-toolbar" ||
      tutorialStepId === "home-cancel-edit" ||
      tutorialStepId === "drawer-intro"
    ) {
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ y: 0, animated: false }),
      );
    }
  }, [tutorialActive, tutorialStepId]);

  // Tutorial flow management for the widget walkthrough:
  //  - "home-edit-toolbar" / "home-add-widget" / "home-widget-catalog" / "home-cancel-edit"
  //    require edit mode to be on and (where relevant) the catalog sheet to be open.
  //  - When the tutorial *transitions* from active → inactive, restore clean state.
  //
  // We track the previous tutorial-active state with a ref so the cleanup only
  // fires on that transition. Without this, the effect would run on every
  // render where tutorialActive is false (the normal case), and entering edit
  // mode by tapping "Editar painel" would immediately get cancelled by
  // discardAndExit() — the bug that made the toolbar blink and disappear.
  const prevTutorialActiveRef = useRef(tutorialActive);
  useEffect(() => {
    const wasActive = prevTutorialActiveRef.current;
    prevTutorialActiveRef.current = tutorialActive;

    if (wasActive && !tutorialActive) {
      // Tutorial just ended — clean up edit mode and the add-widget sheet so
      // the user isn't stranded with a half-open UI.
      if (isEditing) discardAndExit();
      if (addSheetOpen) setAddSheetOpen(false);
      return;
    }

    if (!tutorialActive) return;

    // Auto-close the catalog sheet once the tutorial moves past it.
    if (
      addSheetOpen &&
      tutorialStepId !== "home-add-widget" &&
      tutorialStepId !== "home-widget-catalog"
    ) {
      setAddSheetOpen(false);
    }
  }, [tutorialActive, tutorialStepId, isEditing, addSheetOpen, discardAndExit]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 32 }}
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
        {/* Greeting card — name, date, running clock. The edit affordance
            does NOT live here; it sits in the dashboard section header below
            so it's contextually next to the widgets it controls. */}
        <View
          ref={greetingTarget.ref}
          onLayout={greetingTarget.onLayout}
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}
            >
              {getGreeting()}, {user?.name?.split(" ")[0] || "Usuário"}!
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              {currentTime.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              color: colors.foreground,
              fontVariant: ["tabular-nums"],
            }}
          >
            {currentTime.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </Text>
        </View>

        {/* Dashboard section header — sits above the grid as a discrete row.
            Idle state shows "Meu Painel" with a small "Editar" link on the
            right. Editing state replaces the link with a Cancelar/Salvar
            toolbar at the same row height so the layout below doesn't jump. */}
        {!isEditing ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              minHeight: 44,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.foreground,
              }}
            >
              Meu Painel
            </Text>
            <View ref={editButtonTarget.ref} onLayout={editButtonTarget.onLayout}>
              <Pressable
                onPress={() => {
                  editButtonTarget.onPress();
                  enterEdit();
                }}
                hitSlop={8}
                accessibilityLabel="Editar painel"
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconPencil size={14} color={colors.foreground} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: colors.foreground,
                      marginLeft: 6,
                    }}
                  >
                    Editar
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          <View
            ref={editToolbarTarget.ref}
            onLayout={editToolbarTarget.onLayout}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              minHeight: 36,
            }}
          >
            {/* Adicionar widget — left-aligned, mirrors web's
                edit-toolbar.tsx ([Adicionar] | divider | Descartar | Salvar).
                Button styling matches web's `Button size="sm" variant="outline"`:
                h-9 (36px) borderRadius 6 outlined neutral. */}
            <View ref={addWidgetTarget.ref} onLayout={addWidgetTarget.onLayout}>
              <Pressable
                onPress={() => {
                  addWidgetTarget.onPress();
                  setAddSheetOpen(true);
                }}
                hitSlop={6}
                accessibilityLabel="Adicionar widget"
                style={({ pressed }) => ({
                  height: 36,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: "center",
                  backgroundColor: pressed ? colors.muted : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <IconPlus size={14} color={colors.foreground} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: colors.foreground,
                  }}
                >
                  Adicionar
                </Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }} />
            {/* Descartar — destructive variant. Mirrors web `variant="destructive"`
                using the theme's destructive color. */}
            <View
              ref={cancelEditTarget.ref}
              onLayout={cancelEditTarget.onLayout}
            >
              <Pressable
                disabled={isSaving}
                onPress={() => {
                  cancelEditTarget.onPress();
                  discardAndExit();
                }}
                hitSlop={6}
                accessibilityLabel="Descartar alterações"
                style={({ pressed }) => ({
                  height: 36,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  justifyContent: "center",
                  backgroundColor: pressed
                    ? colors.destructive + "cc"
                    : colors.destructive,
                  opacity: isSaving ? 0.5 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <IconArrowBackUp size={14} color="#fff" />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: "#fff",
                  }}
                >
                  Descartar
                </Text>
              </Pressable>
            </View>
            {/* Salvar — primary. Disabled when nothing changed. */}
            <View ref={saveEditTarget.ref} onLayout={saveEditTarget.onLayout}>
              <Pressable
                disabled={isSaving || !isDirty}
                onPress={() => {
                  saveEditTarget.onPress();
                  saveAndExit().catch(() => {
                    // Toast surface handled by the layout hook.
                  });
                }}
                hitSlop={6}
                accessibilityLabel="Salvar painel"
                style={({ pressed }) => ({
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 6,
                  justifyContent: "center",
                  backgroundColor: colors.primary,
                  opacity: pressed || !isDirty || isSaving ? 0.5 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <IconDeviceFloppy size={14} color={colors.primaryForeground} />
                )}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.primaryForeground,
                  }}
                >
                  {isSaving ? "Salvando" : "Salvar"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Widget grid — renders the user's current layout. */}
        <View ref={widgetListTarget.ref} onLayout={widgetListTarget.onLayout}>
          <DashboardGrid
            items={layout.items}
            isEditing={isEditing}
            onRemove={removeWidget}
            onReorder={reorderItems}
            onConfigure={(instanceId) => setConfigureInstanceId(instanceId)}
            onMoreActions={(instanceId) => setOverflowInstanceId(instanceId)}
            onResize={(instanceId) => setResizeInstanceId(instanceId)}
            onEnterEditMode={enterEdit}
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
        />

        {/* Per-tile overflow ActionSheet, hosted at the screen root so
            RN <Modal> can portal cleanly out of the nested Reanimated
            transforms each tile lives inside (DraggableFlatList cell + tile
            jiggle Animated.View). The widget-tile fires onMoreActions with
            its instanceId; we look up the def + render the sheet. */}
        <ActionSheet
          visible={!!overflowInstance}
          onClose={() => setOverflowInstanceId(null)}
          title={
            overflowInstance
              ? widgetRegistry.get(overflowInstance.widgetId)?.name
              : undefined
          }
          items={
            overflowInstance
              ? [
                  {
                    id: "configure",
                    label: "Configurar widget",
                    icon: "settings",
                    onPress: () => {
                      setConfigureInstanceId(overflowInstance.instanceId);
                    },
                  },
                  {
                    id: "remove",
                    label: "Remover do painel",
                    icon: "trash",
                    destructive: true,
                    onPress: () => removeWidget(overflowInstance.instanceId),
                  },
                ]
              : []
          }
        />

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

        {/* Legacy hardcoded sections (sector-gated lists that haven't been
            ported to widgets yet). Wrapped in its own card to keep visual
            grouping consistent with the original layout. */}
        {(isDashboardLoading || dashboardResponse?.data) && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
            }}
          >
            {isDashboardLoading ? (
              <HomeDashboardSkeleton />
            ) : (
              dashboardResponse?.data && (
                <HomeDashboardSection
                  data={dashboardResponse.data}
                  sector={userPrivilege}
                />
              )
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
