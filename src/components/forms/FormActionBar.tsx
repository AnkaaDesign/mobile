import { useCallback, useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Platform, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconArrowLeft, IconArrowRight, IconCheck, IconX } from "@tabler/icons-react-native";
import { useFormContext, type UseFormReturn } from "react-hook-form";

import { useTheme } from "@/lib/theme";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export interface FormActionBarProps {
  onCancel?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void | Promise<void>;
  onSave?: () => void | Promise<void>;
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
  /**
   * Optional react-hook-form instance. Used to auto-reset fields on
   * cancel/submit. If omitted, falls back to `useFormContext()` so forms
   * wrapped in `<FormProvider>` are handled automatically.
   * NOTE: `FormContainer` already handles reset internally, so this prop
   * should only be used when consuming `FormActionBar` directly.
   */
  form?: UseFormReturn<any>;
  /** Extra cleanup to run alongside form reset (local state, files, etc.) */
  onReset?: () => void | Promise<void>;
  /** Reset form + run onReset when cancel is pressed. Default: true */
  resetOnCancel?: boolean;
  /** Reset form + run onReset after a successful submit. Default: true */
  resetOnSubmitSuccess?: boolean;
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
  form,
  onReset,
  resetOnCancel = true,
  resetOnSubmitSuccess = true,
}: FormActionBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  // DEBUG ref must be before any early returns (React hooks rule)
  const prevButtonStateRef = useRef<string>('');

  // Auto-detect form from <FormProvider>. useFormContext() returns null when
  // there's no provider, which is safe.
  const formContext = useFormContext();
  const activeForm = form ?? formContext ?? null;

  const performReset = useCallback(async () => {
    activeForm?.reset();
    if (onReset) {
      await onReset();
    }
  }, [activeForm, onReset]);

  const handleCancel = useCallback(async () => {
    if (!onCancel) return;
    if (resetOnCancel) {
      await performReset();
    }
    onCancel();
  }, [onCancel, resetOnCancel, performReset]);

  const handleSubmitWithReset = useCallback(
    async (handler?: () => void | Promise<void>) => {
      if (!handler) return;
      try {
        await handler();
        if (!resetOnSubmitSuccess) return;
        // When a form is available, only reset after an actually-successful
        // submit. react-hook-form's `handleSubmit(onValid)` does NOT throw on
        // validation failure — it just skips `onValid` — so a try/catch
        // alone would wipe the user's input after an invalid submit.
        // `isSubmitSuccessful` flips true only when onValid resolves cleanly.
        if (activeForm) {
          if (activeForm.formState.isSubmitSuccessful) {
            await performReset();
          }
        } else {
          await performReset();
        }
      } catch {
        // Submit threw; parent handles the error. Do not reset so the user
        // can correct values and retry.
      }
    },
    [activeForm, resetOnSubmitSuccess, performReset],
  );

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

  // DEBUG: Log button state only when it changes
  const buttonStateKey = `${canSubmit}|${isDisabled}|${isSaveDisabled}`;
  if (buttonStateKey !== prevButtonStateRef.current) {
    prevButtonStateRef.current = buttonStateKey;
    console.log('[FormActionBar DEBUG] canSubmit:', canSubmit, '| isDisabled:', isDisabled, '| isSaveDisabled:', isSaveDisabled, '| button disabled:', !canSubmit || isDisabled || isSaveDisabled);
  }

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
            <Text style={styles.buttonText} numberOfLines={1}>{prevLabel}</Text>
          </Button>
        ) : showCancelButton ? (
          <Button variant="outline" onPress={handleCancel} disabled={isDisabled}>
            <IconX size={18} color={colors.mutedForeground} />
            <Text style={styles.buttonText} numberOfLines={1}>{cancelLabel}</Text>
          </Button>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.buttonWrapper}>
        {showNext ? (
          <Button variant="default" onPress={onNext} disabled={!canProceed || isDisabled}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]} numberOfLines={1}>
              {nextLabel}
            </Text>
            <IconArrowRight size={18} color={colors.primaryForeground} />
          </Button>
        ) : showSubmit ? (
          <Button variant="default" onPress={() => {
            console.log('[FormActionBar DEBUG] Submit button PRESSED. canSubmit:', canSubmit, '| isDisabled:', isDisabled);
            handleSubmitWithReset(submitHandler);
          }} disabled={!canSubmit || isDisabled || isSaveDisabled}>
            {isDisabled ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <IconCheck size={18} color={colors.primaryForeground} />
            )}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]} numberOfLines={1}>
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
    flexShrink: 1,
  },
});
