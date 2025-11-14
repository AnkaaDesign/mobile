import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useObservation, useObservationMutations } from "@/hooks";
import { observationUpdateSchema} from "@/schemas";
import { ErrorScreen, ThemedText, ThemedView, Card, Button, Input, Skeleton, SimpleFormField } from "@/components/ui";
import { IconAlertCircle, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";

export default function EditObservationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateAsync } = useObservationMutations();

  // Permission check
  const canEdit = React.useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Fetch observation data
  const {
    data: observationResponse,
    isLoading: isLoadingObservation,
    error: observationError,
  } = useObservation(id as string, {
    include: {
      task: {
        include: {
          customer: true,
          truck: true,
        },
      },
      files: true,
    },
  });

  const observation = observationResponse?.data;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<ObservationUpdateFormData>({
    resolver: zodResolver(observationUpdateSchema),
    defaultValues: {
      description: "",
    },
    mode: "onChange",
  });

  // Update form when observation data loads
  useEffect(() => {
    if (observation) {
      reset({
        description: observation.description,
      });
    }
  }, [observation, reset]);

  const onSubmit = async (data: ObservationUpdateFormData) => {
    if (!canEdit) {
      Alert.alert("Erro", "Você não tem permissão para editar observações");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAsync({
        id: id as string,
        data,
      });

      Alert.alert(
        "Sucesso",
        "Observação atualizada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => router.push(routeToMobilePath(routes.production.observations.details(id!)) as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível atualizar a observação. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        "Cancelar",
        "Tem certeza que deseja cancelar? Todas as alterações serão perdidas.",
        [
          { text: "Continuar Editando", style: "cancel" },
          {
            text: "Cancelar",
            style: "destructive",
            onPress: () => router.push(routeToMobilePath(routes.production.observations.details(id!)) as any),
          },
        ]
      );
    } else {
      router.push(routeToMobilePath(routes.production.observations.details(id!)) as any);
    }
  };

  // Permission gate
  if (!canEdit) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para editar observações. É necessário privilégio de Produção, Líder ou Administrador."
        />
      </ThemedView>
    );
  }

  if (isLoadingObservation) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Card style={styles.card}>
              <Skeleton height={24} width="60%" />
              <View style={styles.skeletonRows}>
                <Skeleton height={48} width="100%" />
                <Skeleton height={120} width="100%" />
              </View>
            </Card>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (observationError || !observation) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
        <ErrorScreen
          title="Erro ao carregar observação"
          message={observationError?.message || "Observação não encontrada"}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header Card */}
            <Card style={styles.headerCard}>
              <View style={styles.headerContent}>
                <View style={[styles.headerLeft, { flex: 1 }]}>
                  <IconAlertCircle size={24} color={colors.primary} />
                  <ThemedText style={StyleSheet.flatten([styles.title, { color: colors.foreground }])}>
                    Editar Observação
                  </ThemedText>
                </View>
              </View>
            </Card>

            {/* Task Information (Read-only) */}
            {observation.task && (
              <Card style={styles.card}>
                <ThemedText style={styles.sectionTitle}>Tarefa Vinculada</ThemedText>
                <View style={{ backgroundColor: colors.muted + "20", padding: spacing.sm, borderRadius: 8 }}>
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

            {/* Form Fields */}
            <Card style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Informações da Observação</ThemedText>

              <SimpleFormField label="Descrição" required error={errors.description}>
                <Controller
                  control={control}
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

            {/* Bottom spacing */}
            <View style={{ height: spacing.md }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.card }}>
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: spacing.xl,
            },
          ]}
        >
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconX size={20} color={colors.foreground} />
              <ThemedText style={{ color: colors.foreground, marginLeft: 8 }}>Cancelar</ThemedText>
            </>
          </Button>

          <Button
            variant="default"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || !isDirty || isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconDeviceFloppy size={20} color={colors.primaryForeground} />
              <ThemedText style={{ color: colors.primaryForeground, marginLeft: 8 }}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </ThemedText>
            </>
          </Button>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  card: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  skeletonRows: {
    gap: 8,
    marginTop: spacing.md,
  },
});
