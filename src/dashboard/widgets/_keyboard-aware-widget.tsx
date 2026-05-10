// KeyboardAvoidingView wrapper for dashboard widgets that contain TextInputs.
//
// On Android, `behavior={undefined}` (the platform-default no-op) lets the
// soft keyboard cover the input, hiding what the user is typing. The fix is
// `behavior="height"` on Android and `"padding"` on iOS. Wrapping it as a
// dedicated component keeps the per-widget call sites trivial and prevents
// the next widget author from rediscovering the Android footgun.

import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

interface KeyboardAwareWidgetProps {
  children: ReactNode;
  /** Optional vertical offset — useful when the widget body sits below a
   *  sticky header that shouldn't be pushed by the keyboard. Defaults to 0;
   *  most widgets don't need this. */
  keyboardVerticalOffset?: number;
  style?: object;
}

export function KeyboardAwareWidget({
  children,
  keyboardVerticalOffset = 0,
  style,
}: KeyboardAwareWidgetProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
