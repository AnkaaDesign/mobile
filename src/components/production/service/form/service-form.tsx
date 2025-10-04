import React from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform , StyleSheet} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Service } from '../../../../types';
import { type ServiceCreateFormData, type ServiceUpdateFormData, serviceCreateSchema, serviceUpdateSchema } from '../../../../schemas';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Icon } from "@/components/ui/icon";

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

  const { errors } = form.formState;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.form}>
          {/* Service Description */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Icon name="file-description" size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.label}>
                Descrição do Serviço
                <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.destructive }])}> *</ThemedText>
              </ThemedText>
            </View>

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
                  error={!!errors.description}
                  editable={!isSubmitting}
                />
              )}
            />

            {errors.description && (
              <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>
                {errors.description.message}
              </ThemedText>
            )}

            <ThemedText style={StyleSheet.flatten([styles.helpText, { color: colors.mutedForeground }])}>
              Esta descrição será exibida ao selecionar serviços para uma tarefa
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>

      {/* Action Buttons */}
      <ThemedView style={StyleSheet.flatten([styles.actionContainer, { borderTopColor: colors.border }])}>
        <View style={styles.buttonRow}>
          {onCancel && (
            <Button
              variant="outline"
              onPress={onCancel}
              disabled={isSubmitting}
              style={styles.button}
            >
              <ThemedText>Cancelar</ThemedText>
            </Button>
          )}

          <Button
            onPress={handleSubmit}
            disabled={isSubmitting || !form.formState.isValid}
            style={StyleSheet.flatten([styles.button, styles.submitButton])}
          >
            <ThemedText style={{ color: "white" }}>
              {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </ThemedText>
          </Button>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  form: {
    flex: 1,
    padding: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: fontSize.sm * 1.4,
  },
  actionContainer: {
    borderTopWidth: 1,
    padding: spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: undefined, // Let the Button component handle the primary color
  },
});