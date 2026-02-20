import { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Stack, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintBrandMutations, useScreenReady } from "@/hooks";
import { paintBrandCreateSchema } from '../../../../schemas';
import type { PaintBrandCreateFormData } from '../../../../schemas';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
import { routeToMobilePath } from "@/utils/route-mapper";
import { routes } from "@/constants";
import {
  IconTag,
} from "@tabler/icons-react-native";

export default function CreatePaintBrandScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { create } = usePaintBrandMutations();

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check user permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.BASIC);

  // Form setup
  const form = useForm<PaintBrandCreateFormData>({
    resolver: zodResolver(paintBrandCreateSchema),
    defaultValues: {
      name: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  // Handle form submission
  const onSubmit = async (data: PaintBrandCreateFormData) => {
    if (!canCreate) {
      Alert.alert("Erro", "Você não tem permissão para criar");
      return;
    }

    if (!isValid) {
      Alert.alert("Erro", "Por favor, corrija os erros no formulário");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await create(data);
      const newId = (result as any)?.data?.id || (result as any)?.id;
      if (newId) {
        router.replace(routeToMobilePath(routes.painting.paintBrands.details(newId)) as any);
      } else {
        router.back();
      }
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

  if (!canCreate) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Você não tem permissão para criar marcas de tinta
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
          title: "Nova Marca de Tinta",
          headerBackTitle: "Cancelar",
          headerRight: () => (
            <Button
              size="sm"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
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
              <ThemedText style={styles.headerTitle}>Nova Marca de Tinta</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Cadastre uma nova marca de tinta para categorizar tintas
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
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Criando..." : "Criar Marca"}
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
