import * as React from "react";
import { Button, ButtonProps } from "./button";
import { impactHaptic, heavyImpactHaptic, errorHaptic } from "@/utils/haptics";

export interface HapticButtonProps extends ButtonProps {
  hapticType?: "light" | "medium" | "heavy" | "none";
  hapticOnError?: boolean;
}

/**
 * Button component with integrated haptic feedback
 *
 * @example
 * ```tsx
 * // Default medium impact haptic
 * <HapticButton onPress={handlePress}>
 *   Click Me
 * </HapticButton>
 *
 * // Heavy impact for destructive actions
 * <HapticButton variant="destructive" hapticType="heavy" onPress={handleDelete}>
 *   Delete
 * </HapticButton>
 *
 * // With error haptic feedback
 * <HapticButton
 *   onPress={async () => {
 *     try {
 *       await submitForm();
 *     } catch (error) {
 *       // Will trigger error haptic
 *       throw error;
 *     }
 *   }}
 *   hapticOnError
 * >
 *   Submit
 * </HapticButton>
 * ```
 */
export const HapticButton = React.forwardRef<any, HapticButtonProps>(({ onPress, hapticType = "medium", hapticOnError = false, variant, ...props }, ref) => {
  const handlePress = React.useCallback(async () => {
    // Provide haptic feedback based on type
    if (hapticType !== "none") {
      if (hapticType === "heavy" || variant === "destructive") {
        await heavyImpactHaptic();
      } else {
        await impactHaptic();
      }
    }

    // Execute original onPress
    if (onPress) {
      try {
        await onPress();
      } catch (error) {
        // Provide error haptic if enabled
        if (hapticOnError) {
          await errorHaptic();
        }
        throw error;
      }
    }
  }, [onPress, hapticType, hapticOnError, variant]);

  return <Button ref={ref} variant={variant} onPress={handlePress} {...props} />;
});

HapticButton.displayName = "HapticButton";
