import React, { useState } from "react";
import { View, ScrollView, TextInput, Pressable, Switch , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconDeviceFloppy, IconBuilding, IconBox } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedView, ThemedText, FAB, ErrorScreen } from "@/components/ui";
import { useLayoutSectionMutations, useLayoutSections, useLayoutDetail } from '../../../../../../hooks';
import { layoutSectionCreateSchema, type LayoutSectionCreateFormData } from '../../../../../../schemas';
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";

export default function LayoutSectionCreateScreen() {
  const router = useRouter();
  const { layoutId } = useLocalSearchParams<{ layoutId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { success, error: showError, warning, info } = useToast();


  const { create: createSection } = useLayoutSectionMutations();
  const { data: sectionsResponse } = useLayoutSections(layoutId!);
  const { data: layout } = useLayoutDetail(layoutId!);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate next position
  const nextPosition = sectionsResponse?.data?.length || 0;

  const form = useForm<LayoutSectionCreateFormData>({
    resolver: zodResolver(layoutSectionCreateSchema),
    defaultValues: {
      width: 1.0,
      isDoor: false,
      doorOffset: null,
      position: nextPosition,
    },
  });

  const isDoorValue = form.watch("isDoor");
  const layoutData = layout?.data;

  const onSubmit = async (data: LayoutSectionCreateFormData) => {
    if (isSubmitting || !layoutId) return;

    setIsSubmitting(true);
    try {
      const result = await createSection({ ...data, layoutId });
      success("Seção criada com sucesso");
      router.push(`/production/layouts/${layoutId}/sections/details/${(result as any)?.data?.id}` as any);
    } catch (error: any) {
      showError(error?.message || "Erro ao criar seção");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!layoutId) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro de navegação"
          detail="Layout ID não fornecido"
          onRetry={() => router.back()}
        />
      </ThemedView>
    );
  }

  const errors = form.formState.errors;

  // Get layout type for context
  const layoutType = layoutData
    ? (layoutData.height === 2.42 ? "Traseira" : "Lateral")
    : "Layout";

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Context Info */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.contextTitle}>Nova Seção</ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.contextSubtitle, { color: colors.mutedForeground }])}>
            {layoutType} {layoutData ? `- ${layoutData.height.toFixed(2)}m` : ''}
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.positionInfo, { color: colors.mutedForeground }])}>
            Posição: {nextPosition + 1}
          </ThemedText>
        </View>

        {/* Section Type */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionTitle}>Tipo de Seção</ThemedText>
          <Controller
            control={form.control}
            name="isDoor"
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.typeOption,
                    {
                      backgroundColor: !value ? colors.primary : colors.muted,
                      borderColor: !value ? colors.primary : colors.border,
                    },
                    pressed && styles.typeOptionPressed,
                  ]}
                  onPress={() => onChange(false)}
                >
                  <IconBox
                    size={24}
                    color={!value ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <ThemedText
                    style={StyleSheet.flatten([
                      styles.typeOptionText,
                      { color: !value ? colors.primaryForeground : colors.mutedForeground }
                    ])}
                  >
                    Painel
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.typeOption,
                    {
                      backgroundColor: value ? colors.primary : colors.muted,
                      borderColor: value ? colors.primary : colors.border,
                    },
                    pressed && styles.typeOptionPressed,
                  ]}
                  onPress={() => onChange(true)}
                >
                  <IconBuilding
                    size={24}
                    color={value ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <ThemedText
                    style={StyleSheet.flatten([
                      styles.typeOptionText,
                      { color: value ? colors.primaryForeground : colors.mutedForeground }
                    ])}
                  >
                    Porta
                  </ThemedText>
                </Pressable>
              </View>
            )}
          />
        </View>

        {/* Width */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionTitle}>Largura</ThemedText>
          <Controller
            control={form.control}
            name="width"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={StyleSheet.flatten([
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: errors.width ? colors.destructive : colors.border,
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
                <ThemedText style={StyleSheet.flatten([styles.inputSuffix, { color: colors.mutedForeground }])}>metros</ThemedText>
              </View>
            )}
          />
          {errors.width && (
            <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>
              {errors.width.message}
            </ThemedText>
          )}
        </View>

        {/* Door Offset (only for doors) */}
        {isDoorValue && (
          <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
            <ThemedText style={styles.sectionTitle}>Espaço Superior</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.sectionDescription, { color: colors.mutedForeground }])}>
              Distância do topo da seção até o início da abertura da porta
            </ThemedText>
            <Controller
              control={form.control}
              name="doorOffset"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={StyleSheet.flatten([
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: errors.doorOffset ? colors.destructive : colors.border,
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
                  <ThemedText style={StyleSheet.flatten([styles.inputSuffix, { color: colors.mutedForeground }])}>metros</ThemedText>
                </View>
              )}
            />
            {errors.doorOffset && (
              <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>
                {errors.doorOffset.message}
              </ThemedText>
            )}
            {layoutData && form.watch("doorOffset") && (
              <View style={StyleSheet.flatten([styles.calculationInfo, { backgroundColor: colors.muted }])}>
                <ThemedText style={StyleSheet.flatten([styles.calculationLabel, { color: colors.mutedForeground }])}>
                  Altura da abertura:
                </ThemedText>
                <ThemedText style={styles.calculationValue}>
                  {(layoutData.height - (form.watch("doorOffset") || 0)).toFixed(2)}m
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Preview */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionTitle}>Resumo</ThemedText>
          <View style={styles.previewContainer}>
            <View style={styles.previewItem}>
              <View style={styles.previewIcon}>
                {isDoorValue ? (
                  <IconBuilding size={20} color={colors.primary} />
                ) : (
                  <IconBox size={20} color={colors.mutedForeground} />
                )}
              </View>
              <View style={styles.previewInfo}>
                <ThemedText style={styles.previewTitle}>
                  {isDoorValue ? "Porta" : "Painel"} {nextPosition + 1}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.previewDetail, { color: colors.mutedForeground }])}>
                  Largura: {form.watch("width")?.toFixed(2) || "0,00"}m
                </ThemedText>
                {isDoorValue && form.watch("doorOffset") && (
                  <ThemedText style={StyleSheet.flatten([styles.previewDetail, { color: colors.mutedForeground }])}>
                    Espaço superior: {form.watch("doorOffset")?.toFixed(2) || "0,00"}m
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
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
  contextTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  contextSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  positionInfo: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeOptionPressed: {
    opacity: 0.8,
  },
  typeOptionText: {
    fontSize: 16,
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
  calculationInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  calculationLabel: {
    fontSize: 14,
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  previewContainer: {
    gap: 12,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  previewDetail: {
    fontSize: 12,
  },
  bottomSpacing: {
    height: 100,
  },
});
