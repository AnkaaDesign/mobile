import { useState, useMemo } from "react";
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRepresentativeMutations, useKeyboardAwareScroll, useScreenReady } from "@/hooks";
import { getCustomers } from "@/api-client";
import { representativeCreateSchema } from "@/schemas/representative";
import type { RepresentativeCreateFormData } from "@/schemas/representative";
import { RepresentativeRole, REPRESENTATIVE_ROLE_LABELS } from "@/types/representative";
import { Input, Combobox } from "@/components/ui";
import { FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing, fontSize } from "@/constants/design-system";
import { formSpacing } from "@/constants/form-styles";
import { Switch } from "@/components/ui/switch";
import { IconUser, IconLock, IconCheck } from "@tabler/icons-react-native";

const roleOptions = Object.values(RepresentativeRole).map((role) => ({
  value: role,
  label: REPRESENTATIVE_ROLE_LABELS[role],
}));

export default function CreateRepresentativeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSystemAccess, setHasSystemAccess] = useState(false);

  useScreenReady();

  const { handlers, refs } = useKeyboardAwareScroll();

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RepresentativeCreateFormData>({
    resolver: zodResolver(representativeCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: undefined,
      password: undefined,
      customerId: "",
      role: RepresentativeRole.COMMERCIAL,
      isActive: true,
    },
  });

  const { createAsync } = useRepresentativeMutations();

  const onSubmit = async (data: RepresentativeCreateFormData) => {
    try {
      setIsSubmitting(true);

      if (!hasSystemAccess) {
        data.email = undefined;
        data.password = undefined;
      }

      const result = await createAsync(data);
      Alert.alert("Sucesso", "Representante cadastrado com sucesso!");
      const resultId = (result as any)?.data?.id || (result as any)?.id;
      if (resultId) {
        router.replace(routeToMobilePath(routes.administration.representatives.details(resultId)) as any);
      } else {
        router.replace(routeToMobilePath(routes.administration.representatives.list) as any);
      }
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao cadastrar representante");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Descartar Cadastro",
      "Deseja descartar o cadastro do representante?",
      [
        { text: "Continuar Editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(routeToMobilePath(routes.administration.representatives.list) as any);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={refs.scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
        <KeyboardAwareFormProvider value={keyboardContextValue}>
        {/* Basic Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconUser size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações Básicas</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <FormFieldGroup label="Nome" required error={errors.name?.message}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Nome do representante"
                    maxLength={100}
                    error={!!errors.name}
                    editable={!isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Telefone" required error={errors.phone?.message}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="(00) 00000-0000"
                    keyboardType="phone-pad"
                    error={!!errors.phone}
                    editable={!isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Cliente" required error={errors.customerId?.message}>
              <Controller
                control={control}
                name="customerId"
                render={({ field: { onChange, value } }) => (
                  <Combobox
                    value={value || ""}
                    onValueChange={(v) => onChange(v?.toString() || "")}
                    async
                    queryKey={["customers-search"]}
                    queryFn={async (searchTerm: string) => {
                      const response = await getCustomers({
                        search: searchTerm,
                        limit: 20,
                      } as any);
                      return {
                        data: (response.data || []).map((c: any) => ({
                          value: c.id,
                          label: c.fantasyName || c.corporateName || c.id,
                        })),
                        hasMore: false,
                      };
                    }}
                    minSearchLength={0}
                    placeholder="Buscar cliente..."
                    searchPlaceholder="Digite o nome do cliente..."
                    emptyText="Nenhum cliente encontrado"
                    searchable
                    clearable
                    disabled={isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Função" required error={errors.role?.message}>
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <Combobox
                    value={value}
                    onValueChange={(v) => onChange(v?.toString() || "")}
                    options={roleOptions}
                    placeholder="Selecione a função"
                    searchable={false}
                    disabled={isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>
          </View>
        </Card>

        {/* System Access */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconLock size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Acesso ao Sistema</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.switchRow}>
              <ThemedText style={styles.switchLabel}>Habilitar acesso ao sistema</ThemedText>
              <Switch
                value={hasSystemAccess}
                onValueChange={setHasSystemAccess}
              />
            </View>

            {hasSystemAccess && (
              <>
                <FormFieldGroup label="E-mail" required error={errors.email?.message}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value || ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="email@exemplo.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        maxLength={100}
                        error={!!errors.email}
                        editable={!isSubmitting}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="Senha" required error={errors.password?.message}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value || ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Mínimo 6 caracteres"
                        secureTextEntry
                        error={!!errors.password}
                        editable={!isSubmitting}
                      />
                    )}
                  />
                </FormFieldGroup>
              </>
            )}
          </View>
        </Card>

        {/* Status */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCheck size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Status</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <Controller
              control={control}
              name="isActive"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <ThemedText style={styles.switchLabel}>Ativo</ThemedText>
                  <Switch
                    value={value ?? true}
                    onValueChange={onChange}
                  />
                </View>
              )}
            />
          </View>
        </Card>
        </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          canSubmit={isValid}
          submitLabel="Criar"
        />
      </KeyboardAvoidingView>
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
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0,
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  switchLabel: {
    fontSize: fontSize.base,
  },
});
