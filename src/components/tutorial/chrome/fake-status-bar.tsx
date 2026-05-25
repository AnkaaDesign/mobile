import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontSize } from "@/constants/design-system";

/**
 * Fake status bar — small clock + battery hints. Just a visual reassurance
 * that the user is still inside the app's chrome.
 *
 * Rendered as an absolute overlay over the top safe-area region so it does NOT
 * reserve layout height. The FakeHeader already owns the top inset (its card
 * background extends behind the status bar, matching the real React Navigation
 * header); reserving the inset here too would double the top spacing and make
 * the chrome look taller than the real app.
 */
export function FakeStatusBar() {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        { paddingTop: Math.max(insets.top, 0), height: Math.max(insets.top, 0) },
      ]}
    >
      <Text style={styles.clock}>14:32</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  clock: {
    color: "transparent",
    fontSize: fontSize.xs,
  },
});
