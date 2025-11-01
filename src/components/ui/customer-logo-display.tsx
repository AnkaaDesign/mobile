import { useMemo } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontWeight } from "@/constants/design-system";

export interface CustomerLogoDisplayProps {
  logo?: { id: string; url?: string } | null;
  customerName: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "square" | "rounded";
  bordered?: boolean;
}

const SIZE_DIMENSIONS = {
  xs: 24,  // 24x24
  sm: 32,  // 32x32
  md: 40,  // 40x40
  lg: 48,  // 48x48
  xl: 64,  // 64x64
  "2xl": 96, // 96x96
};

const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  "2xl": 28,
};

export function CustomerLogoDisplay({
  logo,
  customerName,
  size = "md",
  shape = "rounded",
  bordered = true,
}: CustomerLogoDisplayProps) {
  const { colors } = useTheme();

  // Generate initials from customer name
  const initials = useMemo(() => {
    const words = customerName.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return customerName.substring(0, 2).toUpperCase();
  }, [customerName]);

  const dimension = SIZE_DIMENSIONS[size];
  const fontSize = FONT_SIZES[size];

  // Get logo URL
  const logoUri = useMemo(() => {
    if (!logo) return null;
    if (logo.url) return logo.url;
    if (logo.id) {
      // Construct URL from file ID (adjust base URL as needed)
      return `/api/files/${logo.id}/download`;
    }
    return null;
  }, [logo]);

  const containerStyle = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: shape === "circle" ? dimension / 2 : shape === "rounded" ? 6 : 0,
      borderWidth: bordered ? 1 : 0,
      borderColor: bordered ? colors.border : "transparent",
    },
  ];

  const fallbackStyle = [
    styles.fallback,
    {
      backgroundColor: colors.muted,
    },
  ];

  const initialsStyle = [
    styles.initials,
    {
      color: colors.mutedForeground,
      fontSize: fontSize,
      fontWeight: fontWeight.semibold as any,
    },
  ];

  return (
    <View style={containerStyle}>
      {logoUri ? (
        <Image
          source={{ uri: logoUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={fallbackStyle}>
          <Text style={initialsStyle}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    textAlign: "center",
  },
});
