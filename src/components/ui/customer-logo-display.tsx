import { useMemo, useState } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontWeight } from "@/constants/design-system";
import { getFileUrl } from "@/utils/file";
import type { File as AnkaaFile } from "@/types";

export interface CustomerLogoDisplayProps {
  logo?: AnkaaFile | { id: string; url?: string } | null;
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
  const [imageError, setImageError] = useState(false);

  // Generate initials from customer name
  const initials = useMemo(() => {
    // Defensive check: ensure customerName exists and is not empty
    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return '??';
    }

    const words = customerName.trim().split(/\s+/);
    if (words.length >= 2 && words[0].length > 0 && words[1].length > 0) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    if (customerName.trim().length >= 2) {
      return customerName.trim().substring(0, 2).toUpperCase();
    }
    if (customerName.trim().length === 1) {
      return customerName.trim().toUpperCase();
    }
    return '??';
  }, [customerName]);

  const dimension = SIZE_DIMENSIONS[size];
  const fontSize = FONT_SIZES[size];

  // Get logo URL using the proper utility function
  const logoUri = useMemo(() => {
    if (!logo) return null;

    // If logo has a direct URL property, use it
    if ('url' in logo && logo.url) {
      return logo.url;
    }

    // If it's a full File object with id, use the getFileUrl utility
    if ('id' in logo && logo.id) {
      // Type assertion to treat it as AnkaaFile for getFileUrl
      return getFileUrl(logo as AnkaaFile);
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
      {logoUri && !imageError ? (
        <Image
          source={{ uri: logoUri }}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => {
            console.warn('Failed to load customer logo:', error.nativeEvent.error);
            setImageError(true);
          }}
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
