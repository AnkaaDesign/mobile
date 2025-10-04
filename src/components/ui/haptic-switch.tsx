import * as React from "react";
import { Switch as CustomSwitch, SwitchProps } from "./switch";
import { selectionHaptic, impactHaptic } from "@/utils/haptics";

export interface HapticSwitchProps extends SwitchProps {
  hapticEnabled?: boolean;
}

/**
 * Switch component with integrated haptic feedback
 *
 * @example
 * ```tsx
 * const [enabled, setEnabled] = useState(false);
 *
 * <HapticSwitch
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 * />
 * ```
 */
export const HapticSwitch = React.forwardRef<any, HapticSwitchProps>(({ onCheckedChange, hapticEnabled = true, ...props }, ref) => {
  const handleCheckedChange = React.useCallback(
    async (checked: boolean) => {
      if (hapticEnabled) {
        // Different haptic for on/off states
        if (checked) {
          await impactHaptic();
        } else {
          await selectionHaptic();
        }
      }

      onCheckedChange?.(checked);
    },
    [onCheckedChange, hapticEnabled],
  );

  return <CustomSwitch ref={ref} onCheckedChange={handleCheckedChange} {...props} />;
});

HapticSwitch.displayName = "HapticSwitch";
