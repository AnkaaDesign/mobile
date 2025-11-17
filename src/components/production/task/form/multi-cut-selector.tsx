import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileUploadField } from "@/components/ui/file-upload-field";
import type { FileWithPreview } from "@/components/ui/file-upload-field";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, fontWeight } from "@/constants/design-system";
import { CUT_TYPE, CUT_TYPE_LABELS, CUT_ORIGIN } from "@/constants";
import { IconTrash, IconScissors, IconFile, IconGripVertical } from "@tabler/icons-react-native";
import * as DocumentPicker from "expo-document-picker";

// Helper function to convert database File entity to FileWithPreview
const convertToFileWithPreview = (file: any | undefined | null): FileWithPreview | undefined => {
  if (!file) return undefined;

  // If it's already a File with uploaded metadata, return as-is
  if (file.uri) {
    return file as FileWithPreview;
  }

  // Convert database file entity to FileWithPreview format
  return {
    uri: file.url || file.path || "",
    name: file.filename || file.name || "file",
    type: file.mimetype || file.type || "application/octet-stream",
    size: file.size || 0,
  } as FileWithPreview;
};

interface MultiCutSelectorProps {
  control: any;
  disabled?: boolean;
  onCutsCountChange?: (count: number) => void;
}

export interface MultiCutSelectorRef {
  addCut: () => void;
}

export const MultiCutSelector = forwardRef<MultiCutSelectorRef, MultiCutSelectorProps>(
  ({ control, disabled, onCutsCountChange }, ref) => {
    const { colors } = useTheme();
    const { setValue, getValues, watch } = useFormContext();

    // Use React Hook Form's useFieldArray - the proper way to manage array fields
    const { fields, append, prepend, remove } = useFieldArray({
      control,
      name: "cuts",
    });

    // Watch the cuts values to get reactive updates when files are added
    const cutsValues = (watch("cuts") as any[]) || [];

    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);
    const previousFieldsLength = useRef(0);

    // Initialize expanded items when fields are first loaded
    // In edit mode, start with all accordions CLOSED
    useState(() => {
      if (!hasInitialized && fields.length > 0) {
        setExpandedItems([]); // Start with all closed in edit mode
        setHasInitialized(true);
        previousFieldsLength.current = fields.length;
      }
    });

    // When a new field is added (prepended), auto-expand it
    useState(() => {
      if (hasInitialized && fields.length > previousFieldsLength.current) {
        // A new field was added (prepended at index 0)
        const newFieldId = fields[0]?.id;
        if (newFieldId) {
          setExpandedItems([newFieldId]); // Open only the new cut
        }
      }
      previousFieldsLength.current = fields.length;
    });

    // Add new cut at the beginning and close all other accordions
    const addCut = useCallback(() => {
      const newCut = {
        id: `cut-${Date.now()}`,
        type: CUT_TYPE.VINYL,
        quantity: 1,
        origin: CUT_ORIGIN.PLAN,
        fileId: undefined,
        file: undefined,
      };
      prepend(newCut); // Add at the beginning, not the end
    }, [prepend]);

    // Expose methods to parent component using imperative handle
    useImperativeHandle(
      ref,
      () => ({
        addCut,
      }),
      [addCut]
    );

    // Pass cuts count to parent
    useState(() => {
      if (onCutsCountChange) {
        onCutsCountChange(fields.length);
      }
    });

    // Remove cut
    const removeCut = useCallback(
      (index: number) => {
        const cutId = fields[index]?.id;
        remove(index);
        if (cutId) {
          setExpandedItems((prev) => prev.filter((itemId) => itemId !== cutId));
        }
      },
      [remove, fields]
    );

    // Update cut field using setValue to avoid re-mounting components
    const updateCutField = useCallback(
      (index: number, fieldName: string, value: any) => {
        console.log("[MultiCutSelector] updateCutField:", { index, fieldName, value: value?.name || value });
        setValue(`cuts.${index}.${fieldName}`, value, { shouldDirty: true, shouldTouch: true });
      },
      [setValue]
    );

    // File picking function for cut files
    const pickCutFile = async (index: number) => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/postscript", "application/pdf", "image/svg+xml", "application/dxf"],
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          const file: FileWithPreview = {
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || "application/octet-stream",
            size: asset.size || 0,
          };

          console.log("[MultiCutSelector] File picked:", {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          });

          // Store the file in the cut item
          updateCutField(index, "file", file);
          updateCutField(index, "fileId", undefined);

          console.log("[MultiCutSelector] Cut updated with file");
        }
      } catch (error) {
        console.error("Error picking cut file:", error);
        Alert.alert("Erro", "Não foi possível selecionar o arquivo");
      }
    };

    // Remove file from cut
    const removeCutFile = useCallback(
      (index: number) => {
        updateCutField(index, "file", undefined);
        updateCutField(index, "fileId", undefined);
      },
      [updateCutField]
    );

    // Toggle accordion expansion
    const toggleExpand = useCallback((cutId: string) => {
      setExpandedItems((prev) => {
        if (prev.includes(cutId)) {
          return prev.filter((id) => id !== cutId);
        } else {
          return [...prev, cutId];
        }
      });
    }, []);

    // Check if there are cuts without files
    const hasCutsWithoutFiles = cutsValues.length > 0 && cutsValues.some((cut: any) => !cut.file && !cut.fileId);

    const cutTypeOptions = Object.entries(CUT_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    }));

    return (
      <View style={styles.container}>
        {fields.length > 0 && (
          <View style={styles.cutsListContainer}>
            {fields.map((field: any, index) => {
              const currentCut = cutsValues[index] || field;
              const isExpanded = expandedItems.includes(field.id);

              return (
                <Card key={field.id} style={styles.cutCard}>
                  {/* Cut Header */}
                  <TouchableOpacity
                    style={[styles.cutHeader, { borderBottomWidth: isExpanded ? 1 : 0, borderBottomColor: colors.border }]}
                    onPress={() => toggleExpand(field.id)}
                    disabled={disabled}
                  >
                    <View style={styles.cutHeaderLeft}>
                      <IconGripVertical size={16} color={colors.mutedForeground} />
                      <IconScissors size={16} color={colors.foreground} />
                      <ThemedText style={styles.cutHeaderTitle}>Corte #{index + 1}</ThemedText>
                      <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                        <ThemedText style={[styles.badgeText, { color: colors.secondaryForeground }]}>
                          {CUT_TYPE_LABELS[currentCut.type as keyof typeof CUT_TYPE_LABELS] || currentCut.type}
                        </ThemedText>
                      </View>
                      <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                        <ThemedText style={[styles.badgeText, { color: colors.mutedForeground }]}>
                          Qtd: {currentCut.quantity}
                        </ThemedText>
                      </View>
                      {currentCut.file && (
                        <View style={[styles.badge, { backgroundColor: colors.success }]}>
                          <ThemedText style={[styles.badgeText, { color: "#ffffff" }]}>Arquivo anexado</ThemedText>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        removeCut(index);
                      }}
                      disabled={disabled}
                      style={styles.removeButton}
                    >
                      <IconTrash size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Cut Content (Expandable) */}
                  {isExpanded && (
                    <View style={styles.cutContent}>
                      <View style={styles.cutFormGrid}>
                        {/* Left Column - File Upload */}
                        <View style={styles.cutFormColumn}>
                          <Label>Arquivo de Corte</Label>
                          <View style={styles.fileUploadContainer}>
                            {currentCut.file ? (
                              <View style={[styles.fileItem, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                                <IconFile size={16} color={colors.foreground} />
                                <ThemedText style={styles.fileName} numberOfLines={1}>
                                  {convertToFileWithPreview(currentCut.file)?.name || "Arquivo"}
                                </ThemedText>
                                <TouchableOpacity onPress={() => removeCutFile(index)} disabled={disabled}>
                                  <IconTrash size={14} color={colors.destructive} />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <Button variant="outline" size="sm" onPress={() => pickCutFile(index)} disabled={disabled}>
                                <View style={styles.buttonContent}>
                                  <Icon name="upload" size={16} color={colors.foreground} />
                                  <ThemedText style={{ fontSize: fontSize.sm, marginLeft: spacing.xs }}>
                                    Selecionar Arquivo
                                  </ThemedText>
                                </View>
                              </Button>
                            )}
                            <ThemedText style={[styles.fileHint, { color: colors.mutedForeground }]}>
                              EPS, PDF, SVG ou similar
                            </ThemedText>
                          </View>
                        </View>

                        {/* Right Column - Type and Quantity */}
                        <View style={styles.cutFormColumn}>
                          {/* Cut Type */}
                          <View style={styles.fieldGroup}>
                            <Label>Tipo de Corte</Label>
                            <Combobox
                              value={currentCut.type}
                              onValueChange={(value) => updateCutField(index, "type", value)}
                              options={cutTypeOptions}
                              placeholder="Selecione o tipo"
                              disabled={disabled}
                              searchable={false}
                            />
                          </View>

                          {/* Quantity */}
                          <View style={styles.fieldGroup}>
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              value={String(currentCut.quantity || 1)}
                              onChangeText={(value) => {
                                const num = parseInt(value, 10);
                                updateCutField(index, "quantity", isNaN(num) || num < 1 ? 1 : num);
                              }}
                              disabled={disabled}
                              placeholder="1"
                              keyboardType="number-pad"
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {hasCutsWithoutFiles && (
          <View style={[styles.alert, { backgroundColor: colors.destructive + "20", borderColor: colors.destructive }]}>
            <ThemedText style={[styles.alertText, { color: colors.destructive }]}>
              Alguns cortes não possuem arquivos anexados. Adicione os arquivos antes de enviar o formulário.
            </ThemedText>
          </View>
        )}
      </View>
    );
  }
);

MultiCutSelector.displayName = "MultiCutSelector";

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  cutsListContainer: {
    gap: spacing.sm,
  },
  cutCard: {
    padding: 0,
    overflow: "hidden",
  },
  cutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cutHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
    flexWrap: "wrap",
  },
  cutHeaderTitle: {
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
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  cutContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cutFormGrid: {
    gap: spacing.md,
  },
  cutFormColumn: {
    gap: spacing.sm,
  },
  fileUploadContainer: {
    gap: spacing.xs,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  fileName: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  fileHint: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
    marginTop: spacing.xxs,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
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
