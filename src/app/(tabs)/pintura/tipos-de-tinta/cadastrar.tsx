import { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Stack, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintTypeMutations } from "@/hooks/paintType";
import { useItems } from "@/hooks/useItem";
import { paintTypeCreateSchema } from '../../../../schemas';
import type { PaintTypeCreateFormData } from '../../../../schemas';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
// import { showToast } from "@/components/ui/toast";
import {
  IconTag,
  IconDroplet,
  IconBoxSeam,
} from "@tabler/icons-react-native";

export default function CreatePaintTypeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { create } = usePaintTypeMutations();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemSearch] = useState("");

  // Check user permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.BASIC);

  // Fetch component items
  const { data: itemsResponse, isLoading: isLoadingItems } = useItems({
    searchingFor: itemSearch,
    orderBy: { name: "asc" },
  });

  const componentItems = itemsResponse?.data?.map((item) => ({
    value: item.id,
    label: item.name,
  })) || [];

  // Form setup
  const form = useForm<PaintTypeCreateFormData>({
    resolver: zodResolver(paintTypeCreateSchema),
    defaultValues: {
      name: "",
      needGround: false,
      componentItemIds: [],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = form;

  const needGround = watch("needGround");

  // Handle form submission
  const onSubmit = async (data: PaintTypeCreateFormData) => {
    if (!canCreate) {
      Alert.alert("Acesso negado", "Você não tem permissão para criar");
      return;
    }

    if (!isValid) {
      Alert.alert("Erro", "Por favor, corrija os erros no formulário");
      return;
    }

    setIsSubmitting(true);

    try {
      await create(data);
      // API client already shows success alert
      router.back();
    } catch (_error) {
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  if (!canCreate) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Você não tem permissão para criar tipos de tinta
        </ThemedText>
        <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Novo Tipo de Tinta",
          headerBackTitle: "Cancelar",
          headerRight: () => (
            <Button
              size="sm"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          ),
        }}
      />
      <ScrollView
        style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <IconTag size={24} color={colors.primary} />
            <View style={styles.headerText}>
              <ThemedText style={styles.headerTitle}>Novo Tipo de Tinta</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Cadastre um novo tipo de tinta para categorizar e organizar o catálogo
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Basic Information */}
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <IconTag size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações Básicas</ThemedText>
            </View>
          </View>
          <View style={styles.content}>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>
                Nome <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="Ex: Poliéster, Acrílica, Poliuretano..."
                    error={!!errors.name}
                    errorMessage={errors.name?.message}
                  />
                )}
              />
            </View>
          </View>
        </Card>

        {/* Ground Configuration */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconDroplet size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Configuração de Fundo</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
              Define se este tipo de tinta requer aplicação de fundo
            </ThemedText>

            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <ThemedText style={styles.switchLabel}>Requer Fundo</ThemedText>
                <ThemedText style={[styles.switchDescription, { color: colors.mutedForeground }]}>
                  Tintas deste tipo exigirão seleção de fundos durante o cadastro
                </ThemedText>
              </View>
              <Controller
                control={control}
                name="needGround"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    checked={value}
                    onCheckedChange={onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </View>

            {needGround && (
              <View style={[styles.infoBox, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
                <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
                  ℹ️ Tintas deste tipo exigirão a seleção de fundos apropriados durante o cadastro.
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Component Items */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconBoxSeam size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Componentes</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
              Selecione os itens que podem ser usados como componentes em fórmulas deste tipo de tinta
            </ThemedText>

            <View style={styles.fieldContainer}>
              <Label>Itens de Componentes</Label>
              <Controller
                control={control}
                name="componentItemIds"
                render={({ field: { onChange, value } }) => (
                  <Combobox
                    mode="multiple"
                    options={componentItems}
                    value={Array.isArray(value) ? value : []}
                    onValueChange={onChange}
                    onCreate={() => {}}
                    placeholder="Selecione os componentes"
                    searchPlaceholder="Buscar itens..."
                    disabled={isSubmitting || isLoadingItems}
                    loading={isLoadingItems}
                  />
                )}
              />
              {errors.componentItemIds && (
                <ThemedText style={styles.errorText}>
                  {errors.componentItemIds.message}
                </ThemedText>
              )}
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.actionButton}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={styles.actionButton}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Criando..." : "Criar Tipo"}
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: {
    textAlign: "center",
    marginBottom: spacing.md,
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  headerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    lineHeight: 20,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  fieldContainer: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  required: {
    color: "#ef4444",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xxs,
  },
  switchDescription: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
