import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { useEditForm } from "@/hooks/useEditForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as DocumentPicker from "expo-document-picker";
import { createFormDataWithContext } from "@/utils/form-data-context";
import { Card } from "@/components/ui/card";
import { FormCard } from "@/components/ui/form-section";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { SimpleFormField, FormFieldGroup } from "@/components/ui";
import { MediaPicker, type MediaPickerResult } from "@/components/ui/media-picker";
import { FileUploadField, type FileWithPreview } from "@/components/ui/file-upload-field";
import { SimpleFormActionBar } from "@/components/forms";

import { DatePicker } from "@/components/ui/date-picker";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, fontWeight } from "@/constants/design-system";
import { formSpacing } from "@/constants/form-styles";
import { useSectors, useKeyboardAwareScroll, useLayoutMutations } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { TASK_STATUS, SERVICE_ORDER_STATUS, COMMISSION_STATUS, COMMISSION_STATUS_LABELS, SECTOR_PRIVILEGES } from "@/constants";
import { IconX } from "@tabler/icons-react-native";
import { CustomerSelector } from "./customer-selector";
import { ServiceSelector } from "./service-selector";
import { GeneralPaintingSelector, LogoPaintsSelector } from "./paint-selector";
import { LayoutForm } from "@/components/production/layout/layout-form";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutCreateFormData } from "@/schemas";
import type { Customer } from "@/types";

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
  truck: z.object({
    plate: z.string()
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val?.toUpperCase()))
      .refine((val) => !val || /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/i.test(val), {
        message: "Formato de placa inválido (ex: ABC1234 ou ABC-1234)",
      }),
    // Use 'chassisNumber' to match Prisma schema (source of truth)
    chassisNumber: z.string()
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val?.toUpperCase()))
      .refine((val) => {
        if (!val) return true;
        const cleaned = val.replace(/\s/g, "").toUpperCase();
        return /^[A-Z0-9]{17}$/.test(cleaned);
      }, {
        message: "Número do chassi deve ter exatamente 17 caracteres alfanuméricos",
      }),
    xPosition: z.number().nullable().optional(),
    yPosition: z.number().nullable().optional(),
    garageId: z.string().uuid("Garagem inválida").nullable().optional(),
  }).nullable().optional(),
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
  // Budget detailed - line items
  budget: z.object({
    items: z.array(z.object({
      description: z.string().min(1, "Descrição é obrigatória"),
      amount: z.number().positive("Valor deve ser positivo"),
    })).optional(),
    expiresIn: z.date().nullable().optional(),
  }).nullable().optional(),
  // Cuts
  cuts: z.array(z.object({
    type: z.string(), // CUT_TYPE enum
    quantity: z.number().min(1, "Quantidade mínima é 1").default(1),
    file: z.any().nullable().optional(), // File object
    measurements: z.string().nullable().optional(),
    origin: z.string().optional(), // CUT_ORIGIN enum
  })).optional(),
  // Airbrushings
  airbrushings: z.array(z.object({
    id: z.string().optional(),
    status: z.string().optional(), // AIRBRUSHING_STATUS enum
    price: z.number().nullable().optional(),
    startDate: z.date().nullable().optional(),
    finishDate: z.date().nullable().optional(),
    receiptFiles: z.array(z.any()).optional(), // File[]
    nfeFiles: z.array(z.any()).optional(), // File[]
    artworkFiles: z.array(z.any()).optional(), // File[]
    receiptIds: z.array(z.string()).optional(),
    invoiceIds: z.array(z.string()).optional(),
    artworkIds: z.array(z.string()).optional(),
  })).optional(),
  // Financial file IDs
  budgetIds: z.array(z.string()).optional(),
  invoiceIds: z.array(z.string()).optional(),
  receiptIds: z.array(z.string()).optional(),
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

  // Cross-field validation: startedAt must be >= entryDate (aligned with web)
  if (data.entryDate && data.startedAt && data.startedAt < data.entryDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data de início deve ser igual ou posterior à data de entrada",
      path: ["startedAt"],
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
  initialCustomer?: Customer;
  existingLayouts?: {
    left?: LayoutCreateFormData;
    right?: LayoutCreateFormData;
    back?: LayoutCreateFormData;
  };
  onSubmit: (data: TaskFormData) => Promise<any>; // Returns task data with truck ID for layout creation
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

export function TaskForm({ mode, initialData, initialCustomer, existingLayouts, onSubmit, onCancel, isSubmitting: isSubmittingProp }: TaskFormProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createOrUpdateTruckLayout } = useLayoutMutations();
  const [sectorSearch, setSectorSearch] = useState("");
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);

  // Combine external and internal submitting states
  const isSubmitting = isSubmittingProp || isSubmittingInternal;

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
    truck: initialData?.truck ? {
      plate: initialData.truck.plate || null,
      chassisNumber: initialData.truck.chassisNumber || null,
      xPosition: initialData.truck.xPosition || null,
      yPosition: initialData.truck.yPosition || null,
      garageId: initialData.truck.garageId || null,
    } : {
      plate: null,
      chassisNumber: null,
      xPosition: null,
      yPosition: null,
      garageId: null,
    },
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

  // Memoized keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  // Handle artwork file selection from MediaPickerCard
  const handleArtworkSelect = (result: MediaPickerResult) => {
    if (artworkFiles.length >= 5) {
      Alert.alert("Limite atingido", "Máximo de 5 arquivos de arte permitidos.");
      return;
    }
    const newFile: FileWithPreview = {
      uri: result.uri,
      name: result.name,
      type: result.type,
      size: result.size || 0,
    };
    setArtworkFiles([...artworkFiles, newFile]);
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
    // Prevent double submission
    if (isSubmitting) {
      console.log('[TaskForm] Submission blocked - already submitting');
      return;
    }

    setIsSubmittingInternal(true);
    console.log('[TaskForm] Starting submission with data:', JSON.stringify(data, null, 2));

    try {
      // Validate observation if section is open
      if (isObservationOpen) {
        if (!data.observation?.description || observationFiles.length === 0) {
          Alert.alert(
            "Observação Incompleta",
            "Por favor, adicione uma descrição e pelo menos um arquivo para a observação."
          );
          setIsSubmittingInternal(false);
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

      // Handle truck object structure (match web implementation)
      if (data.truck) {
        const truckData: any = {};
        if (data.truck.plate) {
          truckData.plate = data.truck.plate.toUpperCase();
        }
        if (data.truck.chassisNumber) {
          // Clean and uppercase chassis number
          truckData.chassisNumber = data.truck.chassisNumber.replace(/\s/g, "").toUpperCase();
        }
        if (data.truck.xPosition !== null && data.truck.xPosition !== undefined) {
          truckData.xPosition = data.truck.xPosition;
        }
        if (data.truck.yPosition !== null && data.truck.yPosition !== undefined) {
          truckData.yPosition = data.truck.yPosition;
        }
        if (data.truck.garageId) {
          truckData.garageId = data.truck.garageId;
        }
        if (Object.keys(truckData).length > 0) {
          formDataFields.truck = truckData;
        }
      }

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

      // Create FormData with context for proper backend file organization
      const formData = createFormDataWithContext(
        formDataFields,
        files,
        {
          entityType: "task",
          // Customer context will be added by parent component if available
        }
      );

      const result = await onSubmit(formData as any);
      console.log('[TaskForm] FormData submission completed');

      // Create layouts AFTER task creation (matching web implementation)
      if (isLayoutOpen && modifiedLayoutSides.size > 0 && result?.data?.truck?.id) {
        const truckId = result.data.truck.id;
        console.log(`[TaskForm] Creating layouts for truck ${truckId}`);

        const layoutPromises = [];
        for (const side of modifiedLayoutSides) {
          const sideData = layouts[side];
          if (sideData && sideData.sections && sideData.sections.length > 0) {
            console.log(`[TaskForm] Creating ${side} layout`);
            layoutPromises.push(
              createOrUpdateTruckLayout({
                truckId,
                side,
                data: {
                  height: sideData.height,
                  sections: sideData.sections.map((section: any) => ({
                    width: section.width,
                    isDoor: section.isDoor || false,
                    doorOffset: section.isDoor ? section.doorOffset : null,
                    position: section.position,
                  })),
                  photoId: sideData.photoId || null,
                },
              })
            );
          }
        }

        if (layoutPromises.length > 0) {
          try {
            await Promise.all(layoutPromises);
            console.log(`[TaskForm] Successfully created ${layoutPromises.length} layout(s)`);
          } catch (layoutError) {
            console.error('[TaskForm] Error creating layouts:', layoutError);
            Alert.alert(
              "Aviso",
              "Tarefa criada, mas houve um erro ao criar os layouts do caminhão."
            );
          }
        }
      }
    } else {
      // No files - submit as regular JSON with proper formatting
      const cleanedData: any = {
        ...data,
        serialNumber: data.serialNumber?.toUpperCase() || null,
      };

      // Handle truck object structure (match web implementation)
      if (data.truck) {
        cleanedData.truck = {
          plate: data.truck.plate?.toUpperCase() || null,
          chassisNumber: data.truck.chassisNumber?.replace(/\s/g, "").toUpperCase() || null,
          xPosition: data.truck.xPosition || null,
          yPosition: data.truck.yPosition || null,
          garageId: data.truck.garageId || null,
        };
      }

      // Add observation if section is open (no files case)
      if (isObservationOpen && data.observation) {
        cleanedData.observation = {
          description: data.observation.description,
        };
      } else {
        delete cleanedData.observation;
      }

      const result = await onSubmit(cleanedData);
      console.log('[TaskForm] JSON submission completed');

      // Create layouts AFTER task creation (matching web implementation)
      if (isLayoutOpen && modifiedLayoutSides.size > 0 && result?.data?.truck?.id) {
        const truckId = result.data.truck.id;
        console.log(`[TaskForm] Creating layouts for truck ${truckId}`);

        const layoutPromises = [];
        for (const side of modifiedLayoutSides) {
          const sideData = layouts[side];
          if (sideData && sideData.sections && sideData.sections.length > 0) {
            console.log(`[TaskForm] Creating ${side} layout`);
            layoutPromises.push(
              createOrUpdateTruckLayout({
                truckId,
                side,
                data: {
                  height: sideData.height,
                  sections: sideData.sections.map((section: any) => ({
                    width: section.width,
                    isDoor: section.isDoor || false,
                    doorOffset: section.isDoor ? section.doorOffset : null,
                    position: section.position,
                  })),
                  photoId: sideData.photoId || null,
                },
              })
            );
          }
        }

        if (layoutPromises.length > 0) {
          try {
            await Promise.all(layoutPromises);
            console.log(`[TaskForm] Successfully created ${layoutPromises.length} layout(s)`);
          } catch (layoutError) {
            console.error('[TaskForm] Error creating layouts:', layoutError);
            Alert.alert(
              "Aviso",
              "Tarefa criada, mas houve um erro ao criar os layouts do caminhão."
            );
          }
        }
      }
    }
    } catch (error) {
      console.error('[TaskForm] Submission error:', error);
      Alert.alert(
        "Erro ao salvar",
        "Ocorreu um erro ao salvar a tarefa. Por favor, tente novamente."
      );
    } finally {
      setIsSubmittingInternal(false);
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
          ref={refs.scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
          <View style={styles.container}>
            {/* Basic Information */}
            <FormCard title="Informações Básicas">
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
              <FormFieldGroup label="Cliente" required error={errors.customerId?.message}>
                <Controller
                  control={form.control}
                  name="customerId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <CustomerSelector
                      value={value}
                      onValueChange={onChange}
                      initialCustomer={initialCustomer}
                      disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector}
                      error={error?.message}
                      required={false}
                    />
                  )}
                />
              </FormFieldGroup>

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

              {/* Truck - Plate */}
              <SimpleFormField label="Placa" error={errors.truck?.plate}>
                <Controller
                  control={form.control}
                  name="truck.plate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: ABC1234"
                      autoCapitalize="characters"
                      error={!!errors.truck?.plate}
                    />
                  )}
                />
              </SimpleFormField>

              {/* Truck - Chassis Number */}
              <SimpleFormField label="Número do Chassi (17 caracteres)" error={errors.truck?.chassisNumber}>
                <Controller
                  control={form.control}
                  name="truck.chassisNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      type="chassis"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: 9BW ZZZ37 7V T004251"
                      autoCapitalize="characters"
                      error={!!errors.truck?.chassisNumber}
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

              {/* Entry Date - in Basic Info for create mode */}
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

              {/* Term/Deadline - in Basic Info for create mode */}
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
            </FormCard>

          {/* Additional Dates (edit mode only) */}
          {mode === "edit" && (
          <FormCard title="Datas Adicionais">
              {/* Started At */}
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

              {/* Finished At */}
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
          </FormCard>
          )}

          {/* Observation Section - Only in edit mode, hidden for warehouse, financial, designer, logistic users */}
          {mode === "edit" && !isWarehouseSector && !isFinancialSector && !isDesignerSector && !isLogisticSector && (
            <Card>
              <View style={[styles.collapsibleCardHeader, isObservationOpen && styles.collapsibleCardHeaderOpen, isObservationOpen && { borderBottomColor: colors.border }]}>
                <View style={styles.collapsibleCardTitleRow}>
                  <Icon name="file-text" size={20} color={colors.foreground} />
                  <ThemedText style={styles.collapsibleCardTitle}>Observação</ThemedText>
                </View>
                {!isObservationOpen ? (
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
                ) : (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      setIsObservationOpen(false);
                      setObservationFiles([]);
                      form.setValue('observation', null);
                    }}
                    disabled={isSubmitting}
                  >
                    <IconX size={18} color={colors.destructive} />
                  </TouchableOpacity>
                )}
              </View>

              {isObservationOpen && (
                <View style={styles.collapsibleCardContent}>
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
          <FormCard title="Serviços">
              <FormFieldGroup label="Serviços" required error={errors.services?.message}>
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
              </FormFieldGroup>
          </FormCard>

          {/* Paints */}
          <FormCard title="Tintas">
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
          </FormCard>

          {/* Truck Layout Section - Hidden for financial and warehouse users */}
          {!isFinancialSector && !isWarehouseSector && (
          <Card>
            <View style={[styles.collapsibleCardHeader, isLayoutOpen && styles.collapsibleCardHeaderOpen, isLayoutOpen && { borderBottomColor: colors.border }]}>
              <View style={styles.collapsibleCardTitleRow}>
                <Icon name="ruler" size={20} color={colors.foreground} />
                <ThemedText style={styles.collapsibleCardTitle}>Layout do Caminhão</ThemedText>
              </View>
              {!isLayoutOpen ? (
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
              ) : (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    setIsLayoutOpen(false);
                    setLayouts({
                      left: { height: 2.4, sections: [{ width: 8, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
                      right: { height: 2.4, sections: [{ width: 8, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
                      back: { height: 2.42, sections: [{ width: 2.42, isDoor: false, doorOffset: null, position: 0 }], photoId: null },
                    });
                    setModifiedLayoutSides(new Set());
                  }}
                  disabled={isSubmitting}
                >
                  <IconX size={18} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </View>

            {isLayoutOpen && (
              <View style={styles.collapsibleCardContent}>
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
                    setModifiedLayoutSides((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(side);
                      return newSet;
                    });
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

          {/* Artworks - Last section, hidden for warehouse, financial, logistic users */}
          {!isWarehouseSector && !isFinancialSector && !isLogisticSector && (
            <FormCard title="Artes (Opcional)">
                <MediaPicker
                  onSelect={handleArtworkSelect}
                  disabled={isSubmitting || artworkFiles.length >= 5}
                  placeholder="Toque para adicionar arte"
                  helperText={`${artworkFiles.length}/5 arquivos`}
                  showCamera={true}
                  showGallery={true}
                  showFilePicker={true}
                  multiple={true}
                />
                {artworkFiles.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: spacing.md }}
                    contentContainerStyle={{ gap: spacing.sm }}
                  >
                    {artworkFiles.map((file, index) => (
                      <View key={index} style={styles.artworkPreviewContainer}>
                        {file.type?.startsWith('image/') ? (
                          <View style={[styles.artworkImagePreview, { backgroundColor: colors.muted }]}>
                            <Icon name="photo" size={32} color={colors.mutedForeground} />
                            <ThemedText style={styles.artworkFileName} numberOfLines={1}>
                              {file.name}
                            </ThemedText>
                          </View>
                        ) : (
                          <View style={[styles.artworkImagePreview, { backgroundColor: colors.muted }]}>
                            <Icon name="file" size={32} color={colors.mutedForeground} />
                            <ThemedText style={styles.artworkFileName} numberOfLines={1}>
                              {file.name}
                            </ThemedText>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => removeArtworkFile(index)}
                          style={[styles.artworkRemoveButton, { backgroundColor: colors.destructive }]}
                          disabled={isSubmitting}
                        >
                          <IconX size={14} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
            </FormCard>
          )}
        </View>
        </KeyboardAwareFormProvider>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <SimpleFormActionBar
        onCancel={onCancel}
        onSubmit={() => {
          console.log('[TaskForm] Submit button pressed');
          console.log('[TaskForm] Form state:', {
            isValid: form.formState.isValid,
            isDirty: form.formState.isDirty,
            errors: form.formState.errors,
            isSubmitting: form.formState.isSubmitting,
          });

          // Trigger form validation and submission
          form.handleSubmit(
            // onValid - called when validation passes
            (data) => {
              console.log('[TaskForm] Validation passed, submitting...');
              handleSubmit(data);
            },
            // onInvalid - called when validation fails
            (errors) => {
              console.log('[TaskForm] Validation failed:', errors);

              // Get first error message to show to user
              const errorMessages: string[] = [];

              if (errors.name) {
                errorMessages.push(`Nome: ${errors.name.message}`);
              }
              if (errors.customerId) {
                errorMessages.push(`Cliente: ${errors.customerId.message}`);
              }
              if (errors.services) {
                const servicesError = errors.services as any;
                if (servicesError.message) {
                  errorMessages.push(`Serviços: ${servicesError.message}`);
                } else if (servicesError.root?.message) {
                  errorMessages.push(`Serviços: ${servicesError.root.message}`);
                } else {
                  errorMessages.push('Serviços: Pelo menos um serviço é obrigatório');
                }
              }
              if (errors.term) {
                errorMessages.push(`Prazo: ${errors.term.message}`);
              }
              if (errors.startedAt) {
                errorMessages.push(`Data de início: ${errors.startedAt.message}`);
              }
              if (errors.finishedAt) {
                errorMessages.push(`Data de conclusão: ${errors.finishedAt.message}`);
              }

              // Add other field errors
              const handledFields = ['name', 'customerId', 'services', 'term', 'startedAt', 'finishedAt'];
              Object.entries(errors).forEach(([key, value]) => {
                if (!handledFields.includes(key) && value && typeof value === 'object' && 'message' in value) {
                  errorMessages.push(`${key}: ${(value as any).message}`);
                }
              });

              if (errorMessages.length > 0) {
                Alert.alert(
                  "Campos obrigatórios",
                  errorMessages.join('\n'),
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert(
                  "Erro de validação",
                  "Por favor, preencha todos os campos obrigatórios corretamente.",
                  [{ text: "OK" }]
                );
              }
            }
          )();
        }}
        isSubmitting={isSubmitting}
        submitLabel={mode === "create" ? "Cadastrar" : "Atualizar"}
      />
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
  scrollContent: {
    paddingBottom: 0, // No spacing - action bar has its own margin
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
  layoutSideSelector: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  layoutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  totalLengthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  totalLengthLabel: {
    fontSize: fontSize.xs,
  },
  totalLengthValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  collapsibleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  collapsibleCardHeaderOpen: {
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
  },
  collapsibleCardContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  collapsibleCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  collapsibleCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  artworkPreviewContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  artworkImagePreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  artworkFileName: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  artworkRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
