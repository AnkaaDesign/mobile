import React, { useState, useEffect } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAirbrushingDetail, useAirbrushingMutations } from "@/hooks";
import { useTasks } from "@/hooks";
import { airbrushingUpdateSchema, mapAirbrushingToFormData, type AirbrushingUpdateFormData } from '../../../../../schemas';
import { AIRBRUSHING_STATUS, AIRBRUSHING_STATUS_LABELS } from "@/constants";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { IconBrush, IconDeviceFloppy, IconX, IconClock, IconTag, IconFileText } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";
import { formatCurrency } from "@/utils";

export default function AirbrushingEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateAsync } = useAirbrushingMutations();

  // Permission check
  const canEdit = React.useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Fetch airbrushing data
  const {
    data: airbrushingResponse,
    isLoading: isLoadingAirbrushing,
    error: airbrushingError,
  } = useAirbrushingDetail(id as string, {
    include: {
      task: {
        include: {
          customer: true,
          truck: true,
        },
      },
    },
  });

  const airbrushing = airbrushingResponse?.data;

  // Fetch available tasks (including current one)
  const {
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useTasks({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      truck: true,
    },
    // Show tasks that don't have airbrushing OR the current task
    where: {
      OR: [
        { airbrushing: null },
        { id: airbrushing?.taskId },
      ],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    
    reset,
  } = useForm<AirbrushingUpdateFormData>({
    resolver: zodResolver(airbrushingUpdateSchema),
    defaultValues: {
      status: AIRBRUSHING_STATUS.PENDING,
      price: null,
      startDate: null,
      finishDate: null,
    },
    mode: "onChange",
  });

  const watchedPrice = watch("price");

  // Update form when airbrushing data loads
  useEffect(() => {
    if (airbrushing) {
      const formData = mapAirbrushingToFormData(airbrushing);
      reset(formData);
    }
  }, [airbrushing, reset]);

  const onSubmit = async (data: AirbrushingUpdateFormData) => {
    if (!canEdit) {
      Alert.alert("Erro", "Você não tem permissão para editar airbrushing");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAsync({
        id: id as string,
        data: {
          ...data,
          // Convert price to number if it's a string
          price: typeof data.price === 'string' ? parseFloat(data.price) || null : data.price,
        },
      });

      Alert.alert(
        "Sucesso",
        "Airbrushing atualizado com sucesso!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível atualizar o airbrushing. Tente novamente."
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
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  // Permission gate
  if (!canEdit) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Airbrushing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para editar airbrushing. É necessário privilégio de Produção, Líder ou Administrador."
        />
      </>
    );
  }

  if (isLoadingAirbrushing || isLoadingTasks) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Airbrushing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <LoadingScreen />
      </>
    );
  }

  if (airbrushingError || tasksError || !airbrushing) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Airbrushing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          title="Erro ao carregar dados"
          message={airbrushingError?.message || tasksError?.message || "Airbrushing não encontrado"}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Airbrushing",
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
              disabled={!isValid || !isDirty || isSubmitting}
            >
              <IconDeviceFloppy
                size={20}
                color={isValid && isDirty && !isSubmitting ? colors.primary : colors.muted}
              />
            </Button>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ padding: spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Card style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconBrush size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Editar Airbrushing</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <ThemedText style={{ fontSize: 14, color: colors.muted }}>
                Edite as informações do airbrushing
              </ThemedText>
            </View>
          </Card>

          {/* Task Information (Read-only) */}
          {airbrushing.task && (
            <Card style={[styles.card, { marginBottom: spacing.md }]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconTag size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Tarefa Vinculada</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <View style={{ backgroundColor: colors.muted + "20", padding: spacing.sm, borderRadius: 8 }}>
                  <ThemedText style={{ fontWeight: "500" }}>
                    {airbrushing.task.name}
                  </ThemedText>
                  {airbrushing.task.customer && (
                    <ThemedText style={{ fontSize: 12, color: colors.muted }}>
                      Cliente: {airbrushing.task.customer.fantasyName}
                    </ThemedText>
                  )}
                  {airbrushing.task.truck && (
                    <ThemedText style={{ fontSize: 12, color: colors.muted }}>
                      Veículo: {airbrushing.task.truck.model} - {airbrushing.task.truck.plate}
                    </ThemedText>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Status */}
          <Card style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconFileText size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Status</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <Label style={{ marginBottom: spacing.xs }}>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={Object.values(AIRBRUSHING_STATUS).map((status) => ({
                      value: status,
                      label: AIRBRUSHING_STATUS_LABELS[status as keyof typeof AIRBRUSHING_STATUS_LABELS],
                    }))}
                    placeholder="Selecione o status"
                  />
                )}
              />
            </View>
          </Card>

          {/* Dates */}
          <Card style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconClock size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Datas</ThemedText>
              </View>
            </View>

            <View style={[styles.content, { gap: spacing.md }]}>
              <View>
                <Label style={{ marginBottom: spacing.xs }}>Data de Início</Label>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      placeholder="Selecione a data de início"
                    />
                  )}
                />
              </View>

              <View>
                <Label style={{ marginBottom: spacing.xs }}>Data de Finalização</Label>
                <Controller
                  control={control}
                  name="finishDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      placeholder="Selecione a data de finalização"
                    />
                  )}
                />
              </View>
            </View>
          </Card>

          {/* Price */}
          <Card style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconTag size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Preço</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <Label style={{ marginBottom: spacing.xs }}>Preço (R$)</Label>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <Input
                    value={field.value?.toString() || ""}
                    onChangeText={(text) => {
                      // Allow only numbers and decimal point
                      const cleanText = String(text || '').replace(/[^0-9.,]/g, '').replace(',', '.');
                      const numValue = cleanText ? parseFloat(cleanText) : null;
                      field.onChange(numValue);
                    }}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                )}
              />
              {watchedPrice && (
                <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
                  {formatCurrency(watchedPrice)}
                </ThemedText>
              )}
              {errors.price && (
                <ThemedText style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}>
                  {errors.price.message}
                </ThemedText>
              )}
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
            <Button
              variant="outline"
              style={{ flex: 1 }}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <ThemedText>Cancelar</ThemedText>
            </Button>
            <Button
              style={{ flex: 1 }}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || !isDirty || isSubmitting}
            >
              <ThemedText style={{ color: "white" }}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </ThemedText>
            </Button>
          </View>

          {/* Status Info */}
          {!isDirty && (
            <View style={{ marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.muted + "10", borderRadius: 8 }}>
              <ThemedText style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
                Faça alterações para habilitar o botão salvar
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
});