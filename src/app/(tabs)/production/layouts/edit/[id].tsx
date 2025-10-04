import React, { useState, useEffect } from "react";
import { View, ScrollView, TextInput, Pressable, Switch , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedView, ThemedText, FAB, ErrorScreen, Badge } from "@/components/ui";
import { useLayoutDetail, useLayoutMutations } from '../../../../../hooks';
import { layoutUpdateSchema, type LayoutUpdateFormData } from '../../../../../schemas';
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

export default function LayoutEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: layout, isLoading, error, refetch } = useLayoutDetail(id!, {
    include: {
      layoutSections: true,
    },
  });

  const { update: updateLayout } = useLayoutMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LayoutUpdateFormData>({
    resolver: zodResolver(layoutUpdateSchema),
    defaultValues: {
      height: 2.4,
      sections: [],
      photoId: null,
    },
  });

  const { fields: sections, append: addSection, remove: removeSection, update: updateSection, replace: replaceSections } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  // Initialize form with layout data when loaded
  useEffect(() => {
    if (layout?.data) {
      const layoutData = layout.data;

      // Sort sections by position and map to form structure
      const sectionsData = (layoutData.layoutSections || [])
        .sort((a, b) => a.position - b.position)
        .map((section) => ({
          width: section.width,
          isDoor: section.isDoor,
          doorOffset: section.doorOffset,
          position: section.position,
        }));

      form.reset({
        height: layoutData.height,
        sections: sectionsData,
        photoId: layoutData.photoId,
      });

      replaceSections(sectionsData);
    }
  }, [layout, form, replaceSections]);

  const onSubmit = async (data: LayoutUpdateFormData) => {
    if (isSubmitting || !id) return;

    setIsSubmitting(true);
    try {
      await updateLayout({ id, data });
      toast.success("Layout atualizado com sucesso");
      router.back();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar layout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewSection = () => {
    const newPosition = sections.length;
    addSection({
      width: 1.0,
      isDoor: false,
      doorOffset: null,
      position: newPosition,
    });
  };

  const removeLastSection = () => {
    if (sections.length > 1) {
      removeSection(sections.length - 1);
    }
  };

  const toggleSectionDoor = (index: number) => {
    const section = sections[index as keyof typeof sections];
    const isDoor = !section.isDoor;

    updateSection(index, {
      ...section,
      isDoor,
      doorOffset: isDoor ? 0.5 : null, // Default door offset when converting to door
    });
  };

  const calculateTotalWidth = () => {
    return sections.reduce((total, section) => total + (section.width || 0), 0);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando layout...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !layout?.data) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar layout"
          detail={error?.message || "Layout não encontrado"}
          onRetry={() => refetch()}
        />
      </ThemedView>
    );
  }

  const errors = form.formState.errors;

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Height Section */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionTitle}>Altura do Layout</ThemedText>
          <Controller
            control={form.control}
            name="height"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={StyleSheet.flatten([
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: errors.height ? colors.destructive : colors.border,
                      color: colors.foreground,
                    },
                  ])}
                  value={value?.toString() || ""}
                  onChangeText={(text) => {
                    const numValue = parseFloat(text.replace(",", "."));
                    onChange(isNaN(numValue) ? 0 : numValue);
                  }}
                  placeholder="2,40"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
                <ThemedText style={StyleSheet.flatten([styles.inputSuffix, { color: colors.mutedForeground }])}>metros</ThemedText>
              </View>
            )}
          />
          {errors.height && (
            <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>
              {errors.height.message}
            </ThemedText>
          )}
        </View>

        {/* Sections */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Seções</ThemedText>
            <View style={styles.sectionActions}>
              <Badge variant="secondary">
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.secondaryForeground }])}>
                  {sections.length}
                </ThemedText>
              </Badge>
              <Badge variant="outline">
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.foreground }])}>
                  {calculateTotalWidth().toFixed(2)}m
                </ThemedText>
              </Badge>
            </View>
          </View>

          <View style={styles.sectionsContainer}>
            {sections.map((section, index) => (
              <View key={section.id || index} style={StyleSheet.flatten([styles.sectionItem, { backgroundColor: colors.muted }])}>
                <View style={styles.sectionItemHeader}>
                  <ThemedText style={styles.sectionItemTitle}>
                    {section.isDoor ? "Porta" : "Painel"} {index + 1}
                  </ThemedText>
                  <View style={styles.sectionItemActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.toggleButton,
                        {
                          backgroundColor: section.isDoor ? colors.primary : colors.secondary,
                        },
                        pressed && styles.toggleButtonPressed,
                      ]}
                      onPress={() => toggleSectionDoor(index)}
                    >
                      <ThemedText
                        style={StyleSheet.flatten([
                          styles.toggleButtonText,
                          {
                            color: section.isDoor ? colors.primaryForeground : colors.secondaryForeground,
                          },
                        ])}
                      >
                        {section.isDoor ? "Porta" : "Painel"}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Width Input */}
                <View style={styles.sectionField}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Largura
                  </ThemedText>
                  <Controller
                    control={form.control}
                    name={`sections.${index}.width`}
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={StyleSheet.flatten([
                            styles.input,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                              color: colors.foreground,
                            },
                          ])}
                          value={value?.toString() || ""}
                          onChangeText={(text) => {
                            const numValue = parseFloat(text.replace(",", "."));
                            onChange(isNaN(numValue) ? 0 : numValue);
                          }}
                          placeholder="1,00"
                          placeholderTextColor={colors.mutedForeground}
                          keyboardType="numeric"
                        />
                        <ThemedText style={StyleSheet.flatten([styles.inputSuffix, { color: colors.mutedForeground }])}>m</ThemedText>
                      </View>
                    )}
                  />
                </View>

                {/* Door Offset Input (only for doors) */}
                {section.isDoor && (
                  <View style={styles.sectionField}>
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      Espaço Superior
                    </ThemedText>
                    <Controller
                      control={form.control}
                      name={`sections.${index}.doorOffset`}
                      render={({ field: { onChange, value } }) => (
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={StyleSheet.flatten([
                              styles.input,
                              {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.foreground,
                              },
                            ])}
                            value={value?.toString() || ""}
                            onChangeText={(text) => {
                              const numValue = parseFloat(text.replace(",", "."));
                              onChange(isNaN(numValue) ? null : numValue);
                            }}
                            placeholder="0,50"
                            placeholderTextColor={colors.mutedForeground}
                            keyboardType="numeric"
                          />
                          <ThemedText style={StyleSheet.flatten([styles.inputSuffix, { color: colors.mutedForeground }])}>m</ThemedText>
                        </View>
                      )}
                    />
                  </View>
                )}

                {/* Remove button (only if more than 1 section) */}
                {sections.length > 1 && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.removeButton,
                      { backgroundColor: colors.destructive },
                      pressed && styles.removeButtonPressed,
                    ]}
                    onPress={() => removeSection(index)}
                  >
                    <IconTrash size={16} color={colors.destructiveForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.removeButtonText, { color: colors.destructiveForeground }])}>
                      Remover Seção
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            ))}

            {/* Add Section Button */}
            <Pressable
              style={({ pressed }) => [
                styles.addSectionButton,
                { backgroundColor: colors.primary },
                pressed && styles.addSectionButtonPressed,
              ]}
              onPress={addNewSection}
            >
              <IconPlus size={20} color={colors.primaryForeground} />
              <ThemedText style={StyleSheet.flatten([styles.addSectionButtonText, { color: colors.primaryForeground }])}>
                Adicionar Seção
              </ThemedText>
            </Pressable>
          </View>

          {errors.sections && (
            <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>
              {errors.sections.message}
            </ThemedText>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FAB
        icon="check"
        onPress={form.handleSubmit(onSubmit)}
        disabled={isSubmitting}
        style={{
          backgroundColor: isSubmitting ? colors.muted : colors.primary,
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputSuffix: {
    fontSize: 14,
    minWidth: 50,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
  sectionsContainer: {
    gap: 16,
  },
  sectionItem: {
    borderRadius: 8,
    padding: 16,
  },
  sectionItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionItemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionItemActions: {
    flexDirection: "row",
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonPressed: {
    opacity: 0.8,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  sectionField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  removeButtonPressed: {
    opacity: 0.8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addSectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addSectionButtonPressed: {
    opacity: 0.8,
  },
  addSectionButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 100,
  },
});