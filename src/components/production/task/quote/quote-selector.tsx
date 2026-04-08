import { useState, useMemo, useCallback, forwardRef, useImperativeHandle, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, Pressable, TextInput, Text as RNText } from "react-native";
import { useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { SERVICE_ORDER_TYPE } from "@/constants/enums";
import { DISCOUNT_TYPE_LABELS, PAYMENT_CONDITION_LABELS, GUARANTEE_YEARS_LABELS, TASK_QUOTE_STATUS_LABELS } from "@/constants/enum-labels";
import { DISCOUNT_TYPE, PAYMENT_CONDITION, TASK_QUOTE_STATUS } from "@/constants/enums";
import { getServiceDescriptionsByType } from "@/constants/service-descriptions";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { formatCurrency } from "@/utils";
import { IconNote, IconTrash, IconPlus, IconCalendar, IconCurrencyReal, IconPhoto, IconFileInvoice, IconFileSearch, IconUpload, IconArrowLeft, IconX } from "@tabler/icons-react-native";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { getCustomers } from "@/api-client";
import { ONLINE_API_URL } from "@/constants/api";
import { CustomerLogoDisplay } from "@/components/ui/customer-logo-display";
import { formatCNPJ } from "@/utils";
import { Image } from "expo-image";
import { useFileViewer } from "@/components/file";
import type { Customer } from "@/types";

// Payment condition options
const PAYMENT_CONDITIONS = [
  { value: "CASH_5", label: "À vista (5 dias)" },
  { value: "CASH_40", label: "À vista (40 dias)" },
  { value: "INSTALLMENTS_2", label: "Entrada + 20" },
  { value: "INSTALLMENTS_3", label: "Entrada + 20/40" },
  { value: "INSTALLMENTS_4", label: "Entrada + 20/40/60" },
  { value: "INSTALLMENTS_5", label: "Entrada + 20/40/60/80" },
  { value: "INSTALLMENTS_6", label: "Entrada + 20/40/60/80/100" },
  { value: "INSTALLMENTS_7", label: "Entrada + 20/40/60/80/100/120" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

// Guarantee options
const GUARANTEE_OPTIONS = [
  { value: "5", label: "5 anos" },
  { value: "10", label: "10 anos" },
  { value: "15", label: "15 anos" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

// Validity period options
const VALIDITY_PERIOD_OPTIONS = [
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
];

// Status options
const STATUS_OPTIONS = Object.values(TASK_QUOTE_STATUS).map((value) => ({
  value,
  label: TASK_QUOTE_STATUS_LABELS[value],
}));

// Forecast days options (1-30)
const FORECAST_DAYS_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i + 1 === 1 ? 'dia' : 'dias'}`,
}));

interface ArtworkOption {
  id: string; // File ID (flattened)
  artworkId?: string;
  filename?: string;
  originalName?: string;
  thumbnailUrl?: string | null;
  status?: string;
  mimetype?: string;
  size?: number;
}

interface QuoteSelectorProps {
  control: any;
  disabled?: boolean;
  userRole?: string;
  onItemCountChange?: (count: number) => void;
  layoutFiles?: FilePickerItem[];
  onLayoutFilesChange?: (files: FilePickerItem[]) => void;
  /** Initial invoice-to customer objects for populating the combobox in edit mode */
  initialInvoiceToCustomers?: Array<{ id: string; fantasyName?: string; [key: string]: any }>;
  /** Task artworks available for selection as quote layout */
  artworks?: ArtworkOption[];
}

export interface QuoteSelectorRef {
  addItem: () => void;
  clearAll: () => void;
}

export const QuoteSelector = forwardRef<QuoteSelectorRef, QuoteSelectorProps>(
  ({ control, disabled, userRole, onItemCountChange, layoutFiles: externalLayoutFiles, onLayoutFilesChange, initialInvoiceToCustomers, artworks }, ref) => {
    const { colors } = useTheme();
    const fileViewer = useFileViewer();
    const [validityPeriod, setValidityPeriod] = useState<number | null>(null);
    const [showCustomPayment, setShowCustomPayment] = useState<Record<string, boolean>>({});
    const [showCustomGuarantee, setShowCustomGuarantee] = useState(false);
    // Cache for customer objects (for display in per-customer sections)
    const [selectedCustomers, setSelectedCustomers] = useState<Map<string, any>>(new Map());
    const [showLayoutUploadMode, setShowLayoutUploadMode] = useState(false);
    // Use external layout files if provided, otherwise use local state
    const [localLayoutFiles, setLocalLayoutFiles] = useState<FilePickerItem[]>([]);
    const layoutFiles = externalLayoutFiles ?? localLayoutFiles;
    const setLayoutFiles = onLayoutFilesChange ?? setLocalLayoutFiles;
    const [initialized, setInitialized] = useState(false);
    const { setValue, clearErrors, getValues } = useFormContext();

    const { fields, append, prepend, remove } = useFieldArray({
      control,
      name: "quote.services",
    });

    // Watch pricing values
    const quoteItems = useWatch({ control, name: "quote.services" });
    const quoteStatus = useWatch({ control, name: "quote.status" }) || "PENDING";
    const quoteExpiresAt = useWatch({ control, name: "quote.expiresAt" });
    const discountType = useWatch({ control, name: "quote.customerConfigs.0.discountType" }) || DISCOUNT_TYPE.NONE;
    const discountValue = useWatch({ control, name: "quote.customerConfigs.0.discountValue" });
    const paymentCondition = useWatch({ control, name: "quote.paymentCondition" });
    const customPaymentText = useWatch({ control, name: "quote.customerConfigs.0.customPaymentText" });
    const guaranteeYears = useWatch({ control, name: "quote.guaranteeYears" });
    const customGuaranteeText = useWatch({ control, name: "quote.customGuaranteeText" });
    const layoutFileId = useWatch({ control, name: "quote.layoutFileId" });
    const discountReference = useWatch({ control, name: "quote.customerConfigs.0.discountReference" });
    const simultaneousTasks = useWatch({ control, name: "quote.simultaneousTasks" });
    const customForecastDays = useWatch({ control, name: "quote.customForecastDays" });
    const watchedCustomerConfigs = useWatch({ control, name: "quote.customerConfigs" });

    // Customer search for invoice-to selector
    const searchCustomers = useCallback(async (search: string, page: number = 1) => {
      try {
        const params: any = {
          orderBy: { fantasyName: "asc" },
          page,
          take: 20,
          select: { id: true, fantasyName: true, cnpj: true, cpf: true, corporateName: true, logoId: true, logo: { select: { id: true } } },
        };
        if (search && search.trim()) {
          params.searchingFor = search.trim();
        }
        const response = await getCustomers(params);
        return { data: response?.data || [], hasMore: response?.meta?.hasNextPage || false };
      } catch {
        return { data: [], hasMore: false };
      }
    }, []);
    const getCustomerLabel = useCallback((c: Customer) => c.fantasyName, []);
    const getCustomerValue = useCallback((c: Customer) => c.id, []);

    // Custom render option for invoice-to customer combobox with avatar
    const renderInvoiceCustomerOption = useCallback(
      (customer: Customer, isSelected: boolean) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <CustomerLogoDisplay
            logo={customer.logo}
            customerName={customer.fantasyName || ""}
            size="sm"
            shape="rounded"
          />
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <RNText
              style={{
                fontSize: 16,
                fontWeight: isSelected ? "600" : "500",
                color: colors.foreground,
              }}
              numberOfLines={1}
            >
              {customer.fantasyName}
            </RNText>
            {(customer.corporateName || customer.cnpj) && (
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                {customer.corporateName && (
                  <RNText
                    style={{ fontSize: 14, color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {customer.corporateName}
                  </RNText>
                )}
                {customer.cnpj && (
                  <RNText style={{ fontSize: 14, color: colors.mutedForeground }}>
                    {customer.corporateName ? " \u2022 " : ""}{formatCNPJ(customer.cnpj)}
                  </RNText>
                )}
              </View>
            )}
          </View>
        </View>
      ),
      [colors]
    );

    // Current payment condition
    const currentPaymentCondition = useMemo(() => {
      if (customPaymentText) return "CUSTOM";
      return paymentCondition || "";
    }, [paymentCondition, customPaymentText]);

    // Derive current guarantee option
    const currentGuaranteeOption = useMemo(() => {
      if (customGuaranteeText) return "CUSTOM";
      if (guaranteeYears) return guaranteeYears.toString();
      return "";
    }, [guaranteeYears, customGuaranteeText]);

    // Initialize customer cache from initial data
    useEffect(() => {
      if (initialInvoiceToCustomers && initialInvoiceToCustomers.length > 0) {
        setSelectedCustomers(new Map(initialInvoiceToCustomers.map(c => [c.id, c])));
      }
    }, []);

    // Derive customer IDs from config objects for the Combobox
    const customerConfigIdsList = useMemo(() => {
      const configs = watchedCustomerConfigs;
      if (!Array.isArray(configs)) return [];
      return configs.map((c: any) => typeof c === 'string' ? c : c?.customerId).filter(Boolean);
    }, [watchedCustomerConfigs]);

    // Handle customer config changes from Combobox
    const handleCustomerConfigChange = useCallback((newIds: string | string[] | null | undefined) => {
      const ids = Array.isArray(newIds) ? newIds : [];
      const currentConfigs: any[] = Array.isArray(watchedCustomerConfigs) ? watchedCustomerConfigs : [];

      // Build new configs: keep existing ones, add new ones with defaults
      const newConfigs = ids.map((id: string) => {
        const existing = currentConfigs.find((c: any) =>
          (typeof c === 'string' ? c : c?.customerId) === id
        );
        if (existing && typeof existing === 'object') return existing;
        return {
          customerId: id,
          subtotal: 0,
          discountType: 'NONE' as const,
          discountValue: null,
          total: 0,
          paymentCondition: null,
          customPaymentText: null,
          responsibleId: null,
          discountReference: null,
          orderNumber: null,
        };
      });
      setValue("quote.customerConfigs", newConfigs);

      // Update customer cache with any newly fetched customers
      const newSelected = new Map(selectedCustomers);
      ids.forEach((id: string) => {
        if (!newSelected.has(id) && initialInvoiceToCustomers) {
          const found = initialInvoiceToCustomers.find(c => c.id === id);
          if (found) newSelected.set(id, found);
        }
      });
      // Remove deselected customers
      Array.from(newSelected.keys()).forEach(key => {
        if (!ids.includes(key)) newSelected.delete(key);
      });
      setSelectedCustomers(newSelected);
    }, [watchedCustomerConfigs, selectedCustomers, initialInvoiceToCustomers, setValue]);

    // Handle per-customer payment condition changes
    const handleCustomerPaymentConditionChange = useCallback((value: string, configIndex: number, customerId: string) => {
      if (value === "CUSTOM") {
        setShowCustomPayment(prev => ({ ...prev, [customerId]: true }));
        setValue(`quote.customerConfigs.${configIndex}.paymentCondition`, "CUSTOM");
      } else {
        setShowCustomPayment(prev => ({ ...prev, [customerId]: false }));
        setValue(`quote.customerConfigs.${configIndex}.customPaymentText`, null);
        setValue(`quote.customerConfigs.${configIndex}.paymentCondition`, value);
      }
    }, [setValue]);

    // Watch service assignments and clear orphaned customer assignments
    useEffect(() => {
      const configs = watchedCustomerConfigs || [];
      const currentIds = Array.isArray(configs)
        ? configs.map((c: any) => typeof c === 'string' ? c : c?.customerId).filter(Boolean)
        : [];
      const items = getValues("quote.services") || [];
      items.forEach((item: any, index: number) => {
        if (item.invoiceToCustomerId && !currentIds.includes(item.invoiceToCustomerId)) {
          setValue(`quote.services.${index}.invoiceToCustomerId`, null);
        }
      });
    }, [watchedCustomerConfigs, getValues, setValue]);

    // Sync root-level paymentCondition to customerConfigs[0] in single-customer mode.
    // The API reads these from customerConfig, not from the root pricing object.
    useEffect(() => {
      const configs = watchedCustomerConfigs;
      if (!Array.isArray(configs) || configs.length !== 1) return;

      const rootPaymentCondition = getValues("quote.paymentCondition");
      const rootCustomPaymentText = getValues("quote.customerConfigs.0.customPaymentText");
      const config = configs[0];
      if (!config || typeof config !== 'object') return;

      let needsUpdate = false;
      const updated = { ...config };

      if (rootPaymentCondition !== undefined && config.paymentCondition !== rootPaymentCondition) {
        updated.paymentCondition = rootPaymentCondition || null;
        needsUpdate = true;
      }
      if (rootCustomPaymentText !== undefined && config.customPaymentText !== rootCustomPaymentText) {
        updated.customPaymentText = rootCustomPaymentText || null;
        needsUpdate = true;
      }

      if (needsUpdate) {
        setValue("quote.customerConfigs.0", updated, { shouldDirty: false });
      }
    }, [watchedCustomerConfigs, paymentCondition, customPaymentText, getValues, setValue]);

    // Auto-calculate per-customer subtotals/totals based on service invoiceToCustomerId assignments
    useEffect(() => {
      const configs = watchedCustomerConfigs;
      if (!Array.isArray(configs) || configs.length < 2 || !quoteItems) return;

      const services = quoteItems || [];
      let updated = false;

      const newConfigs = configs.map((config: any) => {
        if (!config || typeof config !== 'object') return config;
        const customerId = config.customerId;
        if (!customerId) return config;

        const customerSubtotal = services.reduce((sum: number, svc: any) => {
          if (svc.invoiceToCustomerId === customerId) {
            const amount = typeof svc.amount === 'number' ? svc.amount : Number(svc.amount) || 0;
            return sum + amount;
          }
          return sum;
        }, 0);

        const roundedSubtotal = Math.round(customerSubtotal * 100) / 100;

        // Calculate per-customer total from service-level discounts
        const customerTotal = services.reduce((sum: number, svc: any) => {
          if (svc.invoiceToCustomerId === customerId) {
            const amount = typeof svc.amount === 'number' ? svc.amount : Number(svc.amount) || 0;
            let discount = 0;
            if (svc.discountType === 'PERCENTAGE' && svc.discountValue) {
              discount = Math.round((amount * svc.discountValue / 100) * 100) / 100;
            } else if (svc.discountType === 'FIXED_VALUE' && svc.discountValue) {
              discount = Math.min(svc.discountValue, amount);
            }
            return sum + Math.max(0, amount - discount);
          }
          return sum;
        }, 0);
        const roundedTotal = Math.max(0, Math.round(customerTotal * 100) / 100);

        if (config.subtotal !== roundedSubtotal || config.total !== roundedTotal) {
          updated = true;
          return { ...config, subtotal: roundedSubtotal, total: roundedTotal };
        }
        return config;
      });

      if (updated) {
        setValue("quote.customerConfigs", newConfigs, { shouldDirty: false });
      }
    }, [quoteItems, watchedCustomerConfigs, setValue]);

    // Initialize custom states from existing data
    useEffect(() => {
      // Global custom payment text
      if (customPaymentText && !showCustomPayment["__global__"]) {
        setShowCustomPayment(prev => ({ ...prev, "__global__": true }));
      }
      // Per-customer custom payment text
      const configs = getValues("quote.customerConfigs") || [];
      if (Array.isArray(configs)) {
        configs.forEach((config: any) => {
          if (config?.customPaymentText && config?.customerId && !showCustomPayment[config.customerId]) {
            setShowCustomPayment(prev => ({ ...prev, [config.customerId]: true }));
          }
        });
      }
      if (customGuaranteeText && !showCustomGuarantee) {
        setShowCustomGuarantee(true);
      }
    }, [customPaymentText, customGuaranteeText, showCustomPayment, showCustomGuarantee, getValues]);

    // Calculate subtotal
    const subtotal = useMemo(() => {
      if (!quoteItems || quoteItems.length === 0) return 0;
      return quoteItems.reduce((sum: number, item: any) => {
        const amount = typeof item.amount === "number" ? item.amount : Number(item.amount) || 0;
        return sum + amount;
      }, 0);
    }, [quoteItems]);

    // Calculate discount amount
    const discountAmount = useMemo(() => {
      if (discountType === DISCOUNT_TYPE.NONE || !discountValue) return 0;
      if (discountType === DISCOUNT_TYPE.PERCENTAGE) {
        return Math.round(((subtotal * discountValue) / 100) * 100) / 100;
      }
      if (discountType === DISCOUNT_TYPE.FIXED_VALUE) {
        return discountValue;
      }
      return 0;
    }, [subtotal, discountType, discountValue]);

    // Calculate total
    const calculatedTotal = useMemo(() => {
      return Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    }, [subtotal, discountAmount]);

    // Initialize local state from form data
    useEffect(() => {
      if (!initialized) {
        const expiresAt = getValues("quote.expiresAt");
        const items = getValues("quote.services");
        const hasItems = items && items.length > 0;
        const validOptions = [15, 30, 60, 90];

        if (expiresAt) {
          const today = new Date();
          const diffTime = new Date(expiresAt).getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && validOptions.includes(diffDays)) {
            // Exact match with a valid option
            setValidityPeriod(diffDays);
          } else {
            // No exact match or expired — default to 30 days
            setValidityPeriod(30);
          }
        } else {
          // Default to 30 days
          setValidityPeriod(30);
          // If there are items but no expiresAt, set a default expiry date
          // This fixes validation errors when editing tasks with pricing services but no expiry
          if (hasItems) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            expiryDate.setHours(23, 59, 59, 999);
            setValue("quote.expiresAt", expiryDate, { shouldDirty: false });
          }
        }
        setInitialized(true);
      }
    }, [initialized, getValues, setValue]);

    // Notify parent about count changes
    useEffect(() => {
      if (onItemCountChange) {
        const count = quoteItems && quoteItems.length > 0 ? 1 : 0;
        onItemCountChange(count);
      }
    }, [quoteItems, onItemCountChange]);

    // Update subtotal and total in form
    useEffect(() => {
      if (quoteItems && quoteItems.length > 0) {
        const currentSubtotal = getValues("quote.subtotal");
        const currentTotal = getValues("quote.total");
        if (currentSubtotal !== subtotal) {
          setValue("quote.subtotal", subtotal, { shouldDirty: false });
        }
        if (currentTotal !== calculatedTotal) {
          setValue("quote.total", calculatedTotal, { shouldDirty: false });
        }
      }
    }, [subtotal, calculatedTotal, quoteItems, setValue, getValues]);

    const handleAddItem = useCallback(() => {
      clearErrors("quote");
      if (fields.length === 0) {
        const defaultPeriod = 30;
        setValidityPeriod(defaultPeriod);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + defaultPeriod);
        expiryDate.setHours(23, 59, 59, 999);
        setValue("quote.expiresAt", expiryDate);
        setValue("quote.status", "PENDING");
        setValue("quote.customerConfigs.0.discountType", DISCOUNT_TYPE.NONE);
        setValue("quote.customerConfigs.0.discountValue", null);
        setValue("quote.subtotal", 0);
        setValue("quote.total", 0);
      }
      // Use append to preserve addition order (first added = first position)
      // Incomplete items are displayed at top via the grouping logic
      append({ description: "", observation: null, amount: null as unknown as number });
    }, [append, clearErrors, fields.length, setValue]);

    const clearAll = useCallback(() => {
      for (let i = fields.length - 1; i >= 0; i--) {
        remove(i);
      }
      setValue("quote", undefined);
      clearErrors("quote");
      setValidityPeriod(null);
      setShowCustomPayment({});
      setShowCustomGuarantee(false);
      setLayoutFiles([]);
    }, [fields.length, remove, setValue, clearErrors, setLayoutFiles]);

    useImperativeHandle(ref, () => ({ addItem: handleAddItem, clearAll }), [handleAddItem, clearAll]);

    const canEditStatus = userRole === "ADMIN" || userRole === "FINANCIAL" || userRole === "COMMERCIAL";

    const handleValidityPeriodChange = useCallback(
      (period: string | string[] | null | undefined) => {
        if (!period || Array.isArray(period)) return;
        const days = Number(period);
        setValidityPeriod(days);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        expiryDate.setHours(23, 59, 59, 999);
        setValue("quote.expiresAt", expiryDate);
      },
      [setValue]
    );

    const handlePaymentConditionChange = useCallback(
      (value: string | string[] | null | undefined) => {
        if (!value || Array.isArray(value)) return;
        if (value === "CUSTOM") {
          setShowCustomPayment(prev => ({ ...prev, "__global__": true }));
          setValue("quote.paymentCondition", "CUSTOM");
        } else {
          setShowCustomPayment(prev => ({ ...prev, "__global__": false }));
          setValue("quote.customerConfigs.0.customPaymentText", null);
          setValue("quote.paymentCondition", value);
        }
        // Propagate to the single customerConfig so the API receives it
        const configs = getValues("quote.customerConfigs");
        if (Array.isArray(configs) && configs.length === 1) {
          setValue("quote.customerConfigs.0.paymentCondition", value === "CUSTOM" ? "CUSTOM" : (value || null));
          if (value === "CUSTOM") {
            const customText = getValues("quote.customerConfigs.0.customPaymentText");
            if (customText) {
              setValue("quote.customerConfigs.0.customPaymentText", customText);
            }
          } else {
            setValue("quote.customerConfigs.0.customPaymentText", null);
          }
        }
      },
      [setValue, getValues]
    );

    const handleGuaranteeOptionChange = useCallback(
      (value: string | string[] | null | undefined) => {
        if (Array.isArray(value)) return;
        if (value === "CUSTOM") {
          setShowCustomGuarantee(true);
          setValue("quote.guaranteeYears", null);
        } else {
          setShowCustomGuarantee(false);
          setValue("quote.customGuaranteeText", null);
          setValue("quote.guaranteeYears", value ? Number(value) : null);
        }
      },
      [setValue]
    );

    const handleRemoveItem = useCallback(
      (index: number) => {
        remove(index);
      },
      [remove]
    );

    // Handle layout file change (from file upload)
    const handleLayoutFileChange = useCallback((files: FilePickerItem[]) => {
      setLayoutFiles(files);
      // Only set layoutFileId if it's an existing uploaded file (has id and uploaded=true)
      if (files.length > 0 && files[0].id && files[0].uploaded) {
        setValue("quote.layoutFileId", files[0].id);
      } else if (files.length === 0) {
        setValue("quote.layoutFileId", null);
      }
      // For new files, layoutFileId stays null - the file will be uploaded during form submission
    }, [setValue, setLayoutFiles]);

    // Handle artwork selection as layout file
    const UPLOAD_NEW_SENTINEL = "__UPLOAD_NEW__";
    const handleArtworkSelect = useCallback((value: string | string[] | null | undefined) => {
      const fileId = typeof value === "string" ? value : null;
      if (fileId === "__UPLOAD_NEW__") {
        setShowLayoutUploadMode(true);
        return;
      }
      if (fileId) {
        const artwork = artworks?.find(a => a.id === fileId);
        if (artwork) {
          const fileItem: FilePickerItem = {
            id: artwork.id,
            name: artwork.originalName || artwork.filename || "artwork",
            size: artwork.size || 0,
            type: artwork.mimetype || "image/png",
            uploaded: true,
            uri: `${ONLINE_API_URL}/files/thumbnail/${artwork.id}`,
          };
          setLayoutFiles([fileItem]);
          setValue("quote.layoutFileId", artwork.id);
          setShowLayoutUploadMode(false);
        }
      } else {
        setLayoutFiles([]);
        setValue("quote.layoutFileId", null);
      }
    }, [artworks, setValue, setLayoutFiles]);

    // Artwork options for the combobox (image artworks + "upload new" action)
    const artworkOptions = useMemo(() => {
      if (!artworks || artworks.length === 0) return [];
      const imageArtworks = artworks.filter(a => {
        const mime = a.mimetype || "";
        return mime.startsWith("image/");
      });
      if (imageArtworks.length === 0) return [];
      return [
        ...imageArtworks,
        { id: UPLOAD_NEW_SENTINEL, filename: "Enviar novo arquivo" } as ArtworkOption,
      ];
    }, [artworks]);

    // Render artwork option with thumbnail (or upload action for sentinel)
    const renderArtworkOption = useCallback((artwork: ArtworkOption) => {
      if (artwork.id === UPLOAD_NEW_SENTINEL) {
        return (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              overflow: "hidden",
              backgroundColor: colors.muted + "50",
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <IconUpload size={20} color={colors.mutedForeground} />
            </View>
            <ThemedText style={{ fontSize: 13, color: colors.mutedForeground }}>
              Enviar novo arquivo
            </ThemedText>
          </View>
        );
      }
      const thumbnailSrc = artwork.thumbnailUrl
        ? artwork.thumbnailUrl
        : `${ONLINE_API_URL}/files/thumbnail/${artwork.id}`;
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Image
              source={{ uri: thumbnailSrc }}
              style={{ width: 48, height: 48 }}
              contentFit="cover"
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 13 }} numberOfLines={1} ellipsizeMode="tail">
              {artwork.originalName || artwork.filename || "Arquivo"}
            </ThemedText>
            {artwork.status && (
              <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }}>
                {artwork.status === "APPROVED" ? "Aprovado" : artwork.status === "REPROVED" ? "Reprovado" : "Rascunho"}
              </ThemedText>
            )}
          </View>
        </View>
      );
    }, [colors]);

    // Current layoutFileId to track selected artwork
    const currentLayoutFileId = useWatch({ control, name: "quote.layoutFileId" });

    const hasPricingItems = quoteItems && quoteItems.length > 0;

    // Track manually organized items (moved from incomplete to complete via "Organizar" button)
    const [organizedIds, setOrganizedIds] = useState<Set<string>>(new Set());

    // Separate incomplete items (shown at top) from complete items (shown below in order)
    // An item is complete if it has description >= 3 chars AND amount > 0, or was manually organized
    const { incompleteIndices, completeIndices } = useMemo(() => {
      const incomplete: number[] = [];
      const complete: number[] = [];

      fields.forEach((field, index) => {
        const item = quoteItems?.[index];
        const hasDescription = item?.description && item.description.trim().length >= 3;
        const hasAmount = item?.amount !== null && item?.amount !== undefined && Number(item.amount) > 0;
        const isOrganized = organizedIds.has(field.id);
        const isComplete = (hasDescription && hasAmount) || isOrganized;

        if (isComplete) {
          complete.push(index);
        } else {
          incomplete.push(index);
        }
      });

      return { incompleteIndices: incomplete, completeIndices: complete };
    }, [fields, quoteItems, organizedIds]);

    // Handle "Organizar" - move all items with descriptions to complete section
    const handleOrganize = useCallback(() => {
      const newOrganized = new Set(organizedIds);
      fields.forEach((field, index) => {
        const item = quoteItems?.[index];
        if (item?.description && item.description.trim().length >= 3) {
          newOrganized.add(field.id);
        }
      });
      setOrganizedIds(newOrganized);
    }, [fields, quoteItems, organizedIds]);

    return (
      <View style={styles.container}>
        {/* Invoice To Customers - First section */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.labelWithIcon}>
              <IconFileInvoice size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0 }]} numberOfLines={1} ellipsizeMode="tail">
                Faturar Para (Clientes)
              </ThemedText>
            </View>
            <Combobox
              value={customerConfigIdsList}
              onValueChange={handleCustomerConfigChange}
              mode="multiple"
              disabled={disabled}
              placeholder="Selecione clientes para faturamento..."
              searchable
              async
              queryKey={["customers", "invoice-selector"]}
              queryFn={searchCustomers}
              getOptionLabel={getCustomerLabel}
              getOptionValue={getCustomerValue}
              renderOption={renderInvoiceCustomerOption}
              initialOptions={(initialInvoiceToCustomers || []) as Customer[]}
              clearable
              minSearchLength={0}
              searchPlaceholder="Buscar cliente..."
            />
          </View>
        )}

        {/* Add Service Button - Full width above rows */}
        {!disabled && (
          <Button variant="outline" size="sm" onPress={handleAddItem} disabled={disabled} style={styles.addButton}>
            <IconPlus size={16} color={colors.foreground} />
            <ThemedText style={{ marginLeft: 4, fontSize: 14, color: colors.foreground }}>Adicionar Serviço</ThemedText>
          </Button>
        )}

        {/* Incomplete Items Section - Items being configured (shown at top) */}
        {incompleteIndices.length > 0 && (
          <View style={[styles.section, styles.incompleteSection, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                Configurando Serviço
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <ThemedText style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                  Preencha descrição e valor
                </ThemedText>
                {incompleteIndices.some((i) => {
                  const item = quoteItems?.[i];
                  return item?.description && item.description.trim().length >= 3;
                }) && (
                  <TouchableOpacity onPress={handleOrganize} style={[styles.organizeButton, { borderColor: colors.border }]}>
                    <ThemedText style={{ fontSize: 11, color: colors.primary }}>Organizar</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {incompleteIndices.map((index) => (
              <PricingItemRow
                key={fields[index].id}
                control={control}
                index={index}
                disabled={disabled}
                onRemove={() => handleRemoveItem(index)}
                isLastRow={false}
              />
            ))}
          </View>
        )}

        {/* Complete Items Section - Items with description (in their position order) */}
        {completeIndices.length > 0 && (
          <View style={styles.section}>
            {completeIndices.map((index) => (
              <PricingItemRow
                key={fields[index].id}
                control={control}
                index={index}
                disabled={disabled}
                onRemove={() => handleRemoveItem(index)}
                isLastRow={index === fields.length - 1}
              />
            ))}
          </View>
        )}

        {/* Spacing between items and configuration sections */}
        {hasPricingItems && (
          <View style={styles.itemsConfigSpacer} />
        )}

        {/* Discount Section - Global (0-1 customers) */}
        {hasPricingItems && (!watchedCustomerConfigs || !Array.isArray(watchedCustomerConfigs) || watchedCustomerConfigs.length < 2) && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Tipo de Desconto</ThemedText>
                <Combobox
                  value={discountType || DISCOUNT_TYPE.NONE}
                  onValueChange={(value) => {
                    const safeType = value || DISCOUNT_TYPE.NONE;
                    const previousType = discountType || DISCOUNT_TYPE.NONE;
                    setValue("quote.customerConfigs.0.discountType", safeType);
                    if (safeType === DISCOUNT_TYPE.NONE) {
                      setValue("quote.customerConfigs.0.discountValue", null);
                      setValue("quote.customerConfigs.0.discountReference", null);
                    } else if (previousType !== safeType && previousType !== DISCOUNT_TYPE.NONE) {
                      setValue("quote.customerConfigs.0.discountValue", null);
                    }
                  }}
                  disabled={disabled}
                  options={[DISCOUNT_TYPE.NONE, DISCOUNT_TYPE.PERCENTAGE, DISCOUNT_TYPE.FIXED_VALUE].map((type) => ({
                    value: type,
                    label: DISCOUNT_TYPE_LABELS[type],
                  }))}
                  placeholder="Selecione"
                  searchable={false}
                />
              </View>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
                  Valor do Desconto{" "}
                  {discountType === DISCOUNT_TYPE.PERCENTAGE && <ThemedText style={{ color: colors.mutedForeground }}>(%)</ThemedText>}
                  {discountType === DISCOUNT_TYPE.FIXED_VALUE && <ThemedText style={{ color: colors.mutedForeground }}>(R$)</ThemedText>}
                </ThemedText>
                <Input
                  type={discountType === DISCOUNT_TYPE.FIXED_VALUE ? "currency" : "number"}
                  value={discountValue ?? null}
                  onChange={(value) => {
                    if (value === null || value === undefined || value === "") {
                      setValue("quote.customerConfigs.0.discountValue", null);
                    } else {
                      setValue("quote.customerConfigs.0.discountValue", typeof value === "number" ? value : Number(value));
                    }
                  }}
                  disabled={disabled || discountType === DISCOUNT_TYPE.NONE}
                  placeholder={discountType === DISCOUNT_TYPE.NONE ? "-" : discountType === DISCOUNT_TYPE.FIXED_VALUE ? "R$ 0,00" : "0"}
                />
              </View>
            </View>
          </View>
        )}

        {/* Discount Reference - Global (0-1 customers), only when discount type is not NONE */}
        {hasPricingItems && (!watchedCustomerConfigs || !Array.isArray(watchedCustomerConfigs) || watchedCustomerConfigs.length < 2) && discountType !== DISCOUNT_TYPE.NONE && (
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Referência do Desconto</ThemedText>
            <TextInput
              value={discountReference || ""}
              onChangeText={(text) => setValue("quote.customerConfigs.0.discountReference", text || null)}
              placeholder="Justificativa ou referência para o desconto aplicado..."
              placeholderTextColor={colors.mutedForeground}
              editable={!disabled}
              maxLength={500}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                  minHeight: 42,
                },
              ]}
            />
          </View>
        )}

        {/* Totals Section */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <IconCurrencyReal size={14} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4 }]}>Subtotal</ThemedText>
                </View>
                <View style={[styles.readOnlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <ThemedText style={[styles.readOnlyText, { color: colors.foreground }]}>{formatCurrency(subtotal)}</ThemedText>
                </View>
              </View>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <IconCurrencyReal size={14} color={colors.primary} />
                  <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4 }]}>Valor Total</ThemedText>
                </View>
                <View style={[styles.readOnlyField, styles.totalField, { borderColor: colors.primary }]}>
                  <ThemedText style={[styles.totalText, { color: colors.primary }]}>{formatCurrency(calculatedTotal)}</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Spacing between totals and status */}
        {hasPricingItems && <View style={styles.itemsConfigSpacer} />}

        {/* Status and Validity */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <ThemedText style={[styles.label, { color: colors.foreground, marginBottom: 0 }]} numberOfLines={1} ellipsizeMode="tail">Status</ThemedText>
                </View>
                <Combobox
                  value={quoteStatus || "PENDING"}
                  onValueChange={(value) => setValue("quote.status", value)}
                  disabled={disabled || !canEditStatus}
                  options={STATUS_OPTIONS}
                  placeholder="Selecione"
                  searchable={false}
                />
              </View>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <IconCalendar size={14} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0 }]}>
                    Validade <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                  </ThemedText>
                </View>
                <Combobox
                  value={validityPeriod?.toString() || ""}
                  onValueChange={handleValidityPeriodChange}
                  disabled={disabled}
                  options={VALIDITY_PERIOD_OPTIONS}
                  placeholder="Período"
                  searchable={false}
                />
              </View>
            </View>
          </View>
        )}

        {/* Payment Condition + Down Payment Date - Global (0-1 customers) */}
        {hasPricingItems && (!Array.isArray(watchedCustomerConfigs) || watchedCustomerConfigs.length < 2) && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Condição de Pagamento</ThemedText>
                <Combobox
                  value={currentPaymentCondition}
                  onValueChange={handlePaymentConditionChange}
                  disabled={disabled}
                  options={PAYMENT_CONDITIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  placeholder="Selecione"
                  searchable={false}
                />
              </View>
            </View>
          </View>
        )}

        {/* Custom Payment Text - Global (0-1 customers) */}
        {hasPricingItems && (!Array.isArray(watchedCustomerConfigs) || watchedCustomerConfigs.length < 2) && showCustomPayment["__global__"] && (
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Texto Personalizado de Pagamento</ThemedText>
            <TextInput
              value={customPaymentText || ""}
              onChangeText={(text) => setValue("quote.customerConfigs.0.customPaymentText", text || null)}
              placeholder="Descreva as condições de pagamento..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              editable={!disabled}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>
        )}

        {/* Per-Customer Configuration Sections (2+ customers) */}
        {hasPricingItems && Array.isArray(watchedCustomerConfigs) && watchedCustomerConfigs.length >= 2 && (
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.foreground, marginBottom: spacing.sm }]}>
              Configurações por Cliente
            </ThemedText>
            {watchedCustomerConfigs.map((config: any, i: number) => {
              const customerId = typeof config === 'string' ? config : config?.customerId;
              if (!customerId) return null;
              const customer = selectedCustomers.get(customerId);
              const configPaymentCondition = config?.paymentCondition || "";
              const configCustomPaymentText = config?.customPaymentText;
              const currentCondition = configCustomPaymentText ? "CUSTOM" : configPaymentCondition;
              const configSubtotal = config?.subtotal || 0;
              const configDiscountType = config?.discountType || 'NONE';
              const configTotal = config?.total || 0;

              return (
                <View key={customerId} style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  gap: spacing.sm,
                }}>
                  {/* Customer Name Header */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs }}>
                    {customer && (
                      <CustomerLogoDisplay
                        logo={customer.logo}
                        customerName={customer.fantasyName || ""}
                        size="sm"
                        shape="rounded"
                      />
                    )}
                    <ThemedText style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 }} numberOfLines={1}>
                      {customer?.fantasyName || customer?.corporateName || "Cliente"}
                    </ThemedText>
                  </View>

                  {/* Payment Condition & Down Payment Date */}
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <ThemedText style={[styles.label, { color: colors.foreground, fontSize: 12 }]}>Condição Pagamento</ThemedText>
                      <Combobox
                        value={currentCondition}
                        onValueChange={(value) => {
                          if (typeof value === 'string') {
                            handleCustomerPaymentConditionChange(value, i, customerId);
                          }
                        }}
                        disabled={disabled}
                        options={PAYMENT_CONDITIONS.map((opt) => ({
                          value: opt.value,
                          label: opt.label,
                        }))}
                        placeholder="Selecione"
                        searchable={false}
                      />
                    </View>
                  </View>

                  {/* Custom Payment Text */}
                  {showCustomPayment[customerId] && (
                    <View>
                      <ThemedText style={[styles.label, { color: colors.foreground, fontSize: 12 }]}>Texto Personalizado</ThemedText>
                      <TextInput
                        value={config?.customPaymentText || ""}
                        onChangeText={(text) => setValue(`quote.customerConfigs.${i}.customPaymentText`, text || null)}
                        placeholder="Condições de pagamento personalizadas..."
                        placeholderTextColor={colors.mutedForeground}
                        multiline
                        numberOfLines={2}
                        editable={!disabled}
                        style={[
                          styles.textArea,
                          {
                            backgroundColor: colors.input,
                            borderColor: colors.border,
                            color: colors.foreground,
                            minHeight: 60,
                          },
                        ]}
                      />
                    </View>
                  )}

                  {/* Order Number */}
                  <View>
                    <ThemedText style={[styles.label, { color: colors.foreground, fontSize: 12 }]}>N° do Pedido</ThemedText>
                    <TextInput
                      value={config?.orderNumber || ""}
                      onChangeText={(text) => setValue(`quote.customerConfigs.${i}.orderNumber`, text || null)}
                      placeholder="Ex: PED-001"
                      placeholderTextColor={colors.mutedForeground}
                      editable={!disabled}
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: colors.input,
                          borderColor: colors.border,
                          color: colors.foreground,
                          minHeight: 40,
                        },
                      ]}
                    />
                  </View>

                  {/* Discount Type & Value */}
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <ThemedText style={[styles.label, { color: colors.foreground, fontSize: 12 }]}>Desconto</ThemedText>
                      <Combobox
                        value={configDiscountType}
                        onValueChange={(value) => {
                          const safeType = value || 'NONE';
                          setValue(`quote.customerConfigs.${i}.discountType`, safeType);
                          if (safeType === 'NONE') {
                            setValue(`quote.customerConfigs.${i}.discountValue`, null);
                            setValue(`quote.customerConfigs.${i}.discountReference`, null);
                          }
                        }}
                        disabled={disabled}
                        options={[DISCOUNT_TYPE.NONE, DISCOUNT_TYPE.PERCENTAGE, DISCOUNT_TYPE.FIXED_VALUE].map((type) => ({
                          value: type,
                          label: DISCOUNT_TYPE_LABELS[type],
                        }))}
                        placeholder="Selecione"
                        searchable={false}
                      />
                    </View>
                    <View style={styles.halfField}>
                      <ThemedText style={[styles.label, { color: colors.foreground, fontSize: 12 }]}>
                        Valor Desc.{" "}
                        {configDiscountType === 'PERCENTAGE' && <ThemedText style={{ color: colors.mutedForeground }}>(%)</ThemedText>}
                        {configDiscountType === 'FIXED_VALUE' && <ThemedText style={{ color: colors.mutedForeground }}>(R$)</ThemedText>}
                      </ThemedText>
                      <Input
                        type={configDiscountType === 'FIXED_VALUE' ? "currency" : "number"}
                        value={config?.discountValue ?? null}
                        onChange={(value) => {
                          setValue(`quote.customerConfigs.${i}.discountValue`, value === null || value === undefined || value === "" ? null : typeof value === "number" ? value : Number(value));
                        }}
                        disabled={disabled || configDiscountType === 'NONE'}
                        placeholder={configDiscountType === 'NONE' ? "-" : configDiscountType === 'FIXED_VALUE' ? "R$ 0,00" : "0"}
                      />
                    </View>
                  </View>

                  {/* Discount Reference (per-customer) */}
                  {configDiscountType !== 'NONE' && (
                    <View>
                      <ThemedText style={[styles.label, { color: colors.foreground, fontSize: 12 }]}>Ref. Desconto</ThemedText>
                      <TextInput
                        value={config?.discountReference || ""}
                        onChangeText={(text) => setValue(`quote.customerConfigs.${i}.discountReference`, text || null)}
                        placeholder="Referência do desconto..."
                        placeholderTextColor={colors.mutedForeground}
                        editable={!disabled}
                        style={[
                          styles.textArea,
                          {
                            backgroundColor: colors.input,
                            borderColor: colors.border,
                            color: colors.foreground,
                            minHeight: 40,
                          },
                        ]}
                      />
                    </View>
                  )}

                  {/* Subtotal & Total (auto-calculated) */}
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <View style={styles.labelWithIcon}>
                        <IconCurrencyReal size={12} color={colors.mutedForeground} />
                        <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, fontSize: 12 }]}>Subtotal</ThemedText>
                      </View>
                      <View style={[styles.readOnlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                        <ThemedText style={[styles.readOnlyText, { color: colors.foreground, fontSize: 13 }]}>{formatCurrency(configSubtotal)}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.halfField}>
                      <View style={styles.labelWithIcon}>
                        <IconCurrencyReal size={12} color={colors.primary} />
                        <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, fontSize: 12 }]}>Total</ThemedText>
                      </View>
                      <View style={[styles.readOnlyField, styles.totalField, { borderColor: colors.primary }]}>
                        <ThemedText style={[styles.totalText, { color: colors.primary, fontSize: 13 }]}>{formatCurrency(configTotal)}</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Custom Guarantee Text */}
        {hasPricingItems && showCustomGuarantee && (
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Texto Personalizado de Garantia</ThemedText>
            <TextInput
              value={customGuaranteeText || ""}
              onChangeText={(text) => setValue("quote.customGuaranteeText", text || null)}
              placeholder="Descreva as condições de garantia..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              editable={!disabled}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>
        )}

        {/* Guarantee, Simultaneous Tasks & Forecast Days (web: 2/4, 1/4, 1/4 row) */}
        {hasPricingItems && (
          <View style={styles.section}>
            {/* Guarantee - full width on mobile */}
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Período de Garantia</ThemedText>
            <Combobox
              value={currentGuaranteeOption}
              onValueChange={handleGuaranteeOptionChange}
              disabled={disabled}
              options={GUARANTEE_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              placeholder="Selecione"
              searchable={false}
            />

            {/* Simultaneous Tasks + Forecast Days row */}
            <View style={[styles.row, { marginTop: spacing.sm }]}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Tarefas Simultâneas</ThemedText>
                <Input
                  type="number"
                  value={simultaneousTasks ?? null}
                  onChange={(value) => {
                    const numVal = value ? Number(value) : null;
                    setValue("quote.simultaneousTasks", numVal);
                  }}
                  disabled={disabled}
                  placeholder="1-100"
                />
              </View>

              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Prazo Entrega (dias)</ThemedText>
                <Combobox
                  value={customForecastDays ? String(customForecastDays) : ""}
                  onValueChange={(value) => setValue("quote.customForecastDays", value ? Number(value) : null)}
                  disabled={disabled}
                  options={FORECAST_DAYS_OPTIONS}
                  placeholder="Auto"
                  searchable={false}
                />
              </View>
            </View>
          </View>
        )}

        {/* Spacing before layout */}
        {hasPricingItems && <View style={styles.itemsConfigSpacer} />}

        {/* Layout Aprovado - Artwork Selector or File Upload */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.labelWithIcon}>
              <IconPhoto size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0 }]} numberOfLines={1} ellipsizeMode="tail">
                Layout Aprovado
              </ThemedText>
            </View>

            {/* Artwork selector mode (default when artworks exist) */}
            {artworkOptions.length > 0 && !showLayoutUploadMode && (
              <>
                <Combobox<ArtworkOption>
                  value={currentLayoutFileId || ""}
                  onValueChange={handleArtworkSelect}
                  options={artworkOptions}
                  getOptionValue={(a) => a.id}
                  getOptionLabel={(a) => a.originalName || a.filename || "Arquivo"}
                  renderOption={renderArtworkOption}
                  placeholder="Selecionar uma arte existente..."
                  emptyText="Nenhuma arte de imagem encontrada"
                  disabled={disabled}
                  clearable
                  searchable
                />

                {/* Selected artwork full image preview */}
                {currentLayoutFileId && artworkOptions.some(a => a.id === currentLayoutFileId) && (
                  <View style={{
                    backgroundColor: colors.muted + "30",
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginTop: spacing.sm,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                      <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, flex: 1 }} numberOfLines={1}>
                        {artworkOptions.find(a => a.id === currentLayoutFileId)?.originalName
                          || artworkOptions.find(a => a.id === currentLayoutFileId)?.filename
                          || "Layout selecionado"}
                      </ThemedText>
                      {!disabled && (
                        <TouchableOpacity
                          onPress={() => handleArtworkSelect(null)}
                          style={{ padding: 4 }}
                        >
                          <IconX size={16} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        const selectedArtwork = artworkOptions.find(a => a.id === currentLayoutFileId);
                        if (selectedArtwork) {
                          fileViewer.actions.viewFile({
                            id: selectedArtwork.id,
                            filename: selectedArtwork.filename,
                            originalName: selectedArtwork.originalName,
                            mimetype: selectedArtwork.mimetype || "image/png",
                            size: selectedArtwork.size,
                          } as any);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: `${ONLINE_API_URL}/files/thumbnail/${currentLayoutFileId}` }}
                        style={{ height: 192, width: "100%", borderRadius: borderRadius.md }}
                        contentFit="contain"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* File upload mode (default when no artworks, or toggled) */}
            {(artworkOptions.length === 0 || showLayoutUploadMode) && (
              <>
                {artworkOptions.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowLayoutUploadMode(false)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}
                  >
                    <IconArrowLeft size={13} color={colors.mutedForeground} />
                    <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
                      Voltar para seleção de artes
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <FilePicker
                  value={layoutFiles}
                  onChange={handleLayoutFileChange}
                  maxFiles={1}
                  placeholder="Selecione o layout aprovado"
                  helperText="Arraste ou clique para selecionar"
                  disabled={disabled}
                  showCamera={true}
                  showGallery={true}
                  showFilePicker={false}
                  acceptedFileTypes={["image/jpeg", "image/png", "image/gif", "image/webp"]}
                />
              </>
            )}
          </View>
        )}
      </View>
    );
  }
);

QuoteSelector.displayName = "QuoteSelector";

// Pricing Item Row Component
interface PricingItemRowProps {
  control: any;
  index: number;
  disabled?: boolean;
  onRemove: () => void;
  isLastRow: boolean;
}

function PricingItemRow({ control, index, disabled, onRemove, isLastRow }: PricingItemRowProps) {
  const { colors } = useTheme();
  const { setValue } = useFormContext();
  const [observationModal, setObservationModal] = useState({ visible: false, text: "" });

  const description = useWatch({ control, name: `quote.services.${index}.description` });
  const amount = useWatch({ control, name: `quote.services.${index}.amount` });
  const observation = useWatch({ control, name: `quote.services.${index}.observation` });

  // Get description options from service descriptions
  const descriptionOptions = useMemo(() => {
    const baseOptions = getServiceDescriptionsByType(SERVICE_ORDER_TYPE.PRODUCTION).map((desc) => ({
      value: desc,
      label: desc,
    }));

    // If the current description exists but isn't in the predefined list, add it to options
    // This ensures existing values can be displayed when editing
    if (description && description.trim().length > 0) {
      const descriptionExists = baseOptions.some(opt => opt.value === description);
      if (!descriptionExists) {
        return [{ value: description, label: description }, ...baseOptions];
      }
    }

    return baseOptions;
  }, [description]);

  const handleSaveObservation = () => {
    setValue(`quote.services.${index}.observation`, observationModal.text || null);
    setObservationModal({ visible: false, text: observationModal.text });
  };

  const hasObservation = !!observation && observation.trim().length > 0;

  return (
    <View style={styles.itemRow}>
      {/* Description */}
      <View style={styles.descriptionField}>
        <Combobox
          value={description || ""}
          onValueChange={(value) => setValue(`quote.services.${index}.description`, value || "")}
          disabled={disabled}
          options={descriptionOptions}
          placeholder="Selecione o serviço..."
          searchable
          clearable={false}
        />
      </View>

      {/* Amount + Actions */}
      <View style={styles.amountRow}>
        <View style={styles.amountField}>
          <Input
            type="currency"
            value={amount ?? null}
            onChange={(value) => setValue(`quote.services.${index}.amount`, value)}
            disabled={disabled}
            placeholder="R$ 0,00"
          />
        </View>

        {/* Observation Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              borderColor: hasObservation ? colors.primary : colors.border,
              backgroundColor: hasObservation ? colors.primary + "15" : colors.card,
            },
          ]}
          onPress={() => setObservationModal({ visible: true, text: observation || "" })}
          disabled={disabled}
        >
          <IconNote size={16} color={hasObservation ? colors.primary : colors.mutedForeground} />
          {hasObservation && (
            <View style={styles.observationIndicator}>
              <RNText style={styles.observationIndicatorText}>!</RNText>
            </View>
          )}
        </TouchableOpacity>

        {/* Remove Button */}
        {!disabled && (
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={onRemove}>
            <IconTrash size={16} color={colors.destructive} />
          </TouchableOpacity>
        )}

      </View>

      {/* Observation Modal */}
      <Modal
        visible={observationModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setObservationModal({ visible: false, text: observation || "" })}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setObservationModal({ visible: false, text: observation || "" })}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <IconNote size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>Observação</ThemedText>
            </View>
            <TextInput
              value={observationModal.text}
              onChangeText={(text) => setObservationModal({ ...observationModal, text })}
              placeholder="Adicione notas ou detalhes adicionais..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[
                styles.modalTextInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setObservationModal({ visible: false, text: observation || "" })}
              >
                <ThemedText style={{ color: colors.foreground }}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveButton, { backgroundColor: colors.primary }]} onPress={handleSaveObservation}>
                <RNText style={styles.modalSaveButtonText}>Salvar</RNText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  incompleteSection: {
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  sectionHint: {
    fontSize: fontSize.xs,
  },
  organizeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  itemsConfigSpacer: {
    height: spacing.lg,
  },
  borderedSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  halfField: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  readOnlyField: {
    height: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  readOnlyText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  totalField: {
    borderWidth: 2,
  },
  totalText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    minHeight: 80,
    textAlignVertical: "top",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Item Row styles
  itemRow: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  descriptionField: {
    width: "100%",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  amountField: {
    flex: 1,
    minWidth: 0,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    flexShrink: 0,
  },
  observationIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  observationIndicatorText: {
    fontSize: 7,
    fontWeight: "700",
    color: "#ffffff",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  modalTextInput: {
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalSaveButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    color: "#ffffff",
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});

export default QuoteSelector;
