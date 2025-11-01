import React, { useState } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAirbrushingMutations } from '../../../../hooks';
import { useTasks } from '../../../../hooks';
import { airbrushingCreateSchema, type AirbrushingCreateFormData } from '../../../../schemas';
import { AIRBRUSHING_STATUS, AIRBRUSHING_STATUS_LABELS } from '../../../../constants';
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { IconBrush, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import { formatCurrency } from '../../../../utils';

export default function AirbrushingCreateScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAsync } = useAirbrushingMutations();

  // Permission check
  const canCreate = React.useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) ||
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
    // Only show tasks that don't have airbrushing yet
    where: {
      airbrushing: null,
    },
  });

  const tasks = tasksResponse?.data || [];

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    
    
  } = useForm<AirbrushingCreateFormData>({
    resolver: zodResolver(airbrushingCreateSchema),
    defaultValues: {
      status: AIRBRUSHING_STATUS.PENDING,
      price: null,
      startDate: null,
      finishDate: null,
    },
    mode: "onChange",
  });

  const watchedPrice = watch("price");

  const onSubmit = async (data: AirbrushingCreateFormData) => {
    if (!canCreate) {
      Alert.alert("Erro", "Você não tem permissão para criar airbrushing");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAsync({
        ...data,
        // Convert price to number if it's a string
        price: typeof data.price === 'string' ? parseFloat(data.price) || null : data.price,
      });

      Alert.alert(
        "Sucesso",
        "Airbrushing criado com sucesso!",
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
        error?.message || "Não foi possível criar o airbrushing. Tente novamente."
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
          onPress: () => router.back(),
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
            title: "Criar Airbrushing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para criar airbrushing. É necessário privilégio de Produção, Líder ou Administrador."
        />
      </>
    );
  }

  if (isLoadingTasks) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Criar Airbrushing",
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
            title: "Criar Airbrushing",
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
          title: "Criar Airbrushing",
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
              <IconDeviceFloppy
                size={20}
                color={isValid && !isSubmitting ? colors.primary : colors.muted}
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
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs }}>
              <IconBrush size={20} color={colors.primary} />
              <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
                Novo Airbrushing
              </ThemedText>
            </View>
            <ThemedText style={{ fontSize: 14, color: colors.muted }}>
              Preencha as informações para criar um novo airbrushing
            </ThemedText>
          </Card>

          {/* Task Selection */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Tarefa *</Label>
            <Controller
              control={control}
              name="taskId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma tarefa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhuma tarefa disponível
                      </SelectItem>
                    ) : (
                      tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.name} - {task.customer?.fantasyName} - {task.truck?.plate}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.taskId && (
              <ThemedText style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}>
                {errors.taskId.message}
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
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AIRBRUSHING_STATUS).map((status) => (
                      <SelectItem key={status} value={status}>
                        {AIRBRUSHING_STATUS_LABELS[status as keyof typeof AIRBRUSHING_STATUS_LABELS]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Card>

          {/* Dates */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <ThemedText style={{ fontSize: 16, fontWeight: "500", marginBottom: spacing.md }}>
              Datas
            </ThemedText>

            <View style={{ gap: spacing.md }}>
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
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Label style={{ marginBottom: spacing.xs }}>Preço (R$)</Label>
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <Input
                  value={field.value?.toString() || ""}
                  onChangeText={(text) => {
                    // Allow only numbers and decimal point
                    const cleanText = text.replace(/[^0-9.,]/g, '').replace(',', '.');
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
              disabled={!isValid || isSubmitting}
            >
              <ThemedText style={{ color: "white" }}>
                {isSubmitting ? "Salvando..." : "Criar"}
              </ThemedText>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}