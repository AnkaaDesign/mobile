import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { Image } from "expo-image";
import { IconFile, IconPhoto, IconFileText } from "@tabler/icons-react-native";
import { ThemedText } from "./themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { useFileSuggestions, useCreateFileFromExisting } from "@/hooks/useFile";
import { useFileViewer } from "@/components/file";
import { formatRelativeTime } from "@/utils/date";
import type { File as AnkaaFile } from "@/types";

export interface FileSuggestionsProps {
  customerId?: string;
  fileContext: "tasksArtworks" | "taskBaseFiles" | "taskProjectFiles";
  excludeFileIds: string[];
  onSelect: (newFile: AnkaaFile) => void;
  disabled?: boolean;
}

const truncateFilename = (name: string, maxLen = 16): string => {
  if (name.length <= maxLen) return name;
  const ext = name.lastIndexOf(".");
  if (ext > 0) {
    const extension = name.slice(ext);
    const base = name.slice(0, maxLen - extension.length - 3);
    return `${base}...${extension}`;
  }
  return `${name.slice(0, maxLen - 3)}...`;
};

const FileIcon = ({ file, colors }: { file: AnkaaFile; colors: any }) => {
  if (file.mimetype === "application/pdf") {
    return <IconFileText size={20} color="#ef4444" />;
  }
  if (file.mimetype?.startsWith("image/")) {
    return <IconPhoto size={20} color="#3b82f6" />;
  }
  return <IconFile size={20} color={colors.mutedForeground} />;
};

export const FileSuggestions: React.FC<FileSuggestionsProps> = ({
  customerId,
  fileContext,
  excludeFileIds,
  onSelect,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  const { data: suggestions, isLoading } = useFileSuggestions({
    customerId,
    fileContext,
    excludeIds: excludeFileIds,
  });

  const createFromExisting = useCreateFileFromExisting();
  const fileViewer = useFileViewer();

  const handleSelect = async (file: AnkaaFile) => {
    if (disabled || loadingFileId) return;
    setLoadingFileId(file.id);
    try {
      const result = await createFromExisting.mutateAsync(file.id);
      onSelect(result.data);
    } catch {
      // Error handled by react-query
    } finally {
      setLoadingFileId(null);
    }
  };

  const handlePress = (file: AnkaaFile) => {
    if (disabled || loadingFileId) return;
    Alert.alert(
      file.filename,
      undefined,
      [
        { text: "Ver", onPress: () => fileViewer.actions.viewFile(file) },
        { text: "Selecionar", onPress: () => handleSelect(file) },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  if (!customerId) return null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
          Arquivos recentes do cliente
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.scrollContent}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                style={[styles.skeletonItem, { backgroundColor: colors.muted }]}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
        Arquivos recentes do cliente
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {suggestions.map((file) => {
            const isCurrentLoading = loadingFileId === file.id;
            const thumbnailUrl = file.thumbnailUrl || (file.mimetype?.startsWith("image/") ? (file as any).url : null);

            return (
              <TouchableOpacity
                key={file.id}
                disabled={disabled || !!loadingFileId}
                onPress={() => handlePress(file)}
                activeOpacity={0.7}
                style={[
                  styles.item,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border + '66',
                    opacity: disabled || (loadingFileId && !isCurrentLoading) ? 0.5 : 1,
                  },
                ]}
              >
                {isCurrentLoading && (
                  <View style={[styles.loadingOverlay, { backgroundColor: colors.background + 'CC' }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
                <View style={[styles.thumbnail, { backgroundColor: colors.muted }]}>
                  {thumbnailUrl ? (
                    <Image
                      source={{ uri: thumbnailUrl }}
                      style={styles.thumbnailImage}
                      contentFit="cover"
                    />
                  ) : (
                    <FileIcon file={file} colors={colors} />
                  )}
                </View>
                <ThemedText
                  style={[styles.filename, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {truncateFilename(file.filename)}
                </ThemedText>
                <ThemedText style={[styles.date, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(file.createdAt)}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  label: {
    fontSize: 11,
    marginBottom: spacing.xxs,
    opacity: 0.8,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 6,
    paddingRight: spacing.sm,
  },
  skeletonItem: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.DEFAULT,
  },
  item: {
    width: 72,
    alignItems: "center",
    padding: spacing.xxs,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius.md,
    zIndex: 10,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: 48,
    height: 48,
  },
  filename: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
    width: "100%",
  },
  date: {
    fontSize: 9,
    textAlign: "center",
    opacity: 0.7,
  },
});
