import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Fake status bar — small clock + battery hints. Just a visual reassurance
 * that the user is still inside the app's chrome.
 */
export function FakeStatusBar() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        { paddingTop: Math.max(insets.top, 0), height: insets.top + 4 },
      ]}
    >
      <Text style={styles.clock}>14:32</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  clock: {
    color: "transparent",
    fontSize: 12,
  },
});
