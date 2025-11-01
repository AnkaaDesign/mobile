import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { IconPackage, IconX, IconLoader } from "@tabler/icons-react-native";
import {
  ThemedText,
  Card,
  Input,
  Select,
  SelectItem,
  Button,
  SimpleFormField,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useItems, useUsers } from "@/hooks";

// Simple Borrow Form Schema - matches backend API structure
const borrowSimpleSchema = z.object({
  userId: z.string().uuid("Colaborador é obrigatório").min(1, "Colaborador é obrigatório"),
  itemId: z.string().uuid("Item é obrigatório").min(1, "Item é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva").int("Quantidade deve ser um número inteiro"),
  returnedAt: z.date().nullable().optional(),
});

type BorrowSimpleFormData = z.infer<typeof borrowSimpleSchema>;

interface BorrowSimpleFormProps {
  onSubmit: (data: BorrowSimpleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BorrowSimpleForm({ onSubmit, onCancel, isSubmitting }: BorrowSimpleFormProps) {
  const { colors } = useTheme();
  const [itemSearch] = useState("");
  const [userSearch] = useState("");

  const form = useForm<BorrowSimpleFormData>({
    resolver: zodResolver(borrowSimpleSchema),
    defaultValues: {
      userId: "",
      itemId: "",
      quantity: 1,
      returnedAt: null,
    },
    mode: "onChange",
  });

  // Fetch items
  const { data: items } = useItems({
    searchingFor: itemSearch,
    orderBy: { name: "asc" },
  });

  // Fetch users (employees)
  const { data: users } = useUsers({
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

  const handleSubmit = async (data: BorrowSimpleFormData) => {
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
            <ThemedText style={styles.title}>Novo Empréstimo</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Registrar empréstimo de item para colaborador
            </ThemedText>
          </View>

          {/* Main Form */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <SimpleFormField label="Colaborador" required error={form.formState.errors.userId}>
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value}
                      onValueChange={onChange}
                      disabled={isSubmitting}
                    >
                      <SelectItem label="Selecione um colaborador" value="" />
                      {userOptions.map((option) => (
                        <SelectItem key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Select>
                  )}
                />
              </SimpleFormField>

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
              <IconPackage size={20} />
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
