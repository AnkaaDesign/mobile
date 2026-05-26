import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useObservationMutations, useTasks, useScreenReady} from '@/hooks';
import { observationCreateSchema, type ObservationCreateFormData } from "@/schemas";
import { ErrorScreen, ThemedText, Card, Button, Input, Combobox, SimpleFormField } from "@/components/ui";
import { IconAlertCircle, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useNav } from "@/contexts/nav";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";


import { Skeleton } from "@/components/ui/skeleton";

export default function CreateObservationScreen() {
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate
      required={{
        // PRODUCTION sector users cannot create observations (per business
        // rule: only ADMIN and COMMERCIAL author them). Excluded here so
        // direct URL navigation is blocked, not just the list FAB.
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.WAREHOUSE,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      fallback="unauthorized"
    >
      <CreateObservationScreenInner key={formKey} />
    </PrivilegeGate>
  );
}

function CreateObservationScreenInner() {
  const { colors } = useTheme();
  const nav = useNav();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAsync } = useObservationMutations();

  // Fetch available tasks
  const {
    data: tasksResponse,
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useTasks({
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          fantasyName: true,
        },
      },
      truck: {
        select: {
          id: true,
          plate: true,
        },
      },
    },
  });

  useScreenReady(!isLoadingTasks);

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
    setIsSubmitting(true);
    try {
      const result = await createAsync(data);

      if (result?.data?.id) {
        nav.dismissTo(mobileRoute(routes.production.observations.details(result.data.id)));
      } else {
        nav.goBack();
      }
    } catch {
      // Error toast is handled by the api-client interceptor.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = handleSubmit(onSubmit);

  const handleNavigateBack = () => {
    nav.goBack();
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
        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: spacing.md, gap: spacing.md }}>
            {/* Form card with task + description fields */}
            <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
              <Skeleton width="60%" height={18} style={{ marginBottom: spacing.md }} />
              {/* Tarefa field */}
              <View style={{ marginBottom: spacing.md }}>
                <Skeleton width="25%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
              {/* Descrição field */}
              <View style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="100%" height={120} borderRadius={8} />
              </View>
            </View>
          </View>
        </ScrollView>
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
              onPress={handleSave}
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

            <View>
              <SimpleFormField label="Tarefa" required error={errors.taskId}>
                <Controller
                  control={control}
                  name="taskId"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      value={value}
                      onValueChange={onChange}
                      options={tasks.length === 0 ? [] : tasks.map((task: any) => ({
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
            </View>

            <View>
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
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
            <Button variant="outline" style={{ flex: 1 }} onPress={handleCancel} disabled={isSubmitting}>
              <ThemedText>Cancelar</ThemedText>
            </Button>
            <View style={{ flex: 1 }}>
              <Button
                style={{ flex: 1 }}
                onPress={handleSave}
                disabled={!isValid || isSubmitting}
              >
                <ThemedText style={{ color: "white" }}>{isSubmitting ? "Salvando..." : "Salvar Observação"}</ThemedText>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
