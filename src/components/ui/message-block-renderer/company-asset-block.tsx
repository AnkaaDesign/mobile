import React from "react";
import { View, Image, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import type { CompanyAssetBlock } from "./types";

interface CompanyAssetBlockComponentProps {
  block: CompanyAssetBlock;
}

const LOGO_ASSET = (() => {
  try {
    return require("../../../../assets/logo.png");
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

const MAX_HEIGHT = 60;
// Wrapper in index.tsx adds paddingHorizontal: 14 on each side = 28px total
const WRAPPER_PADDING = 28;

export function CompanyAssetBlockComponent({ block }: CompanyAssetBlockComponentProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const assetSource = block.asset === "logo" ? LOGO_ASSET : ICON_ASSET;

  const justifyContent =
    block.alignment === "center"
      ? "center"
      : block.alignment === "right"
      ? "flex-end"
      : "flex-start";

  if (!assetSource) {
    return (
      <View style={[styles.container, { justifyContent }]}>
        <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>
          {block.asset === "logo" ? "[Logo]" : "[Icon]"}
        </Text>
      </View>
    );
  }

  // Resolve asset dimensions to compute explicit pixel-based layout
  const asset = Image.resolveAssetSource(assetSource);
  const aspectRatio = asset.width / asset.height;

  const sizePercent = parseFloat(block.size ?? "75") / 100;
  const availableWidth = screenWidth - spacing.screenPadding * 2 - WRAPPER_PADDING;
  const maxWidth = availableWidth * sizePercent;

  let displayWidth = maxWidth;
  let displayHeight = displayWidth / aspectRatio;
  if (displayHeight > MAX_HEIGHT) {
    displayHeight = MAX_HEIGHT;
    displayWidth = displayHeight * aspectRatio;
  }

  return (
    <View style={[styles.container, { justifyContent }]}>
      <Image
        source={assetSource}
        style={{ width: displayWidth, height: displayHeight }}
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
  placeholder: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
