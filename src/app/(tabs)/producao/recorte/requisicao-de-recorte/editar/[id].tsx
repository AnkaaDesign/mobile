import React, { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCut, useCutMutations } from "@/hooks";
import { cutUpdateSchema } from "@/schemas";
import {
  CUT_STATUS,
  CUT_TYPE,
  CUT_ORIGIN,
  CUT_REQUEST_REASON,
  CUT_STATUS_LABELS,
  CUT_TYPE_LABELS,
  CUT_ORIGIN_LABELS,
  CUT_REQUEST_REASON_LABELS,
  SECTOR_PRIVILEGES,
} from "@/constants";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { IconAlertTriangle, IconDeviceFloppy, IconX, IconFileText } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";

export default function EditCuttingRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { update } = useCutMutations();

  // Permission check
  const canEdit = React.useMemo(() => {
    if (!user) return false;
    return (
      hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
      hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
      hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN)
    );
  }, [user]);

  // Fetch existing cut data
  const { data: response, isLoading, error } = useCut(id as string, {
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
    enabled: !!id,
  });

  const cut = response?.data;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<CutUpdateFormData>({
    resolver: zodResolver(cutUpdateSchema),
    defaultValues: {
      fileId: "",
      type: CUT_TYPE.VINYL,
      status: CUT_STATUS.PENDING,
      origin: CUT_ORIGIN.REQUEST,
      reason: null,
      taskId: null,
      parentCutId: null,
      startedAt: null,
      completedAt: null,
    },
    mode: "onChange",
  });

  const watchedOrigin = watch("origin");

  // Update form when cut data loads
  useEffect(() => {
    if (cut) {
      reset({
        fileId: cut.fileId,
        type: cut.type as CUT_TYPE,
        status: cut.status as CUT_STATUS,
        origin: cut.origin as CUT_ORIGIN,
        reason: cut.reason as CUT_REQUEST_REASON | null,
        taskId: cut.taskId,
        parentCutId: cut.parentCutId,
        startedAt: cut.startedAt ? new Date(cut.startedAt) : null,
        completedAt: cut.completedAt ? new Date(cut.completedAt) : null,
      });
    }
  }, [cut, reset]);

  const onSubmit = async (data: CutUpdateFormData) => {
    if (!canEdit) {
      Alert.alert("Erro", "Você não tem permissão para editar requisições de recorte");
      return;
    }

    if (!id) {
      Alert.alert("Erro", "ID da requisição de recorte não encontrado");
      return;
    }

    setIsSubmitting(true);
    try {
      await update({
        id: id as string,
        data,
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

      Alert.alert("Sucesso", "Requisição de recorte atualizada com sucesso!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar a requisição de recorte. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancelar", "Tem certeza que deseja cancelar? As alterações não serão salvas.", [
      { text: "Continuar Editando", style: "cancel" },
      {
        text: "Cancelar",
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  };

  // Permission gate
  if (!canEdit) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Requisição de Recorte",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para editar requisições de recorte. É necessário privilégio de Produção, Almoxarifado ou Administrador."
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Requisição de Recorte",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <LoadingScreen message="Carregando dados da requisição de recorte..." />
      </>
    );
  }

  if (error || !cut) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Requisição de Recorte",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Erro ao carregar requisição de recorte"
          detail={error?.message || "Requisição de recorte não encontrada"}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Requisição de Recorte",
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <IconAlertTriangle size={20} color={colors.mutedForeground} />
              <ThemedText style={{ fontSize: fontSize.lg, fontWeight: "500" }}>Editar Requisição de Recorte</ThemedText>
              <Badge variant="outline" style={{ marginLeft: "auto" }}>
                {CUT_STATUS_LABELS[cut.status as CUT_STATUS]}
              </Badge>
            </View>
            {cut.file && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs }}>
                <IconFileText size={14} color={colors.mutedForeground} />
                <ThemedText style={{ fontSize: 14, color: colors.muted }}>{cut.file.filename}</ThemedText>
              </View>
            )}
            {cut.task && (
              <ThemedText style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>
                Tarefa: {cut.task.name}
                {cut.task.customer && ` - ${cut.task.customer.fantasyName}`}
              </ThemedText>
            )}
          </Card>

          {/* File ID (Read-only - shown for reference) */}
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
                  editable={false}
                  style={{ opacity: 0.6 }}
                />
              )}
            />
            <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
              O arquivo não pode ser alterado após a criação
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

          {/* Request Reason */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Motivo da Requisição *</Label>
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
            <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
              Altere o status da requisição de recorte conforme o progresso
            </ThemedText>
          </Card>

          {/* Task ID (Optional - Read-only reference) */}
          {cut.taskId && (
            <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <Label style={{ marginBottom: spacing.xs }}>Tarefa</Label>
              <Controller
                control={control}
                name="taskId"
                render={({ field }) => (
                  <Input
                    value={field.value || ""}
                    onChangeText={(value) => field.onChange(value || null)}
                    placeholder="ID da tarefa"
                    autoCapitalize="none"
                    editable={false}
                    style={{ opacity: 0.6 }}
                  />
                )}
              />
              <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
                A tarefa vinculada não pode ser alterada
              </ThemedText>
            </Card>
          )}

          {/* Parent Cut ID (Optional - Read-only if exists) */}
          {cut.parentCutId && (
            <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <Label style={{ marginBottom: spacing.xs }}>Corte Pai (Retrabalho)</Label>
              <Controller
                control={control}
                name="parentCutId"
                render={({ field }) => (
                  <Input
                    value={field.value || ""}
                    onChangeText={(value) => field.onChange(value || null)}
                    placeholder="ID do corte pai"
                    autoCapitalize="none"
                    editable={false}
                    style={{ opacity: 0.6 }}
                  />
                )}
              />
              <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
                Esta é uma requisição de retrabalho. O corte pai não pode ser alterado.
              </ThemedText>
            </Card>
          )}

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
              <ThemedText style={{ color: "white" }}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </ThemedText>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
