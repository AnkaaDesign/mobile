import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as DocumentPicker from "expo-document-picker";
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
import { TASK_STATUS, SERVICE_ORDER_STATUS, COMMISSION_STATUS, COMMISSION_STATUS_LABELS } from '../../../../constants';
import { IconLoader, IconX } from "@tabler/icons-react-native";

// Simplified Task Form Schema for Mobile
const taskFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(200, "Nome muito longo"),
  customerId: z.string().uuid("Cliente é obrigatório").min(1, "Cliente é obrigatório"),
  sectorId: z.string().uuid().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  chassisNumber: z.string().nullable().optional(),
  plate: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  entryDate: z.date().nullable().optional(),
  term: z.date().nullable().optional(),
  generalPaintingId: z.string().uuid().nullable().optional(),
  paintIds: z.array(z.string().uuid()).optional(),
  services: z.array(z.object({
    description: z.string().min(3, "Mínimo de 3 caracteres"),
    status: z.enum(Object.values(SERVICE_ORDER_STATUS) as [string, ...string[]]).optional(),
  })).min(1, "Pelo menos um serviço é obrigatório"),
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
  commission: z.string().nullable().optional(),
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

  // File upload state (for future implementation with expo-document-picker)
  const [budgetFiles, setBudgetFiles] = useState<any[]>([]);
  const [invoiceFiles, setInvoiceFiles] = useState<any[]>([]);
  const [receiptFiles, setReceiptFiles] = useState<any[]>([]);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      customerId: initialData?.customerId || "",
      sectorId: initialData?.sectorId || null,
      serialNumber: initialData?.serialNumber || null,
      chassisNumber: initialData?.chassisNumber || null,
      plate: initialData?.plate || null,
      details: initialData?.details || null,
      entryDate: initialData?.entryDate || null,
      term: initialData?.term || null,
      generalPaintingId: initialData?.generalPaintingId || null,
      paintIds: initialData?.paintIds || [],
      services: initialData?.services || [{ description: "", status: SERVICE_ORDER_STATUS.PENDING }],
      status: initialData?.status || TASK_STATUS.PENDING,
      commission: initialData?.commission || COMMISSION_STATUS.FULL_COMMISSION,
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

  // Move service up
  const moveServiceUp = (index: number) => {
    if (index === 0) return;
    const services = form.getValues("services");
    const newServices = [...services];
    [newServices[index - 1], newServices[index]] = [newServices[index], newServices[index - 1]];
    form.setValue("services", newServices);
  };

  // Move service down
  const moveServiceDown = (index: number) => {
    const services = form.getValues("services");
    if (index === services.length - 1) return;
    const newServices = [...services];
    [newServices[index], newServices[index + 1]] = [newServices[index + 1], newServices[index]];
    form.setValue("services", newServices);
  };

  // File picking functions
  const pickBudgetFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
        }));
        setBudgetFiles([...budgetFiles, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking budget files:", error);
      Alert.alert("Erro", "Não foi possível selecionar os arquivos");
    }
  };

  const pickInvoiceFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
        }));
        setInvoiceFiles([...invoiceFiles, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking invoice files:", error);
      Alert.alert("Erro", "Não foi possível selecionar os arquivos");
    }
  };

  const pickReceiptFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
        }));
        setReceiptFiles([...receiptFiles, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking receipt files:", error);
      Alert.alert("Erro", "Não foi possível selecionar os arquivos");
    }
  };

  const removeBudgetFile = (index: number) => {
    setBudgetFiles(budgetFiles.filter((_, i) => i !== index));
  };

  const removeInvoiceFile = (index: number) => {
    setInvoiceFiles(invoiceFiles.filter((_, i) => i !== index));
  };

  const removeReceiptFile = (index: number) => {
    setReceiptFiles(receiptFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: TaskFormData) => {
    // If we have files, convert to FormData for multiple file support
    if (budgetFiles.length > 0 || invoiceFiles.length > 0 || receiptFiles.length > 0) {
      const formData = new FormData();

      // Add all form fields
      formData.append("name", data.name);
      formData.append("customerId", data.customerId);

      if (data.sectorId) formData.append("sectorId", data.sectorId);
      if (data.serialNumber) formData.append("serialNumber", data.serialNumber);
      if (data.chassisNumber) formData.append("chassisNumber", data.chassisNumber);
      if (data.plate) formData.append("plate", data.plate);
      if (data.details) formData.append("details", data.details);
      if (data.entryDate) formData.append("entryDate", data.entryDate.toISOString());
      if (data.term) formData.append("term", data.term.toISOString());
      if (data.generalPaintingId) formData.append("generalPaintingId", data.generalPaintingId);
      if (data.status) formData.append("status", data.status);
      if (data.commission) formData.append("commission", data.commission);
      if (data.startedAt) formData.append("startedAt", data.startedAt.toISOString());
      if (data.finishedAt) formData.append("finishedAt", data.finishedAt.toISOString());

      // Add services as JSON string
      formData.append("services", JSON.stringify(data.services));

      // Add paintIds as JSON string if present
      if (data.paintIds && data.paintIds.length > 0) {
        formData.append("paintIds", JSON.stringify(data.paintIds));
      }

      // Add multiple files per category
      budgetFiles.forEach((file) => {
        formData.append("budgets", file as any);
      });
      invoiceFiles.forEach((file) => {
        formData.append("invoices", file as any);
      });
      receiptFiles.forEach((file) => {
        formData.append("receipts", file as any);
      });

      await onSubmit(formData as any);
    } else {
      await onSubmit(data);
    }
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

              {/* Chassis Number */}
              <Controller
                control={form.control}
                name="chassisNumber"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Número do Chassi</Label>
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Ex: 9BWZZZ377VT004251"
                      disabled={isSubmitting}
                      autoCapitalize="characters"
                      maxLength={17}
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

              {/* Commission Status */}
              <Controller
                control={form.control}
                name="commission"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Status de Comissão</Label>
                    <Combobox
                      value={value || COMMISSION_STATUS.FULL_COMMISSION}
                      onValueChange={onChange}
                      options={Object.values(COMMISSION_STATUS).map((status) => ({
                        value: status,
                        label: COMMISSION_STATUS_LABELS[status],
                      }))}
                      placeholder="Selecione o status de comissão"
                      disabled={isSubmitting}
                      searchable={false}
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
              <CardTitle>Documentos Financeiros</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* File Uploads */}
              <View style={styles.fileUploadSection}>
                <ThemedText style={styles.sectionNote}>
                  Documentos Financeiros (Múltiplos Arquivos)
                </ThemedText>

                {/* Budget Files */}
                <View style={styles.fileUploadItem}>
                  <Label>Orçamentos ({budgetFiles.length})</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={pickBudgetFiles}
                    disabled={isSubmitting}
                  >
                    <Icon name="upload" size={16} color={colors.foreground} />
                    <ThemedText>Adicionar Orçamentos</ThemedText>
                  </Button>
                  {budgetFiles.length > 0 && (
                    <View style={styles.fileList}>
                      {budgetFiles.map((file, index) => (
                        <View key={index} style={[styles.fileItem, { borderColor: colors.border }]}>
                          <ThemedText style={styles.fileName} numberOfLines={1}>
                            {file.name}
                          </ThemedText>
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => removeBudgetFile(index)}
                            disabled={isSubmitting}
                            style={styles.removeFileButton}
                          >
                            <IconX size={16} color={colors.destructive} />
                          </Button>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Invoice Files */}
                <View style={styles.fileUploadItem}>
                  <Label>Notas Fiscais ({invoiceFiles.length})</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={pickInvoiceFiles}
                    disabled={isSubmitting}
                  >
                    <Icon name="upload" size={16} color={colors.foreground} />
                    <ThemedText>Adicionar NFes</ThemedText>
                  </Button>
                  {invoiceFiles.length > 0 && (
                    <View style={styles.fileList}>
                      {invoiceFiles.map((file, index) => (
                        <View key={index} style={[styles.fileItem, { borderColor: colors.border }]}>
                          <ThemedText style={styles.fileName} numberOfLines={1}>
                            {file.name}
                          </ThemedText>
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => removeInvoiceFile(index)}
                            disabled={isSubmitting}
                            style={styles.removeFileButton}
                          >
                            <IconX size={16} color={colors.destructive} />
                          </Button>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Receipt Files */}
                <View style={styles.fileUploadItem}>
                  <Label>Recibos ({receiptFiles.length})</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={pickReceiptFiles}
                    disabled={isSubmitting}
                  >
                    <Icon name="upload" size={16} color={colors.foreground} />
                    <ThemedText>Adicionar Recibos</ThemedText>
                  </Button>
                  {receiptFiles.length > 0 && (
                    <View style={styles.fileList}>
                      {receiptFiles.map((file, index) => (
                        <View key={index} style={[styles.fileItem, { borderColor: colors.border }]}>
                          <ThemedText style={styles.fileName} numberOfLines={1}>
                            {file.name}
                          </ThemedText>
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => removeReceiptFile(index)}
                            disabled={isSubmitting}
                            style={styles.removeFileButton}
                          >
                            <IconX size={16} color={colors.destructive} />
                          </Button>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
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
                    {/* Reorder buttons */}
                    <View style={styles.serviceReorderButtons}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => moveServiceUp(index)}
                        disabled={isSubmitting || index === 0}
                        style={styles.reorderButton}
                      >
                        <Icon name="chevron-up" size={18} color={index === 0 ? colors.muted : colors.foreground} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => moveServiceDown(index)}
                        disabled={isSubmitting || index === form.watch("services").length - 1}
                        style={styles.reorderButton}
                      >
                        <Icon name="chevron-down" size={18} color={index === form.watch("services").length - 1 ? colors.muted : colors.foreground} />
                      </Button>
                    </View>

                    {/* Service input */}
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

                    {/* Remove button */}
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
  serviceReorderButtons: {
    flexDirection: "column",
    gap: 2,
  },
  reorderButton: {
    padding: spacing.xs,
    minWidth: 0,
  },
  serviceInput: {
    flex: 1,
  },
  removeButton: {
    padding: spacing.sm,
  },
  fileUploadSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sectionNote: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  fileUploadItem: {
    gap: spacing.sm,
  },
  fileCount: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  fileList: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: 6,
    gap: spacing.sm,
  },
  fileName: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  removeFileButton: {
    padding: spacing.xs,
    minWidth: 0,
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
