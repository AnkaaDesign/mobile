import { useState } from "react";
import { View, ScrollView, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintBrand, usePaintBrandMutations, useScreenReady } from "@/hooks";
import { paintBrandUpdateSchema } from '../../../../../schemas';
import type { PaintBrandUpdateFormData } from '../../../../../schemas';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
// import { showToast } from "@/components/ui/toast";
import {
  IconTag,
} from "@tabler/icons-react-native";

export default function EditPaintBrandScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { update } = usePaintBrandMutations();

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.BASIC);

  // Fetch paint brand data
  // Fixed: PaintBrandGetUniqueResponse has a data property, need to extract it
  const { data: paintBrandResponse, isLoading, error } = usePaintBrand(id || "");
  const paintBrand = paintBrandResponse?.data;

  // Form setup
  const form = useForm<PaintBrandUpdateFormData>({
    resolver: zodResolver(paintBrandUpdateSchema),
    defaultValues: {
      name: paintBrand?.name || "",
    },
    values: paintBrand
      ? {
          name: paintBrand.name,
        }
      : undefined,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = form;

  // Handle form submission
  const onSubmit = async (data: PaintBrandUpdateFormData) => {
    if (!canEdit) {
      Alert.alert("Erro", "Você não tem permissão para editar");
      return;
    }

    if (!id) {
      Alert.alert("Erro", "ID da marca de tinta não encontrado");
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
          Você não tem permissão para editar marcas de tinta
        </ThemedText>
        <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando marca de tinta...</ThemedText>
      </View>
    );
  }

  if (error || !paintBrand) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Erro ao carregar marca de tinta
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
          title: "Editar Marca de Tinta",
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
              <ThemedText style={styles.headerTitle}>Editar Marca de Tinta</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Atualize as informações da marca de tinta
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Form */}
        <Card style={styles.formCard}>
          <View style={styles.formSection}>
            <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>

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
                    placeholder="Ex: Suvinil, Coral, Sherwin-Williams..."
                    error={!!errors.name}
                    errorMessage={errors.name?.message}
                  />
                )}
              />
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
  formCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  formSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
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
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
