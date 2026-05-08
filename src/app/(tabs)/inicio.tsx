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
import { useState, useEffect, useCallback } from "react";
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
import { useDashboardLayout, DashboardList } from "@/dashboard";
import { AddWidgetSheet } from "@/dashboard/components/add-widget-sheet";
import { IconPlus } from "@tabler/icons-react-native";

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
  } = useDashboardLayout();
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Tutorial spotlights for the widget-first home.
  const greetingTarget = useTutorialTarget(TUTORIAL_TARGETS.homeGreeting);
  const widgetListTarget = useTutorialTarget(TUTORIAL_TARGETS.homeWidgetList);
  const editButtonTarget = useTutorialTarget(TUTORIAL_TARGETS.homeEditPanelButton);
  const editToolbarTarget = useTutorialTarget(TUTORIAL_TARGETS.homeEditToolbar);
  const addWidgetTarget = useTutorialTarget(TUTORIAL_TARGETS.homeAddWidgetButton);
  const cancelEditTarget = useTutorialTarget(TUTORIAL_TARGETS.homeCancelEditButton);
  const saveEditTarget = useTutorialTarget(TUTORIAL_TARGETS.homeSaveEditButton);

  const tutorial = useOptionalTutorial();
  const tutorialStepId = tutorial?.currentStep?.id;
  const tutorialActive = tutorial?.isActive ?? false;

  // Tutorial flow management for the widget walkthrough:
  //  - "home-edit-toolbar" / "home-add-widget" / "home-widget-catalog" / "home-cancel-edit"
  //    require edit mode to be on and (where relevant) the catalog sheet to be open.
  //  - When the tutorial leaves these steps, restore clean state.
  useEffect(() => {
    if (!tutorialActive) {
      // Tutorial ended — make sure we don't leave the user stranded in edit mode.
      if (isEditing) {
        discardAndExit();
      }
      if (addSheetOpen) {
        setAddSheetOpen(false);
      }
      return;
    }
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
        {/* Greeting + edit-painel toggle. We keep the greeting at the top of
            its own card; the widget list below uses individual card chrome
            per tile. */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            gap: 12,
          }}
        >
          <View
            ref={greetingTarget.ref}
            onLayout={greetingTarget.onLayout}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
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
            <Text style={{ fontSize: 14, color: colors.foreground }}>
              {currentTime.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Text>
          </View>

          {/* Edit-mode toolbar. Shown as a small button row beneath the
              greeting so users can discover it without entering edit mode by
              accident (no long-press confusion). */}
          {!isEditing ? (
            <View ref={editButtonTarget.ref} onLayout={editButtonTarget.onLayout} style={{ alignSelf: "flex-start" }}>
              <Pressable
                onPress={() => {
                  editButtonTarget.onPress();
                  enterEdit();
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: colors.muted,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Icon name="settings" size="sm" color={colors.mutedForeground} />
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  Editar painel
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              ref={editToolbarTarget.ref}
              onLayout={editToolbarTarget.onLayout}
              style={{ flexDirection: "row", gap: 8 }}
            >
              <View ref={cancelEditTarget.ref} onLayout={cancelEditTarget.onLayout} style={{ flex: 1 }}>
                <Pressable
                  disabled={isSaving}
                  onPress={() => {
                    cancelEditTarget.onPress();
                    discardAndExit();
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    Cancelar
                  </Text>
                </Pressable>
              </View>
              <View ref={saveEditTarget.ref} onLayout={saveEditTarget.onLayout} style={{ flex: 1 }}>
                <Pressable
                  disabled={isSaving || !isDirty}
                  onPress={() => {
                    saveEditTarget.onPress();
                    saveAndExit().catch(() => {
                      // toast wrapper is a Phase 4 deliverable; for now swallow.
                    });
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    opacity: pressed || !isDirty || isSaving ? 0.5 : 1,
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  })}
                >
                  {isSaving && <ActivityIndicator size="small" color="#fff" />}
                  <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.primaryForeground,
                  }}
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </Text>
              </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* New widget system — renders the user's current layout (which is
            the sector preset on first run). */}
        <View ref={widgetListTarget.ref} onLayout={widgetListTarget.onLayout}>
          <DashboardList
            items={layout.items}
            isEditing={isEditing}
            onRemove={removeWidget}
            onReorder={reorderItems}
          />
        </View>

        {/* In-edit-mode "+" tile to open the add-widget sheet. */}
        {isEditing && (
          <View ref={addWidgetTarget.ref} onLayout={addWidgetTarget.onLayout}>
            <Pressable
              onPress={() => {
                addWidgetTarget.onPress();
                setAddSheetOpen(true);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: colors.border,
                backgroundColor: pressed ? colors.muted : "transparent",
              })}
            >
              <IconPlus size={18} color={colors.mutedForeground} />
              <Text style={{ fontSize: 13, color: colors.mutedForeground, fontWeight: "600" }}>
                Adicionar widget
              </Text>
            </Pressable>
          </View>
        )}

        <AddWidgetSheet
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          onAdd={(widgetId) => addWidget(widgetId)}
        />

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
