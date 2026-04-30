import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  IconInfoCircle,
  IconUsers,
  IconSettings,
  IconPhoto,
  IconCalendar,
  IconUser,
  IconUpload,
  IconArrowLeft,
  IconX,
} from "@tabler/icons-react-native";
import { useWatch, useFormContext } from "react-hook-form";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { useFileViewer } from "@/components/file";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";
import { getCustomers } from "@/api-client/customer";
import { TRUCK_CATEGORY_LABELS, IMPLEMENT_TYPE_LABELS } from "@/constants/enum-labels";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { ONLINE_API_URL } from "@/constants/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArtworkOption {
  id: string;
  artworkId?: string;
  filename?: string;
  originalName?: string;
  thumbnailUrl?: string | null;
  status?: string;
  mimetype?: string;
  size?: number;
}

export interface StepQuoteInfoProps {
  control: any;
  task?: any;
  mode: "create" | "edit" | "billing";
  layoutFiles: FilePickerItem[];
  onLayoutFilesChange: (files: FilePickerItem[]) => void;
  artworks?: ArtworkOption[];
  customersCache: React.MutableRefObject<Map<string, any>>;
  selectedCustomers: Map<string, any>;
  setSelectedCustomers: (customers: Map<string, any>) => void;
  /** Field prefix for react-hook-form paths. '' for create mode, 'quote.' for edit mode. */
  fieldPrefix?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GUARANTEE_OPTIONS = [
  { value: "5", label: "5 anos" },
  { value: "10", label: "10 anos" },
  { value: "15", label: "15 anos" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

const VALIDITY_PERIOD_OPTIONS = [
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
];

const FORECAST_DAYS_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i + 1 === 1 ? "dia" : "dias"}`,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDocumentNumber(value: string | null | undefined): string {
  if (!value) return "";
  const clean = value.replace(/\D/g, "");
  if (clean.length === 11)
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (clean.length === 14)
    return clean.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  return value;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const UPLOAD_NEW_SENTINEL = "__UPLOAD_NEW__";

export function StepQuoteInfo({
  control,
  task,
  mode,
  layoutFiles,
  onLayoutFilesChange,
  artworks,
  customersCache,
  selectedCustomers,
  setSelectedCustomers,
  fieldPrefix = "",
}: StepQuoteInfoProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const { setValue, getValues } = useFormContext();
  const keyboardContext = useKeyboardAwareForm();

  const [validityPeriod, setValidityPeriod] = useState<string>("");
  const [showCustomGuarantee, setShowCustomGuarantee] = useState(false);
  const [showLayoutUploadMode, setShowLayoutUploadMode] = useState(false);

  // Build field names with prefix
  const f = useCallback(
    (name: string) => `${fieldPrefix}${name}`,
    [fieldPrefix],
  );

  // Watched values
  const guaranteeYears = useWatch({ control, name: f("guaranteeYears") });
  const customGuaranteeText = useWatch({
    control,
    name: f("customGuaranteeText"),
  });
  const simultaneousTasks = useWatch({
    control,
    name: f("simultaneousTasks"),
  });
  const customForecastDays = useWatch({
    control,
    name: f("customForecastDays"),
  });
  const customerConfigsValue =
    useWatch({ control, name: f("customerConfigs") }) || [];
  const currentLayoutFileId = useWatch({
    control,
    name: f("layoutFileId"),
  });

  const isBilling = mode === "billing";

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  useEffect(() => {
    const expiresAt = getValues(f("expiresAt"));
    if (expiresAt) {
      const diffDays = Math.ceil(
        (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const closest = [15, 30, 60, 90].find(
        (d) => Math.abs(d - diffDays) <= 3,
      );
      setValidityPeriod(closest ? closest.toString() : "30");
    } else {
      setValidityPeriod("30");
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      expiryDate.setHours(23, 59, 59, 999);
      setValue(f("expiresAt"), expiryDate);
      setValue(f("status"), "PENDING");
    }
    if (customGuaranteeText) setShowCustomGuarantee(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const currentGuaranteeOption = useMemo(() => {
    if (customGuaranteeText) return "CUSTOM";
    if (guaranteeYears) return guaranteeYears.toString();
    return "";
  }, [guaranteeYears, customGuaranteeText]);

  const selectedCustomerIds = useMemo(() => {
    if (!Array.isArray(customerConfigsValue)) return [];
    return customerConfigsValue
      .map((c: any) => c.customerId)
      .filter(Boolean);
  }, [customerConfigsValue]);

  const customerOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    selectedCustomers.forEach((c, id) => {
      options.push({
        value: id,
        label: c.fantasyName || c.corporateName || "Cliente",
      });
    });
    return options;
  }, [selectedCustomers]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleValidityChange = useCallback(
    (value: string | string[] | null | undefined) => {
      const period = typeof value === "string" ? value : "";
      setValidityPeriod(period);
      const days = Number(period);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      expiryDate.setHours(23, 59, 59, 999);
      setValue(f("expiresAt"), expiryDate);
    },
    [setValue, f],
  );

  const handleGuaranteeChange = useCallback(
    (val: string | string[] | null | undefined) => {
      const value = typeof val === "string" ? val : "";
      if (value === "CUSTOM") {
        setShowCustomGuarantee(true);
        setValue(f("guaranteeYears"), null);
      } else {
        setShowCustomGuarantee(false);
        setValue(f("customGuaranteeText"), null);
        setValue(f("guaranteeYears"), value ? Number(value) : null);
      }
    },
    [setValue, f],
  );

  const handleLayoutChange = useCallback(
    (files: FilePickerItem[]) => {
      onLayoutFilesChange(files);
      if (files.length > 0 && files[0].id && files[0].uploaded) {
        setValue(f("layoutFileId"), files[0].id);
      } else if (files.length === 0) {
        setValue(f("layoutFileId"), null);
      }
    },
    [setValue, f, onLayoutFilesChange],
  );

  const handleArtworkSelect = useCallback(
    (value: string | string[] | null | undefined) => {
      const fileId = typeof value === "string" ? value : null;
      if (fileId === UPLOAD_NEW_SENTINEL) {
        setShowLayoutUploadMode(true);
        return;
      }
      if (fileId) {
        const artwork = artworks?.find((a) => a.id === fileId);
        if (artwork) {
          const fileItem: FilePickerItem = {
            id: artwork.id,
            name: artwork.originalName || artwork.filename || "artwork",
            size: artwork.size || 0,
            type: artwork.mimetype || "image/png",
            uploaded: true,
            uri: `${ONLINE_API_URL}/files/thumbnail/${artwork.id}`,
          };
          onLayoutFilesChange([fileItem]);
          setValue(f("layoutFileId"), artwork.id);
          setShowLayoutUploadMode(false);
        }
      } else {
        onLayoutFilesChange([]);
        setValue(f("layoutFileId"), null);
      }
    },
    [artworks, setValue, f, onLayoutFilesChange],
  );

  const artworkOptions = useMemo(() => {
    if (!artworks || artworks.length === 0) return [];
    const imageArtworks = artworks.filter((a) => {
      const mime = a.mimetype || "";
      return mime.startsWith("image/");
    });
    if (imageArtworks.length === 0) return [];
    return [
      ...imageArtworks,
      {
        id: UPLOAD_NEW_SENTINEL,
        filename: "Enviar novo arquivo",
      } as ArtworkOption,
    ];
  }, [artworks]);

  const renderArtworkOption = useCallback(
    (artwork: ArtworkOption) => {
      if (artwork.id === UPLOAD_NEW_SENTINEL) {
        return (
          <View style={styles.artworkOptionRow}>
            <View
              style={[
                styles.artworkThumbPlaceholder,
                {
                  backgroundColor: colors.muted + "50",
                  borderColor: colors.border,
                },
              ]}
            >
              <IconUpload size={20} color={colors.mutedForeground} />
            </View>
            <ThemedText
              style={{ fontSize: 13, color: colors.mutedForeground }}
            >
              Enviar novo arquivo
            </ThemedText>
          </View>
        );
      }
      const thumbnailSrc =
        artwork.thumbnailUrl ||
        `${ONLINE_API_URL}/files/thumbnail/${artwork.id}`;
      return (
        <View style={styles.artworkOptionRow}>
          <View
            style={[
              styles.artworkThumb,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
              },
            ]}
          >
            <Image
              source={{ uri: thumbnailSrc }}
              style={styles.artworkThumbImage}
              contentFit="cover"
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText
              style={{ fontSize: 13 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {artwork.originalName || artwork.filename || "Arquivo"}
            </ThemedText>
            {artwork.status && (
              <ThemedText
                style={{ fontSize: 11, color: colors.mutedForeground }}
              >
                {artwork.status === "APPROVED"
                  ? "Aprovado"
                  : artwork.status === "REPROVED"
                    ? "Reprovado"
                    : "Rascunho"}
              </ThemedText>
            )}
          </View>
        </View>
      );
    },
    [colors],
  );

  // Customer search (async queryFn for Combobox)
  const searchCustomers = useCallback(
    async (search: string, page: number = 1) => {
      try {
        const params: any = {
          orderBy: { fantasyName: "asc" },
          page,
          take: 50,
        };
        if (search?.trim()) params.searchingFor = search.trim();
        const response = await getCustomers(params);
        const customers = response.data || [];
        customers.forEach((c: any) => customersCache.current.set(c.id, c));
        return {
          data: customers.map((c: any) => ({
            value: c.id,
            label: c.fantasyName || c.corporateName || "Cliente",
          })),
          hasMore: response.meta?.hasNextPage || false,
        };
      } catch {
        return { data: [], hasMore: false };
      }
    },
    [customersCache],
  );

  const handleCustomerChange = useCallback(
    (newIds: string | string[] | null | undefined) => {
      const ids = Array.isArray(newIds) ? newIds : newIds ? [newIds] : [];
      const currentConfigs: any[] = Array.isArray(customerConfigsValue)
        ? customerConfigsValue
        : [];
      const newConfigs = ids.map((id: string) => {
        const existing = currentConfigs.find(
          (c: any) => c.customerId === id,
        );
        if (existing) return existing;
        return {
          customerId: id,
          subtotal: 0,
          total: 0,
          paymentCondition: null,
          customPaymentText: null,
          responsibleId: null,
          generateInvoice: true,
          orderNumber: null,
        };
      });
      setValue(f("customerConfigs"), newConfigs);

      const newMap = new Map<string, any>();
      ids.forEach((id: string) => {
        const cached = customersCache.current.get(id);
        if (cached) newMap.set(id, cached);
      });
      setSelectedCustomers(newMap);
    },
    [
      customerConfigsValue,
      setValue,
      f,
      customersCache,
      setSelectedCustomers,
    ],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* ----------------------------------------------------------------- */}
      {/* 1. Task Info Card (read-only, edit/billing only) */}
      {/* ----------------------------------------------------------------- */}
      {mode !== "create" && task && (
        <FormCard title="Dados da Tarefa" icon="IconInfoCircle">
          <View style={styles.taskInfoGrid}>
            <View style={styles.taskInfoField}>
              <ThemedText
                style={[styles.taskInfoLabel, { color: colors.mutedForeground }]}
              >
                Tarefa
              </ThemedText>
              <ThemedText style={styles.taskInfoValue}>
                {task.name || "-"}
              </ThemedText>
            </View>

            <View style={styles.taskInfoField}>
              <ThemedText
                style={[styles.taskInfoLabel, { color: colors.mutedForeground }]}
              >
                Cliente
              </ThemedText>
              <ThemedText style={styles.taskInfoValue}>
                {task.customer?.fantasyName ||
                  task.customer?.corporateName ||
                  "-"}
              </ThemedText>
            </View>

            {task.serialNumber && (
              <View style={styles.taskInfoField}>
                <ThemedText
                  style={[
                    styles.taskInfoLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Nº Série
                </ThemedText>
                <ThemedText style={styles.taskInfoValue}>
                  {task.serialNumber}
                </ThemedText>
              </View>
            )}

            {task.truck?.plate && (
              <View style={styles.taskInfoField}>
                <ThemedText
                  style={[
                    styles.taskInfoLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Placa
                </ThemedText>
                <ThemedText style={styles.taskInfoValue}>
                  {task.truck.plate.toUpperCase()}
                </ThemedText>
              </View>
            )}

            {task.truck?.chassisNumber && (
              <View style={styles.taskInfoField}>
                <ThemedText
                  style={[
                    styles.taskInfoLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Chassi
                </ThemedText>
                <ThemedText style={styles.taskInfoValue}>
                  {task.truck.chassisNumber}
                </ThemedText>
              </View>
            )}

            {task.truck?.category && (
              <View style={styles.taskInfoField}>
                <ThemedText
                  style={[
                    styles.taskInfoLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Categoria
                </ThemedText>
                <ThemedText style={styles.taskInfoValue}>
                  {TRUCK_CATEGORY_LABELS[task.truck.category as keyof typeof TRUCK_CATEGORY_LABELS] || task.truck.category}
                </ThemedText>
              </View>
            )}

            {task.truck?.implementType && (
              <View style={styles.taskInfoField}>
                <ThemedText
                  style={[
                    styles.taskInfoLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Implemento
                </ThemedText>
                <ThemedText style={styles.taskInfoValue}>
                  {IMPLEMENT_TYPE_LABELS[task.truck.implementType as keyof typeof IMPLEMENT_TYPE_LABELS] || task.truck.implementType}
                </ThemedText>
              </View>
            )}

            {task.finishedAt && (
              <View style={styles.taskInfoField}>
                <ThemedText
                  style={[
                    styles.taskInfoLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Finalização
                </ThemedText>
                <ThemedText style={styles.taskInfoValue}>
                  {new Date(task.finishedAt).toLocaleDateString("pt-BR")}
                </ThemedText>
              </View>
            )}
          </View>
        </FormCard>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. Customer Selection Card */}
      {/* ----------------------------------------------------------------- */}
      <FormCard title="Clientes para Faturamento" icon="IconUsers">
        <FormFieldGroup
          label="Faturar Para (Clientes)"
          required
        >
          <Combobox
            value={selectedCustomerIds}
            onValueChange={handleCustomerChange}
            mode="multiple"
            hideDefaultBadges
            async
            queryKey={["customers", "quote-invoice-selector"]}
            queryFn={searchCustomers}
            initialOptions={customerOptions}
            placeholder="Selecione clientes para faturamento..."
            searchable
            minSearchLength={0}
            debounceMs={500}
          />
          <ThemedText style={styles.helperText}>
            Por padrão, o cliente da tarefa é pré-selecionado. Adicione outros clientes se a fatura for dividida.
          </ThemedText>
        </FormFieldGroup>

        {/* Selected Customer Cards */}
        {selectedCustomers.size > 0 && (
          <View style={styles.customerCardList}>
            {Array.from(selectedCustomers.entries()).map(
              ([id, customer], index) => {
                const docValue = customer.cnpj || customer.cpf;
                const docLabel = customer.cnpj
                  ? "CNPJ"
                  : customer.cpf
                    ? "CPF"
                    : "";
                const formattedDoc = formatDocumentNumber(docValue);
                const hasLogo = customer.logo?.id || customer.logoId;
                const logoUrl = hasLogo
                  ? `${ONLINE_API_URL}/files/thumbnail/${customer.logo?.id || customer.logoId}`
                  : null;

                return (
                  <View
                    key={id}
                    style={[
                      styles.customerCard,
                      {
                        backgroundColor: colors.muted + "30",
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.customerCardRow}>
                      {/* Customer Logo */}
                      <View
                        style={[
                          styles.customerLogo,
                          {
                            backgroundColor: colors.muted,
                          },
                        ]}
                      >
                        {logoUrl ? (
                          <Image
                            source={{ uri: logoUrl }}
                            style={styles.customerLogoImage}
                            contentFit="cover"
                          />
                        ) : (
                          <IconUser
                            size={18}
                            color={colors.mutedForeground}
                          />
                        )}
                      </View>

                      {/* Name & Doc */}
                      <View style={{ flex: 1 }}>
                        <ThemedText
                          style={styles.customerName}
                          numberOfLines={1}
                        >
                          {customer.corporateName ||
                            customer.fantasyName ||
                            `Cliente ${index + 1}`}
                        </ThemedText>
                        {formattedDoc ? (
                          <ThemedText
                            style={[
                              styles.customerDoc,
                              { color: colors.mutedForeground },
                            ]}
                            numberOfLines={1}
                          >
                            {docLabel}: {formattedDoc}
                          </ThemedText>
                        ) : null}
                      </View>

                      {/* Remove button */}
                      <TouchableOpacity
                        onPress={() => {
                          const newIds = selectedCustomerIds.filter(
                            (cid: string) => cid !== customer.id,
                          );
                          handleCustomerChange(newIds);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <IconX
                          size={16}
                          color={colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              },
            )}
          </View>
        )}
      </FormCard>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Quote Configuration Card (hidden in billing) */}
      {/* ----------------------------------------------------------------- */}
      {!isBilling && (
        <FormCard title="Configurações do Orçamento" icon="IconSettings">
          {/* Validity */}
          <FormFieldGroup label="Validade" required>
            <Combobox
              value={validityPeriod}
              onValueChange={handleValidityChange}
              options={VALIDITY_PERIOD_OPTIONS}
              placeholder="Período"
              searchable={false}
              avoidKeyboard={false}
              onOpen={() => {}}
              onClose={() => {}}
            />
            <ThemedText style={styles.helperText}>
              Prazo em dias que este orçamento permanece válido.
            </ThemedText>
          </FormFieldGroup>

          {/* Guarantee */}
          <FormFieldGroup label="Período de Garantia">
            <Combobox
              value={currentGuaranteeOption}
              onValueChange={handleGuaranteeChange}
              options={GUARANTEE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              placeholder="Selecione"
              searchable={false}
              avoidKeyboard={false}
              onOpen={() => {}}
              onClose={() => {}}
            />
            <ThemedText style={styles.helperText}>
              Garantia oferecida ao cliente após a entrega do serviço.
            </ThemedText>
          </FormFieldGroup>

          {/* Custom Guarantee Text */}
          {showCustomGuarantee && (
            <FormFieldGroup label="Texto Personalizado de Garantia">
              <View
                onLayout={
                  keyboardContext
                    ? (e) =>
                        keyboardContext.onFieldLayout(
                          "pricing-custom-guarantee",
                          e,
                        )
                    : undefined
                }
              >
                <TextInput
                  value={customGuaranteeText || ""}
                  onChangeText={(t) =>
                    setValue(f("customGuaranteeText"), t || null)
                  }
                  placeholder="Descreva as condições de garantia..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  onFocus={() =>
                    keyboardContext?.onFieldFocus(
                      "pricing-custom-guarantee",
                    )
                  }
                />
              </View>
            </FormFieldGroup>
          )}

          {/* Simultaneous Tasks + Forecast Days (side by side) */}
          <FormRow>
            <FormFieldGroup label="Tarefas Simultâneas">
              <Input
                type="number"
                value={simultaneousTasks ?? null}
                onChange={(value) => {
                  const numVal = value ? Number(value) : null;
                  setValue(f("simultaneousTasks"), numVal);
                }}
                placeholder="1-100"
              />
            </FormFieldGroup>
            <FormFieldGroup label="Prazo Entrega (dias)">
              <Combobox
                value={
                  customForecastDays ? String(customForecastDays) : ""
                }
                onValueChange={(value) =>
                  setValue(
                    f("customForecastDays"),
                    value ? Number(value) : null,
                  )
                }
                options={FORECAST_DAYS_OPTIONS}
                placeholder="Auto"
                searchable={false}
                avoidKeyboard={false}
                onOpen={() => {}}
                onClose={() => {}}
              />
            </FormFieldGroup>
          </FormRow>
          <ThemedText style={styles.helperText}>
            Prazo sobrescreve o cálculo automático de entrega. Tarefas simultâneas ajusta paralelismo na produção.
          </ThemedText>
        </FormCard>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 4. Layout Card (hidden in billing) */}
      {/* ----------------------------------------------------------------- */}
      {!isBilling && (
        <FormCard title="Layout Aprovado" icon="IconPhoto">
          {/* Artwork selector mode */}
          {artworkOptions.length > 0 && !showLayoutUploadMode && (
            <>
              <Combobox<ArtworkOption>
                value={currentLayoutFileId || ""}
                onValueChange={handleArtworkSelect}
                options={artworkOptions}
                getOptionValue={(a) => a.id}
                getOptionLabel={(a) =>
                  a.originalName || a.filename || "Arquivo"
                }
                renderOption={renderArtworkOption}
                placeholder="Selecionar uma arte existente..."
                emptyText="Nenhuma arte de imagem encontrada"
                clearable
                searchable
              />

              {/* Selected artwork full image preview */}
              {currentLayoutFileId &&
                artworkOptions.some(
                  (a) => a.id === currentLayoutFileId,
                ) && (
                  <View
                    style={[
                      styles.artworkPreview,
                      {
                        backgroundColor: colors.muted + "30",
                      },
                    ]}
                  >
                    <View style={styles.artworkPreviewHeader}>
                      <ThemedText
                        style={[
                          styles.artworkPreviewName,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {artworkOptions.find(
                          (a) => a.id === currentLayoutFileId,
                        )?.originalName ||
                          artworkOptions.find(
                            (a) => a.id === currentLayoutFileId,
                          )?.filename ||
                          "Layout selecionado"}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => handleArtworkSelect(null)}
                        style={{ padding: 4 }}
                      >
                        <IconX
                          size={16}
                          color={colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        const selectedArtwork = artworkOptions.find(
                          (a) => a.id === currentLayoutFileId,
                        );
                        if (selectedArtwork) {
                          fileViewer.actions.viewFile({
                            id: selectedArtwork.id,
                            filename: selectedArtwork.filename,
                            originalName: selectedArtwork.originalName,
                            mimetype:
                              selectedArtwork.mimetype || "image/png",
                            size: selectedArtwork.size,
                          } as any);
                        }
                      }}
                    >
                      <Image
                        source={{
                          uri: `${ONLINE_API_URL}/files/thumbnail/${currentLayoutFileId}`,
                        }}
                        style={styles.artworkPreviewImage}
                        contentFit="contain"
                      />
                    </TouchableOpacity>
                  </View>
                )}
            </>
          )}

          {/* File upload mode */}
          {(artworkOptions.length === 0 || showLayoutUploadMode) && (
            <>
              {artworkOptions.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowLayoutUploadMode(false)}
                  style={styles.backToArtworksBtn}
                >
                  <IconArrowLeft
                    size={13}
                    color={colors.mutedForeground}
                  />
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                    }}
                  >
                    Voltar para seleção de artes
                  </ThemedText>
                </TouchableOpacity>
              )}
              <FilePicker
                value={layoutFiles}
                onChange={handleLayoutChange}
                maxFiles={1}
                placeholder="Selecione o layout aprovado"
                helperText="Arraste ou clique para selecionar"
                showCamera={true}
                showGallery={true}
                showFilePicker={false}
                acceptedFileTypes={[
                  "image/jpeg",
                  "image/png",
                  "image/gif",
                  "image/webp",
                ]}
              />
            </>
          )}
        </FormCard>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },

  // Helper text shown under form fields (matches Pedido pattern)
  helperText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: spacing.xs,
  },

  // Task Info grid
  taskInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  taskInfoField: {
    minWidth: 80,
  },
  taskInfoLabel: {
    fontSize: 11,
  },
  taskInfoValue: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },

  // Customer cards
  customerCardList: {
    gap: spacing.sm,
  },
  customerCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  customerCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  customerLogo: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  customerLogoImage: {
    width: 36,
    height: 36,
  },
  customerName: {
    fontSize: 13,
    fontWeight: "600",
  },
  customerDoc: {
    fontSize: 11,
  },

  // Textarea
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Artwork option rows
  artworkOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  artworkThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
  },
  artworkThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  artworkThumbImage: {
    width: 48,
    height: 48,
  },

  // Artwork preview
  artworkPreview: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  artworkPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  artworkPreviewName: {
    fontSize: 11,
    flex: 1,
  },
  artworkPreviewImage: {
    height: 192,
    width: "100%",
    borderRadius: borderRadius.md,
  },

  // Back to artworks link
  backToArtworksBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
});
