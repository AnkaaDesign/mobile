import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { useEditForm } from "@/hooks/useEditForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { FormActionBar } from "@/components/forms";

import { DatePicker } from "@/components/ui/date-picker";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, fontWeight } from "@/constants/design-system";
import { formSpacing } from "@/constants/form-styles";
import { useSectors, useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { TASK_STATUS, SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE, COMMISSION_STATUS, TRUCK_SPOT, SECTOR_PRIVILEGES, TRUCK_CATEGORY, IMPLEMENT_TYPE } from "@/constants/enums";
import { COMMISSION_STATUS_LABELS, TRUCK_CATEGORY_LABELS, IMPLEMENT_TYPE_LABELS } from "@/constants/enum-labels";
import { IconX } from "@tabler/icons-react-native";
import { getFileThumbnailUrl } from "@/api-client";
import { CustomerSelector } from "./customer-selector";
import { ServiceSelectorAutoGrouped } from "./service-selector-auto-grouped";
import { GeneralPaintingSelector, LogoPaintsSelector } from "./paint-selector";
import { SpotSelector } from "./spot-selector";
import { ArtworkFileUploadField, type ArtworkFileItem } from "./artwork-file-upload-field";
import { LayoutForm } from "@/components/production/layout/layout-form";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutCreateFormData } from "@/schemas";
import { taskPricingCreateNestedSchema } from "@/schemas/task-pricing";
import type { Customer, Paint } from "@/types";

// Enhanced Task Form Schema for Mobile with Cross-field Validation
// MATCHES: Web version (web/src/schemas/task.ts) and Backend API (api/src/schemas/task.ts)
const taskFormSchema = z.object({
  // FIXED: Name is now nullable/optional to match web CREATE schema
  // Web has validation that requires "at least one of: customer, serialNumber, plate, or name"
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(200, "Nome muito longo").nullable().optional(),
  customerId: z.string().uuid("Cliente inválido").nullable().optional(),
  invoiceToId: z.string().uuid("Cliente para faturamento inválido").nullable().optional(),
  negotiatingWith: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
  }).nullable().optional().refine(
    (data) => {
      // If negotiatingWith is provided, both name and phone should be filled or both should be empty
      if (!data) return true;
      const hasName = data.name && data.name.trim().length > 0;
      const hasPhone = data.phone && data.phone.trim().length > 0;
      return (hasName && hasPhone) || (!hasName && !hasPhone);
    },
    {
      message: "Preencha ambos nome e telefone do contato, ou deixe ambos vazios",
    }
  ),
  sectorId: z.string().uuid().nullable().optional(),
  serialNumber: z.string()
    .nullable()
    .optional()
    .refine((val) => !val || /^[A-Z0-9-]+$/.test(val), {
      message: "Número de série deve conter apenas letras maiúsculas, números e hífens",
    }),
  // ADDED: Serial number range fields (from web schema)
  serialNumberFrom: z.number().int().positive("Número de série inicial deve ser positivo").optional(),
  serialNumberTo: z.number().int().positive("Número de série final deve ser positivo").optional(),
  truck: z.object({
    plate: z.string()
      .nullable()
      .optional()
      .refine((val) => !val || /^[A-Z0-9-]+$/.test(val), {
        message: "Placa deve conter apenas letras maiúsculas, números e hífens",
      }),
    // Use 'chassisNumber' to match Prisma schema (source of truth)
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
    category: z.enum(Object.values(TRUCK_CATEGORY) as [string, ...string[]]).nullable().optional(),
    implementType: z.enum(Object.values(IMPLEMENT_TYPE) as [string, ...string[]]).nullable().optional(),
    spot: z.string().nullable().optional(),
  }).nullable().optional(),
  details: z.string().max(1000, "Detalhes muito longos (máx. 1000 caracteres)").nullable().optional(),
  entryDate: z.date().nullable().optional(),
  term: z.date().nullable().optional(),
  forecastDate: z.date().nullable().optional(),
  paintId: z.string().uuid().nullable().optional(),
  paintIds: z.array(z.string().uuid()).optional(),
  baseFileIds: z.array(z.string().uuid()).optional(), // Base files for artwork design
  artworkIds: z.array(z.string().uuid()).optional(), // General artwork files
  // Financial file IDs - FIXED: Using consistent field names from web/backend
  budgetIds: z.array(z.string().uuid()).optional(),
  invoiceIds: z.array(z.string().uuid()).optional(),
  receiptIds: z.array(z.string().uuid()).optional(),
  reimbursementIds: z.array(z.string().uuid()).optional(),
  // FIXED: Field name to match web schema (was invoiceReimbursementIds)
  reimbursementInvoiceIds: z.array(z.string().uuid()).optional(),
  observation: z.object({
    description: z.string().min(1, "Descrição é obrigatória"),
    fileIds: z.array(z.string().min(1, "ID do arquivo inválido")).optional(),
  }).nullable().optional(),
  serviceOrders: z.array(z.object({
    id: z.string().uuid().optional(), // For existing service orders (updates)
    description: z.string().min(3, "Mínimo de 3 caracteres").max(400, "Máximo de 400 caracteres"),
    status: z.enum(Object.values(SERVICE_ORDER_STATUS) as [string, ...string[]]).default(SERVICE_ORDER_STATUS.PENDING),
    statusOrder: z.number().int().min(1).max(4).default(1).optional(),
    // CRITICAL: Type field is REQUIRED in Prisma schema (default PRODUCTION)
    type: z.enum(Object.values(SERVICE_ORDER_TYPE) as [string, ...string[]]).default(SERVICE_ORDER_TYPE.PRODUCTION),
    assignedToId: z.string().uuid("Usuário inválido").nullable().optional(),
    observation: z.string().nullable().optional(), // For rejection/approval notes
    startedAt: z.date().nullable().optional(),
    finishedAt: z.date().nullable().optional(),
  })).optional(),
  // Pricing - comprehensive pricing with items, discounts, payment terms, etc.
  pricing: taskPricingCreateNestedSchema,
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
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
  commission: z.string().nullable().optional(),
  startedAt: z.date().nullable().optional(),
  finishedAt: z.date().nullable().optional(),
}).superRefine((data, ctx) => {
  // ADDED: Require at least one of: customer, serialNumber, plate, or name (matches web logic)
  const hasCustomer = !!data.customerId;
  const hasSerialNumber = !!data.serialNumber;
  const hasPlate = !!data.truck?.plate;
  const hasName = !!data.name;

  if (!hasCustomer && !hasSerialNumber && !hasPlate && !hasName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pelo menos um dos seguintes campos deve ser preenchido: Cliente, Número de série, Placa ou Nome",
      path: ["name"],
    });
  }

  // ADDED: Serial number range validation (matches web logic)
  const hasSerialNumberFrom = data.serialNumberFrom !== undefined;
  const hasSerialNumberTo = data.serialNumberTo !== undefined;

  // Both must be provided together or both omitted
  if (hasSerialNumberFrom && !hasSerialNumberTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Número de série final é obrigatório quando o número inicial é fornecido",
      path: ["serialNumberTo"],
    });
  }

  if (!hasSerialNumberFrom && hasSerialNumberTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Número de série inicial é obrigatório quando o número final é fornecido",
      path: ["serialNumberFrom"],
    });
  }

  // serialNumberTo must be >= serialNumberFrom
  if (hasSerialNumberFrom && hasSerialNumberTo && data.serialNumberTo! < data.serialNumberFrom!) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Número de série final deve ser maior ou igual ao número inicial",
      path: ["serialNumberTo"],
    });
  }
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

  // Note: startedAt and finishedAt are no longer required as they are auto-filled by the backend
  // when task status changes to IN_PRODUCTION or COMPLETED respectively

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
  initialGeneralPaint?: Paint;
  initialLogoPaints?: Paint[];
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
  { value: TASK_STATUS.PREPARATION, label: "Em Preparação" },
  { value: TASK_STATUS.WAITING_PRODUCTION, label: "Aguardando Produção" },
  { value: TASK_STATUS.IN_PRODUCTION, label: "Em Produção" },
  { value: TASK_STATUS.COMPLETED, label: "Concluída" },
  { value: TASK_STATUS.CANCELLED, label: "Cancelada" },
];

export function TaskForm({ mode, initialData, initialCustomer, initialGeneralPaint, initialLogoPaints, existingLayouts, onSubmit, onCancel, isSubmitting: isSubmittingProp }: TaskFormProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { handlers, refs } = useKeyboardAwareScroll();
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
  const isCommercialSector = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;

  // File upload state - initialize base files from existing data in edit mode
  const [baseFiles, setBaseFiles] = useState<FilePickerItem[]>(() => {
    if (mode === "edit" && initialData?.baseFiles) {
      // Convert existing files to FilePickerItem format
      return initialData.baseFiles.map((file: any) => ({
        id: file.id,
        uri: file.url || file.path || "",
        name: file.name || file.filename || "file",
        type: file.mimeType || file.mimetype || file.type || "application/octet-stream",
        size: file.size,
        uploaded: true, // Mark as already uploaded
        // Generate thumbnail URL for image files
        thumbnailUrl: file.id ? getFileThumbnailUrl(file.id, "medium") : undefined,
      }));
    }
    return [];
  });
  // Initialize artwork files from existing data in edit mode
  const [artworkFiles, setArtworkFiles] = useState<ArtworkFileItem[]>(() => {
    if (mode === "edit" && initialData?.artworks) {
      // Convert existing files to ArtworkFileItem format with status
      return initialData.artworks.map((file: any) => ({
        id: file.id,
        uri: file.url || file.path || "",
        name: file.name || file.filename || "file",
        type: file.mimeType || file.mimetype || file.type || "application/octet-stream",
        size: file.size,
        uploaded: true, // Mark as already uploaded
        uploadedFileId: file.id, // Keep track of original file ID for status updates
        status: file.status || "DRAFT", // Include artwork status
        // Generate thumbnail URL for image files
        thumbnailUrl: file.id ? getFileThumbnailUrl(file.id, "medium") : undefined,
      }));
    }
    return [];
  });
  // Artwork status tracking - for updating status of existing artworks
  const [artworkStatuses, setArtworkStatuses] = useState<Record<string, string>>({});
  const [hasArtworkFileChanges, setHasArtworkFileChanges] = useState(false);
  const [hasArtworkStatusChanges, setHasArtworkStatusChanges] = useState(false);

  // Initialize observation files from existing data in edit mode
  const [observationFiles, setObservationFiles] = useState<FilePickerItem[]>(() => {
    if (mode === "edit" && initialData?.observation?.files) {
      // Convert existing files to FilePickerItem format
      return initialData.observation.files.map((file: any) => ({
        id: file.id,
        uri: file.url || file.path || "",
        name: file.name || file.filename || "file",
        type: file.mimeType || file.mimetype || file.type || "application/octet-stream",
        size: file.size,
        uploaded: true, // Mark as already uploaded
        // Generate thumbnail URL for image files
        thumbnailUrl: file.id ? getFileThumbnailUrl(file.id, "medium") : undefined,
      }));
    }
    return [];
  });

  // Financial file uploads - Initialize from existing data in edit mode
  const [budgetFiles, setBudgetFiles] = useState<FilePickerItem[]>(() => {
    if (mode === "edit" && initialData?.budgets) {
      return initialData.budgets.map((file: any) => ({
        id: file.id,
        uri: file.url || file.path || "",
        name: file.name || file.filename || "file",
        type: file.mimeType || file.mimetype || file.type || "application/octet-stream",
        size: file.size,
        uploaded: true,
        thumbnailUrl: file.id ? getFileThumbnailUrl(file.id, "medium") : undefined,
      }));
    }
    return [];
  });

  const [invoiceFiles, setInvoiceFiles] = useState<FilePickerItem[]>(() => {
    if (mode === "edit" && initialData?.invoices) {
      return initialData.invoices.map((file: any) => ({
        id: file.id,
        uri: file.url || file.path || "",
        name: file.name || file.filename || "file",
        type: file.mimeType || file.mimetype || file.type || "application/octet-stream",
        size: file.size,
        uploaded: true,
        thumbnailUrl: file.id ? getFileThumbnailUrl(file.id, "medium") : undefined,
      }));
    }
    return [];
  });

  const [receiptFiles, setReceiptFiles] = useState<FilePickerItem[]>(() => {
    if (mode === "edit" && initialData?.receipts) {
      return initialData.receipts.map((file: any) => ({
        id: file.id,
        uri: file.url || file.path || "",
        name: file.name || file.filename || "file",
        type: file.mimeType || file.mimetype || file.type || "application/octet-stream",
        size: file.size,
        uploaded: true,
        thumbnailUrl: file.id ? getFileThumbnailUrl(file.id, "medium") : undefined,
      }));
    }
    return [];
  });

  const [reimbursementFiles, setReimbursementFiles] = useState<FilePickerItem[]>(() => {
    if (mode === "edit" && initialData?.reimbursements) {
      return initialData.reimbursements.map((file: any) => ({
        id: file.id,
        uri: file.url || file.path || "",
        name: file.name || file.filename || "file",
        type: file.mimeType || file.mimetype || file.type || "application/octet-stream",
        size: file.size,
        uploaded: true,
        thumbnailUrl: file.id ? getFileThumbnailUrl(file.id, "medium") : undefined,
      }));
    }
    return [];
  });

  // Observation section state - auto-open if observation exists in edit mode
  const [isObservationOpen, setIsObservationOpen] = useState(
    () => mode === "edit" && !!initialData?.observation?.description
  );

  // Layout state - Initialize with existingLayouts if available (edit mode)
  // Include photoUri for new photos that need to be uploaded
  type LayoutWithPhoto = LayoutCreateFormData & { photoUri?: string };
  const [selectedLayoutSide, setSelectedLayoutSide] = useState<"left" | "right" | "back">("left");
  const [isLayoutOpen, setIsLayoutOpen] = useState(!!existingLayouts); // Auto-open if layouts exist
  const [layouts, setLayouts] = useState<{
    left?: LayoutWithPhoto;
    right?: LayoutWithPhoto;
    back?: LayoutWithPhoto;
  }>(() => {
    // If we have existing layouts from backend, use them
    if (existingLayouts) {
      console.log('[TaskForm] Initializing with existing layouts:', existingLayouts);
      return existingLayouts;
    }

    // Otherwise use defaults
    return {
      left: { height: 2.4, layoutSections: [{ width: 8, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
      right: { height: 2.4, layoutSections: [{ width: 8, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
      back: { height: 2.42, layoutSections: [{ width: 2.42, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
    };
  });

  // Track which sides were actually modified by the user (like web implementation)
  const [modifiedLayoutSides, setModifiedLayoutSides] = useState<Set<"left" | "right" | "back">>(new Set());

  // Track selected existing layouts for each side (for layout assignment)
  const [selectedExistingLayouts, setSelectedExistingLayouts] = useState<{
    left?: string;
    right?: string;
    back?: string;
  }>({});

  // Layout width validation error (same as web implementation)
  const [layoutWidthError, setLayoutWidthError] = useState<string | null>(null);

  // Update layouts when existingLayouts prop changes (important for when data loads asynchronously)
  useEffect(() => {
    if (existingLayouts) {
      console.log('[TaskForm] Updating layouts from existingLayouts prop:', existingLayouts);
      setLayouts(existingLayouts);
      setIsLayoutOpen(true); // Auto-open the layout section when data loads
    }
  }, [existingLayouts]);

  // Real-time validation of layout width balance (same as web implementation)
  useEffect(() => {
    if (!isLayoutOpen) {
      setLayoutWidthError(null);
      return;
    }

    // Get layoutSections from current layout state
    const leftLayout = layouts.left;
    const rightLayout = layouts.right;
    const leftSections = leftLayout?.layoutSections;
    const rightSections = rightLayout?.layoutSections;

    // Only validate if both sides exist and have layoutSections
    if (leftSections && leftSections.length > 0 && rightSections && rightSections.length > 0) {
      const leftTotalWidth = leftSections.reduce((sum: number, s: any) => sum + (s.width || 0), 0);
      const rightTotalWidth = rightSections.reduce((sum: number, s: any) => sum + (s.width || 0), 0);
      const widthDifference = Math.abs(leftTotalWidth - rightTotalWidth);
      const maxAllowedDifference = 0.04; // 4cm in meters

      if (widthDifference > maxAllowedDifference) {
        const errorMessage = `O layout possui diferença de largura maior que 4cm entre os lados. Lado Motorista: ${leftTotalWidth.toFixed(2)}m, Lado Sapo: ${rightTotalWidth.toFixed(2)}m (diferença de ${(widthDifference * 100).toFixed(1)}cm). Ajuste as medidas antes de enviar o formulário.`;
        setLayoutWidthError(errorMessage);
      } else {
        setLayoutWidthError(null);
      }
    } else {
      // Clear error if one side doesn't have sections
      setLayoutWidthError(null);
    }
  }, [layouts, isLayoutOpen]);

  // Use useEditForm for edit mode with change detection, regular useForm for create mode
  const defaultFormValues = {
    name: initialData?.name || "",
    customerId: initialData?.customerId || "",
    invoiceToId: initialData?.invoiceToId || null,
    negotiatingWith: initialData?.negotiatingWith || { name: "", phone: "" },
    sectorId: initialData?.sectorId || null,
    serialNumber: initialData?.serialNumber || null,
    truck: initialData?.truck ? {
      plate: initialData.truck.plate || null,
      chassisNumber: initialData.truck.chassisNumber || null,
      category: (initialData.truck as any).category || null,
      implementType: (initialData.truck as any).implementType || null,
      spot: (initialData.truck as any).spot || null,
    } : {
      plate: null,
      chassisNumber: null,
      category: null,
      implementType: null,
      spot: null,
    },
    details: initialData?.details || null,
    entryDate: initialData?.entryDate || null,
    term: initialData?.term || null,
    forecastDate: initialData?.forecastDate || null,
    paintId: initialData?.paintId || null,
    paintIds: initialData?.paintIds || [],
    baseFileIds: initialData?.baseFileIds || [],
    artworkIds: initialData?.artworkIds || [],
    observation: initialData?.observation || null,
    serviceOrders: initialData?.serviceOrders?.map((s: any) => ({
      id: s.id || undefined, // For existing service orders
      description: s.description || "",
      status: s.status || SERVICE_ORDER_STATUS.PENDING,
      statusOrder: s.statusOrder || 1,
      type: s.type || SERVICE_ORDER_TYPE.PRODUCTION,
      assignedToId: s.assignedToId || null,
      observation: s.observation || null, // For rejection/approval notes
      startedAt: s.startedAt || null,
      finishedAt: s.finishedAt || null,
    })) || [{
      description: "",
      status: SERVICE_ORDER_STATUS.PENDING,
      statusOrder: 1,
      type: SERVICE_ORDER_TYPE.PRODUCTION,
      assignedToId: null,
      observation: null
    }],
    // Initialize pricing with default structure - default row is part of initial state, not a change
    pricing: initialData?.pricing ? {
      expiresAt: initialData.pricing.expiresAt ? new Date(initialData.pricing.expiresAt) : null,
      status: initialData.pricing.status || 'DRAFT',
      subtotal: initialData.pricing.subtotal || 0,
      discountType: initialData.pricing.discountType || 'NONE',
      discountValue: initialData.pricing.discountValue || null,
      total: initialData.pricing.total || 0,
      // Payment Terms
      paymentCondition: initialData.pricing.paymentCondition || null,
      downPaymentDate: initialData.pricing.downPaymentDate ? new Date(initialData.pricing.downPaymentDate) : null,
      customPaymentText: initialData.pricing.customPaymentText || null,
      // Guarantee Terms
      guaranteeYears: initialData.pricing.guaranteeYears || null,
      customGuaranteeText: initialData.pricing.customGuaranteeText || null,
      // Layout File
      layoutFileId: initialData.pricing.layoutFileId || null,
      items: initialData.pricing.items?.length > 0
        ? initialData.pricing.items.map((item: any) => ({
            id: item.id,
            description: item.description || "",
            amount: typeof item.amount === 'number' ? item.amount : (item.amount ? Number(item.amount) : 0),
          }))
        : [{ description: "", amount: null }], // Default empty row
    } : undefined, // undefined when no pricing exists (optional field)
    // Initialize cuts with default empty array (MultiCutSelector handles its own defaults)
    cuts: initialData?.cuts && initialData.cuts.length > 0
      ? initialData.cuts.map((cut: any) => ({
          id: cut.id,
          type: cut.type,
          quantity: cut.quantity || 1,
          origin: cut.origin,
          fileId: cut.fileId,
          fileName: cut.file?.name || cut.fileName,
        }))
      : [],
    // Initialize airbrushings with default empty array (MultiAirbrushingSelector handles its own defaults)
    airbrushings: initialData?.airbrushings && initialData.airbrushings.length > 0
      ? initialData.airbrushings.map((a: any) => ({
          id: a.id, // Preserve original airbrushing ID
          startDate: a.startDate ? new Date(a.startDate) : null,
          finishDate: a.finishDate ? new Date(a.finishDate) : null,
          price: a.price,
          status: a.status,
          receiptIds: a.receipts?.map((r: any) => r.id) || [],
          invoiceIds: a.invoices?.map((n: any) => n.id) || [],
          artworkIds: a.artworks?.map((art: any) => art.fileId || art.file?.id || art.id) || [],
        }))
      : [],
    status: initialData?.status || TASK_STATUS.PREPARATION,
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
        fieldsToOmitIfUnchanged: ["serviceOrders", "paintIds"], // Don't include if unchanged
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

  // Artwork files are now handled directly by FilePicker

  // Observation files are now handled directly by FilePicker

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

    // Check if backside layout has a photo to upload (only backside supports photos)
    const hasLayoutPhotos = isLayoutOpen && layouts.back?.photoUri;

    // Filter only NEW files (not already uploaded)
    const newBaseFiles = baseFiles.filter(f => !f.uploaded);
    const newArtworkFiles = artworkFiles.filter(f => !f.uploaded);
    const newObservationFiles = observationFiles.filter(f => !f.uploaded);
    const newBudgetFiles = budgetFiles.filter(f => !f.uploaded);
    const newInvoiceFiles = invoiceFiles.filter(f => !f.uploaded);
    const newReceiptFiles = receiptFiles.filter(f => !f.uploaded);
    const newReimbursementFiles = reimbursementFiles.filter(f => !f.uploaded);

    // Debug logging for file upload
    console.log('[TaskForm] File upload check:', {
      artworkFilesCount: artworkFiles.length,
      observationFilesCount: observationFiles.length,
      newArtworkFilesCount: newArtworkFiles.length,
      newObservationFilesCount: newObservationFiles.length,
      hasLayoutPhotos,
      isObservationOpen,
    });

    if (newObservationFiles.length > 0) {
      console.log('[TaskForm] Observation files to upload:', newObservationFiles.map(f => ({ uri: f.uri, name: f.name, type: f.type })));
    }

    // If we have NEW files to upload, convert to FormData with context for proper file organization
    if (newBaseFiles.length > 0 || newArtworkFiles.length > 0 || newObservationFiles.length > 0 || newBudgetFiles.length > 0 || newInvoiceFiles.length > 0 || newReceiptFiles.length > 0 || newReimbursementFiles.length > 0 || hasLayoutPhotos) {
      // Prepare files with proper structure - only NEW files
      const files: Record<string, any[]> = {};

      if (newBaseFiles.length > 0) {
        files.baseFiles = newBaseFiles;
      }

      if (newArtworkFiles.length > 0) {
        files.artworks = newArtworkFiles;
      }

      if (newObservationFiles.length > 0) {
        files.observationFiles = newObservationFiles;
      }

      if (newBudgetFiles.length > 0) {
        files.budgetFiles = newBudgetFiles;
      }

      if (newInvoiceFiles.length > 0) {
        files.invoiceFiles = newInvoiceFiles;
      }

      if (newReceiptFiles.length > 0) {
        files.receiptFiles = newReceiptFiles;
      }

      if (newReimbursementFiles.length > 0) {
        files.reimbursementFiles = newReimbursementFiles;
      }

      // Prepare form data (excluding files)
      const formDataFields: Record<string, any> = {
        name: data.name,
        customerId: data.customerId,
        serviceOrders: data.serviceOrders, // Will be serialized as JSON in helper
      };

      // Add optional fields
      if (data.invoiceToId) formDataFields.invoiceToId = data.invoiceToId;
      // Only include negotiatingWith if both name and phone are filled
      if (data.negotiatingWith && data.negotiatingWith.name && data.negotiatingWith.phone) {
        formDataFields.negotiatingWith = data.negotiatingWith;
      }
      if (data.sectorId) formDataFields.sectorId = data.sectorId;
      if (data.serialNumber) formDataFields.serialNumber = data.serialNumber.toUpperCase();

      // Handle truck object structure
      if (data.truck) {
        const truckData: any = {};
        if (data.truck.plate) {
          truckData.plate = data.truck.plate.toUpperCase();
        }
        if (data.truck.chassisNumber) {
          // Clean and uppercase chassis number
          truckData.chassisNumber = data.truck.chassisNumber.replace(/\s/g, "").toUpperCase();
        }
        if (data.truck.category) {
          truckData.category = data.truck.category;
        }
        if (data.truck.implementType) {
          truckData.implementType = data.truck.implementType;
        }
        if (Object.keys(truckData).length > 0) {
          formDataFields.truck = truckData;
        }
      }

      if (data.details) formDataFields.details = data.details;
      if (data.entryDate) formDataFields.entryDate = data.entryDate;
      if (data.term) formDataFields.term = data.term;
      if (data.forecastDate) formDataFields.forecastDate = data.forecastDate;
      if (data.paintId) formDataFields.paintId = data.paintId;
      if (data.status) formDataFields.status = data.status;
      if (data.commission) formDataFields.commission = data.commission;
      if (data.startedAt) formDataFields.startedAt = data.startedAt;
      if (data.finishedAt) formDataFields.finishedAt = data.finishedAt;
      if (data.paintIds && data.paintIds.length > 0) formDataFields.paintIds = data.paintIds;

      // Include existing base file IDs when uploading new base files
      // This ensures backend tracks the changes correctly in changelog
      if (newBaseFiles.length > 0) {
        // Get IDs of existing (already uploaded) base files
        const existingBaseFileIds = baseFiles
          .filter(f => f.uploaded && f.id)
          .map(f => f.id);
        // Always include baseFileIds (even if empty) so backend tracks the change
        formDataFields.baseFileIds = existingBaseFileIds;
      }

      // Include existing artwork IDs when uploading new artworks
      // This ensures backend tracks the changes correctly in changelog
      if (newArtworkFiles.length > 0) {
        // Get IDs of existing (already uploaded) artwork files
        const existingArtworkIds = artworkFiles
          .filter(f => f.uploaded && f.id)
          .map(f => f.id);
        // Always include artworkIds (even if empty) so backend tracks the change
        formDataFields.artworkIds = existingArtworkIds;
      }

      // Include existing financial file IDs when uploading new files
      if (newBudgetFiles.length > 0) {
        const existingBudgetIds = budgetFiles.filter(f => f.uploaded && f.id).map(f => f.id);
        formDataFields.budgetIds = existingBudgetIds;
      }

      if (newInvoiceFiles.length > 0) {
        const existingInvoiceIds = invoiceFiles.filter(f => f.uploaded && f.id).map(f => f.id);
        formDataFields.invoiceIds = existingInvoiceIds;
      }

      if (newReceiptFiles.length > 0) {
        const existingReceiptIds = receiptFiles.filter(f => f.uploaded && f.id).map(f => f.id);
        formDataFields.receiptIds = existingReceiptIds;
      }

      if (newReimbursementFiles.length > 0) {
        const existingReimbursementIds = reimbursementFiles.filter(f => f.uploaded && f.id).map(f => f.id);
        formDataFields.reimbursementIds = existingReimbursementIds;
      }

      // Add observation if section is open
      if (isObservationOpen && data.observation) {
        // Get IDs of existing (already uploaded) files
        const existingFileIds = observationFiles
          .filter(f => f.uploaded && f.id)
          .map(f => f.id);

        formDataFields.observation = {
          description: data.observation.description,
          // Include existing file IDs so backend knows to keep them
          ...(existingFileIds.length > 0 && { fileIds: existingFileIds }),
        };
      }

      // Add layouts if present - consolidate into truck object (following web implementation)
      if (isLayoutOpen && modifiedLayoutSides.size > 0) {
        // Start with existing truck data from form
        const consolidatedTruck: any = formDataFields.truck || {};

        for (const side of modifiedLayoutSides) {
          const existingLayoutId = selectedExistingLayouts[side];
          const sideData = layouts[side];

          // Map internal side names to API field names
          const layoutFieldName = side === 'left' ? 'leftSideLayout' : side === 'right' ? 'rightSideLayout' : 'backSideLayout';
          const sideName = side === 'left' ? 'leftSide' : side === 'right' ? 'rightSide' : 'backSide';

          // If an existing layout is selected, use existingLayoutId query parameter
          if (existingLayoutId) {
            console.log(`[TaskForm] Using existing layout ${existingLayoutId} for ${side} side`);
            consolidatedTruck[layoutFieldName] = {
              existingLayoutId,
            };
          } else if (sideData && sideData.layoutSections && sideData.layoutSections.length > 0) {
            // Otherwise, create a new layout
            consolidatedTruck[layoutFieldName] = {
              height: sideData.height,
              layoutSections: sideData.layoutSections,
              photoId: sideData.photoId || null,
            };
            console.log(`[TaskForm] Added ${layoutFieldName} to consolidated truck`);

            // Add layout photo if present (only backside supports photos)
            if (side === 'back' && sideData.photoUri) {
              // Backend expects: layoutPhotos.backSide
              files[`layoutPhotos.${sideName}`] = [{
                uri: sideData.photoUri,
                name: `layout-${sideName}-${Date.now()}.jpg`,
                type: 'image/jpeg',
              }];
              console.log(`[TaskForm] Added layout photo for ${sideName}:`, sideData.photoUri);
            }
          }
        }

        formDataFields.truck = consolidatedTruck;
        console.log('[TaskForm] Consolidated truck:', consolidatedTruck);
      }

      // Add artwork statuses if changed (filter to UUIDs only, not temp IDs)
      if (hasArtworkStatusChanges && Object.keys(artworkStatuses).length > 0) {
        const filteredArtworkStatuses: Record<string, string> = {};
        Object.entries(artworkStatuses).forEach(([fileId, status]) => {
          // Only include real UUIDs, not temporary IDs
          if (fileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId)) {
            filteredArtworkStatuses[fileId] = status;
          }
        });
        if (Object.keys(filteredArtworkStatuses).length > 0) {
          formDataFields.artworkStatuses = filteredArtworkStatuses;
          console.log('[TaskForm] Including artworkStatuses (filtered UUIDs):', filteredArtworkStatuses);
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
      console.log('[TaskForm] FormData submission completed');

      // Reset artwork flags after successful submission
      if (hasArtworkStatusChanges || hasArtworkFileChanges) {
        console.log('[TaskForm] Resetting artwork flags after successful submission');
        setHasArtworkStatusChanges(false);
        setHasArtworkFileChanges(false);
      }
    } else {
      // No files - submit as regular JSON with proper formatting
      const cleanedData: any = {
        ...data,
        serialNumber: data.serialNumber?.toUpperCase() || null,
      };

      // Only include negotiatingWith if both name and phone are filled
      if (cleanedData.negotiatingWith) {
        if (!cleanedData.negotiatingWith.name || !cleanedData.negotiatingWith.phone) {
          cleanedData.negotiatingWith = null;
        }
      }

      // Handle truck object structure
      if (data.truck) {
        cleanedData.truck = {
          plate: data.truck.plate?.toUpperCase() || null,
          chassisNumber: data.truck.chassisNumber?.replace(/\s/g, "").toUpperCase() || null,
          category: data.truck.category || null,
          implementType: data.truck.implementType || null,
        };
      }

      // Add observation if section is open (no files case)
      if (isObservationOpen && data.observation) {
        // Get IDs of existing (already uploaded) files
        const existingFileIds = observationFiles
          .filter(f => f.uploaded && f.id)
          .map(f => f.id);

        cleanedData.observation = {
          description: data.observation.description,
          // Include existing file IDs so backend knows to keep them
          ...(existingFileIds.length > 0 && { fileIds: existingFileIds }),
        };
      } else {
        delete cleanedData.observation;
      }

      // Add layouts if present - consolidate into truck object (following web implementation)
      if (isLayoutOpen && modifiedLayoutSides.size > 0) {
        // Start with existing truck data from form
        const consolidatedTruck: any = cleanedData.truck || {};

        for (const side of modifiedLayoutSides) {
          const existingLayoutId = selectedExistingLayouts[side];
          const sideData = layouts[side];

          // Map internal side names to API field names
          const layoutFieldName = side === 'left' ? 'leftSideLayout' : side === 'right' ? 'rightSideLayout' : 'backSideLayout';

          // If an existing layout is selected, use existingLayoutId query parameter
          if (existingLayoutId) {
            console.log(`[TaskForm] Using existing layout ${existingLayoutId} for ${side} side (JSON)`);
            consolidatedTruck[layoutFieldName] = {
              existingLayoutId,
            };
          } else if (sideData && sideData.layoutSections && sideData.layoutSections.length > 0) {
            // Otherwise, create a new layout
            consolidatedTruck[layoutFieldName] = {
              height: sideData.height,
              layoutSections: sideData.layoutSections,
              photoId: sideData.photoId || null,
            };
            console.log(`[TaskForm] Added ${layoutFieldName} to consolidated truck (JSON)`);
          }
        }

        cleanedData.truck = consolidatedTruck;
        console.log('[TaskForm] Consolidated truck (JSON):', consolidatedTruck);
      }

      // Add artwork statuses if changed (JSON path)
      if (hasArtworkStatusChanges && Object.keys(artworkStatuses).length > 0) {
        const filteredArtworkStatuses: Record<string, string> = {};
        Object.entries(artworkStatuses).forEach(([fileId, status]) => {
          // Only include real UUIDs, not temporary IDs
          if (fileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId)) {
            filteredArtworkStatuses[fileId] = status;
          }
        });
        if (Object.keys(filteredArtworkStatuses).length > 0) {
          cleanedData.artworkStatuses = filteredArtworkStatuses;
          console.log('[TaskForm] Including artworkStatuses in JSON (filtered UUIDs):', filteredArtworkStatuses);
        }
      }

      await onSubmit(cleanedData);
      console.log('[TaskForm] JSON submission completed');

      // Reset artwork flags after successful submission
      if (hasArtworkStatusChanges || hasArtworkFileChanges) {
        console.log('[TaskForm] Resetting artwork flags after successful submission (JSON path)');
        setHasArtworkStatusChanges(false);
        setHasArtworkFileChanges(false);
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
            <FormCard title="Informações Básicas" icon="IconClipboard">
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
              <FormFieldGroup label="Cliente" error={errors.customerId?.message}>
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

              {/* Invoice To Customer - Disabled for financial, warehouse, designer */}
              <FormFieldGroup label="Faturar Para (Opcional)" error={errors.invoiceToId?.message}>
                <Controller
                  control={form.control}
                  name="invoiceToId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <CustomerSelector
                      value={value}
                      onValueChange={onChange}
                      disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector}
                      error={error?.message}
                      required={false}
                    />
                  )}
                />
              </FormFieldGroup>

              {/* Negotiating With - Contact Person */}
              <SimpleFormField label="Negociando Com (Opcional)" error={errors.negotiatingWith?.name?.message || (errors.negotiatingWith as any)?.message}>
                <Controller
                  control={form.control}
                  name="negotiatingWith.name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Nome do contato"
                      error={!!errors.negotiatingWith}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </SimpleFormField>

              <SimpleFormField label="Telefone do Contato (Opcional)" error={errors.negotiatingWith?.phone?.message}>
                <Controller
                  control={form.control}
                  name="negotiatingWith.phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      type="phone"
                      value={value || ""}
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: (11) 99999-9999"
                      error={!!errors.negotiatingWith}
                      editable={!isSubmitting}
                      keyboardType="phone-pad"
                    />
                  )}
                />
              </SimpleFormField>

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
                  render={({ field: { onChange, onBlur, value } }) => {
                    // Format Brazilian license plate for display
                    // Old format: ABC-1234 (3 letters + hyphen + 4 numbers)
                    // Mercosul format: ABC-1D23 (3 letters + hyphen + 1 number + 1 letter + 2 numbers)
                    const formatPlate = (val: string) => {
                      const clean = val.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                      if (clean.length <= 3) {
                        return clean;
                      }

                      // Check if it's Mercosul format (5th character is a letter)
                      const fifthChar = clean.charAt(4);
                      const isMercosul = fifthChar && /[A-Z]/i.test(fifthChar);

                      // Format: ABC-1234 or ABC-1D23
                      return clean.slice(0, 3) + '-' + clean.slice(3, 7);
                    };

                    const handleChange = (text: string) => {
                      // Remove all non-alphanumeric characters, convert to uppercase
                      const cleanValue = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                      // Limit to 7 characters (3 letters + 4 chars)
                      const limitedValue = cleanValue.slice(0, 7);
                      onChange(limitedValue);
                    };

                    return (
                      <Input
                        value={formatPlate(value || "")}
                        onChangeText={handleChange}
                        onBlur={onBlur}
                        placeholder="Ex: ABC-1234 ou ABC-1D23"
                        autoCapitalize="characters"
                        maxLength={8}
                        error={!!errors.truck?.plate}
                      />
                    );
                  }}
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

              {/* Truck - Category */}
              <SimpleFormField label="Categoria do Caminhão (Opcional)" error={errors.truck?.category}>
                <Controller
                  control={form.control}
                  name="truck.category"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={Object.values(TRUCK_CATEGORY).map((category) => ({
                        value: category,
                        label: TRUCK_CATEGORY_LABELS[category],
                      }))}
                      placeholder="Selecione a categoria"
                      searchable={false}
                      clearable={true}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </SimpleFormField>

              {/* Truck - Implement Type */}
              <SimpleFormField label="Tipo de Implemento (Opcional)" error={errors.truck?.implementType}>
                <Controller
                  control={form.control}
                  name="truck.implementType"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={Object.values(IMPLEMENT_TYPE).map((type) => ({
                        value: type,
                        label: IMPLEMENT_TYPE_LABELS[type],
                      }))}
                      placeholder="Selecione o tipo"
                      searchable={false}
                      clearable={true}
                      disabled={isSubmitting}
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

              {/* Commission Status - Hidden for financial and commercial sectors */}
              {!isFinancialSector && !isCommercialSector && (
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
                      disabled={isSubmitting}
                    />
                  )}
                />
              </SimpleFormField>
              )}

              {/* Status (edit mode only) */}
              {mode === "edit" && (
                <SimpleFormField label="Status" error={errors.status}>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field: { onChange, value } }) => (
                      <Combobox
                        value={value || TASK_STATUS.WAITING_PRODUCTION}
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

              {/* Forecast Date */}
              <Controller
                control={form.control}
                name="forecastDate"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View style={styles.fieldGroup}>
                    <Label>Data de Previsão</Label>
                    <DatePicker
                      value={value ?? undefined}
                      onChange={onChange}
                      type="datetime"
                      placeholder="Selecione a data de previsão"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </FormCard>

          {/* Additional Dates (edit mode only) */}
          {mode === "edit" && (
          <FormCard title="Datas Adicionais" icon="IconCalendar">
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

          {/* Service Orders */}
          <FormCard title="Ordens de Serviço" icon="IconTool">
              <FormFieldGroup error={errors.serviceOrders?.message}>
                <Controller
                  control={form.control}
                  name="serviceOrders"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <ServiceSelectorAutoGrouped
                      services={value || []}
                      onChange={onChange}
                      disabled={isSubmitting}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>
          </FormCard>

          {/* Paints */}
          <FormCard title="Tintas" icon="IconPalette">
              {/* General Painting */}
              <Controller
                control={form.control}
                name="paintId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <GeneralPaintingSelector
                    value={value || undefined}
                    onValueChange={onChange}
                    disabled={isSubmitting}
                    error={error?.message}
                    initialPaint={initialGeneralPaint}
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
                    initialPaints={initialLogoPaints}
                  />
                )}
              />
          </FormCard>

          {/* TODO: Pricing Card - PricingSelector component not yet implemented for mobile
          {canViewPricingSections && (
            <FormCard
              title="Precificação"
              icon="IconFileInvoice"
              badge={pricingItemCount > 0 ? pricingItemCount : undefined}
            >
              <PricingSelector
                ref={pricingSelectorRef}
                control={form.control}
                disabled={isSubmitting}
                userRole={user?.sector?.privileges}
                onItemCountChange={setPricingItemCount}
                layoutFiles={pricingLayoutFiles}
                onLayoutFilesChange={setPricingLayoutFiles}
              />
            </FormCard>
          )}
          */}

          {/* TODO: Cut Plans Section - MultiCutSelector component not yet implemented for mobile
          {!isFinancialSector && !isLogisticSector && !isCommercialSector && (
            <FormCard
              title="Plano de Corte"
              icon="IconScissors"
              badge={cutsCount > 0 ? cutsCount : undefined}
            >
              <MultiCutSelector
                ref={multiCutSelectorRef}
                control={form.control}
                disabled={isSubmitting}
                onCutsCountChange={setCutsCount}
              />
            </FormCard>
          )}
          */}

          {/* TODO: Airbrushing Section - MultiAirbrushingSelector not imported/integrated
          {!isWarehouseSector && !isFinancialSector && !isDesignerSector && !isLogisticSector && !isCommercialSector && (
            <FormCard
              title="Aerografias"
              icon="IconSparkles"
              badge={airbrushingsCount > 0 ? airbrushingsCount : undefined}
            >
              <MultiAirbrushingSelector
                ref={multiAirbrushingSelectorRef}
                control={form.control}
                disabled={isSubmitting}
                onAirbrushingsCountChange={setAirbrushingsCount}
              />
            </FormCard>
          )}
          */}

          {/* Truck Layout Section - Hidden for financial, warehouse, and commercial users */}
          {!isFinancialSector && !isWarehouseSector && !isCommercialSector && (
          <Card>
            <View style={[styles.collapsibleCardHeader, isLayoutOpen && styles.collapsibleCardHeaderOpen, isLayoutOpen && { borderBottomColor: colors.border }]}>
              <View style={styles.collapsibleCardTitleRow}>
                <Icon name="IconRuler" size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.collapsibleCardTitle}>Layout do Caminhão</ThemedText>
              </View>
              {!isLayoutOpen ? (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setIsLayoutOpen(true);
                    // When adding a new layout (no existing layouts), mark all sides as modified
                    // so they all get created with default values
                    if (!existingLayouts) {
                      setModifiedLayoutSides(new Set(['left', 'right', 'back']));
                    }
                  }}
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
                      left: { height: 2.4, layoutSections: [{ width: 8, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
                      right: { height: 2.4, layoutSections: [{ width: 8, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
                      back: { height: 2.42, layoutSections: [{ width: 2.42, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
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
                  showLayoutSelection={true}
                  onSelectExistingLayout={(side, layoutId) => {
                    console.log('[TaskForm] Selected existing layout:', { side, layoutId });
                    setSelectedExistingLayouts(prev => ({
                      ...prev,
                      [side]: layoutId,
                    }));
                    setModifiedLayoutSides(prev => {
                      const newSet = new Set(prev);
                      newSet.add(side);
                      return newSet;
                    });
                  }}
                  onChange={(side, layoutData) => {
                    console.log('[TaskForm] 📥 Received onChange from LayoutForm:', {
                      side,
                      hasPhotoUri: !!(layoutData as any).photoUri,
                      photoUri: (layoutData as any).photoUri,
                      hasPhotoId: !!layoutData.photoId,
                      photoId: layoutData.photoId,
                      layoutSectionsCount: layoutData.layoutSections?.length,
                    });
                    setModifiedLayoutSides((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(side);
                      return newSet;
                    });
                    setLayouts((prev) => {
                      const newLayouts = {
                        ...prev,
                        [side]: layoutData,
                      };
                      console.log('[TaskForm] 📦 Updated layouts state:', {
                        side,
                        newLayoutPhotoUri: (newLayouts[side] as any)?.photoUri,
                        newLayoutPhotoId: newLayouts[side]?.photoId,
                      });
                      return newLayouts;
                    });
                  }}
                  disabled={isSubmitting}
                  embedded={true}
                />

                {/* Layout Width Validation Error */}
                {layoutWidthError && (
                  <View style={[styles.layoutValidationError, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive }]}>
                    <Icon name="alert-triangle" size={18} color={colors.destructive} />
                    <ThemedText style={[styles.layoutValidationErrorText, { color: colors.destructive }]}>
                      {layoutWidthError}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </Card>
          )}

          {/* Truck Spot Selector - Edit mode only, when layout data exists - after layout section */}
          {mode === "edit" && (existingLayouts || isLayoutOpen) && (
            <FormCard title="Local do Caminhão" icon="IconMapPin">
              <Controller
                control={form.control}
                name="truck.spot"
                render={({ field: { onChange, value } }) => {
                  // Calculate truck length from layout sections
                  const leftLayout = layouts.left;
                  const leftSections = leftLayout?.layoutSections;
                  let truckLength: number | null = null;
                  if (leftSections && leftSections.length > 0) {
                    const sectionsSum = leftSections.reduce((sum: number, s: any) => sum + (s.width || 0), 0);
                    // Add cabin if < 10m (1.8m cabin - average Brazilian truck cab)
                    truckLength = sectionsSum < 10 ? sectionsSum + 1.8 : sectionsSum;
                  }

                  return (
                    <SpotSelector
                      truckLength={truckLength}
                      currentSpot={value as TRUCK_SPOT | null}
                      truckId={(initialData?.truck as any)?.id}
                      onSpotChange={(spot) => onChange(spot)}
                      disabled={isSubmitting}
                    />
                  );
                }}
              />
            </FormCard>
          )}

          {/* Base Files - Hidden for warehouse, financial, logistic users */}
          {!isWarehouseSector && !isFinancialSector && !isLogisticSector && (
            <FormCard title="Arquivos Base (Opcional)" icon="IconFile">
                <FilePicker
                  value={baseFiles}
                  onChange={setBaseFiles}
                  maxFiles={5}
                  placeholder="Adicionar arquivos base"
                  helperText="Arquivos usados como base para criação das artes"
                  showCamera={false}
                  showVideoCamera={false}
                  showGallery={true}
                  showFilePicker={true}
                  disabled={isSubmitting}
                />
            </FormCard>
          )}

          {/* Artworks - Last section, hidden for warehouse, financial, logistic users */}
          {!isWarehouseSector && !isFinancialSector && !isLogisticSector && (
            <FormCard title="Artes (Opcional)" icon="IconPhotoPlus">
                <ArtworkFileUploadField
                  onFilesChange={(files) => {
                    console.log('[TaskForm] 🎨 Artworks changed:', files.length);
                    setArtworkFiles(files);
                    setHasArtworkFileChanges(true);
                  }}
                  onStatusChange={(fileId, status) => {
                    console.log('[TaskForm] 🎨 Artwork status changed:', { fileId, status });
                    setArtworkStatuses(prev => {
                      const newStatuses = {
                        ...prev,
                        [fileId]: status,
                      };
                      console.log('[TaskForm] 🎨 New artworkStatuses:', newStatuses);
                      return newStatuses;
                    });
                    setHasArtworkStatusChanges(true);
                    console.log('[TaskForm] 🎨 Set hasArtworkStatusChanges to true');
                  }}
                  maxFiles={5}
                  disabled={isSubmitting}
                  showPreview={true}
                  existingFiles={artworkFiles}
                  placeholder="Adicione artes relacionadas à tarefa"
                />
            </FormCard>
          )}
        </View>
        </KeyboardAwareFormProvider>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <FormActionBar
        onCancel={onCancel}
        onSubmit={() => {
          // Check for layout width error before submitting
          if (layoutWidthError) {
            Alert.alert(
              "Erro de Layout",
              "Corrija os erros de layout antes de enviar o formulário.",
              [{ text: "OK" }]
            );
            return;
          }

          // Error handler for validation failures
          const onInvalidHandler = (errors: any) => {
            console.log('[TaskForm] Validation failed:', errors);

            // Get first error message to show to user
            const errorMessages: string[] = [];

            if (errors.name) {
              errorMessages.push(`Nome: ${errors.name.message}`);
            }
            if (errors.customerId) {
              errorMessages.push(`Cliente: ${errors.customerId.message}`);
            }
            if (errors.serviceOrders) {
              const serviceOrdersError = errors.serviceOrders as any;
              if (serviceOrdersError.message) {
                errorMessages.push(`Ordens de Serviço: ${serviceOrdersError.message}`);
              } else if (serviceOrdersError.root?.message) {
                errorMessages.push(`Ordens de Serviço: ${serviceOrdersError.root.message}`);
              }
              // Note: Service orders are now optional, so no fallback error message needed
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
            const handledFields = ['name', 'customerId', 'serviceOrders', 'term', 'startedAt', 'finishedAt'];
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
          };

          // Use handleSubmitChanges for edit mode (only sends changed fields)
          // Use handleSubmit for create mode (sends all fields)
          if (mode === "edit" && 'handleSubmitChanges' in form) {
            // Edit mode: only submit changed fields
            (form as any).handleSubmitChanges(
              (data: any) => {
                console.log('[TaskForm Edit] Submitting only changed fields...');
                handleSubmit(data);
              },
              onInvalidHandler
            )();
          } else {
            // Create mode: submit all fields
            form.handleSubmit(
              (data) => {
                console.log('[TaskForm Create] Validation passed, submitting...');
                handleSubmit(data);
              },
              onInvalidHandler
            )();
          }
        }}
        isSubmitting={isSubmitting}
        canSubmit={!layoutWidthError}
        submitLabel={mode === "create" ? "Salvar Tarefa" : "Salvar Alterações"}
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
    fontSize: 16,
    fontWeight: "500" as any,
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
  layoutValidationError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  layoutValidationErrorText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
