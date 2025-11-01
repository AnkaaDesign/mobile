import React from "react";
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { cn } from "@/lib/utils";
import { getFileTypeInfo, getFileTypeCategory, FileCategory, getCategoryLabel, type FileCategory as _FileCategoryType } from '../../utils/file-type-icons';

// Tabler Icons React Native imports
import {
  // Documents
  IconFileTypePdf,
  IconFileText,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconFileTypePpt,

  // Images
  IconPhoto,
  IconVectorBezier,
  IconIcons,
  IconCamera,

  // Video
  IconVideo,
  IconDeviceTv,
  IconBrandYoutube,

  // Audio
  IconMusic,
  IconMicrophone,
  IconWaveSquare,

  // Code
  IconBrandJavascript,
  IconBrandTypescript,
  IconBrandHtml5,
  IconBrandCss3,
  IconBrandPython,
  IconCoffee,
  IconBraces,
  IconCode,
  IconFileCode,

  // Archives
  IconFileZip,
  IconArchive,
  IconPackage,

  // CAD & 3D
  IconRuler2,
  IconBox,
  IconDimensions,

  // Special
  IconTypography,
  IconDatabase,
  IconBinary,
  IconFile,
  IconLoader,
  IconAlertCircle,
} from "@tabler/icons-react-native";

// Map of icon names to components
const ICON_COMPONENTS = {
  IconFileTypePdf,
  IconFileText,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconFileTypePpt,
  IconPhoto,
  IconVectorBezier,
  IconIcons,
  IconCamera,
  IconVideo,
  IconDeviceTv,
  IconBrandYoutube,
  IconMusic,
  IconMicrophone,
  IconWaveSquare,
  IconBrandJavascript,
  IconBrandTypescript,
  IconBrandHtml5,
  IconBrandCss3,
  IconBrandPython,
  IconCoffee,
  IconBraces,
  IconCode,
  IconFileCode,
  IconFileZip,
  IconArchive,
  IconPackage,
  IconRuler2,
  IconBox,
  IconDimensions,
  IconTypography,
  IconDatabase,
  IconBinary,
  IconFile,
  IconLoader,
  IconAlertCircle,
} as const;

export type FileTypeIconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface FileTypeIconProps {
  /** File name with extension */
  filename: string;
  /** File MIME type (optional, fallback for detection) */
  mimeType?: string;
  /** Icon size */
  size?: FileTypeIconSize;
  /** Custom style */
  style?: ViewStyle;
  /** Show file type label */
  showLabel?: boolean;
  /** Processing state */
  isProcessing?: boolean;
  /** Error state */
  isError?: boolean;
  /** Color override */
  color?: string;
}

const SIZE_VALUES = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

const SIZE_STROKE_WIDTH = {
  xs: 2.5,
  sm: 2,
  md: 1.5,
  lg: 1.5,
  xl: 1.25,
} as const;

// Convert web color classes to React Native compatible colors
const getColorFromClass = (colorClass: string): string => {
  // Extract color from Tailwind class names
  const colorMap: Record<string, string> = {
    "text-red-600": "#dc2626",
    "text-red-500": "#ef4444",
    "text-blue-600": "#2563eb",
    "text-blue-500": "#3b82f6",
    "text-green-600": "#16a34a",
    "text-green-500": "#22c55e",
    "text-yellow-600": "#ca8a04",
    "text-yellow-500": "#eab308",
    "text-purple-600": "#9333ea",
    "text-purple-500": "#a855f7",
    "text-orange-600": "#ea580c",
    "text-orange-500": "#f97316",
    "text-indigo-600": "#4f46e5",
    "text-indigo-500": "#6366f1",
    "text-gray-600": "#4b5563",
    "text-gray-500": "#6b7280",
    "text-muted-foreground": "#6b7280",
    // Add more color mappings as needed
  };

  return colorMap[colorClass] || "#6b7280"; // default gray
};

/**
 * File Type Icon Component for React Native
 *
 * Displays appropriate icons for different file types with consistent styling
 * and color coding. Supports processing and error states.
 */
export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ filename, mimeType, size = "md", showLabel = false, isProcessing = false, isError = false, color }) => {
  // Override category if in special states
  const category = React.useMemo(() => {
    if (isError) return FileCategory.ERROR;
    if (isProcessing) return FileCategory.PROCESSING;
    return getFileTypeCategory(filename, mimeType);
  }, [filename, mimeType, isError, isProcessing]);

  const fileInfo = getFileTypeInfo(filename, mimeType);
  const { colors, iconName } = fileInfo;

  // Get the icon component
  const IconComponent = ICON_COMPONENTS[iconName as keyof typeof ICON_COMPONENTS] || ICON_COMPONENTS.IconFile;

  const iconSize = SIZE_VALUES[size as keyof typeof SIZE_VALUES];
  const strokeWidth = SIZE_STROKE_WIDTH[size as keyof typeof SIZE_STROKE_WIDTH];
  const iconColor = color || getColorFromClass(colors.icon);

  if (showLabel) {
    return (
      <View className="flex flex-col items-center gap-1">
        <View className={cn("flex items-center justify-center rounded-lg p-2 border", colors.bg, colors.border)}>
          <IconComponent size={iconSize} strokeWidth={strokeWidth} color={iconColor} />
        </View>
        <Text className={cn("text-xs font-medium text-center", colors.text, size === "xs" && "text-[10px]", size === "sm" && "text-[11px]")}>{getCategoryLabel(category)}</Text>
      </View>
    );
  }

  return <IconComponent size={iconSize} strokeWidth={strokeWidth} color={iconColor} />;
};

/**
 * File Type Badge Component for React Native
 *
 * Shows file type with background color and icon
 */
export interface FileTypeBadgeProps {
  filename: string;
  mimeType?: string;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  isProcessing?: boolean;
  isError?: boolean;
}

export const FileTypeBadge: React.FC<FileTypeBadgeProps> = ({ filename, mimeType, size = "md", style, isProcessing = false, isError = false }) => {
  const category = React.useMemo(() => {
    if (isError) return FileCategory.ERROR;
    if (isProcessing) return FileCategory.PROCESSING;
    return getFileTypeInfo(filename, mimeType).category;
  }, [filename, mimeType, isError, isProcessing]);

  const fileInfo = getFileTypeInfo(filename, mimeType);
  const { colors, iconName } = fileInfo;

  const IconComponent = ICON_COMPONENTS[iconName as keyof typeof ICON_COMPONENTS] || ICON_COMPONENTS.IconFile;

  const sizeConfig = {
    sm: { iconSize: 12, textClass: "text-xs", padding: "px-2 py-1" },
    md: { iconSize: 16, textClass: "text-sm", padding: "px-3 py-1.5" },
    lg: { iconSize: 20, textClass: "text-base", padding: "px-4 py-2" },
  };

  const config = sizeConfig[size as keyof typeof sizeConfig];
  const iconColor = getColorFromClass(colors.icon);

  return (
    <View className={cn("flex-row items-center gap-1.5 rounded-full border", colors.bg, colors.border, config.padding)} style={style}>
      <IconComponent size={config.iconSize} strokeWidth={2} color={iconColor} />
      <Text className={cn("font-medium", colors.text, config.textClass)}>{getCategoryLabel(category)}</Text>
    </View>
  );
};

/**
 * File Type Avatar Component for React Native
 *
 * Large icon display for file previews (48x48 compatible with h-12)
 */
export interface FileTypeAvatarProps {
  filename: string;
  mimeType?: string;
  style?: ViewStyle;
  isProcessing?: boolean;
  isError?: boolean;
  onPress?: () => void;
}

export const FileTypeAvatar: React.FC<FileTypeAvatarProps> = ({ filename, mimeType, style, isProcessing: _isProcessing = false, isError: _isError = false, onPress }) => {
  const fileInfo = getFileTypeInfo(filename, mimeType);
  const { colors, iconName } = fileInfo;

  const IconComponent = ICON_COMPONENTS[iconName as keyof typeof ICON_COMPONENTS] || ICON_COMPONENTS.IconFile;
  const iconColor = getColorFromClass(colors.icon);

  const containerStyle: ViewStyle = {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  };

  const content = (
    <View className={cn("items-center justify-center border-2", colors.bg, colors.border)} style={StyleSheet.flatten([containerStyle, style])}>
      <IconComponent size={24} strokeWidth={1.5} color={iconColor} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

/**
 * File Type Info Component for React Native
 *
 * Complete file type information display
 */
export interface FileTypeInfoProps {
  filename: string;
  mimeType?: string;
  fileSize?: number;
  style?: ViewStyle;
  isProcessing?: boolean;
  isError?: boolean;
  showFullPath?: boolean;
}

export const FileTypeInfo: React.FC<FileTypeInfoProps> = ({ filename, mimeType, fileSize, style, isProcessing = false, isError = false, showFullPath = false }) => {
  const category = React.useMemo(() => {
    if (isError) return FileCategory.ERROR;
    if (isProcessing) return FileCategory.PROCESSING;
    return getFileTypeInfo(filename, mimeType).category;
  }, [filename, mimeType, isError, isProcessing]);

  const fileInfo = getFileTypeInfo(filename, mimeType);
  const { colors } = fileInfo;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const displayFilename = showFullPath ? filename : filename.length > 30 ? `${filename.substring(0, 27)}...` : filename;

  return (
    <View className="flex-row items-center gap-3" style={style}>
      <FileTypeAvatar filename={filename} mimeType={mimeType} isProcessing={isProcessing} isError={isError} />
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
          {displayFilename}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className={cn("text-xs", colors.text)}>{getCategoryLabel(category)}</Text>
          {fileSize && (
            <>
              <Text className="text-xs text-muted-foreground">•</Text>
              <Text className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default FileTypeIcon;
