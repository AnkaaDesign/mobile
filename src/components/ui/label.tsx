import * as React from "react";
import { Text, TextStyle, Pressable, TextProps } from "react-native";
import { useTheme } from "@/lib/theme";

export interface LabelProps extends Omit<TextProps, "style"> {
  children?: React.ReactNode;
  style?: TextStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  numberOfLines?: number;
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
}

const Label = React.forwardRef<Text, LabelProps>(({ children, style, onPress, onLongPress, disabled, numberOfLines = 1, ellipsizeMode = "tail", ...props }, ref) => {
  const { colors } = useTheme();

  const labelStyles: TextStyle = {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 14,
    marginBottom: 6,
    color: colors.foreground,
    ...(disabled && {
      opacity: 0.7,
    }),
    ...style,
  };

  if (onPress || onLongPress) {
    return (
      <Pressable onPress={disabled ? undefined : onPress} onLongPress={disabled ? undefined : onLongPress}>
        <Text ref={ref} style={labelStyles} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode} {...props}>
          {children}
        </Text>
      </Pressable>
    );
  }

  return (
    <Text ref={ref} style={labelStyles} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode} {...props}>
      {children}
    </Text>
  );
});

Label.displayName = "Label";

export { Label };

