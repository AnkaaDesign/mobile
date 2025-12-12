import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useObservationMutations, useTasks } from "@/hooks";
import { observationCreateSchema, type ObservationCreateFormData } from "@/schemas";
import { LoadingScreen, ErrorScreen, ThemedText, ThemedView, Card, Button, Input, Combobox, SimpleFormField } from "@/components/ui";
import { IconAlertCircle, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';

export default function CreateObservationScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAsync } = useObservationMutations();

  // Permission check
  // Team leadership is now determined by managedSector relationship
  const canCreate = React.useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           Boolean(user.managedSector?.id) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Fetch available tasks
  const {
    data: tasksResponse,
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useTasks({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      truck: true,
    },
  });

  const tasks = tasksResponse?.data || [];

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ObservationCreateFormData>({
    resolver: zodResolver(observationCreateSchema),
    defaultValues: {
      description: "",
      taskId: params.taskId || "",
      fileIds: [],
    },
    mode: "onChange",
  });

  const onSubmit = async (data: ObservationCreateFormData) => {
    if (!canCreate) {
      Alert.alert("Erro", "Você não tem permissão para criar observações");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAsync(data);

      Alert.alert(
        "Sucesso",
        "Observação criada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => {
              if (result?.data?.id) {
                router.replace(routeToMobilePath(routes.production.observations.details(result.data.id)) as any);
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível criar a observação. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar",
      "Tem certeza que deseja cancelar? Todos os dados serão perdidos.",
      [
        { text: "Continuar Editando", style: "cancel" },
        {
          text: "Cancelar",
          style: "destructive",
          onPress: () => router.push(routeToMobilePath(routes.production.observations.list) as any),
        },
      ]
    );
  };

  // Permission gate
  if (!canCreate) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para criar observações. É necessário privilégio de Produção, liderança de equipe ou Administrador."
        />
      </ThemedView>
    );
  }

  if (isLoadingTasks) {
    return <LoadingScreen />;
  }

  if (tasksError) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
        <ErrorScreen
          title="Erro ao carregar tarefas"
          message={tasksError?.message || "Não foi possível carregar as tarefas disponíveis"}
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
                    Cadastrar Observação
                  </ThemedText>
                </View>
              </View>
            </Card>

            {/* Form Fields */}
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconAlertCircle size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Informações da Observação</ThemedText>
                </View>
              </View>

              <SimpleFormField label="Tarefa" required error={errors.taskId}>
                <Controller
                  control={control}
                  name="taskId"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      value={value}
                      onValueChange={onChange}
                      options={tasks.length === 0 ? [] : tasks.map((task) => ({
                        label: `${task.name} - ${task.customer?.fantasyName || 'Sem cliente'}${task.truck?.plate ? ` - ${task.truck.plate}` : ''}`,
                        value: task.id,
                      }))}
                      placeholder="Selecione uma tarefa"
                      emptyText="Nenhuma tarefa disponível"
                      searchable={false}
                    />
                  )}
                />
              </SimpleFormField>

              <SimpleFormField label="Descrição" required error={errors.description}>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
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
      <SafeAreaView edges={[]} style={{ backgroundColor: colors.card }}>
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
            disabled={!isValid || isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconDeviceFloppy size={20} color={colors.primaryForeground} />
              <ThemedText style={{ color: colors.primaryForeground, marginLeft: 8 }}>
                {isSubmitting ? "Salvando..." : "Salvar Observação"}
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
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
});
