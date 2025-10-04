import { useCallback } from "react";
import { selectionHaptic, impactHaptic, successHaptic, errorHaptic, warningHaptic, customHapticPattern, hapticPatterns } from "@/utils/haptics";

/**
 * Hook for form interactions with haptic feedback
 *
 * @example
 * ```tsx
 * const hapticForm = useHapticForm();
 * const form = useForm({
 *   resolver: zodResolver(schema),
 * });
 *
 * const onSubmit = async (data) => {
 *   hapticForm.handleSubmitStart();
 *
 *   try {
 *     await submitData(data);
 *     hapticForm.handleSubmitSuccess();
 *   } catch (error) {
 *     hapticForm.handleSubmitError();
 *   }
 * };
 *
 * <TextInput
 *   onFocus={hapticForm.handleFieldFocus}
 *   onBlur={(e) => {
 *     const hasError = form.formState.errors.fieldName;
 *     hapticForm.handleFieldBlur(hasError);
 *   }}
 * />
 * ```
 */
export function useHapticForm() {
  const handleFieldFocus = useCallback(async () => {
    await selectionHaptic();
  }, []);

  const handleFieldBlur = useCallback(async (hasError: boolean) => {
    if (hasError) {
      await warningHaptic();
    }
  }, []);

  const handleFieldChange = useCallback(async (isValid: boolean) => {
    if (isValid) {
      await selectionHaptic();
    }
  }, []);

  const handleCheckboxToggle = useCallback(async () => {
    await selectionHaptic();
  }, []);

  const handleRadioSelect = useCallback(async () => {
    await selectionHaptic();
  }, []);

  const handleSwitchToggle = useCallback(async (value: boolean) => {
    if (value) {
      await impactHaptic();
    } else {
      await selectionHaptic();
    }
  }, []);

  const handleSliderChange = useCallback(async (value: number, min: number, max: number) => {
    // Haptic at boundaries
    if (value === min || value === max) {
      await impactHaptic();
    }
  }, []);

  const handleDatePickerChange = useCallback(async () => {
    await selectionHaptic();
  }, []);

  const handleDropdownOpen = useCallback(async () => {
    await selectionHaptic();
  }, []);

  const handleDropdownSelect = useCallback(async () => {
    await impactHaptic();
  }, []);

  const handleValidationError = useCallback(async (fieldCount: number) => {
    if (fieldCount === 1) {
      await warningHaptic();
    } else if (fieldCount > 1) {
      // Multiple errors pattern
      await customHapticPattern(hapticPatterns.doubleLight);
    }
  }, []);

  const handleSubmitStart = useCallback(async () => {
    await impactHaptic();
  }, []);

  const handleSubmitSuccess = useCallback(async () => {
    await successHaptic();
  }, []);

  const handleSubmitError = useCallback(async () => {
    await errorHaptic();
  }, []);

  const handleStepChange = useCallback(async (direction: "forward" | "backward") => {
    if (direction === "forward") {
      await impactHaptic();
    } else {
      await selectionHaptic();
    }
  }, []);

  const handleFormReset = useCallback(async () => {
    await customHapticPattern(hapticPatterns.tripleLight);
  }, []);

  return {
    handleFieldFocus,
    handleFieldBlur,
    handleFieldChange,
    handleCheckboxToggle,
    handleRadioSelect,
    handleSwitchToggle,
    handleSliderChange,
    handleDatePickerChange,
    handleDropdownOpen,
    handleDropdownSelect,
    handleValidationError,
    handleSubmitStart,
    handleSubmitSuccess,
    handleSubmitError,
    handleStepChange,
    handleFormReset,
  };
}
