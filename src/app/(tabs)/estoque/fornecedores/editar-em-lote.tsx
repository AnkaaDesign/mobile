import { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconTruck, IconDeviceFloppy, IconAlertTriangle } from "@tabler/icons-react-native";
import { useSuppliers, useBatchUpdateSuppliers } from "@/hooks";

import { ThemedView, ThemedText, Button, LoadingScreen, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Switch } from "@/components/ui";
import { BatchOperationResultDialog } from "@/components/common/batch-operation-result-dialog";
import { useTheme } from "@/lib/theme";
import { routes, BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { toast } from "@/lib/toast";
import type { BatchOperationResult } from "@/types";

interface BatchEditData {
  // Contact fields
  email?: string | null;
  site?: string | null;
  phone?: string | null;

  // Address fields
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;

  // Tags
  tags?: string[];
}

export default function SupplierBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchOperationResult | null>(null);

  // Track which fields are enabled for batch editing
  const [enabledFields, setEnabledFields] = useState<Record<keyof BatchEditData, boolean>>({
    email: false,
    site: false,
    phone: false,
    address: false,
    addressNumber: false,
    addressComplement: false,
    neighborhood: false,
    city: false,
    state: false,
    zipCode: false,
    tags: false,
  });

  // Batch edit data
  const [batchData, setBatchData] = useState<BatchEditData>({
    email: null,
    site: null,
    phone: null,
    address: null,
    addressNumber: null,
    addressComplement: null,
    neighborhood: null,
    city: null,
    state: null,
    zipCode: null,
    tags: [],
  });

  // Get supplier IDs from URL params
  const supplierIds = useMemo(() => {
    const ids = params.ids as string;
    if (!ids) return [];
    return ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch suppliers to edit
  const {
    data: suppliersResponse,
    isLoading: isLoadingSuppliers,
    error: suppliersError,
  } = useSuppliers(
    {
      where: {
        id: { in: supplierIds },
      },
      include: {
        logo: true,
      },
    },
    {
      enabled: supplierIds.length > 0,
    }
  );

  const { mutateAsync: batchUpdate } = useBatchUpdateSuppliers();

  const suppliers = suppliersResponse?.data || [];

  const hasValidSuppliers = suppliers.length > 0;
  const allSuppliersFound = suppliers.length === supplierIds.length;

  const handleCancel = () => {
    router.push(routeToMobilePath(routes.inventory.suppliers.root) as any);
  };

  const toggleField = (field: keyof BatchEditData) => {
    setEnabledFields(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const updateBatchData = (field: keyof BatchEditData, value: any) => {
    setBatchData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateBatchData = (): string | null => {
    // Check if at least one field is enabled
    const hasEnabledField = Object.values(enabledFields).some(enabled => enabled);
    if (!hasEnabledField) {
      return "Selecione pelo menos um campo para editar";
    }

    // Validate email format
    if (enabledFields.email && batchData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(batchData.email)) {
        return "Email inválido";
      }
    }

    // Validate site URL format
    if (enabledFields.site && batchData.site) {
      try {
        new URL(batchData.site);
      } catch {
        return "URL do site inválida";
      }
    }

    // Validate zip code format (Brazilian CEP)
    if (enabledFields.zipCode && batchData.zipCode) {
      const zipCodeRegex = /^\d{5}-?\d{3}$/;
      if (!zipCodeRegex.test(batchData.zipCode)) {
        return "CEP inválido. Use o formato 00000-000";
      }
    }

    return null;
  };

  const handleSubmit = () => {
    // Validate before showing confirmation
    const validationError = validateBatchData();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      "Confirmar Edição em Lote",
      `Você está prestes a atualizar ${suppliers.length} fornecedor${suppliers.length !== 1 ? 'es' : ''}. Esta ação não pode ser desfeita. Deseja continuar?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: performBatchUpdate,
        },
      ]
    );
  };

  const performBatchUpdate = async () => {
    setIsSubmitting(true);
    try {
      // Build the update data for each supplier
      const updateData: any = {};

      if (enabledFields.email) {
        updateData.email = batchData.email;
      }
      if (enabledFields.site) {
        updateData.site = batchData.site;
      }
      if (enabledFields.phone && batchData.phone) {
        // Replace first phone or add new phone
        updateData.phones = [batchData.phone];
      }
      if (enabledFields.address) {
        updateData.address = batchData.address;
      }
      if (enabledFields.addressNumber) {
        updateData.addressNumber = batchData.addressNumber;
      }
      if (enabledFields.addressComplement) {
        updateData.addressComplement = batchData.addressComplement;
      }
      if (enabledFields.neighborhood) {
        updateData.neighborhood = batchData.neighborhood;
      }
      if (enabledFields.city) {
        updateData.city = batchData.city;
      }
      if (enabledFields.state) {
        updateData.state = batchData.state;
      }
      if (enabledFields.zipCode) {
        updateData.zipCode = batchData.zipCode;
      }
      if (enabledFields.tags) {
        updateData.tags = batchData.tags;
      }

      // Create batch update payload
      const payload = {
        suppliers: supplierIds.map(id => ({
          id,
          data: updateData,
        })),
      };

      const result = await batchUpdate(payload);

      if (result?.data) {
        // Transform to BatchOperationResult format
        const batchOperationResult: BatchOperationResult = {
          success: result.data.totalFailed === 0,
          successCount: result.data.totalSuccess,
          failedCount: result.data.totalFailed,
          errors: result.data.failures?.map((f: { id?: string; error: string }) =>
            `${suppliers.find(s => s.id === f.id)?.fantasyName || 'Fornecedor'}: ${f.error}`
          ) || [],
        };

        setBatchResult(batchOperationResult);
        setShowResultDialog(true);

        // Show toast notification
        if (result.data.totalSuccess > 0) {
          toast.success(
            `${result.data.totalSuccess} fornecedor${result.data.totalSuccess !== 1 ? 'es' : ''} atualizado${result.data.totalSuccess !== 1 ? 's' : ''} com sucesso`
          );
        }

        if (result.data.totalFailed > 0) {
          toast.error(
            `${result.data.totalFailed} fornecedor${result.data.totalFailed !== 1 ? 'es' : ''} falhou ao atualizar`
          );
        }
      }
    } catch (error) {
      console.error("Batch update error:", error);
      toast.error("Erro ao atualizar fornecedores");

      // Show error in dialog
      setBatchResult({
        success: false,
        successCount: 0,
        failedCount: supplierIds.length,
        errors: ["Erro ao processar a atualização em lote"],
      });
      setShowResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    if (batchResult?.success || (batchResult?.successCount ?? 0) > 0) {
      // Navigate back to list if there were any successes
      router.push(routeToMobilePath(routes.inventory.suppliers.root) as any);
    }
  };

  // Loading and error states
  if (supplierIds.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconTruck size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Nenhum Fornecedor Selecionado
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            Nenhum fornecedor foi selecionado para edição em lote.
          </ThemedText>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.button}
          >
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (isLoadingSuppliers) {
    return <LoadingScreen message="Carregando fornecedores..." />;
  }

  if (suppliersError || !hasValidSuppliers) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconAlertTriangle size={48} color={colors.destructive} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Erro ao Carregar Fornecedores
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            {suppliersError ? "Ocorreu um erro ao carregar os fornecedores selecionados." : "Os fornecedores selecionados não foram encontrados."}
          </ThemedText>
          {!allSuppliersFound && suppliers.length > 0 && (
            <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                Apenas {suppliers.length} de {supplierIds.length} fornecedores foram encontrados.
              </ThemedText>
            </View>
          )}
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.button}
          >
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
            Editar Fornecedores em Lote
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {suppliers.length} fornecedor{suppliers.length !== 1 ? 'es' : ''} selecionado{suppliers.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            Selecione os campos que deseja alterar e defina os novos valores. As alterações serão aplicadas a todos os fornecedores selecionados.
          </ThemedText>
        </View>

        {/* Batch Edit Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Campos para Edição
          </ThemedText>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.email}
                onValueChange={() => toggleField('email')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Email
              </ThemedText>
            </View>
            {enabledFields.email && (
              <View style={styles.fieldInput}>
                <Input
                  type="email"
                  value={batchData.email || ''}
                  onChange={(value) => updateBatchData('email', value || null)}
                  placeholder="email@exemplo.com"
                  keyboardType="email-address"
                />
              </View>
            )}
          </View>

          {/* Site Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.site}
                onValueChange={() => toggleField('site')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Site
              </ThemedText>
            </View>
            {enabledFields.site && (
              <View style={styles.fieldInput}>
                <Input
                  type="url"
                  value={batchData.site || ''}
                  onChange={(value) => updateBatchData('site', value || null)}
                  placeholder="https://exemplo.com"
                  keyboardType="url"
                />
              </View>
            )}
          </View>

          {/* Phone Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.phone}
                onValueChange={() => toggleField('phone')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Telefone
              </ThemedText>
            </View>
            {enabledFields.phone && (
              <View style={styles.fieldInput}>
                <Input
                  type="phone"
                  value={batchData.phone || ''}
                  onChange={(value) => updateBatchData('phone', value || null)}
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                />
              </View>
            )}
          </View>

          {/* CEP Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.zipCode}
                onValueChange={() => toggleField('zipCode')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                CEP
              </ThemedText>
            </View>
            {enabledFields.zipCode && (
              <View style={styles.fieldInput}>
                <Input
                  type="zipCode"
                  value={batchData.zipCode || ''}
                  onChange={(value) => updateBatchData('zipCode', value || null)}
                  placeholder="00000-000"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Address Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.address}
                onValueChange={() => toggleField('address')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Endereço
              </ThemedText>
            </View>
            {enabledFields.address && (
              <View style={styles.fieldInput}>
                <Input
                  value={batchData.address || ''}
                  onChange={(value) => updateBatchData('address', value || null)}
                  placeholder="Rua, Avenida..."
                />
              </View>
            )}
          </View>

          {/* Address Number Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.addressNumber}
                onValueChange={() => toggleField('addressNumber')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Número
              </ThemedText>
            </View>
            {enabledFields.addressNumber && (
              <View style={styles.fieldInput}>
                <Input
                  value={batchData.addressNumber || ''}
                  onChange={(value) => updateBatchData('addressNumber', value || null)}
                  placeholder="123"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Address Complement Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.addressComplement}
                onValueChange={() => toggleField('addressComplement')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Complemento
              </ThemedText>
            </View>
            {enabledFields.addressComplement && (
              <View style={styles.fieldInput}>
                <Input
                  value={batchData.addressComplement || ''}
                  onChange={(value) => updateBatchData('addressComplement', value || null)}
                  placeholder="Apto, Sala..."
                />
              </View>
            )}
          </View>

          {/* Neighborhood Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.neighborhood}
                onValueChange={() => toggleField('neighborhood')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Bairro
              </ThemedText>
            </View>
            {enabledFields.neighborhood && (
              <View style={styles.fieldInput}>
                <Input
                  value={batchData.neighborhood || ''}
                  onChange={(value) => updateBatchData('neighborhood', value || null)}
                  placeholder="Centro"
                />
              </View>
            )}
          </View>

          {/* City Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.city}
                onValueChange={() => toggleField('city')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Cidade
              </ThemedText>
            </View>
            {enabledFields.city && (
              <View style={styles.fieldInput}>
                <Input
                  value={batchData.city || ''}
                  onChange={(value) => updateBatchData('city', value || null)}
                  placeholder="São Paulo"
                />
              </View>
            )}
          </View>

          {/* State Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.state}
                onValueChange={() => toggleField('state')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Estado
              </ThemedText>
            </View>
            {enabledFields.state && (
              <View style={styles.fieldInput}>
                <Select
                  value={batchData.state || undefined}
                  onValueChange={(value) => updateBatchData('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem
                        key={state}
                        value={state}
                        label={`${state} - ${BRAZILIAN_STATE_NAMES[state]}`}
                      />
                    ))}
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>

          {/* Tags Field - Note: Tags implementation would need TagManager component */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                value={enabledFields.tags}
                onValueChange={() => toggleField('tags')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Tags
              </ThemedText>
            </View>
            {enabledFields.tags && (
              <View style={styles.fieldInput}>
                <ThemedText style={[styles.fieldNote, { color: colors.mutedForeground }]}>
                  Tags separadas por vírgula
                </ThemedText>
                <Input
                  value={(batchData.tags || []).join(', ')}
                  onChange={(value) => {
                    const tagsArray = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];
                    updateBatchData('tags', tagsArray);
                  }}
                  placeholder="tag1, tag2, tag3"
                />
              </View>
            )}
          </View>
        </View>

        {/* Selected Suppliers List */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Fornecedores Selecionados
          </ThemedText>
          <View style={styles.suppliersList}>
            {suppliers.map((supplier, index) => (
              <View
                key={supplier.id}
                style={[
                  styles.supplierItem,
                  { borderBottomColor: colors.border },
                  index === suppliers.length - 1 && styles.supplierItemLast
                ]}
              >
                <ThemedText style={[styles.supplierName, { color: colors.foreground }]}>
                  {supplier.fantasyName}
                </ThemedText>
                {supplier.cnpj && (
                  <ThemedText style={[styles.supplierInfo, { color: colors.mutedForeground }]}>
                    CNPJ: {supplier.cnpj}
                  </ThemedText>
                )}
                {supplier.city && supplier.state && (
                  <ThemedText style={[styles.supplierInfo, { color: colors.mutedForeground }]}>
                    {supplier.city} - {supplier.state}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={styles.footerButton}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={isSubmitting}
            icon={<IconDeviceFloppy size={20} color={colors.primaryForeground} />}
            style={styles.footerButton}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </View>
      </ScrollView>

      {/* Batch Operation Result Dialog */}
      <BatchOperationResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        result={batchResult}
        onConfirm={handleResultDialogClose}
        itemType="fornecedores"
        itemTypeSingular="fornecedor"
        title="Resultado da Edição em Lote"
        description="Resumo da operação de atualização"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  infoCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    minWidth: 120,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  fieldInput: {
    marginLeft: 44,
  },
  fieldNote: {
    fontSize: 12,
    marginBottom: 4,
    fontStyle: "italic",
  },
  suppliersList: {
    gap: 0,
  },
  supplierItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  supplierItemLast: {
    borderBottomWidth: 0,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  supplierInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  warningCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  footerButton: {
    flex: 1,
  },
});
