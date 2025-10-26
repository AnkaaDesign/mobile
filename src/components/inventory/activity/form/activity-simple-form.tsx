import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { IconArrowDown, IconArrowUp, IconDeviceFloppy, IconX, IconLoader } from "@tabler/icons-react-native";
import {
  ThemedView,
  ThemedText,
  Card,
  Input,
  Select,
  SelectItem,
  Button,
  SimpleFormField,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useItems, useUsers } from "@/hooks";
import { ACTIVITY_OPERATION, ACTIVITY_REASON, ACTIVITY_REASON_LABELS } from "@/constants";

// Simple Activity Form Schema
const activitySimpleSchema = z.object({
  operation: z.enum([ACTIVITY_OPERATION.INBOUND, ACTIVITY_OPERATION.OUTBOUND]),
  itemId: z.string().uuid("Item é obrigatório").min(1, "Item é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva").int("Quantidade deve ser um número inteiro"),
  userId: z.string().uuid().nullable().optional(),
  reason: z.string().nullable().optional(),
});

type ActivitySimpleFormData = z.infer<typeof activitySimpleSchema>;

interface ActivitySimpleFormProps {
  onSubmit: (data: ActivitySimpleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ActivitySimpleForm({ onSubmit, onCancel, isSubmitting }: ActivitySimpleFormProps) {
  const { colors } = useTheme();
  const [itemSearch, setItemSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const form = useForm<ActivitySimpleFormData>({
    resolver: zodResolver(activitySimpleSchema),
    defaultValues: {
      operation: ACTIVITY_OPERATION.INBOUND,
      itemId: "",
      quantity: 1,
      userId: null,
      reason: null,
    },
    mode: "onChange",
  });

  // Fetch items
  const { data: items, isLoading: isLoadingItems } = useItems({
    searchingFor: itemSearch,
    orderBy: { name: "asc" },
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    searchingFor: userSearch,
    orderBy: { username: "asc" },
  });

  const itemOptions = items?.data?.map((item) => ({
    value: item.id,
    label: item.name,
  })) || [];

  const userOptions = users?.data?.map((user) => ({
    value: user.id,
    label: user.name,
  })) || [];

  const reasonOptions = Object.values(ACTIVITY_REASON).map((reason) => ({
    value: reason,
    label: ACTIVITY_REASON_LABELS[reason],
  }));

  const operation = form.watch("operation");

  const handleSubmit = async (data: ActivitySimpleFormData) => {
    await onSubmit(data);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <ThemedText style={styles.title}>Nova Movimentação</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Registrar entrada ou saída de item
            </ThemedText>
          </View>

          {/* Operation Type */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <ThemedText style={styles.sectionLabel}>Tipo de Operação *</ThemedText>

              <View style={styles.operationButtons}>
                <Button
                  variant={operation === ACTIVITY_OPERATION.INBOUND ? "default" : "outline"}
                  onPress={() => form.setValue("operation", ACTIVITY_OPERATION.INBOUND)}
                  disabled={isSubmitting}
                  style={styles.operationButton}
                >
                  <IconArrowDown size={20} color={operation === ACTIVITY_OPERATION.INBOUND ? "white" : colors.foreground} />
                  <ThemedText style={{ color: operation === ACTIVITY_OPERATION.INBOUND ? "white" : colors.foreground }}>
                    Entrada
                  </ThemedText>
                </Button>

                <Button
                  variant={operation === ACTIVITY_OPERATION.OUTBOUND ? "default" : "outline"}
                  onPress={() => form.setValue("operation", ACTIVITY_OPERATION.OUTBOUND)}
                  disabled={isSubmitting}
                  style={styles.operationButton}
                >
                  <IconArrowUp size={20} color={operation === ACTIVITY_OPERATION.OUTBOUND ? "white" : colors.foreground} />
                  <ThemedText style={{ color: operation === ACTIVITY_OPERATION.OUTBOUND ? "white" : colors.foreground }}>
                    Saída
                  </ThemedText>
                </Button>
              </View>
            </View>
          </Card>

          {/* Item and Quantity */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <SimpleFormField label="Item" required error={form.formState.errors.itemId}>
                <Controller
                  control={form.control}
                  name="itemId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value}
                      onValueChange={onChange}
                      disabled={isSubmitting}
                    >
                      <SelectItem label="Selecione um item" value="" />
                      {itemOptions.map((option) => (
                        <SelectItem key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Select>
                  )}
                />
              </SimpleFormField>

              <SimpleFormField label="Quantidade" required error={form.formState.errors.quantity}>
                <Controller
                  control={form.control}
                  name="quantity"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                        onChange(isNaN(num) ? 1 : num);
                      }}
                      placeholder="1"
                      keyboardType="numeric"
                      editable={!isSubmitting}
                      error={!!form.formState.errors.quantity}
                    />
                  )}
                />
              </SimpleFormField>
            </View>
          </Card>

          {/* Optional Fields */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <SimpleFormField label="Motivo (opcional)" error={form.formState.errors.reason}>
                <Controller
                  control={form.control}
                  name="reason"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      disabled={isSubmitting}
                    >
                      <SelectItem label="Selecione um motivo" value="" />
                      {reasonOptions.map((option) => (
                        <SelectItem key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Select>
                  )}
                />
              </SimpleFormField>

              <SimpleFormField label="Responsável (opcional)" error={form.formState.errors.userId}>
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      disabled={isSubmitting}
                    >
                      <SelectItem label="Selecione um usuário" value="" />
                      {userOptions.map((option) => (
                        <SelectItem key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Select>
                  )}
                />
              </SimpleFormField>
            </View>
          </Card>

          {/* Spacer for fixed bottom bar */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Button
          variant="outline"
          onPress={onCancel}
          disabled={isSubmitting}
          style={styles.actionButton}
        >
          <IconX size={20} />
          <ThemedText>Cancelar</ThemedText>
        </Button>

        <Button
          variant="default"
          onPress={form.handleSubmit(handleSubmit)}
          disabled={!form.formState.isValid || isSubmitting}
          style={styles.actionButton}
        >
          {isSubmitting ? (
            <>
              <IconLoader size={20} color="white" />
              <ThemedText style={{ color: "white" }}>Salvando...</ThemedText>
            </>
          ) : (
            <>
              <IconDeviceFloppy size={20} />
              <ThemedText style={{ color: "white" }}>Registrar</ThemedText>
            </>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
  },
  headerSection: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  operationButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  operationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
