import React, { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useObservation, useObservationMutations } from "@/hooks";
import { useFormFlow } from "@/hooks/use-form-flow";
import {
  observationUpdateSchema,
  type ObservationUpdateFormData,
} from "@/schemas";
import { ThemedText, Card, Input, SimpleFormField } from "@/components/ui";
import { Alert as AlertBanner, AlertDescription } from "@/components/ui/alert";
import { IconAlertCircle, IconAlertTriangle } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { FormScreen } from "@/components/screens/form-screen";

export default function EditObservationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditObservationScreenInner key={id} />;
}

function EditObservationScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { updateAsync } = useObservationMutations();

  const query = useObservation(id as string, {
    include: {
      task: {
        select: {
          id: true,
          name: true,
          customer: { select: { id: true, fantasyName: true } },
          truck: { select: { id: true, plate: true } },
        },
      },
      files: true,
    },
  });

  const observation = query.data?.data;

  const form = useForm<ObservationUpdateFormData>({
    resolver: zodResolver(observationUpdateSchema),
    defaultValues: {
      description: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (observation) {
      form.reset({ description: observation.description });
    }
  }, [observation, form]);

  const flow = useFormFlow<ObservationUpdateFormData, any>({
    form,
    mutation: async (data) =>
      updateAsync({
        id: id as string,
        data,
      }),
    successRoute: () =>
      mobileRoute(routes.production.observations.details(id as string)),
    successAction: "replace",
    cancelFallback: mobileRoute(
      routes.production.observations.details(id as string),
    ),
  });

  const errors = form.formState.errors;

  return (
    <FormScreen<ObservationUpdateFormData, any>
      mode="edit"
      title="Editar Observação"
      form={form}
      flow={flow}
      privilege={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.WAREHOUSE,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      submittingLabel="Salvando..."
      submitLabel="Salvar Alterações"
      loadQuery={query as any}
    >
      {/* Privacy warning - observation data is visible to the whole company */}
      <AlertBanner variant="warning" icon={IconAlertTriangle} style={{ marginBottom: spacing.md }}>
        <AlertDescription>
          Ao enviar, os dados desta observação (descrição e arquivos) serão compartilhados com todos os usuários da empresa.
        </AlertDescription>
      </AlertBanner>

      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <IconAlertCircle size={24} color={colors.primary} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Editar Observação
            </ThemedText>
          </View>
        </View>
      </Card>

      {observation?.task && (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconAlertCircle size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Tarefa Vinculada</ThemedText>
            </View>
          </View>
          <View
            style={{
              backgroundColor: colors.muted + "20",
              padding: spacing.sm,
              borderRadius: 8,
            }}
          >
            <ThemedText style={{ fontWeight: "500" }}>
              {observation.task.name}
            </ThemedText>
            {observation.task.customer && (
              <ThemedText style={{ fontSize: 12, color: colors.muted }}>
                Cliente: {observation.task.customer.fantasyName}
              </ThemedText>
            )}
            {observation.task.truck && (
              <ThemedText style={{ fontSize: 12, color: colors.muted }}>
                Veículo: {observation.task.truck.model} - {observation.task.truck.plate}
              </ThemedText>
            )}
          </View>
        </Card>
      )}

      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconAlertCircle size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.sectionTitle}>
              Informações da Observação
            </ThemedText>
          </View>
        </View>
        <SimpleFormField label="Descrição" required error={errors.description}>
          <Controller
            control={form.control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Descreva a observação"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
                error={!!errors.description}
                style={{ minHeight: 120 }}
              />
            )}
          />
        </SimpleFormField>
      </Card>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    flex: 1,
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
});
