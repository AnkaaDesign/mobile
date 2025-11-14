
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconX, IconDeviceFloppy, IconClipboardList } from "@tabler/icons-react-native";
import { type Service } from '../../../../types';
import { serviceCreateSchema, serviceUpdateSchema } from '../../../../schemas';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { SimpleFormField } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight} from "@/constants/design-system";
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
    <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Service Header Card */}
            <Card style={styles.headerCard}>
              <View style={styles.headerContent}>
                <View style={[styles.headerLeft, { flex: 1 }]}>
                  <IconClipboardList size={24} color={colors.primary} />
                  <ThemedText style={StyleSheet.flatten([styles.serviceName, { color: colors.foreground }])}>
                    {isEditing ? "Editar Serviço" : "Cadastrar Serviço"}
                  </ThemedText>
                </View>
                <View style={styles.headerActions}>
                  {/* Empty placeholder to match detail page structure */}
                </View>
              </View>
            </Card>

            {/* Service Information */}
            <Card style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Informações do Serviço</ThemedText>

              <SimpleFormField label="Descrição do Serviço" required error={errors.description}>
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
                    />
                  )}
                />
              </SimpleFormField>

              <ThemedText style={StyleSheet.flatten([styles.helpText, { color: colors.mutedForeground }])}>
                Esta descrição será exibida ao selecionar serviços para uma tarefa
              </ThemedText>
            </Card>

            {/* Bottom spacing */}
            <View style={{ height: spacing.md }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.card }}>
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: spacing.xl,
            },
          ]}
        >
          {onCancel && (
            <Button
              variant="outline"
              onPress={onCancel}
              disabled={isSubmitting}
              style={{ flex: 1, minHeight: 40 }}
            >
              <>
                <IconX size={20} color={colors.foreground} />
                <ThemedText style={{ color: colors.foreground, marginLeft: 8 }}>Cancelar</ThemedText>
              </>
            </Button>
          )}

          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={isSubmitting || !form.formState.isValid}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconDeviceFloppy size={20} color={colors.primaryForeground} />
              <ThemedText style={{ color: colors.primaryForeground, marginLeft: 8 }}>
                {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Serviço" : "Salvar Serviço"}
              </ThemedText>
            </>
          </Button>
        </View>
      </SafeAreaView>
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
  serviceName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 36,
  },
  card: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  helpText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: fontSize.sm * 1.4,
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
});