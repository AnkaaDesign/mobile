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
    const apiBaseUrl = getApiBaseUrl();

    // Simple hostname check without using URL API
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');

    if (isLocalhost) {
      // Extract the path from the URL
      const pathStart = url.indexOf('/', url.indexOf('://') + 3);
      const path = pathStart !== -1 ? url.substring(pathStart) : '/';

      // Encode path segments individually (preserving slashes)
      const encodedPath = path
        .split('/')
        .map((segment: string) => encodeURIComponent(segment))
        .join('/');

      // Reconstruct the URL with API base URL
      return `${apiBaseUrl}${encodedPath}`;
    }

    // For non-localhost URLs, just encode the path
    const urlParts = url.split('?');
    const baseUrl = urlParts[0];
    const queryString = urlParts[1] ? `?${urlParts[1]}` : '';

    // Extract protocol, host, and path
    const protocolEnd = baseUrl.indexOf('://');
    if (protocolEnd === -1) {
      // Relative URL
      return encodeURI(url);
    }

    const protocol = baseUrl.substring(0, protocolEnd + 3);
    const rest = baseUrl.substring(protocolEnd + 3);
    const pathStart = rest.indexOf('/');

    if (pathStart === -1) {
      return url; // No path, return as-is
    }

    const host = rest.substring(0, pathStart);
    const path = rest.substring(pathStart);

    // Encode path segments
    const encodedPath = path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    return `${protocol}${host}${encodedPath}${queryString}`;
  } catch {
    // If parsing fails, try basic encoding
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
