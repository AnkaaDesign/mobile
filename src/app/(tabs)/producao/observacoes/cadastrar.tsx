import React, { useCallback, useEffect, useRef, useState } from "react";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import {
  TUTORIAL_TARGETS,
  useOptionalTutorial,
  useTutorialTarget,
} from "@/components/tutorial";
import { tutorialMocks } from "@/components/tutorial/tutorial-mocks";


import { Skeleton } from "@/components/ui/skeleton";

export default function CreateObservationScreen() {
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate
      required={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.PRODUCTION,
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

  // Tutorial wiring — gate API calls and emit input/submit events.
  const tutorial = useOptionalTutorial();
  const isTutorialActive = !!tutorial?.isActive;

  const taskSelectTarget = useTutorialTarget(TUTORIAL_TARGETS.observacoesFormTaskSelect);
  const descriptionTarget = useTutorialTarget(TUTORIAL_TARGETS.observacoesFormDescription);
  const saveTarget = useTutorialTarget(TUTORIAL_TARGETS.observacoesFormSave);

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

  // In tutorial mode, ensure the demo tasks always appear in the picker even
  // if the real task query is empty/failing. This keeps the "do" step achievable.
  const tasks = React.useMemo(() => {
    const real = tasksResponse?.data || [];
    if (!isTutorialActive) return real;
    const seen = new Set(real.map((t: any) => t.id));
    const demoTasks = tutorialMocks.tasks.filter((t) => !seen.has(t.id));
    return [...demoTasks, ...real];
  }, [tasksResponse?.data, isTutorialActive]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
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

  // Watch form values to fire tutorial events.
  const watchedTaskId = watch("taskId");
  const watchedDescription = watch("description");

  // Defensive fallback for the preceding "tap the FAB" tutorial step:
  // if the user managed to land on this screen while the engine is still
  // waiting for `observacoesFab` (e.g. the overlay was bypassed or a deep
  // link was used), notify the engine immediately on mount.
  const fabFallbackFiredRef = useRef(false);
  useEffect(() => {
    if (!isTutorialActive) return;
    if (fabFallbackFiredRef.current) return;
    const stepTargetId = tutorial?.currentStep?.targetId;
    if (stepTargetId === TUTORIAL_TARGETS.observacoesFab) {
      fabFallbackFiredRef.current = true;
      tutorial?.notifyAction("tap", {
        targetId: TUTORIAL_TARGETS.observacoesFab,
      });
    }
    // We only care about the moment of mount/step-entry; depending on
    // currentStep's full identity is enough.
  }, [isTutorialActive, tutorial?.currentStep?.targetId, tutorial]);

  // In tutorial mode, seed any required field that we don't ask the user to
  // fill so that zod validation can pass and the Save button stays enabled.
  // The schema (observationCreateSchema) currently requires `taskId` (uuid)
  // and `description`. The task picker is satisfied when the user picks a
  // mock task — but mock task IDs are not real uuids, so zod's `.uuid()`
  // would reject them. To keep the demo flow always-completable, we fall
  // back to bypassing zod inside `handleSave` (see below) instead of
  // forcing values here. We still pre-fill `fileIds` to an empty array so
  // optional-but-present validators don't trip.
  useEffect(() => {
    if (!isTutorialActive) return;
    const current = getValues();
    if (!current.fileIds) {
      setValue("fileIds", [], { shouldDirty: false, shouldValidate: false });
    }
  }, [isTutorialActive, getValues, setValue]);

  // Fire `observacoes.taskSelected` once the task transitions empty → non-empty.
  const taskNotifiedRef = useRef(false);
  useEffect(() => {
    if (!isTutorialActive) return;
    if (taskNotifiedRef.current) return;
    if (watchedTaskId && watchedTaskId.length > 0) {
      taskNotifiedRef.current = true;
      tutorial?.notifyAction("input", { eventId: "observacoes.taskSelected" });
    }
  }, [isTutorialActive, watchedTaskId, tutorial]);

  // Fire `observacoes.descriptionTyped` once the description becomes non-empty.
  const descriptionNotifiedRef = useRef(false);
  useEffect(() => {
    if (!isTutorialActive) return;
    if (descriptionNotifiedRef.current) return;
    if (watchedDescription && watchedDescription.trim().length > 0) {
      descriptionNotifiedRef.current = true;
      tutorial?.notifyAction("input", { eventId: "observacoes.descriptionTyped" });
    }
  }, [isTutorialActive, watchedDescription, tutorial]);

  // Tracks whether `observacoes.saved` was emitted so the unmount cleanup
  // (useFocusEffect) doesn't double-advance the engine.
  const saveNotifiedRef = useRef(false);

  const onSubmit = async (data: ObservationCreateFormData) => {
    // Tutorial mode — never hit the real API. Notify the engine and bail out.
    if (isTutorialActive) {
      saveNotifiedRef.current = true;
      tutorial?.notifyAction("submit", { eventId: "observacoes.saved" });
      // Give the engine a moment to advance the step before navigating back.
      setTimeout(() => {
        try {
          router.back();
        } catch {
          router.replace(mobileRoute(routes.production.observations.list) as any);
        }
      }, 100);
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
                nav.dismissTo(mobileRoute(routes.production.observations.details(result.data.id)));
              } else {
                nav.goBack();
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

  /**
   * Save button handler.
   *
   * In tutorial mode we DO NOT route through `handleSubmit(onSubmit)` because
   * mock task IDs (e.g. `tut-00000001-aaaa-...`) are not real uuids and would
   * fail `observationCreateSchema.taskId.uuid()`, leaving zod errors in place
   * and silently swallowing the submit. Instead we bypass zod and call
   * `onSubmit` directly with whatever the form currently holds — `onSubmit`
   * already short-circuits to `notifyAction("submit", ...)` and does NOT hit
   * the API in tutorial mode, so any "invalid" values are inert.
   *
   * Outside tutorial mode this stays the standard zod-validated path.
   */
  const handleSave = isTutorialActive
    ? () => {
        void onSubmit(getValues() as ObservationCreateFormData);
      }
    : handleSubmit(onSubmit);

  // If the user navigates away from the cadastrar screen while the tutorial
  // is still expecting `observacoes.saved`, advance the engine ourselves so
  // it doesn't get stuck waiting forever for a Save tap that will never come.
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (!isTutorialActive) return;
        if (saveNotifiedRef.current) return;
        const step = tutorial?.currentStep;
        if (!step) return;
        if (
          step.targetId === TUTORIAL_TARGETS.observacoesFormSave ||
          step.targetId === TUTORIAL_TARGETS.observacoesFormDescription ||
          step.targetId === TUTORIAL_TARGETS.observacoesFormTaskSelect
        ) {
          // Best-effort skip: emit the saved event so the engine can advance
          // past the entire form-fill flow. Safe because tutorial mode never
          // hits the real API.
          try {
            tutorial?.notifyAction("submit", {
              eventId: "observacoes.saved",
            });
          } catch {}
        }
      };
    }, [isTutorialActive, tutorial])
  );

  const handleNavigateBack = () => {
    nav.goBack();
  };

  const handleCancel = () => {
    // During the tutorial, a "Cancelar" confirm modal would derail the flow.
    if (isTutorialActive) {
      handleNavigateBack();
      return;
    }
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

  // In tutorial mode, the demo tasks fallback keeps the form usable even while
  // the real query is loading or has failed.
  if (isLoadingTasks && !isTutorialActive) {
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

  if (tasksError && !isTutorialActive) {
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
              disabled={(!isTutorialActive && !isValid) || isSubmitting}
            >
              <IconDeviceFloppy size={20} color={(isTutorialActive || isValid) && !isSubmitting ? colors.primary : colors.muted} />
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

            <View
              ref={taskSelectTarget.ref}
              onLayout={taskSelectTarget.onLayout}
            >
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

            <View
              ref={descriptionTarget.ref}
              onLayout={descriptionTarget.onLayout}
            >
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
            <View ref={saveTarget.ref} onLayout={saveTarget.onLayout} style={{ flex: 1 }}>
              <Button
                style={{ flex: 1 }}
                onPress={handleSave}
                disabled={(!isTutorialActive && !isValid) || isSubmitting}
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
