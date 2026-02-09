import * as React from "react";
import { View, Pressable, ViewStyle, Animated, StyleSheet } from "react-native";
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
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

// Context to share the group's state with individual items
interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined);

const useRadioGroupContext = () => {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }
  return context;
};

const RadioGroup = React.forwardRef<View, RadioGroupProps>(
  ({ value, onValueChange, disabled = false, children, style, className, ...props }, ref) => {
    const contextValue = React.useMemo(
      () => ({ value, onValueChange, disabled }),
      [value, onValueChange, disabled]
    );

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <View ref={ref} style={style} {...props}>
          {children}
        </View>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef<View, RadioGroupItemProps>(
  ({ value, disabled: itemDisabled, style, className, accessibilityLabel, accessibilityHint, testID, ...props }, ref) => {
    const { value: groupValue, onValueChange, disabled: groupDisabled } = useRadioGroupContext();
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = React.useState(false);
    const [_isPressed, _setIsPressed] = React.useState(false);

    const isChecked = groupValue === value;
    const isDisabled = groupDisabled || itemDisabled;

    // Animation values
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const innerCircleAnim = React.useRef(new Animated.Value(isChecked ? 1 : 0)).current;
    const borderAnim = React.useRef(new Animated.Value(isChecked ? 1 : 0)).current;

    // Handle checked state animation
    React.useEffect(() => {
      Animated.parallel([
        Animated.spring(innerCircleAnim, {
          toValue: isChecked ? 1 : 0,
          friction: 4,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnim, {
          toValue: isChecked ? 1 : 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }, [isChecked]);

    // Handle press animation
    const handlePressIn = () => {
      _setIsPressed(true);
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: false,
      }).start();
    };

    const handlePressOut = () => {
      _setIsPressed(false);
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }).start();
    };

    const handlePress = () => {
      if (!isDisabled && onValueChange) {
        onValueChange(value);
      }
    };

    const borderColor = borderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.border, colors.primary],
    });

    const outerCircleStyles: ViewStyle = {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      ...(isDisabled && {
        opacity: 0.5,
      }),
      ...style,
    };

    const animatedOuterCircleStyle = {
      ...outerCircleStyles,
      borderColor: isDisabled ? colors.muted : borderColor,
      transform: [{ scale: scaleAnim }],
    };

    const innerCircleStyles: ViewStyle = {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: isDisabled ? colors.muted : colors.primary,
    };

    const focusStyle: ViewStyle =
      isFocused && !isDisabled
        ? {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }
        : {};

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={isDisabled}
        accessible={true}
        accessibilityRole="radio"
        accessibilityLabel={accessibilityLabel || `Radio button for ${value}`}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ checked: isChecked, disabled: isDisabled }}
        testID={testID}
        {...props}
      >
        <Animated.View style={StyleSheet.flatten([animatedOuterCircleStyle, focusStyle])}>
          <Animated.View
            style={{
              ...innerCircleStyles,
              opacity: innerCircleAnim,
              transform: [
                {
                  scale: innerCircleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            }}
          />
        </Animated.View>
      </Pressable>
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
