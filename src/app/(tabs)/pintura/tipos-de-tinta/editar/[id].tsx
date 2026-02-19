import { useState } from "react";
import { View, ScrollView, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintType, usePaintTypeMutations, useScreenReady } from "@/hooks";
import { useItems } from "@/hooks/useItem";
import { paintTypeUpdateSchema } from '../../../../../schemas';
import type { PaintTypeUpdateFormData } from '../../../../../schemas';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
// import { showToast } from "@/components/ui/toast";
import {
  IconTag,
  IconDroplet,
  IconBoxSeam,
} from "@tabler/icons-react-native";


import { Skeleton } from "@/components/ui/skeleton";

export default function EditPaintTypeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { update } = usePaintTypeMutations();

  // End navigation loading overlay when screen mounts

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemSearch] = useState("");

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.BASIC);

  // Fetch paint type data
  const { data: paintTypeResponse, isLoading, error } = usePaintType(id || "", {
    include: {
      componentItems: {
        include: {
          measures: true,
          category: true,
          brand: true,
        },
      },
    },
  });

  useScreenReady(!isLoading);
  const paintType = paintTypeResponse?.data;

  // Fetch component items
  const { data: itemsResponse, isLoading: isLoadingItems } = useItems({
    searchingFor: itemSearch,
    orderBy: { name: "asc" },
  });

  const componentItems = itemsResponse?.data?.map((item) => ({
    value: item.id,
    label: item.name,
  })) || [];

  // Form setup
  const form = useForm<PaintTypeUpdateFormData>({
    resolver: zodResolver(paintTypeUpdateSchema),
    defaultValues: {
      name: paintType?.name || "",
      needGround: paintType?.needGround || false,
      componentItemIds: paintType?.componentItems?.map((item) => item.id) || [],
    },
    values: paintType
      ? {
          name: paintType.name,
          needGround: paintType.needGround,
          componentItemIds: paintType.componentItems?.map((item) => item.id) || [],
        }
      : undefined,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
  } = form;

  const needGround = watch("needGround");

  // Handle form submission
  const onSubmit = async (data: PaintTypeUpdateFormData) => {
    if (!canEdit) {
      Alert.alert("Acesso negado", "Você não tem permissão para editar");
      return;
    }

    if (!id) {
      Alert.alert("Erro", "ID do tipo de tinta não encontrado");
      return;
    }

    if (!isDirty) {
      Alert.alert("Informação", "Nenhuma alteração foi feita");
      return;
    }

    setIsSubmitting(true);

    try {
      await update({ id, data });
      // API client already shows success alert
      router.back();
    } catch (_error) {
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  if (!canEdit) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Você não tem permissão para editar tipos de tinta
        </ThemedText>
        <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
        {/* Header card skeleton */}
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton style={{ width: 24, height: 24, borderRadius: 4 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton style={{ height: 16, width: '55%', borderRadius: 4 }} />
              <Skeleton style={{ height: 12, width: '70%', borderRadius: 4 }} />
            </View>
          </View>
        </View>
        {/* Basic info card: name field */}
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
            <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
          </View>
          <Skeleton style={{ height: 13, width: '25%', borderRadius: 4 }} />
          <Skeleton style={{ height: 44, borderRadius: 6 }} />
        </View>
        {/* Ground configuration card */}
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
            <Skeleton style={{ height: 16, width: '50%', borderRadius: 4 }} />
          </View>
          <Skeleton style={{ height: 13, width: '80%', borderRadius: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: 4, flex: 1 }}>
              <Skeleton style={{ height: 15, width: '45%', borderRadius: 4 }} />
              <Skeleton style={{ height: 12, width: '75%', borderRadius: 4 }} />
            </View>
            <Skeleton style={{ width: 44, height: 26, borderRadius: 13 }} />
          </View>
        </View>
        {/* Components card */}
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
            <Skeleton style={{ height: 16, width: '35%', borderRadius: 4 }} />
          </View>
          <Skeleton style={{ height: 44, borderRadius: 6 }} />
        </View>
        {/* Action buttons skeleton */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton style={{ height: 44, flex: 1, borderRadius: 8 }} />
          <Skeleton style={{ height: 44, flex: 1, borderRadius: 8 }} />
        </View>
      </View>
    );
  }

  if (error || !paintType) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Erro ao carregar tipo de tinta
        </ThemedText>
        <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Tipo de Tinta",
          headerBackTitle: "Cancelar",
          headerRight: () => (
            <Button
              size="sm"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting || !isDirty}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          ),
        }}
      />
      <ScrollView
        style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <IconTag size={24} color={colors.primary} />
            <View style={styles.headerText}>
              <ThemedText style={styles.headerTitle}>Editar Tipo de Tinta</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Atualize as informações do tipo de tinta
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Basic Information */}
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <IconTag size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações Básicas</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>
                Nome <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="Ex: Poliéster, Acrílica, Poliuretano..."
                    error={!!errors.name}
                    errorMessage={errors.name?.message}
                  />
                )}
              />
            </View>
          </View>
        </Card>

        {/* Ground Configuration */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconDroplet size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Configuração de Fundo</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
              Define se este tipo de tinta requer aplicação de fundo
            </ThemedText>

            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <ThemedText style={styles.switchLabel}>Requer Fundo</ThemedText>
                <ThemedText style={[styles.switchDescription, { color: colors.mutedForeground }]}>
                  Tintas deste tipo exigirão seleção de fundos durante o cadastro
                </ThemedText>
              </View>
              <Controller
                control={control}
                name="needGround"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    checked={value}
                    onCheckedChange={onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </View>

            {needGround && (
              <View style={[styles.infoBox, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
                <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
                  ℹ️ Tintas deste tipo exigirão a seleção de fundos apropriados durante o cadastro.
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Component Items */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconBoxSeam size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Componentes</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
              Selecione os itens que podem ser usados como componentes em fórmulas deste tipo de tinta
            </ThemedText>

            <View style={styles.fieldContainer}>
              <Label>Itens de Componentes</Label>
              <Controller
                control={control}
                name="componentItemIds"
                render={({ field: { onChange, value } }) => (
                  <Combobox
                    mode="multiple"
                    options={componentItems}
                    value={Array.isArray(value) ? value : []}
                    onValueChange={onChange}
                    onCreate={() => {}}
                    placeholder="Selecione os componentes"
                    searchPlaceholder="Buscar itens..."
                    disabled={isSubmitting || isLoadingItems}
                    loading={isLoadingItems}
                  />
                )}
              />
              {errors.componentItemIds && (
                <ThemedText style={styles.errorText}>
                  {errors.componentItemIds.message}
                </ThemedText>
              )}
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.actionButton}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={styles.actionButton}
            disabled={!isValid || isSubmitting || !isDirty}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorText: {
    textAlign: "center",
    marginBottom: spacing.md,
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  headerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    lineHeight: 20,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  fieldContainer: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  required: {
    color: "#ef4444",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xxs,
  },
  switchDescription: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
