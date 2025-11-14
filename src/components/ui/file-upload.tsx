import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";

export interface FileItem {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface FileUploadProps {
  value: FileItem[];
  onChange: (files: FileItem[]) => void;
  maxFiles?: number;
  accept?: "image" | "document" | "all";
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 10,
  accept = "all",
  disabled = false,
  error,
  label,
  required = false,
}: FileUploadProps) {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permissão necessária", "É necessário permitir o acesso à galeria");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newFiles: FileItem[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || "image/jpeg",
          size: asset.fileSize,
        }));

        if (value.length + newFiles.length > maxFiles) {
          Alert.alert("Limite excedido", `Você pode adicionar no máximo ${maxFiles} arquivos`);
          return;
        }

        onChange([...value, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets) {
        const newFiles: FileItem[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
          size: asset.size,
        }));

        if (value.length + newFiles.length > maxFiles) {
          Alert.alert("Limite excedido", `Você pode adicionar no máximo ${maxFiles} arquivos`);
          return;
        }

        onChange([...value, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Erro", "Não foi possível selecionar o arquivo");
    }
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const isImage = (type: string) => {
    return type.startsWith("image/");
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label} {required && <Text style={{ color: colors.destructive }}>*</Text>}
        </Text>
      )}

      <View style={styles.uploadArea}>
        {accept !== "document" && (
          <Button
            variant="outline"
            onPress={pickImage}
            disabled={disabled || value.length >= maxFiles}
            style={{ flex: 1 }}
          >
            <Text>📷 Imagem</Text>
          </Button>
        )}

        {accept !== "image" && (
          <Button
            variant="outline"
            onPress={pickDocument}
            disabled={disabled || value.length >= maxFiles}
            style={{ flex: 1 }}
          >
            <Text>📎 Arquivo</Text>
          </Button>
        )}
      </View>

      {value.length > 0 && (
        <View style={styles.filesContainer}>
          <Text style={[styles.filesHeader, { color: colors.foreground }]}>
            Arquivos selecionados ({value.length}/{maxFiles})
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filesList}>
            {value.map((file, index) => (
              <View
                key={index}
                style={[
                  styles.fileItem,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                {isImage(file.type) ? (
                  <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.filePlaceholder, { backgroundColor: colors.accent }]}>
                    <Text style={{ fontSize: 24 }}>📄</Text>
                  </View>
                )}

                <View style={styles.fileInfo}>
                  <Text
                    style={[styles.fileName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  {file.size && (
                    <Text style={[styles.fileSize, { color: colors.mutedForeground }]}>
                      {formatFileSize(file.size)}
                    </Text>
                  )}
                </View>

                {!disabled && (
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: colors.destructive }]}
                    onPress={() => removeFile(index)}
                  >
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      )}

      {!error && value.length < maxFiles && (
        <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
          Máximo de {maxFiles} arquivos
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  uploadArea: {
    flexDirection: "row",
    gap: spacing.md,
  },
  filesContainer: {
    marginTop: spacing.md,
  },
  filesHeader: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  filesList: {
    flexDirection: "row",
  },
  fileItem: {
    width: 120,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 80,
    resizeMode: "cover",
  },
  filePlaceholder: {
    width: "100%",
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: {
    padding: spacing.sm,
  },
  fileName: {
    fontSize: fontSize.xs,
    fontWeight: "500",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: fontSize.xs,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
