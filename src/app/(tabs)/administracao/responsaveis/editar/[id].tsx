import { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResponsible, useResponsibleMutations, useKeyboardAwareScroll, useScreenReady } from "@/hooks";
import { responsibleUpdateSchema } from "@/schemas/responsible";
import type { ResponsibleUpdateFormData } from "@/schemas/responsible";
import { ResponsibleRole, RESPONSIBLE_ROLE_LABELS } from "@/types/responsible";
import { Input, Combobox, ErrorScreen, Skeleton } from "@/components/ui";
import { FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { formSpacing } from "@/constants/form-styles";
import { Switch } from "@/components/ui/switch";
import { IconUser, IconLock, IconCheck } from "@tabler/icons-react-native";

const roleOptions = Object.values(ResponsibleRole).map((role) => ({
  value: role,
  label: RESPONSIBLE_ROLE_LABELS[role],
}));

export default function EditResponsibleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSystemAccess, setHasSystemAccess] = useState(false);

  const id = params?.id || "";

  const {
    data: existingData,
    isLoading: isLoadingData,
    error: loadError,
    refetch,
  } = useResponsible(id, {
    enabled: !!id && id !== "",
  });

  const rep = (existingData as any)?.data || existingData;

  useScreenReady(!isLoadingData);

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
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<ResponsibleUpdateFormData>({
    resolver: zodResolver(responsibleUpdateSchema),
    mode: "onChange",
  });

  const { updateAsync } = useResponsibleMutations();

  useEffect(() => {
    if (rep) {
      reset({
        name: rep.name || "",
        phone: rep.phone || "",
        email: rep.email || undefined,
        role: rep.role || ResponsibleRole.COMMERCIAL,
        isActive: rep.isActive ?? true,
      });
      setHasSystemAccess(!!rep.email);
    }
  }, [rep, reset]);

  const onSubmit = async (data: ResponsibleUpdateFormData) => {
    try {
      setIsSubmitting(true);

      if (!hasSystemAccess) {
        data.email = undefined;
        data.password = undefined;
      }

      await updateAsync({ id, data });
      Alert.alert("Sucesso", "Responsável atualizado com sucesso!");
      router.replace(routeToMobilePath(routes.administration.responsibles.details(id)) as any);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao atualizar responsável");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        "Descartar Alterações",
        "Você tem alterações não salvas. Deseja descartá-las?",
        [
          { text: "Continuar Editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => router.replace(routeToMobilePath(routes.administration.responsibles.details(id)) as any),
          },
        ],
      );
    } else {
      router.replace(routeToMobilePath(routes.administration.responsibles.details(id)) as any);
    }
  };

  if (isLoadingData) {
    const cardStyle = {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    };
    const fieldSkeleton = (i: number) => (
      <View key={i} style={{ marginBottom: spacing.sm }}>
        <Skeleton width="35%" height={13} style={{ marginBottom: spacing.xs }} borderRadius={4} />
        <Skeleton width="100%" height={44} borderRadius={borderRadius.md} />
      </View>
    );
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Informações Básicas: Nome, Telefone, Cliente (read-only), Função */}
          <View style={cardStyle}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width="45%" height={18} />
            </View>
            {[1, 2, 3, 4].map(fieldSkeleton)}
          </View>

          {/* Acesso ao Sistema: toggle switch + conditionally email + password */}
          <View style={cardStyle}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width="50%" height={18} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs }}>
              <Skeleton width="60%" height={16} />
              <Skeleton width={44} height={26} borderRadius={13} />
            </View>
          </View>

          {/* Status: Ativo switch */}
          <View style={cardStyle}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width="20%" height={18} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs }}>
              <Skeleton width="20%" height={16} />
              <Skeleton width={44} height={26} borderRadius={13} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loadError || !rep) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <ErrorScreen message="Erro ao carregar responsável" detail={loadError?.message || "Responsável não encontrado"} onRetry={refetch} />
      </SafeAreaView>
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
            <FormFieldGroup label="Nome" error={errors.name?.message}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Nome do responsável"
                    maxLength={100}
                    error={!!errors.name}
                    editable={!isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Telefone" error={errors.phone?.message}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
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

            {/* Company display (read-only in edit) */}
            {rep.company && (
              <FormFieldGroup label="Empresa">
                <Input
                  value={rep.company.fantasyName || ""}
                  editable={false}
                />
              </FormFieldGroup>
            )}

            <FormFieldGroup label="Função" error={errors.role?.message}>
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <Combobox
                    value={value || ""}
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
                <FormFieldGroup label="E-mail" error={errors.email?.message}>
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

                <FormFieldGroup label="Nova Senha" error={errors.password?.message}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value || ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Deixe em branco para manter a atual"
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
          canSubmit={isValid && isDirty}
          submitLabel="Salvar Alterações"
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
