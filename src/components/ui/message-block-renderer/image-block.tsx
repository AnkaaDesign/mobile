import React, { useState } from "react";
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
import type { ImageBlock } from "./types";

interface ImageBlockProps {
  block: ImageBlock;
}

/**
 * Renders image blocks with loading states and captions
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

  const maxWidth = screenWidth - spacing.screenPadding * 2;

  React.useEffect(() => {
    if (block.url) {
      Image.getSize(
        block.url,
        (width, height) => {
          // Calculate aspect ratio and fit to screen width
          const aspectRatio = width / height;
          let displayWidth = block.width || width;
          let displayHeight = block.height || height;

          if (displayWidth > maxWidth) {
            displayWidth = maxWidth;
            displayHeight = displayWidth / aspectRatio;
          }

          setImageSize({ width: displayWidth, height: displayHeight });
          setLoading(false);
        },
        () => {
          setError(true);
          setLoading(false);
        }
      );
    }
  }, [block.url, block.width, block.height, maxWidth]);

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.md,
      alignItems: "center",
    },
    imageContainer: {
      borderRadius: borderRadius.lg,
      overflow: "hidden",
      backgroundColor: colors.muted,
    },
    image: {
      width: imageSize?.width || maxWidth,
      height: imageSize?.height || 200,
      resizeMode: "cover",
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
              source={{ uri: block.url }}
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
