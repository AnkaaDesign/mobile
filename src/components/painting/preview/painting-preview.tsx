import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ViewStyle, Image } from "react-native";
import type { Paint } from "@/types";

interface PaintPreviewProps {
  paint?: Paint;
  baseColor?: string;
  imageUrl?: string | null;
  width: number;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Get the API base URL from environment
 */
function getApiBaseUrl(): string {
  // Expo public env var
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'http://localhost:3030';
}

/**
 * Transform and encode URL for image loading
 * Handles:
 * - localhost URLs (transforms to API base URL)
 * - Special characters in paths (encoding)
 * - Relative URLs
 */
function transformImageUrl(url: string): string {
  if (!url) return url;

  // If it's already a data URL, return as-is
  if (url.startsWith('data:')) return url;

  try {
    // Parse the URL
    const urlObj = new URL(url);
    const apiBaseUrl = getApiBaseUrl();

    // Transform localhost URLs to use the API base URL
    // This handles the case where API returns localhost URLs but mobile needs IP-based URLs
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      const apiUrlObj = new URL(apiBaseUrl);
      // Keep the path but use the mobile's API host
      urlObj.protocol = apiUrlObj.protocol;
      urlObj.hostname = apiUrlObj.hostname;
      urlObj.port = apiUrlObj.port;
    }

    // Encode path segments individually (preserving slashes)
    const encodedPath = urlObj.pathname
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    // Reconstruct the URL
    return `${urlObj.origin}${encodedPath}${urlObj.search}`;
  } catch {
    // If URL parsing fails, try basic encoding
    return encodeURI(url);
  }
}

/**
 * PaintPreview component - displays paint color preview
 * Uses stored image if available, falls back to hex color
 */
export const PaintPreview: React.FC<PaintPreviewProps> = ({
  paint,
  baseColor,
  imageUrl,
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  // Track if image failed to load
  const [imageError, setImageError] = useState(false);

  // Determine the image URL and color from either paint object or direct props
  const rawImageUrl = paint?.colorPreview || imageUrl;
  const hexColor = paint?.hex || baseColor || "#808080";

  // Transform and encode the URL to handle localhost URLs and special characters
  const colorImageUrl = useMemo(() => {
    if (!rawImageUrl) return null;
    return transformImageUrl(rawImageUrl);
  }, [rawImageUrl]);

  // Handle image load error - fallback to hex color
  const handleImageError = useCallback(() => {
    console.warn('[PaintPreview] Image failed to load:', colorImageUrl);
    setImageError(true);
  }, [colorImageUrl]);

  // Reset error state when URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [colorImageUrl]);

  // If we have a stored color image and it hasn't errored, display it
  if (colorImageUrl && !imageError) {
    return (
      <View style={[styles.container, { width, height, borderRadius, overflow: "hidden" }, style]}>
        {/* Hex color background as fallback while image loads */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: hexColor }]} />
        <Image
          source={{ uri: colorImageUrl }}
          style={[StyleSheet.absoluteFill, { width, height }]}
          resizeMode="cover"
          onError={handleImageError}
        />
      </View>
    );
  }

  // Fallback: display solid hex color
  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: hexColor,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
