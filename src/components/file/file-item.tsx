import React, { useState} from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, NativeSyntheticEvent, ImageErrorEventData } from "react-native";
import type { File as AnkaaFile } from "../../types";
import { formatFileSize, isImageFile } from "@/utils/file-utils";
import { formatRelativeTime } from "@/utils";
import { useTheme } from "@/lib/theme";
import { FileTypeIcon } from "@/components/ui/file-type-icon";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { getCurrentApiUrl } from "@/api-client";

export type FileViewMode = "grid" | "list";

export interface FileItemProps {
  file: AnkaaFile;
  viewMode?: FileViewMode;
  onPress?: (file: AnkaaFile) => void;
  onDownload?: (file: AnkaaFile) => void;
  onDelete?: (file: AnkaaFile) => void;
  showFilename?: boolean;
  showFileSize?: boolean;
  showRelativeTime?: boolean;
  baseUrl?: string;
}

const getThumbnailUrl = (file: AnkaaFile, size: "small" | "medium" | "large" = "medium", baseUrl?: string): string => {
  const apiUrl = baseUrl || getCurrentApiUrl();

  console.log('🔍 [getThumbnailUrl] Called with:', {
    filename: file.filename,
    baseUrl,
    apiUrl,
    fileThumbnailUrl: file.thumbnailUrl
  });

  // If file has thumbnailUrl property
  if (file.thumbnailUrl) {
    // If already a complete URL, replace localhost with correct API URL and ensure size parameter
    if (file.thumbnailUrl.startsWith("http://") || file.thumbnailUrl.startsWith("https://")) {
      // Extract the path from the URL using string manipulation (React Native URL may not have pathname)
      const urlWithoutProtocol = file.thumbnailUrl.replace(/^https?:\/\//, '');
      const pathStartIndex = urlWithoutProtocol.indexOf('/');
      const pathWithQuery = pathStartIndex >= 0 ? urlWithoutProtocol.substring(pathStartIndex) : '/';
      const pathname = pathWithQuery.split('?')[0];
      // Always add or update the size parameter
      const correctedUrl = `${apiUrl}${pathname}?size=${size}`;
      console.log('🔍 [FileItem] Corrected thumbnailUrl with size:', {
        original: file.thumbnailUrl,
        corrected: correctedUrl,
        size: size
      });
      return correctedUrl;
    }
    // Otherwise construct URL - NOTE: No /api prefix!
    const url = `${apiUrl}/files/thumbnail/${file.id}?size=${size}`;
    console.log('🔍 [FileItem] Constructed thumbnail URL:', { filename: file.filename, url });
    return url;
  }

  // For images without thumbnails, use the serve endpoint
  if (isImageFile(file)) {
    const url = `${apiUrl}/files/serve/${file.id}`;
    console.log('🔍 [FileItem] Using serve URL for image:', { filename: file.filename, url });
    return url;
  }

  console.log('⚠️ [FileItem] No thumbnail URL for file:', { filename: file.filename, mimetype: file.mimetype });
  return "";
};

const FileItemGrid: React.FC<FileItemProps> = ({
  file,
  onPress,
  showFilename = true,
  showFileSize = true,
  baseUrl,
}) => {
  const { colors } = useTheme();
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  const hasThumbnail = !!getThumbnailUrl(file, "medium", baseUrl);

  const handlePress = () => {
    if (onPress) {
      onPress(file);
    }
  };

  const thumbnailUrl = getThumbnailUrl(file, "medium", baseUrl);

  const handleThumbnailLoad = () => {
    console.log('✅ [FileItemGrid] Thumbnail loaded:', file.filename);
    setThumbnailLoading(false);
  };

  const handleThumbnailError = (error: NativeSyntheticEvent<ImageErrorEventData>) => {
    console.error('❌ [FileItemGrid] Thumbnail failed:', {
      filename: file.filename,
      url: thumbnailUrl,
      error: error.nativeEvent
    });
    setThumbnailError(true);
    setThumbnailLoading(false);
  };

  // Debug: Log render state
  console.log('🔍 [FileItemGrid] Render state:', {
    filename: file.filename,
    hasThumbnail,
    thumbnailUrl,
    thumbnailError,
    thumbnailLoading,
  });

  return (
    <TouchableOpacity
      style={[styles.gridContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Thumbnail/Icon Area */}
      <View style={[styles.gridThumbnailContainer, { backgroundColor: colors.muted + "20" }]}>
        {hasThumbnail && !thumbnailError ? (
          <View style={styles.thumbnailWrapper}>
            <Image
              key={`thumbnail-${file.id}-${thumbnailUrl}`}
              source={{
                uri: thumbnailUrl,
                cache: 'reload'
              }}
              style={styles.thumbnailImage}
              onLoad={handleThumbnailLoad}
              onError={handleThumbnailError}
              onLoadStart={() => {
                console.log('🔄 [FileItemGrid] Thumbnail load started:', file.filename);
              }}
              resizeMode="cover"
            />
            {thumbnailLoading && (
              <View style={[styles.thumbnailLoadingOverlay, { backgroundColor: colors.muted + "40" }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.iconContainer}>
            <FileTypeIcon filename={file.filename} mimeType={file.mimetype} size="lg" />
          </View>
        )}
      </View>

      {/* File Info Overlay */}
      {(showFilename || showFileSize) && (
        <View style={[styles.gridOverlay, { backgroundColor: colors.background + "F0" }]}>
          {showFilename && (
            <Text
              style={[styles.gridFilename, { color: colors.foreground }]}
              numberOfLines={2}
              ellipsizeMode="middle"
            >
              {file.filename}
            </Text>
          )}
          {showFileSize && (
            <Text style={[styles.gridFileSize, { color: colors.mutedForeground }]}>
              {formatFileSize(file.size)}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const FileItemList: React.FC<FileItemProps> = ({
  file,
  onPress,
  showFilename = true,
  showFileSize = true,
  showRelativeTime = true,
  baseUrl,
}) => {
  const { colors } = useTheme();
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  const hasThumbnail = !!getThumbnailUrl(file, "small", baseUrl);

  const handlePress = () => {
    if (onPress) {
      onPress(file);
    }
  };

  const thumbnailUrl = getThumbnailUrl(file, "small", baseUrl);

  const handleThumbnailLoad = () => {
    console.log('✅ [FileItemList] Thumbnail loaded:', file.filename);
    setThumbnailLoading(false);
  };

  const handleThumbnailError = (error: NativeSyntheticEvent<ImageErrorEventData>) => {
    console.error('❌ [FileItemList] Thumbnail failed:', {
      filename: file.filename,
      url: thumbnailUrl,
      error: error.nativeEvent
    });
    setThumbnailError(true);
    setThumbnailLoading(false);
  };

  // Debug: Log render state
  console.log('🔍 [FileItemList] Render state:', {
    filename: file.filename,
    hasThumbnail,
    thumbnailUrl,
    thumbnailError,
    thumbnailLoading,
  });

  return (
    <TouchableOpacity
      style={[styles.listContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Thumbnail/Icon */}
      <View style={[styles.listThumbnailContainer, { backgroundColor: colors.muted + "20" }]}>
        {hasThumbnail && !thumbnailError ? (
          <View style={styles.listThumbnailWrapper}>
            <Image
              key={`thumbnail-${file.id}-${thumbnailUrl}`}
              source={{
                uri: thumbnailUrl,
                cache: 'reload'
              }}
              style={styles.listThumbnailImage}
              onLoad={handleThumbnailLoad}
              onError={handleThumbnailError}
              onLoadStart={() => {
                console.log('🔄 [FileItemList] Thumbnail load started:', file.filename);
              }}
              resizeMode="cover"
            />
            {thumbnailLoading && (
              <View style={[styles.thumbnailLoadingOverlay, { backgroundColor: colors.muted + "40" }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>
        ) : (
          <FileTypeIcon filename={file.filename} mimeType={file.mimetype} size="md" />
        )}
      </View>

      {/* File Info */}
      <View style={styles.listFileInfo}>
        {showFilename && (
          <Text
            style={[styles.listFilename, { color: colors.foreground }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {file.filename}
          </Text>
        )}
        {(showFileSize || showRelativeTime) && (
          <View style={styles.listMetadata}>
            {showFileSize && (
              <Text style={[styles.listMetadataText, { color: colors.mutedForeground }]}>
                {formatFileSize(file.size)}
              </Text>
            )}
            {showFileSize && showRelativeTime && file.createdAt && (
              <Text style={[styles.listMetadataText, { color: colors.mutedForeground }]}>
                {" • "}
              </Text>
            )}
            {showRelativeTime && file.createdAt && (
              <Text style={[styles.listMetadataText, { color: colors.mutedForeground }]}>
                {formatRelativeTime(file.createdAt)}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const FileItem: React.FC<FileItemProps> = ({ viewMode = "grid", ...props }) => {
  if (viewMode === "list") {
    return <FileItemList {...props} />;
  }

  return <FileItemGrid {...props} />;
};

const styles = StyleSheet.create({
  // Grid styles
  gridContainer: {
    width: 120,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  gridThumbnailContainer: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  thumbnailLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gridOverlay: {
    padding: spacing.sm,
  },
  gridFilename: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  gridFileSize: {
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: 2,
  },

  // List styles
  listContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  listThumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  listThumbnailWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  listThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  listFileInfo: {
    flex: 1,
    minWidth: 0,
  },
  listFilename: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  listMetadata: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  listMetadataText: {
    fontSize: fontSize.xs,
  },
});

export default FileItem;
