import React from "react";
import { View, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Button } from "./button";
import { Icon } from "./icon";
import { ThemedText } from "./themed-text";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

export interface MediaResult {
  uri: string;
  name: string;
  type: string;
  size?: number;
  mimeType: string;
}

export interface DualMediaPickerProps {
  onSelect: (result: MediaResult) => void;
  disabled?: boolean;
  imageLabel?: string;
  fileLabel?: string;
  multiple?: boolean;
  acceptedFileTypes?: string[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showLabels?: boolean;
  direction?: "horizontal" | "vertical";
}

export function DualMediaPicker({
  onSelect,
  disabled = false,
  imageLabel = "Imagem",
  fileLabel = "Arquivo",
  multiple = false,
  acceptedFileTypes = ["*/*"],
  variant = "outline",
  size = "default",
  showLabels = true,
  direction = "horizontal",
}: DualMediaPickerProps) {
  const { colors } = useTheme();

  const handleImagePick = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos de permissão para acessar suas fotos.",
          [{ text: "OK" }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: multiple,
        quality: 0.8,
        allowsEditing: !multiple,
        aspect: undefined,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Process each selected image
        result.assets.forEach((asset) => {
          const fileName = asset.fileName || `image_${Date.now()}.jpg`;
          const mimeType = asset.mimeType || "image/jpeg";

          onSelect({
            uri: asset.uri,
            name: fileName,
            type: mimeType,
            size: asset.fileSize,
            mimeType: mimeType,
          });
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem");
    }
  };

  const handleCameraPick = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos de permissão para acessar sua câmera.",
          [{ text: "OK" }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: undefined,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || "image/jpeg";

        onSelect({
          uri: asset.uri,
          name: fileName,
          type: mimeType,
          size: asset.fileSize,
          mimeType: mimeType,
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Erro", "Não foi possível tirar a foto");
    }
  };

  const handleImagePickerOptions = () => {
    Alert.alert(
      "Selecionar Imagem",
      "Escolha uma opção:",
      [
        {
          text: "Tirar Foto",
          onPress: handleCameraPick,
        },
        {
          text: "Escolher da Galeria",
          onPress: handleImagePick,
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedFileTypes,
        multiple: multiple,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Process each selected file
        result.assets.forEach((asset) => {
          onSelect({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || "application/octet-stream",
            size: asset.size,
            mimeType: asset.mimeType || "application/octet-stream",
          });
        });
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Erro", "Não foi possível selecionar o arquivo");
    }
  };

  const containerStyle = direction === "horizontal"
    ? styles.containerHorizontal
    : styles.containerVertical;

  return (
    <View style={containerStyle}>
      {/* Image Picker Button */}
      <Button
        variant={variant}
        size={size}
        onPress={handleImagePickerOptions}
        disabled={disabled}
        style={styles.button}
      >
        <Icon name="photo" size={20} color={colors.foreground} />
        {showLabels && <ThemedText>{imageLabel}</ThemedText>}
      </Button>

      {/* File Picker Button */}
      <Button
        variant={variant}
        size={size}
        onPress={handleFilePick}
        disabled={disabled}
        style={styles.button}
      >
        <Icon name="file" size={20} color={colors.foreground} />
        {showLabels && <ThemedText>{fileLabel}</ThemedText>}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  containerHorizontal: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  containerVertical: {
    flexDirection: "column",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});
