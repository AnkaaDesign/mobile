import { useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { Text } from "@/components/ui/text";

import { usePpeDeliveryMutations, usePpeDelivery, useScreenReady } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_ORDER, SECTOR_PRIVILEGES, routes } from "@/constants";
import { PPE_DELIVERY_STATUS_LABELS } from "@/constants/enum-labels";
import { ppeDeliveryUpdateSchema, mapPpeDeliveryToFormData, type PpeDeliveryUpdateFormData } from "../../../../../../schemas";
import { hasPrivilege } from "@/utils";
import { routeToMobilePath } from "@/utils/route-mapper";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditHRPPEDeliveryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { updateAsync, updateMutation } = usePpeDeliveryMutations();

  const { data: delivery, isLoading: isDeliveryLoading } = usePpeDelivery(id, {
    include: {
      item: true,
      user: true,
    },
  });

  const form = useForm<PpeDeliveryUpdateFormData>({
    resolver: zodResolver(ppeDeliveryUpdateSchema),
    defaultValues: {
      quantity: 0,
      status: PPE_DELIVERY_STATUS.PENDING,
    },
  });

  // Reset form when delivery data loads
  useEffect(() => {
    if (delivery?.data) {
      const formData = mapPpeDeliveryToFormData(delivery.data);
      form.reset(formData);
    }
  }, [delivery?.data]);

  // Auto-set actualDeliveryDate when status changes to DELIVERED
  const watchedStatus = form.watch("status");
  useEffect(() => {
    if (watchedStatus === PPE_DELIVERY_STATUS.DELIVERED) {
      form.setValue("actualDeliveryDate", new Date(), { shouldDirty: true });
    }
  }, [watchedStatus]);

  const isLoading = updateMutation.isPending || isDeliveryLoading;
  const canEditStatus = hasPrivilege(currentUser, SECTOR_PRIVILEGES.WAREHOUSE);

  useScreenReady(!isLoading);

  const statusOptions: ComboboxOption[] = Object.entries(PPE_DELIVERY_STATUS_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const handleSubmit = async (data: PpeDeliveryUpdateFormData) => {
    try {
      if (!id) {
        Alert.alert("Erro", "ID de entrega não encontrado");
        return;
      }

      const submitData: PpeDeliveryUpdateFormData & { statusOrder?: number } = { ...data };
      if (data.status) {
        submitData.statusOrder = PPE_DELIVERY_STATUS_ORDER[data.status];
      }

      await updateAsync({
        id,
        data: submitData,
      });
      router.replace(routeToMobilePath(routes.humanResources.ppe.deliveries.details(id)) as any);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao atualizar a entrega de EPI");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isDeliveryLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!delivery?.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar entrega de EPI
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormCard title="Informações Básicas" icon="IconShield">
            {/* Quantity */}
            <FormFieldGroup
              label="Quantidade"
              required
              error={form.formState.errors.quantity?.message}
            >
              <Controller
                control={form.control}
                name="quantity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={String(value || 0)}
                    onChangeText={(text) => {
                      if (!text) {
                        onChange(0);
                        return;
                      }
                      const numValue = parseInt(String(text));
                      onChange(isNaN(numValue) ? 0 : numValue);
                    }}
                    onBlur={onBlur}
                    placeholder="0"
                    editable={!isLoading}
                    error={!!form.formState.errors.quantity}
                    keyboardType="number-pad"
                  />
                )}
              />
            </FormFieldGroup>

            {/* Status - Only visible for WAREHOUSE privilege */}
            {canEditStatus && (
              <FormFieldGroup
                label="Status"
                error={form.formState.errors.status?.message}
              >
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={statusOptions}
                      value={value || undefined}
                      onValueChange={onChange}
                      placeholder="Selecione o status"
                      disabled={isLoading}
                      searchable={false}
                      clearable
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>
            )}
          </FormCard>

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      <FormActionBar
        onSave={form.handleSubmit(handleSubmit)}
        onCancel={handleCancel}
        isLoading={isLoading}
        isSaveDisabled={!form.formState.isDirty || isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: formSpacing.screenPadding,
    paddingBottom: formSpacing.screenPaddingBottom,
  },
  spacing: {
    height: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
