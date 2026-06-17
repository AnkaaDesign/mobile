import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { usePaintBrandMutations } from "@/hooks";
import { paintBrandCreateSchema } from "@/schemas";
import type { PaintBrandCreateFormData } from "@/schemas";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { IconTag } from "@tabler/icons-react-native";

export default function CreatePaintBrandScreen() {
  const { colors } = useTheme();
  const { createAsync } = usePaintBrandMutations();

  const form = useForm<PaintBrandCreateFormData>({
    resolver: zodResolver(paintBrandCreateSchema),
    defaultValues: {
      name: "",
    },
  });

  const flow = useFormFlow<PaintBrandCreateFormData, any>({
    form,
    mutation: async (data) => createAsync(data),
    successRoute: (result) => {
      const newId = (result as any)?.data?.id || (result as any)?.id;
      return newId
        ? mobileRoute(routes.painting.paintBrands.details(newId))
        : // `as any` avoids unioning two AppRoute values (TS2590 — generated Href union too complex)
          (mobileRoute(routes.painting.paintBrands.root) as any);
    },
    successAction: "replace",
    cancelFallback: mobileRoute(routes.painting.paintBrands.root),
  });

  const {
    control,
    formState: { errors },
  } = form;

  return (
    <FormScreen
      title="Nova Marca de Tinta"
      subtitle="Cadastre uma nova marca de tinta"
      mode="create"
      form={form}
      flow={flow}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      submitLabel="Criar Marca"
      submittingLabel="Criando..."
    >
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
