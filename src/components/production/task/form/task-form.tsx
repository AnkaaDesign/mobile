import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { useEditForm } from "@/hooks/useEditForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as DocumentPicker from "expo-document-picker";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { createFormDataWithContext, prepareFilesForUpload, type FileWithContext } from "@/utils/form-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useSectors } from '../../../../hooks';
import { TASK_STATUS, SERVICE_ORDER_STATUS, COMMISSION_STATUS, COMMISSION_STATUS_LABELS } from '../../../../constants';
import { IconLoader, IconX } from "@tabler/icons-react-native";
import { CustomerSelector } from "./customer-selector";
import { ServiceSelector } from "./service-selector";
import { GeneralPaintingSelector, LogoPaintsSelector } from "./paint-selector";

// Enhanced Task Form Schema for Mobile with Cross-field Validation
const taskFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(200, "Nome muito longo"),
  customerId: z.string().uuid("Cliente é obrigatório").min(1, "Cliente é obrigatório"),
  sectorId: z.string().uuid().nullable().optional(),
  serialNumber: z.string()
    .nullable()
    .optional()
    .refine((val) => !val || /^[A-Z0-9-]+$/.test(val), {
      message: "Número de série deve conter apenas letras maiúsculas, números e hífens",
    }),
  chassisNumber: z.string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const cleaned = val.replace(/\s/g, "").toUpperCase();
      return /^[A-Z0-9]{17}$/.test(cleaned);
    }, {
      message: "Número do chassi deve ter exatamente 17 caracteres alfanuméricos",
    }),
  plate: z.string()
    .nullable()
    .optional()
    .refine((val) => !val || /^[A-Z0-9-]+$/.test(val), {
      message: "Placa deve conter apenas letras maiúsculas, números e hífens",
    }),
  details: z.string().max(1000, "Detalhes muito longos (máx. 1000 caracteres)").nullable().optional(),
  entryDate: z.date().nullable().optional(),
  term: z.date().nullable().optional(),
  generalPaintingId: z.string().uuid().nullable().optional(),
  paintIds: z.array(z.string().uuid()).optional(),
  services: z.array(z.object({
    description: z.string().min(3, "Mínimo de 3 caracteres").max(400, "Máximo de 400 caracteres"),
    status: z.enum(Object.values(SERVICE_ORDER_STATUS) as [string, ...string[]]).optional(),
  })).min(1, "Pelo menos um serviço é obrigatório"),
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
  commission: z.string().nullable().optional(),
  startedAt: z.date().nullable().optional(),
  finishedAt: z.date().nullable().optional(),
}).superRefine((data, ctx) => {
  // Cross-field validation: term must be after entryDate
  if (data.entryDate && data.term && data.term <= data.entryDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Prazo de entrega deve ser posterior à data de entrada",
      path: ["term"],
    });
  }

  // Status-dependent validation: IN_PRODUCTION requires startedAt
  if (data.status === TASK_STATUS.IN_PRODUCTION && !data.startedAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data de início é obrigatória quando status é 'Em Produção'",
      path: ["startedAt"],
    });
  }

  // Status-dependent validation: COMPLETED requires finishedAt
  if (data.status === TASK_STATUS.COMPLETED && !data.finishedAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data de conclusão é obrigatória quando status é 'Concluída'",
      path: ["finishedAt"],
    });
  }

  // finishedAt must be after startedAt
  if (data.startedAt && data.finishedAt && data.finishedAt <= data.startedAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data de conclusão deve ser posterior à data de início",
      path: ["finishedAt"],
    });
  }
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
  const [sectorSearch, setSectorSearch] = useState("");

  // File upload state (for future implementation with expo-document-picker)
  const [budgetFiles, setBudgetFiles] = useState<any[]>([]);
  const [invoiceFiles, setInvoiceFiles] = useState<any[]>([]);
  const [receiptFiles, setReceiptFiles] = useState<any[]>([]);

  // Use useEditForm for edit mode with change detection, regular useForm for create mode
  const defaultFormValues = {
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
  };

  const form = mode === "edit" && initialData
    ? useEditForm<TaskFormData>({
        resolver: zodResolver(taskFormSchema),
        originalData: initialData,
        mapDataToForm: (data) => data as TaskFormData,
        onSubmit: async (changedData, fullData) => {
          console.log("[TaskForm Edit] Submitting only changed fields:", changedData);
          // In edit mode, submit only changed fields to optimize payload
          await handleSubmit(fullData); // Still pass full data for now
        },
        fieldsToOmitIfUnchanged: ["services", "paintIds"], // Don't include if unchanged
        defaultValues: defaultFormValues,
      })
    : useForm<TaskFormData>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: defaultFormValues,
      });

  // Fetch sectors (production only)
  const { data: sectors, isLoading: isLoadingSectors } = useSectors({
    searchingFor: sectorSearch,
    orderBy: { name: "asc" },
  });

  const sectorOptions = sectors?.data?.map((sector) => ({
    value: sector.id,
    label: sector.name,
  })) || [];

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
    // If we have files, convert to FormData with context for proper file organization
    if (budgetFiles.length > 0 || invoiceFiles.length > 0 || receiptFiles.length > 0) {
      // Prepare files with proper structure
      const files = prepareFilesForUpload({
        budgets: budgetFiles,
        invoices: invoiceFiles,
        receipts: receiptFiles,
      });

      // Prepare form data (excluding files)
      const formDataFields: Record<string, any> = {
        name: data.name,
        customerId: data.customerId,
        services: data.services, // Will be serialized as JSON in helper
      };

      // Add optional fields
      if (data.sectorId) formDataFields.sectorId = data.sectorId;
      if (data.serialNumber) formDataFields.serialNumber = data.serialNumber.toUpperCase();
      if (data.chassisNumber) {
        // Clean and uppercase chassis number
        formDataFields.chassisNumber = data.chassisNumber.replace(/\s/g, "").toUpperCase();
      }
      if (data.plate) formDataFields.plate = data.plate.toUpperCase();
      if (data.details) formDataFields.details = data.details;
      if (data.entryDate) formDataFields.entryDate = data.entryDate;
      if (data.term) formDataFields.term = data.term;
      if (data.generalPaintingId) formDataFields.generalPaintingId = data.generalPaintingId;
      if (data.status) formDataFields.status = data.status;
      if (data.commission) formDataFields.commission = data.commission;
      if (data.startedAt) formDataFields.startedAt = data.startedAt;
      if (data.finishedAt) formDataFields.finishedAt = data.finishedAt;
      if (data.paintIds && data.paintIds.length > 0) formDataFields.paintIds = data.paintIds;

      // Create FormData with context for proper backend file organization
      const formData = createFormDataWithContext(
        formDataFields,
        files,
        {
          entityType: "task",
          // Customer context will be added by parent component if available
        }
      );

      await onSubmit(formData as any);
    } else {
      // No files - submit as regular JSON with proper formatting
      const cleanedData = {
        ...data,
        serialNumber: data.serialNumber?.toUpperCase() || null,
        chassisNumber: data.chassisNumber?.replace(/\s/g, "").toUpperCase() || null,
        plate: data.plate?.toUpperCase() || null,
      };

      await onSubmit(cleanedData);
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
                  <View style={styles.fieldGroup}>
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
                  <CustomerSelector
                    value={value}
                    onValueChange={onChange}
                    disabled={isSubmitting}
                    error={error?.message}
                    required={true}
                  />
                )}
              />

              {/* Serial Number */}
              <Controller
                control={form.control}
                name="serialNumber"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View style={styles.fieldGroup}>
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
                  <View style={styles.fieldGroup}>
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
                  <View style={styles.fieldGroup}>
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
                  <View style={styles.fieldGroup}>
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
                  <View style={styles.fieldGroup}>
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
                    <View style={styles.fieldGroup}>
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
                  <View style={styles.fieldGroup}>
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
                  <View style={styles.fieldGroup}>
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
                  <View style={styles.fieldGroup}>
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
                    <View style={styles.fieldGroup}>
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
                    <View style={styles.fieldGroup}>
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
              <CardTitle>Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="services"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <ServiceSelector
                    services={value}
                    onChange={onChange}
                    disabled={isSubmitting}
                    error={error?.message}
                  />
                )}
              />
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
                  <GeneralPaintingSelector
                    value={value || undefined}
                    onValueChange={onChange}
                    disabled={isSubmitting}
                    error={error?.message}
                  />
                )}
              />

              {/* Logo Paints (Multi-select) */}
              <Controller
                control={form.control}
                name="paintIds"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <LogoPaintsSelector
                    selectedValues={value || []}
                    onValueChange={onChange}
                    disabled={isSubmitting}
                    error={error?.message}
                  />
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
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
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
