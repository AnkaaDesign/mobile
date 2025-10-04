import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import type { FileGetManyFormData } from '../../../../schemas';

interface FileFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<FileGetManyFormData>) => void;
  currentFilters: Partial<FileGetManyFormData>;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  // MIME type filter (simple text input for common types like image/*, application/pdf, etc.)
  mimeTypes?: string[];

  // Size range filter
  sizeRange?: FilterRange;

  // Date filters
  createdDateRange?: { start?: Date; end?: Date };
  updatedDateRange?: { start?: Date; end?: Date };
}

// Common MIME type presets
const COMMON_MIME_TYPES = [
  { value: "image/*", label: "Imagens" },
  { value: "application/pdf", label: "PDF" },
  { value: "application/vnd.ms-excel", label: "Excel" },
  { value: "application/msword", label: "Word" },
  { value: "video/*", label: "Vídeos" },
  { value: "audio/*", label: "Áudio" },
];

export function FileFilterModal({ visible, onClose, onApply, currentFilters }: FileFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [selectedMimeTypes, setSelectedMimeTypes] = useState<string[]>([]);

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
    // Extract MIME types from current filters if present
    const currentMimeTypes = currentFilters.where?.mimetype?.in || [];
    setSelectedMimeTypes(currentMimeTypes);
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (selectedMimeTypes.length) count++;
    if (filters.sizeRange?.min !== undefined || filters.sizeRange?.max !== undefined) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) count++;

    return count;
  }, [filters, selectedMimeTypes]);

  const handleRangeChange = (key: keyof FilterState, field: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters((prev) => {
      const range = (prev[key] as FilterRange) || {};
      return {
        ...prev,
        [key]: {
          ...range,
          [field]: numValue,
        },
      };
    });
  };

  const handleDateRangeChange = (key: keyof FilterState, field: "start" | "end", value: Date | undefined) => {
    setFilters((prev) => {
      const range = (prev[key] as { start?: Date; end?: Date }) || {};
      return {
        ...prev,
        [key]: {
          ...range,
          [field]: value,
        },
      };
    });
  };

  const toggleMimeType = (mimeType: string) => {
    setSelectedMimeTypes((prev) => {
      if (prev.includes(mimeType)) {
        return prev.filter((m) => m !== mimeType);
      }
      return [...prev, mimeType];
    });
  };

  const handleApply = () => {
    const appliedFilters: Partial<FileGetManyFormData> = {
      ...currentFilters,
    };

    // Build where clause for MIME types
    if (selectedMimeTypes.length > 0) {
      appliedFilters.where = {
        ...appliedFilters.where,
        mimetype: { in: selectedMimeTypes },
      };
    } else {
      if (appliedFilters.where?.mimetype) {
        delete appliedFilters.where.mimetype;
      }
    }

    // Add size filters
    if (filters.sizeRange?.min !== undefined || filters.sizeRange?.max !== undefined) {
      appliedFilters.where = {
        ...appliedFilters.where,
        size: {
          ...(filters.sizeRange.min !== undefined ? { gte: filters.sizeRange.min * 1024 } : {}), // Convert KB to bytes
          ...(filters.sizeRange.max !== undefined ? { lte: filters.sizeRange.max * 1024 } : {}),
        },
      };
    }

    // Add date filters
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) {
      appliedFilters.where = {
        ...appliedFilters.where,
        createdAt: {
          ...(filters.createdDateRange.start ? { gte: filters.createdDateRange.start } : {}),
          ...(filters.createdDateRange.end ? { lte: filters.createdDateRange.end } : {}),
        },
      };
    }

    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) {
      appliedFilters.where = {
        ...appliedFilters.where,
        updatedAt: {
          ...(filters.updatedDateRange.start ? { gte: filters.updatedDateRange.start } : {}),
          ...(filters.updatedDateRange.end ? { lte: filters.updatedDateRange.end } : {}),
        },
      };
    }

    onApply(appliedFilters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
    setSelectedMimeTypes([]);
    onApply({});
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.title}>Filtros</ThemedText>
          <Button variant="ghost" size="icon" onPress={onClose}>
            <IconX size={24} color={colors.foreground} />
          </Button>
        </View>

        {/* Filter Count Badge */}
        {activeFilterCount > 0 && (
          <View style={styles.filterCount}>
            <Badge variant="secondary">
              <ThemedText style={styles.filterCountText}>{activeFilterCount} filtro(s) ativo(s)</ThemedText>
            </Badge>
          </View>
        )}

        {/* Filters */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* MIME Type Filter */}
          <View style={styles.section}>
            <Label style={styles.sectionTitle}>Tipo de Arquivo</Label>
            <View style={styles.chipContainer}>
              {COMMON_MIME_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={selectedMimeTypes.includes(type.value) ? "default" : "outline"}
                  style={styles.chip}
                  onPress={() => toggleMimeType(type.value)}
                >
                  <ThemedText style={[styles.chipText, selectedMimeTypes.includes(type.value) && { color: colors.primaryForeground }]}>{type.label}</ThemedText>
                </Badge>
              ))}
            </View>
          </View>

          <Separator style={styles.separator} />

          {/* Size Range Filter */}
          <View style={styles.section}>
            <Label style={styles.sectionTitle}>Tamanho (KB)</Label>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInput}>
                <Label>Mínimo</Label>
                <Input
                  placeholder="0"
                  keyboardType="numeric"
                  value={filters.sizeRange?.min?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("sizeRange", "min", value)}
                />
              </View>
              <View style={styles.rangeInput}>
                <Label>Máximo</Label>
                <Input
                  placeholder="∞"
                  keyboardType="numeric"
                  value={filters.sizeRange?.max?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("sizeRange", "max", value)}
                />
              </View>
            </View>
          </View>

          <Separator style={styles.separator} />

          {/* Created Date Range */}
          <View style={styles.section}>
            <Label style={styles.sectionTitle}>Data de Criação</Label>
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateInput}>
                <Label>De</Label>
                <DatePicker value={filters.createdDateRange?.start} onChange={(date) => handleDateRangeChange("createdDateRange", "start", date)} placeholder="Selecione" />
              </View>
              <View style={styles.dateInput}>
                <Label>Até</Label>
                <DatePicker value={filters.createdDateRange?.end} onChange={(date) => handleDateRangeChange("createdDateRange", "end", date)} placeholder="Selecione" />
              </View>
            </View>
          </View>

          <Separator style={styles.separator} />

          {/* Updated Date Range */}
          <View style={styles.section}>
            <Label style={styles.sectionTitle}>Data de Atualização</Label>
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateInput}>
                <Label>De</Label>
                <DatePicker value={filters.updatedDateRange?.start} onChange={(date) => handleDateRangeChange("updatedDateRange", "start", date)} placeholder="Selecione" />
              </View>
              <View style={styles.dateInput}>
                <Label>Até</Label>
                <DatePicker value={filters.updatedDateRange?.end} onChange={(date) => handleDateRangeChange("updatedDateRange", "end", date)} placeholder="Selecione" />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
          <Button variant="outline" style={styles.actionButton} onPress={handleClear}>
            <ThemedText>Limpar</ThemedText>
          </Button>
          <Button style={styles.actionButton} onPress={handleApply}>
            <ThemedText style={{ color: colors.primaryForeground }}>Aplicar</ThemedText>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  filterCount: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterCountText: {
    fontSize: fontSize.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: fontSize.sm,
  },
  rangeContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rangeInput: {
    flex: 1,
    gap: spacing.xs,
  },
  dateRangeContainer: {
    gap: spacing.md,
  },
  dateInput: {
    gap: spacing.xs,
  },
  separator: {
    marginVertical: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
  },
});
