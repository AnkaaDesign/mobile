// standard-modal.tsx
//
// THE canonical modal for the whole mobile app. It codifies the "rules" of the
// bonus rules modal (src/components/bonus/BonusRulesModal.tsx), which is the
// reference design every modal should follow:
//
//   • Native RN <Modal> with presentationStyle="pageSheet" + animationType="slide"
//     (cheap, GPU-driven, no reanimated/gesture overhead — the performant path)
//   • A centered drag indicator at the very top
//   • A structured header: optional leading icon (primary color) + title (+ optional
//     subtitle) + a rounded close button on the right
//   • A themed ScrollView body (useTheme — NEVER hardcoded colors)
//   • Safe-area aware bottom padding (footer / body respects the home indicator)
//   • Optional pinned footer for action buttons, keyboard-aware
//
// Use this instead of hand-rolling a native <Modal>, the centered ui/modal.tsx,
// ui/dialog.tsx (hardcoded colors), ui/filter-modal.tsx, etc. Those patterns are
// being retired in favor of this one.

import React from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ui/themed-text";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

type TablerIcon = React.ComponentType<{ size?: number; color?: string }>;

export interface StandardModalAction {
  label: string;
  onPress: () => void;
  /** Defaults to "default" for the last action, "outline" for the others. */
  variant?: ButtonProps["variant"];
  loading?: boolean;
  disabled?: boolean;
}

export interface StandardModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Optional leading header icon (a Tabler icon component), rendered in the primary color. */
  icon?: TablerIcon;
  /** Override the header icon color (defaults to the theme primary). */
  iconColor?: string;
  children: React.ReactNode;
  /** Convenience footer buttons, rendered left → right, each flex:1. */
  actions?: StandardModalAction[];
  /** Fully custom footer node; takes precedence over `actions`. */
  footer?: React.ReactNode;
  /** Wrap the body in a ScrollView (default true). Set false when the content
   *  scrolls itself (FlatList/SectionList) or must fill the sheet. */
  scroll?: boolean;
  /** Apply the standard body padding (20) + gap (16). Default true. */
  padded?: boolean;
  /** Extra style merged onto the scroll content / body container. */
  bodyStyle?: ViewStyle;
  /** Native sheet presentation. Default "pageSheet" — the bonus-modal rule. */
  presentationStyle?: "pageSheet" | "formSheet" | "fullScreen";
  /** Extra header control(s) rendered just left of the close button. */
  headerRight?: React.ReactNode;
  /** Hide the rounded close button (e.g. when the action is mandatory). */
  hideCloseButton?: boolean;
}

export function StandardModal({
  visible,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
  actions,
  footer,
  scroll = true,
  padded = true,
  bodyStyle,
  presentationStyle = "pageSheet",
  headerRight,
  hideCloseButton = false,
}: StandardModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const footerNode =
    footer ??
    (actions && actions.length > 0 ? (
      <View
        style={[
          styles.footer,
          {
            borderTopColor: `${colors.mutedForeground}20`,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        {actions.map((action, i) => (
          <View key={i} style={styles.footerButton}>
            <Button
              variant={action.variant ?? (i === actions.length - 1 ? "default" : "outline")}
              onPress={action.onPress}
              disabled={action.disabled}
              loading={action.loading}
            >
              {action.label}
            </Button>
          </View>
        ))}
      </View>
    ) : null);

  const hasFooter = !!footerNode;
  // Without a footer, the body itself must clear the home indicator.
  const bodyBottomInset: ViewStyle | false = !hasFooter && { paddingBottom: spacing.lg + insets.bottom };

  const body = scroll ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[padded && styles.bodyContent, bodyBottomInset, bodyStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flexBody, padded && styles.bodyContent, bodyBottomInset, bodyStyle]}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={presentationStyle}
      statusBarTranslucent={Platform.OS === "android"}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            // pageSheet is iOS-only; on Android the modal is full-screen and
            // must clear the status bar itself.
            paddingTop: Platform.OS === "android" ? insets.top : 0,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Drag indicator */}
          <View style={styles.dragIndicatorContainer}>
            <View style={[styles.dragIndicator, { backgroundColor: `${colors.mutedForeground}40` }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: `${colors.mutedForeground}20` }]}>
            <View style={styles.headerLeft}>
              {Icon && <Icon size={22} color={iconColor ?? colors.primary} />}
              <View style={styles.flex}>
                <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>{title}</ThemedText>
                {subtitle ? (
                  <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            {headerRight}
            {!hideCloseButton && (
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: `${colors.mutedForeground}18` }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <IconX size={18} color={colors.foreground} />
              </TouchableOpacity>
            )}
          </View>

          {body}
          {footerNode}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  dragIndicatorContainer: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  dragIndicator: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  closeButton: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  flexBody: { flex: 1 },
  bodyContent: { padding: 20, gap: 16 },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerButton: { flex: 1 },
});
