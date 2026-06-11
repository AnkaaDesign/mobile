import { useState } from "react";
import { Stack } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useCutMutations, useScreenReady} from '@/hooks';
import { cutCreateSchema, type CutCreateFormData } from "@/schemas";
import {
  CUT_STATUS,
  CUT_TYPE,
  CUT_ORIGIN,
  CUT_STATUS_LABELS,
  CUT_TYPE_LABELS,
  CUT_REQUEST_REASON_LABELS,
  SECTOR_PRIVILEGES,
} from "@/constants";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { IconScissors, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useNav } from "@/contexts/nav";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { mobileRoute } from "@/constants/routes.types";
import { routes } from "@/constants";

export default function CreateCuttingScreen() {
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate
      // Mirrors API POST /cuts roles: DESIGNER + ADMIN (2026-06-10 audit).
      required={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.DESIGNER,
        ],
      }}
      fallback="unauthorized"
    >
      <CreateCuttingScreenInner key={formKey} />
    </PrivilegeGate>
  );
}

function CreateCuttingScreenInner() {
  useScreenReady();
  const { colors } = useTheme();
  const nav = useNav();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAsync } = useCutMutations();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CutCreateFormData>({
    resolver: zodResolver(cutCreateSchema),
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

  const onSubmit = async (data: CutCreateFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createAsync(data);

      const newId = (result as any)?.data?.id || (result as any)?.id;
      if (newId) {
        nav.dismissTo(mobileRoute(routes.production.cutting.details(newId)));
      } else {
        nav.goBack();
      }
    } catch {
      // Error toast is handled by the api-client interceptor.
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
        onPress: () => nav.goBack(),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Novo Recorte",
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
              <IconScissors size={20} color={colors.mutedForeground} />
              <ThemedText style={{ fontSize: fontSize.lg, fontWeight: "500" }}>Novo Recorte</ThemedText>
            </View>
            <ThemedText style={{ fontSize: 14, color: colors.muted }}>
              Preencha as informações para criar um novo recorte
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

          {/* Request Reason - Optional */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Motivo da Requisição</Label>
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
                  placeholder="Selecione o motivo (opcional)"
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
