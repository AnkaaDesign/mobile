import React from "react";
import { Image, ImageStyle, StyleProp, StyleSheet} from "react-native";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  style?: StyleProp<ImageStyle>;
  className?: string;
}

const logoSizes = {
  sm: { width: 80, height: 32 },
  md: { width: 120, height: 48 },
  lg: { width: 160, height: 64 },
  xl: { width: 200, height: 80 },
};

export function Logo({ size = "lg", style, className }: LogoProps) {
  const dimensions = logoSizes[size as keyof typeof logoSizes];

  return (
    <Image
      source={require("@/assets/logo.png")}
      style={StyleSheet.flatten([
        dimensions,
        {
          resizeMode: "contain",
        },
        style,
      ])}
      className={className}
      accessible
      accessibilityLabel="Logo Ankaa"
    />
  );
}
