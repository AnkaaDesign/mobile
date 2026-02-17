import React, { useState, useMemo } from "react";
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Text,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, spacing, fontSize } from "@/constants/design-system";
import { getCurrentApiUrl } from "@/api-client/axiosClient";
import type { ImageBlock, ImageSizePreset } from "./types";

interface ImageBlockProps {
  block: ImageBlock;
}

/**
 * Converts size preset to actual pixel width
 */
function getSizeInPixels(
  size: ImageSizePreset | undefined,
  customWidth: string | undefined,
  containerWidth: number
): number {
  // If customWidth is provided, try to parse it
  if (customWidth) {
    if (customWidth.endsWith("%")) {
      const percent = parseFloat(customWidth) / 100;
      return containerWidth * percent;
    }
    if (customWidth.endsWith("px")) {
      return parseFloat(customWidth);
    }
    // Try parsing as number
    const parsed = parseFloat(customWidth);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  // If size preset is provided
  if (size) {
    if (size.endsWith("%")) {
      const percent = parseFloat(size) / 100;
      return containerWidth * percent;
    }
    if (size.endsWith("px")) {
      return parseFloat(size);
    }
  }

  // Default to 50% like web
  return containerWidth * 0.5;
}

/**
 * Renders image blocks with loading states and captions
 * Matches web behavior with size presets and alignment
 */
export function ImageBlockComponent({ block }: ImageBlockProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Support both 'src' (web standard) and 'url' properties
  // Resolve API-relative URLs (e.g. "/files/serve/...", "/uploads/...") against the API base URL
  const rawSrc = block.src || block.url;
  const imageSrc = useMemo(() => {
    if (!rawSrc) return rawSrc;
    if (rawSrc.startsWith("/")) {
      return `${getCurrentApiUrl()}${rawSrc}`;
    }
    return rawSrc;
  }, [rawSrc]);

  // Container width (screen width minus padding)
  const containerWidth = screenWidth - spacing.screenPadding * 2;

  // Calculate max width based on size preset (matching web behavior)
  const targetMaxWidth = useMemo(
    () => getSizeInPixels(block.size, block.customWidth, containerWidth),
    [block.size, block.customWidth, containerWidth]
  );

  // Ensure we don't exceed container width
  const maxWidth = Math.min(targetMaxWidth, containerWidth);

  React.useEffect(() => {
    if (imageSrc) {
      Image.getSize(
        imageSrc,
        (width, height) => {
          // Calculate aspect ratio
          const aspectRatio = width / height;

          // Use the smaller of: original width, block.width, or maxWidth
          let displayWidth = block.width || width;
          if (displayWidth > maxWidth) {
            displayWidth = maxWidth;
          }

          const displayHeight = displayWidth / aspectRatio;

          setImageSize({ width: displayWidth, height: displayHeight });
          setLoading(false);
        },
        () => {
          setError(true);
          setLoading(false);
        }
      );
    }
  }, [imageSrc, block.width, block.height, maxWidth]);

  // Get alignment style (matches web behavior)
  const getAlignmentStyle = () => {
    switch (block.alignment) {
      case "left":
        return "flex-start" as const;
      case "right":
        return "flex-end" as const;
      case "center":
      default:
        return "center" as const;
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.md,
      alignItems: getAlignmentStyle(),
      width: "100%",
    },
    imageContainer: {
      borderRadius: borderRadius.lg,
      overflow: "hidden",
      maxWidth: maxWidth,
    },
    image: {
      width: imageSize?.width || maxWidth,
      height: imageSize?.height || 200,
      resizeMode: "contain",
    },
    loadingContainer: {
      width: maxWidth,
      height: 200,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: borderRadius.lg,
    },
    errorContainer: {
      width: maxWidth,
      padding: spacing.md,
      backgroundColor: colors.destructive + "20",
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.destructive,
    },
    errorText: {
      color: colors.destructive,
      fontSize: fontSize.sm,
      textAlign: "center",
    },
    caption: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      textAlign: "center",
      paddingHorizontal: spacing.sm,
      maxWidth: maxWidth,
    },
  });

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load image{block.alt ? `: ${block.alt}` : ""}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageSrc }}
              style={styles.image}
              accessibilityLabel={block.alt}
            />
          </View>
          {block.caption && <Text style={styles.caption}>{block.caption}</Text>}
        </>
      )}
    </View>
  );
}
