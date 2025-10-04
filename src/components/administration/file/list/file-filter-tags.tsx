import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { formatFileSize } from '../../../../utils';
import type { FileGetManyFormData } from '../../../../schemas';

interface FileFilterTagsProps {
  filters: Partial<FileGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<FileGetManyFormData>) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

export function FileFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: FileFilterTagsProps) {
  const { colors } = useTheme();

  // Extract filter values
  const mimeTypes = filters.where?.mimetype?.in || [];
  const sizeMin = filters.where?.size?.gte;
  const sizeMax = filters.where?.size?.lte;
  const createdStart = filters.where?.createdAt?.gte;
  const createdEnd = filters.where?.createdAt?.lte;
  const updatedStart = filters.where?.updatedAt?.gte;
  const updatedEnd = filters.where?.updatedAt?.lte;

  // Calculate total active filters
  const hasFilters =
    searchText ||
    mimeTypes.length > 0 ||
    sizeMin !== undefined ||
    sizeMax !== undefined ||
    createdStart !== undefined ||
    createdEnd !== undefined ||
    updatedStart !== undefined ||
    updatedEnd !== undefined;

  if (!hasFilters) return null;

  // Helper to remove a MIME type
  const removeMimeType = (mimeType: string) => {
    const newMimeTypes = mimeTypes.filter((m: string) => m !== mimeType);
    onFilterChange({
      ...filters,
      where: {
        ...filters.where,
        mimetype: newMimeTypes.length > 0 ? { in: newMimeTypes } : undefined,
      },
    });
  };

  // Helper to remove size filter
  const removeSizeFilter = () => {
    const newWhere = { ...filters.where };
    delete newWhere.size;
    onFilterChange({
      ...filters,
      where: newWhere,
    });
  };

  // Helper to remove date filter
  const removeDateFilter = (field: "createdAt" | "updatedAt") => {
    const newWhere = { ...filters.where };
    delete newWhere[field];
    onFilterChange({
      ...filters,
      where: newWhere,
    });
  };

  // Get MIME type labels
  const getMimeTypeLabel = (mimeType: string) => {
    if (mimeType === "image/*") return "Imagens";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType === "application/vnd.ms-excel") return "Excel";
    if (mimeType === "application/msword") return "Word";
    if (mimeType === "video/*") return "Vídeos";
    if (mimeType === "audio/*") return "Áudio";
    return mimeType;
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Tag */}
        {searchText && (
          <Badge variant="secondary" style={styles.tag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>Busca: {searchText}</ThemedText>
              <IconX size={14} color={colors.foreground} onPress={() => onSearchChange("")} />
            </View>
          </Badge>
        )}

        {/* MIME Type Tags */}
        {mimeTypes.map((mimeType: string) => (
          <Badge key={mimeType} variant="secondary" style={styles.tag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>{getMimeTypeLabel(mimeType)}</ThemedText>
              <IconX size={14} color={colors.foreground} onPress={() => removeMimeType(mimeType)} />
            </View>
          </Badge>
        ))}

        {/* Size Range Tag */}
        {(sizeMin !== undefined || sizeMax !== undefined) && (
          <Badge variant="secondary" style={styles.tag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>
                Tamanho: {sizeMin !== undefined ? formatFileSize(sizeMin) : "0"} - {sizeMax !== undefined ? formatFileSize(sizeMax) : "∞"}
              </ThemedText>
              <IconX size={14} color={colors.foreground} onPress={removeSizeFilter} />
            </View>
          </Badge>
        )}

        {/* Created Date Tag */}
        {(createdStart !== undefined || createdEnd !== undefined) && (
          <Badge variant="secondary" style={styles.tag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>
                Criado: {createdStart ? new Date(createdStart).toLocaleDateString() : "∞"} - {createdEnd ? new Date(createdEnd).toLocaleDateString() : "∞"}
              </ThemedText>
              <IconX size={14} color={colors.foreground} onPress={() => removeDateFilter("createdAt")} />
            </View>
          </Badge>
        )}

        {/* Updated Date Tag */}
        {(updatedStart !== undefined || updatedEnd !== undefined) && (
          <Badge variant="secondary" style={styles.tag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>
                Atualizado: {updatedStart ? new Date(updatedStart).toLocaleDateString() : "∞"} - {updatedEnd ? new Date(updatedEnd).toLocaleDateString() : "∞"}
              </ThemedText>
              <IconX size={14} color={colors.foreground} onPress={() => removeDateFilter("updatedAt")} />
            </View>
          </Badge>
        )}

        {/* Clear All */}
        <Badge variant="destructive" style={styles.tag} onPress={onClearAll}>
          <View style={styles.tagContent}>
            <ThemedText style={[styles.tagText, { color: colors.destructiveForeground }]}>Limpar tudo</ThemedText>
            <IconX size={14} color={colors.destructiveForeground} />
          </View>
        </Badge>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
