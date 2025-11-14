
import { View, ScrollView, StyleSheet } from "react-native";

import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { formatFileSize } from "@/utils";
import type { FileGetManyFormData } from '../../../../schemas';

interface FileFilterTagsProps {
  filters: Partial<FileGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<FileGetManyFormData>) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

export function FileFilterTags({ filters, searchText, onFilterChange: _onFilterChange }: FileFilterTagsProps) {
  const { colors } = useTheme();

  // Extract filter values
  const mimeTypes = filters.where?.mimetype?.in || [];
  const sizeMin = filters.where?.size?.gte;
  const sizeMax = filters.where?.size?.lte;
  const createdStart = filters.createdAt?.gte;
  const createdEnd = filters.createdAt?.lte;
  const updatedStart = filters.updatedAt?.gte;
  const updatedEnd = filters.updatedAt?.lte;

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
            <ThemedText style={styles.tagText}>Busca: {searchText}</ThemedText>
          </Badge>
        )}

        {/* MIME Type Tags */}
        {mimeTypes.map((mimeType: string) => (
          <Badge key={mimeType} variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>{getMimeTypeLabel(mimeType)}</ThemedText>
          </Badge>
        ))}

        {/* Size Range Tag */}
        {(sizeMin !== undefined || sizeMax !== undefined) && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Tamanho: {sizeMin !== undefined ? formatFileSize(sizeMin) : "0"} - {sizeMax !== undefined ? formatFileSize(sizeMax) : "∞"}
            </ThemedText>
          </Badge>
        )}

        {/* Created Date Tag */}
        {(createdStart !== undefined || createdEnd !== undefined) && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Criado: {createdStart ? (createdStart instanceof Date ? createdStart.toLocaleDateString() : new Date(createdStart).toLocaleDateString()) : "∞"} - {createdEnd ? (createdEnd instanceof Date ? createdEnd.toLocaleDateString() : new Date(createdEnd).toLocaleDateString()) : "∞"}
            </ThemedText>
          </Badge>
        )}

        {/* Updated Date Tag */}
        {(updatedStart !== undefined || updatedEnd !== undefined) && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Atualizado: {updatedStart ? (updatedStart instanceof Date ? updatedStart.toLocaleDateString() : new Date(updatedStart).toLocaleDateString()) : "∞"} - {updatedEnd ? (updatedEnd instanceof Date ? updatedEnd.toLocaleDateString() : new Date(updatedEnd).toLocaleDateString()) : "∞"}
            </ThemedText>
          </Badge>
        )}

        {/* Clear All */}
        <Badge variant="destructive" style={styles.tag}>
          <ThemedText style={[styles.tagText, { color: colors.destructiveForeground }]}>Limpar tudo</ThemedText>
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
