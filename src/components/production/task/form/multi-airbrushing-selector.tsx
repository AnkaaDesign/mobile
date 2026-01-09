import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useController } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { AIRBRUSHING_STATUS } from "@/constants/enums";
import { AIRBRUSHING_STATUS_LABELS } from "@/constants/enum-labels";
import { IconTrash, IconSpray, IconGripVertical } from "@tabler/icons-react-native";
import { formatCurrency, formatDate } from "@/utils";
import * as DocumentPicker from "expo-document-picker";

interface MultiAirbrushingSelectorProps {
  control: any;
  disabled?: boolean;
  isEditMode?: boolean;
  onAirbrushingsCountChange?: (count: number) => void;
}

interface AirbrushingItem {
  id: string;
  status: string;
  price: number | null;
  startDate: Date | null;
  finishDate: Date | null;
  receiptFiles: FilePickerItem[];
  nfeFiles: FilePickerItem[];
  artworkFiles: FilePickerItem[];
  receiptIds?: string[];
  invoiceIds?: string[];
  artworkIds?: string[];
  uploading?: boolean;
  error?: string;
}

export interface MultiAirbrushingSelectorRef {
  addAirbrushing: () => void;
}

export const MultiAirbrushingSelector = forwardRef<MultiAirbrushingSelectorRef, MultiAirbrushingSelectorProps>(
  ({ control, disabled, isEditMode = false, onAirbrushingsCountChange }, ref) => {
    const { colors } = useTheme();

    // Use controller to properly manage form field
    const { field } = useController({
      name: "airbrushings" as any,
      control,
    });

    // Helper to convert File objects to FilePickerItem
    const convertFilesToFilePickerItem = (files: any[]): FilePickerItem[] => {
      return (files || []).map((file) => ({
        uri: file.url || file.path || "",
        name: file.filename || file.name || "file",
        type: file.mimetype || file.type || "application/octet-stream",
        size: file.size || 0,
      }));
    };

    // Initialize airbrushings from form field value
    const [airbrushings, setAirbrushings] = useState<AirbrushingItem[]>(() => {
      if (field.value && Array.isArray(field.value) && field.value.length > 0) {
        return field.value.map((airbrushing: any, index: number) => ({
          id: airbrushing.id || `airbrushing-${Date.now()}-${index}`,
          status: airbrushing.status || AIRBRUSHING_STATUS.PENDING,
          price: airbrushing.price || null,
          startDate: airbrushing.startDate || null,
          finishDate: airbrushing.finishDate || null,
          receiptFiles: [
            ...convertFilesToFilePickerItem(airbrushing.receipts || []),
            ...(airbrushing.receiptFiles || []),
          ],
          nfeFiles: [...convertFilesToFilePickerItem(airbrushing.invoices || []), ...(airbrushing.nfeFiles || [])],
          artworkFiles: [
            ...convertFilesToFilePickerItem(airbrushing.artworks || []),
            ...(airbrushing.artworkFiles || []),
          ],
          receiptIds: airbrushing.receiptIds || [],
          invoiceIds: airbrushing.invoiceIds || [],
          artworkIds: airbrushing.artworkIds || [],
        }));
      }
      return [];
    });

    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Track if we're syncing to prevent infinite loops
    const isSyncingToForm = useRef<boolean>(false);

    // Sync FROM local state TO form field when airbrushings change
    useState(() => {
      isSyncingToForm.current = true;

      const formValue = airbrushings.map((airbrushing) => ({
        id: airbrushing.id,
        status: airbrushing.status,
        price: airbrushing.price,
        startDate: airbrushing.startDate,
        finishDate: airbrushing.finishDate,
        receiptIds: airbrushing.receiptIds || [],
        invoiceIds: airbrushing.invoiceIds || [],
        artworkIds: airbrushing.artworkIds || [],
        receiptFiles: airbrushing.receiptFiles,
        nfeFiles: airbrushing.nfeFiles,
        artworkFiles: airbrushing.artworkFiles,
      }));

      field.onChange(formValue);

      if (onAirbrushingsCountChange) {
        onAirbrushingsCountChange(airbrushings.length);
      }

      setTimeout(() => {
        isSyncingToForm.current = false;
      }, 0);
    });

    const addAirbrushing = useCallback(() => {
      const newAirbrushing: AirbrushingItem = {
        id: `airbrushing-${Date.now()}`,
        status: AIRBRUSHING_STATUS.PENDING,
        price: null,
        startDate: null,
        finishDate: null,
        receiptFiles: [],
        nfeFiles: [],
        artworkFiles: [],
        receiptIds: [],
        invoiceIds: [],
        artworkIds: [],
      };
      setAirbrushings((prev) => [...prev, newAirbrushing]);
      setExpandedItems((prev) => [...prev, newAirbrushing.id]);
    }, []);

    const removeAirbrushing = useCallback((id: string) => {
      setAirbrushings((prev) => prev.filter((airbrushing) => airbrushing.id !== id));
      setExpandedItems((prev) => prev.filter((itemId) => itemId !== id));
    }, []);

    const updateAirbrushing = useCallback((id: string, updates: Partial<AirbrushingItem>) => {
      setAirbrushings((prev) =>
        prev.map((airbrushing) => {
          if (airbrushing.id === id) {
            return { ...airbrushing, ...updates };
          }
          return airbrushing;
        })
      );
    }, []);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        addAirbrushing,
      }),
      [addAirbrushing]
    );

    const toggleExpand = useCallback((airbrushingId: string) => {
      setExpandedItems((prev) => {
        if (prev.includes(airbrushingId)) {
          return prev.filter((id) => id !== airbrushingId);
        } else {
          return [...prev, airbrushingId];
        }
      });
    }, []);

    const getStatusBadgeColor = (status: string) => {
      switch (status) {
        case AIRBRUSHING_STATUS.PENDING:
          return colors.secondary;
        case AIRBRUSHING_STATUS.IN_PRODUCTION:
          return colors.primary;
        case AIRBRUSHING_STATUS.COMPLETED:
          return colors.success;
        case AIRBRUSHING_STATUS.CANCELLED:
          return colors.destructive;
        default:
          return colors.secondary;
      }
    };

    const statusOptions = Object.values(AIRBRUSHING_STATUS).map((status) => ({
      value: status,
      label: AIRBRUSHING_STATUS_LABELS[status],
    }));

    return (
      <View style={styles.container}>
        {airbrushings.length > 0 && (
          <View style={styles.airbrushingsListContainer}>
            {airbrushings.map((airbrushing, index) => {
              const isExpanded = expandedItems.includes(airbrushing.id);

              return (
                <Card key={airbrushing.id} style={styles.airbrushingCard}>
                  {/* Airbrushing Header */}
                  <TouchableOpacity
                    style={[
                      styles.airbrushingHeader,
                      { borderBottomWidth: isExpanded ? 1 : 0, borderBottomColor: colors.border },
                    ]}
                    onPress={() => toggleExpand(airbrushing.id)}
                    disabled={disabled}
                  >
                    <View style={styles.airbrushingHeaderLeft}>
                      <IconGripVertical size={16} color={colors.mutedForeground} />
                      <ThemedText style={styles.airbrushingHeaderTitle}>Aerografia {index + 1}</ThemedText>
                      <View style={[styles.badge, { backgroundColor: getStatusBadgeColor(airbrushing.status) }]}>
                        <ThemedText style={[styles.badgeText, { color: "#ffffff" }]}>
                          {AIRBRUSHING_STATUS_LABELS[airbrushing.status]}
                        </ThemedText>
                      </View>
                      {airbrushing.price && (
                        <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                          <ThemedText style={[styles.badgeText, { color: colors.mutedForeground }]}>
                            {formatCurrency(airbrushing.price)}
                          </ThemedText>
                        </View>
                      )}
                      {airbrushing.startDate && (
                        <ThemedText style={[styles.dateText, { color: colors.mutedForeground }]}>
                          {formatDate(airbrushing.startDate)}
                        </ThemedText>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        removeAirbrushing(airbrushing.id);
                      }}
                      disabled={disabled}
                      style={styles.removeButton}
                    >
                      <IconTrash size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Airbrushing Content (Expandable) */}
                  {isExpanded && (
                    <View style={styles.airbrushingContent}>
                      {/* Status, Price and Dates */}
                      <View style={styles.formRow}>
                        {isEditMode && (
                          <View style={styles.fieldGroup}>
                            <Label>Status</Label>
                            <Combobox
                              value={airbrushing.status}
                              onValueChange={(value) => updateAirbrushing(airbrushing.id, { status: value })}
                              disabled={disabled}
                              options={statusOptions}
                              placeholder="Selecione o status"
                              searchable={false}
                            />
                          </View>
                        )}

                        <View style={styles.fieldGroup}>
                          <Label>Preço</Label>
                          <Input
                            type="currency"
                            value={airbrushing.price ? String(airbrushing.price) : ""}
                            onChangeText={(value) => {
                              const numValue = parseFloat(value.replace(/[^0-9.-]/g, ""));
                              updateAirbrushing(airbrushing.id, {
                                price: isNaN(numValue) ? null : numValue,
                              });
                            }}
                            disabled={disabled}
                            placeholder="R$ 0,00"
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.fieldGroup}>
                          <Label>Data de Início</Label>
                          <DatePicker
                            value={airbrushing.startDate ?? undefined}
                            onChange={(date) => updateAirbrushing(airbrushing.id, { startDate: date || null })}
                            type="date"
                            placeholder="Selecione a data"
                            disabled={disabled}
                          />
                        </View>

                        <View style={styles.fieldGroup}>
                          <Label>Data de Conclusão</Label>
                          <DatePicker
                            value={airbrushing.finishDate ?? undefined}
                            onChange={(date) => updateAirbrushing(airbrushing.id, { finishDate: date || null })}
                            type="date"
                            placeholder="Selecione a data"
                            disabled={disabled}
                          />
                        </View>
                      </View>

                      {/* Separator */}
                      <View style={[styles.separator, { backgroundColor: colors.border }]} />

                      {/* File Uploads */}
                      <View style={styles.filesSection}>
                        {/* Receipts */}
                        <View style={styles.fileGroup}>
                          <FilePicker
                            value={airbrushing.receiptFiles}
                            onChange={(files) => updateAirbrushing(airbrushing.id, { receiptFiles: files })}
                            maxFiles={10}
                            label="Recibos"
                            placeholder="Adicionar recibos"
                            helperText="Selecione até 10 recibos"
                            disabled={disabled || airbrushing.uploading}
                            showCamera={true}
                            showGallery={true}
                            showFilePicker={true}
                          />
                        </View>

                        {/* NFes */}
                        <View style={styles.fileGroup}>
                          <FilePicker
                            value={airbrushing.nfeFiles}
                            onChange={(files) => updateAirbrushing(airbrushing.id, { nfeFiles: files })}
                            maxFiles={10}
                            label="Notas Fiscais"
                            placeholder="Adicionar notas fiscais"
                            helperText="Selecione até 10 notas fiscais"
                            disabled={disabled || airbrushing.uploading}
                            showCamera={true}
                            showGallery={true}
                            showFilePicker={true}
                          />
                        </View>

                        {/* Artworks */}
                        <View style={styles.fileGroup}>
                          <FilePicker
                            value={airbrushing.artworkFiles}
                            onChange={(files) => updateAirbrushing(airbrushing.id, { artworkFiles: files })}
                            maxFiles={20}
                            label="Artes"
                            placeholder="Adicionar artes"
                            helperText="Selecione até 20 imagens de arte"
                            disabled={disabled || airbrushing.uploading}
                            showCamera={false}
                            showVideoCamera={false}
                            showGallery={true}
                            showFilePicker={true}
                            acceptedFileTypes={["image/*"]}
                          />
                        </View>
                      </View>

                      {/* Error Message */}
                      {airbrushing.error && (
                        <View style={[styles.alert, { backgroundColor: colors.destructive + "20", borderColor: colors.destructive }]}>
                          <ThemedText style={[styles.alertText, { color: colors.destructive }]}>
                            {airbrushing.error}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </View>
    );
  }
);

MultiAirbrushingSelector.displayName = "MultiAirbrushingSelector";

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  airbrushingsListContainer: {
    gap: spacing.sm,
  },
  airbrushingCard: {
    padding: 0,
    overflow: "hidden",
  },
  airbrushingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  airbrushingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
    flexWrap: "wrap",
  },
  airbrushingHeaderTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  dateText: {
    fontSize: fontSize.xs,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  airbrushingContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  formRow: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
    flex: 1,
  },
  separator: {
    height: 1,
    marginVertical: spacing.sm,
  },
  filesSection: {
    gap: spacing.md,
  },
  fileGroup: {
    gap: spacing.sm,
  },
  alert: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  alertText: {
    fontSize: fontSize.sm,
  },
});
