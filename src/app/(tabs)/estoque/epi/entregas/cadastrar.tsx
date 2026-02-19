import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { usePpeDeliveryMutations, useItems, useUsers, useScreenReady} from '@/hooks';
import { PPE_DELIVERY_STATUS } from "@/constants";
import { PPE_DELIVERY_STATUS_LABELS } from "@/constants/enum-labels";

interface PPEDeliveryCreateFormData {
  itemId: string;
  userId: string;
  quantity: number;
  scheduledDate?: Date | null;
  status: string;
}

export default function CreatePPEDeliveryScreen() {
  useScreenReady();
  const router = useRouter();
  const { colors } = useTheme();
  const { createAsync, createMutation } = usePpeDeliveryMutations();

  const { data: items } = useItems({ orderBy: { name: "asc" } });
  const { data: users } = useUsers({ orderBy: { name: "asc" } });

  const form = useForm<PPEDeliveryCreateFormData>({
    defaultValues: {
      itemId: "",
      userId: "",
      quantity: 0,
      scheduledDate: null,
      status: PPE_DELIVERY_STATUS.PENDING,
    },
  });

  const isLoading = createMutation.isPending;

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

  const handleSubmit = async (data: PPEDeliveryCreateFormData) => {
    try {
      // Add statusOrder property required by the API
      const formDataWithStatusOrder = {
        ...data,
        statusOrder: 0,
      };
      await createAsync(formDataWithStatusOrder);
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao criar a entrega de EPI");
    }
  };

  const handleCancel = () => {
    router.back();
  };

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

            {/* User */}
            <FormFieldGroup
              label="Funcionário"
              required
              error={form.formState.errors.userId?.message}
            >
              <Controller
                control={form.control}
                name="userId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={userOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione o funcionário"
                    disabled={isLoading}
                    searchable
                    clearable
                    error={error?.message}
                  />
                )}
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
                    onChangeText={(text: string | number | null) => {
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
});
