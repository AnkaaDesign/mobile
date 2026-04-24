import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import type { CompanyAssetBlock } from "./types";

interface CompanyAssetBlockComponentProps {
  block: CompanyAssetBlock;
}

// Attempt to load known mobile assets; fall back to a text placeholder.
// The web uses /logo.png (logo) and /android-chrome-192x192.png (icon).
// Mobile equivalents: assets/icon.png for icon, assets/icon-1024.png for logo.
const LOGO_ASSET = (() => {
  try {
    return require("../../../../assets/icon-1024.png");
  } catch {
    return null;
  }
})();

const ICON_ASSET = (() => {
  try {
    return require("../../../../assets/icon.png");
  } catch {
    return null;
  }
})();

export function CompanyAssetBlockComponent({ block }: CompanyAssetBlockComponentProps) {
  const { colors } = useTheme();

  const assetSource = block.asset === "logo" ? LOGO_ASSET : ICON_ASSET;

  // Determine flex alignment from block.alignment
  const justifyContent =
    block.alignment === "center"
      ? "center"
      : block.alignment === "right"
      ? "flex-end"
      : "flex-start";

  // Determine max width from block.size (e.g. '75%' → 0.75)
  const parseSize = (size?: string): string => {
    if (!size) return "75%";
    return size;
  };

  if (!assetSource) {
    return (
      <View style={[styles.placeholderContainer, { justifyContent }]}>
        <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>
          {block.asset === "logo" ? "[Logo]" : "[Icon]"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { justifyContent }]}>
      <Image
        source={assetSource}
        style={[styles.image, { maxWidth: parseSize(block.size) as any }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
  },
  image: {
    width: "100%",
    height: 80,
  },
  placeholderContainer: {
    flexDirection: "row",
    width: "100%",
  },
  placeholder: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
