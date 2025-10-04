import * as React from "react";
import { Text, TextStyle, Pressable, TextProps } from "react-native";
import { useTheme } from "@/lib/theme";

export interface LabelProps extends Omit<TextProps, "style"> {
  children?: React.ReactNode;
  style?: TextStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

const Label = React.forwardRef<Text, LabelProps>(({ children, style, onPress, onLongPress, disabled, ...props }, ref) => {
  const { colors } = useTheme();

  const labelStyles: TextStyle = {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 14,
    color: colors.foreground,
    ...(disabled && {
      opacity: 0.7,
    }),
    ...style,
  };

  if (onPress || onLongPress) {
    return (
      <Pressable onPress={disabled ? undefined : onPress} onLongPress={disabled ? undefined : onLongPress}>
        <Text ref={ref} style={labelStyles} {...props}>
          {children}
        </Text>
      </Pressable>
    );
  }

  return (
    <Text ref={ref} style={labelStyles} {...props}>
      {children}
    </Text>
  );
});

Label.displayName = "Label";

export { Label };

