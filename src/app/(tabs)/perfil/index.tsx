import { useEffect, useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert, RefreshControl, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormActionBar } from "@/components/forms/FormActionBar";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { getProfile, updateProfile, uploadPhoto, deletePhoto } from "@/api-client/profile";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import type { User } from "@/types";
import { IconCamera, IconTrash } from "@tabler/icons-react-native";
import {
  SHIRT_SIZE_LABELS,
  PANTS_SIZE_LABELS,
  BOOT_SIZE_LABELS,
  GLOVES_SIZE_LABELS,
  MASK_SIZE_LABELS,
  SLEEVES_SIZE_LABELS,
  RAIN_BOOTS_SIZE_LABELS,
} from "@/constants";

// Profile update schema (subset of fields user can edit)
const profileUpdateSchema = z.object({
  email: z.string().email("Email inválido").nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  addressNumber: z.string().nullable().optional(),
  addressComplement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().max(2, "Estado deve ter 2 caracteres").nullable().optional(),
  zipCode: z.string().nullable().optional(),
});

type ProfileFormData = z.infer<typeof profileUpdateSchema>;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { refreshUserData } = useAuth();

  // Keyboard-aware scrolling (same pattern as customer form)
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<ProfileFormData | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      email: "",
      phone: "",
      address: "",
      addressNumber: "",
      addressComplement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getProfile();

      if (response.success && response.data) {
        setUser(response.data);

        const formValues: ProfileFormData = {
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          addressNumber: response.data.addressNumber || "",
          addressComplement: response.data.addressComplement || "",
          neighborhood: response.data.neighborhood || "",
          city: response.data.city || "",
          state: response.data.state || "",
          zipCode: response.data.zipCode || "",
        };

        form.reset(formValues);
        setOriginalValues(formValues);

        if (response.data.avatar) {
          setPhotoPreview(response.data.avatar.url || null);
        }
      }
    } catch (error: any) {
      // API client handles error alerts
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshUserData();
    await loadProfile();
    setIsRefreshing(false);
  }, [refreshUserData, loadProfile]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);
      const response = await updateProfile(data);

      if (response.success && response.data) {
        setUser(response.data);
        setOriginalValues(data);
        form.reset(data);
        await refreshUserData();
      }
    } catch (error: any) {
      // API client handles error alerts
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = useCallback(() => {
    if (originalValues) {
      form.reset(originalValues);
    }
  }, [form, originalValues]);

  const handlePhotoUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para selecionar uma foto.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset.uri) return;

      // Validate file size (5MB)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert("Aviso", "Arquivo muito grande. Tamanho máximo: 5MB");
        return;
      }

      setIsUploadingPhoto(true);
      setPhotoPreview(asset.uri);

      // Create file object for upload
      const fileName = asset.uri.split("/").pop() || "photo.jpg";
      const fileType = asset.mimeType || "image/jpeg";

      const file = {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      } as any;

      const response = await uploadPhoto(file, user?.name);

      if (response.success && response.data) {
        setUser(response.data);
        if (response.data.avatar) {
          setPhotoPreview(response.data.avatar.url || null);
        }
        await refreshUserData();
      }
    } catch (error: any) {
      // API client handles error alerts
      if (user?.avatar) {
        setPhotoPreview(user.avatar.url || null);
      } else {
        setPhotoPreview(null);
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja remover sua foto de perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setIsUploadingPhoto(true);
              const response = await deletePhoto();

              if (response.success && response.data) {
                setUser(response.data);
                setPhotoPreview(null);
                await refreshUserData();
              }
            } catch (error: any) {
              // API client handles error alerts
            } finally {
              setIsUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer, { backgroundColor: colors.background }]} edges={[]}>
        <ThemedText>Carregando...</ThemedText>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer, { backgroundColor: colors.background }]} edges={[]}>
        <ThemedText>Usuário não encontrado</ThemedText>
      </SafeAreaView>
    );
  }

  // Check if form has changes
  const hasChanges = form.formState.isDirty;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
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
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
        <KeyboardAwareFormProvider value={keyboardContextValue}>
        {/* Profile Photo Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.cardTitle}>Foto de Perfil</ThemedText>

          <View style={styles.photoSection}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              {photoPreview ? (
                <View style={styles.avatarImage}>
                  <ThemedText style={styles.avatarText}>
                    {/* Image would be displayed here with expo-image */}
                    {getInitials(user.name)}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.avatarText}>
                  {getInitials(user.name)}
                </ThemedText>
              )}
              {isUploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ThemedText style={styles.uploadingText}>...</ThemedText>
                </View>
              )}
            </View>

            <View style={styles.photoButtons}>
              <Button
                variant="outline"
                size="sm"
                onPress={handlePhotoUpload}
                disabled={isUploadingPhoto}
                style={styles.photoButton}
              >
                <IconCamera size={16} color={colors.foreground} />
                <ThemedText style={{ marginLeft: 8 }}>
                  {user.avatarId ? "Alterar" : "Adicionar"}
                </ThemedText>
              </Button>

              {user.avatarId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onPress={handleDeletePhoto}
                  disabled={isUploadingPhoto}
                  style={styles.photoButton}
                >
                  <IconTrash size={16} color="#fff" />
                  <ThemedText style={{ marginLeft: 8, color: "#fff" }}>Remover</ThemedText>
                </Button>
              )}
            </View>

            <ThemedText style={[styles.photoHint, { color: colors.mutedForeground }]}>
              Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)
            </ThemedText>
          </View>
        </Card>

        {/* Basic Information Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.cardTitle}>Informações Básicas</ThemedText>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Nome</ThemedText>
            <Input
              value={user.name}
              editable={false}
              disabled
            />
          </View>

          <Controller
            control={form.control}
            name="email"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>E-mail</ThemedText>
                <Input
                  fieldKey="email"
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Digite seu e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSaving}
                />
                {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
              </View>
            )}
          />

          <Controller
            control={form.control}
            name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Telefone</ThemedText>
                <Input
                  fieldKey="phone"
                  type="phone"
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isSaving}
                />
                {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
              </View>
            )}
          />

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Cargo</ThemedText>
            <Input
              value={user.position?.name || "Não definido"}
              editable={false}
              disabled
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Setor</ThemedText>
            <Input
              value={user.sector?.name || "Não definido"}
              editable={false}
              disabled
            />
          </View>
        </Card>

        {/* Measures Card (Read-only) */}
        {user.ppeSize && (
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.cardTitle}>Medidas</ThemedText>
            <ThemedText style={[styles.cardDescription, { color: colors.mutedForeground }]}>
              Suas medidas para EPIs (somente leitura)
            </ThemedText>

            <View style={styles.measuresGrid}>
              {user.ppeSize.shirts && (
                <View style={styles.measureItem}>
                  <ThemedText style={[styles.measureLabel, { color: colors.mutedForeground }]}>Camisa</ThemedText>
                  <ThemedText style={styles.measureValue}>{SHIRT_SIZE_LABELS[user.ppeSize.shirts as keyof typeof SHIRT_SIZE_LABELS] || user.ppeSize.shirts}</ThemedText>
                </View>
              )}
              {user.ppeSize.pants && (
                <View style={styles.measureItem}>
                  <ThemedText style={[styles.measureLabel, { color: colors.mutedForeground }]}>Calça</ThemedText>
                  <ThemedText style={styles.measureValue}>{PANTS_SIZE_LABELS[user.ppeSize.pants as keyof typeof PANTS_SIZE_LABELS] || user.ppeSize.pants}</ThemedText>
                </View>
              )}
              {user.ppeSize.boots && (
                <View style={styles.measureItem}>
                  <ThemedText style={[styles.measureLabel, { color: colors.mutedForeground }]}>Bota</ThemedText>
                  <ThemedText style={styles.measureValue}>{BOOT_SIZE_LABELS[user.ppeSize.boots as keyof typeof BOOT_SIZE_LABELS] || user.ppeSize.boots}</ThemedText>
                </View>
              )}
              {user.ppeSize.gloves && (
                <View style={styles.measureItem}>
                  <ThemedText style={[styles.measureLabel, { color: colors.mutedForeground }]}>Luvas</ThemedText>
                  <ThemedText style={styles.measureValue}>{GLOVES_SIZE_LABELS[user.ppeSize.gloves as keyof typeof GLOVES_SIZE_LABELS] || user.ppeSize.gloves}</ThemedText>
                </View>
              )}
              {user.ppeSize.mask && (
                <View style={styles.measureItem}>
                  <ThemedText style={[styles.measureLabel, { color: colors.mutedForeground }]}>Máscara</ThemedText>
                  <ThemedText style={styles.measureValue}>{MASK_SIZE_LABELS[user.ppeSize.mask as keyof typeof MASK_SIZE_LABELS] || user.ppeSize.mask}</ThemedText>
                </View>
              )}
              {user.ppeSize.sleeves && (
                <View style={styles.measureItem}>
                  <ThemedText style={[styles.measureLabel, { color: colors.mutedForeground }]}>Mangas</ThemedText>
                  <ThemedText style={styles.measureValue}>{SLEEVES_SIZE_LABELS[user.ppeSize.sleeves as keyof typeof SLEEVES_SIZE_LABELS] || user.ppeSize.sleeves}</ThemedText>
                </View>
              )}
              {user.ppeSize.rainBoots && (
                <View style={styles.measureItem}>
                  <ThemedText style={[styles.measureLabel, { color: colors.mutedForeground }]}>Galocha</ThemedText>
                  <ThemedText style={styles.measureValue}>{RAIN_BOOTS_SIZE_LABELS[user.ppeSize.rainBoots as keyof typeof RAIN_BOOTS_SIZE_LABELS] || user.ppeSize.rainBoots}</ThemedText>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Address Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.cardTitle}>Endereço</ThemedText>

          <View style={styles.addressRow}>
            <View style={styles.addressField}>
              <Controller
                control={form.control}
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Endereço</ThemedText>
                    <Input
                      fieldKey="address"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Rua, avenida..."
                      editable={!isSaving}
                    />
                  </View>
                )}
              />
            </View>
            <View style={styles.addressNumberField}>
              <Controller
                control={form.control}
                name="addressNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Nº</ThemedText>
                    <Input
                      fieldKey="addressNumber"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Nº"
                      editable={!isSaving}
                    />
                  </View>
                )}
              />
            </View>
          </View>

          <Controller
            control={form.control}
            name="addressComplement"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Complemento</ThemedText>
                <Input
                  fieldKey="addressComplement"
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Apto, bloco..."
                  editable={!isSaving}
                />
              </View>
            )}
          />

          <View style={styles.addressRow}>
            <View style={styles.halfField}>
              <Controller
                control={form.control}
                name="neighborhood"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Bairro</ThemedText>
                    <Input
                      fieldKey="neighborhood"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Bairro"
                      editable={!isSaving}
                    />
                  </View>
                )}
              />
            </View>
            <View style={styles.halfField}>
              <Controller
                control={form.control}
                name="zipCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>CEP</ThemedText>
                    <Input
                      fieldKey="zipCode"
                      type="cep"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      editable={!isSaving}
                      showCepLoading
                      onCepLookup={(data) => {
                        if (data.logradouro) form.setValue("address", data.logradouro);
                        if (data.bairro) form.setValue("neighborhood", data.bairro);
                        if (data.localidade) form.setValue("city", data.localidade);
                        if (data.uf) form.setValue("state", data.uf);
                      }}
                    />
                  </View>
                )}
              />
            </View>
          </View>

          <View style={styles.addressRow}>
            <View style={styles.halfField}>
              <Controller
                control={form.control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Cidade</ThemedText>
                    <Input
                      fieldKey="city"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Cidade"
                      editable={!isSaving}
                    />
                  </View>
                )}
              />
            </View>
            <View style={styles.stateField}>
              <Controller
                control={form.control}
                name="state"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>UF</ThemedText>
                    <Input
                      fieldKey="state"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="UF"
                      maxLength={2}
                      autoCapitalize="characters"
                      editable={!isSaving}
                    />
                  </View>
                )}
              />
            </View>
          </View>
        </Card>
        </KeyboardAwareFormProvider>
        </ScrollView>

        {/* Action Bar - Only show when form has changes */}
        {hasChanges && (
          <FormActionBar
            onCancel={handleRestore}
            onSave={form.handleSubmit(onSubmit)}
            isSubmitting={isSaving}
            canSubmit={hasChanges}
            cancelLabel="Restaurar"
            submitLabel="Salvar"
            submittingLabel="Salvando..."
            showCancel={true}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 0,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  photoSection: {
    alignItems: "center",
    gap: spacing.md,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    color: "#fff",
    fontSize: 24,
  },
  photoButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  photoHint: {
    fontSize: 12,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: spacing.xs,
  },
  measuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  measureItem: {
    width: "45%",
  },
  measureLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  measureValue: {
    fontSize: 16,
  },
  addressRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  addressField: {
    flex: 2,
  },
  addressNumberField: {
    flex: 1,
  },
  halfField: {
    flex: 1,
  },
  stateField: {
    width: 80,
  },
});
