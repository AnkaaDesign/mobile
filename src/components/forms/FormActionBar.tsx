import { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Platform, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconArrowLeft, IconArrowRight, IconCheck, IconX } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export interface FormActionBarProps {
  onCancel?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onSave?: () => void;
  isSubmitting?: boolean;
  isLoading?: boolean;
  canProceed?: boolean;
  canSubmit?: boolean;
  isSaveDisabled?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  cancelLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  showCancel?: boolean;
  style?: object;
}

export function FormActionBar({
  onCancel,
  onPrev,
  onNext,
  onSubmit,
  onSave,
  isSubmitting = false,
  isLoading = false,
  canProceed = true,
  canSubmit = true,
  isSaveDisabled = false,
  isFirstStep = true,
  isLastStep = true,
  cancelLabel = "Cancelar",
  prevLabel = "Anterior",
  nextLabel = "Próximo",
  submitLabel = "Cadastrar",
  submittingLabel = "Salvando...",
  showCancel = true,
  style,
}: FormActionBarProps) {
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

  const isDisabled = isSubmitting || isLoading;
  const isMultiStep = onPrev !== undefined || onNext !== undefined;
  const showPrev = !isFirstStep && onPrev;
  const showNext = !isLastStep && onNext;
  const showSubmit = isLastStep && (onSubmit || onSave);
  const showCancelButton = showCancel && onCancel && (isFirstStep || !isMultiStep);
  const submitHandler = onSave || onSubmit;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          marginBottom: (insets.bottom || 0) + formSpacing.cardMarginBottom,
        },
        style,
      ]}
    >
      <View style={styles.buttonWrapper}>
        {showPrev ? (
          <Button variant="outline" onPress={onPrev} disabled={isDisabled}>
            <IconArrowLeft size={18} color={colors.foreground} />
            <Text style={styles.buttonText}>{prevLabel}</Text>
          </Button>
        ) : showCancelButton ? (
          <Button variant="outline" onPress={onCancel} disabled={isDisabled}>
            <IconX size={18} color={colors.mutedForeground} />
            <Text style={styles.buttonText}>{cancelLabel}</Text>
          </Button>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.buttonWrapper}>
        {showNext ? (
          <Button variant="default" onPress={onNext} disabled={!canProceed || isDisabled}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {nextLabel}
            </Text>
            <IconArrowRight size={18} color={colors.primaryForeground} />
          </Button>
        ) : showSubmit ? (
          <Button variant="default" onPress={submitHandler} disabled={!canSubmit || isDisabled || isSaveDisabled}>
            {isDisabled ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <IconCheck size={18} color={colors.primaryForeground} />
            )}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {isDisabled ? submittingLabel : submitLabel}
            </Text>
          </Button>
        ) : (
          <View />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
    padding: formSpacing.actionBarPadding,
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    marginHorizontal: formSpacing.containerPaddingHorizontal,
    marginTop: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
