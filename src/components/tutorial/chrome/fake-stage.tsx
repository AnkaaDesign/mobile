/**
 * Tutorial Stage — modal host above the real app.
 *
 * Layout matches the real Ankaa chrome:
 *   ┌─────────────────────────────┐
 *   │ FakeStatusBar              │  (safe-area passthrough)
 *   │ FakeHeader (←  title  🔔☰) │  hamburger on the right
 *   ├─────────────────────────────┤
 *   │  Scene body                │  fills the rest of the screen
 *   │                            │  NO bottom tab bar (real app
 *   │                            │  uses a right drawer for nav)
 *   └─────────────────────────────┘
 *
 * Spotlight + tooltip + dev picker sit on top. The right drawer slides in
 * from the right edge when `sceneState.drawer ∈ {"menu", "notifications"}`.
 */
import { useCallback } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { useTutorialStore } from "../engine-store";
import { useTutorial } from "../provider";
import { SCENES, SCENE_HEADER } from "../scenes";
import { FakeStatusBar } from "./fake-status-bar";
import { FakeHeader } from "./fake-header";
import { FakeDrawer } from "./fake-drawer";
import { SlotProvider } from "./slot-context";
import { TutorialSpotlight } from "../overlay/spotlight";
import { TutorialTooltip } from "../overlay/tooltip";
import { TutorialDevPicker } from "../overlay/dev-picker";

export function TutorialStage() {
  const isActive = useTutorialStore((s) => s.isActive);
  if (!isActive) return null;
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={() => {}}
    >
      <ThemeProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SlotProvider>
              <StageBody />
            </SlotProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ThemeProvider>
    </Modal>
  );
}

function StageBody() {
  const { colors } = useTheme();
  const currentStep = useTutorialStore(
    (s) => s.steps[s.currentStepIndex] ?? null,
  );
  const sceneState = useTutorialStore((s) => s.activeSceneState);
  const { notifyAction } = useTutorial();

  const sceneId = currentStep?.scene ?? "home";
  const SceneComponent = SCENES[sceneId];
  const headerConfig = SCENE_HEADER[sceneId];

  const handleTap = useCallback(() => notifyAction("tap"), [notifyAction]);
  const drawerMode = sceneState.drawer;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FakeStatusBar />
      <FakeHeader
        title={headerConfig.title}
        showBack={headerConfig.showBack}
        onBack={handleTap}
        onOpenDrawer={handleTap}
        onOpenNotifications={handleTap}
      />
      <View style={{ flex: 1 }}>
        {SceneComponent ? <SceneComponent state={sceneState} /> : null}
      </View>

      {drawerMode && drawerMode !== "closed" ? (
        <FakeDrawer mode={drawerMode} onCloseBackdrop={handleTap} />
      ) : null}

      <TutorialSpotlight />
      <TutorialTooltip />
      <TutorialDevPicker />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
