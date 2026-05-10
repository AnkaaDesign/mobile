// Drop-in Pressable wrapper that emits haptics on press / long-press.
//
// Why a wrapper instead of "every widget calls selectionHaptic in its
// onPress":
//   1. Easier to grep — `HapticPressable` is unambiguous; `selectionHaptic()`
//      could live anywhere.
//   2. Forgetful authors get haptics for free; explicit-on-press required
//      every onPress to remember.
//   3. The hook respects user settings (cachedSettings.enabled) — if a user
//      turns haptics off, the wrapper still fires the onPress callback but
//      skips the haptic transparently.
//
// API matches React Native's Pressable so existing call sites can swap
// `Pressable` → `HapticPressable` without touching props.

import { type ComponentProps } from "react";
import { Pressable } from "react-native";
import { selectionHaptic, longPressHaptic } from "@/utils/haptics";

type PressableProps = ComponentProps<typeof Pressable>;

interface HapticPressableProps extends PressableProps {
  /** Override the default haptic feel for press — defaults to "selection".
   *  Pass `"none"` to suppress haptics on press while still keeping
   *  long-press haptics. */
  pressHaptic?: "selection" | "none";
  /** Override the default haptic feel for long-press — defaults to
   *  "longPress". Pass `"none"` to suppress. */
  longPressFeedback?: "longPress" | "none";
}

export function HapticPressable({
  onPress,
  onLongPress,
  pressHaptic = "selection",
  longPressFeedback = "longPress",
  ...rest
}: HapticPressableProps) {
  return (
    <Pressable
      {...rest}
      onPress={
        onPress
          ? (e) => {
              if (pressHaptic === "selection") selectionHaptic();
              onPress(e);
            }
          : undefined
      }
      onLongPress={
        onLongPress
          ? (e) => {
              if (longPressFeedback === "longPress") longPressHaptic();
              onLongPress(e);
            }
          : undefined
      }
    />
  );
}
