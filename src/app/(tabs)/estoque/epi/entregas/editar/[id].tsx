import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { Text } from "@/components/ui/text";

import { usePpeDeliveryMutations, usePpeDelivery, useItems, useUsers } from "@/hooks";
import { PPE_DELIVERY_STATUS } from "@/constants";
import { PPE_DELIVERY_STATUS_LABELS } from "@/constants/enum-labels";

interface PPEDeliveryUpdateFormData {
  itemId?: string;
  quantity?: number;
  scheduledDate?: Date | null;
  status?: string;
}

export default function EditPPEDeliveryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync, updateMutation } = usePpeDeliveryMutations();

  const { data: delivery, isLoading: isDeliveryLoading } = usePpeDelivery(id, {
    include: {
      item: true,
      user: true,
    },
  });

  const { data: items } = useItems({ orderBy: { name: "asc" } });
  const { data: users } = useUsers({ orderBy: { name: "asc" } });

  const form = useForm<PPEDeliveryUpdateFormData>({
    defaultValues: delivery?.data ? {
      itemId: delivery.data.itemId ?? undefined,
      quantity: delivery.data.quantity,
      status: delivery.data.status,
    } : {
      itemId: undefined,
      quantity: 0,
      status: PPE_DELIVERY_STATUS.PENDING,
    },
  });

  const isLoading = updateMutation.isPending || isDeliveryLoading;

  const itemOptions: ComboboxOption[] =
    items?.data?.map((item) => ({
      value: item.id,
      label: `${item.uniCode || ""} ${item.name}`.trim(),
    })) || [];

  const userOptions: ComboboxOption[] =
    users?.data?.map((user) => ({
      value: user.id,
      label: user.name,
    })) || [];

  const statusOptions: ComboboxOption[] = Object.entries(PPE_DELIVERY_STATUS_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const handleSubmit = async (data: PPEDeliveryUpdateFormData) => {
    try {
      if (!id) {
        Alert.alert("Erro", "ID de entrega não encontrado");
        return;
      }
      await updateAsync({
        id,
        data,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao atualizar a entrega de EPI");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isDeliveryLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando entrega...
        </Text>
      </View>
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
          {/* Basic Information */}
          <FormCard title="Informações Básicas" icon="IconShield">
            {/* Item */}
            <FormFieldGroup
              label="Item EPI"
              required
              error={form.formState.errors.itemId?.message}
            >
              <Controller
                control={form.control}
                name="itemId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={itemOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione o item"
                    disabled={isLoading}
                    searchable
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            {/* User - Read-only, cannot be changed after creation */}
            <FormFieldGroup
              label="Funcionário"
              required
            >
              <Combobox
                options={userOptions}
                value={delivery?.data?.userId || undefined}
                onValueChange={() => {}} // Read-only
                placeholder="Selecione o funcionário"
                disabled={true}
                searchable
                clearable={false}
              />
            </FormFieldGroup>

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

            {/* Status */}
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
          </FormCard>

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SimpleFormActionBar
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
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
