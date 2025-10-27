import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { getProfile, updateProfile, uploadPhoto, deletePhoto } from "@/api-client";
import type { User } from "@/types";
import type { UserUpdateFormData } from "@/schemas";
import { userUpdateSchema } from "@/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Loading } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { IconCamera, IconTrash, IconUser, IconMail, IconPhone, IconMapPin, IconDeviceFloppy, IconRefresh } from "@tabler/icons-react-native";
import * as ImagePicker from "expo-image-picker";
import { useToast } from "@/hooks/use-toast";

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();
  const { show } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getProfile();

      if (response.success && response.data) {
        setUser(response.data);
        reset({
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          addressNumber: response.data.addressNumber || "",
          addressComplement: response.data.addressComplement || "",
          neighborhood: response.data.neighborhood || "",
          city: response.data.city || "",
          state: response.data.state || "",
          zipCode: response.data.zipCode || "",
        });

        if (response.data.avatar?.url) {
          setPhotoUri(response.data.avatar.url);
        }
      }
    } catch (error: any) {
      show({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao carregar perfil",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshUser();
      await loadProfile();
      show({
        title: "Sucesso",
        description: "Dados atualizados com sucesso!",
        type: "success",
      });
    } catch (error: any) {
      show({
        title: "Erro",
        description: "Erro ao atualizar dados",
        type: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const onSubmit = async (data: UserUpdateFormData) => {
    try {
      setIsSaving(true);
      const response = await updateProfile(data);

      if (response.success) {
        show({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!",
          type: "success",
        });
        setUser(response.data);
      }
    } catch (error: any) {
      show({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao atualizar perfil",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permissão negada", "Você precisa permitir acesso às fotos para alterar sua foto de perfil.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handlePhotoUpload(result.assets[0].uri);
    }
  };

  const handlePhotoUpload = async (uri: string) => {
    try {
      setIsUploadingPhoto(true);
      setPhotoUri(uri);

      // Create FormData
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await uploadPhoto(formData, user?.name);

      if (response.success) {
        show({
          title: "Sucesso",
          description: "Foto atualizada com sucesso!",
          type: "success",
        });
        setUser(response.data);
        if (response.data.avatar?.url) {
          setPhotoUri(response.data.avatar.url);
        }
      }
    } catch (error: any) {
      show({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao fazer upload da foto",
        type: "error",
      });
      if (user?.avatar?.url) {
        setPhotoUri(user.avatar.url);
      } else {
        setPhotoUri(null);
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
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

              if (response.success) {
                show({
                  title: "Sucesso",
                  description: "Foto removida com sucesso!",
                  type: "success",
                });
                setUser(response.data);
                setPhotoUri(null);
              }
            } catch (error: any) {
              show({
                title: "Erro",
                description: error?.response?.data?.message || "Erro ao remover foto",
                type: "error",
              });
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
    return <Loading />;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <PageHeader title="Meu Perfil" showBack />
        <View style={styles.centerContent}>
          <Text>Usuário não encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Meu Perfil"
        showBack
        actions={[
          {
            icon: IconRefresh,
            onPress: handleRefresh,
            disabled: isRefreshing,
          },
          {
            icon: IconDeviceFloppy,
            onPress: handleSubmit(onSubmit),
            disabled: isSaving || !isDirty,
          },
        ]}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Photo Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Foto de Perfil</Text>
          <View style={styles.photoContainer}>
            <View style={styles.avatarContainer}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
                </View>
              )}
              {isUploadingPhoto && (
                <View style={styles.avatarLoading}>
                  <Loading size="small" />
                </View>
              )}
            </View>

            <View style={styles.photoButtons}>
              <Button
                onPress={handlePickImage}
                disabled={isUploadingPhoto}
                variant="outline"
                style={styles.photoButton}
              >
                <IconCamera size={16} />
                <Text>{user.avatarId ? "Alterar Foto" : "Adicionar Foto"}</Text>
              </Button>

              {user.avatarId && (
                <Button
                  onPress={handleDeletePhoto}
                  disabled={isUploadingPhoto}
                  variant="destructive"
                  style={styles.photoButton}
                >
                  <IconTrash size={16} />
                  <Text>Remover Foto</Text>
                </Button>
              )}
            </View>

            <Text style={styles.photoHelp}>
              Formatos aceitos: JPG, PNG, GIF, WEBP{"\n"}
              Tamanho máximo: 5MB
            </Text>
          </View>
        </Card>

        {/* Basic Information Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Informações Básicas</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cargo</Text>
            <Text style={styles.infoValue}>{user.position?.name || "Não definido"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Setor</Text>
            <Text style={styles.infoValue}>{user.sector?.name || "Não definido"}</Text>
          </View>
        </Card>

        {/* Contact Information Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Informações de Contato</Text>
          <Input
            control={control}
            name="email"
            label="E-mail"
            placeholder="Digite seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={isSaving}
            error={errors.email?.message}
            leftIcon={IconMail}
          />
          <Input
            control={control}
            name="phone"
            label="Telefone"
            placeholder="Digite seu telefone"
            keyboardType="phone-pad"
            disabled={isSaving}
            error={errors.phone?.message}
            leftIcon={IconPhone}
          />
        </Card>

        {/* Address Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Endereço</Text>
          <View style={styles.addressRow}>
            <View style={styles.addressField}>
              <Input
                control={control}
                name="address"
                label="Endereço"
                placeholder="Rua, avenida..."
                disabled={isSaving}
                error={errors.address?.message}
                leftIcon={IconMapPin}
              />
            </View>
            <View style={styles.addressNumberField}>
              <Input
                control={control}
                name="addressNumber"
                label="Número"
                placeholder="Nº"
                disabled={isSaving}
                error={errors.addressNumber?.message}
              />
            </View>
          </View>
          <Input
            control={control}
            name="addressComplement"
            label="Complemento"
            placeholder="Apto, bloco..."
            disabled={isSaving}
            error={errors.addressComplement?.message}
          />
          <View style={styles.addressRow}>
            <View style={styles.addressField}>
              <Input
                control={control}
                name="neighborhood"
                label="Bairro"
                placeholder="Digite o bairro"
                disabled={isSaving}
                error={errors.neighborhood?.message}
              />
            </View>
            <View style={styles.addressNumberField}>
              <Input
                control={control}
                name="zipCode"
                label="CEP"
                placeholder="00000-000"
                disabled={isSaving}
                error={errors.zipCode?.message}
              />
            </View>
          </View>
          <View style={styles.addressRow}>
            <View style={styles.addressField}>
              <Input
                control={control}
                name="city"
                label="Cidade"
                placeholder="Digite a cidade"
                disabled={isSaving}
                error={errors.city?.message}
              />
            </View>
            <View style={styles.addressNumberField}>
              <Input
                control={control}
                name="state"
                label="Estado"
                placeholder="UF"
                disabled={isSaving}
                error={errors.state?.message}
                maxLength={2}
              />
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  avatarPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: "600",
    color: "#666",
  },
  avatarLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  photoButtons: {
    width: "100%",
    gap: 8,
    marginBottom: 16,
  },
  photoButton: {
    width: "100%",
  },
  photoHelp: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#666",
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
  },
  addressField: {
    flex: 2,
  },
  addressNumberField: {
    flex: 1,
  },
});
