import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCutMutations } from "@/hooks";
import { cutCreateSchema} from "@/schemas";
import {
  CUT_STATUS,
  CUT_TYPE,
  CUT_ORIGIN,
  CUT_STATUS_LABELS,
  CUT_TYPE_LABELS,
  CUT_ORIGIN_LABELS,
  SECTOR_PRIVILEGES,
} from "@/constants";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { IconScissors, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";

export default function CreateCuttingPlanScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAsync } = useCutMutations();

  // Permission check
  const canCreate = React.useMemo(() => {
    if (!user) return false;
    return (
      hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
      hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
      hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN)
    );
  }, [user]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CutCreateFormData>({
    resolver: zodResolver(cutCreateSchema),
    defaultValues: {
      fileId: "",
      type: CUT_TYPE.VINYL,
      status: CUT_STATUS.PENDING,
      origin: CUT_ORIGIN.PLAN,
      reason: null,
      taskId: null,
      parentCutId: null,
      startedAt: null,
      completedAt: null,
    },
    mode: "onChange",
  });

  const watchedOrigin = watch("origin");

  const onSubmit = async (data: CutCreateFormData) => {
    if (!canCreate) {
      Alert.alert("Erro", "Você não tem permissão para criar planos de recorte");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAsync({
        ...data,
        include: {
          file: true,
          task: {
            include: {
              customer: true,
            },
          },
          parentCut: {
            include: {
              file: true,
            },
          },
        },
      });

      Alert.alert("Sucesso", "Plano de recorte criado com sucesso!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível criar o plano de recorte. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancelar", "Tem certeza que deseja cancelar? Todos os dados serão perdidos.", [
      { text: "Continuar Editando", style: "cancel" },
      {
        text: "Cancelar",
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  };

  // Permission gate
  if (!canCreate) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Criar Plano de Recorte",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para criar planos de recorte. É necessário privilégio de Produção, Almoxarifado ou Administrador."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Criar Plano de Recorte",
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
          {/* Header */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs }}>
              <IconScissors size={20} color={colors.primary} />
              <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>Novo Plano de Recorte</ThemedText>
            </View>
            <ThemedText style={{ fontSize: 14, color: colors.muted }}>
              Preencha as informações para criar um novo plano de recorte
            </ThemedText>
          </Card>

          {/* File Selection */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Arquivo *</Label>
            <Controller
              control={control}
              name="fileId"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="ID do arquivo de corte"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.fileId && (
              <ThemedText style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}>
                {errors.fileId.message}
              </ThemedText>
            )}
            <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
              Insira o UUID do arquivo de corte
            </ThemedText>
          </Card>

          {/* Cut Type */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Tipo de Corte *</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={Object.entries(CUT_TYPE_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  placeholder="Selecione o tipo"
                />
              )}
            />
            {errors.type && (
              <ThemedText style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}>
                {errors.type.message}
              </ThemedText>
            )}
          </Card>

          {/* Cut Origin */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Origem *</Label>
            <Controller
              control={control}
              name="origin"
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={Object.entries(CUT_ORIGIN_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  placeholder="Selecione a origem"
                />
              )}
            />
            {errors.origin && (
              <ThemedText style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}>
                {errors.origin.message}
              </ThemedText>
            )}
          </Card>

          {/* Request Reason - only show if origin is REQUEST */}
          {watchedOrigin === CUT_ORIGIN.REQUEST && (
            <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <Label style={{ marginBottom: spacing.xs }}>Motivo da Solicitação *</Label>
              <Controller
                control={control}
                name="reason"
                render={({ field }) => (
                  <Combobox
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value || null)}
                    options={Object.entries(CUT_REQUEST_REASON_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    placeholder="Selecione o motivo"
                  />
                )}
              />
              {errors.reason && (
                <ThemedText style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}>
                  {errors.reason.message}
                </ThemedText>
              )}
            </Card>
          )}

          {/* Status */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Combobox
                  value={field.value || CUT_STATUS.PENDING}
                  onValueChange={field.onChange}
                  options={Object.values(CUT_STATUS).map((status) => ({
                    value: status,
                    label: CUT_STATUS_LABELS[status as keyof typeof CUT_STATUS_LABELS],
                  }))}
                  placeholder="Selecione o status"
                />
              )}
            />
          </Card>

          {/* Task ID (Optional) */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Tarefa (Opcional)</Label>
            <Controller
              control={control}
              name="taskId"
              render={({ field }) => (
                <Input
                  value={field.value || ""}
                  onChangeText={(value) => field.onChange(value || null)}
                  placeholder="ID da tarefa (opcional)"
                  autoCapitalize="none"
                />
              )}
            />
            <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
              Insira o UUID da tarefa relacionada (opcional)
            </ThemedText>
          </Card>

          {/* Parent Cut ID (Optional - for recuts) */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Corte Pai (Para Retrabalho)</Label>
            <Controller
              control={control}
              name="parentCutId"
              render={({ field }) => (
                <Input
                  value={field.value || ""}
                  onChangeText={(value) => field.onChange(value || null)}
                  placeholder="ID do corte pai (opcional)"
                  autoCapitalize="none"
                />
              )}
            />
            <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
              Insira o UUID do corte original para criar um retrabalho (opcional)
            </ThemedText>
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
              <ThemedText style={{ color: "white" }}>{isSubmitting ? "Salvando..." : "Criar"}</ThemedText>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
