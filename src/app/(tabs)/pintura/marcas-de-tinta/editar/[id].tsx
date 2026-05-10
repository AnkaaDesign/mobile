import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { usePaintBrand, usePaintBrandMutations } from "@/hooks";
import { paintBrandUpdateSchema } from "@/schemas";
import type { PaintBrandUpdateFormData } from "@/schemas";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { IconTag } from "@tabler/icons-react-native";

export default function EditPaintBrandScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { updateAsync } = usePaintBrandMutations();

  const loadQuery = usePaintBrand(id || "", {});
  const paintBrand = (loadQuery.data as any)?.data;

  const form = useForm<PaintBrandUpdateFormData>({
    resolver: zodResolver(paintBrandUpdateSchema),
    defaultValues: {
      name: paintBrand?.name || "",
    },
    values: paintBrand ? { name: paintBrand.name } : undefined,
  });

  const flow = useFormFlow<PaintBrandUpdateFormData, any>({
    form,
    mutation: async (data) => updateAsync({ id: id!, data }),
    successRoute: () => mobileRoute(routes.painting.paintBrands.details(id!)),
    successAction: "replace",
    cancelFallback: mobileRoute(routes.painting.paintBrands.details(id!)),
  });

  const {
    control,
    formState: { errors },
  } = form;

  return (
    <FormScreen
      title="Editar Marca de Tinta"
      subtitle="Atualize as informações da marca de tinta"
      mode="edit"
      form={form}
      flow={flow}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      loadQuery={loadQuery as any}
      submitLabel="Salvar Alterações"
      submittingLabel="Salvando..."
    >
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
    </FormScreen>
  );
}

const styles = StyleSheet.create({
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
});
