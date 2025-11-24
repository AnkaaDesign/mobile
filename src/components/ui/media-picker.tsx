import { View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ThemedText } from "./themed-text";
import { IconCamera, IconPhoto, IconFile } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, fontWeight } from "@/constants/design-system";

export interface MediaPickerResult {
  uri: string;
  name: string;
  type: string;
  size?: number;
  mimeType: string;
}

export interface MediaPickerProps {
  /** Callback when a file is selected */
  onSelect: (result: MediaPickerResult) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Secondary helper text */
  helperText?: string;
  /** Show camera option */
  showCamera?: boolean;
  /** Show gallery option */
  showGallery?: boolean;
  /** Show file picker option */
  showFilePicker?: boolean;
  /** Allow multiple selection (for gallery and files) */
  multiple?: boolean;
  /** Accepted file types for document picker */
  acceptedFileTypes?: string[];
  /** Custom style for the container */
  style?: object;
}

export function MediaPicker({
  onSelect,
  disabled = false,
  placeholder = "Toque para adicionar arquivo",
  helperText,
  showCamera = true,
  showGallery = true,
  showFilePicker = true,
  multiple = false,
  acceptedFileTypes = ["*/*"],
  style,
}: MediaPickerProps) {
  const { colors } = useTheme();

  const handleCameraPick = async () => {
    if (disabled) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos de permissão para acessar sua câmera.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onSelect({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
          size: asset.fileSize,
          mimeType: asset.mimeType || "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Erro", "Não foi possível tirar a foto");
    }
  };

  const handleGalleryPick = async () => {
    if (disabled) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos de permissão para acessar suas fotos.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: multiple,
        quality: 0.8,
        allowsEditing: !multiple,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        result.assets.forEach((asset) => {
          onSelect({
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.mimeType || "image/jpeg",
            size: asset.fileSize,
            mimeType: asset.mimeType || "image/jpeg",
          });
        });
      }
    } catch (error) {
      console.error("Error picking from gallery:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem");
    }
  };

  const handleFilePick = async () => {
    if (disabled) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedFileTypes,
        multiple: multiple,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
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

  const handleCardPress = () => {
    if (disabled) return;

    const options: { text: string; onPress: () => void; style?: "cancel" | "default" | "destructive" }[] = [];

    if (showCamera) {
      options.push({
        text: "Tirar Foto",
        onPress: handleCameraPick,
      });
    }

    if (showGallery) {
      options.push({
        text: "Escolher da Galeria",
        onPress: handleGalleryPick,
      });
    }

    if (showFilePicker) {
      options.push({
        text: "Selecionar Arquivo",
        onPress: handleFilePick,
      });
    }

    options.push({
      text: "Cancelar",
      style: "cancel",
      onPress: () => {},
    });

    Alert.alert(
      "Adicionar Arquivo",
      "Escolha uma opção:",
      options,
      { cancelable: true }
    );
  };

  const iconColor = disabled ? colors.mutedForeground : colors.foreground;
  const hasAnyIcon = showCamera || showGallery || showFilePicker;

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {/* Text content on the left */}
      <View style={styles.textContainer}>
        <ThemedText style={[styles.placeholder, { color: colors.foreground }]}>
          {placeholder}
        </ThemedText>
        {helperText && (
          <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
            {helperText}
          </ThemedText>
        )}
      </View>

      {/* Icon buttons on the right */}
      {hasAnyIcon && (
        <View style={styles.iconButtonsContainer}>
          {showCamera && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleCameraPick();
              }}
              disabled={disabled}
              style={[styles.iconButton, { backgroundColor: colors.muted }]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconCamera size={20} color={iconColor} />
            </TouchableOpacity>
          )}
          {showGallery && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleGalleryPick();
              }}
              disabled={disabled}
              style={[styles.iconButton, { backgroundColor: colors.muted }]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconPhoto size={20} color={iconColor} />
            </TouchableOpacity>
          )}
          {showFilePicker && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleFilePick();
              }}
              disabled={disabled}
              style={[styles.iconButton, { backgroundColor: colors.muted }]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconFile size={20} color={iconColor} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: spacing.md,
    minHeight: 64,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xxs,
  },
  placeholder: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  helperText: {
    fontSize: fontSize.xs,
  },
  iconButtonsContainer: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
