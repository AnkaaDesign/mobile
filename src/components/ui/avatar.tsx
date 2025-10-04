import * as React from "react";
import { View, Image, Text, ViewStyle, ImageStyle, TextStyle } from "react-native";

export interface AvatarProps {
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  children?: React.ReactNode;
}

export interface AvatarImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  onError?: () => void;
}

export interface AvatarFallbackProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getAvatarSize = (size: AvatarProps["size"] = "md") => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 48,
  };
  return sizes[size as keyof typeof sizes];
};

const Avatar = React.forwardRef<View, AvatarProps>(({ size = "md", style, children, ...props }, ref) => {
  const avatarSize = getAvatarSize(size);

  const avatarStyles: ViewStyle = {
    position: "relative",
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    overflow: "hidden",
    backgroundColor: "#e5e5e5",
    ...style,
  };

  return (
    <View ref={ref} style={avatarStyles} {...props}>
      {children}
    </View>
  );
});

Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<Image, AvatarImageProps>(({ source, style, onError, ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false);

  const imageStyles: ImageStyle = {
    width: "100%",
    height: "100%",
    ...style,
  };

  if (hasError) {
    return null;
  }

  return (
    <Image
      ref={ref}
      source={source}
      style={imageStyles}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
      {...props}
    />
  );
});

AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<View, AvatarFallbackProps>(({ children, style, textStyle, ...props }, ref) => {
  const fallbackStyles: ViewStyle = {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e5e5",
    ...style,
  };

  const fallbackTextStyles: TextStyle = {
    fontSize: 16,
    fontWeight: "500",
    color: "#737373",
    ...textStyle,
  };

  return (
    <View ref={ref} style={fallbackStyles} {...props}>
      {typeof children === "string" ? <Text style={fallbackTextStyles}>{children}</Text> : children}
    </View>
  );
});

AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarFallback, AvatarImage, getAvatarSize };