import { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { useEditForm } from "@/hooks/useEditForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as DocumentPicker from "expo-document-picker";
import { createFormDataWithContext } from "@/utils/form-data-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { SimpleFormField, FileUploadField } from "@/components/ui";
import type { FileWithPreview } from "@/components/ui/file-upload-field";

import { DatePicker } from "@/components/ui/date-picker";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, fontWeight } from "@/constants/design-system";
import { useSectors } from '../../../../hooks';
import { TASK_STATUS, SERVICE_ORDER_STATUS, COMMISSION_STATUS, COMMISSION_STATUS_LABELS, SECTOR_PRIVILEGES } from '../../../../constants';
import { IconLoader, IconX, IconDeviceFloppy, IconTrash } from "@tabler/icons-react-native";
import { CustomerSelector } from "./customer-selector";
import { ServiceSelector } from "./service-selector";
import { GeneralPaintingSelector, LogoPaintsSelector } from "./paint-selector";
import { LayoutForm } from "@/components/production/layout/layout-form";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutCreateFormData } from "@/schemas";

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
  artworkIds: z.array(z.string().uuid()).optional(), // General artwork files
  observation: z.object({
    description: z.string().min(1, "Descrição é obrigatória"),
    fileIds: z.array(z.string().min(1, "ID do arquivo inválido")).optional(),
  }).nullable().optional(),
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
  existingLayouts?: {
    left?: LayoutCreateFormData;
    right?: LayoutCreateFormData;
    back?: LayoutCreateFormData;
  };
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

export function TaskForm({ mode, initialData, existingLayouts, onSubmit, onCancel, isSubmitting }: TaskFormProps) {
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const [sectorSearch, setSectorSearch] = useState("");

  // Get user role/privileges for field restrictions
  const userPrivilege = user?.sector?.privileges;
  const isFinancialSector = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;
  const isWarehouseSector = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE;
  const isDesignerSector = userPrivilege === SECTOR_PRIVILEGES.DESIGNER;
  const isLogisticSector = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;

  // File upload state
  const [artworkFiles, setArtworkFiles] = useState<FileWithPreview[]>([]);
  const [observationFiles, setObservationFiles] = useState<FileWithPreview[]>([]);

  // Observation section state
  const [isObservationOpen, setIsObservationOpen] = useState(false);

  // Layout state - Initialize with existingLayouts if available (edit mode)
  const [selectedLayoutSide, setSelectedLayoutSide] = useState<"left" | "right" | "back">("left");
  const [isLayoutOpen, setIsLayoutOpen] = useState(!!existingLayouts); // Auto-open if layouts exist
  const [layouts, setLayouts] = useState<{
    left?: LayoutCreateFormData;
    right?: LayoutCreateFormData;
    back?: LayoutCreateFormData;
  }>(() => {
    // If we have existing layouts from backend, use them
    if (existingLayouts) {
      console.log('[TaskForm] Initializing with existing layouts:', existingLayouts);
      return existingLayouts;
    }

    // Otherwise use defaults
    return {
      left: { height: 2.4, sections: [{ width: 8, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
      right: { height: 2.4, sections: [{ width: 8, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
      back: { height: 2.42, sections: [{ width: 2.42, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
    };
  });

  // Track which sides were actually modified by the user (like web implementation)
  const [modifiedLayoutSides, setModifiedLayoutSides] = useState<Set<"left" | "right" | "back">>(new Set());

  // Update layouts when existingLayouts prop changes (important for when data loads asynchronously)
  useEffect(() => {
    if (existingLayouts) {
      console.log('[TaskForm] Updating layouts from existingLayouts prop:', existingLayouts);
      setLayouts(existingLayouts);
      setIsLayoutOpen(true); // Auto-open the layout section when data loads
    }
  }, [existingLayouts]);

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
    artworkIds: initialData?.artworkIds || [],
    observation: initialData?.observation || null,
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
        onSubmit: async (data: Partial<TaskFormData>) => {
          console.log("[TaskForm Edit] Submitting changed fields:", data);
          // In edit mode, submit only changed fields to optimize payload
          await handleSubmit(data as TaskFormData);
        },
        fieldsToOmitIfUnchanged: ["services", "paintIds"], // Don't include if unchanged
        defaultValues: defaultFormValues,
      })
    : useForm<TaskFormData>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: defaultFormValues,
      });

  // Get errors from form state
  const { errors } = form.formState;

  // Fetch sectors (production only)
  const { data: sectors, isLoading: isLoadingSectors } = useSectors({
    searchingFor: sectorSearch,
    orderBy: { name: "asc" },
  });

  const sectorOptions = sectors?.data?.map((sector) => ({
    value: sector.id,
    label: sector.name,
  })) || [];

  // File picking functions for artwork
  const pickArtworkFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: FileWithPreview[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
          size: asset.size || 0,
        }));
        setArtworkFiles([...artworkFiles, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking artwork files:", error);
      Alert.alert("Erro", "Não foi possível selecionar os arquivos");
    }
  };

  const removeArtworkFile = (index: number) => {
    setArtworkFiles(artworkFiles.filter((_, i) => i !== index));
  };

  // File picking functions for observation
  const pickObservationFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: FileWithPreview[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
          size: asset.size || 0,
        }));
        setObservationFiles([...observationFiles, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking observation files:", error);
      Alert.alert("Erro", "Não foi possível selecionar os arquivos");
    }
  };

  const removeObservationFile = (index: number) => {
    setObservationFiles(observationFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: TaskFormData) => {
    // Validate observation if section is open
    if (isObservationOpen) {
      if (!data.observation?.description || observationFiles.length === 0) {
        Alert.alert(
          "Observação Incompleta",
          "Por favor, adicione uma descrição e pelo menos um arquivo para a observação."
        );
        return;
      }
    }

    // If we have files, convert to FormData with context for proper file organization
    if (artworkFiles.length > 0 || observationFiles.length > 0) {
      // Prepare files with proper structure
      const files: Record<string, any[]> = {};

      if (artworkFiles.length > 0) {
        files.artworks = artworkFiles;
      }

      if (observationFiles.length > 0) {
        files.observationFiles = observationFiles;
      }

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

      // Add observation if section is open
      if (isObservationOpen && data.observation) {
        formDataFields.observation = {
          description: data.observation.description,
        };
      }

      // Add layouts if present - only modified sides (following web implementation)
      if (isLayoutOpen && modifiedLayoutSides.size > 0) {
        const truckLayoutData: any = {};

        for (const side of modifiedLayoutSides) {
          const sideData = layouts[side];
          if (sideData && sideData.sections && sideData.sections.length > 0) {
            const sideName = side === 'left' ? 'leftSide' : side === 'right' ? 'rightSide' : 'backSide';
            truckLayoutData[sideName] = {
              height: sideData.height,
              sections: sideData.sections,
              photoId: sideData.photoId || null,
            };
            console.log(`[TaskForm] Added modified ${sideName} to payload`);
          }
        }

        if (Object.keys(truckLayoutData).length > 0) {
          formDataFields.truckLayoutData = truckLayoutData;
          console.log('[TaskForm] truckLayoutData:', truckLayoutData);
        }
      }

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
      const cleanedData: any = {
        ...data,
        serialNumber: data.serialNumber?.toUpperCase() || null,
        chassisNumber: data.chassisNumber?.replace(/\s/g, "").toUpperCase() || null,
        plate: data.plate?.toUpperCase() || null,
      };

      // Add observation if section is open (no files case)
      if (isObservationOpen && data.observation) {
        cleanedData.observation = {
          description: data.observation.description,
        };
      } else {
        delete cleanedData.observation;
      }

      // Add layouts if present - only modified sides (following web implementation)
      if (isLayoutOpen && modifiedLayoutSides.size > 0) {
        const truckLayoutData: any = {};

        for (const side of modifiedLayoutSides) {
          const sideData = layouts[side];
          if (sideData && sideData.sections && sideData.sections.length > 0) {
            const sideName = side === 'left' ? 'leftSide' : side === 'right' ? 'rightSide' : 'backSide';
            truckLayoutData[sideName] = {
              height: sideData.height,
              sections: sideData.sections,
              photoId: sideData.photoId || null,
            };
            console.log(`[TaskForm] Added modified ${sideName} to payload (JSON)`);
          }
        }

        if (Object.keys(truckLayoutData).length > 0) {
          cleanedData.truckLayoutData = truckLayoutData;
          console.log('[TaskForm] truckLayoutData (JSON):', truckLayoutData);
        }
      }

      await onSubmit(cleanedData);
    }
  };

  return (
    <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Task Header Card */}
            <Card style={styles.headerCard}>
              <View style={styles.headerContent}>
                <View style={[styles.headerLeft, { flex: 1 }]}>
                  <Icon name="clipboard-list" size={24} color={colors.primary} />
                  <ThemedText style={StyleSheet.flatten([styles.taskName, { color: colors.foreground }])}>
                    {mode === "create" ? "Cadastrar Tarefa" : "Editar Tarefa"}
                  </ThemedText>
                </View>
                <View style={styles.headerActions}>
                  {/* Empty placeholder to match detail page structure */}
                </View>
              </View>
            </Card>

            {/* Basic Information */}
            <Card style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>
              <View style={styles.cardContent}>
              {/* Name - Disabled for financial, warehouse, designer, logistic */}
              <SimpleFormField label="Nome da Tarefa" required error={errors.name}>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: Pintura completa do caminhão"
                      maxLength={200}
                      error={!!errors.name}
                      editable={!isSubmitting && !isFinancialSector && !isWarehouseSector && !isDesignerSector && !isLogisticSector}
                    />
                  )}
                />
              </SimpleFormField>

              {/* Customer - Disabled for financial, warehouse, designer */}
              <Controller
                control={form.control}
                name="customerId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <CustomerSelector
                    value={value}
                    onValueChange={onChange}
                    disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector}
                    error={error?.message}
                    required={true}
                  />
                )}
              />

              {/* Serial Number */}
              <SimpleFormField label="Número de Série" error={errors.serialNumber}>
                <Controller
                  control={form.control}
                  name="serialNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: ABC-123456"
                      autoCapitalize="characters"
                      error={!!errors.serialNumber}
                    />
                  )}
                />
              </SimpleFormField>

              {/* Plate */}
              <SimpleFormField label="Placa" error={errors.plate}>
                <Controller
                  control={form.control}
                  name="plate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: ABC1234"
                      autoCapitalize="characters"
                      error={!!errors.plate}
                    />
                  )}
                />
              </SimpleFormField>

              {/* Chassis Number */}
              <SimpleFormField label="Número do Chassi (17 caracteres)" error={errors.chassisNumber}>
                <Controller
                  control={form.control}
                  name="chassisNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      type="chassis"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: 9BW ZZZ37 7V T004251"
                      autoCapitalize="characters"
                      error={!!errors.chassisNumber}
                    />
                  )}
                />
              </SimpleFormField>

              {/* Sector */}
              <SimpleFormField label="Setor" error={errors.sectorId}>
                <Controller
                  control={form.control}
                  name="sectorId"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={sectorOptions}
                      placeholder="Selecione o setor"
                      searchPlaceholder="Buscar setor..."
                      emptyText="Nenhum setor encontrado"
                      onSearchChange={setSectorSearch}
                      loading={isLoadingSectors}
                      searchable={true}
                      clearable={true}
                      preferFullScreen={true}
                    />
                  )}
                />
              </SimpleFormField>

              {/* Commission Status - Disabled for financial sector */}
              <SimpleFormField label="Status de Comissão" error={errors.commission}>
                <Controller
                  control={form.control}
                  name="commission"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      value={value || COMMISSION_STATUS.FULL_COMMISSION}
                      onValueChange={onChange}
                      options={Object.values(COMMISSION_STATUS).map((status) => ({
                        value: status,
                        label: COMMISSION_STATUS_LABELS[status],
                      }))}
                      placeholder="Selecione o status de comissão"
                      searchable={false}
                      preferFullScreen={true}
                      disabled={isSubmitting || isFinancialSector}
                    />
                  )}
                />
              </SimpleFormField>

              {/* Status (edit mode only) */}
              {mode === "edit" && (
                <SimpleFormField label="Status" error={errors.status}>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field: { onChange, value } }) => (
                      <Combobox
                        value={value || TASK_STATUS.PENDING}
                        onValueChange={onChange}
                        options={TASK_STATUS_OPTIONS}
                        placeholder="Selecione o status"
                        searchable={false}
                        preferFullScreen={true}
                      />
                    )}
                  />
                </SimpleFormField>
              )}

              {/* Details */}
              <SimpleFormField label="Detalhes" error={errors.details}>
                <Controller
                  control={form.control}
                  name="details"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Textarea
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Detalhes adicionais sobre a tarefa..."
                      numberOfLines={4}
                      error={!!errors.details}
                    />
                  )}
                />
              </SimpleFormField>
              </View>
            </Card>

          {/* Dates */}
          <Card style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Datas</ThemedText>
            <View style={styles.cardContent}>
              {/* Entry Date */}
              <Controller
                control={form.control}
                name="entryDate"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View style={styles.fieldGroup}>
                    <Label>Data de Entrada</Label>
                    <DatePicker
                      value={value ?? undefined}
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
                      value={value ?? undefined}
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
                        value={value ?? undefined}
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
                        value={value ?? undefined}
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
            </View>
          </Card>

          {/* Artworks - Hidden for warehouse, financial, logistic users */}
          {!isWarehouseSector && !isFinancialSector && !isLogisticSector && (
            <Card style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Artes</ThemedText>
              <View style={styles.cardContent}>
                <ThemedText style={styles.sectionNote}>
                  Arquivos de arte gerais (Máximo 5 arquivos)
                </ThemedText>
                <FileUploadField
                  files={artworkFiles}
                  onRemove={removeArtworkFile}
                  onAdd={pickArtworkFiles}
                  maxFiles={5}
                  label="Adicionar Artes"
                  disabled={isSubmitting}
                />
              </View>
            </Card>
          )}

          {/* Observation Section - Hidden for warehouse, financial, designer, logistic users */}
          {!isWarehouseSector && !isFinancialSector && !isDesignerSector && !isLogisticSector && (
            <Card style={styles.card}>
              <View style={[styles.cardHeaderRow, { justifyContent: 'space-between' }]}>
                <ThemedText style={styles.sectionTitle}>Observação</ThemedText>
                <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                  {!isObservationOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setIsObservationOpen(true)}
                      disabled={isSubmitting}
                    >
                      <Icon name="plus" size={16} color={colors.foreground} />
                      <ThemedText style={{ marginLeft: spacing.xs, fontSize: fontSize.sm }}>
                        Adicionar
                      </ThemedText>
                    </Button>
                  )}
                  {isObservationOpen && (
                    <TouchableOpacity
                      style={{ padding: spacing.xs }}
                      onPress={() => {
                        setIsObservationOpen(false);
                        setObservationFiles([]);
                        form.setValue('observation', null);
                      }}
                      disabled={isSubmitting}
                    >
                      <IconTrash size={18} color={colors.destructive} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {isObservationOpen && (
                <View style={styles.cardContent}>
                  {/* Observation Description */}
                  <SimpleFormField label="Descrição" required error={errors.observation?.description}>
                    <Controller
                      control={form.control}
                      name="observation.description"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Textarea
                          value={value || ""}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Descreva problemas ou observações sobre a tarefa..."
                          numberOfLines={4}
                          error={!!errors.observation?.description}
                        />
                      )}
                    />
                  </SimpleFormField>

                  {/* Observation Files */}
                  <View>
                    <Label>Arquivos de Evidência (Máximo 10) *</Label>
                    <FileUploadField
                      files={observationFiles}
                      onRemove={removeObservationFile}
                      onAdd={pickObservationFiles}
                      maxFiles={10}
                      label="Adicionar Arquivos"
                      disabled={isSubmitting}
                    />
                  </View>
                </View>
              )}
            </Card>
          )}

          {/* Services */}
          <Card style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Serviços</ThemedText>
            <View>
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
            </View>
          </Card>

          {/* Paints */}
          <Card style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Tintas</ThemedText>
            <View style={styles.cardContent}>
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
            </View>
          </Card>

          {/* Truck Layout Section - Hidden for financial and warehouse users */}
          {!isFinancialSector && !isWarehouseSector && (
          <Card style={styles.card}>
            <View style={[styles.cardHeaderRow, { justifyContent: 'space-between' }]}>
              <ThemedText style={styles.sectionTitle}>Layout do Caminhão</ThemedText>
              <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                {!isLayoutOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setIsLayoutOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Icon name="plus" size={16} color={colors.foreground} />
                    <ThemedText style={{ marginLeft: spacing.xs, fontSize: fontSize.sm }}>
                      Adicionar
                    </ThemedText>
                  </Button>
                )}
                {isLayoutOpen && (
                  <TouchableOpacity
                    style={{ padding: spacing.xs }}
                    onPress={() => {
                      setIsLayoutOpen(false);
                      setLayouts({
                        left: { height: 2.4, sections: [{ width: 8, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
                        right: { height: 2.4, sections: [{ width: 8, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
                        back: { height: 2.42, sections: [{ width: 2.42, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
                      });
                      // Clear modified sides when layout section is removed
                      setModifiedLayoutSides(new Set());
                      console.log('[TaskForm] Layout section closed - cleared modified sides');
                    }}
                    disabled={isSubmitting}
                  >
                    <Icon name="trash-2" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {isLayoutOpen && (
              <View style={styles.cardContent}>
                {/* Side Selector */}
                <View style={styles.layoutSideSelector}>
                  <Button
                    variant={selectedLayoutSide === "left" ? "default" : "outline"}
                    size="sm"
                    onPress={() => setSelectedLayoutSide("left")}
                    disabled={isSubmitting}
                    style={{ flex: 1 }}
                  >
                    <ThemedText style={{
                      fontSize: fontSize.sm,
                      color: selectedLayoutSide === "left" ? colors.primaryForeground : colors.foreground
                    }}>
                      Motorista
                    </ThemedText>
                  </Button>
                  <Button
                    variant={selectedLayoutSide === "right" ? "default" : "outline"}
                    size="sm"
                    onPress={() => setSelectedLayoutSide("right")}
                    disabled={isSubmitting}
                    style={{ flex: 1 }}
                  >
                    <ThemedText style={{
                      fontSize: fontSize.sm,
                      color: selectedLayoutSide === "right" ? colors.primaryForeground : colors.foreground
                    }}>
                      Sapo
                    </ThemedText>
                  </Button>
                  <Button
                    variant={selectedLayoutSide === "back" ? "default" : "outline"}
                    size="sm"
                    onPress={() => setSelectedLayoutSide("back")}
                    disabled={isSubmitting}
                    style={{ flex: 1 }}
                  >
                    <ThemedText style={{
                      fontSize: fontSize.sm,
                      color: selectedLayoutSide === "back" ? colors.primaryForeground : colors.foreground
                    }}>
                      Traseira
                    </ThemedText>
                  </Button>
                </View>

                {/* Layout Form */}
                <LayoutForm
                  selectedSide={selectedLayoutSide}
                  layouts={layouts}
                  onChange={(side, layoutData) => {
                    console.log('[TaskForm] Layout onChange received:', { side, layoutData });

                    // Mark this side as modified (following web implementation)
                    setModifiedLayoutSides((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(side);
                      console.log('[TaskForm] Modified sides:', Array.from(newSet));
                      return newSet;
                    });

                    // Update layout state
                    setLayouts((prev) => ({
                      ...prev,
                      [side]: layoutData,
                    }));
                  }}
                  disabled={isSubmitting}
                />
              </View>
            )}
          </Card>
          )}

          {/* Bottom spacing */}
          <View style={{ height: spacing.md }} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.card }}>
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: spacing.xl,
            },
          ]}
        >
          <Button
            variant="outline"
            onPress={onCancel}
            disabled={isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconX size={20} color={colors.foreground} />
              <ThemedText style={{ color: colors.foreground, marginLeft: 8 }}>Cancelar</ThemedText>
            </>
          </Button>

          <Button
            variant="default"
            onPress={(form as any).handleSubmit?.(handleSubmit) || handleSubmit}
            disabled={isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              {isSubmitting ? (
                <>
                  <IconLoader size={20} color={colors.primaryForeground} />
                  <ThemedText style={{ color: colors.primaryForeground, marginLeft: 8 }}>
                    Salvando...
                  </ThemedText>
                </>
              ) : (
                <>
                  <IconDeviceFloppy size={20} color={colors.primaryForeground} />
                  <ThemedText style={{ color: colors.primaryForeground, marginLeft: 8 }}>
                    {mode === "create" ? "Salvar Tarefa" : "Salvar Alterações"}
                  </ThemedText>
                </>
              )}
            </>
          </Button>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  taskName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 36,
  },
  card: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
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
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  layoutSideSelector: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  totalLengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  totalLengthLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  totalLengthValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
