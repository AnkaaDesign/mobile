import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Textarea } from "@/components/ui/textarea";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { type Service } from '../../../../types';
import { serviceCreateSchema, serviceUpdateSchema } from '../../../../schemas';

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: ServiceCreateFormData | ServiceUpdateFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ServiceForm({ service, onSubmit, onCancel, isSubmitting }: ServiceFormProps) {
  const { colors } = useTheme();
  const isEditing = !!service;

  const form = useForm<ServiceCreateFormData | ServiceUpdateFormData>({
    resolver: zodResolver(isEditing ? serviceUpdateSchema : serviceCreateSchema),
    mode: "onChange",
    defaultValues: isEditing
      ? {
          description: service.description,
        }
      : {
          description: "",
        },
  });

  const handleSubmit = form.handleSubmit(async (data: ServiceCreateFormData | ServiceUpdateFormData) => {
    await onSubmit(data);
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormCard title={isEditing ? "Editar Serviço" : "Cadastrar Serviço"}>
          <FormFieldGroup
            label="Descrição do Serviço"
            required
            helper="Esta descrição será exibida ao selecionar serviços para uma tarefa"
            error={form.formState.errors.description?.message}
          >
            <Controller
              control={form.control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Textarea
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Digite a descrição detalhada do serviço"
                  numberOfLines={4}
                  error={!!form.formState.errors.description}
                />
              )}
            />
          </FormFieldGroup>
        </FormCard>
      </ScrollView>

      <SimpleFormActionBar
        onCancel={onCancel}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canSubmit={form.formState.isValid}
        submitLabel={isEditing ? "Salvar" : "Criar"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0, // No spacing - action bar has its own margin
  },
});
