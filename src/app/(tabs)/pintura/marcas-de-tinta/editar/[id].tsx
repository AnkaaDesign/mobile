import { useState } from "react";
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintBrand, usePaintBrandMutations } from '../../../../../hooks';
import { paintBrandUpdateSchema } from '../../../../../schemas';
import type { PaintBrandUpdateFormData } from '../../../../../schemas';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../../constants';
import { hasPrivilege } from '../../../../../utils';
import { showToast } from "@/lib/toast/use-toast";
import {
  IconTag,
} from "@tabler/icons-react-native";

export default function EditPaintBrandScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { update } = usePaintBrandMutations();

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
      showToast("Você não tem permissão para editar", "error");
      return;
    }

    if (!id) {
      showToast("ID da marca de tinta não encontrado", "error");
      return;
    }

    if (!isDirty) {
      showToast("Nenhuma alteração foi feita", "info");
      return;
    }

    setIsSubmitting(true);

    try {
      await update({ id, data });
      showToast("Marca de tinta atualizada com sucesso", "success");
      router.back();
    } catch (error) {
      showToast("Erro ao atualizar marca de tinta", "error");
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
