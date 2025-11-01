import { useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { IconCamera, IconX, IconUpload } from "@tabler/icons-react-native";
import { ThemedText, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme";

interface LogoUploadProps {
  value?: File | null;
  existingLogoUrl?: string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export function LogoUpload({ existingLogoUrl, onChange, disabled }: LogoUploadProps) {
  const { colors } = useTheme();
  const [previewUri, setPreviewUri] = useState<string | null>(existingLogoUrl || null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão Necessária", "Precisamos de permissão para acessar suas fotos.");
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (disabled) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Create a File object from the selected image
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const file = new File([blob], asset.fileName || "logo.jpg", {
          type: asset.mimeType || "image/jpeg",
        });

        onChange(file);
        setPreviewUri(asset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem. Tente novamente.");
    }
  };

  const takePhoto = async () => {
    if (disabled) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão Necessária", "Precisamos de permissão para usar a câmera.");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Create a File object from the photo
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const file = new File([blob], asset.fileName || "logo.jpg", {
          type: asset.mimeType || "image/jpeg",
        });

        onChange(file);
        setPreviewUri(asset.uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Erro", "Não foi possível tirar a foto. Tente novamente.");
    }
  };

  const removeLogo = () => {
    if (disabled) return;

    onChange(null);
    setPreviewUri(null);
  };

  const showOptions = () => {
    Alert.alert("Adicionar Logo", "Escolha uma opção:", [
      { text: "Tirar Foto", onPress: takePhoto },
      { text: "Escolher da Galeria", onPress: pickImage },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      {previewUri ? (
        <View style={styles.previewContainer}>
          <View style={[styles.imageContainer, { borderColor: colors.border }]}>
            <Image source={{ uri: previewUri }} style={styles.image} resizeMode="cover" />
            {!disabled && (
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.destructive }]}
                onPress={removeLogo}
              >
                <IconX size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          {!disabled && (
            <Button variant="outline" onPress={showOptions} style={styles.changeButton}>
              <IconCamera size={16} />
              <ThemedText>Trocar Logo</ThemedText>
            </Button>
          )}
        </View>
      ) : (
        <View style={styles.uploadContainer}>
          <View style={[styles.uploadBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <IconUpload size={32} color={colors.mutedForeground} />
            <ThemedText style={[styles.uploadText, { color: colors.mutedForeground }]}>
              Nenhum logo selecionado
            </ThemedText>
          </View>
          {!disabled && (
            <View style={styles.buttonContainer}>
              <Button variant="outline" onPress={takePhoto} style={styles.actionButton}>
                <IconCamera size={16} />
                <ThemedText>Tirar Foto</ThemedText>
              </Button>
              <Button variant="default" onPress={pickImage} style={styles.actionButton}>
                <IconUpload size={16} />
                <ThemedText style={{ color: "white" }}>Escolher da Galeria</ThemedText>
              </Button>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  previewContainer: {
    gap: 12,
    alignItems: "center",
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploadContainer: {
    gap: 12,
  },
  uploadBox: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  uploadText: {
    fontSize: 14,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
