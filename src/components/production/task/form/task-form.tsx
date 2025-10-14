import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useCustomers, useSectors, usePaints } from '../../../../hooks';
import { TASK_STATUS, SERVICE_ORDER_STATUS } from '../../../../constants';
import { IconLoader } from "@tabler/icons-react-native";

// Simplified Task Form Schema for Mobile
const taskFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(200, "Nome muito longo"),
  customerId: z.string().uuid("Cliente é obrigatório").min(1, "Cliente é obrigatório"),
  sectorId: z.string().uuid().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  plate: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  entryDate: z.date().nullable().optional(),
  term: z.date().nullable().optional(),
  price: z.number().nullable().optional(),
  generalPaintingId: z.string().uuid().nullable().optional(),
  paintIds: z.array(z.string().uuid()).optional(),
  services: z.array(z.object({
    description: z.string().min(3, "Mínimo de 3 caracteres"),
    status: z.enum(Object.values(SERVICE_ORDER_STATUS) as [string, ...string[]]).optional(),
  })).min(1, "Pelo menos um serviço é obrigatório"),
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
  startedAt: z.date().nullable().optional(),
  finishedAt: z.date().nullable().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  mode: "create" | "edit";
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TASK_STATUS_OPTIONS = [
  { value: TASK_STATUS.PENDING, label: "Pendente" },
  { value: TASK_STATUS.IN_PRODUCTION, label: "Em Produção" },
  { value: TASK_STATUS.ON_HOLD, label: "Em Espera" },
  { value: TASK_STATUS.COMPLETED, label: "Concluída" },
  { value: TASK_STATUS.CANCELLED, label: "Cancelada" },
];

export function TaskForm({ mode, initialData, onSubmit, onCancel, isSubmitting }: TaskFormProps) {
  const { colors } = useTheme();
  const [customerSearch, setCustomerSearch] = useState("");
  const [sectorSearch, setSectorSearch] = useState("");
  const [paintSearch, setPaintSearch] = useState("");

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      customerId: initialData?.customerId || "",
      sectorId: initialData?.sectorId || null,
      serialNumber: initialData?.serialNumber || null,
      plate: initialData?.plate || null,
      details: initialData?.details || null,
      entryDate: initialData?.entryDate || null,
      term: initialData?.term || null,
      price: initialData?.price || null,
      generalPaintingId: initialData?.generalPaintingId || null,
      paintIds: initialData?.paintIds || [],
      services: initialData?.services || [{ description: "", status: SERVICE_ORDER_STATUS.PENDING }],
      status: initialData?.status || TASK_STATUS.PENDING,
      startedAt: initialData?.startedAt || null,
      finishedAt: initialData?.finishedAt || null,
    },
  });

  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers({
    searchingFor: customerSearch,
    orderBy: { fantasyName: "asc" },
  });

  // Fetch sectors (production only)
  const { data: sectors, isLoading: isLoadingSectors } = useSectors({
    searchingFor: sectorSearch,
    orderBy: { name: "asc" },
  });

  // Fetch paints
  const { data: paints, isLoading: isLoadingPaints } = usePaints({
    searchingFor: paintSearch,
    orderBy: { name: "asc" },
  });

  const customerOptions = customers?.data?.map((customer) => ({
    value: customer.id,
    label: customer.fantasyName,
  })) || [];

  const sectorOptions = sectors?.data?.map((sector) => ({
    value: sector.id,
    label: sector.name,
  })) || [];

  const paintOptions = paints?.data?.map((paint) => ({
    value: paint.id,
    label: paint.name,
  })) || [];

  // Add service
  const addService = () => {
    const services = form.getValues("services");
    form.setValue("services", [...services, { description: "", status: SERVICE_ORDER_STATUS.PENDING }]);
  };

  // Remove service
  const removeService = (index: number) => {
    const services = form.getValues("services");
    if (services.length > 1) {
      form.setValue("services", services.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (data: TaskFormData) => {
    await onSubmit(data);
  };

  return (
    <FormProvider {...form}>
      <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Basic Information */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* Name */}
              <Controller
                control={form.control}
                name="name"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Nome da Tarefa *</Label>
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder="Ex: Pintura completa do caminhão"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Customer */}
              <Controller
                control={form.control}
                name="customerId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Cliente *</Label>
                    <Combobox
                      value={value}
                      onValueChange={onChange}
                      options={customerOptions}
                      placeholder="Selecione o cliente"
                      searchPlaceholder="Buscar cliente..."
                      emptyText="Nenhum cliente encontrado"
                      onSearchChange={setCustomerSearch}
                      disabled={isSubmitting || isLoadingCustomers}
                      loading={isLoadingCustomers}
                      clearable={false}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Serial Number */}
              <Controller
                control={form.control}
                name="serialNumber"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Número de Série</Label>
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Ex: ABC-123456"
                      disabled={isSubmitting}
                      autoCapitalize="characters"
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Plate */}
              <Controller
                control={form.control}
                name="plate"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Placa</Label>
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Ex: ABC1234"
                      disabled={isSubmitting}
                      autoCapitalize="characters"
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Sector */}
              <Controller
                control={form.control}
                name="sectorId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Setor</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={sectorOptions}
                      placeholder="Selecione o setor"
                      searchPlaceholder="Buscar setor..."
                      emptyText="Nenhum setor encontrado"
                      onSearchChange={setSectorSearch}
                      disabled={isSubmitting || isLoadingSectors}
                      loading={isLoadingSectors}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Status (edit mode only) */}
              {mode === "edit" && (
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Label>Status</Label>
                      <Combobox
                        value={value || TASK_STATUS.PENDING}
                        onValueChange={onChange}
                        options={TASK_STATUS_OPTIONS}
                        placeholder="Selecione o status"
                        disabled={isSubmitting}
                        searchable={false}
                      />
                      {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                    </View>
                  )}
                />
              )}

              {/* Details */}
              <Controller
                control={form.control}
                name="details"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Detalhes</Label>
                    <Textarea
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Detalhes adicionais sobre a tarefa..."
                      disabled={isSubmitting}
                      numberOfLines={4}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Dates */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Datas</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* Entry Date */}
              <Controller
                control={form.control}
                name="entryDate"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Data de Entrada</Label>
                    <DatePicker
                      value={value}
                      onChange={onChange}
                      type="date"
                      placeholder="Selecione a data"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Term/Deadline */}
              <Controller
                control={form.control}
                name="term"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Prazo de Entrega</Label>
                    <DatePicker
                      value={value}
                      onChange={onChange}
                      type="datetime"
                      placeholder="Selecione o prazo"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Started At (edit only) */}
              {mode === "edit" && (
                <Controller
                  control={form.control}
                  name="startedAt"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Label>Data de Início</Label>
                      <DatePicker
                        value={value}
                        onChange={onChange}
                        type="datetime"
                        placeholder="Selecione a data de início"
                        disabled={isSubmitting}
                      />
                      {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                    </View>
                  )}
                />
              )}

              {/* Finished At (edit only) */}
              {mode === "edit" && (
                <Controller
                  control={form.control}
                  name="finishedAt"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Label>Data de Conclusão</Label>
                      <DatePicker
                        value={value}
                        onChange={onChange}
                        type="datetime"
                        placeholder="Selecione a data de conclusão"
                        disabled={isSubmitting}
                      />
                      {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                    </View>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Financial */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Informações Financeiras</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <Controller
                control={form.control}
                name="price"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Valor Total</Label>
                    <Input
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const numValue = parseFloat(text);
                        onChange(isNaN(numValue) ? null : numValue);
                      }}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Services */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardHeaderRow}>
                <CardTitle>Serviços *</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={addService}
                  disabled={isSubmitting}
                >
                  <Icon name="plus" size={16} color={colors.foreground} />
                  <ThemedText>Adicionar</ThemedText>
                </Button>
              </View>
            </CardHeader>
            <CardContent>
              {form.watch("services").map((_, index) => (
                <View key={index} style={[styles.serviceRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.serviceContent}>
                    <Controller
                      control={form.control}
                      name={`services.${index}.description`}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <View style={styles.serviceInput}>
                          <Input
                            value={value}
                            onChangeText={onChange}
                            placeholder={`Serviço ${index + 1}`}
                            disabled={isSubmitting}
                          />
                          {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                        </View>
                      )}
                    />
                    {form.watch("services").length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => removeService(index)}
                        disabled={isSubmitting}
                        style={styles.removeButton}
                      >
                        <Icon name="trash" size={18} color={colors.destructive} />
                      </Button>
                    )}
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>

          {/* Paints */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Tintas</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* General Painting */}
              <Controller
                control={form.control}
                name="generalPaintingId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Pintura Geral</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={paintOptions}
                      placeholder="Selecione a tinta"
                      searchPlaceholder="Buscar tinta..."
                      emptyText="Nenhuma tinta encontrada"
                      onSearchChange={setPaintSearch}
                      disabled={isSubmitting || isLoadingPaints}
                      loading={isLoadingPaints}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.actions}>
              <Button variant="outline" onPress={onCancel} disabled={isSubmitting} style={styles.cancelButton}>
                Cancelar
              </Button>
              <Button
                onPress={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
                style={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <IconLoader size={20} color={colors.primaryForeground} />
                    <ThemedText style={{ color: colors.primaryForeground }}>Salvando...</ThemedText>
                  </>
                ) : (
                  <ThemedText style={{ color: colors.primaryForeground }}>
                    {mode === "create" ? "Criar Tarefa" : "Salvar Alterações"}
                  </ThemedText>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ThemedScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardContent: {
    gap: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  serviceRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serviceContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  serviceInput: {
    flex: 1,
  },
  removeButton: {
    padding: spacing.sm,
  },
  actionsContainer: {
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    minWidth: 100,
  },
  submitButton: {
    minWidth: 120,
  },
});
