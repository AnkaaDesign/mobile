import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { IconPlus, IconX, IconFile, IconUpload, IconPhoto } from "@tabler/icons-react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemedText, Button, Card } from "@/components/ui";
import { useTheme } from "@/lib/theme";

interface FileUpload {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface FileUploadManagerProps {
  files: FileUpload[];
  onChange: (files: FileUpload[]) => void;
  label?: string;
  maxFiles?: number;
  allowImages?: boolean;
  allowDocuments?: boolean;
}

export function FileUploadManager({
  files,
  onChange,
  label = "Arquivos",
  maxFiles = 5,
  allowImages = true,
  allowDocuments = false,
}: FileUploadManagerProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão Necessária", "É necessário conceder permissão para acessar a galeria de fotos.");
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    if (files.length >= maxFiles) {
      Alert.alert("Limite Atingido", `Você pode adicionar no máximo ${maxFiles} arquivos.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop() || "image.jpg";
        const fileType = asset.type === "image" ? "image/jpeg" : "image/jpeg";

        const newFile: FileUpload = {
          uri: asset.uri,
          name: fileName,
          type: fileType,
          size: asset.fileSize,
        };

        onChange([...files, newFile]);
      }
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível selecionar a imagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (files.length >= maxFiles) {
      Alert.alert("Limite Atingido", `Você pode adicionar no máximo ${maxFiles} arquivos.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão Necessária", "É necessário conceder permissão para usar a câmera.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = `photo_${Date.now()}.jpg`;

        const newFile: FileUpload = {
          uri: asset.uri,
          name: fileName,
          type: "image/jpeg",
          size: asset.fileSize,
        };

        onChange([...files, newFile]);
      }
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível tirar a foto. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    Alert.alert("Remover Arquivo", "Deseja remover este arquivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          const updatedFiles = files.filter((_, i) => i !== index);
          onChange(updatedFiles);
        },
      },
    ]);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (file: FileUpload) => {
    return file.type.startsWith("image/");
  };

  return (
    <View style={styles.container}>
      {/* File List */}
      {files.length > 0 && (
        <View style={styles.fileList}>
          {files.map((file, index) => (
            <Card key={index} style={[styles.fileCard, { backgroundColor: colors.muted }]}>
              <View style={styles.fileContent}>
                {isImage(file) ? (
                  <Image source={{ uri: file.uri }} style={styles.filePreview} resizeMode="cover" />
                ) : (
                  <View style={[styles.filePlaceholder, { backgroundColor: colors.card }]}>
                    <IconFile size={32} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.fileInfo}>
                  <ThemedText style={styles.fileName} numberOfLines={2}>
                    {file.name}
                  </ThemedText>
                  {file.size && <ThemedText style={[styles.fileSize, { color: colors.mutedForeground }]}>{formatFileSize(file.size)}</ThemedText>}
                </View>
                <TouchableOpacity onPress={() => handleRemoveFile(index)} style={styles.removeButton}>
                  <IconX size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Add File Buttons */}
      {files.length < maxFiles && (
        <View style={styles.addButtons}>
          {allowImages && (
            <>
              <Button variant="outline" onPress={handlePickImage} disabled={isLoading} style={styles.addButton}>
                <IconPhoto size={18} color={colors.foreground} />
                <ThemedText>{isLoading ? "Carregando..." : "Galeria"}</ThemedText>
              </Button>
              <Button variant="outline" onPress={handleTakePhoto} disabled={isLoading} style={styles.addButton}>
                <IconUpload size={18} color={colors.foreground} />
                <ThemedText>{isLoading ? "Carregando..." : "Câmera"}</ThemedText>
              </Button>
            </>
          )}
        </View>
      )}

      {files.length === 0 && !isLoading && (
        <View style={[styles.emptyState, { backgroundColor: colors.muted }]}>
          <IconFile size={32} color={colors.mutedForeground} />
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhum arquivo adicionado</ThemedText>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={{ color: colors.mutedForeground }}>Processando...</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  fileList: {
    gap: 8,
  },
  fileCard: {
    padding: 12,
  },
  fileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  filePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
  },
  addButtons: {
    flexDirection: "row",
    gap: 8,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyState: {
    padding: 32,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
});
