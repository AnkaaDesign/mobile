import React, { useState } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useObservationMutations, useTasks } from "@/hooks";
import { observationCreateSchema, type ObservationCreateFormData } from "@/schemas";
import { LoadingScreen, ErrorScreen, ThemedText, Card, Button, Input, Combobox, SimpleFormField } from "@/components/ui";
import { IconAlertCircle, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';

export default function CreateObservationScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { goBack, getBackPath } = useNavigationHistory();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAsync } = useObservationMutations();

  // Permission check
  const canCreate = React.useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.COMMERCIAL) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.FINANCIAL) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
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

  const handleNavigateBack = () => {
    const backPath = getBackPath();
    if (backPath) {
      goBack();
    } else {
      router.push(routeToMobilePath(routes.production.observations.list) as any);
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
          onPress: handleNavigateBack,
        },
      ]
    );
  };

  // Permission gate
  if (!canCreate) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Cadastrar Observação",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para criar observações. É necessário privilégio de Produção, Comercial, Financeiro, Almoxarifado, liderança de equipe ou Administrador."
        />
      </>
    );
  }

  if (isLoadingTasks) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Cadastrar Observação",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <LoadingScreen />
      </>
    );
  }

  if (tasksError) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Cadastrar Observação",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          title="Erro ao carregar tarefas"
          message={tasksError?.message || "Não foi possível carregar as tarefas disponíveis"}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Cadastrar Observação",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Button variant="ghost" size="icon" onPress={handleCancel}>
              <IconX size={20} color={colors.foreground} />
            </Button>
          ),
          headerRight: () => (
            <Button
              variant="ghost"
              size="icon"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
            >
              <IconDeviceFloppy size={20} color={isValid && !isSubmitting ? colors.primary : colors.muted} />
            </Button>
          ),
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ padding: spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section Header */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <IconAlertCircle size={20} color={colors.mutedForeground} />
              <ThemedText style={{ fontSize: fontSize.lg, fontWeight: "500" }}>Informações da Observação</ThemedText>
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

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
            <Button variant="outline" style={{ flex: 1 }} onPress={handleCancel} disabled={isSubmitting}>
              <ThemedText>Cancelar</ThemedText>
            </Button>
            <Button
              style={{ flex: 1 }}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
            >
              <ThemedText style={{ color: "white" }}>{isSubmitting ? "Salvando..." : "Salvar Observação"}</ThemedText>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
