import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Platform, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconCheck, IconX } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

/**
 * SimpleFormActionBar
 *
 * A standardized action bar for single-step forms (non-multi-step).
 * Provides consistent Cancel and Submit button layout across all forms.
 *
 * Features:
 * - Consistent button positioning (Cancel left, Submit right)
 * - Loading state with spinner
 * - Disabled state management
 * - Matches web form patterns
 *
 * Usage:
 * ```tsx
 * <SimpleFormActionBar
 *   onCancel={() => router.back()}
 *   onSubmit={handleSubmit}
 *   isSubmitting={mutation.isPending}
 *   canSubmit={form.formState.isValid}
 * />
 * ```
 */

export interface SimpleFormActionBarProps {
  /** Called when cancel button is pressed */
  onCancel: () => void;
  /** Called when submit button is pressed */
  onSubmit: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Whether the form can be submitted */
  canSubmit?: boolean;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Label for the submit button */
  submitLabel?: string;
  /** Label shown while submitting */
  submittingLabel?: string;
  /** Whether to show the cancel button */
  showCancel?: boolean;
  /** Additional style for the container */
  style?: object;
}

export function SimpleFormActionBar({
  onCancel,
  onSubmit,
  isSubmitting = false,
  canSubmit = true,
  cancelLabel = "Cancelar",
  submitLabel = "Cadastrar",
  submittingLabel = "Salvando...",
  showCancel = true,
  style,
}: SimpleFormActionBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  if (isKeyboardVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          marginBottom: (insets.bottom || 0) + formSpacing.cardMarginBottom, // 16px + safe area
        },
        style,
      ]}
    >
      {showCancel && (
        <View style={styles.buttonWrapper}>
          <Button
            variant="outline"
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <IconX size={18} color={colors.mutedForeground} />
            <Text style={styles.buttonText}>{cancelLabel}</Text>
          </Button>
        </View>
      )}

      <View style={styles.buttonWrapper}>
        <Button
          variant="default"
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <IconCheck size={18} color={colors.primaryForeground} />
          )}
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: formSpacing.rowGap, // 8px
    padding: formSpacing.actionBarPadding, // 16px - equal padding all sides
    borderRadius: formLayout.cardBorderRadius, // 12px - match form cards
    borderWidth: formLayout.borderWidth, // 1px - match form cards
    marginHorizontal: formSpacing.containerPaddingHorizontal, // 16px - inset from edges to match form cards
    marginTop: spacing.md, // 16px
    // marginBottom is set dynamically with safe area inset
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default SimpleFormActionBar;
