import * as React from "react";
import { View, Pressable, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export interface RadioGroupItemProps {
  value: string;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
}

const RadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}>({});

const RadioGroup = React.forwardRef<View, RadioGroupProps>(({ value, onValueChange, disabled = false, children, style, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <View
        ref={ref}
        style={{
          gap: 12,
          ...style,
        }}
        {...props}
      >
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef<View, RadioGroupItemProps>(({ value, disabled = false, style, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext);
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = React.useState(false);

  const isChecked = context.value === value;
  const isDisabled = disabled || context.disabled;

  const itemStyles: ViewStyle = {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: isChecked ? colors.primary : colors.mutedForeground,
    backgroundColor: isChecked ? colors.primary : colors.card,
    alignItems: "center",
    justifyContent: "center",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    ...(isPressed &&
      !isDisabled && {
        transform: [{ scale: 0.95 }],
      }),
    ...(isDisabled && {
      opacity: 0.5,
      borderColor: colors.mutedForeground,
      backgroundColor: colors.muted,
    }),
    ...style,
  };

  const indicatorStyles: ViewStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.card,
  };

  return (
    <Pressable
      ref={ref}
      onPress={isDisabled ? undefined : () => context.onValueChange?.(value)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={itemStyles}
      accessible={true}
      accessibilityRole="radio"
      accessibilityState={{
        checked: isChecked,
        disabled: isDisabled,
      }}
      {...props}
    >
      {isChecked && <View style={indicatorStyles} />}
    </Pressable>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem, RadioGroupContext };