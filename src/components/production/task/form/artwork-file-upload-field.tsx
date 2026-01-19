import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  IconCamera,
  IconPhoto,
  IconFile,
  IconFileText,
  IconUpload,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconClock,
} from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import { spacing, fontSize, borderRadius, fontWeight } from "@/constants/design-system";
import { ARTWORK_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";

// Artwork status labels
const ARTWORK_STATUS_LABELS: Record<string, string> = {
  [ARTWORK_STATUS.DRAFT]: "Rascunho",
  [ARTWORK_STATUS.APPROVED]: "Aprovado",
  [ARTWORK_STATUS.REPROVED]: "Reprovado",
};

// File item interface for artworks
export interface ArtworkFileItem {
  id: string;
  uri: string;
  name: string;
  type: string;
  size?: number;
  mimeType?: string;
  uploaded?: boolean;
  thumbnailUrl?: string;
  status?: "DRAFT" | "APPROVED" | "REPROVED";
  uploadedFileId?: string;
}

export interface ArtworkFileUploadFieldProps {
  onFilesChange: (files: ArtworkFileItem[]) => void;
  onStatusChange: (fileId: string, status: "DRAFT" | "APPROVED" | "REPROVED") => void;
  maxFiles?: number;
  existingFiles?: ArtworkFileItem[];
  disabled?: boolean;
  showPreview?: boolean;
  placeholder?: string;
  label?: string;
}

export function ArtworkFileUploadField({
  onFilesChange,
  onStatusChange,
  maxFiles = 5,
  existingFiles = [],
  disabled = false,
  showPreview = true,
  placeholder = "Adicionar artes",
  label,
}: ArtworkFileUploadFieldProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [files, setFiles] = useState<ArtworkFileItem[]>(existingFiles);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with external file changes
  useEffect(() => {
    setFiles(existingFiles);
  }, [existingFiles]);

  // Check if user can approve/reprove artworks
  const canApprove =
    user?.sector?.privileges === SECTOR_PRIVILEGES.COMMERCIAL ||
    user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN;

  const canAddMore = files.length < maxFiles;

  // File type detection
  const isImage = (type: string) => type?.startsWith("image/");
  const isPDF = (type: string) => type === "application/pdf" || type?.includes("pdf");

  // Get appropriate icon for file type
  const getFileIcon = (type: string) => {
    if (isImage(type)) return IconPhoto;
    if (isPDF(type)) return IconFileText;
    return IconFile;
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle camera capture
  const handleCamera = async () => {
    if (disabled || !canAddMore) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissao Necessaria", "Precisamos de permissao para usar a camera.");
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const newFile: ArtworkFileItem = {
          id: generateId(),
          uri: asset.uri,
          name: asset.fileName || `artwork_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
          size: asset.fileSize,
          mimeType: asset.mimeType || "image/jpeg",
          status: "DRAFT",
          uploaded: false,
        };
        const updatedFiles = [...files, newFile];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
      }
    } catch (err) {
      console.error("Error taking photo:", err);
      Alert.alert("Erro", "Nao foi possivel tirar a foto.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle gallery selection
  const handleGallery = async () => {
    if (disabled || !canAddMore) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissao Necessaria", "Precisamos de permissao para acessar suas fotos.");
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const remainingSlots = maxFiles - files.length;
        const assetsToAdd = result.assets.slice(0, remainingSlots);

        const newFiles: ArtworkFileItem[] = assetsToAdd.map((asset) => ({
          id: generateId(),
          uri: asset.uri,
          name: asset.fileName || `artwork_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
          size: asset.fileSize,
          mimeType: asset.mimeType || "image/jpeg",
          status: "DRAFT" as const,
          uploaded: false,
        }));

        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);

        if (result.assets.length > remainingSlots) {
          Alert.alert(
            "Limite de arquivos",
            `Apenas ${remainingSlots} arquivo(s) foram adicionados. Maximo de ${maxFiles} arquivos.`
          );
        }
      }
    } catch (err) {
      console.error("Error picking from gallery:", err);
      Alert.alert("Erro", "Nao foi possivel selecionar a imagem.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document picker
  const handleFilePicker = async () => {
    if (disabled || !canAddMore) return;

    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf", "application/postscript"],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const remainingSlots = maxFiles - files.length;
        const assetsToAdd = result.assets.slice(0, remainingSlots);

        const newFiles: ArtworkFileItem[] = assetsToAdd.map((asset) => ({
          id: generateId(),
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
          size: asset.size,
          mimeType: asset.mimeType || "application/octet-stream",
          status: "DRAFT" as const,
          uploaded: false,
        }));

        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);

        if (result.assets.length > remainingSlots) {
          Alert.alert(
            "Limite de arquivos",
            `Apenas ${remainingSlots} arquivo(s) foram adicionados. Maximo de ${maxFiles} arquivos.`
          );
        }
      }
    } catch (err) {
      console.error("Error picking file:", err);
      Alert.alert("Erro", "Nao foi possivel selecionar o arquivo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file removal
  const handleRemove = useCallback((fileId: string) => {
    if (disabled) return;

    Alert.alert("Remover arquivo", "Deseja remover esta arte?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          setFiles((prevFiles) => {
            const updatedFiles = prevFiles.filter((f) => f.id !== fileId);
            onFilesChange(updatedFiles);
            return updatedFiles;
          });
        },
      },
    ]);
  }, [disabled, onFilesChange]);

  // Handle status change
  const handleStatusChange = useCallback((fileId: string, newStatus: "DRAFT" | "APPROVED" | "REPROVED") => {
    if (disabled || !canApprove) return;

    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.map((f) =>
        f.id === fileId ? { ...f, status: newStatus } : f
      );
      return updatedFiles;
    });

    // Use uploadedFileId for existing files, or id for new uploads
    const file = files.find((f) => f.id === fileId);
    const idToUse = file?.uploadedFileId || fileId;
    onStatusChange(idToUse, newStatus);
  }, [disabled, canApprove, files, onStatusChange]);

  // Show options alert
  const showOptions = () => {
    if (disabled || !canAddMore) return;

    Alert.alert(
      "Adicionar Arte",
      "Escolha uma opcao:",
      [
        { text: "Tirar Foto", onPress: handleCamera },
        { text: "Escolher da Galeria", onPress: handleGallery },
        { text: "Selecionar Arquivo", onPress: handleFilePicker },
        { text: "Cancelar", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case ARTWORK_STATUS.APPROVED:
        return { Icon: IconCheck, color: colors.success || "#22c55e" };
      case ARTWORK_STATUS.REPROVED:
        return { Icon: IconAlertCircle, color: colors.destructive };
      default:
        return { Icon: IconClock, color: colors.warning || "#f59e0b" };
    }
  };

  // Show status options
  const showStatusOptions = (fileId: string, currentStatus: string) => {
    if (disabled || !canApprove) return;

    Alert.alert(
      "Status da Arte",
      "Selecione o status:",
      [
        {
          text: ARTWORK_STATUS_LABELS[ARTWORK_STATUS.DRAFT],
          onPress: () => handleStatusChange(fileId, "DRAFT"),
        },
        {
          text: ARTWORK_STATUS_LABELS[ARTWORK_STATUS.APPROVED],
          onPress: () => handleStatusChange(fileId, "APPROVED"),
        },
        {
          text: ARTWORK_STATUS_LABELS[ARTWORK_STATUS.REPROVED],
          onPress: () => handleStatusChange(fileId, "REPROVED"),
        },
        { text: "Cancelar", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const iconColor = disabled ? colors.mutedForeground : colors.foreground;

  return (
    <View style={styles.container}>
      {/* Upload Area */}
      {canAddMore && (
        <TouchableOpacity
          onPress={showOptions}
          disabled={disabled || isLoading}
          activeOpacity={0.7}
          style={[
            styles.pickerArea,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <View style={styles.pickerContent}>
            <View style={styles.pickerTextContainer}>
              <IconUpload size={24} color={colors.mutedForeground} />
              <View style={styles.pickerTextContent}>
                <ThemedText style={[styles.placeholder, { color: colors.foreground }]}>
                  {placeholder}
                </ThemedText>
                <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                  Imagens, PDFs ou arquivos vetoriais
                </ThemedText>
              </View>
            </View>

            {!isLoading && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleCamera();
                  }}
                  disabled={disabled}
                  style={[styles.iconButton, { backgroundColor: colors.background }]}
                  activeOpacity={0.7}
                >
                  <IconCamera size={20} color={iconColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleGallery();
                  }}
                  disabled={disabled}
                  style={[styles.iconButton, { backgroundColor: colors.background }]}
                  activeOpacity={0.7}
                >
                  <IconPhoto size={20} color={iconColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleFilePicker();
                  }}
                  disabled={disabled}
                  style={[styles.iconButton, { backgroundColor: colors.background }]}
                  activeOpacity={0.7}
                >
                  <IconFile size={20} color={iconColor} />
                </TouchableOpacity>
              </View>
            )}

            {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        </TouchableOpacity>
      )}

      {/* File count */}
      <ThemedText style={[styles.fileCount, { color: colors.mutedForeground }]}>
        {files.length}/{maxFiles} artes
      </ThemedText>

      {/* File List */}
      {files.length > 0 && (
        <View style={styles.fileList}>
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type || file.mimeType || "");
            const fileIsImage = isImage(file.type || file.mimeType || "");
            const status = file.status || "DRAFT";
            const { Icon: StatusIcon, color: statusColor } = getStatusIcon(status);

            return (
              <View
                key={file.id}
                style={[
                  styles.fileItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {/* Thumbnail or Icon */}
                <View style={[styles.thumbnailContainer, { backgroundColor: colors.muted }]}>
                  {fileIsImage && showPreview ? (
                    <Image
                      source={{ uri: file.uploaded && file.thumbnailUrl ? file.thumbnailUrl : file.uri }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                  ) : (
                    <FileIcon size={24} color={colors.mutedForeground} />
                  )}
                </View>

                {/* File Info */}
                <View style={styles.fileInfo}>
                  <ThemedText
                    style={[styles.fileName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {file.name}
                  </ThemedText>
                  <ThemedText style={[styles.fileSize, { color: colors.mutedForeground }]}>
                    {formatFileSize(file.size)}
                  </ThemedText>
                </View>

                {/* Status Button */}
                <TouchableOpacity
                  onPress={() => showStatusOptions(file.id, status)}
                  disabled={disabled || !canApprove}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: `${statusColor}20`,
                      borderColor: statusColor,
                      opacity: canApprove ? 1 : 0.6,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <StatusIcon size={14} color={statusColor} />
                  <ThemedText style={[styles.statusText, { color: statusColor }]}>
                    {ARTWORK_STATUS_LABELS[status]}
                  </ThemedText>
                </TouchableOpacity>

                {/* Remove Button */}
                {!disabled && (
                  <TouchableOpacity
                    onPress={() => handleRemove(file.id)}
                    style={[styles.removeButton, { backgroundColor: colors.destructive }]}
                    activeOpacity={0.7}
                  >
                    <IconX size={14} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Permission hint */}
      {!canApprove && files.length > 0 && (
        <ThemedText style={[styles.permissionHint, { color: colors.mutedForeground }]}>
          Apenas usuarios Comerciais ou Admin podem aprovar/reprovar artes
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  pickerArea: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    minHeight: 72,
  },
  pickerTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  pickerTextContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  placeholder: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
  helperText: {
    fontSize: fontSize.xs,
  },
  actionButtons: {
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
  fileCount: {
    fontSize: fontSize.xs,
    textAlign: "right",
  },
  fileList: {
    gap: spacing.sm,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  thumbnailContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
  fileSize: {
    fontSize: fontSize.xs,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionHint: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
    textAlign: "center",
  },
});
